// Chạy: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDb } from '../server/db.js';
import { fakeTurso } from './fake-turso.js';
import { createApp, cleanup } from '../server/index.js';
import { buildRounds } from '../server/rounds.js';
import { dayKey } from '../server/game.js';
import { LESSONS, TOPICS } from '../server/content/index.js';
import { gradeRound, computeRewards, levelInfo, currentEnergy, ENERGY_MS, normAnswer } from '../shared/logic.js';
import { auditContent } from '../scripts/audit-content.mjs';
import { mcToInput } from '../server/rounds.js';

/** Đáp án đúng cho một vòng (để mô phỏng bé chơi giỏi). */
function perfect(r) {
  switch (r.kind) {
    case 'mc': case 'tf': case 'word': case 'input': case 'multi': return r.answer;
    case 'pairs': return 0;
    case 'order': return r.items.map((_, i) => i);
    case 'clock': return [r.h, r.m];
    case 'classify': return { hits: r.items.filter((i) => i.ok).length, wrong: 0 };
    case 'trace': return { cover: 0.95, stray: 0.05 };
  }
}

test('mọi màn đều tạo được vòng chơi hợp lệ (nhiều seed)', () => {
  let count = 0;
  for (const l of LESSONS.filter((x) => x.kind !== 'chest')) {
    for (let seed = 1; seed <= (l.tier != null ? 4 : 25); seed++) {
      const { game, rounds } = buildRounds(l, seed * 7919);
      assert.ok(rounds.length >= 1, `${l.id} (${game}) không có vòng nào`);
      for (const r of rounds) {
        count++;
        if (r.kind === 'mc') {
          assert.ok(r.options.length >= 2, `${l.id}: ít lựa chọn`);
          assert.ok(r.answer >= 0 && r.answer < r.options.length, `${l.id}: đáp án ngoài phạm vi`);
          const texts = r.options.map((o) => JSON.stringify(o));
          assert.equal(new Set(texts).size, texts.length, `${l.id}: lựa chọn trùng ${texts}`);
          for (const o of r.options) assert.ok(o.vi && o.en, `${l.id}: thiếu bản dịch lựa chọn`);
        }
        if (r.kind === 'tf') assert.equal(typeof r.answer, 'boolean');
        if (r.kind === 'pairs') { assert.ok(r.pairs.length >= 3, `${l.id}: ít cặp`); const L = r.pairs.map((p) => JSON.stringify(p[0])); assert.equal(new Set(L).size, L.length, `${l.id}: cặp trùng`); const R = r.pairs.map((p) => JSON.stringify(p[1])); assert.equal(new Set(R).size, R.length, `${l.id}: cặp phải trùng`); }
        if (r.kind === 'order') assert.ok(r.items.length >= 3);
        if (r.kind === 'classify') assert.ok(r.items.some((i) => i.ok) && r.items.some((i) => !i.ok), `${l.id}: classify thiếu loại`);
        assert.equal(gradeRound(r, perfect(r)), 1, `${l.id}: đáp án đúng không được chấm 1 điểm`);
        assert.ok(r.prompt?.vi && r.prompt?.en, `${l.id}: thiếu đề bài`);
      }
    }
  }
  assert.ok(count > 10000);
});

test('đáp án Toán chính xác (kiểm tra lại bằng tính toán)', () => {
  for (const l of LESSONS.filter((x) => x.subject === 'math' && ['quiz', 'math-race', 'balloon-pop'].includes(x.game))) {
    for (let seed = 1; seed <= 40; seed++) {
      for (const r of buildRounds(l, seed).rounds) {
        const m = /^([\d()−\-+ ×:]+) = \?$/.exec(r.prompt.vi);
        if (!m) continue;
        const expr = m[1].replace(/−/g, '-').replace(/×/g, '*').replace(/:/g, '/');
        const val = Function(`return (${expr})`)();
        assert.equal(Number(r.options[r.answer].vi.replace('−', '-')), val, `${l.id}: ${r.prompt.vi}`);
      }
    }
  }
});

/** Đổi biểu thức kiểu "2x² − 3x + 1" sang JS để tính thử. */
function jsExpr(s) {
  return s.replace(/−/g, '-').replace(/²/g, '**2').replace(/(\d)\s*x/g, '$1*x').replace(/(\d)\(/g, '$1*(').replace(/\)\(/g, ')*(').replace(/\)x/g, ')*x').replace(/x\(/g, 'x*(');
}
test('dạng Toán mới: đáp án kiểm tra lại độc lập', () => {
  let checked = 0;
  const optsOf = (r) => r.options.map((o) => o.vi);
  for (const l of LESSONS.filter((x) => x.subject === 'math' && /^m\dc|^m\dd/.test(x.topicId) && x.game !== 'boss')) {
    for (let seed = 1; seed <= 60; seed++) {
      for (const r of buildRounds(l, seed * 104729).rounds) {
        if (r.kind !== 'mc') continue;
        const p = r.prompt.vi; const ans = r.options[r.answer].vi; const num = parseFloat(ans.replace(',', '.'));
        let m;
        if ((m = /^Tam giác ABC có góc A = (\d+)°, góc B = (\d+)°\. Góc C bằng\?$/.exec(p))) { assert.equal(num, 180 - +m[1] - +m[2], p); checked++; }
        else if ((m = /góc A = (\d+)°, góc B = (\d+)°\. Góc ngoài/.exec(p))) { assert.equal(num, +m[1] + +m[2], p); checked++; }
        else if ((m = /cân tại A có góc A = (\d+)°/.exec(p))) { assert.equal(num, (180 - +m[1]) / 2, p); checked++; }
        else if ((m = /AB = (\d+) cm, AC = (\d+) cm\. Cạnh huyền/.exec(p))) { assert.equal(num ** 2, (+m[1]) ** 2 + (+m[2]) ** 2, p); checked++; }
        else if ((m = /BC = (\d+) cm, AB = (\d+) cm\. Cạnh AC/.exec(p))) { assert.equal(num ** 2 + (+m[2]) ** 2, (+m[1]) ** 2, p); checked++; }
        else if ((m = /Tổng hai số là (\d+), hiệu hai số là (\d+)\. Tìm số (lớn|bé)/.exec(p))) { const S = +m[1], D = +m[2]; assert.equal(num, m[3] === 'lớn' ? (S + D) / 2 : (S - D) / 2, p); checked++; }
        else if ((m = /^Phân tích (.+) thành nhân tử:$/.exec(p))) {
          const f = Function('x', `return ${jsExpr(m[1])}`), g = Function('x', `return ${jsExpr(ans)}`);
          for (const x of [-3, 0, 1, 2, 5]) assert.ok(g(x) === f(x), `${p} → ${ans} (x = ${x})`);
          for (const o of optsOf(r)) if (o !== ans) { const h = Function('x', `return ${jsExpr(o)}`); assert.ok([-3, 0, 1, 2, 5].some((x) => h(x) !== f(x)), `${p}: lựa chọn sai "${o}" cũng đúng`); }
          checked++;
        }
        else if ((m = /^Giải phương trình (.+) = 0$/.exec(p))) {
          const f = Function('x', `return ${jsExpr(m[1])}`); const roots = ans.match(/-?−?\d+/g).map((t) => Number(t.replace('−', '-')));
          for (const x of roots) assert.ok(f(x) === 0, `${p}: x = ${x}`);
          checked++;
        }
        else if ((m = /^Hình chữ nhật dài (\d+) cm, rộng (\d+) cm\. Diện tích là\?$/.exec(p))) { assert.equal(num, +m[1] * +m[2], p); checked++; }
        else if ((m = /^Hình vuông cạnh (\d+) cm\. Diện tích là\?$/.exec(p))) { assert.equal(num, (+m[1]) ** 2, p); checked++; }
        else if ((m = /đáy (\d+) cm, chiều cao (\d+) cm\. Diện tích/.exec(p))) { assert.equal(num, (+m[1] * +m[2]) / 2, p); checked++; }
        else if ((m = /dài (\d+) cm, rộng (\d+) cm, cao (\d+) cm\. Thể tích/.exec(p))) { assert.equal(num, +m[1] * +m[2] * +m[3], p); checked++; }
        else if ((m = /vận tốc (\d+) km\/giờ trong (\d+) giờ/.exec(p))) { assert.equal(num, +m[1] * +m[2], p); checked++; }
        else if ((m = /^Trung bình cộng của (.+) là\?$/.exec(p))) { const v = m[1].split('; ').map(Number); assert.equal(num, v.reduce((a, b) => a + b, 0) / v.length, p); checked++; }
        else if ((m = /^Giá trị của biểu thức (.+) tại x = (-?\d+) là\?$/.exec(p))) { assert.equal(num, Function('x', `return ${jsExpr(m[1])}`)(+m[2]), p); checked++; }
        else if ((m = /^([\d()−+ ×:]+) = \?$/.exec(p))) { assert.equal(num, Function(`return (${m[1].replace(/−/g, '-').replace(/×/g, '*').replace(/:/g, '/')})`)(), p); checked++; }
      }
    }
  }
  assert.ok(checked > 2000, `chỉ kiểm được ${checked} câu`);
});

test('rà soát bộ đề tự động: không có câu hỏi lỗi', () => {
  const errs = auditContent({ seeds: 25 });
  assert.deepEqual(errs, [], errs.slice(0, 20).join('\n'));
});

test('dạng tự điền đáp án: chấm linh hoạt nhưng chặt chẽ', () => {
  const R = (answer, accept = []) => ({ kind: 'input', answer, accept });
  assert.equal(gradeRound(R('12,5'), '12.5'), 1);
  assert.equal(gradeRound(R('12,5'), ' 12,50 '), 1);
  assert.equal(gradeRound(R('-3'), '−3'), 1);
  assert.equal(gradeRound(R('21587'), '21.587'), 1, 'dấu chấm ngăn hàng nghìn');
  assert.equal(gradeRound(R('went'), 'Went.'), 1);
  assert.equal(gradeRound(R('quyển sách này'), 'Quyển  sách này'), 1);
  assert.equal(gradeRound(R('mèo'), 'meo'), 0.6, 'quên dấu được 0,6');
  assert.equal(gradeRound(R('mèo'), 'mẹo'), 0.6);
  assert.equal(gradeRound(R('can\'t', ['cannot']), 'cannot'), 1);
  assert.equal(gradeRound(R('12'), '13'), 0);
  assert.equal(gradeRound(R('12'), ''), 0);
  assert.equal(gradeRound(R('12'), { x: 1 }), 0);
  assert.equal(normAnswer('007'), '7');
  // đổi trắc nghiệm Toán sang tự điền: tách đơn vị, bỏ câu cần nhìn lựa chọn
  const L = (vi) => ({ vi, en: vi });
  assert.deepEqual(mcToInput({ kind: 'mc', prompt: L('Chu vi là?'), options: ['28 cm', '30 cm'] }).unit, { vi: 'cm', en: 'cm' });
  assert.equal(mcToInput({ kind: 'mc', prompt: L('Chu vi là?'), options: ['28 cm', '30 cm'] }).answer, '28');
  assert.equal(mcToInput({ kind: 'mc', prompt: L('Số nào chia hết cho 5?'), options: ['60', '61'] }), null);
  assert.equal(mcToInput({ kind: 'mc', prompt: L('Hình nào là hình tròn?'), options: ['●', '■'] }), null);
  assert.equal(mcToInput({ kind: 'mc', prompt: L('x² − 4 = ?'), options: ['(x − 2)(x + 2)', 'x'] }), null);
});

test('dạng chọn nhiều đáp án: phải chọn đủ và không thừa', () => {
  const r = { kind: 'multi', options: [1, 2, 3, 4, 5], answer: [0, 3] };
  assert.equal(gradeRound(r, [3, 0]), 1);
  assert.ok(gradeRound(r, [0]) < 0.5, 'thiếu một đáp án là sai');
  assert.ok(gradeRound(r, [0, 3, 4]) < 0.5, 'chọn thừa là sai');
  assert.equal(gradeRound(r, [1, 2]), 0);
  assert.equal(gradeRound(r, [0, 0, 3, 3]), 1, 'chọn trùng không ăn gian được');
  assert.equal(gradeRound(r, [0, 3, 99]), 1, 'chỉ số ngoài phạm vi bị bỏ qua');
  assert.equal(gradeRound(r, 'x'), 0);
  // mọi màn chọn nhiều / tự điền / đọc hiểu dựng đủ vòng chơi
  for (const l of LESSONS.filter((x) => ['multi-pick', 'type-answer', 'reading'].includes(x.game))) {
    for (let seed = 1; seed <= 10; seed++) {
      const { game, rounds } = buildRounds(l, seed);
      assert.equal(game, l.game, l.id);
      assert.ok(rounds.length >= (game === 'reading' ? 3 : 4), `${l.id}: chỉ có ${rounds.length} vòng`);
      if (game === 'reading') assert.ok(rounds.every((x) => x.passage?.vi && x.passage?.en), `${l.id}: thiếu đoạn văn`);
      if (game === 'multi-pick') assert.ok(rounds.every((x) => x.answer.length >= 1 && x.answer.length < x.options.length), `${l.id}: chọn nhiều sai cấu trúc`);
    }
  }
});

test('chặng luyện tập: mỗi môn mỗi lớp trên 100 màn, bậc khó tăng dần, sinh đề ổn định theo seed', () => {
  for (const subject of ['math', 'vietnamese', 'english', 'science']) {
    for (let grade = 1; grade <= 9; grade++) {
      const ls = LESSONS.filter((l) => l.subject === subject && l.grade === grade && l.kind !== 'chest');
      assert.ok(ls.length > 100, `${subject} lớp ${grade}: chỉ có ${ls.length} màn`);
      const tiers = ls.filter((l) => l.tier != null).map((l) => l.tier);
      assert.ok(tiers.includes(1) && tiers.includes(4), `${subject} lớp ${grade}: thiếu bậc khó`);
    }
  }
  const quiz = LESSONS.filter((l) => l.game === 'quiz' && l.tier != null);
  const easy = quiz.find((l) => l.tier === 1), hard = quiz.find((l) => l.tier === 4 && l.subject === easy.subject);
  assert.ok(buildRounds(hard, 3).rounds.length > buildRounds(easy, 3).rounds.length, 'bậc 4 phải nhiều vòng hơn bậc 1');
  assert.ok(buildRounds(easy, 3).rounds.every((r) => r.options.length <= 3), 'bậc 1: 3 lựa chọn');
  assert.deepEqual(buildRounds(hard, 99), buildRounds(hard, 99), 'cùng seed phải ra cùng đề');
  assert.notDeepEqual(buildRounds(hard, 99).rounds.map((r) => r.prompt), buildRounds(hard, 100).rounds.map((r) => r.prompt), 'khác seed phải ra đề khác');
  // mã màn cũ không đổi: các chủ đề cũ vẫn đứng trước chặng luyện tập trên bản đồ
  for (const subject of ['math', 'vietnamese', 'english', 'science']) {
    const ls = LESSONS.filter((l) => l.subject === subject && l.grade === 3);
    const firstP = ls.findIndex((l) => l.tier != null);
    assert.ok(ls.slice(firstP).every((l) => l.tier != null || l.kind === 'chest'), `${subject}: chặng luyện tập phải nằm cuối bản đồ`);
  }
});

test('logic điểm, cấp độ, năng lượng', () => {
  const r = computeRewards({ qualities: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], maxCombo: 10, baseCoins: 15, baseXp: 60, prevStars: 0 });
  assert.equal(r.stars, 3); assert.equal(r.coins, 15 + 3 + 10); assert.equal(r.xp, 60);
  assert.equal(computeRewards({ qualities: [0, 0, 1], maxCombo: 1, baseCoins: 15, baseXp: 60, prevStars: 0 }).stars, 0);
  assert.equal(levelInfo(0).level, 1); assert.equal(levelInfo(50).level, 2);
  const e = currentEnergy(3, 0, ENERGY_MS * 2 + 5); assert.equal(e.value, 5);
  assert.equal(TOPICS.filter((t) => !t.practice).length, 99);
});

async function apiFlow(db) {
  const server = createServer(createApp(db));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  const call = async (method, path, body) => {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined });
    const sc = res.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    return { status: res.status, data: await res.json() };
  };
  try {
    assert.equal((await call('GET', '/api/children')).status, 401);
    // file tĩnh thiếu (ví dụ nhạc nền chưa thêm) phải trả 404 chứ không trả trang chủ, để app tự dùng nhạc thay thế
    assert.equal((await fetch(base + '/music/khong-co.mp3')).status, 404);
    assert.equal((await call('POST', '/api/auth/register', { name: 'Mẹ Lan', email: 'me@example.com', password: 'abc123' })).data.error, 'CONSENT_REQUIRED');
    const reg = await call('POST', '/api/auth/register', { name: 'Mẹ Lan', email: 'me@example.com', password: 'abc123', consent: true });
    assert.match(reg.data.recoveryCode, /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/, 'đăng ký nhận mã khôi phục');
    assert.equal(reg.status, 201);
    assert.equal((await call('POST', '/api/auth/register', { name: 'X', email: 'me@example.com', password: 'abc123', consent: true })).status, 409);
    assert.equal((await call('POST', '/api/children', { nickname: 'đồ ngu', grade: 1 })).status, 400);
    const ch = await call('POST', '/api/children', { nickname: 'Bé Na', grade: 2, look: { hair: 'twin', ears: 'bunny' } });
    assert.equal(ch.status, 201);
    assert.equal(ch.data.child.look.ears, 'cat', 'không được mặc đồ chưa mua');
    const id = ch.data.child.id;
    const st = await call('GET', `/api/children/${id}/state`);
    assert.equal(st.data.coins, 50); assert.equal(st.data.energy.value, 10); assert.equal(st.data.quests.length, 3);
    await call('PATCH', `/api/children/${id}`, { settings: { energy: false } });
    const map = await call('GET', `/api/children/${id}/map?subject=math&grade=2`);
    assert.ok(map.data.nodes.length >= 5);
    assert.equal((await call('POST', `/api/children/${id}/sessions`, { lessonId: map.data.nodes[1].id })).status, 403, 'màn 2 phải bị khoá');
    // chơi hết màn của Toán lớp 2, trả lời đúng hết
    let coins = 50;
    for (const node of map.data.nodes) {
      if (node.kind === 'chest') { const c = await call('POST', `/api/children/${id}/chests/${node.id}`); assert.equal(c.status, 200); coins += c.data.coins; continue; }
      const s = await call('POST', `/api/children/${id}/sessions`, { lessonId: node.id });
      assert.equal(s.status, 201, JSON.stringify(s.data));
      const fin = await call('POST', `/api/children/${id}/sessions/${s.data.sessionId}/finish`, { answers: s.data.rounds.map((r) => ({ round: r.id, given: perfect(r) })), durationSec: 60 });
      assert.equal(fin.status, 200);
      assert.equal(fin.data.stars, 3, `${node.id} phải đạt 3 sao`);
      coins += fin.data.coins;
      assert.equal(fin.data.state.coins, coins);
      assert.equal((await call('POST', `/api/children/${id}/sessions/${s.data.sessionId}/finish`, { answers: [] })).status, 409);
    }
    const st2 = await call('GET', `/api/children/${id}/state`);
    assert.ok(st2.data.badges.includes('first-step'));
    assert.ok(st2.data.badges.includes('three-stars'));
    assert.equal(st2.data.streak, 1);
    assert.equal(st2.data.energy.enabled, false);
    // chơi kém thì không được sao
    const s = await call('POST', `/api/children/${id}/sessions`, { lessonId: map.data.nodes[0].id });
    const bad = await call('POST', `/api/children/${id}/sessions/${s.data.sessionId}/finish`, { answers: [] });
    assert.equal(bad.data.stars, 0); assert.equal(bad.data.coins, 1, 'chơi lại màn đã 3 sao chỉ được ít xu');
    // cửa hàng
    assert.equal((await call('POST', `/api/children/${id}/shop/acc:crown`)).status, coins < 200 ? 409 : 200);
    const buy = await call('POST', `/api/children/${id}/shop/ears:bunny`);
    assert.equal(buy.status, 200);
    const look = await call('POST', `/api/children/${id}/look`, { look: { ears: 'bunny' } });
    assert.equal(look.data.child.look.ears, 'bunny');
    // rương hằng ngày
    assert.equal((await call('POST', `/api/children/${id}/daily-chest`)).status, 404, 'API rương cũ đã gỡ');
    // điểm danh: lần đầu là ngày 1, bấm lại trong ngày bị từ chối
    const st3 = await call('GET', `/api/children/${id}/state`);
    assert.deepEqual([st3.data.checkin.today, st3.data.checkin.nextSeq, st3.data.checkin.rewards.length], [false, 1, 7]);
    const ci = await call('POST', `/api/children/${id}/checkin`);
    assert.equal(ci.status, 200); assert.equal(ci.data.day, 1); assert.equal(ci.data.coins, 10);
    assert.equal(ci.data.state.coins, st3.data.coins + 10);
    assert.equal(ci.data.state.checkin.today, true); assert.equal(ci.data.state.checkin.claimed, 1);
    const twice = await Promise.all([call('POST', `/api/children/${id}/checkin`), call('POST', `/api/children/${id}/checkin`)]);
    assert.deepEqual(twice.map((x) => x.status), [409, 409]);
    // Khu vui chơi: chọn bài ngẫu nhiên đúng lớp, luôn mở, không tính vào bản đồ
    const menu = await call('GET', `/api/children/${id}/arcade`);
    assert.ok(menu.data.games.find((g) => g.game === 'fruit-slice').subjects.includes('math'));
    for (const game of ['fruit-slice', 'candy-match', 'slingshot', 'draw-trace']) {
      const pick = await call('POST', `/api/children/${id}/arcade`, { game, subject: 'math' });
      assert.equal(pick.status, 200, game); assert.ok(pick.data.lessonId.startsWith(`arc:${game}:`));
      const s0 = await call('POST', `/api/children/${id}/sessions`, { lessonId: pick.data.lessonId });
      assert.equal(s0.status, 201, JSON.stringify(s0.data)); assert.equal(s0.data.game, game);
      if (game === 'draw-trace') assert.ok(s0.data.rounds.every((r) => r.kind === 'trace' && r.shape));
      const f0 = await call('POST', `/api/children/${id}/sessions/${s0.data.sessionId}/finish`, { answers: s0.data.rounds.map((r) => ({ round: r.id, given: perfect(r) })), durationSec: 30 });
      assert.equal(f0.data.stars, 3); assert.equal(f0.data.next, null);
    }
    assert.equal((await call('POST', `/api/children/${id}/arcade`, { game: 'khong-co' })).status, 400);
    // tô nét lệch nhiều thì không được tính đúng
    const tr = await call('POST', `/api/children/${id}/sessions`, { lessonId: (await call('POST', `/api/children/${id}/arcade`, { game: 'draw-trace' })).data.lessonId });
    const trBad = await call('POST', `/api/children/${id}/sessions/${tr.data.sessionId}/finish`, { answers: tr.data.rounds.map((r) => ({ round: r.id, given: { cover: 0.9, stray: 0.8 } })) });
    assert.equal(trBad.data.stars, 0);
    // báo cáo phụ huynh
    const rep = await call('GET', `/api/children/${id}/report`);
    assert.equal(rep.data.week.length, 7);
    assert.ok(rep.data.recent.length > 3);
    // giới hạn thời gian
    await call('PATCH', `/api/children/${id}`, { settings: { dailyLimitMin: 1 } });
    await db.prepare('UPDATE daily_stats SET seconds = seconds + 120 WHERE child_id = ?').run(id);
    assert.equal((await call('POST', `/api/children/${id}/sessions`, { lessonId: map.data.nodes[0].id })).status, 423);
    // đăng xuất / đăng nhập
    await call('POST', '/api/auth/logout');
    assert.equal((await call('GET', '/api/children')).status, 401);
    assert.equal((await call('POST', '/api/auth/login', { email: 'me@example.com', password: 'sai' })).status, 401);
    assert.equal((await call('POST', '/api/auth/login', { email: 'ME@example.com', password: 'abc123' })).status, 200);
    assert.equal((await call('GET', '/api/children')).data.children.length, 1);
    // dữ liệu vẫn còn sau khi đăng nhập lại (điểm danh, xu, đồ đã mua)
    const after = await call('GET', `/api/children/${id}/state`);
    assert.equal(after.data.checkin.today, true); assert.equal(after.data.checkin.total, 1);
    assert.ok(after.data.owned.includes('ears:bunny')); assert.equal(after.data.child.look.ears, 'bunny');
    // chuỗi 7 ngày: giả lập đã điểm danh 6 ngày liền trước đó → hôm nay là ngày 7, nhận quà thời trang
    const ch2 = (await call('POST', '/api/children', { nickname: 'Bé Bin', grade: 1 })).data.child.id;
    const now = Date.now();
    for (let k = 6; k >= 1; k--) await db.prepare('INSERT INTO checkins (child_id, day, seq, coins, energy) VALUES (?, ?, ?, 0, 0)').run(ch2, dayKey(now - k * 864e5), 7 - k);
    const pre = (await call('GET', `/api/children/${ch2}/state`)).data.checkin;
    assert.deepEqual([pre.claimed, pre.nextSeq], [6, 7]);
    const g7 = await call('POST', `/api/children/${ch2}/checkin`);
    assert.equal(g7.data.day, 7); assert.ok(g7.data.item, 'ngày 7 phải có quà');
    assert.ok(g7.data.state.owned.includes(g7.data.item.id));
    assert.ok(g7.data.state.badges.includes('checkin-7'));
    // bỏ lỡ 1 ngày → quay về ngày 1
    const ch3 = (await call('POST', '/api/children', { nickname: 'Bé Su', grade: 1 })).data.child.id;
    await db.prepare('INSERT INTO checkins (child_id, day, seq, coins, energy) VALUES (?, ?, 4, 0, 0)').run(ch3, dayKey(now - 2 * 864e5));
    assert.equal((await call('GET', `/api/children/${ch3}/state`)).data.checkin.nextSeq, 1);
    // xoá hồ sơ xoá luôn lịch sử điểm danh
    assert.equal((await call('DELETE', `/api/children/${ch3}`, { password: 'abc123' })).status, 200);
    assert.equal((await db.prepare('SELECT COUNT(*) n FROM checkins WHERE child_id = ?').get(ch3)).n, 0);
    // khách → chơi → tạo tài khoản → đăng nhập ở máy khác vẫn còn dữ liệu
    cookie = '';
    assert.equal((await call('POST', '/api/auth/guest')).status, 400, 'khách cũng phải đồng ý chính sách');
    assert.equal((await call('POST', '/api/auth/guest', { consent: true })).status, 201);
    assert.equal((await call('GET', '/api/children')).data.children.length, 0);
    const gk = (await call('POST', '/api/children', { nickname: 'Bé Khách', grade: 3 })).data.child.id;
    assert.equal((await call('POST', `/api/children/${gk}/checkin`)).status, 200);
    assert.equal((await call('POST', '/api/auth/password', { next: 'abcdef' })).status, 400, 'khách chưa có tài khoản');
    assert.equal((await call('POST', '/api/auth/upgrade', { name: 'Bố', email: 'me@example.com', password: 'abc123' })).status, 409);
    const up = await call('POST', '/api/auth/upgrade', { name: 'Bố', email: 'bo@example.com', password: 'xyz789' });
    assert.equal(up.status, 200); assert.equal(up.data.parent.isGuest, false);
    cookie = '';
    assert.equal((await call('POST', '/api/auth/login', { email: 'bo@example.com', password: 'xyz789' })).status, 200);
    const kids = (await call('GET', '/api/children')).data.children;
    assert.deepEqual(kids.map((k) => k.nickname), ['Bé Khách']);
    assert.equal((await call('GET', `/api/children/${gk}/state`)).data.checkin.today, true);
    // ---- quên mật khẩu bằng mã khôi phục (không dùng email) ----
    assert.match(up.data.recoveryCode, /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/, 'nâng cấp khách cũng nhận mã khôi phục');
    assert.equal((await call('GET', '/api/auth/me')).data.parent.hasRecovery, true);
    cookie = '';
    assert.equal((await call('POST', '/api/auth/recover', { email: 'bo@example.com', code: 'AAAA-BBBB-CCCC', password: 'moi12345' })).data.error, 'BAD_RECOVERY');
    assert.equal((await call('POST', '/api/auth/recover', { email: 'khongco@example.com', code: up.data.recoveryCode, password: 'moi12345' })).data.error, 'BAD_RECOVERY');
    assert.equal((await call('POST', '/api/auth/recover', { email: 'bo@example.com', code: up.data.recoveryCode, password: '12' })).status, 400);
    const rs = await call('POST', '/api/auth/recover', { email: 'BO@example.com', code: up.data.recoveryCode.toLowerCase().replace(/-/g, ' '), password: 'moi12345' });
    assert.equal(rs.status, 200, JSON.stringify(rs.data)); assert.equal(rs.data.parent.email, 'bo@example.com');
    assert.notEqual(rs.data.recoveryCode, up.data.recoveryCode, 'nhận mã mới');
    cookie = '';
    assert.equal((await call('POST', '/api/auth/recover', { email: 'bo@example.com', code: up.data.recoveryCode, password: 'khac12345' })).status, 401, 'mã cũ hết dùng được');
    assert.equal((await call('POST', '/api/auth/login', { email: 'bo@example.com', password: 'xyz789' })).status, 401);
    assert.equal((await call('POST', '/api/auth/login', { email: 'bo@example.com', password: 'moi12345' })).status, 200);
    // tạo mã mới trong Góc phụ huynh cần đúng mật khẩu
    assert.equal((await call('POST', '/api/auth/recovery-code', { password: 'sai' })).status, 401);
    assert.match((await call('POST', '/api/auth/recovery-code', { password: 'moi12345' })).data.recoveryCode, /^[A-Z2-9-]{14}$/);
    // dò mã bị chặn sau 5 lần sai
    cookie = '';
    for (let i = 0; i < 5; i++) await call('POST', '/api/auth/recover', { email: 'me@example.com', code: `SAI${i}`, password: 'moi12345' });
    assert.equal((await call('POST', '/api/auth/recover', { email: 'me@example.com', code: 'x', password: 'moi12345' })).status, 429);
    await db.prepare("DELETE FROM rate_limits WHERE key LIKE 'recover%'").run();
    assert.equal((await call('POST', '/api/auth/login', { email: 'bo@example.com', password: 'moi12345' })).status, 200);
    // ---- tải dữ liệu gia đình ----
    const ex = await call('GET', '/api/account/export');
    assert.equal(ex.status, 200); assert.equal(ex.data.children.length, 1);
    assert.ok(ex.data.children[0].checkins.length >= 1); assert.ok(ex.data.parent.consent.version);
    // ---- ghi lỗi trình duyệt ----
    assert.equal((await call('POST', '/api/client-error', { message: 'TypeError: x', stack: 'at y', route: '#/play' })).status, 200);
    assert.equal((await db.prepare('SELECT COUNT(*) n FROM client_errors').get()).n, 1);
    assert.equal((await call('GET', '/api/admin/errors')).status, 404, 'không có ADMIN_TOKEN thì ẩn');
    // ---- gia hạn phiên: token sắp hết hạn được kéo dài khi mở app ----
    await db.prepare('UPDATE auth_tokens SET expires_at = ?').run(Date.now() + 5 * 864e5);
    const me = await fetch(base + '/api/auth/me', { headers: { cookie } });
    assert.ok(me.headers.get('set-cookie'), 'phải gửi lại cookie mới');
    const tk = await db.prepare('SELECT MIN(expires_at) e FROM auth_tokens WHERE token = ?').get(cookie.split('=')[1]);
    assert.ok(tk.e > Date.now() + 50 * 864e5);
    // ---- header bảo mật ----
    assert.match(me.headers.get('content-security-policy') ?? '', /frame-ancestors 'none'/);
    assert.equal(me.headers.get('x-content-type-options'), 'nosniff');
    // ---- chặn dò mật khẩu (lưu trong DB) ----
    cookie = '';
    for (let i = 0; i < 10; i++) await call('POST', '/api/auth/login', { email: 'me@example.com', password: 'sai' + i });
    assert.equal((await call('POST', '/api/auth/login', { email: 'me@example.com', password: 'abc123' })).status, 429);
    await db.prepare("DELETE FROM rate_limits WHERE key LIKE 'login:%'").run();
    // ---- xoá tài khoản: xoá sạch mọi bảng ----
    assert.equal((await call('POST', '/api/auth/login', { email: 'bo@example.com', password: 'moi12345' })).status, 200);
    assert.equal((await call('POST', '/api/account/delete', { password: 'sai' })).status, 401);
    const bo = await db.prepare("SELECT id FROM parents WHERE email = 'bo@example.com'").get();
    assert.equal((await call('POST', '/api/account/delete', { password: 'moi12345' })).status, 200);
    assert.equal(await db.prepare('SELECT id FROM parents WHERE id = ?').get(bo.id), undefined);
    assert.equal((await db.prepare('SELECT COUNT(*) n FROM children WHERE parent_id = ?').get(bo.id)).n, 0);
    assert.equal((await db.prepare(`SELECT COUNT(*) n FROM checkins WHERE child_id = ?`).get(gk)).n, 0);
    assert.equal((await call('GET', '/api/children')).status, 401);
    // ---- dọn tài khoản khách bỏ dở ----
    cookie = '';
    await call('POST', '/api/auth/guest', { consent: true }); // khách mới, chưa có bé: giữ lại
    const old = (await db.prepare('INSERT INTO parents (name, is_guest, created_at) VALUES (?, 1, ?)').run('Khách cũ', Date.now() - 10 * 864e5)).lastInsertRowid;
    await db.prepare('INSERT INTO auth_tokens (token, parent_id, expires_at) VALUES (?, ?, ?)').run('tk-old', old, Date.now() + 864e5);
    const removed = await cleanup(db);
    assert.ok(removed >= 1);
    assert.equal(await db.prepare('SELECT id FROM parents WHERE id = ?').get(old), undefined);
    assert.equal((await call('GET', '/api/children')).status, 200, 'khách mới vẫn dùng được');
  } finally {
    server.close();
  }
}

test('luồng API đầy đủ (SQLite trên máy)', async () => { await apiFlow(await openDb({ file: ':memory:' })); });


test('luồng API đầy đủ (Turso qua HTTP — máy chủ giả lập giao thức Hrana v2)', async () => {
  const fake = await fakeTurso('secret-token');
  try {
    const db = await openDb({ tursoUrl: fake.url.replace('http://', 'libsql://').replace('libsql://', 'http://'), tursoToken: 'secret-token' });
    await apiFlow(db);
    assert.ok(fake.requests > 50, 'phải đi qua HTTP');
    assert.equal(fake.openStreams(), 0, 'mọi stream giao dịch phải được đóng');
    // sai token → lỗi
    await assert.rejects(openDb({ tursoUrl: fake.url, tursoToken: 'sai' }));
  } finally { fake.close(); }
});
