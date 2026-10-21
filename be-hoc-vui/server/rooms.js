// Phòng chơi cùng bạn bè: Bài Màu Sắc, Cá ngựa, Ma sói (nhiều bé cùng làng), Thi đố và mọi minigame ở Khu vui chơi
// (thi đua: cả phòng làm cùng một bộ đề, ai đúng nhiều và nhanh hơn thì thắng). Ván chơi giữ trong bộ nhớ máy chủ và do máy chủ
// phân xử bằng chính bộ luật ở shared/board/ (không tin trình duyệt). Ghế trống có bot chơi thay;
// bạn nào rời đi hoặc để quá lâu không đi thì bot đi giúp để cả phòng không phải chờ.
// Trình duyệt hỏi trạng thái phòng khoảng mỗi giây (polling) nên chạy được trên mọi gói hosting.
import { randomBytes } from 'node:crypto';
import { HttpError } from './http.js';
import { makeRng, gradeRound } from '../shared/logic.js';
import * as C from '../shared/board/cards.js';
import * as Lu from '../shared/board/ludo.js';
import * as W from '../shared/board/werewolf.js';
import { ARCADE_GAMES, pickArcade } from './arcade.js';
import { buildRounds } from './rounds.js';
import { LESSONS, DEFAULT_LOOK, SUBJECTS } from './content/index.js';
import { relation, isBlocked, send, markSeen } from './social.js';

export const ROOM_GAMES = { cards: { min: 2, max: 4 }, ludo: { min: 2, max: 4 }, quiz: { min: 2, max: 4 }, werewolf: { min: 6, max: 10 }, ...Object.fromEntries(ARCADE_GAMES.map((g) => [g, { min: 2, max: 4 }])) };
/** Game thi đua cùng bộ đề (thi đố + minigame). */
const RACE = new Set(['quiz', ...ARCADE_GAMES]);
/** Số giây cho mỗi vòng của từng minigame khi thi đua. */
const RACE_SEC = { quiz: 20, 'fruit-slice': 20, 'candy-match': 35, slingshot: 25, 'draw-trace': 45, 'balloon-pop': 20, 'catch-fall': 45, 'math-race': 15 };
const WW_SEC = { night: 35, witch: 25, day: 60, vote: 30 };
const BOT_NAMES = ['Mimi', 'Bo', 'Foxy', 'Kiwi'];
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const IDLE_ROOM_MS = 30 * 60e3, OFFLINE_MS = 12e3, TURN_MS = 30e3, OFFLINE_TURN_MS = 6e3, BOT_MS = 900;
const QUIZ_Q = 8, QUIZ_SEC = 20;
const json = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };

const rooms = new Map(); // id → room
const byCode = new Map();
let hooks = { onFinish: async () => undefined };
/** index.js gắn hàm thưởng xu / ghi thời gian khi ván kết thúc. */
export function setRoomHooks(h) { hooks = { ...hooks, ...h }; }

const newId = () => randomBytes(9).toString('base64url');
function newCode() { for (;;) { const c = Array.from(randomBytes(5), (b) => ALPHA[b % ALPHA.length]).join(''); if (!byCode.has(c)) return c; } }
const lookOf = (c) => ({ ...DEFAULT_LOOK, ...json(c.look, {}) });
const touch = (r) => { r.version++; r.updatedAt = Date.now(); };

export async function createRoom(db, me, game, opts = {}) {
  if (!ROOM_GAMES[game]) throw new HttpError(400, 'BAD_GAME');
  const max = game === 'werewolf' ? ([6, 8, 10].includes(Number(opts.players)) ? Number(opts.players) : 8) : Math.max(ROOM_GAMES[game].min, Math.min(ROOM_GAMES[game].max, Number(opts.players) || 4));
  const r = {
    id: newId(), code: newCode(), game, host: me.id, status: 'lobby', createdAt: Date.now(), updatedAt: Date.now(), version: 1,
    opts: { players: max, level: opts.level === 'easy' ? 'easy' : 'normal', exitOne: !!opts.exitOne, subject: SUBJECTS.some((s) => s.id === opts.subject) ? opts.subject : null, grade: me.grade },
    seats: [{ childId: me.id, parentId: me.parent_id, name: me.nickname, look: lookOf(me), bot: false, seen: Date.now(), left: false }],
    state: null, startedAt: null, turnAt: null, result: null, rnd: makeRng(randomBytes(4).readUInt32LE(0)), timer: null, rewarded: false,
  };
  rooms.set(r.id, r); byCode.set(r.code, r.id);
  return view(r, me.id);
}

/** Vào phòng bằng mã: chỉ bạn bè của chủ phòng hoặc anh chị em cùng gia đình. */
export async function joinRoom(db, me, code) {
  const id = byCode.get(String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, ''));
  const r = id && rooms.get(id);
  if (!r) throw new HttpError(404, 'ROOM_NOT_FOUND');
  const already = r.seats.find((s) => s.childId === me.id);
  if (already) { already.left = false; already.seen = Date.now(); touch(r); return view(r, me.id); }
  if (r.status !== 'lobby') throw new HttpError(409, 'ROOM_STARTED');
  if (r.seats.length >= (r.game === 'werewolf' ? 6 : r.opts.players)) throw new HttpError(409, 'ROOM_FULL');
  const host = await db.prepare('SELECT * FROM children WHERE id = ?').get(r.host);
  const rel = host ? await relation(db, me, host) : 'none';
  if (!['friends', 'family'].includes(rel)) throw new HttpError(403, 'ROOM_FRIENDS_ONLY');
  for (const s of r.seats) if (!s.bot && await isBlocked(db, me.id, s.childId)) throw new HttpError(403, 'ROOM_FRIENDS_ONLY');
  r.seats.push({ childId: me.id, parentId: me.parent_id, name: me.nickname, look: lookOf(me), bot: false, seen: Date.now(), left: false });
  touch(r);
  return view(r, me.id);
}

function roomOf(id, childId) {
  const r = rooms.get(id);
  if (!r) throw new HttpError(404, 'ROOM_NOT_FOUND');
  const seat = r.seats.findIndex((s) => s.childId === childId);
  if (seat < 0) throw new HttpError(403, 'NOT_IN_ROOM');
  return { r, seat };
}

export async function inviteToRoom(db, me, id, friendId) {
  const { r } = roomOf(id, me.id);
  if (r.status !== 'lobby') throw new HttpError(409, 'ROOM_STARTED');
  return send(db, me, friendId, { room: r.id, code: r.code, game: r.game }, 'invite');
}

export function leaveRoom(me, id) {
  const { r, seat } = roomOf(id, me.id);
  if (r.status === 'lobby') {
    r.seats.splice(seat, 1);
    if (!r.seats.length || r.host === me.id) closeRoom(r); else touch(r);
  } else { r.seats[seat].left = true; touch(r); schedule(r); if (r.seats.every((s) => s.bot || s.left)) closeRoom(r); }
  return { ok: true };
}
function closeRoom(r) { clearTimeout(r.timer); rooms.delete(r.id); byCode.delete(r.code); }

// ---------------- Bắt đầu ván ----------------
export function startRoom(me, id) {
  const { r } = roomOf(id, me.id);
  if (r.host !== me.id) throw new HttpError(403, 'HOST_ONLY');
  if (r.status !== 'lobby') throw new HttpError(409, 'ROOM_STARTED');
  const want = RACE.has(r.game) ? Math.max(2, r.seats.length) : r.opts.players;
  let k = 0;
  const names = r.game === 'werewolf' ? W.BOT_NAMES.filter((n) => !r.seats.some((s) => s.name === n)) : BOT_NAMES;
  while (r.seats.length < want) r.seats.push({ childId: null, name: names[k % names.length], look: null, bot: true, botIdx: k++ });
  const n = r.seats.length;
  if (r.game === 'cards') r.state = C.newGame(n, r.rnd);
  if (r.game === 'ludo') r.state = Lu.newGame({ 2: [0, 2], 3: [0, 1, 2], 4: [0, 1, 2, 3] }[n], { exitOn: r.opts.exitOne ? [1, 6] : [6] });
  if (r.game === 'quiz') r.state = newQuiz(r);
  if (ARCADE_GAMES.includes(r.game)) r.state = newRace(r);
  if (r.game === 'werewolf') r.state = newWerewolf(r);
  r.status = 'playing'; r.startedAt = Date.now(); r.turnAt = Date.now(); r.log = [];
  touch(r); schedule(r);
  return view(r, me.id);
}

function newQuiz(r) {
  const grade = r.opts.grade;
  let pool = LESSONS.filter((l) => l.game === 'quiz' && (!r.opts.subject || l.subject === r.opts.subject));
  const best = Math.min(...pool.map((l) => Math.abs(l.grade - grade)));
  pool = pool.filter((l) => Math.abs(l.grade - grade) === best);
  const rounds = [];
  for (let tries = 0; rounds.length < QUIZ_Q && tries < 12; tries++) {
    const lesson = pool[Math.floor(r.rnd() * pool.length)];
    for (const q of buildRounds(lesson, Math.floor(r.rnd() * 1e9)).rounds) if (q.kind === 'mc' && rounds.length < QUIZ_Q && !rounds.some((x) => JSON.stringify(x.prompt) === JSON.stringify(q.prompt))) rounds.push(q);
  }
  const startAt = Date.now() + 3000; // đếm ngược 3 giây
  return { rounds, startAt, perQ: QUIZ_SEC, deadline: startAt + rounds.length * QUIZ_SEC * 1000 + 2000, answers: r.seats.map(() => []), done: false };
}
/** Thi đua minigame: một bộ đề chung (cùng môn, đúng lớp chủ phòng) cho cả phòng. */
function newRace(r) {
  const lesson = pickArcade(r.opts.grade, r.game, r.opts.subject ?? 'any');
  const { rounds } = buildRounds(lesson, Math.floor(r.rnd() * 1e9));
  const perQ = RACE_SEC[r.game] ?? 25;
  const startAt = Date.now() + 3000;
  return { rounds, startAt, perQ, deadline: startAt + rounds.length * perQ * 1000 + 2000, answers: r.seats.map(() => []), done: false, topic: lesson.topicId };
}

// ---------------- Ma sói nhiều người ----------------
// Mỗi ghế là một người chơi trong làng (ghế thứ i = người chơi i). Bé nào giữ vai thì tự chọn, vai của bot do bot chọn;
// bé vắng mặt hoặc hết giờ thì máy chủ chọn hộ. Máy chủ giấu vai của người khác (trừ đồng đội sói và người đã rời làng).
function newWerewolf(r) {
  const s = W.newGame(r.seats.length, r.rnd);
  s.players.forEach((p, i) => { p.name = r.seats[i].name; p.human = !r.seats[i].bot; });
  s.log = [{ day: 1, who: null, text: { vi: '🌙 Màn đêm buông xuống — đêm thứ 1.', en: '🌙 Night falls — night 1.' }, kind: 'phase' }];
  const st = { ww: s, step: 'night', deadline: 0, plan: null, wolfVotes: {}, acted: {}, said: {}, ready: {}, votes: {}, victim: null };
  wwNight(r, st);
  return st;
}
const wwHumans = (r, st) => st.ww.players.filter((p) => p.alive && !r.seats[p.id].bot && !r.seats[p.id].left);
function wwNeeds(r, st) {
  const s = st.ww; const need = [];
  for (const p of wwHumans(r, st)) {
    if (st.step === 'night' && ['wolf', 'guard', 'seer'].includes(p.role)) need.push(p.id);
    if (st.step === 'witch' && p.role === 'witch') need.push(p.id);
    if (st.step === 'day' || st.step === 'vote') need.push(p.id);
  }
  return need.filter((id) => (st.step === 'day' ? !st.ready[id] : st.step === 'vote' ? !(id in st.votes) : !st.acted[id]));
}
function wwNight(r, st) {
  st.step = 'night'; st.acted = {}; st.wolfVotes = {}; st.plan = W.botNight(st.ww, r.rnd); st.victim = null;
  st.deadline = Date.now() + WW_SEC.night * 1000;
  if (!wwNeeds(r, st).length) wwAfterNight(r, st);
}
function wwAfterNight(r, st) {
  const s = st.ww; const a = W.alive(s); const plan = st.plan;
  const humanWolves = a.filter((p) => p.role === 'wolf' && !r.seats[p.id].bot);
  if (humanWolves.length) {
    const tally = {};
    for (const w of humanWolves) { const t = st.wolfVotes[w.id] ?? W.botWolfTarget(s, r.rnd); if (t != null) tally[t] = (tally[t] ?? 0) + 1; }
    const best = Object.entries(tally).sort((x, y) => y[1] - x[1])[0];
    plan.victim = best ? Number(best[0]) : null;
  }
  for (const p of a) {
    if (r.seats[p.id].bot) continue;
    if (p.role === 'guard' && plan.guard == null) plan.guard = W.botGuardPick(s, p.id, r.rnd);
    if (p.role === 'seer' && (!plan.check || plan.check.target == null)) plan.check = { seer: p.id, target: W.botSeerPick(s, p.id, r.rnd) };
  }
  const witch = a.find((p) => p.role === 'witch');
  st.victim = plan.victim;
  if (witch && !r.seats[witch.id].bot && !r.seats[witch.id].left && (s.potions.heal || s.potions.kill)) { st.step = 'witch'; st.acted = {}; st.deadline = Date.now() + WW_SEC.witch * 1000; return; }
  if (witch && (r.seats[witch.id].bot || r.seats[witch.id].left)) { const w = W.botWitch(s, witch.id, plan.victim, r.rnd); plan.heal = w.heal; plan.poison = w.poison; }
  wwResolveNight(r, st);
}
function wwResolveNight(r, st) {
  const { s } = W.resolveNight(st.ww, st.plan);
  st.ww = s;
  if (s.winner) return wwEnd(r, st);
  st.ww = W.dayTalk(st.ww, r.rnd);
  st.step = 'day'; st.ready = {}; st.said = {}; st.deadline = Date.now() + WW_SEC.day * 1000;
}
function wwVote(r, st) { st.step = 'vote'; st.votes = {}; st.deadline = Date.now() + WW_SEC.vote * 1000; }
function wwResolveVote(r, st) {
  const bots = W.botVotes(st.ww, r.rnd);
  for (const p of W.alive(st.ww)) if (!r.seats[p.id].bot && !(p.id in st.votes)) delete bots[p.id];
  const { s } = W.resolveVote(st.ww, { ...bots, ...st.votes });
  st.ww = s;
  if (s.winner) return wwEnd(r, st);
  wwNight(r, st);
}
function wwEnd(r, st) {
  st.step = 'end';
  const side = st.ww.winner;
  finish(r, st.ww.players.filter((p) => (p.role === 'wolf') === (side === 'wolf')).map((p) => p.id));
}
/** Hết giờ hoặc mọi bé đã chọn xong → sang bước tiếp. */
function wwAdvance(r, st, force = false) {
  if (r.status !== 'playing' || st.step === 'end') return;
  if (!force && wwNeeds(r, st).length && Date.now() < st.deadline) return;
  if (st.step === 'night') wwAfterNight(r, st);
  else if (st.step === 'witch') wwResolveNight(r, st);
  else if (st.step === 'day') wwVote(r, st);
  else if (st.step === 'vote') wwResolveVote(r, st);
  touch(r);
}
function wwAct(r, seat, a) {
  const st = r.state; const s = st.ww; const p = s.players[seat];
  if (!p.alive) throw new HttpError(409, 'ILLEGAL_MOVE');
  const target = a.target == null ? null : Number(a.target);
  const okT = (t, self = false) => t != null && s.players[t] && s.players[t].alive && (self || t !== seat);
  if (st.step === 'night') {
    if (p.role === 'wolf' && a.type === 'kill' && okT(target) && s.players[target].role !== 'wolf') st.wolfVotes[seat] = target;
    else if (p.role === 'guard' && a.type === 'guard' && okT(target, true) && target !== s.lastGuard) st.plan.guard = target;
    else if (p.role === 'seer' && a.type === 'check' && okT(target)) st.plan.check = { seer: seat, target };
    else throw new HttpError(409, 'ILLEGAL_MOVE');
    st.acted[seat] = true;
  } else if (st.step === 'witch') {
    if (p.role !== 'witch' || a.type !== 'witch') throw new HttpError(409, 'ILLEGAL_MOVE');
    st.plan.heal = !!a.heal && s.potions.heal && st.victim != null;
    st.plan.poison = a.poison != null && s.potions.kill && okT(Number(a.poison)) ? Number(a.poison) : null;
    st.acted[seat] = true;
  } else if (st.step === 'day') {
    if (a.type === 'say') {
      if ((st.said[seat] ?? 0) >= 2 || !okT(target) || !['accuse', 'clear', 'claimWolf', 'claimClean'].includes(a.kind)) throw new HttpError(409, 'ILLEGAL_MOVE');
      st.ww = W.humanSay(s, a.kind, target, seat); st.said[seat] = (st.said[seat] ?? 0) + 1;
    } else if (a.type === 'ready') st.ready[seat] = true;
    else throw new HttpError(409, 'ILLEGAL_MOVE');
  } else if (st.step === 'vote') {
    if (a.type !== 'vote' || (target != null && !okT(target))) throw new HttpError(409, 'ILLEGAL_MOVE');
    st.votes[seat] = target;
  } else throw new HttpError(409, 'GAME_OVER');
  wwAdvance(r, st);
}

// ---------------- Lượt đi ----------------
const cur = (r) => (r.game === 'cards' ? r.state.turn : r.game === 'ludo' ? r.state.turn : null);
const seatAuto = (r, i) => { const s = r.seats[i]; return s.bot || s.left; };
const offline = (r, i) => !r.seats[i].bot && Date.now() - r.seats[i].seen > OFFLINE_MS;

function pushLog(r, line) { r.log.push({ at: Date.now(), ...line }); if (r.log.length > 30) r.log.shift(); }

function apply(r, seat, a) {
  const s = r.state;
  if (r.game === 'cards') {
    if (s.winner !== null) throw new HttpError(409, 'GAME_OVER');
    if (s.turn !== seat) throw new HttpError(409, 'NOT_YOUR_TURN');
    let res;
    try {
      if (a.type === 'play') res = C.play(s, seat, Number(a.idx), C.COLORS.includes(a.color) ? a.color : null, !!a.called, r.rnd);
      else if (a.type === 'draw') res = C.draw(s, seat, r.rnd);
      else if (a.type === 'pass') res = C.pass(s, seat);
      else throw new Error('ILLEGAL');
    } catch (e) { if (e instanceof HttpError) throw e; throw new HttpError(409, 'ILLEGAL_MOVE'); }
    r.state = res.s;
    for (const e of res.events) pushLog(r, { seat: e.p, t: e.t, k: e.k, color: e.color, card: e.card });
    if (res.s.winner !== null) finish(r, [res.s.winner]);
  } else if (r.game === 'ludo') {
    if (s.winner != null) throw new HttpError(409, 'GAME_OVER');
    if (s.turn !== seat) throw new HttpError(409, 'NOT_YOUR_TURN');
    let res;
    try {
      if (a.type === 'roll') { const v = 1 + Math.floor(r.rnd() * 6); res = Lu.roll(s, v); pushLog(r, { seat, t: 'roll', v }); }
      else if (a.type === 'move') res = Lu.move(s, { piece: Number(a.piece) });
      else throw new Error('ILLEGAL');
    } catch (e) { if (e instanceof HttpError) throw e; throw new HttpError(409, 'ILLEGAL_MOVE'); }
    r.state = res.s;
    for (const e of res.events) pushLog(r, { seat, t: e.t, victim: e.victim != null ? r.state.seats.indexOf(e.victim) : undefined });
    if (res.s.winner != null) finish(r, [r.state.seats.indexOf(res.s.winner)]);
  } else if (r.game === 'quiz') {
    if (a.type !== 'answer') throw new HttpError(400, 'ILLEGAL_MOVE');
    quizAnswer(r, seat, Number(a.q), a.choice);
  } else if (RACE.has(r.game)) {
    if (a.type !== 'answer') throw new HttpError(400, 'ILLEGAL_MOVE');
    quizAnswer(r, seat, Number(a.q), a.given, true);
  } else if (r.game === 'werewolf') wwAct(r, seat, a);
  r.turnAt = Date.now();
  touch(r);
}

function quizAnswer(r, seat, q, choice, raw = false) {
  const st = r.state; const now = Date.now();
  if (st.done || now < st.startAt) throw new HttpError(409, 'ILLEGAL_MOVE');
  const mine = st.answers[seat];
  if (q !== mine.length || q >= st.rounds.length) throw new HttpError(409, 'ILLEGAL_MOVE');
  const round = st.rounds[q];
  // thi đố: chọn đáp án; minigame: máy chủ chấm lại đúng như khi chơi một mình (0..1 điểm)
  const quality = choice == null ? 0 : raw ? gradeRound(round, choice) : gradeRound(round, Number(choice));
  const ok = raw ? quality >= 0.5 : quality === 1;
  const started = q === 0 ? st.startAt : mine[q - 1].at;
  const ms = Math.max(0, now - started);
  const perQ = (st.perQ ?? QUIZ_SEC) * 1000;
  const pts = ok ? Math.round(100 * quality) + Math.max(0, Math.round(50 * (1 - ms / perQ))) : 0;
  mine.push({ choice: raw ? null : choice == null ? null : Number(choice), ok, pts, at: now });
  if (st.answers.every((a) => a.length >= st.rounds.length)) endQuiz(r);
}
function endQuiz(r) {
  const st = r.state; if (st.done) return;
  st.done = true;
  const score = st.answers.map((a) => a.reduce((x, y) => x + y.pts, 0));
  const best = Math.max(...score);
  finish(r, score.map((s, i) => (s === best ? i : -1)).filter((i) => i >= 0));
}

function finish(r, winners) {
  r.status = 'done'; r.result = { winners, at: Date.now() };
  clearTimeout(r.timer);
  if (!r.rewarded) {
    r.rewarded = true;
    const secs = Math.round((Date.now() - r.startedAt) / 1000);
    for (const [i, s] of r.seats.entries()) if (!s.bot && !s.left) hooks.onFinish(s.childId, r.game, secs, winners.includes(i)).then((coins) => { s.coins = coins; touch(r); }).catch(() => undefined);
  }
}

/** Bot (hoặc bot đi thay người vắng) đi một nước. */
function botStep(r, seat) {
  const s = r.state;
  if (r.game === 'cards') {
    const m = C.botMove(s, seat, seatAuto(r, seat) && r.seats[seat].bot ? r.opts.level : 'normal', r.rnd);
    apply(r, seat, m.type === 'play' ? { type: 'play', idx: m.idx, color: m.color, called: true } : m);
  } else if (r.game === 'ludo') {
    if (s.dice == null) apply(r, seat, { type: 'roll' });
    else { const m = Lu.botChoose(s, r.seats[seat].bot ? r.opts.level : 'normal', r.rnd); if (m) apply(r, seat, { type: 'move', piece: m.piece }); }
  }
}

/** Hẹn giờ cho bước tiếp theo: bot đi, người vắng thì đi hộ, thi đố thì bot trả lời và hết giờ. */
function schedule(r) {
  clearTimeout(r.timer);
  if (r.status !== 'playing') return;
  if (r.game === 'werewolf') {
    const st = r.state;
    if (Date.now() >= st.deadline) { wwAdvance(r, st, true); if (r.status !== 'playing') return; }
    r.timer = setTimeout(() => schedule(r), Math.max(200, Math.min(st.deadline - Date.now(), 2000)));
    return;
  }
  if (RACE.has(r.game)) {
    const st = r.state; const now = Date.now(); const perQ = (st.perQ ?? QUIZ_SEC) * 1000;
    if (now >= st.deadline) { // hết giờ: câu còn thiếu tính là sai
      for (const a of st.answers) while (a.length < st.rounds.length) a.push({ choice: null, ok: false, pts: 0, at: now });
      endQuiz(r); touch(r); return;
    }
    let next = st.deadline;
    for (const [i, a] of st.answers.entries()) {
      if (a.length >= st.rounds.length) continue;
      const since = a.length ? a[a.length - 1].at : st.startAt;
      if (r.seats[i].bot || r.seats[i].left) {
        const due = since + (r.seats[i].left ? 500 : Math.min(perQ * 0.8, 2500 + ((i * 7919 + a.length * 104729) % 5000) + (r.game === 'quiz' ? 0 : perQ * 0.15)));
        if (now >= due) {
          const smart = (r.opts.level === 'easy' ? 0.55 : 0.72) && !r.seats[i].left;
          botAnswer(r, i, a.length, r.rnd() < smart); touch(r);
          if (r.status !== 'playing') return;
        } else next = Math.min(next, due);
      } else if (now - since > perQ) { quizAnswer(r, i, a.length, null, r.game !== 'quiz'); touch(r); if (r.status !== 'playing') return; }
      else next = Math.min(next, since + perQ);
    }
    r.timer = setTimeout(() => schedule(r), Math.max(200, Math.min(next - Date.now(), 2000)));
    return;
  }
  const seat = cur(r);
  const auto = seatAuto(r, seat);
  const wait = auto ? BOT_MS : offline(r, seat) ? OFFLINE_TURN_MS : TURN_MS;
  const due = r.turnAt + wait;
  r.timer = setTimeout(() => {
    if (r.status !== 'playing' || cur(r) !== seat) return schedule(r);
    const stillWaiting = auto || Date.now() >= r.turnAt + (offline(r, seat) ? OFFLINE_TURN_MS : TURN_MS);
    if (stillWaiting) { try { botStep(r, seat); if (!auto) pushLog(r, { seat, t: 'auto' }); } catch { r.turnAt = Date.now(); } }
    schedule(r);
  }, Math.max(150, Math.min(due - Date.now(), 2000)));
}

/** Bot trả lời một vòng thi đua: đúng thì ghi điểm như người, sai thì 0 điểm. */
function botAnswer(r, seat, q, right) {
  const st = r.state; const round = st.rounds[q];
  if (r.game === 'quiz') return quizAnswer(r, seat, q, right ? round.answer : Math.floor(r.rnd() * round.options.length));
  const now = Date.now(); const mine = st.answers[seat];
  const started = q === 0 ? st.startAt : mine[q - 1].at;
  const perQ = st.perQ * 1000;
  mine.push({ choice: null, ok: right, pts: right ? 100 + Math.max(0, Math.round(50 * (1 - (now - started) / perQ))) : 0, at: now });
  if (st.answers.every((a) => a.length >= st.rounds.length)) endQuiz(r);
}

// ---------------- API cho trình duyệt ----------------
export function getRoom(me, id) {
  const { r, seat } = roomOf(id, me.id);
  r.seats[seat].seen = Date.now(); markSeen(me.id);
  return view(r, me.id);
}
export function actRoom(me, id, body = {}) {
  const { r, seat } = roomOf(id, me.id);
  if (r.status !== 'playing') throw new HttpError(409, 'GAME_OVER');
  r.seats[seat].seen = Date.now(); r.seats[seat].left = false;
  apply(r, seat, body);
  schedule(r);
  return view(r, me.id);
}

/** Trạng thái phòng nhìn từ ghế của một bé (giấu bài của người khác, giấu đáp án thi đố). */
function view(r, childId) {
  const me = r.seats.findIndex((s) => s.childId === childId);
  const seats = r.seats.map((s, i) => ({ name: s.name, look: s.look, bot: !!s.bot, botIdx: s.botIdx ?? null, you: i === me, host: s.childId === r.host, online: s.bot ? true : !s.left && Date.now() - (s.seen ?? 0) < OFFLINE_MS, left: !!s.left, coins: s.coins ?? null }));
  let state = null;
  if (r.state && r.game === 'cards') {
    const s = r.state;
    state = { ...s, deck: [], deckCount: s.deck.length, discard: s.discard.slice(-3), hands: s.hands.map((h, i) => (i === me || r.status === 'done' ? h : h.map((_, k) => ({ id: -1 - k, c: null, v: '?' })))) };
  }
  if (r.state && r.game === 'ludo') state = r.state;
  if (r.state && r.game === 'werewolf') state = wwView(r, me);
  if (r.state && RACE.has(r.game)) {
    const st = r.state; const mine = st.answers[me] ?? [];
    const reveal = st.done; const quiz = r.game === 'quiz';
    state = {
      startAt: st.startAt, deadline: st.deadline, perQ: st.perQ ?? QUIZ_SEC, total: st.rounds.length, done: st.done, now: Date.now(),
      // minigame cần cả dữ liệu vòng chơi để vẽ (máy chủ vẫn tự chấm lại); thi đố thì giấu đáp án
      question: mine.length < st.rounds.length && !st.done ? { index: mine.length, ...(quiz ? strip(st.rounds[mine.length]) : { round: st.rounds[mine.length] }) } : null,
      last: mine.length ? { ...mine[mine.length - 1], answer: quiz ? st.rounds[mine.length - 1].answer : null } : null,
      progress: st.answers.map((a) => ({ answered: a.length, correct: a.filter((x) => x.ok).length, score: a.reduce((x, y) => x + y.pts, 0) })),
      review: reveal && quiz ? st.rounds.map((q, i) => ({ prompt: q.prompt, options: q.options, answer: q.answer, mine: mine[i]?.choice ?? null })) : null,
    };
  }
  return { id: r.id, code: r.code, game: r.game, status: r.status, opts: r.opts, seats, mySeat: me, isHost: r.host === childId, version: r.version, state, result: r.result, log: (r.log ?? []).slice(-8), turnAt: r.turnAt, turnMs: TURN_MS, now: Date.now() };
}
/** Làng Ma sói nhìn từ ghế `me`: chỉ thấy vai của mình, đồng đội sói và người đã rời làng. */
function wwView(r, me) {
  const st = r.state; const s = st.ww; const my = s.players[me];
  const end = st.step === 'end';
  const known = (p) => end || p.id === me || !p.alive || (my?.role === 'wolf' && p.role === 'wolf');
  const players = s.players.map((p) => ({ id: p.id, name: p.name, alive: p.alive, role: known(p) ? p.role : null, claim: !!s.claims[p.id] }));
  const out = {
    day: s.day, step: st.step, deadline: st.deadline, now: Date.now(), winner: s.winner, players, me,
    log: s.log.filter((l) => l.kind !== 'clue').slice(-40),
    needs: wwNeeds(r, st).includes(me), waiting: wwNeeds(r, st).length,
    said: st.said[me] ?? 0, ready: Object.keys(st.ready).length, voted: Object.keys(st.votes).length, humans: wwHumans(r, st).length,
    myVote: st.step === 'vote' ? st.votes[me] ?? undefined : undefined,
  };
  if (my?.role === 'seer') out.checks = s.checks;
  if (my?.role === 'guard') out.lastGuard = s.lastGuard;
  if (my?.role === 'wolf') out.wolfVotes = st.step === 'night' ? st.wolfVotes : {};
  if (my?.role === 'witch') { out.potions = s.potions; if (st.step === 'witch') out.victim = st.victim; }
  if (end) out.roles = s.players.map((p) => p.role);
  return out;
}
const strip = (q) => ({ prompt: q.prompt, options: q.options, title: q.title ?? null, say: q.say ?? null, passage: q.passage ?? null });

// dọn phòng bỏ không
setInterval(() => { const now = Date.now(); for (const r of rooms.values()) if (now - r.updatedAt > IDLE_ROOM_MS || (r.status === 'done' && now - r.result.at > 10 * 60e3)) closeRoom(r); }, 60e3).unref();
export const _rooms = rooms; // cho kiểm thử
/** Cho kiểm thử: bot đi ngay một nước ở ghế đang tới lượt. */
export function _botStep(id) { const r = rooms.get(id); botStep(r, cur(r)); clearTimeout(r.timer); }
/** Cho kiểm thử: Ma sói sang bước tiếp ngay (như hết giờ). */
export function _wwAdvance(id) { const r = rooms.get(id); wwAdvance(r, r.state, true); clearTimeout(r.timer); }
