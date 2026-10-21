// Tương tác giữa các bé: kết bạn, tin nhắn (có lọc), chặn, bảng xếp hạng, phòng chơi chung.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../server/db.js';
import * as G from '../server/game.js';
import * as S from '../server/social.js';
import * as R from '../server/rooms.js';

async function family(db, name) {
  const pid = (await db.prepare('INSERT INTO parents (email, name, pass_hash, created_at) VALUES (?, ?, ?, ?)').run(`${name}${Math.random()}@x.vn`, 'P', 'x', Date.now())).lastInsertRowid;
  const c = await G.createChild(db, pid, { nickname: name, grade: 3 });
  return db.prepare('SELECT * FROM children WHERE id = ?').get(c.id);
}
const fresh = (db, c) => db.prepare('SELECT * FROM children WHERE id = ?').get(c.id);

test('lọc tin nhắn: che số điện thoại, email, link, mạng xã hội, từ tục; giữ nguyên câu bình thường', () => {
  const f = (t) => S.filterText(t);
  assert.equal(f('Chào bạn, mai mình chơi cá ngựa nhé!').text, 'Chào bạn, mai mình chơi cá ngựa nhé!');
  assert.ok(!f('số mình 0912 345 678 nè').text.includes('345'));
  assert.ok(f('gọi 0912.345.678').masked.includes('contact'));
  assert.ok(!f('mail be@gmail.com').text.includes('gmail'));
  assert.ok(!f('vào www.abc.vn xem').text.includes('abc'));
  assert.ok(!f('kết bạn zalo với mình').text.toLowerCase().includes('zalo'));
  assert.ok(f('đồ ngu').masked.includes('bad'));
  assert.ok(f('do ngu').masked.includes('bad'), 'viết không dấu vẫn bị che');
  assert.equal(f('người ngồi nguyên').masked.length, 0, 'không che nhầm từ chứa "ngu"');
  assert.equal(f('7 + 8 = 15').masked.length, 0, 'phép tính không bị che');
  assert.equal(f('  ').text, '');
  assert.ok(f('a'.repeat(1000)).text.length <= 300);
});

test('kết bạn bằng mã, nhắn tin, chặn và báo cáo', async () => {
  const db = await openDb({ file: ':memory:' });
  const na = await family(db, 'Na'), bin = await family(db, 'Bin'), su = await family(db, 'Su');
  const codeBin = await S.friendCode(db, bin.id);
  assert.match(codeBin, /^[A-Z2-9]{6}$/);
  assert.equal(await S.friendCode(db, bin.id), codeBin, 'mã cố định');
  await assert.rejects(S.requestFriend(db, na, { code: 'ZZZZZZ' }), { code: 'FRIEND_NOT_FOUND' });
  await assert.rejects(S.send(db, na, bin.id, { text: 'hi' }), { code: 'NOT_FRIENDS' }, 'chưa là bạn thì không nhắn được');
  assert.equal((await S.requestFriend(db, na, { code: codeBin.toLowerCase() })).status, 'sent');
  await assert.rejects(S.requestFriend(db, na, { code: codeBin }), { code: 'REQUEST_SENT' });
  assert.equal((await S.summary(db, bin)).requests, 1);
  await S.respondFriend(db, bin, na.id, true);
  assert.equal((await S.friendsOf(db, na)).friends[0].nickname, 'Bin');
  const m = await S.send(db, na, bin.id, { text: 'Gọi mình 0987654321 nhé' });
  assert.ok(!m.message.body.includes('0987654321'));
  assert.equal((await S.summary(db, bin)).unread, 1);
  const list = await S.messages(db, bin, na.id);
  assert.equal(list.messages.length, 1);
  assert.equal((await S.summary(db, bin)).unread, 0, 'mở hội thoại là đã đọc');
  // phụ huynh của Bin xem được tin nhắn
  assert.equal((await S.parentView(db, bin)).messages[0].from, 'Na');
  // giới hạn tốc độ
  for (let i = 0; i < 14; i++) await S.send(db, na, bin.id, { text: `tin ${i}` });
  await assert.rejects(S.send(db, na, bin.id, { text: 'nữa' }), { code: 'TOO_FAST' });
  // chặn: mất bạn, không nhắn, không thấy trên bảng xếp hạng, không gửi lời mời lại được
  await S.block(db, bin, na.id);
  await assert.rejects(S.send(db, na, bin.id, { text: 'hi' }), { code: 'NOT_FRIENDS' });
  await assert.rejects(S.requestFriend(db, na, { code: codeBin }), { code: 'FRIEND_UNAVAILABLE' });
  await assert.rejects(S.profile(db, na, bin.id), { code: 'FRIEND_NOT_FOUND' });
  await S.report(db, bin, na.id, { reason: 'nói bậy' });
  assert.equal((await S.parentView(db, bin)).reports.length, 1);
  // phụ huynh tắt tính năng xã hội
  await db.prepare('UPDATE children SET settings = ? WHERE id = ?').run(JSON.stringify({ ...G.DEFAULT_SETTINGS, social: false }), su.id);
  await assert.rejects(S.requestFriend(db, na, { code: await S.friendCode(db, su.id) }), { code: 'FRIEND_UNAVAILABLE' });
  await assert.rejects(S.requestFriend(db, await fresh(db, su), { code: codeBin }), { code: 'SOCIAL_OFF' });
});

test('bảng xếp hạng toàn app tôn trọng cài đặt ẩn của phụ huynh; hồ sơ công khai', async () => {
  const db = await openDb({ file: ':memory:' });
  const kids = [];
  for (const n of ['A1', 'B2', 'C3']) kids.push(await family(db, n));
  for (const [i, k] of kids.entries()) await db.prepare('INSERT INTO play_sessions (id, child_id, lesson_id, subject, game, rounds, started_at, finished_at, xp, stars) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(`s${i}`, k.id, 'm1a-1', 'math', 'quiz', '[]', Date.now(), Date.now(), (i + 1) * 100, 3);
  let g = await S.leaderboard(db, kids[0], 'global');
  assert.deepEqual(g.rows.map((r) => r.nickname), ['C3', 'B2', 'A1']);
  assert.equal(g.me.rank, 3);
  await db.prepare('UPDATE children SET settings = ? WHERE id = ?').run(JSON.stringify({ ...G.DEFAULT_SETTINGS, publicBoard: false }), kids[2].id);
  g = await S.leaderboard(db, kids[0], 'global');
  assert.deepEqual(g.rows.map((r) => r.nickname), ['B2', 'A1'], 'bé ẩn hồ sơ không hiện trên bảng toàn app');
  await assert.rejects(S.profile(db, kids[0], kids[2].id), { code: 'FRIEND_NOT_FOUND' });
  const p = await S.profile(db, kids[0], kids[1].id);
  assert.equal(p.nickname, 'B2'); assert.equal(p.relation, 'none'); assert.equal(p.xpWeek, 200);
  assert.equal((await S.leaderboard(db, kids[0], 'friends')).rows.length, 1, 'chưa có bạn thì chỉ có mình');
});

test('phòng chơi chung: chỉ bạn bè vào được, bot lấp ghế trống, máy chủ giấu bài người khác, ván kết thúc có thưởng', async (t) => {
  const db = await openDb({ file: ':memory:' });
  const na = await family(db, 'Na'), bin = await family(db, 'Bin'), la = await family(db, 'La');
  await S.requestFriend(db, na, { code: await S.friendCode(db, bin.id) }); await S.respondFriend(db, bin, na.id, true);
  const coins = [];
  R.setRoomHooks({ onFinish: async (cid, game, secs, won) => { coins.push({ cid, won }); return won ? 6 : 2; } });
  const room = await R.createRoom(db, na, 'cards', { players: 3 });
  await assert.rejects(R.joinRoom(db, la, room.code), { code: 'ROOM_FRIENDS_ONLY' }, 'người lạ không vào được');
  const v = await R.joinRoom(db, bin, room.code);
  assert.equal(v.seats.length, 2);
  assert.throws(() => R.startRoom(bin, room.id), { code: 'HOST_ONLY' });
  const started = R.startRoom(na, room.id);
  assert.equal(started.seats.length, 3); assert.ok(started.seats[2].bot);
  assert.ok(started.state.hands[1].every((c) => c.v === '?'), 'không thấy bài của bạn');
  assert.ok(started.state.hands[0].every((c) => c.v !== '?'));
  assert.throws(() => R.actRoom(bin, room.id, { type: 'draw' }), { code: 'NOT_YOUR_TURN' });
  const r = R._rooms.get(room.id);
  const C = await import('../shared/board/cards.js');
  for (let i = 0; i < 3000 && r.status === 'playing'; i++) {
    const seat = r.state.turn;
    if (seat === 2) { R._botStep(room.id); continue; }
    const kid = seat === 0 ? na : bin;
    const m = C.botMove(R.getRoom(kid, room.id).state, seat, 'normal', Math.random);
    R.actRoom(kid, room.id, m.type === 'play' ? { ...m, called: true } : m);
  }
  clearTimeout(r.timer);
  assert.equal(r.status, 'done', 'ván phải kết thúc');
  await new Promise((ok) => setTimeout(ok, 20));
  assert.equal(coins.length, 2, 'hai bé đều được ghi nhận khi hết ván');
  assert.equal(coins.filter((c) => c.won).length, r.result.winners.filter((w) => w < 2).length);
  // cá ngựa: máy chủ tự gieo xúc xắc, không nhận số từ trình duyệt
  const lu = await R.createRoom(db, na, 'ludo', { players: 2 });
  R.startRoom(na, lu.id);
  const after = R.actRoom(na, lu.id, { type: 'roll', value: 6 });
  assert.ok(after.log.some((l) => l.t === 'roll' && l.v >= 1 && l.v <= 6));
  clearTimeout(R._rooms.get(lu.id).timer);
  R.leaveRoom(na, lu.id);
});

test('phòng thi đố: chấm trên máy chủ, giấu đáp án, ai nhiều điểm hơn thì thắng', async () => {
  const db = await openDb({ file: ':memory:' });
  const na = await family(db, 'Na'), bin = await family(db, 'Bin');
  await S.requestFriend(db, na, { code: await S.friendCode(db, bin.id) }); await S.respondFriend(db, bin, na.id, true);
  const res = [];
  R.setRoomHooks({ onFinish: async (cid, game, secs, won) => { res.push({ cid, won }); return 0; } });
  const room = await R.createRoom(db, na, 'quiz', {});
  await R.joinRoom(db, bin, room.code);
  R.startRoom(na, room.id);
  const r = R._rooms.get(room.id);
  r.state.startAt = Date.now() - 10; // bỏ qua đếm ngược
  let v = R.getRoom(na, room.id);
  assert.ok(v.state.question && v.state.question.answer === undefined, 'không lộ đáp án');
  for (let q = 0; q < r.state.rounds.length; q++) {
    R.actRoom(na, room.id, { type: 'answer', q, choice: r.state.rounds[q].answer });
    R.actRoom(bin, room.id, { type: 'answer', q, choice: (r.state.rounds[q].answer + 1) % r.state.rounds[q].options.length });
  }
  v = R.getRoom(na, room.id);
  assert.equal(v.status, 'done');
  assert.deepEqual(v.result.winners, [0]);
  assert.equal(v.state.progress[0].correct, r.state.rounds.length);
  assert.equal(v.state.progress[1].correct, 0);
  await new Promise((ok) => setTimeout(ok, 20));
  assert.deepEqual(res.map((x) => x.won).sort(), [false, true]);
  assert.throws(() => R.actRoom(na, room.id, { type: 'answer', q: 0, choice: 0 }), { code: 'GAME_OVER' });
});

test('tặng quà: chỉ cho bạn bè/anh chị em, người tặng trả xu, tối đa 3 quà/ngày, đồ lễ chỉ tặng đúng đợt', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-25T03:00:00Z').getTime() });
  const db = await openDb({ file: ':memory:' });
  const na = await family(db, 'Na'), bin = await family(db, 'Bin'), su = await family(db, 'Su');
  await db.prepare('UPDATE children SET coins = 2000 WHERE id = ?').run(na.id);
  await assert.rejects(S.sendGift(db, await fresh(db, na), { to: bin.id, itemId: 'outfit:witch' }), { code: 'NOT_FRIENDS' });
  await S.requestFriend(db, na, { code: await S.friendCode(db, bin.id) });
  await S.respondFriend(db, bin, na.id, true);
  const before = (await fresh(db, na)).coins;
  const r = await S.sendGift(db, await fresh(db, na), { to: bin.id, itemId: 'outfit:witch', note: 'Tặng Bin nè! gọi 0912345678' });
  assert.equal(before - (await fresh(db, na)).coins, r.paid, 'người tặng trả xu');
  assert.ok(JSON.parse((await fresh(db, bin)).owned).includes('outfit:witch'), 'món vào tủ đồ của bạn');
  assert.ok(!JSON.parse((await fresh(db, na)).owned).includes('outfit:witch'), 'người tặng không nhận món');
  await assert.rejects(S.sendGift(db, await fresh(db, na), { to: bin.id, itemId: 'outfit:witch' }), { code: 'FRIEND_HAS_IT' });
  await assert.rejects(S.sendGift(db, await fresh(db, na), { to: bin.id, itemId: 'outfit:gingerbread' }), { code: 'NOT_IN_SEASON' }, 'đồ Giáng sinh chưa tới đợt');
  await assert.rejects(S.sendGift(db, await fresh(db, na), { to: bin.id, itemId: 'outfit:dress' }), { code: 'ITEM_NOT_FOUND' }, 'đồ miễn phí không tặng');
  const inbox = await S.giftInbox(db, await fresh(db, bin));
  assert.equal(inbox.unopened, 1); assert.equal(inbox.gifts[0].item, 'outfit:witch'); assert.equal(inbox.gifts[0].from, 'Na');
  assert.ok(!inbox.gifts[0].note.includes('345'), 'lời chúc được lọc');
  assert.equal((await S.summary(db, await fresh(db, bin))).gifts, 1);
  await S.openGift(db, await fresh(db, bin), inbox.gifts[0].id);
  assert.equal((await S.giftInbox(db, await fresh(db, bin))).unopened, 0);
  // giới hạn 3 quà mỗi ngày
  await S.sendGift(db, await fresh(db, na), { to: bin.id, itemId: 'pet:cat' });
  await S.sendGift(db, await fresh(db, na), { to: bin.id, itemId: 'outfit:skeleton' });
  await assert.rejects(S.sendGift(db, await fresh(db, na), { to: bin.id, itemId: 'hold:broom' }), { code: 'GIFT_LIMIT' });
  t.mock.timers.setTime(new Date('2026-10-26T03:00:00Z').getTime());
  await S.sendGift(db, await fresh(db, na), { to: bin.id, itemId: 'hold:broom' });
  // anh chị em cùng nhà tặng nhau được dù chưa kết bạn
  const sib = await G.createChild(db, na.parent_id, { nickname: 'Em', grade: 1 });
  await S.sendGift(db, await fresh(db, na), { to: sib.id, itemId: 'hold:teddy' });
  // phụ huynh tắt tặng quà; thiếu xu; bị chặn
  await db.prepare('UPDATE children SET settings = ? WHERE id = ?').run(JSON.stringify({ ...JSON.parse(su.settings), gifts: false }), su.id);
  await assert.rejects(S.sendGift(db, await fresh(db, su), { to: na.id, itemId: 'hold:teddy' }), { code: 'GIFTS_OFF' });
  await db.prepare('UPDATE children SET coins = 0 WHERE id = ?').run(na.id);
  await assert.rejects(S.sendGift(db, await fresh(db, na), { to: bin.id, itemId: 'acc:crown' }), { code: 'NOT_ENOUGH_COINS' });
  assert.ok(!JSON.parse((await fresh(db, bin)).owned).includes('acc:crown'), 'thiếu xu thì bạn không nhận được món');
  await S.block(db, bin, na.id, true);
  await assert.rejects(S.sendGift(db, await fresh(db, na), { to: bin.id, itemId: 'acc:crown' }), { code: 'NOT_FRIENDS' });
});

// đáp án đúng cho một vòng minigame (giống test/server.test.js)
function perfectGiven(r) {
  switch (r.kind) {
    case 'mc': case 'tf': case 'word': case 'input': case 'multi': return r.answer;
    case 'classify': return { hits: r.items.filter((i) => i.ok).length, wrong: 0 };
    case 'trace': return { cover: 0.95, stray: 0.05, pick: r.quiz ? r.quiz.answer : undefined };
    default: return null;
  }
}

test('mọi minigame chơi cùng bạn được: cùng một bộ đề, máy chủ chấm, ai đúng nhiều và nhanh hơn thì thắng', async () => {
  const db = await openDb({ file: ':memory:' });
  const na = await family(db, 'Na'), bin = await family(db, 'Bin');
  await S.requestFriend(db, na, { code: await S.friendCode(db, bin.id) }); await S.respondFriend(db, bin, na.id, true);
  R.setRoomHooks({ onFinish: async () => 0 });
  for (const game of ['fruit-slice', 'candy-match', 'slingshot', 'draw-trace', 'balloon-pop', 'catch-fall', 'math-race']) {
    const room = await R.createRoom(db, na, game, { subject: 'math' });
    await R.joinRoom(db, bin, room.code);
    R.startRoom(na, room.id);
    const r = R._rooms.get(room.id);
    r.state.startAt = Date.now() - 10;
    const v0 = R.getRoom(bin, room.id);
    assert.ok(v0.state.question?.round, `${game}: thiếu vòng chơi`);
    assert.deepEqual(v0.state.question.round, r.state.rounds[0], `${game}: hai bạn làm cùng đề`);
    for (let q = 0; q < r.state.rounds.length; q++) {
      R.actRoom(na, room.id, { type: 'answer', q, given: perfectGiven(r.state.rounds[q]) });
      R.actRoom(bin, room.id, { type: 'answer', q, given: null });
    }
    const v = R.getRoom(na, room.id);
    assert.equal(v.status, 'done', `${game}: chưa kết thúc`);
    assert.deepEqual(v.result.winners, [0], `${game}: người làm đúng phải thắng`);
    assert.equal(v.state.progress[0].correct, r.state.rounds.length, `${game}: chấm sai đáp án đúng`);
    assert.equal(v.state.progress[1].correct, 0);
  }
});

test('Ma sói nhiều người: giấu vai, mỗi bé tự chọn đêm/ngày/bỏ phiếu, hết giờ thì máy chủ chọn hộ, ván kết thúc đúng phe', async () => {
  const db = await openDb({ file: ':memory:' });
  const na = await family(db, 'Na'), bin = await family(db, 'Bin');
  await S.requestFriend(db, na, { code: await S.friendCode(db, bin.id) }); await S.respondFriend(db, bin, na.id, true);
  const res = [];
  R.setRoomHooks({ onFinish: async (cid, game, secs, won) => { res.push({ cid, game, won }); return 0; } });
  const room = await R.createRoom(db, na, 'werewolf', { players: 8 });
  assert.equal(room.opts.players, 8);
  await R.joinRoom(db, bin, room.code);
  R.startRoom(na, room.id);
  const r = R._rooms.get(room.id);
  assert.equal(r.seats.length, 8);
  const vNa = R.getRoom(na, room.id);
  assert.ok(vNa.state.players[0].role, 'thấy vai của mình');
  const binRole = r.state.ww.players[1].role;
  if (!(binRole === 'wolf' && vNa.state.players[0].role === 'wolf')) assert.equal(vNa.state.players[1].role, null, 'không thấy vai của bạn');
  assert.equal(vNa.state.log.some((l) => l.kind === 'clue'), false);
  for (let i = 0; i < 80 && r.status === 'playing'; i++) {
    const st = r.state;
    for (const [me, kid] of [[0, na], [1, bin]]) {
      const v = R.getRoom(kid, room.id).state;
      if (!v.needs) continue;
      const p = st.ww.players[me];
      const others = st.ww.players.filter((x) => x.alive && x.id !== me);
      const t = others.find((x) => x.role !== 'wolf')?.id ?? others[0]?.id;
      try {
        if (v.step === 'night') R.actRoom(kid, room.id, p.role === 'wolf' ? { type: 'kill', target: t } : p.role === 'guard' ? { type: 'guard', target: me } : { type: 'check', target: t });
        else if (v.step === 'witch') R.actRoom(kid, room.id, { type: 'witch', heal: true, poison: null });
        else if (v.step === 'day') { if (!v.said) R.actRoom(kid, room.id, { type: 'say', kind: 'accuse', target: t }); R.actRoom(kid, room.id, { type: 'ready' }); }
        else if (v.step === 'vote') R.actRoom(kid, room.id, { type: 'vote', target: t });
      } catch (e) { if (e.code !== 'GAME_OVER') throw e; }
    }
    if (r.status === 'playing' && i % 3 === 2) R._wwAdvance(room.id); // thỉnh thoảng để hết giờ
  }
  assert.equal(r.status, 'done', 'ván Ma sói phải kết thúc');
  const side = r.state.ww.winner;
  assert.ok(['wolf', 'village'].includes(side));
  for (const w of r.result.winners) assert.equal(r.state.ww.players[w].role === 'wolf', side === 'wolf');
  const v = R.getRoom(bin, room.id);
  assert.equal(v.state.roles.length, 8, 'hết ván thì lộ hết vai');
  await new Promise((ok) => setTimeout(ok, 20));
  assert.equal(res.length, 2); assert.ok(res.every((x) => x.game === 'werewolf'));
});

test('bạn bè online/offline: thấy khi app đang mở, quá 45 giây thì offline, phụ huynh tắt kết bạn thì luôn offline', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-25T03:00:00Z').getTime() });
  const db = await openDb({ file: ':memory:' });
  const na = await family(db, 'Na'), bin = await family(db, 'Bin'), su = await family(db, 'Su');
  await S.requestFriend(db, na, { code: await S.friendCode(db, bin.id) }); await S.respondFriend(db, bin, na.id, true);
  let f = await S.friendsOf(db, na);
  assert.equal(f.friends[0].online, false, 'chưa mở app thì offline');
  await S.summary(db, bin); // app của Bin hỏi tin nhắn
  f = await S.friendsOf(db, na);
  assert.equal(f.friends[0].online, true); assert.equal(f.onlineCount, 1);
  assert.equal((await S.profile(db, na, bin.id)).online, true);
  assert.equal((await S.profile(db, su, bin.id)).online, null, 'người lạ không thấy trạng thái online');
  t.mock.timers.setTime(new Date('2026-10-25T03:01:00Z').getTime());
  f = await S.friendsOf(db, na);
  assert.equal(f.friends[0].online, false, 'quá 45 giây không thấy thì offline');
  assert.ok(f.friends[0].seenAt > 0, 'vẫn biết lần cuối online');
  await S.summary(db, bin);
  await db.prepare('UPDATE children SET settings = ? WHERE id = ?').run(JSON.stringify({ ...JSON.parse(bin.settings), social: false }), bin.id);
  f = await S.friendsOf(db, na);
  assert.equal(f.friends[0].online, false, 'phụ huynh tắt kết bạn thì không lộ trạng thái');
  assert.equal(f.friends[0].seenAt, null);
});
