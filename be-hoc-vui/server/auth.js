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
  const row = (await db.prepare('SELECT p.*, t.token FROM auth_tokens t JOIN parents p ON p.id = t.parent_id WHERE t.token = ? AND t.expires_at > ?').get(token, Date.now()));
  return row ?? null;
}
export async function requireParent(db, req) {
  const p = (await currentParent(db, req));
  if (!p) throw new HttpError(401, 'UNAUTHORIZED');
  return p;
}

// Giới hạn số lần đăng nhập sai theo IP (đơn giản, trong bộ nhớ).
const attempts = new Map();
export function checkRate(key) {
  const now = Date.now();
  const a = attempts.get(key) ?? { n: 0, t: now };
  if (now - a.t > 15 * 60e3) { a.n = 0; a.t = now; }
  if (a.n >= 10) throw new HttpError(429, 'TOO_MANY_ATTEMPTS');
  return { fail: () => { a.n++; attempts.set(key, a); }, ok: () => attempts.delete(key) };
}
