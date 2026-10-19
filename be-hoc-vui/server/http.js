// Bộ định tuyến HTTP tối giản trên node:http (không cần Express).
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

export class HttpError extends Error {
  constructor(status, code, message) { super(message ?? code); this.status = status; this.code = code; }
}

export function createRouter() {
  const routes = [];
  const add = (method, path, handler) => {
    const keys = [];
    const re = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    routes.push({ method, re, keys, handler });
  };
  const match = (method, pathname) => {
    for (const r of routes) {
      if (r.method !== method) continue;
      const m = r.re.exec(pathname);
      if (m) return { handler: r.handler, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
    }
    return null;
  };
  return { get: (p, h) => add('GET', p, h), post: (p, h) => add('POST', p, h), patch: (p, h) => add('PATCH', p, h), del: (p, h) => add('DELETE', p, h), match };
}

export async function readJson(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new HttpError(413, 'TOO_LARGE')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new HttpError(400, 'BAD_JSON')); }
    });
    req.on('error', reject);
  });
}

export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function sendJson(res, status, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

/** Phục vụ file tĩnh của client đã build; đường dẫn không có thì trả index.html (SPA). */
export function serveStatic(req, res, root) {
  const url = new URL(req.url, 'http://x');
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html');
  if (!existsSync(file)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Chưa build giao diện. Chạy: npm run build'); }
  const ext = extname(file);
  res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600' });
  createReadStream(file).pipe(res);
}
