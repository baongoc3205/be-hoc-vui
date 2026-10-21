// Trò chơi cùng bot: cho bot tự đấu hàng trăm ván để chắc luật đúng, ván nào cũng kết thúc và bot đủ "khôn".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../shared/logic.js';
import * as C from '../shared/board/cards.js';
import * as Lu from '../shared/board/ludo.js';
import * as W from '../shared/board/werewolf.js';

test('Bài màu sắc: bộ 108 lá, ván nào cũng có người thắng, không mất lá nào', () => {
  assert.equal(C.makeDeck().length, 108);
  const wins = [0, 0];
  for (let g = 0; g < 400; g++) {
    const rnd = makeRng(1000 + g);
    const n = 2 + (g % 3);
    let s = C.newGame(n, rnd);
    let steps = 0;
    while (s.winner === null && steps < 3000) {
      const p = s.turn;
      const lvl = p === 0 ? 'normal' : 'easy';
      const m = C.botMove(s, p, lvl, rnd);
      if (m.type === 'play') {
        assert.ok(C.canPlay(s, p, s.hands[p][m.idx]), 'bot đánh sai luật');
        s = C.play(s, p, m.idx, m.color, m.called, rnd).s;
      } else if (m.type === 'draw') s = C.draw(s, p, rnd).s;
      else s = C.pass(s, p).s;
      const total = s.deck.length + s.discard.length + s.hands.reduce((a, h) => a + h.length, 0);
      assert.equal(total, 108, 'số lá bị lệch');
      assert.ok(C.COLORS.includes(s.color));
      steps++;
    }
    assert.notEqual(s.winner, null, `ván ${g} không kết thúc`);
    if (n === 2) wins[s.winner === 0 ? 0 : 1]++;
  }
  assert.ok(wins[0] > wins[1], `bot thường phải thắng bot dễ nhiều hơn (${wins})`);
  // luật: +4 chỉ được ra khi không còn lá cùng màu
  const s = C.newGame(2, makeRng(7));
  s.hands[0] = [{ id: 900, c: null, v: '+4' }, { id: 901, c: s.color, v: '5' }];
  assert.ok(!C.canPlay(s, 0, s.hands[0][0]));
  assert.throws(() => C.play(s, 1, 0, 'red', false, makeRng(1)), /ILLEGAL/, 'không được đánh khi chưa tới lượt');
  // quên hô "Một lá!" thì bốc phạt 2
  const t = C.newGame(2, makeRng(9));
  t.hands[0] = [{ id: 950, c: t.color, v: '3' }, { id: 951, c: t.color, v: '4' }];
  const r = C.play(t, 0, 0, null, false, makeRng(2));
  assert.equal(r.s.hands[0].length, 3); assert.ok(r.events.some((e) => e.t === 'forgot'));
});

test('Cá ngựa: đường đua 52 ô liền nhau, ván nào cũng có người về đích', () => {
  assert.equal(Lu.TRACK.length, 52);
  assert.equal(new Set(Lu.TRACK.map(([r, c]) => `${r},${c}`)).size, 52, 'ô đường đua bị trùng');
  for (let i = 0; i < 52; i++) { const [a, b] = Lu.TRACK[i]; const [c, d] = Lu.TRACK[(i + 1) % 52]; assert.ok(Math.abs(a - c) + Math.abs(b - d) === 1 || (Math.abs(a - c) === 1 && Math.abs(b - d) === 1), `ô ${i} không liền ô kế`); }
  // ô cuối đường đua của mỗi màu nằm sát đường về đích
  for (let col = 0; col < 4; col++) { const [r, c] = Lu.TRACK[Lu.cellOf(col, 50)]; const [hr, hc] = Lu.HOME[col][0]; assert.equal(Math.abs(r - hr) + Math.abs(c - hc), 1, `màu ${col}: đường về đích lệch`); }
  const wins = { normal: 0, easy: 0 };
  for (let g = 0; g < 300; g++) {
    const rnd = makeRng(500 + g);
    const seats = g % 2 ? [0, 2] : [0, 1, 2, 3];
    let s = Lu.newGame(seats, { exitOn: g % 3 ? [6] : [1, 6] });
    let steps = 0;
    while (s.winner == null && steps < 5000) {
      s = Lu.roll(s, 1 + Math.floor(rnd() * 6)).s;
      if (s.dice != null) {
        const lvl = Lu.current(s) === 0 ? 'normal' : 'easy';
        const m = Lu.botChoose(s, lvl, rnd);
        s = Lu.move(s, m).s;
      }
      for (const c of seats) for (const p of s.pieces[c]) assert.ok(p >= -1 && p <= Lu.FINISH);
      steps++;
    }
    assert.notEqual(s.winner, null, `ván ${g} không kết thúc`);
    if (seats.length === 2) wins[s.winner === 0 ? 'normal' : 'easy']++;
  }
  assert.ok(wins.normal > wins.easy, `bot thường phải thắng bot dễ nhiều hơn (${JSON.stringify(wins)})`);
});

test('Ma sói: ván nào cũng kết thúc, hai phe đều có cơ hội thắng', () => {
  const res = { village: 0, wolf: 0 };
  for (let g = 0; g < 600; g++) {
    const rnd = makeRng(77 + g);
    const n = [6, 8, 10][g % 3];
    let s = W.newGame(n, rnd, { humanName: 'Bé' });
    assert.equal(s.players.filter((p) => p.role === 'wolf').length, { 6: 1, 8: 2, 10: 3 }[n]);
    let guard = 0;
    while (!s.winner && guard++ < 40) {
      // người chơi số 0 cũng do máy chọn ngẫu nhiên hợp lệ
      const plan = W.botNight(s, rnd);
      const me = s.players[0];
      const others = W.alive(s).filter((p) => p.id !== 0);
      if (me.alive && me.role === 'wolf') plan.victim = (others.filter((p) => p.role !== 'wolf')[0] ?? others[0]).id;
      if (me.alive && me.role === 'guard') plan.guard = W.alive(s).filter((p) => p.id !== s.lastGuard)[0].id;
      if (me.alive && me.role === 'seer') plan.check = { seer: 0, target: others[0]?.id ?? null };
      const witch = W.alive(s).find((p) => p.role === 'witch');
      if (witch) Object.assign(plan, witch.human ? { heal: false, poison: null } : W.botWitch(s, witch.id, plan.victim, rnd));
      s = W.resolveNight(s, plan).s;
      if (s.winner) break;
      s = W.dayTalk(s, rnd);
      const votes = W.botVotes(s, rnd);
      if (s.players[0].alive) votes[0] = null;
      s = W.resolveVote(s, votes).s;
    }
    assert.ok(s.winner, `ván ${g} không kết thúc`);
    assert.equal(W.checkWin(s), s.winner);
    for (const e of s.log) assert.ok(e.text.vi && e.text.en && !/undefined|NaN/.test(e.text.vi + e.text.en), 'lời thoại hỏng');
    res[s.winner]++;
  }
  const pv = res.village / 600;
  assert.ok(pv > 0.25 && pv < 0.88, `cán cân hai phe lệch quá (${JSON.stringify(res)})`);
});

test('học kết hợp: chặn +2/+4, ra quân bằng câu hỏi, gieo thêm ở ô ★, gợi ý ma sói luôn đúng', async () => {
  const { quizPool, traceQuiz } = await import('../server/questions.js');
  // kho câu hỏi đúng lớp, không trùng, có đáp án hợp lệ
  for (const g of [1, 5, 9]) for (const sub of [null, 'math', 'english']) {
    const qs = quizPool(g, sub, 20, makeRng(g * 7));
    assert.ok(qs.length >= 15, `lớp ${g} môn ${sub}: ít câu`);
    for (const q of qs) assert.ok(q.kind === 'mc' && q.answer >= 0 && q.answer < q.options.length);
  }
  // câu đố trò vẽ: đáp án nằm trong 4 lựa chọn, không trùng
  for (const shape of ['circle', 'triangle', 'square', 'rect', 'star', 'heart', 'para', 'rhombus', 'trapezoid', 'right', 'd0', 'd5', 'd9']) for (const g of [1, 3, 6]) {
    const q = traceQuiz(shape, g, 11);
    assert.equal(q.options[q.answer], shape); assert.equal(new Set(q.options).size, 4);
    assert.ok(q.prompt.vi && q.prompt.en);
  }
  assert.match(traceQuiz('d4', 1, 3).prompt.vi, /Có bao nhiêu/);
  // bài: trả lại lá đã bốc
  let s = C.newGame(2, makeRng(3));
  const before = s.hands[0].length; const deck = s.deck.length;
  s.hands[1] = [{ id: 990, c: s.color, v: '+2' }, { id: 991, c: 'red', v: '1' }]; s.turn = 1;
  const r = C.play(s, 1, 0, null, true, makeRng(4));
  assert.equal(r.s.hands[0].length, before + 2);
  const back = C.returnCards(r.s, 0, 2);
  assert.equal(back.hands[0].length, before); assert.equal(back.deck.length, deck);
  // cá ngựa: ra quân bằng câu hỏi, đá ngựa đứng ở ô xuất phát
  let l = Lu.newGame([0, 2]);
  l.pieces[2][0] = 24; // ô tuyệt đối 0 = ô xuất phát của Đỏ (an toàn) → không bị đá
  const e = Lu.quizExit(l);
  assert.equal(e.s.pieces[0][0], 0); assert.equal(e.s.turn, 1); assert.equal(e.s.pieces[2][0], 24);
  assert.throws(() => Lu.quizExit({ ...l, dice: 3 }), /ILLEGAL/);
  assert.ok(Lu.onStar(0, 8) && !Lu.onStar(0, 0) && !Lu.onStar(0, 13));
  const ex = Lu.grantExtra(e.s, 0); assert.equal(Lu.current(ex), 0); assert.equal(ex.dice, null);
  // ma sói: gợi ý luôn đúng sự thật
  for (let g = 0; g < 200; g++) {
    const rnd = makeRng(900 + g);
    let w = W.newGame(8, rnd, { humanRole: ['villager', 'seer', 'wolf'][g % 3] });
    for (let k = 0; k < 3; k++) w = W.clue(w, rnd);
    for (const [id, v] of Object.entries(w.known ?? {})) assert.ok(v === 'good' && w.players[id].role !== 'wolf', 'gợi ý sai: người tốt lại là sói');
    for (const line of w.log.filter((x) => x.kind === 'clue')) {
      const m = line.text.vi.match(/trong ba bạn (.+) có đúng 1 con sói/);
      if (m) assert.equal(m[1].split(', ').filter((n) => w.players.find((p) => p.name === n).role === 'wolf').length, 1, 'gợi ý "đúng 1 sói" sai');
      const t = line.text.vi.match(/là một trong hai bạn (.+) và (.+)\./);
      if (t) assert.ok([t[1], t[2]].some((n) => ['seer', 'guard', 'witch'].includes(w.players.find((p) => p.name === n).role)));
    }
  }
});
