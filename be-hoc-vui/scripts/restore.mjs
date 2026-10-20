// Khôi phục dữ liệu từ file sao lưu:  npm run restore -- backups/behocvui-2026-10-20-08-30.json
// Nên khôi phục thử vào một database Turso MỚI (hoặc một file SQLite mới) trước, kiểm tra xong mới dùng thật.
// Cơ sở dữ liệu đích đã có dữ liệu thì bị từ chối, trừ khi thêm --force (xoá dữ liệu cũ rồi thay bằng bản sao lưu).
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from '../server/db.js';
import { restore } from '../server/backup.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
if (!file) { console.error('Cách dùng: npm run restore -- <file sao lưu> [--force]'); process.exit(1); }
const data = JSON.parse(readFileSync(resolve(file), 'utf8'));
const url = process.env.TURSO_DATABASE_URL;
const db = await openDb(url ? { tursoUrl: url, tursoToken: process.env.TURSO_AUTH_TOKEN } : { file: process.env.DB_FILE || join(ROOT, 'data', 'behocvui.db') });
try {
  const counts = await restore(db, data, { force: args.includes('--force') });
  const bad = Object.entries(data.tables).filter(([k, rows]) => counts[k] !== undefined && counts[k] !== rows.length);
  console.log(`\n  ✔ Đã khôi phục từ ${file} (sao lưu lúc ${data.createdAt})`);
  console.log('  ' + Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' · '));
  console.log(bad.length ? `  ✗ Số dòng không khớp: ${bad.map(([k]) => k).join(', ')}\n` : '  ✔ Số dòng mọi bảng khớp với bản sao lưu\n');
  if (bad.length) process.exit(2);
} catch (e) { console.error(`\n  ✗ ${e.message}\n`); process.exit(1); }
