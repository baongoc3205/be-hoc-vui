// Chạy: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDb } from '../server/db.js';
import { fakeTurso } from './fake-turso.js';
import { createApp } from '../server/index.js';
import { buildRounds } from '../server/rounds.js';
import { LESSONS, TOPICS } from '../server/content/index.js';
import { gradeRound, computeRewards, levelInfo, currentEnergy, ENERGY_MS } from '../shared/logic.js';

/** Đáp án đúng cho một vòng (để mô phỏng bé chơi giỏi). */
function perfect(r) {
  switch (r.kind) {
    case 'mc': case 'tf': case 'word': return r.answer;
    case 'pairs': return 0;
    case 'order': return r.items.map((_, i) => i);
    case 'clock': return [r.h, r.m];
    case 'classify': return { hits: r.items.filter((i) => i.ok).length, wrong: 0 };
  }
}

test('mọi màn đều tạo được vòng chơi hợp lệ (nhiều seed)', () => {
  let count = 0;
  for (const l of LESSONS.filter((x) => x.kind !== 'chest')) {
    for (let seed = 1; seed <= 25; seed++) {
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
        assert.equal(Number(r.options[r.answer].vi), val, `${l.id}: ${r.prompt.vi}`);
      }
    }
  }
});

test('logic điểm, cấp độ, năng lượng', () => {
  const r = computeRewards({ qualities: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], maxCombo: 10, baseCoins: 15, baseXp: 60, prevStars: 0 });
  assert.equal(r.stars, 3); assert.equal(r.coins, 15 + 3 + 10); assert.equal(r.xp, 60);
  assert.equal(computeRewards({ qualities: [0, 0, 1], maxCombo: 1, baseCoins: 15, baseXp: 60, prevStars: 0 }).stars, 0);
  assert.equal(levelInfo(0).level, 1); assert.equal(levelInfo(50).level, 2);
  const e = currentEnergy(3, 0, ENERGY_MS * 2 + 5); assert.equal(e.value, 5);
  assert.equal(TOPICS.length, 45);
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
    const reg = await call('POST', '/api/auth/register', { name: 'Mẹ Lan', email: 'me@example.com', password: 'abc123' });
    assert.equal(reg.status, 201);
    assert.equal((await call('POST', '/api/auth/register', { name: 'X', email: 'me@example.com', password: 'abc123' })).status, 409);
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
    assert.equal((await call('POST', `/api/children/${id}/daily-chest`)).status, 200);
    assert.equal((await call('POST', `/api/children/${id}/daily-chest`)).status, 409);
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
    // khách
    cookie = '';
    assert.equal((await call('POST', '/api/auth/guest')).status, 201);
    assert.equal((await call('GET', '/api/children')).data.children.length, 0);
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
