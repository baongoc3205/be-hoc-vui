// Xác thực phụ huynh: mật khẩu băm scrypt + token phiên lưu trong cookie httpOnly.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { HttpError, parseCookies } from './http.js';

export const COOKIE = 'bhv_session';
const TOKEN_DAYS = 60;

export function hashPassword(pw) {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}
export function verifyPassword(pw, stored) {
  if (!stored) return false;
  const [, saltHex, hashHex] = stored.split('$');
  const hash = scryptSync(pw, Buffer.from(saltHex, 'hex'), 64);
  const expected = Buffer.from(hashHex, 'hex');
  return expected.length === hash.length && timingSafeEqual(hash, expected);
}

export async function issueToken(db, parentId) {
  const token = randomBytes(32).toString('base64url');
  (await db.prepare('INSERT INTO auth_tokens (token, parent_id, expires_at) VALUES (?, ?, ?)').run(token, parentId, Date.now() + TOKEN_DAYS * 864e5));
  return token;
}
export function sessionCookie(token, secure) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_DAYS * 86400}${secure ? '; Secure' : ''}`;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export async function currentParent(db, req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token) return null;
  const row = (await db.prepare('SELECT p.*, t.token, t.expires_at AS token_expires FROM auth_tokens t JOIN parents p ON p.id = t.parent_id WHERE t.token = ? AND t.expires_at > ?').get(token, Date.now()));
  return row ?? null;
}
/** Gia hạn phiên khi còn dưới 45 ngày: bé dùng thường xuyên thì không bao giờ bị đăng xuất (quan trọng với tài khoản khách). */
export async function refreshToken(db, p, secure) {
  if (!p?.token || p.token_expires - Date.now() > 45 * 864e5) return null;
  await db.prepare('UPDATE auth_tokens SET expires_at = ? WHERE token = ?').run(Date.now() + TOKEN_DAYS * 864e5, p.token);
  return sessionCookie(p.token, secure);
}
export async function requireParent(db, req) {
  const p = (await currentParent(db, req));
  if (!p) throw new HttpError(401, 'UNAUTHORIZED');
  return p;
}

/**
 * Giới hạn số lần thử (đăng nhập sai, gửi email…) theo khoá, lưu trong DB.
 * max lần trong windowMs; vượt quá → 429. fail() cộng 1, ok() xoá bộ đếm, hit() cộng ngay (cho thao tác luôn tính).
 */
export async function checkRate(db, key, max = 10, windowMs = 15 * 60e3) {
  const now = Date.now();
  let a = await db.prepare('SELECT n, t FROM rate_limits WHERE key = ?').get(key);
  if (a && now - a.t > windowMs) { await db.prepare('DELETE FROM rate_limits WHERE key = ?').run(key); a = null; }
  if (a && a.n >= max) throw new HttpError(429, 'TOO_MANY_ATTEMPTS');
  const bump = () => db.prepare('INSERT INTO rate_limits (key, n, t) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET n = n + 1').run(key, now);
  return { fail: bump, hit: bump, ok: () => db.prepare('DELETE FROM rate_limits WHERE key = ?').run(key) };
}
