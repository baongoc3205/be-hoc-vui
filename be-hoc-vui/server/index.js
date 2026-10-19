// Máy chủ "Bé Học Vui" — API + phục vụ giao diện. Chạy: node server/index.js
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { openDb, CHILD_TABLES } from './db.js';
import { createRouter, HttpError, readJson, sendJson, serveStatic } from './http.js';
import { checkRate, clearCookie, currentParent, hashPassword, issueToken, requireParent, sessionCookie, verifyPassword, COOKIE } from './auth.js';
import * as G from './game.js';

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
  const r = createRouter();
  const childOf = async (req, id) => G.getChild(db, (await requireParent(db, req)).id, id);
  const parentPublic = (p) => ({ id: p.id, name: p.name, email: p.email, isGuest: !!p.is_guest });
  const validEmail = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e);

  // ---------- Xác thực phụ huynh ----------
  r.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = await readJson(req);
    const em = String(email ?? '').trim().toLowerCase();
    if (!validEmail(em)) throw new HttpError(400, 'BAD_EMAIL');
    if (String(password ?? '').length < 6) throw new HttpError(400, 'WEAK_PASSWORD');
    const nm = String(name ?? '').trim().slice(0, 40) || 'Phụ huynh';
    if ((await db.prepare('SELECT 1 FROM parents WHERE email = ?').get(em))) throw new HttpError(409, 'EMAIL_TAKEN');
    const id = (await db.prepare('INSERT INTO parents (email, name, pass_hash, created_at) VALUES (?, ?, ?, ?)').run(em, nm, hashPassword(password), Date.now())).lastInsertRowid;
    const token = (await issueToken(db, id));
    return [201, { parent: parentPublic((await db.prepare('SELECT * FROM parents WHERE id = ?').get(id))) }, { 'Set-Cookie': sessionCookie(token, SECURE) }];
  });
  r.post('/api/auth/login', async (req, res) => {
    const ip = process.env.TRUST_PROXY === '1' ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '';
    const rate = checkRate(ip || req.socket.remoteAddress || 'x');
    const { email, password } = await readJson(req);
    const p = (await db.prepare('SELECT * FROM parents WHERE email = ?').get(String(email ?? '').trim().toLowerCase()));
    if (!p || !verifyPassword(String(password ?? ''), p.pass_hash)) { rate.fail(); throw new HttpError(401, 'BAD_CREDENTIALS'); }
    rate.ok();
    return [200, { parent: parentPublic(p) }, { 'Set-Cookie': sessionCookie((await issueToken(db, p.id)), SECURE) }];
  });
  r.post('/api/auth/guest', async () => {
    const id = (await db.prepare('INSERT INTO parents (name, is_guest, created_at) VALUES (?, 1, ?)').run('Khách', Date.now())).lastInsertRowid;
    return [201, { parent: parentPublic((await db.prepare('SELECT * FROM parents WHERE id = ?').get(id))) }, { 'Set-Cookie': sessionCookie((await issueToken(db, id)), SECURE) }];
  });
  r.post('/api/auth/upgrade', async (req) => {
    const p = (await requireParent(db, req));
    if (!p.is_guest) throw new HttpError(400, 'NOT_GUEST');
    const { name, email, password } = await readJson(req);
    const em = String(email ?? '').trim().toLowerCase();
    if (!validEmail(em)) throw new HttpError(400, 'BAD_EMAIL');
    if (String(password ?? '').length < 6) throw new HttpError(400, 'WEAK_PASSWORD');
    if ((await db.prepare('SELECT 1 FROM parents WHERE email = ?').get(em))) throw new HttpError(409, 'EMAIL_TAKEN');
    (await db.prepare('UPDATE parents SET email = ?, name = ?, pass_hash = ?, is_guest = 0 WHERE id = ?').run(em, String(name ?? '').trim().slice(0, 40) || 'Phụ huynh', hashPassword(password), p.id));
    return [200, { parent: parentPublic((await db.prepare('SELECT * FROM parents WHERE id = ?').get(p.id))) }];
  });
  r.post('/api/auth/logout', async (req) => {
    const p = (await currentParent(db, req));
    if (p) (await db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(p.token));
    return [200, { ok: true }, { 'Set-Cookie': clearCookie() }];
  });
  r.get('/api/auth/me', async (req) => {
    const p = (await currentParent(db, req));
    return [200, { parent: p ? parentPublic(p) : null }];
  });
  r.post('/api/auth/verify', async (req) => {
    // Xác nhận lại mật khẩu cho các thao tác nhạy cảm (xoá hồ sơ…)
    const p = (await requireParent(db, req));
    const { password } = await readJson(req);
    if (p.is_guest) return [200, { ok: true }];
    if (!verifyPassword(String(password ?? ''), p.pass_hash)) throw new HttpError(401, 'BAD_CREDENTIALS');
    return [200, { ok: true }];
  });
  r.post('/api/auth/password', async (req) => {
    const p = (await requireParent(db, req));
    const { current, next } = await readJson(req);
    if (p.is_guest) throw new HttpError(400, 'NOT_REGISTERED');
    if (!verifyPassword(String(current ?? ''), p.pass_hash)) throw new HttpError(401, 'BAD_CREDENTIALS');
    if (String(next ?? '').length < 6) throw new HttpError(400, 'WEAK_PASSWORD');
    (await db.prepare('UPDATE parents SET pass_hash = ? WHERE id = ?').run(hashPassword(next), p.id));
    return [200, { ok: true }];
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
    await db.tx(async (t) => {
      for (const tb of CHILD_TABLES) await t.prepare(`DELETE FROM ${tb} WHERE child_id = ?`).run(c.id);
      await t.prepare('DELETE FROM children WHERE id = ?').run(c.id);
    });
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
  r.post('/api/children/:id/checkin', async (req, res, { id }) => [200, (await G.doCheckin(db, await childOf(req, id)))]);
  r.post('/api/children/:id/daily-chest', async (req, res, { id }) => [200, (await G.openDailyChest(db, await childOf(req, id)))]);
  r.post('/api/children/:id/quests/:qid/claim', async (req, res, { id, qid }) => [200, (await G.claimQuest(db, await childOf(req, id), qid))]);
  r.post('/api/children/:id/shop/:itemId', async (req, res, { id, itemId }) => [200, (await G.buyItem(db, await childOf(req, id), itemId))]);
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
      sendJson(res, status, data, headers);
    } catch (e) {
      if (e instanceof HttpError) return sendJson(res, e.status, { error: e.code });
      console.error(e);
      sendJson(res, 500, { error: 'SERVER_ERROR' });
    }
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const db = await openDb(tursoUrl ? { tursoUrl, tursoToken: process.env.TURSO_AUTH_TOKEN } : { file: DB_FILE });
  // dọn token hết hạn
  (await db.prepare('DELETE FROM auth_tokens WHERE expires_at < ?').run(Date.now()));
  const server = createServer(createApp(db));
  server.listen(PORT, HOST, () => {
    console.log(`\n  🌷 Bé Học Vui đang chạy tại  http://localhost:${PORT}\n  Dữ liệu: ${db.kind === 'turso' ? 'Turso (đám mây)' : DB_FILE}\n`);
  });
}
export { COOKIE };
