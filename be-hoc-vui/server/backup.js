// Sao lưu / khôi phục toàn bộ dữ liệu ra một file JSON. Chạy được với cả SQLite trên máy và Turso.
// Dùng qua scripts/backup.mjs và scripts/restore.mjs.

/** Danh sách bảng dữ liệu (bỏ bảng nội bộ của SQLite). Bảng cha đứng trước bảng con. */
const ORDER = ['parents', 'auth_tokens', 'consents', 'recovery_codes', 'children', 'lesson_progress', 'play_sessions', 'daily_stats', 'badges', 'quests', 'checkins', 'rate_limits', 'client_errors'];

export async function listTables(db) {
  const rows = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all();
  const names = rows.map((r) => r.name);
  return [...ORDER.filter((n) => names.includes(n)), ...names.filter((n) => !ORDER.includes(n)).sort()];
}

export async function backup(db) {
  const tables = {};
  for (const name of await listTables(db)) tables[name] = await db.prepare(`SELECT * FROM "${name}"`).all();
  return { app: 'be-hoc-vui', format: 1, createdAt: new Date().toISOString(), tables };
}

export async function countRows(db) {
  const out = {};
  for (const name of await listTables(db)) out[name] = Number((await db.prepare(`SELECT COUNT(*) n FROM "${name}"`).get()).n);
  return out;
}

/** Khôi phục vào db. Mặc định từ chối nếu db đã có tài khoản (tránh ghi đè nhầm); force = xoá dữ liệu cũ trước. */
export async function restore(db, data, { force = false } = {}) {
  if (data?.app !== 'be-hoc-vui' || data.format !== 1 || typeof data.tables !== 'object') throw new Error('File sao lưu không hợp lệ');
  const existing = Number((await db.prepare('SELECT COUNT(*) n FROM parents').get()).n);
  if (existing > 0 && !force) throw new Error(`Cơ sở dữ liệu đích đã có ${existing} tài khoản. Thêm --force nếu chắc chắn muốn XOÁ và thay bằng bản sao lưu.`);
  const known = new Set(await listTables(db));
  const order = [...ORDER, ...Object.keys(data.tables).filter((n) => !ORDER.includes(n))].filter((n) => data.tables[n] && known.has(n));
  await db.tx(async (t) => {
    if (force) for (const name of [...order].reverse()) await t.prepare(`DELETE FROM "${name}"`).run();
    for (const name of order) {
      for (const row of data.tables[name]) {
        const cols = Object.keys(row);
        if (!cols.length) continue;
        await t.prepare(`INSERT INTO "${name}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(...cols.map((c) => row[c]));
      }
    }
  });
  return countRows(db);
}
