// Lớp cơ sở dữ liệu dùng chung một giao diện bất đồng bộ cho hai chế độ:
//  • SQLite trên máy (module có sẵn node:sqlite) — mặc định, file data/behocvui.db
//  • Turso (SQLite đám mây, gói miễn phí) qua giao thức HTTP "Hrana v2" — khi có TURSO_DATABASE_URL
// Cả hai đều không cần cài thêm gói npm nào.
//
// Giao diện:  db.prepare(sql).get(...args) / .all(...) / .run(...)  → Promise
//             db.exec(sql)                                           → Promise
//             db.tx(async (t) => { ... t.prepare(...)... })           → giao dịch (BEGIN/COMMIT)
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS parents (
    id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, name TEXT NOT NULL, pass_hash TEXT,
    is_guest INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS auth_tokens (
    token TEXT PRIMARY KEY, parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS children (
    id INTEGER PRIMARY KEY AUTOINCREMENT, parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL, grade INTEGER NOT NULL, look TEXT NOT NULL, settings TEXT NOT NULL,
    coins INTEGER NOT NULL DEFAULT 50, xp INTEGER NOT NULL DEFAULT 0, energy INTEGER NOT NULL DEFAULT 10, energy_at INTEGER NOT NULL,
    streak INTEGER NOT NULL DEFAULT 0, streak_date TEXT, chest_date TEXT, owned TEXT NOT NULL DEFAULT '[]', created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS lesson_progress (
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE, lesson_id TEXT NOT NULL,
    stars INTEGER NOT NULL DEFAULT 0, best INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0, completed_at INTEGER,
    PRIMARY KEY (child_id, lesson_id))`,
  `CREATE TABLE IF NOT EXISTS play_sessions (
    id TEXT PRIMARY KEY, child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE, lesson_id TEXT NOT NULL,
    subject TEXT NOT NULL, game TEXT NOT NULL, rounds TEXT NOT NULL, started_at INTEGER NOT NULL, finished_at INTEGER,
    correct INTEGER, total INTEGER, stars INTEGER, coins INTEGER, xp INTEGER, duration_sec INTEGER)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_child ON play_sessions(child_id, finished_at)`,
  `CREATE TABLE IF NOT EXISTS daily_stats (
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE, day TEXT NOT NULL,
    seconds INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0, answered INTEGER NOT NULL DEFAULT 0, lessons INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (child_id, day))`,
  `CREATE TABLE IF NOT EXISTS badges (
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE, badge_id TEXT NOT NULL, earned_at INTEGER NOT NULL,
    PRIMARY KEY (child_id, badge_id))`,
  `CREATE TABLE IF NOT EXISTS quests (
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE, day TEXT NOT NULL, quest_id TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0, claimed INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (child_id, day, quest_id))`,
  `CREATE TABLE IF NOT EXISTS checkins (
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE, day TEXT NOT NULL, seq INTEGER NOT NULL,
    coins INTEGER NOT NULL DEFAULT 0, energy INTEGER NOT NULL DEFAULT 0, item TEXT, PRIMARY KEY (child_id, day))`,
];

/** Bảng phụ thuộc vào children — xoá thủ công để chạy đúng cả khi foreign key không bật (Turso). */
export const CHILD_TABLES = ['lesson_progress', 'play_sessions', 'daily_stats', 'badges', 'quests', 'checkins'];

// ======================= SQLite trên máy =======================
async function localAdapter(file) {
  const origEmit = process.emitWarning;
  process.emitWarning = function (w, ...rest) { if (String(w?.message ?? w).includes('SQLite')) return; return origEmit.call(process, w, ...rest); };
  const { DatabaseSync } = await import('node:sqlite');
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const raw = new DatabaseSync(file);
  raw.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');
  const cache = new Map();
  const stmt = (sql) => { let s = cache.get(sql); if (!s) { s = raw.prepare(sql); cache.set(sql, s); } return s; };
  const plain = (row) => (row ? { ...row } : undefined);

  // Khoá đơn giản: khi đang có giao dịch, các truy vấn khác phải chờ (tránh lọt vào giao dịch).
  let lock = Promise.resolve();
  const make = (gate) => ({
    prepare: (sql) => ({
      get: async (...a) => { await gate(); return plain(stmt(sql).get(...a)); },
      all: async (...a) => { await gate(); return stmt(sql).all(...a).map(plain); },
      run: async (...a) => { await gate(); const r = stmt(sql).run(...a); return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) }; },
    }),
    exec: async (sql) => { await gate(); raw.exec(sql); },
  });
  const db = make(() => lock);
  db.kind = 'sqlite';
  db.tx = async (fn) => {
    const prev = lock; let release; lock = new Promise((r) => (release = r));
    await prev;
    raw.exec('BEGIN');
    try { const res = await fn(make(() => undefined)); raw.exec('COMMIT'); return res; }
    catch (e) { raw.exec('ROLLBACK'); throw e; }
    finally { release(); }
  };
  db.close = () => raw.close();
  return db;
}

// ======================= Turso (HTTP / Hrana v2) =======================
export function tursoAdapter(url, token, fetchImpl = fetch) {
  const root = url.replace(/^libsql:\/\//, 'https://').replace(/^wss?:\/\//, 'https://').replace(/\/$/, '');
  const enc = (v) => {
    if (v === null || v === undefined) return { type: 'null' };
    if (typeof v === 'bigint') return { type: 'integer', value: v.toString() };
    if (typeof v === 'boolean') return { type: 'integer', value: v ? '1' : '0' };
    if (typeof v === 'number') return Number.isInteger(v) ? { type: 'integer', value: String(v) } : { type: 'float', value: v };
    return { type: 'text', value: String(v) };
  };
  const dec = (c) => {
    switch (c?.type) {
      case 'integer': return Number(c.value);
      case 'float': return Number(c.value);
      case 'text': return c.value;
      case 'blob': return Buffer.from(c.base64 ?? '', 'base64');
      default: return null;
    }
  };
  async function pipeline(requests, stream = { baton: null, base: root }) {
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetchImpl(`${stream.base}/v2/pipeline`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ baton: stream.baton, requests }),
        });
        if (!res.ok) throw Object.assign(new Error(`Turso HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`), { retry: res.status >= 500 && !stream.baton });
        const data = await res.json();
        for (const r of data.results) if (r.type === 'error') throw new Error(`Turso: ${r.error?.message ?? 'lỗi không rõ'}`);
        stream.baton = data.baton ?? null;
        if (data.base_url) stream.base = data.base_url.replace(/\/$/, '');
        return data.results;
      } catch (e) {
        lastErr = e;
        if (!e.retry && !(e.cause || e.name === 'TypeError')) throw e; // chỉ thử lại khi lỗi mạng / 5xx
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
    throw lastErr;
  }
  const rowsOf = (result) => result.rows.map((row) => Object.fromEntries(result.cols.map((c, i) => [c.name, dec(row[i])])));
  const make = (exec) => ({
    prepare: (sql) => ({
      get: async (...a) => rowsOf(await exec(sql, a))[0],
      all: async (...a) => rowsOf(await exec(sql, a)),
      run: async (...a) => { const r = await exec(sql, a); return { changes: r.affected_row_count, lastInsertRowid: r.last_insert_rowid == null ? null : Number(r.last_insert_rowid) }; },
    }),
    exec: async (sql) => { await exec(sql, []); },
  });
  const one = async (sql, args) => (await pipeline([{ type: 'execute', stmt: { sql, args: args.map(enc) } }, { type: 'close' }]))[0].response.result;
  const db = make(one);
  db.kind = 'turso';
  db.tx = async (fn) => {
    const stream = { baton: null, base: root };
    await pipeline([{ type: 'execute', stmt: { sql: 'BEGIN' } }], stream);
    const t = make(async (sql, args) => (await pipeline([{ type: 'execute', stmt: { sql, args: args.map(enc) } }], stream))[0].response.result);
    try {
      const res = await fn(t);
      await pipeline([{ type: 'execute', stmt: { sql: 'COMMIT' } }, { type: 'close' }], stream);
      return res;
    } catch (e) {
      try { await pipeline([{ type: 'execute', stmt: { sql: 'ROLLBACK' } }, { type: 'close' }], stream); } catch { /* bỏ qua */ }
      throw e;
    }
  };
  db.close = () => undefined;
  return db;
}

/** Mở cơ sở dữ liệu và tạo bảng nếu chưa có. */
export async function openDb({ file = ':memory:', tursoUrl, tursoToken, fetchImpl } = {}) {
  const db = tursoUrl ? tursoAdapter(tursoUrl, tursoToken, fetchImpl) : await localAdapter(file);
  for (const sql of SCHEMA) await db.exec(sql);
  return db;
}
