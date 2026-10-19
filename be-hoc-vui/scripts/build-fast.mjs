// Build nhanh giao diện bằng esbuild (dự phòng khi không dùng Vite). Chạy: node scripts/build-fast.mjs
import { mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const esbuildPath = process.env.ESBUILD_PATH;
const { build } = await import(esbuildPath ? pathToFileURL(esbuildPath).href : 'esbuild');
const out = join(ROOT, 'client', 'dist');
mkdirSync(join(out, 'assets'), { recursive: true });
await build({
  entryPoints: [join(ROOT, 'client', 'src', 'main.tsx')],
  bundle: true, minify: true, format: 'esm', target: 'es2020', jsx: 'automatic',
  outfile: join(out, 'assets', 'app.js'), loader: { '.css': 'css' },
  nodePaths: [join(ROOT, 'client', 'node_modules'), join(ROOT, 'node_modules')],
  define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'info',
});
let html = readFileSync(join(ROOT, 'client', 'index.html'), 'utf8');
// gắn mã phiên bản để trình duyệt (và service worker) luôn tải bản mới sau mỗi lần build
const ver = createHash('sha1').update(readFileSync(join(out, 'assets', 'app.js'))).update(readFileSync(join(out, 'assets', 'app.css'))).digest('hex').slice(0, 10);
html = html.replace('<script type="module" src="/src/main.tsx"></script>', `<link rel="stylesheet" href="/assets/app.css?v=${ver}" />\n    <script type="module" src="/assets/app.js?v=${ver}"></script>`);
writeFileSync(join(out, 'index.html'), html);
if (existsSync(join(ROOT, 'client', 'public'))) cpSync(join(ROOT, 'client', 'public'), out, { recursive: true });
console.log('✔ Đã build vào client/dist');
