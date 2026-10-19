// Build nhanh giao diện bằng esbuild (dự phòng khi không dùng Vite). Chạy: node scripts/build-fast.mjs
import { mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
html = html.replace('<script type="module" src="/src/main.tsx"></script>', '<link rel="stylesheet" href="/assets/app.css" />\n    <script type="module" src="/assets/app.js"></script>');
writeFileSync(join(out, 'index.html'), html);
if (existsSync(join(ROOT, 'client', 'public'))) cpSync(join(ROOT, 'client', 'public'), out, { recursive: true });
console.log('✔ Đã build vào client/dist');
