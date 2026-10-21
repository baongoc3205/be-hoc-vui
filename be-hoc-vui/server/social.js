// Tương tác giữa các bé: mã bạn bè, kết bạn, hồ sơ công khai, bảng xếp hạng, tin nhắn, chặn và báo cáo.
// Lớp bảo vệ tối thiểu cho trẻ em (luôn bật):
//  • chỉ nhắn tin được với bạn đã đồng ý kết bạn; chặn thì hai bên không thấy / không nhắn được cho nhau
//  • tự che số điện thoại, email, đường link, tên mạng xã hội để hẹn ra ngoài, và từ ngữ thô tục
//  • giới hạn tốc độ gửi tin / lời mời; phụ huynh xem được tin nhắn và tắt tính năng cho từng bé
import { randomBytes } from 'node:crypto';
import { HttpError } from './http.js';
import { levelInfo } from '../shared/logic.js';
import { DEFAULT_LOOK, FREE_ITEMS, shopById } from './content/index.js';
import { activeEvents, forSale, itemPrice } from '../shared/shop.js';

const json = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };
export const SOCIAL_DEFAULTS = { social: true, publicBoard: true, gifts: true };
const settingsOf = (c) => ({ ...SOCIAL_DEFAULTS, ...json(c.settings, {}) });
const pair = (x, y) => (x < y ? [x, y] : [y, x]);
const MAX_FRIENDS = 100;
const MSG_MAX = 300;

// ---------------- Lọc nội dung tin nhắn ----------------
const BAD = ['đần', 'ngu', 'địt', 'đụ', 'lồn', 'cặc', 'buồi', 'đéo', 'đĩ', 'vcl', 'vkl', 'vl', 'clgt', 'đm', 'dm', 'đmm', 'dmm', 'cc', 'cmm', 'khốn', 'súc vật', 'óc chó', 'chết tiệt', 'mẹ mày', 'bố mày', 'con chó', 'thằng chó',
  'fuck', 'fucking', 'fck', 'shit', 'bitch', 'bastard', 'asshole', 'dick', 'pussy', 'sex', 'sexy', 'porn', 'nude', 'idiot', 'stupid', 'retard', 'kill yourself', 'kys'];
const PLATFORMS = ['zalo', 'facebook', 'fb', 'messenger', 'tiktok', 'instagram', 'insta', 'ig', 'discord', 'telegram', 'snapchat', 'whatsapp', 'viber', 'skype', 'kakao', 'line id', 'sđt', 'sdt', 'số điện thoại', 'phone number', 'địa chỉ nhà', 'home address'];
const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// so khớp theo cả từ, ở cả dạng có dấu và bỏ dấu
const wordRe = (list) => new RegExp(`(^|[^\\p{L}\\p{N}])(${[...new Set(list.flatMap((w) => [w, strip(w)]))].map(esc).join('|')})(?=$|[^\\p{L}\\p{N}])`, 'giu');
const BAD_RE = wordRe(BAD);
const PLAT_RE = wordRe(PLATFORMS);
const PHONE_RE = /(?:\+?\d[\s.\-()]*){7,}/g;
const EMAIL_RE = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu;
const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b[\p{L}\p{N}-]+\.(?:com|vn|net|org|io|me|gg|xyz|tk|ly|link|app|info|biz)\b\S*/giu;

/** Lọc tin nhắn. Trả về { text, masked: [loại bị che] }. */
export function filterText(raw) {
  let t = String(raw ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MSG_MAX);
  const masked = new Set();
  const rep = (re, kind, keepLead) => { t = t.replace(re, (...m) => { masked.add(kind); return keepLead ? `${m[1]}***` : '***'; }); };
  rep(EMAIL_RE, 'contact'); rep(URL_RE, 'link'); rep(PHONE_RE, 'contact');
  rep(PLAT_RE, 'contact', true);
  rep(BAD_RE, 'bad', true);
  // kiểm tra thêm bản bỏ dấu (lách luật bằng cách viết không dấu đã nằm trong danh sách)
  return { text: t, masked: [...masked] };
}

// ---------------- Mã bạn bè ----------------
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export async function friendCode(db, childId) {
  const row = await db.prepare('SELECT code FROM friend_codes WHERE child_id = ?').get(childId);
  if (row) return row.code;
  for (let i = 0; i < 10; i++) {
    const code = Array.from(randomBytes(6), (b) => ALPHA[b % ALPHA.length]).join('');
    try { await db.prepare('INSERT INTO friend_codes (child_id, code) VALUES (?, ?)').run(childId, code); return code; } catch { /* trùng mã, thử lại */ }
  }
  throw new HttpError(500, 'SERVER_ERROR');
}

// ---------------- Quan hệ ----------------
export async function isBlocked(db, x, y) {
  return !!(await db.prepare('SELECT 1 FROM blocks WHERE (child_id = ? AND blocked_id = ?) OR (child_id = ? AND blocked_id = ?)').get(x, y, y, x));
}
/** 'self' | 'family' | 'friends' | 'sent' | 'received' | 'blocked' | 'none' (+ family khi cùng phụ huynh) */
export async function relation(db, me, other) {
  if (me.id === other.id) return 'self';
  if (await db.prepare('SELECT 1 FROM blocks WHERE child_id = ? AND blocked_id = ?').get(me.id, other.id)) return 'blocked';
  if (await db.prepare('SELECT 1 FROM blocks WHERE child_id = ? AND blocked_id = ?').get(other.id, me.id)) return 'hidden';
  const [a, b] = pair(me.id, other.id);
  const f = await db.prepare('SELECT status, by_id FROM friends WHERE a = ? AND b = ?').get(a, b);
  if (f?.status === 'accepted') return 'friends';
  if (f?.status === 'pending') return f.by_id === me.id ? 'sent' : 'received';
  return me.parent_id === other.parent_id ? 'family' : 'none';
}
const child = (db, id) => db.prepare('SELECT * FROM children WHERE id = ?').get(Number(id));
const requireSocial = (c, code = 'SOCIAL_OFF') => { if (!settingsOf(c).social) throw new HttpError(403, code); };

/** Gửi lời mời kết bạn bằng mã hoặc bằng id (từ hồ sơ trên bảng xếp hạng). Nếu bên kia đã mời mình thì thành bạn luôn. */
export async function requestFriend(db, me, { code, childId }) {
  requireSocial(me);
  let other;
  if (code) {
    const row = await db.prepare('SELECT child_id FROM friend_codes WHERE code = ?').get(String(code).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
    if (!row) throw new HttpError(404, 'FRIEND_NOT_FOUND');
    other = await child(db, row.child_id);
  } else other = await child(db, childId);
  if (!other) throw new HttpError(404, 'FRIEND_NOT_FOUND');
  if (other.id === me.id) throw new HttpError(400, 'FRIEND_SELF');
  if (!settingsOf(other).social) throw new HttpError(403, 'FRIEND_UNAVAILABLE');
  if (await isBlocked(db, me.id, other.id)) throw new HttpError(403, 'FRIEND_UNAVAILABLE');
  const rel = await relation(db, me, other);
  if (rel === 'friends') throw new HttpError(409, 'ALREADY_FRIENDS');
  if (rel === 'sent') throw new HttpError(409, 'REQUEST_SENT');
  const [a, b] = pair(me.id, other.id);
  if (rel === 'received') { await db.prepare("UPDATE friends SET status = 'accepted' WHERE a = ? AND b = ?").run(a, b); return { status: 'friends', friend: await card(db, other) }; }
  const n = Number((await db.prepare("SELECT COUNT(*) n FROM friends WHERE (a = ? OR b = ?) AND status = 'accepted'").get(me.id, me.id)).n);
  if (n >= MAX_FRIENDS) throw new HttpError(409, 'TOO_MANY_FRIENDS');
  const today = Number((await db.prepare('SELECT COUNT(*) n FROM friends WHERE by_id = ? AND created_at > ?').get(me.id, Date.now() - 864e5)).n);
  if (today >= 30) throw new HttpError(429, 'TOO_MANY_REQUESTS');
  await db.prepare("INSERT OR REPLACE INTO friends (a, b, status, by_id, created_at) VALUES (?, ?, 'pending', ?, ?)").run(a, b, me.id, Date.now());
  return { status: 'sent', friend: await card(db, other) };
}
export async function respondFriend(db, me, otherId, accept) {
  const [a, b] = pair(me.id, Number(otherId));
  const f = await db.prepare('SELECT * FROM friends WHERE a = ? AND b = ?').get(a, b);
  if (!f || f.status !== 'pending' || f.by_id === me.id) throw new HttpError(404, 'REQUEST_NOT_FOUND');
  if (accept) { requireSocial(me); await db.prepare("UPDATE friends SET status = 'accepted' WHERE a = ? AND b = ?").run(a, b); }
  else await db.prepare('DELETE FROM friends WHERE a = ? AND b = ?').run(a, b);
  return { ok: true };
}
export async function unfriend(db, me, otherId) {
  const [a, b] = pair(me.id, Number(otherId));
  await db.prepare('DELETE FROM friends WHERE a = ? AND b = ?').run(a, b);
  return { ok: true };
}
export async function block(db, me, otherId, on = true) {
  const id = Number(otherId);
  if (id === me.id) throw new HttpError(400, 'FRIEND_SELF');
  if (on) {
    await db.prepare('INSERT OR IGNORE INTO blocks (child_id, blocked_id, created_at) VALUES (?, ?, ?)').run(me.id, id, Date.now());
    const [a, b] = pair(me.id, id); await db.prepare('DELETE FROM friends WHERE a = ? AND b = ?').run(a, b);
  } else await db.prepare('DELETE FROM blocks WHERE child_id = ? AND blocked_id = ?').run(me.id, id);
  return { ok: true };
}
export async function report(db, me, otherId, { messageId, reason } = {}) {
  const today = Number((await db.prepare('SELECT COUNT(*) n FROM reports WHERE reporter_id = ? AND created_at > ?').get(me.id, Date.now() - 864e5)).n);
  if (today >= 20) throw new HttpError(429, 'TOO_MANY_REQUESTS');
  await db.prepare('INSERT INTO reports (reporter_id, target_id, message_id, reason, created_at) VALUES (?, ?, ?, ?, ?)').run(me.id, Number(otherId), messageId ? Number(messageId) : null, String(reason ?? '').slice(0, 200), Date.now());
  return { ok: true };
}

// ---------------- Hồ sơ & danh sách ----------------
async function card(db, c) {
  const lv = levelInfo(c.xp).level;
  return { id: c.id, nickname: c.nickname, grade: c.grade, look: { ...DEFAULT_LOOK, ...json(c.look, {}) }, level: lv };
}
export async function profile(db, me, otherId) {
  const other = await child(db, otherId);
  if (!other) throw new HttpError(404, 'FRIEND_NOT_FOUND');
  const rel = await relation(db, me, other);
  const s = settingsOf(other);
  if (rel === 'hidden' || (!['self', 'family', 'friends', 'received'].includes(rel) && !s.publicBoard)) throw new HttpError(404, 'FRIEND_NOT_FOUND');
  const stars = Number((await db.prepare('SELECT COALESCE(SUM(stars),0) s FROM lesson_progress WHERE child_id = ?').get(other.id)).s);
  const badges = (await db.prepare('SELECT badge_id FROM badges WHERE child_id = ?').all(other.id)).map((r) => r.badge_id);
  const week = Number((await db.prepare('SELECT COALESCE(SUM(xp),0) x FROM play_sessions WHERE child_id = ? AND finished_at > ?').get(other.id, Date.now() - 7 * 864e5)).x);
  return { ...(await card(db, other)), stars, badges, streak: other.streak, xpWeek: week, relation: rel, canChat: rel === 'friends' && s.social && settingsOf(me).social, social: s.social };
}

export async function friendsOf(db, me) {
  const rows = await db.prepare('SELECT * FROM friends WHERE a = ? OR b = ?').all(me.id, me.id);
  const out = { friends: [], incoming: [], outgoing: [], code: await friendCode(db, me.id), social: settingsOf(me).social };
  for (const r of rows) {
    const oid = r.a === me.id ? r.b : r.a;
    const o = await child(db, oid); if (!o) continue;
    const base = await card(db, o);
    if (r.status === 'accepted') {
      const unread = Number((await db.prepare('SELECT COUNT(*) n FROM messages WHERE to_id = ? AND from_id = ? AND read_at IS NULL').get(me.id, oid)).n);
      const last = await db.prepare('SELECT id, from_id, kind, body, created_at FROM messages WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?) ORDER BY id DESC LIMIT 1').get(me.id, oid, oid, me.id);
      out.friends.push({ ...base, unread, last: last ? { mine: last.from_id === me.id, kind: last.kind, text: last.kind === 'text' ? last.body : null, at: last.created_at } : null, social: settingsOf(o).social });
    } else if (r.by_id === me.id) out.outgoing.push(base); else out.incoming.push(base);
  }
  out.friends.sort((x, y) => (y.last?.at ?? 0) - (x.last?.at ?? 0) || x.nickname.localeCompare(y.nickname));
  return out;
}

/** Bảng xếp hạng 7 ngày: scope 'family' | 'friends' | 'global'. */
export async function leaderboard(db, me, scope) {
  const since = Date.now() - 7 * 864e5;
  let ids = null;
  if (scope === 'family') ids = (await db.prepare('SELECT id FROM children WHERE parent_id = ?').all(me.parent_id)).map((r) => r.id);
  if (scope === 'friends') ids = [me.id, ...(await db.prepare("SELECT a, b FROM friends WHERE (a = ? OR b = ?) AND status = 'accepted'").all(me.id, me.id)).map((r) => (r.a === me.id ? r.b : r.a))];
  const rows = ids
    ? await db.prepare(`SELECT c.*, COALESCE(SUM(s.xp),0) wxp, COALESCE(SUM(s.stars),0) wstars FROM children c LEFT JOIN play_sessions s ON s.child_id = c.id AND s.finished_at > ? WHERE c.id IN (${ids.map(() => '?').join(',')}) GROUP BY c.id ORDER BY wxp DESC, c.id LIMIT 100`).all(since, ...ids)
    : await db.prepare('SELECT c.*, COALESCE(SUM(s.xp),0) wxp, COALESCE(SUM(s.stars),0) wstars FROM children c JOIN play_sessions s ON s.child_id = c.id AND s.finished_at > ? GROUP BY c.id ORDER BY wxp DESC, c.id LIMIT 300').all(since);
  const blocked = new Set((await db.prepare('SELECT blocked_id id FROM blocks WHERE child_id = ? UNION SELECT child_id id FROM blocks WHERE blocked_id = ?').all(me.id, me.id)).map((r) => r.id));
  const list = [];
  for (const r of rows) {
    const s = settingsOf(r);
    if (r.id !== me.id && blocked.has(r.id)) continue;
    if (scope === 'global' && r.id !== me.id && (!s.publicBoard || !s.leaderboard)) continue;
    if (scope === 'family' && !s.leaderboard && r.id !== me.id) continue;
    list.push({ ...(await card(db, r)), xp: Number(r.wxp), stars: Number(r.wstars), me: r.id === me.id });
    if (list.length >= 50) break;
  }
  const mine = list.findIndex((x) => x.me);
  let myRank = mine >= 0 ? { rank: mine + 1, xp: list[mine].xp } : null;
  if (!myRank && scope === 'global') {
    const x = Number((await db.prepare('SELECT COALESCE(SUM(xp),0) x FROM play_sessions WHERE child_id = ? AND finished_at > ?').get(me.id, since)).x);
    myRank = { rank: null, xp: x };
  }
  return { scope, rows: list, me: myRank };
}

// ---------------- Tin nhắn ----------------
async function requireChat(db, me, otherId) {
  const other = await child(db, otherId);
  if (!other) throw new HttpError(404, 'FRIEND_NOT_FOUND');
  if ((await relation(db, me, other)) !== 'friends') throw new HttpError(403, 'NOT_FRIENDS');
  return other;
}
const msgOut = (me) => (m) => ({ id: m.id, mine: m.from_id === me.id, kind: m.kind, body: m.kind === 'text' ? m.body : json(m.body, {}), at: m.created_at, read: !!m.read_at });

export async function messages(db, me, otherId, after = 0) {
  const other = await requireChat(db, me, otherId);
  const rows = await db.prepare('SELECT * FROM messages WHERE ((from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)) AND id > ? ORDER BY id DESC LIMIT 60').all(me.id, other.id, other.id, me.id, Number(after) || 0);
  await db.prepare('UPDATE messages SET read_at = ? WHERE to_id = ? AND from_id = ? AND read_at IS NULL').run(Date.now(), me.id, other.id);
  return { friend: await card(db, other), canChat: settingsOf(me).social && settingsOf(other).social, messages: rows.reverse().map(msgOut(me)) };
}
export async function send(db, me, otherId, body = {}, kind = 'text') {
  requireSocial(me);
  const other = await requireChat(db, me, otherId);
  if (!settingsOf(other).social) throw new HttpError(403, 'FRIEND_UNAVAILABLE');
  const recent = Number((await db.prepare('SELECT COUNT(*) n FROM messages WHERE from_id = ? AND created_at > ?').get(me.id, Date.now() - 60e3)).n);
  if (recent >= 15) throw new HttpError(429, 'TOO_FAST');
  let stored, masked = [];
  if (kind === 'text') {
    const f = filterText(body.text);
    if (!f.text) throw new HttpError(400, 'EMPTY_MESSAGE');
    stored = f.text; masked = f.masked;
  } else stored = JSON.stringify(body);
  const r = await db.prepare('INSERT INTO messages (from_id, to_id, kind, body, created_at) VALUES (?, ?, ?, ?, ?)').run(me.id, other.id, kind, stored, Date.now());
  const m = await db.prepare('SELECT * FROM messages WHERE id = ?').get(r.lastInsertRowid);
  return { message: msgOut(me)(m), masked };
}
/** Tóm tắt cho huy hiệu chấm đỏ: số tin chưa đọc, lời mời kết bạn, lời mời chơi mới nhất. */
export async function summary(db, me) {
  const unread = Number((await db.prepare('SELECT COUNT(*) n FROM messages m WHERE m.to_id = ? AND m.read_at IS NULL AND NOT EXISTS (SELECT 1 FROM blocks WHERE child_id = ? AND blocked_id = m.from_id)').get(me.id, me.id)).n);
  const requests = Number((await db.prepare("SELECT COUNT(*) n FROM friends WHERE (a = ? OR b = ?) AND status = 'pending' AND by_id <> ?").get(me.id, me.id, me.id)).n);
  const inv = await db.prepare("SELECT m.id, m.body, m.created_at, m.from_id FROM messages m WHERE m.to_id = ? AND m.kind = 'invite' AND m.read_at IS NULL AND m.created_at > ? ORDER BY m.id DESC LIMIT 1").get(me.id, Date.now() - 10 * 60e3);
  const from = inv ? await child(db, inv.from_id) : null;
  const gifts = Number((await db.prepare("SELECT COUNT(*) n FROM messages m WHERE m.to_id = ? AND m.kind = 'gift' AND m.body LIKE '%\"opened\":false%' AND NOT EXISTS (SELECT 1 FROM blocks WHERE child_id = ? AND blocked_id = m.from_id)").get(me.id, me.id)).n);
  return { unread, requests, gifts, invite: inv && from ? { id: inv.id, from: from.nickname, fromId: from.id, ...json(inv.body, {}) } : null };
}

/** Phụ huynh xem tin nhắn gần đây của bé (cả gửi và nhận) và các báo cáo bé đã gửi. */
export async function parentView(db, c) {
  const rows = await db.prepare('SELECT * FROM messages WHERE from_id = ? OR to_id = ? ORDER BY id DESC LIMIT 300').all(c.id, c.id);
  const names = new Map();
  const nameOf = async (id) => { if (!names.has(id)) names.set(id, (await child(db, id))?.nickname ?? '?'); return names.get(id); };
  const msgs = [];
  for (const m of rows) msgs.push({ id: m.id, from: await nameOf(m.from_id), to: await nameOf(m.to_id), mine: m.from_id === c.id, kind: m.kind, text: m.kind === 'text' ? m.body : m.kind === 'gift' ? (json(m.body, {}).note ?? null) : null, item: m.kind === 'gift' ? shopById.get(json(m.body, {}).item)?.name ?? null : null, at: m.created_at });
  const friends = (await friendsOf(db, c)).friends.map((f) => ({ id: f.id, nickname: f.nickname }));
  const reports = [];
  for (const r of await db.prepare('SELECT * FROM reports WHERE reporter_id = ? ORDER BY id DESC LIMIT 50').all(c.id)) reports.push({ target: await nameOf(r.target_id), reason: r.reason, at: r.created_at });
  return { messages: msgs, friends, reports };
}

// ---------------- Tặng quà (trang phục, thú cưng) ----------------
// Người tặng trả xu theo giá cửa hàng; món vào tủ đồ của bạn ngay. Không chuyển xu trực tiếp để tránh xin/ép xu.
export const GIFTS_PER_DAY = 3;
const NOTE_MAX = 60;
const vnDay = (ms = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(ms));
const dayStart = (ms = Date.now()) => Date.parse(`${vnDay(ms)}T00:00:00+07:00`);
async function giftsToday(db, me) {
  return Number((await db.prepare("SELECT COUNT(*) n FROM messages WHERE from_id = ? AND kind = 'gift' AND created_at >= ?").get(me.id, dayStart())).n);
}
export async function sendGift(db, me, { to, itemId, note } = {}) {
  const sm = settingsOf(me);
  if (!sm.social) throw new HttpError(403, 'SOCIAL_OFF');
  if (!sm.gifts) throw new HttpError(403, 'GIFTS_OFF');
  const other = await child(db, to);
  if (!other) throw new HttpError(404, 'FRIEND_NOT_FOUND');
  const rel = await relation(db, me, other);
  if (rel !== 'friends' && rel !== 'family') throw new HttpError(403, 'NOT_FRIENDS');
  const so = settingsOf(other);
  if (!so.social || !so.gifts) throw new HttpError(403, 'FRIEND_UNAVAILABLE');
  const item = shopById.get(String(itemId));
  if (!item || !item.price) throw new HttpError(404, 'ITEM_NOT_FOUND');
  const owned = json(other.owned, FREE_ITEMS);
  if (owned.includes(item.id)) throw new HttpError(409, 'FRIEND_HAS_IT');
  const events = activeEvents(vnDay());
  if (!forSale(item, events)) throw new HttpError(409, 'NOT_IN_SEASON');
  if ((await giftsToday(db, me)) >= GIFTS_PER_DAY) throw new HttpError(429, 'GIFT_LIMIT');
  const price = itemPrice(item, events);
  const f = filterText(String(note ?? '').slice(0, NOTE_MAX));
  const body = JSON.stringify({ item: item.id, note: f.text || null, opened: false });
  await db.tx(async (t) => {
    const r = await t.prepare('UPDATE children SET coins = coins - ? WHERE id = ? AND coins >= ?').run(price, me.id, price);
    if (!r.changes) throw new HttpError(409, 'NOT_ENOUGH_COINS');
    const cur = json((await t.prepare('SELECT owned FROM children WHERE id = ?').get(other.id)).owned, FREE_ITEMS);
    if (cur.includes(item.id)) throw new HttpError(409, 'FRIEND_HAS_IT');
    cur.push(item.id);
    await t.prepare('UPDATE children SET owned = ? WHERE id = ?').run(JSON.stringify(cur), other.id);
    await t.prepare('INSERT INTO messages (from_id, to_id, kind, body, created_at) VALUES (?, ?, ?, ?, ?)').run(me.id, other.id, 'gift', body, Date.now());
  });
  const coins = (await child(db, me.id)).coins;
  return { ok: true, paid: price, coins, left: GIFTS_PER_DAY - (await giftsToday(db, me)), masked: f.masked };
}
/** Hộp quà: quà bé nhận (mới nhất trước) và số quà còn tặng được hôm nay. */
export async function giftInbox(db, me) {
  const rows = await db.prepare("SELECT m.* FROM messages m WHERE m.to_id = ? AND m.kind = 'gift' AND NOT EXISTS (SELECT 1 FROM blocks WHERE child_id = ? AND blocked_id = m.from_id) ORDER BY m.id DESC LIMIT 30").all(me.id, me.id);
  const out = [];
  for (const m of rows) { const b = json(m.body, {}); const from = await child(db, m.from_id); out.push({ id: m.id, from: from?.nickname ?? '?', fromId: m.from_id, item: b.item, note: b.note ?? null, opened: !!b.opened, at: m.created_at }); }
  return { gifts: out, unopened: out.filter((g) => !g.opened).length, left: Math.max(0, GIFTS_PER_DAY - (await giftsToday(db, me))), enabled: settingsOf(me).social && settingsOf(me).gifts };
}
/** Mở hộp quà (món đã vào tủ đồ từ lúc bạn gửi; mở chỉ để xem hiệu ứng và đánh dấu đã xem). */
export async function openGift(db, me, mid) {
  const m = await db.prepare("SELECT * FROM messages WHERE id = ? AND to_id = ? AND kind = 'gift'").get(Number(mid), me.id);
  if (!m) throw new HttpError(404, 'ITEM_NOT_FOUND');
  const b = json(m.body, {});
  if (!b.opened) { b.opened = true; await db.prepare('UPDATE messages SET body = ?, read_at = COALESCE(read_at, ?) WHERE id = ?').run(JSON.stringify(b), Date.now(), m.id); }
  return { item: b.item };
}
