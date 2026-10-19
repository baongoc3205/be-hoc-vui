// Nghiệp vụ game: tiến độ, năng lượng, phiên chơi, chấm điểm, phần thưởng, nhiệm vụ, huy hiệu, báo cáo.
import { randomBytes } from 'node:crypto';
import { HttpError } from './http.js';
import { buildRounds } from './rounds.js';
import { computeRewards, currentEnergy, gradeRound, levelInfo, makeRng, shuffle, ageThemeForGrade, MAX_ENERGY } from '../shared/logic.js';
import { BADGES, DEFAULT_LOOK, FREE_ITEMS, GAME_INFO, LESSONS, QUEST_POOL, SHOP, SUBJECTS, TOPICS, lessonById, lessonsFor, shopById, topicById } from './content/index.js';

const TZ = process.env.TZ_GAME || 'Asia/Ho_Chi_Minh';
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false });
export const dayKey = (ms = Date.now()) => dayFmt.format(new Date(ms));
const prevDay = (day) => dayKey(new Date(`${day}T12:00:00Z`).getTime() - 864e5);
const json = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };
const hashStr = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

// DEMO_UNLOCK=1: mở khoá mọi màn (dùng để trình diễn / giáo viên xem trước nội dung)
const DEMO_UNLOCK = process.env.DEMO_UNLOCK === '1';

export const DEFAULT_SETTINGS = { dailyLimitMin: 60, energy: true, leaderboard: true };

// ---------------- Hồ sơ bé ----------------
export async function getChild(db, parentId, childId) {
  const row = (await db.prepare('SELECT * FROM children WHERE id = ? AND parent_id = ?').get(Number(childId), parentId));
  if (!row) throw new HttpError(404, 'CHILD_NOT_FOUND');
  return row;
}
export function publicChild(row) {
  return { id: row.id, nickname: row.nickname, grade: row.grade, ageTheme: ageThemeForGrade(row.grade), look: json(row.look, DEFAULT_LOOK), settings: { ...DEFAULT_SETTINGS, ...json(row.settings, {}) } };
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
  const safeLook = sanitizeLook(look, FREE_ITEMS);
  const r = (await db.prepare('INSERT INTO children (parent_id, nickname, grade, look, settings, energy_at, owned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(parentId, cleanNickname(nickname), g, JSON.stringify(safeLook), JSON.stringify(DEFAULT_SETTINGS), Date.now(), JSON.stringify(FREE_ITEMS), Date.now()));
  return (await getChild(db, parentId, r.lastInsertRowid));
}
/** Chỉ cho phép mặc đồ đã sở hữu. */
function sanitizeLook(look, owned) {
  const out = { ...DEFAULT_LOOK };
  if (look && typeof look === 'object') {
    for (const [slot, value] of Object.entries(look)) {
      if (slot === 'skin' && /^#[0-9a-fA-F]{6}$/.test(String(value))) { out.skin = value; continue; }
      const item = SHOP.find((s) => s.slot === slot && s.value === value);
      if (item && owned.includes(item.id)) out[slot] = value;
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
    quests: (await ensureQuests(db, child, today)),
    badges: (await db.prepare('SELECT badge_id FROM badges WHERE child_id = ?').all(child.id)).map((r) => r.badge_id),
    owned: json(child.owned, FREE_ITEMS),
    today: { minutes: Math.floor(todayStats.seconds / 60), limit: settings.dailyLimitMin },
  };
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
    const node = { id: l.id, index: i + 1, topicId: l.topicId, game: l.game, kind: l.kind, name: GAME_INFO[l.game].name, stars: p?.stars ?? 0, done, unlocked: prevDone || DEMO_UNLOCK, coins: l.coins };
    prevDone = done;
    return node;
  });
  const topics = TOPICS.filter((t) => t.subject === subject && t.grade === g).map((t) => ({ id: t.id, title: t.title }));
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
  const map = (await mapOf(db, child, lesson.subject, lesson.grade));
  const node = map.nodes.find((n) => n.id === lessonId);
  if (!node.unlocked) throw new HttpError(403, 'LESSON_LOCKED');
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

export async function statsFor(db, child) {
  const rows = (await db.prepare('SELECT lesson_id, stars FROM lesson_progress WHERE child_id = ? AND stars >= 1').all(child.id));
  const bySubject = { math: 0, vietnamese: 0, english: 0, science: 0 };
  let threeStars = 0, bossDone = 0, perfectBoss = 0;
  for (const r of rows) {
    const l = lessonById.get(r.lesson_id); if (!l || l.kind === 'chest') continue;
    bySubject[l.subject]++;
    if (r.stars === 3) threeStars++;
    if (l.kind === 'boss') { bossDone++; if (r.stars === 3) perfectBoss++; }
  }
  const tot = (await db.prepare('SELECT COALESCE(SUM(correct),0) c FROM daily_stats WHERE child_id = ?').get(child.id)).c;
  const morning = (await db.prepare('SELECT finished_at FROM play_sessions WHERE child_id = ? AND finished_at IS NOT NULL AND stars >= 1').all(child.id)).filter((r) => Number(hourFmt.format(new Date(r.finished_at))) < 9).length;
  const owned = json(child.owned, FREE_ITEMS);
  return { lessonsDone: Object.values(bySubject).reduce((a, b) => a + b, 0), bySubject, threeStars, bossDone, perfectBoss, correctTotal: tot, streak: child.streak, level: levelInfo(child.xp).level, coins: child.coins, bought: owned.filter((id) => !FREE_ITEMS.includes(id)).length, morning };
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
  });

  const newBadges = (await awardBadges(db, child.id));
  const fresh = (await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id));
  const after = levelInfo(fresh.xp).level;
  const map = (await mapOf(db, fresh, lesson.subject, lesson.grade));
  const idx = map.nodes.findIndex((n) => n.id === lesson.id);
  const next = map.nodes.slice(idx + 1).find((n) => n.unlocked && !n.done) ?? null;
  return {
    ...rw, prevStars, maxCombo, durationSec, levelUp: after > before ? after : null, newBadges,
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

export async function openDailyChest(db, child) {
  const today = dayKey();
  if (child.chest_date === today) throw new HttpError(409, 'ALREADY_OPENED');
  const coins = 10 + Math.floor(Math.random() * 21);
  const en = currentEnergy(child.energy, child.energy_at, Date.now());
  const energy = Math.min(MAX_ENERGY, en.value + 2);
  (await db.prepare('UPDATE children SET coins = coins + ?, chest_date = ?, energy = ?, energy_at = ? WHERE id = ?').run(coins, today, energy, energy >= MAX_ENERGY ? Date.now() : en.updatedAt, child.id));
  const fresh = (await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id));
  return { coins, energy: 2, state: (await stateOf(db, fresh)) };
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
  if (owned.includes(itemId)) throw new HttpError(409, 'ALREADY_OWNED');
  if (child.coins < item.price) throw new HttpError(409, 'NOT_ENOUGH_COINS');
  owned.push(itemId);
  (await db.prepare('UPDATE children SET coins = coins - ?, owned = ? WHERE id = ?').run(item.price, JSON.stringify(owned), child.id));
  const newBadges = (await awardBadges(db, child.id));
  const fresh = (await db.prepare('SELECT * FROM children WHERE id = ?').get(child.id));
  return { state: (await stateOf(db, fresh)), newBadges };
}
export async function setLook(db, child, look) {
  const safe = sanitizeLook({ ...json(child.look, DEFAULT_LOOK), ...look }, json(child.owned, FREE_ITEMS));
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
    .map((r) => ({ id: r.id, nickname: r.nickname, look: json(r.look, DEFAULT_LOOK), xp: r.xp, stars: r.stars }));
}

export const catalog = () => ({
  subjects: SUBJECTS,
  topics: TOPICS.map((t) => ({ id: t.id, subject: t.subject, grade: t.grade, title: t.title })),
  games: GAME_INFO,
  shop: SHOP,
  badges: BADGES.map(({ cond, ...b }) => b),
  lessonCount: LESSONS.length,
});
