// Phòng chơi cùng bạn bè (Bài Màu Sắc, Cá ngựa, Thi đố). Ván chơi giữ trong bộ nhớ máy chủ và do máy chủ
// phân xử bằng chính bộ luật ở shared/board/ (không tin trình duyệt). Ghế trống có bot chơi thay;
// bạn nào rời đi hoặc để quá lâu không đi thì bot đi giúp để cả phòng không phải chờ.
// Trình duyệt hỏi trạng thái phòng khoảng mỗi giây (polling) nên chạy được trên mọi gói hosting.
import { randomBytes } from 'node:crypto';
import { HttpError } from './http.js';
import { makeRng, gradeRound } from '../shared/logic.js';
import * as C from '../shared/board/cards.js';
import * as Lu from '../shared/board/ludo.js';
import { buildRounds } from './rounds.js';
import { LESSONS, DEFAULT_LOOK, SUBJECTS } from './content/index.js';
import { relation, isBlocked, send } from './social.js';

export const ROOM_GAMES = { cards: { min: 2, max: 4 }, ludo: { min: 2, max: 4 }, quiz: { min: 2, max: 4 } };
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
  const max = Math.max(ROOM_GAMES[game].min, Math.min(ROOM_GAMES[game].max, Number(opts.players) || 4));
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
  if (r.seats.length >= r.opts.players) throw new HttpError(409, 'ROOM_FULL');
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
  const want = r.game === 'quiz' ? Math.max(2, r.seats.length) : r.opts.players;
  let k = 0;
  while (r.seats.length < want) r.seats.push({ childId: null, name: BOT_NAMES[k % 4], look: null, bot: true, botIdx: k++ });
  const n = r.seats.length;
  if (r.game === 'cards') r.state = C.newGame(n, r.rnd);
  if (r.game === 'ludo') r.state = Lu.newGame({ 2: [0, 2], 3: [0, 1, 2], 4: [0, 1, 2, 3] }[n], { exitOn: r.opts.exitOne ? [1, 6] : [6] });
  if (r.game === 'quiz') r.state = newQuiz(r);
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
  return { rounds, startAt, deadline: startAt + rounds.length * QUIZ_SEC * 1000 + 2000, answers: r.seats.map(() => []), done: false };
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
  }
  r.turnAt = Date.now();
  touch(r);
}

function quizAnswer(r, seat, q, choice) {
  const st = r.state; const now = Date.now();
  if (st.done || now < st.startAt) throw new HttpError(409, 'ILLEGAL_MOVE');
  const mine = st.answers[seat];
  if (q !== mine.length || q >= st.rounds.length) throw new HttpError(409, 'ILLEGAL_MOVE');
  const round = st.rounds[q];
  const ok = choice != null && gradeRound(round, Number(choice)) === 1;
  const started = q === 0 ? st.startAt : mine[q - 1].at;
  const ms = Math.max(0, now - started);
  const pts = ok ? 100 + Math.max(0, Math.round(50 * (1 - ms / (QUIZ_SEC * 1000)))) : 0;
  mine.push({ choice: choice == null ? null : Number(choice), ok, pts, at: now });
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
  if (r.game === 'quiz') {
    const st = r.state; const now = Date.now();
    if (now >= st.deadline) { // hết giờ: câu còn thiếu tính là sai
      for (const a of st.answers) while (a.length < st.rounds.length) a.push({ choice: null, ok: false, pts: 0, at: now });
      endQuiz(r); touch(r); return;
    }
    let next = st.deadline;
    for (const [i, a] of st.answers.entries()) {
      if (a.length >= st.rounds.length) continue;
      const since = a.length ? a[a.length - 1].at : st.startAt;
      if (r.seats[i].bot || r.seats[i].left) {
        const due = since + (r.seats[i].left ? 500 : 2500 + ((i * 7919 + a.length * 104729) % 5000));
        if (now >= due) {
          const q = st.rounds[a.length];
          const smart = r.opts.level === 'easy' ? 0.55 : 0.72;
          const choice = r.rnd() < smart && !r.seats[i].left ? q.answer : Math.floor(r.rnd() * q.options.length);
          quizAnswer(r, i, a.length, choice); touch(r);
          if (r.status !== 'playing') return;
        } else next = Math.min(next, due);
      } else if (now - since > QUIZ_SEC * 1000) { quizAnswer(r, i, a.length, null); touch(r); if (r.status !== 'playing') return; }
      else next = Math.min(next, since + QUIZ_SEC * 1000);
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

// ---------------- API cho trình duyệt ----------------
export function getRoom(me, id) {
  const { r, seat } = roomOf(id, me.id);
  r.seats[seat].seen = Date.now();
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
  if (r.state && r.game === 'quiz') {
    const st = r.state; const mine = st.answers[me] ?? [];
    const reveal = st.done;
    state = {
      startAt: st.startAt, deadline: st.deadline, perQ: QUIZ_SEC, total: st.rounds.length, done: st.done, now: Date.now(),
      question: mine.length < st.rounds.length && !st.done ? { index: mine.length, ...strip(st.rounds[mine.length]) } : null,
      last: mine.length ? { ...mine[mine.length - 1], answer: st.rounds[mine.length - 1].answer } : null,
      progress: st.answers.map((a) => ({ answered: a.length, correct: a.filter((x) => x.ok).length, score: a.reduce((x, y) => x + y.pts, 0) })),
      review: reveal ? st.rounds.map((q, i) => ({ prompt: q.prompt, options: q.options, answer: q.answer, mine: mine[i]?.choice ?? null })) : null,
    };
  }
  return { id: r.id, code: r.code, game: r.game, status: r.status, opts: r.opts, seats, mySeat: me, isHost: r.host === childId, version: r.version, state, result: r.result, log: (r.log ?? []).slice(-8), turnAt: r.turnAt, turnMs: TURN_MS, now: Date.now() };
}
const strip = (q) => ({ prompt: q.prompt, options: q.options, title: q.title ?? null, say: q.say ?? null, passage: q.passage ?? null });

// dọn phòng bỏ không
setInterval(() => { const now = Date.now(); for (const r of rooms.values()) if (now - r.updatedAt > IDLE_ROOM_MS || (r.status === 'done' && now - r.result.at > 10 * 60e3)) closeRoom(r); }, 60e3).unref();
export const _rooms = rooms; // cho kiểm thử
/** Cho kiểm thử: bot đi ngay một nước ở ghế đang tới lượt. */
export function _botStep(id) { const r = rooms.get(id); botStep(r, cur(r)); clearTimeout(r.timer); }
