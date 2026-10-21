// Nghiệp vụ game: tiến độ, năng lượng, phiên chơi, chấm điểm, phần thưởng, nhiệm vụ, huy hiệu, báo cáo.
import { randomBytes } from 'node:crypto';
import { HttpError } from './http.js';
import { buildRounds } from './rounds.js';
import './arcade.js'; // đăng ký các bài Khu vui chơi vào lessonById
import { computeRewards, currentEnergy, gradeRound, levelInfo, makeRng, shuffle, ageThemeForGrade, MAX_ENERGY } from '../shared/logic.js';
import { BADGES, BOY_LOOK, CHECKIN_REWARDS, COLLECTIONS, COMBOS, DEFAULT_LOOK, FREE_ITEMS, GAME_INFO, LESSONS, QUEST_POOL, SHOP, SUBJECTS, TOPICS, comboById, lessonById, lessonsFor, shopById, topicById } from './content/index.js';
import { GIFT_COINS, activeEvents, comboPrice, forSale, giftKey, itemPrice, nextEvent } from '../shared/shop.js';

const TZ = process.env.TZ_GAME || 'Asia/Ho_Chi_Minh';
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false });
export const dayKey = (ms = Date.now()) => dayFmt.format(new Date(ms));
const prevDay = (day) => dayKey(new Date(`${day}T12:00:00Z`).getTime() - 864e5);
const json = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };
const hashStr = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

// DEMO_UNLOCK=1: mở khoá mọi màn (dùng để trình diễn / giáo viên xem trước nội dung)
const DEMO_UNLOCK = process.env.DEMO_UNLOCK === '1';

export const DEFAULT_SETTINGS = { dailyLimitMin: 60, energy: true, leaderboard: true, social: true, publicBoard: true, gifts: true };

// ---------------- Hồ sơ bé ----------------
export async function getChild(db, parentId, childId) {
  const row = (await db.prepare('SELECT * FROM children WHERE id = ? AND parent_id = ?').get(Number(childId), parentId));
  if (!row) throw new HttpError(404, 'CHILD_NOT_FOUND');
  return row;
}
export function publicChild(row) {
  return { id: row.id, nickname: row.nickname, grade: row.grade, ageTheme: ageThemeForGrade(row.grade), look: { ...DEFAULT_LOOK, ...json(row.look, {}) }, settings: { ...DEFAULT_SETTINGS, ...json(row.settings, {}) } };
}
const BLOCK = ['đần', 'ngu', 'chết', 'địt', 'đụ', 'lồn', 'cặc', 'fuck', 'shit', 'bitch', 'damn', 'sex'];
export function cleanNickname(s) {
  const n = String(s ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, 12);
  if (n.length < 1) throw new HttpError(400, 'NICKNAME_REQUIRED');
  const low = n.toLocaleLowerCase('vi');
  if (BLOCK.some((w) => low.includes(w))) throw new HttpError(400, 'NICKNAME_NOT_ALLOWED');
  return n;
}
export async function createChild(db, parentId, { nickname, grade, look }) {
  const count = (await db.prepare('SELECT COUNT(*) n FROM children WHERE parent_id = ?').get(parentId)).n;
  if (count >= 4) throw new HttpError(400, 'MAX_CHILDREN');
  const g = Math.min(9, Math.max(1, Number(grade) || 1));
  const base = look?.gender === 'boy' ? BOY_LOOK : DEFAULT_LOOK;
  const safeLook = sanitizeLook({ ...base, ...(look ?? {}) }, FREE_ITEMS);
  const r = (await db.prepare('INSERT INTO children (parent_id, nickname, grade, look, settings, energy_at, owned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(parentId, cleanNickname(nickname), g, JSON.stringify(safeLook), JSON.stringify(DEFAULT_SETTINGS), Date.now(), JSON.stringify(FREE_ITEMS), Date.now()));
  return (await getChild(db, parentId, r.lastInsertRowid));
}
/** Bậc tiến hoá thú cưng (khớp client/src/ui/Chibi.tsx → petStage). */
export const petStage = (xp = 0) => (xp >= 120 ? 2 : xp >= 30 ? 1 : 0);
/** Cho thú cưng ăn: mỗi ngày một lần, +2 điểm thân thiết. Không bao giờ bị trừ hay "đói" khi bé nghỉ. */
export async function feedPet(db, child) {
  const lk = { ...DEFAULT_LOOK, ...json(child.look, {}) };
  if (!lk.pet || lk.pet === 'none') throw new HttpError(409, 'NO_PET');
  const today = dayKey();
  if (lk.petFed === today) throw new HttpError(409, 'PET_FED');
  const before = Number(lk.petXp) || 0;
  lk.petXp = before + 2; lk.petFed = today;
  const r = await db.prepare('UPDATE children SET look = ? WHERE id = ? AND look = ?').run(JSON.stringify(lk), child.id, child.look);
  if (!r.changes) throw new HttpError(409, 'PET_FED');
  const fresh = await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id);
  return { state: await stateOf(db, fresh), grew: petStage(lk.petXp) > petStage(before) };
}
/** Tên thú cưng: như biệt danh (lọc từ xấu), chỉ chữ/số/khoảng trắng, không chứa dãy số dài (số điện thoại). */
export function cleanPetName(s) {
  if (s == null || String(s).trim() === '') return null;
  const n = cleanNickname(s);
  if (!/^[\p{L}\p{N} ]+$/u.test(n) || /\d{4,}/.test(n)) throw new HttpError(400, 'NICKNAME_NOT_ALLOWED');
  return n;
}
/**
 * Chỉ cho phép mặc đồ đã sở hữu. `stored` = dáng đang lưu: các trường máy chủ tự quản (điểm thân thiết của thú cưng,
 * ngày cho ăn) luôn lấy từ đây, không nhận từ trình duyệt.
 */
function sanitizeLook(look, owned, stored = DEFAULT_LOOK) {
  const out = { ...DEFAULT_LOOK, gender: stored.gender ?? 'girl', petName: stored.petName ?? null, petXp: Number(stored.petXp) || 0, petFed: stored.petFed ?? null };
  // dáng đang lưu trước (món không hợp lệ thì giữ món cũ), rồi tới thay đổi mới
  for (const src of [stored === DEFAULT_LOOK ? null : stored, look]) if (src && typeof src === 'object') {
    for (const [slot, value] of Object.entries(src)) {
      if (slot === 'skin' && /^#[0-9a-fA-F]{6}$/.test(String(value))) { out.skin = value; continue; }
      if (slot === 'gender') { if (value === 'boy' || value === 'girl') out.gender = value; continue; }
      if (slot === 'petName') { if (src === look) out.petName = cleanPetName(value); continue; }
      if (slot === 'petXp' || slot === 'petFed') continue;
      const item = SHOP.find((s) => s.slot === slot && s.value === value);
      if (item && (item.price === 0 || owned.includes(item.id))) out[slot] = value;
    }
  }
  return out;
}

// ---------------- Trạng thái tổng hợp ----------------
async function ensureQuests(db, child, day) {
  let rows = (await db.prepare('SELECT * FROM quests WHERE child_id = ? AND day = ?').all(child.id, day));
  if (rows.length === 0) {
    const rnd = makeRng(hashStr(`${child.id}:${day}`));
    const picks = shuffle(rnd, QUEST_POOL).filter((q, i, arr) => arr.findIndex((x) => x.type === q.type) === i).slice(0, 3);
    for (const q of picks) await db.prepare('INSERT OR IGNORE INTO quests (child_id, day, quest_id) VALUES (?, ?, ?)').run(child.id, day, q.id);
    rows = (await db.prepare('SELECT * FROM quests WHERE child_id = ? AND day = ?').all(child.id, day));
  }
  return rows.map((r) => { const q = QUEST_POOL.find((x) => x.id === r.quest_id); return { id: q.id, name: q.name, target: q.target, coins: q.coins, progress: Math.min(r.progress, q.target), done: r.progress >= q.target, claimed: !!r.claimed }; });
}

// ---------------- Điểm danh ----------------
/** Trạng thái điểm danh: đã điểm danh hôm nay chưa, đang ở ngày mấy của chuỗi 7 ngày. */
export async function checkinInfo(db, child, today = dayKey()) {
  const last = await db.prepare('SELECT * FROM checkins WHERE child_id = ? ORDER BY day DESC LIMIT 1').get(child.id);
  const total = Number((await db.prepare('SELECT COUNT(*) n FROM checkins WHERE child_id = ?').get(child.id)).n);
  const doneToday = last?.day === today;
  const chained = !!last && (doneToday || last.day === prevDay(today));
  // claimed = số ô đã đóng dấu trong tuần hiện tại; nextSeq = ô sẽ nhận hôm nay (null nếu đã nhận)
  let claimed = chained ? Number(last.seq) : 0;
  if (!doneToday && claimed >= 7) claimed = 0;
  return {
    today: doneToday, claimed, nextSeq: doneToday ? null : claimed + 1, total,
    last: doneToday ? { coins: Number(last.coins), energy: Number(last.energy), item: last.item ?? null } : null,
    rewards: CHECKIN_REWARDS.map((r) => ({ day: r.day, coins: r.coins, energy: r.energy, gift: !!r.gift })),
  };
}

export async function doCheckin(db, child) {
  const today = dayKey();
  const info = await checkinInfo(db, child, today);
  if (info.today) throw new HttpError(409, 'ALREADY_CHECKED_IN');
  const seq = info.nextSeq;
  const rw = CHECKIN_REWARDS[seq - 1];
  const owned = json(child.owned, FREE_ITEMS);
  let item = null, coins = rw.coins;
  if (rw.gift) {
    const pool = SHOP.filter((i) => i.price > 0 && i.price <= 200 && !i.limited && !owned.includes(i.id));
    if (pool.length) item = pool[Math.floor(Math.random() * pool.length)];
    else coins += 100;
  }
  // INSERT OR IGNORE + kiểm tra changes → bấm 2 lần cùng lúc cũng chỉ nhận quà 1 lần
  const ins = await db.prepare('INSERT OR IGNORE INTO checkins (child_id, day, seq, coins, energy, item) VALUES (?, ?, ?, ?, ?, ?)').run(child.id, today, seq, coins, rw.energy, item?.id ?? null);
  if (!ins.changes) throw new HttpError(409, 'ALREADY_CHECKED_IN');
  const en = currentEnergy(child.energy, child.energy_at, Date.now());
  const energy = Math.min(MAX_ENERGY, en.value + rw.energy);
  if (item) owned.push(item.id);
  await db.prepare('UPDATE children SET coins = coins + ?, energy = ?, energy_at = ?, owned = ?, chest_date = ? WHERE id = ?')
    .run(coins, energy, energy >= MAX_ENERGY ? Date.now() : en.updatedAt, JSON.stringify(owned), today, child.id);
  const newBadges = await awardBadges(db, child.id);
  const fresh = await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id);
  return { day: seq, coins, energy: rw.energy, item: item ? { id: item.id, slot: item.slot, value: item.value, name: item.name } : null, newBadges, state: await stateOf(db, fresh) };
}

export async function stateOf(db, child) {
  const now = Date.now(); const today = dayKey(now);
  const settings = { ...DEFAULT_SETTINGS, ...json(child.settings, {}) };
  const en = currentEnergy(child.energy, child.energy_at, now);
  const streak = child.streak_date === today || child.streak_date === prevDay(today) ? child.streak : 0;
  const stars = (await db.prepare('SELECT COALESCE(SUM(stars),0) s FROM lesson_progress WHERE child_id = ?').get(child.id)).s;
  const todayStats = (await db.prepare('SELECT * FROM daily_stats WHERE child_id = ? AND day = ?').get(child.id, today)) ?? { seconds: 0 };
  return {
    child: publicChild(child),
    coins: child.coins, xp: child.xp, level: levelInfo(child.xp), stars,
    energy: { value: settings.energy ? en.value : MAX_ENERGY, max: MAX_ENERGY, nextInMs: settings.energy ? en.nextInMs : 0, enabled: settings.energy },
    streak, chestAvailable: child.chest_date !== today,
    checkin: await checkinInfo(db, child, today),
    quests: (await ensureQuests(db, child, today)),
    badges: (await db.prepare('SELECT badge_id FROM badges WHERE child_id = ?').all(child.id)).map((r) => r.badge_id),
    owned: [...new Set([...FREE_ITEMS, ...json(child.owned, [])])],
    today: { minutes: Math.floor(todayStats.seconds / 60), limit: settings.dailyLimitMin },
    events: eventsFor(child, today),
  };
}
/** Các dịp lễ đang diễn ra (kèm đã nhận quà chưa) + dịp lễ sắp tới. */
function eventsFor(child, today) {
  const owned = json(child.owned, []);
  return { active: activeEvents(today).map((e) => ({ ...e, claimed: owned.includes(giftKey(e)) })), next: nextEvent(today), today };
}

// ---------------- Bản đồ màn chơi ----------------
export async function mapOf(db, child, subject, grade) {
  if (!SUBJECTS.some((s) => s.id === subject)) throw new HttpError(400, 'BAD_SUBJECT');
  const g = Math.min(9, Math.max(1, Number(grade) || child.grade));
  const lessons = lessonsFor(subject, g);
  const prog = new Map((await db.prepare('SELECT * FROM lesson_progress WHERE child_id = ?').all(child.id)).map((r) => [r.lesson_id, r]));
  let prevDone = true;
  const nodes = lessons.map((l, i) => {
    const p = prog.get(l.id);
    const done = !!p && (l.kind === 'chest' ? p.attempts > 0 : p.stars >= 1);
    const node = { id: l.id, index: i + 1, topicId: l.topicId, game: l.game, kind: l.kind, name: GAME_INFO[l.game].name, stars: p?.stars ?? 0, done, unlocked: prevDone || DEMO_UNLOCK, coins: l.coins, tier: l.tier ?? null };
    prevDone = done;
    return node;
  });
  const topics = TOPICS.filter((t) => t.subject === subject && t.grade === g).map((t) => ({ id: t.id, title: t.title, practice: !!t.practice }));
  const current = nodes.find((n) => n.unlocked && !n.done)?.id ?? null;
  return { subject, grade: g, topics, nodes, current };
}

/** Màn tiếp theo gợi ý ở sảnh: môn có tiến độ thấp nhất của lớp hiện tại. */
export async function nextUp(db, child) {
  let best = null;
  for (const s of SUBJECTS) {
    const m = (await mapOf(db, child, s.id, child.grade));
    const done = m.nodes.filter((n) => n.done).length;
    const node = m.nodes.find((n) => n.id === m.current);
    const item = { subject: s.id, done, total: m.nodes.length, lesson: node ? { id: node.id, index: node.index, game: node.game, kind: node.kind, name: node.name } : null, topic: node ? topicById.get(node.topicId).title : null };
    if (node && (!best || done / m.nodes.length < best.done / best.total)) best = item;
  }
  return best;
}

// ---------------- Phiên chơi ----------------
export async function startSession(db, child, lessonId) {
  const lesson = lessonById.get(lessonId);
  if (!lesson || lesson.kind === 'chest') throw new HttpError(404, 'LESSON_NOT_FOUND');
  let node;
  if (lesson.kind === 'arcade') {
    // Khu vui chơi: luôn mở, không cần qua màn trước
    const p = await db.prepare('SELECT stars FROM lesson_progress WHERE child_id = ? AND lesson_id = ?').get(child.id, lesson.id);
    node = { index: 1, stars: p?.stars ?? 0 };
  } else {
    const map = (await mapOf(db, child, lesson.subject, lesson.grade));
    node = map.nodes.find((n) => n.id === lessonId);
    if (!node.unlocked) throw new HttpError(403, 'LESSON_LOCKED');
  }
  const st = (await stateOf(db, child));
  if (st.today.limit > 0 && st.today.minutes >= st.today.limit) throw new HttpError(423, 'DAILY_LIMIT');
  if (st.energy.enabled) {
    const en = currentEnergy(child.energy, child.energy_at, Date.now());
    if (en.value < 1) throw new HttpError(409, 'NO_ENERGY');
    const wasFull = en.value >= MAX_ENERGY;
    (await db.prepare('UPDATE children SET energy = ?, energy_at = ? WHERE id = ?').run(en.value - 1, wasFull ? Date.now() : en.updatedAt, child.id));
  }
  const seed = randomBytes(4).readUInt32LE(0);
  const { game, rounds } = buildRounds(lesson, seed);
  const id = randomBytes(12).toString('base64url');
  (await db.prepare('INSERT INTO play_sessions (id, child_id, lesson_id, subject, game, rounds, started_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, child.id, lesson.id, lesson.subject, game, JSON.stringify(rounds), Date.now()));
  const topic = topicById.get(lesson.topicId);
  return {
    sessionId: id, game, rounds,
    lesson: { id: lesson.id, index: node.index, subject: lesson.subject, grade: lesson.grade, kind: lesson.kind, hearts: lesson.hearts, name: GAME_INFO[game].name, topic: topic.title, coins: lesson.coins, prevStars: node.stars },
  };
}

async function bump(db, childId, day, fields) {
  (await db.prepare('INSERT OR IGNORE INTO daily_stats (child_id, day) VALUES (?, ?)').run(childId, day));
  (await db.prepare('UPDATE daily_stats SET seconds = seconds + ?, correct = correct + ?, answered = answered + ?, lessons = lessons + ? WHERE child_id = ? AND day = ?')
    .run(fields.seconds ?? 0, fields.correct ?? 0, fields.answered ?? 0, fields.lessons ?? 0, childId, day));
}
async function advanceQuests(db, child, day, ev) {
  (await ensureQuests(db, child, day));
  for (const r of (await db.prepare('SELECT * FROM quests WHERE child_id = ? AND day = ?').all(child.id, day))) {
    const q = QUEST_POOL.find((x) => x.id === r.quest_id);
    let inc = 0;
    if (q.type === 'correct') inc = ev.correct;
    else if (q.type === 'lessons') inc = ev.passed ? 1 : 0;
    else if (q.type === 'threeStars') inc = ev.stars === 3 ? 1 : 0;
    else if (q.type === 'minutes') { const s = (await db.prepare('SELECT seconds FROM daily_stats WHERE child_id = ? AND day = ?').get(child.id, day)); (await db.prepare('UPDATE quests SET progress = ? WHERE child_id = ? AND day = ? AND quest_id = ?').run(Math.floor((s?.seconds ?? 0) / 60), child.id, day, q.id)); continue; }
    else if (q.type === `subject:${ev.subject}`) inc = 1;
    if (inc) (await db.prepare('UPDATE quests SET progress = progress + ? WHERE child_id = ? AND day = ? AND quest_id = ?').run(inc, child.id, day, q.id));
  }
}

// ---------------- Trò chơi cùng bot (bài màu sắc, cá ngựa, ma sói) ----------------
// Chơi hoàn toàn trên trình duyệt; máy chủ chỉ ghi thời gian chơi (tính vào giới hạn giờ mỗi ngày)
// và thưởng ít xu cho ván chơi thật (≥ 1 phút), tối đa BOARD_REWARDS ván mỗi ngày.
export const BOARD_GAMES = ['cards', 'ludo', 'werewolf', 'quiz'];
const BOARD_REWARDS = 5;
export async function finishBoard(db, child, body = {}) {
  const game = String(body.game ?? '');
  if (!BOARD_GAMES.includes(game)) throw new HttpError(400, 'BAD_GAME');
  const seconds = Math.max(0, Math.min(1800, Math.round(Number(body.seconds) || 0)));
  const day = dayKey();
  await bump(db, child.id, day, { seconds });
  let coins = 0;
  if (seconds >= 60) {
    const key = `board:${child.id}:${day}`;
    const row = await db.prepare('SELECT n FROM rate_limits WHERE key = ?').get(key);
    if ((row?.n ?? 0) < BOARD_REWARDS) {
      coins = body.won ? 6 : 2;
      await db.prepare('INSERT INTO rate_limits (key, n, t) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET n = n + 1').run(key, Date.now());
      await db.prepare('UPDATE children SET coins = coins + ? WHERE id = ?').run(coins, child.id);
    }
  }
  await advanceQuests(db, child, day, { correct: 0, passed: false, stars: 0, subject: null });
  const fresh = await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id);
  return { coins, state: await stateOf(db, fresh) };
}

export async function statsFor(db, child) {
  const rows = (await db.prepare('SELECT lesson_id, stars FROM lesson_progress WHERE child_id = ? AND stars >= 1').all(child.id));
  const bySubject = { math: 0, vietnamese: 0, english: 0, science: 0 };
  let threeStars = 0, bossDone = 0, perfectBoss = 0;
  for (const r of rows) {
    const l = lessonById.get(r.lesson_id); if (!l || l.kind === 'chest' || l.kind === 'arcade') continue;
    bySubject[l.subject]++;
    if (r.stars === 3) threeStars++;
    if (l.kind === 'boss') { bossDone++; if (r.stars === 3) perfectBoss++; }
  }
  const tot = (await db.prepare('SELECT COALESCE(SUM(correct),0) c FROM daily_stats WHERE child_id = ?').get(child.id)).c;
  const morning = (await db.prepare('SELECT finished_at FROM play_sessions WHERE child_id = ? AND finished_at IS NOT NULL AND stars >= 1').all(child.id)).filter((r) => Number(hourFmt.format(new Date(r.finished_at))) < 9).length;
  const owned = json(child.owned, FREE_ITEMS);
  const checkins = Number((await db.prepare('SELECT COUNT(*) n FROM checkins WHERE child_id = ?').get(child.id)).n);
  return { checkins, lessonsDone: Object.values(bySubject).reduce((a, b) => a + b, 0), bySubject, threeStars, bossDone, perfectBoss, correctTotal: tot, streak: child.streak, level: levelInfo(child.xp).level, coins: child.coins, bought: owned.filter((id) => shopById.has(id) && !FREE_ITEMS.includes(id)).length, combos: COMBOS.filter((c) => c.items.every((i) => FREE_ITEMS.includes(i) || owned.includes(i))).length, gifts: owned.filter((id) => id.startsWith('gift:')).length, morning };
}
async function awardBadges(db, childId) {
  const child = (await db.prepare('SELECT * FROM children WHERE id = ?').get(childId));
  const s = (await statsFor(db, child));
  const have = new Set((await db.prepare('SELECT badge_id FROM badges WHERE child_id = ?').all(childId)).map((r) => r.badge_id));
  const fresh = BADGES.filter((b) => !have.has(b.id) && b.cond(s));
  for (const b of fresh) await db.prepare('INSERT OR IGNORE INTO badges (child_id, badge_id, earned_at) VALUES (?, ?, ?)').run(childId, b.id, Date.now());
  return fresh.map((b) => ({ id: b.id, icon: b.icon, name: b.name, desc: b.desc }));
}

/**
 * Kết thúc phiên: server tự chấm lại từng câu trả lời → không tin điểm do client gửi.
 * body = { answers: [{ round: 'r0', given }], maxCombo, durationSec }
 */
export async function finishSession(db, child, sessionId, body) {
  const s = (await db.prepare('SELECT * FROM play_sessions WHERE id = ? AND child_id = ?').get(sessionId, child.id));
  if (!s) throw new HttpError(404, 'SESSION_NOT_FOUND');
  if (s.finished_at) throw new HttpError(409, 'SESSION_FINISHED');
  const rounds = json(s.rounds, []);
  const given = new Map((Array.isArray(body?.answers) ? body.answers : []).map((a) => [String(a.round), a.given]));
  const qualities = rounds.map((r) => (given.has(r.id) ? gradeRound(r, given.get(r.id)) : 0));
  // combo do server tự tính từ thứ tự câu
  let combo = 0, maxCombo = 0;
  for (const q of qualities) { combo = q >= 0.5 ? combo + 1 : 0; maxCombo = Math.max(maxCombo, combo); }
  const lesson = lessonById.get(s.lesson_id);
  const prev = (await db.prepare('SELECT * FROM lesson_progress WHERE child_id = ? AND lesson_id = ?').get(child.id, lesson.id));
  const prevStars = prev?.stars ?? 0;
  const rw = computeRewards({ qualities, maxCombo, baseCoins: lesson.coins, baseXp: lesson.xp, prevStars });
  const now = Date.now();
  const elapsed = Math.round((now - s.started_at) / 1000);
  const durationSec = Math.max(1, Math.min(elapsed + 5, Number(body?.durationSec) || elapsed, 60 * 30));
  const before = levelInfo(child.xp).level;
  const day = dayKey(now);
  let petBefore = null, petAfter = null;

  await db.tx(async (t) => {
    (await t.prepare('UPDATE play_sessions SET finished_at = ?, correct = ?, total = ?, stars = ?, coins = ?, xp = ?, duration_sec = ? WHERE id = ?')
      .run(now, rw.correct, rw.total, rw.stars, rw.coins, rw.xp, durationSec, s.id));
    const score = Math.round(rw.accuracy * 100);
    (await t.prepare(`INSERT INTO lesson_progress (child_id, lesson_id, stars, best, attempts, completed_at) VALUES (?, ?, ?, ?, 1, ?)
      ON CONFLICT(child_id, lesson_id) DO UPDATE SET stars = MAX(stars, excluded.stars), best = MAX(best, excluded.best), attempts = attempts + 1, completed_at = COALESCE(completed_at, excluded.completed_at)`)
      .run(child.id, lesson.id, rw.stars, score, rw.stars >= 1 ? now : null));
    // chuỗi ngày học
    let streak = child.streak, sdate = child.streak_date;
    if (rw.stars >= 1 && sdate !== day) { streak = sdate === prevDay(day) ? streak + 1 : 1; sdate = day; }
    (await t.prepare('UPDATE children SET coins = coins + ?, xp = xp + ?, streak = ?, streak_date = ? WHERE id = ?').run(rw.coins, rw.xp, streak, sdate, child.id));
    (await bump(t, child.id, day, { seconds: durationSec, correct: rw.correct, answered: rw.total, lessons: rw.stars >= 1 ? 1 : 0 }));
    (await advanceQuests(t, child, day, { correct: rw.correct, passed: rw.stars >= 1, stars: rw.stars, subject: lesson.subject }));
    // thú cưng đang dẫn theo lớn lên theo số sao bé học được
    if (rw.stars > 0) {
      const row = await t.prepare('SELECT look FROM children WHERE id = ?').get(child.id);
      const lk = json(row.look, {});
      if (lk.pet && lk.pet !== 'none') { petBefore = Number(lk.petXp) || 0; lk.petXp = petBefore + rw.stars; await t.prepare('UPDATE children SET look = ? WHERE id = ?').run(JSON.stringify(lk), child.id); petAfter = lk.petXp; }
    }
  });

  const newBadges = (await awardBadges(db, child.id));
  const fresh = (await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id));
  const after = levelInfo(fresh.xp).level;
  let next = null;
  if (lesson.kind !== 'arcade') {
    const map = (await mapOf(db, fresh, lesson.subject, lesson.grade));
    const idx = map.nodes.findIndex((n) => n.id === lesson.id);
    next = map.nodes.slice(idx + 1).find((n) => n.unlocked && !n.done) ?? null;
  }
  return {
    ...rw, prevStars, maxCombo, durationSec, levelUp: after > before ? after : null, newBadges,
    pet: petAfter != null ? { before: petBefore, after: petAfter, grew: petStage(petAfter) > petStage(petBefore) } : null,
    review: rounds.map((r, i) => ({ id: r.id, q: qualities[i] })),
    next: next ? { id: next.id, kind: next.kind } : null,
    state: (await stateOf(db, fresh)),
  };
}

/** Mở rương trên bản đồ (một lần, sau khi qua màn trước). */
export async function openMapChest(db, child, lessonId) {
  const lesson = lessonById.get(lessonId);
  if (!lesson || lesson.kind !== 'chest') throw new HttpError(404, 'CHEST_NOT_FOUND');
  const node = (await mapOf(db, child, lesson.subject, lesson.grade)).nodes.find((n) => n.id === lessonId);
  if (!node.unlocked) throw new HttpError(403, 'LESSON_LOCKED');
  if (node.done) throw new HttpError(409, 'ALREADY_OPENED');
  const coins = lesson.coins + Math.floor(Math.random() * 11);
  (await db.prepare('INSERT INTO lesson_progress (child_id, lesson_id, stars, best, attempts, completed_at) VALUES (?, ?, 0, 0, 1, ?) ON CONFLICT DO NOTHING').run(child.id, lessonId, Date.now()));
  (await db.prepare('UPDATE children SET coins = coins + ? WHERE id = ?').run(coins, child.id));
  const fresh = (await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id));
  return { coins, state: (await stateOf(db, fresh)) };
}

export async function claimQuest(db, child, questId) {
  const day = dayKey();
  (await ensureQuests(db, child, day));
  const r = (await db.prepare('SELECT * FROM quests WHERE child_id = ? AND day = ? AND quest_id = ?').get(child.id, day, questId));
  const q = QUEST_POOL.find((x) => x.id === questId);
  if (!r || !q) throw new HttpError(404, 'QUEST_NOT_FOUND');
  if (r.claimed) throw new HttpError(409, 'ALREADY_CLAIMED');
  if (r.progress < q.target) throw new HttpError(409, 'QUEST_NOT_DONE');
  (await db.prepare('UPDATE quests SET claimed = 1 WHERE child_id = ? AND day = ? AND quest_id = ?').run(child.id, day, questId));
  (await db.prepare('UPDATE children SET coins = coins + ? WHERE id = ?').run(q.coins, child.id));
  const fresh = (await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id));
  return { coins: q.coins, state: (await stateOf(db, fresh)) };
}

// ---------------- Cửa hàng & trang phục ----------------
export async function buyItem(db, child, itemId) {
  const item = shopById.get(itemId);
  if (!item) throw new HttpError(404, 'ITEM_NOT_FOUND');
  const owned = json(child.owned, FREE_ITEMS);
  if (owned.includes(itemId) || item.price === 0) throw new HttpError(409, 'ALREADY_OWNED');
  const events = activeEvents(dayKey());
  if (!forSale(item, events)) throw new HttpError(409, 'NOT_IN_SEASON');
  const price = itemPrice(item, events);
  if (child.coins < price) throw new HttpError(409, 'NOT_ENOUGH_COINS');
  owned.push(itemId);
  (await db.prepare('UPDATE children SET coins = coins - ?, owned = ? WHERE id = ? AND coins >= ?').run(price, JSON.stringify(owned), child.id, price));
  const newBadges = (await awardBadges(db, child.id));
  const fresh = (await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id));
  return { state: (await stateOf(db, fresh)), newBadges };
}
/** Mua cả combo: chỉ trả tiền các món còn thiếu, có giảm giá; mua xong mặc luôn cả bộ. */
export async function buyCombo(db, child, comboId) {
  const combo = comboById.get(comboId);
  if (!combo) throw new HttpError(404, 'ITEM_NOT_FOUND');
  const owned = json(child.owned, FREE_ITEMS);
  const events = activeEvents(dayKey());
  // combo giới hạn (hoặc combo còn thiếu món giới hạn) chỉ mua được đúng đợt lễ
  if (!forSale(combo, events) || combo.items.some((i) => !owned.includes(i) && !forSale(shopById.get(i), events))) throw new HttpError(409, 'NOT_IN_SEASON');
  const { price, missing } = comboPrice(combo, combo.items.map((i) => shopById.get(i)), owned, events);
  if (!missing.length) throw new HttpError(409, 'ALREADY_OWNED');
  if (child.coins < price) throw new HttpError(409, 'NOT_ENOUGH_COINS');
  owned.push(...missing);
  (await db.prepare('UPDATE children SET coins = coins - ?, owned = ? WHERE id = ? AND coins >= ?').run(price, JSON.stringify(owned), child.id, price));
  const newBadges = (await awardBadges(db, child.id));
  let fresh = (await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id));
  const look = Object.fromEntries(combo.items.map((i) => shopById.get(i)).map((it) => [it.slot, it.value]));
  await setLook(db, fresh, look);
  fresh = (await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id));
  return { state: (await stateOf(db, fresh)), newBadges, paid: price, items: missing };
}
/** Nhận quà ngày lễ (mỗi mùa lễ một lần). Đã có sẵn món quà thì nhận xu. */
export async function claimEventGift(db, child, eventId) {
  const ev = activeEvents(dayKey()).find((e) => e.id === eventId);
  if (!ev) throw new HttpError(404, 'EVENT_NOT_ACTIVE');
  const owned = json(child.owned, FREE_ITEMS);
  const key = giftKey(ev);
  if (owned.includes(key)) throw new HttpError(409, 'ALREADY_CLAIMED');
  const gift = shopById.get(ev.gift);
  const giveItem = gift && !owned.includes(gift.id);
  owned.push(key); if (giveItem) owned.push(gift.id);
  const coins = giveItem ? 0 : GIFT_COINS;
  (await db.prepare('UPDATE children SET coins = coins + ?, owned = ? WHERE id = ?').run(coins, JSON.stringify(owned), child.id));
  const newBadges = (await awardBadges(db, child.id));
  const fresh = (await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id));
  return { item: giveItem ? { id: gift.id, slot: gift.slot, value: gift.value, name: gift.name } : null, coins, newBadges, state: (await stateOf(db, fresh)) };
}
export async function setLook(db, child, look) {
  const cur = { ...DEFAULT_LOOK, ...json(child.look, {}) };
  const safe = sanitizeLook({ ...cur, ...look }, json(child.owned, FREE_ITEMS), cur);
  (await db.prepare('UPDATE children SET look = ? WHERE id = ?').run(JSON.stringify(safe), child.id));
  return (await stateOf(db, (await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id))));
}

// ---------------- Báo cáo cho phụ huynh ----------------
export async function reportFor(db, child) {
  const days = [];
  let d = dayKey();
  for (let i = 0; i < 7; i++) { days.unshift(d); d = prevDay(d); }
  const rows = new Map((await db.prepare(`SELECT * FROM daily_stats WHERE child_id = ? AND day >= ?`).all(child.id, days[0])).map((r) => [r.day, r]));
  const week = days.map((day) => { const r = rows.get(day); return { day, minutes: Math.round((r?.seconds ?? 0) / 60), correct: r?.correct ?? 0, answered: r?.answered ?? 0, lessons: r?.lessons ?? 0 }; });
  const bySubject = await Promise.all(SUBJECTS.map(async (s) => {
    const r = (await db.prepare('SELECT COALESCE(SUM(correct),0) c, COALESCE(SUM(total),0) t, COUNT(*) n FROM play_sessions WHERE child_id = ? AND subject = ? AND finished_at IS NOT NULL').get(child.id, s.id));
    return { subject: s.id, name: s.name, accuracy: r.t ? r.c / r.t : null, sessions: r.n };
  }));
  const recent = (await db.prepare('SELECT lesson_id, game, subject, stars, correct, total, finished_at, duration_sec FROM play_sessions WHERE child_id = ? AND finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 12').all(child.id))
    .map((r) => ({ ...r, gameName: GAME_INFO[r.game]?.name, topic: topicById.get(lessonById.get(r.lesson_id)?.topicId)?.title }));
  return { child: publicChild(child), week, bySubject, recent, stats: (await statsFor(db, child)), state: (await stateOf(db, child)) };
}

export async function leaderboard(db, parentId) {
  const since = Date.now() - 7 * 864e5;
  return (await db.prepare('SELECT c.id, c.nickname, c.look, c.settings, COALESCE(SUM(s.xp),0) xp, COALESCE(SUM(s.stars),0) stars FROM children c LEFT JOIN play_sessions s ON s.child_id = c.id AND s.finished_at > ? WHERE c.parent_id = ? GROUP BY c.id ORDER BY xp DESC')
    .all(since, parentId))
    .filter((r) => ({ ...DEFAULT_SETTINGS, ...json(r.settings, {}) }).leaderboard)
    .map((r) => ({ id: r.id, nickname: r.nickname, look: { ...DEFAULT_LOOK, ...json(r.look, {}) }, xp: r.xp, stars: r.stars }));
}

export const catalog = () => ({
  subjects: SUBJECTS,
  topics: TOPICS.map((t) => ({ id: t.id, subject: t.subject, grade: t.grade, title: t.title })),
  games: GAME_INFO,
  shop: SHOP,
  collections: COLLECTIONS,
  combos: COMBOS,
  badges: BADGES.map(({ cond, ...b }) => b),
  lessonCount: LESSONS.length,
});
