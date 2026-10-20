// Sao lưu toàn bộ dữ liệu ra file JSON trong thư mục backups/.
// Dùng Turso:   đặt TURSO_DATABASE_URL và TURSO_AUTH_TOKEN (giống trên Render) rồi chạy  npm run backup
// Dùng file:    DB_FILE=data/behocvui.db npm run backup   (mặc định data/behocvui.db)
// ⚠ File sao lưu chứa dữ liệu cá nhân: cất ở nơi an toàn, KHÔNG đưa lên GitHub.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from '../server/db.js';
import { backup, countRows } from '../server/backup.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.TURSO_DATABASE_URL;
const db = await openDb(url ? { tursoUrl: url, tursoToken: process.env.TURSO_AUTH_TOKEN } : { file: process.env.DB_FILE || join(ROOT, 'data', 'behocvui.db') });
const data = await backup(db);
const dir = resolve(process.env.BACKUP_DIR || join(ROOT, 'backups'));
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
const file = join(dir, `behocvui-${stamp}.json`);
writeFileSync(file, JSON.stringify(data));
const counts = await countRows(db);
console.log(`\n  ✔ Đã sao lưu ${url ? 'Turso' : 'file SQLite'} vào ${file}`);
console.log('  ' + Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' · ') + '\n');
