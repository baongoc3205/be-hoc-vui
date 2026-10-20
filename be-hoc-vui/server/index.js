// Máy chủ "Bé Học Vui" — API + phục vụ giao diện. Chạy: node server/index.js
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { openDb, CHILD_TABLES } from './db.js';
import { createRouter, HttpError, readJson, sendJson, serveStatic } from './http.js';
import { checkRate, clearCookie, currentParent, hashPassword, issueToken, refreshToken, requireParent, sessionCookie, verifyPassword, COOKIE } from './auth.js';
import { randomBytes } from 'node:crypto';
import * as G from './game.js';
import { arcadeMenu, pickArcade } from './arcade.js';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`\n  Cần Node.js 22.13 trở lên (đang dùng ${process.versions.node}). Tải tại https://nodejs.org\n`);
  process.exit(1);
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 5174;
const HOST = process.env.HOST || '0.0.0.0';
const DB_FILE = process.env.DB_FILE || join(ROOT, 'data', 'behocvui.db');
const STATIC = join(ROOT, 'client', 'dist');
const SECURE = process.env.COOKIE_SECURE === '1';

export function createApp(db) {
  let newCode; // gán ở phần mã khôi phục bên dưới
  const r = createRouter();
  const childOf = async (req, id) => G.getChild(db, (await requireParent(db, req)).id, id);
  const parentPublic = (p) => ({ id: p.id, name: p.name, email: p.email, isGuest: !!p.is_guest });
  const validEmail = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e);

  // ---------- Xác thực phụ huynh ----------
  const ipOf = (req) => (process.env.TRUST_PROXY === '1' ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '') || req.socket.remoteAddress || 'x';
  const cookie = (token) => ({ 'Set-Cookie': sessionCookie(token, SECURE) });
  const POLICY_VERSION = '2026-10';
  const recordConsent = (id) => db.prepare('INSERT INTO consents (parent_id, version, at) VALUES (?, ?, ?) ON CONFLICT(parent_id) DO UPDATE SET version = excluded.version, at = excluded.at').run(id, POLICY_VERSION, Date.now());
  const needConsent = (body) => { if (body.consent !== true) throw new HttpError(400, 'CONSENT_REQUIRED'); };

  r.post('/api/auth/register', async (req) => {
    const body = await readJson(req); const { name, email, password } = body;
    const em = String(email ?? '').trim().toLowerCase();
    if (!validEmail(em)) throw new HttpError(400, 'BAD_EMAIL');
    if (String(password ?? '').length < 6) throw new HttpError(400, 'WEAK_PASSWORD');
    needConsent(body);
    const nm = String(name ?? '').trim().slice(0, 40) || 'Phụ huynh';
    if ((await db.prepare('SELECT 1 FROM parents WHERE email = ?').get(em))) throw new HttpError(409, 'EMAIL_TAKEN');
    const id = (await db.prepare('INSERT INTO parents (email, name, pass_hash, created_at) VALUES (?, ?, ?, ?)').run(em, nm, hashPassword(password), Date.now())).lastInsertRowid;
    await recordConsent(id);
    return [201, { parent: parentPublic((await db.prepare('SELECT * FROM parents WHERE id = ?').get(id))), recoveryCode: await newCode(id) }, cookie(await issueToken(db, id))];
  });
  r.post('/api/auth/login', async (req) => {
    const rate = await checkRate(db, `login:${ipOf(req)}`);
    const { email, password } = await readJson(req);
    const p = (await db.prepare('SELECT * FROM parents WHERE email = ?').get(String(email ?? '').trim().toLowerCase()));
    if (!p || !verifyPassword(String(password ?? ''), p.pass_hash)) { await rate.fail(); throw new HttpError(401, 'BAD_CREDENTIALS'); }
    await rate.ok();
    return [200, { parent: parentPublic(p) }, cookie(await issueToken(db, p.id))];
  });
  r.post('/api/auth/guest', async (req) => {
    const body = await readJson(req); needConsent(body);
    const rate = await checkRate(db, `guest:${ipOf(req)}`, 30, 60 * 60e3); await rate.hit();
    const id = (await db.prepare('INSERT INTO parents (name, is_guest, created_at) VALUES (?, 1, ?)').run('Khách', Date.now())).lastInsertRowid;
    await recordConsent(id);
    return [201, { parent: parentPublic((await db.prepare('SELECT * FROM parents WHERE id = ?').get(id))) }, cookie(await issueToken(db, id))];
  });
  r.post('/api/auth/upgrade', async (req) => {
    const p = (await requireParent(db, req));
    if (!p.is_guest) throw new HttpError(400, 'NOT_GUEST');
    const body = await readJson(req); const { name, email, password } = body;
    const em = String(email ?? '').trim().toLowerCase();
    if (!validEmail(em)) throw new HttpError(400, 'BAD_EMAIL');
    if (String(password ?? '').length < 6) throw new HttpError(400, 'WEAK_PASSWORD');
    if ((await db.prepare('SELECT 1 FROM parents WHERE email = ?').get(em))) throw new HttpError(409, 'EMAIL_TAKEN');
    (await db.prepare('UPDATE parents SET email = ?, name = ?, pass_hash = ?, is_guest = 0 WHERE id = ?').run(em, String(name ?? '').trim().slice(0, 40) || 'Phụ huynh', hashPassword(password), p.id));
    await recordConsent(p.id);
    return [200, { parent: parentPublic((await db.prepare('SELECT * FROM parents WHERE id = ?').get(p.id))), recoveryCode: await newCode(p.id) }];
  });
  r.post('/api/auth/logout', async (req) => {
    const p = (await currentParent(db, req));
    if (p) (await db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(p.token));
    return [200, { ok: true }, { 'Set-Cookie': clearCookie() }];
  });
  r.get('/api/auth/me', async (req) => {
    const p = (await currentParent(db, req));
    const renew = p ? await refreshToken(db, p, SECURE) : null;
    const hasRecovery = p && !p.is_guest ? !!(await db.prepare('SELECT 1 FROM recovery_codes WHERE parent_id = ?').get(p.id)) : false;
    return [200, { parent: p ? { ...parentPublic(p), hasRecovery } : null }, renew ? { 'Set-Cookie': renew } : undefined];
  });
  r.post('/api/auth/verify', async (req) => {
    // Xác nhận lại mật khẩu cho các thao tác nhạy cảm (xoá hồ sơ…)
    const p = (await requireParent(db, req));
    const { password } = await readJson(req);
    if (p.is_guest) return [200, { ok: true }];
    const rate = await checkRate(db, `verify:${p.id}`);
    if (!verifyPassword(String(password ?? ''), p.pass_hash)) { await rate.fail(); throw new HttpError(401, 'BAD_CREDENTIALS'); }
    await rate.ok();
    return [200, { ok: true }];
  });
  r.post('/api/auth/password', async (req) => {
    const p = (await requireParent(db, req));
    const { current, next } = await readJson(req);
    if (p.is_guest) throw new HttpError(400, 'NOT_REGISTERED');
    if (!verifyPassword(String(current ?? ''), p.pass_hash)) throw new HttpError(401, 'BAD_CREDENTIALS');
    if (String(next ?? '').length < 6) throw new HttpError(400, 'WEAK_PASSWORD');
    (await db.prepare('UPDATE parents SET pass_hash = ? WHERE id = ?').run(hashPassword(next), p.id));
    // đăng xuất mọi thiết bị khác
    (await db.prepare('DELETE FROM auth_tokens WHERE parent_id = ? AND token <> ?').run(p.id, p.token));
    return [200, { ok: true }];
  });

  // ---------- Quên mật khẩu: mã khôi phục (không cần gửi email) ----------
  // Mã 12 ký tự hiện MỘT lần khi đăng ký; phụ huynh tự lưu. Quên mật khẩu → nhập email + mã → đặt mật khẩu mới
  // và nhận mã mới (mã cũ hết dùng được).
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const normCode = (c) => String(c ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const newRecoveryCode = async (parentId) => {
    const b = randomBytes(12); const raw = Array.from(b, (x) => ALPHA[x % ALPHA.length]).join('');
    await db.prepare('INSERT INTO recovery_codes (parent_id, code_hash, created_at) VALUES (?, ?, ?) ON CONFLICT(parent_id) DO UPDATE SET code_hash = excluded.code_hash, created_at = excluded.created_at').run(parentId, hashPassword(raw), Date.now());
    return raw.match(/.{4}/g).join('-');
  };
  newCode = newRecoveryCode;
  r.post('/api/auth/recover', async (req) => {
    const { email, code, password } = await readJson(req);
    const em = String(email ?? '').trim().toLowerCase();
    if (String(password ?? '').length < 6) throw new HttpError(400, 'WEAK_PASSWORD');
    const ipRate = await checkRate(db, `recover-ip:${ipOf(req)}`, 10, 60 * 60e3);
    const mailRate = await checkRate(db, `recover:${em}`, 5, 60 * 60e3);
    const p = await db.prepare('SELECT * FROM parents WHERE email = ? AND is_guest = 0').get(em);
    const rc = p ? await db.prepare('SELECT code_hash FROM recovery_codes WHERE parent_id = ?').get(p.id) : null;
    if (!p || !rc || !verifyPassword(normCode(code), rc.code_hash)) { await ipRate.fail(); await mailRate.fail(); throw new HttpError(401, 'BAD_RECOVERY'); }
    await db.tx(async (t) => {
      await t.prepare('UPDATE parents SET pass_hash = ? WHERE id = ?').run(hashPassword(String(password)), p.id);
      await t.prepare('DELETE FROM auth_tokens WHERE parent_id = ?').run(p.id); // đăng xuất mọi thiết bị
    });
    await mailRate.ok();
    return [200, { parent: parentPublic(p), recoveryCode: await newRecoveryCode(p.id) }, cookie(await issueToken(db, p.id))];
  });
  r.post('/api/auth/recovery-code', async (req) => {
    const p = await requireParent(db, req);
    if (p.is_guest) throw new HttpError(400, 'NOT_REGISTERED');
    const { password } = await readJson(req);
    const rate = await checkRate(db, `verify:${p.id}`);
    if (!verifyPassword(String(password ?? ''), p.pass_hash)) { await rate.fail(); throw new HttpError(401, 'BAD_CREDENTIALS'); }
    return [200, { recoveryCode: await newRecoveryCode(p.id) }];
  });

  // ---------- Dữ liệu gia đình: tải về / xoá ----------
  r.get('/api/account/export', async (req) => {
    const p = await requireParent(db, req);
    const kids = await db.prepare('SELECT * FROM children WHERE parent_id = ? ORDER BY id').all(p.id);
    const children = [];
    for (const c of kids) {
      const extra = {};
      for (const tb of CHILD_TABLES) extra[tb] = (await db.prepare(`SELECT * FROM ${tb} WHERE child_id = ?`).all(c.id)).map((row) => (tb === 'play_sessions' ? { ...row, rounds: undefined } : row));
      children.push({ ...G.publicChild(c), coins: c.coins, xp: c.xp, streak: c.streak, owned: JSON.parse(c.owned), createdAt: c.created_at, ...extra });
    }
    const consent = await db.prepare('SELECT version, at FROM consents WHERE parent_id = ?').get(p.id);
    const data = { app: 'Bé Học Vui', exportedAt: new Date().toISOString(), parent: { ...parentPublic(p), createdAt: p.created_at, consent: consent ?? null }, children };
    return [200, data, { 'Content-Disposition': `attachment; filename="be-hoc-vui-${new Date().toISOString().slice(0, 10)}.json"` }];
  });
  r.post('/api/account/delete', async (req) => {
    const p = await requireParent(db, req);
    const { password } = await readJson(req);
    if (!p.is_guest && !verifyPassword(String(password ?? ''), p.pass_hash)) throw new HttpError(401, 'BAD_CREDENTIALS');
    await deleteParent(db, p.id);
    return [200, { ok: true }, { 'Set-Cookie': clearCookie() }];
  });

  // ---------- Ghi lỗi phía trình duyệt ----------
  r.post('/api/client-error', async (req) => {
    const rate = await checkRate(db, `cerr:${ipOf(req)}`, 30, 60 * 60e3); await rate.hit();
    const b = await readJson(req, 16 * 1024);
    const cut = (v, n) => String(v ?? '').slice(0, n);
    await db.prepare('INSERT INTO client_errors (at, message, stack, route, ua) VALUES (?, ?, ?, ?, ?)').run(Date.now(), cut(b.message, 500), cut(b.stack, 3000), cut(b.route, 200), cut(req.headers['user-agent'], 300));
    console.warn(`[lỗi trình duyệt] ${cut(b.route, 80)} — ${cut(b.message, 200)}`);
    return [200, { ok: true }];
  });
  r.get('/api/admin/errors', async (req) => {
    const t = process.env.ADMIN_TOKEN;
    if (!t || req.headers['x-admin-token'] !== t) throw new HttpError(404, 'NOT_FOUND');
    return [200, { errors: await db.prepare('SELECT * FROM client_errors ORDER BY id DESC LIMIT 200').all() }];
  });

  // ---------- Nội dung ----------
  r.get('/api/catalog', async () => [200, G.catalog()]);

  // ---------- Hồ sơ bé ----------
  r.get('/api/children', async (req) => {
    const p = (await requireParent(db, req));
    return [200, { children: (await db.prepare('SELECT * FROM children WHERE parent_id = ? ORDER BY id').all(p.id)).map(G.publicChild) }];
  });
  r.post('/api/children', async (req) => {
    const p = (await requireParent(db, req));
    return [201, { child: G.publicChild((await G.createChild(db, p.id, await readJson(req)))) }];
  });
  r.patch('/api/children/:id', async (req, res, { id }) => {
    const c = (await childOf(req, id));
    const body = await readJson(req);
    if (body.nickname !== undefined) (await db.prepare('UPDATE children SET nickname = ? WHERE id = ?').run(G.cleanNickname(body.nickname), c.id));
    if (body.grade !== undefined) (await db.prepare('UPDATE children SET grade = ? WHERE id = ?').run(Math.min(9, Math.max(1, Number(body.grade) || c.grade)), c.id));
    if (body.settings) {
      const cur = { ...G.DEFAULT_SETTINGS, ...JSON.parse(c.settings) };
      const s = body.settings;
      const next = {
        dailyLimitMin: s.dailyLimitMin !== undefined ? Math.min(240, Math.max(0, Math.round(Number(s.dailyLimitMin) || 0))) : cur.dailyLimitMin,
        energy: s.energy !== undefined ? !!s.energy : cur.energy,
        leaderboard: s.leaderboard !== undefined ? !!s.leaderboard : cur.leaderboard,
      };
      (await db.prepare('UPDATE children SET settings = ? WHERE id = ?').run(JSON.stringify(next), c.id));
    }
    return [200, { child: G.publicChild((await db.prepare('SELECT * FROM children WHERE id = ?').get(c.id))) }];
  });
  r.del('/api/children/:id', async (req, res, { id }) => {
    const c = (await childOf(req, id));
    await db.tx(async (t) => deleteChild(t, c.id));
    return [200, { ok: true }];
  });
  r.get('/api/children/:id/state', async (req, res, { id }) => {
    const c = (await childOf(req, id));
    return [200, { ...(await G.stateOf(db, c)), next: (await G.nextUp(db, c)) }];
  });
  r.get('/api/children/:id/map', async (req, res, { id }) => {
    const c = (await childOf(req, id));
    const u = new URL(req.url, 'http://x');
    return [200, (await G.mapOf(db, c, u.searchParams.get('subject') ?? 'math', u.searchParams.get('grade') ?? c.grade))];
  });
  r.get('/api/children/:id/worlds', async (req, res, { id }) => {
    const c = (await childOf(req, id));
    const u = new URL(req.url, 'http://x');
    const grade = Number(u.searchParams.get('grade')) || c.grade;
    return [200, { grade, worlds: await Promise.all(G.catalog().subjects.map(async (s) => { const m = await G.mapOf(db, c, s.id, grade); return { subject: s.id, done: m.nodes.filter((n) => n.done).length, total: m.nodes.length, stars: m.nodes.reduce((a, n) => a + n.stars, 0), maxStars: m.nodes.filter((n) => n.kind !== 'chest').length * 3, topics: m.topics }; })) }];
  });
  r.post('/api/children/:id/sessions', async (req, res, { id }) => {
    const c = (await childOf(req, id));
    const { lessonId } = await readJson(req);
    return [201, (await G.startSession(db, c, String(lessonId)))];
  });
  r.post('/api/children/:id/sessions/:sid/finish', async (req, res, { id, sid }) => {
    const c = (await childOf(req, id));
    return [200, (await G.finishSession(db, c, sid, await readJson(req)))];
  });
  r.post('/api/children/:id/chests/:lessonId', async (req, res, { id, lessonId }) => [200, (await G.openMapChest(db, await childOf(req, id), lessonId))]);
  r.get('/api/children/:id/arcade', async (req, res, { id }) => { const c = await childOf(req, id); return [200, { games: arcadeMenu(c.grade) }]; });
  r.post('/api/children/:id/arcade', async (req, res, { id }) => {
    const c = await childOf(req, id); const { game, subject } = await readJson(req);
    return [200, { lessonId: pickArcade(c.grade, String(game ?? ''), subject ? String(subject) : 'any').id }];
  });
  r.post('/api/children/:id/checkin', async (req, res, { id }) => [200, (await G.doCheckin(db, await childOf(req, id)))]);
  r.post('/api/children/:id/quests/:qid/claim', async (req, res, { id, qid }) => [200, (await G.claimQuest(db, await childOf(req, id), qid))]);
  r.post('/api/children/:id/shop/:itemId', async (req, res, { id, itemId }) => [200, (await G.buyItem(db, await childOf(req, id), itemId))]);
  r.post('/api/children/:id/combo/:comboId', async (req, res, { id, comboId }) => [200, (await G.buyCombo(db, await childOf(req, id), comboId))]);
  r.post('/api/children/:id/events/:eventId/gift', async (req, res, { id, eventId }) => [200, (await G.claimEventGift(db, await childOf(req, id), eventId))]);
  r.post('/api/children/:id/look', async (req, res, { id }) => [200, (await G.setLook(db, await childOf(req, id), (await readJson(req)).look ?? {}))]);
  r.get('/api/children/:id/report', async (req, res, { id }) => [200, (await G.reportFor(db, await childOf(req, id)))]);
  r.get('/api/leaderboard', async (req) => [200, { rows: (await G.leaderboard(db, (await requireParent(db, req)).id)) }]);
  r.get('/api/health', async () => [200, { ok: true, time: Date.now() }]);

  return async function handle(req, res) {
    const url = new URL(req.url, 'http://x');
    if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, STATIC);
    // Chống CSRF cơ bản: yêu cầu ghi dữ liệu phải là JSON từ cùng nguồn.
    if (req.method !== 'GET' && req.headers['content-type'] && !String(req.headers['content-type']).includes('application/json')) return sendJson(res, 415, { error: 'UNSUPPORTED_MEDIA' });
    const m = r.match(req.method, url.pathname);
    if (!m) return sendJson(res, 404, { error: 'NOT_FOUND' });
    try {
      const [status, data, headers] = await m.handler(req, res, m.params);
      sendJson(res, status, data, headers ?? {});
    } catch (e) {
      if (e instanceof HttpError) return sendJson(res, e.status, { error: e.code });
      console.error(e);
      sendJson(res, 500, { error: 'SERVER_ERROR' });
    }
  };
}

async function deleteChild(t, childId) {
  for (const tb of CHILD_TABLES) await t.prepare(`DELETE FROM ${tb} WHERE child_id = ?`).run(childId);
  await t.prepare('DELETE FROM children WHERE id = ?').run(childId);
}
/** Xoá toàn bộ dữ liệu một gia đình (chạy được cả khi Turso không bật khoá ngoại). */
export async function deleteParent(db, parentId) {
  await db.tx(async (t) => {
    for (const c of await t.prepare('SELECT id FROM children WHERE parent_id = ?').all(parentId)) await deleteChild(t, c.id);
    for (const tb of ['auth_tokens', 'recovery_codes', 'consents']) await t.prepare(`DELETE FROM ${tb} WHERE parent_id = ?`).run(parentId);
    await t.prepare('DELETE FROM parents WHERE id = ?').run(parentId);
  });
}
/**
 * Dọn dẹp định kỳ: token hết hạn, log lỗi cũ, và tài khoản khách bỏ dở:
 *  • khách không tạo hồ sơ bé nào sau 7 ngày
 *  • khách không còn phiên đăng nhập hợp lệ (không ai mở lại được nữa)
 */
export async function cleanup(db, now = Date.now()) {
  await db.prepare('DELETE FROM auth_tokens WHERE expires_at < ?').run(now);
  await db.prepare('DELETE FROM client_errors WHERE at < ?').run(now - 30 * 864e5);
  await db.prepare('DELETE FROM rate_limits WHERE t < ?').run(now - 864e5);
  const stale = await db.prepare(`SELECT p.id FROM parents p WHERE p.is_guest = 1 AND (
      (p.created_at < ? AND NOT EXISTS (SELECT 1 FROM children c WHERE c.parent_id = p.id))
      OR NOT EXISTS (SELECT 1 FROM auth_tokens t WHERE t.parent_id = p.id))`).all(now - 7 * 864e5);
  for (const p of stale) await deleteParent(db, p.id);
  return stale.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const db = await openDb(tursoUrl ? { tursoUrl, tursoToken: process.env.TURSO_AUTH_TOKEN } : { file: DB_FILE });
  // dọn dẹp khi khởi động và mỗi 12 giờ
  const tidy = () => cleanup(db).then((n) => { if (n) console.log(`  Đã dọn ${n} tài khoản khách bỏ dở`); }).catch((e) => console.error('Dọn dẹp lỗi:', e.message));
  await tidy(); setInterval(tidy, 12 * 3600e3).unref();
  const server = createServer(createApp(db));
  server.listen(PORT, HOST, () => {
    console.log(`\n  🌷 Bé Học Vui đang chạy tại  http://localhost:${PORT}\n  Dữ liệu: ${db.kind === 'turso' ? 'Turso (đám mây)' : DB_FILE}\n`);
  });
}
export { COOKIE };
