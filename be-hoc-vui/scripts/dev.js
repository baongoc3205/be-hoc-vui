// Chạy đồng thời server API (tự khởi động lại khi sửa code) và Vite (giao diện có hot-reload).
// Dùng: npm run dev  → mở http://localhost:5173
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const viteBin = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
if (!existsSync(viteBin)) {
  console.error('\n  Chưa cài Vite. Chạy "npm install" trước nhé.\n');
  process.exit(1);
}
const procs = [
  spawn(process.execPath, ['--watch', 'server/index.js'], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, PORT: process.env.PORT || '5174' } }),
  spawn(process.execPath, [viteBin, '--config', 'client/vite.config.ts'], { cwd: ROOT, stdio: 'inherit' }),
];
const stop = () => { procs.forEach((p) => p.kill()); process.exit(0); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
procs.forEach((p) => p.on('exit', (code) => { if (code) stop(); }));
