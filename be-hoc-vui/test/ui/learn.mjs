// Kiểm thử giao diện "học kết hợp": câu hỏi trong Bài Màu Sắc / Cá ngựa / Ma sói và giải đố trong Bé tập vẽ.
// Chạy:  npm run build:fast && node test/ui/learn.mjs      (UI_SHOTS=thư-mục để lưu ảnh)
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const mod = process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright';
const { chromium } = await import(mod);
const SHOTS = process.env.UI_SHOTS ? resolve(process.env.UI_SHOTS) : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const PORT = 5900 + Math.floor(Math.random() * 400);
const srv = spawn(process.execPath, [join(ROOT, 'server', 'index.js')], { env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', DB_FILE: ':memory:', DEMO_UNLOCK: '1', TURSO_DATABASE_URL: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
srv.stderr.on('data', (d) => process.stderr.write(d));
const base = `http://127.0.0.1:${PORT}`;
for (let i = 0; i < 50; i++) { try { if ((await fetch(base + '/api/health')).ok) break; } catch { /* chờ */ } await new Promise((r) => setTimeout(r, 200)); }

const fails = [];
const must = (cond, msg) => { if (!cond) fails.push(msg); };
const browser = await chromium.launch();
async function kid(w, h, tag) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'vi-VN' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(base + '/#/');
  const id = await page.evaluate(async () => {
    await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'PH', email: `l${Date.now()}${Math.random()}@t.vn`, password: 'abc123', consent: true }) });
    const j = await (await fetch('/api/children', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: 'Na', grade: 2 }) })).json();
    localStorage.setItem('bhv_child', String(j.child.id));
    return j.child.id;
  });
  await page.goto(base + '/#/lobby'); await page.reload(); await page.waitForTimeout(900);
  const shot = async (label) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `learn-${tag}-${label}.png`) }); };
  const hscroll = async (label) => { const m = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (m[0] > m[1] + 2) fails.push(`${tag} ${label}: tràn ngang`); };
  return { page, id, errs, shot, hscroll, ctx };
}

try {
  for (const [w, h, tag] of [[1366, 768, 'pc'], [390, 844, 'mb']]) {
    const k = await kid(w, h, tag);
    const { page } = k;
    // câu hỏi từ máy chủ
    const q = await page.evaluate(async (id) => (await (await fetch(`/api/children/${id}/questions?n=5&subject=math`)).json()).questions, k.id);
    must(Array.isArray(q) && q.length === 5 && q.every((x) => x.options.length >= 2 && x.subject === 'math'), `${tag}: /questions sai`);
    // Arcade: icon cùng kiểu
    await page.goto(base + '/#/arcade'); await page.waitForTimeout(900);
    must(await page.locator('.arcade-card .game-tile, .arcade-card svg').count() >= 8, `${tag}: arcade thiếu icon`);
    await k.shot('arcade'); await k.hscroll('arcade');
    // Ma sói: màn thiết lập có "Học kết hợp", vào chơi, giải đố
    await page.goto(base + '/#/board/werewolf'); await page.waitForTimeout(900);
    must(await page.locator('.bg-learn').count() === 1, `${tag}: thiếu mô tả học kết hợp`);
    await k.shot('setup'); await k.hscroll('setup');
    await page.locator('.bg-setup .btn', { hasText: 'Chơi với bot' }).click(); await page.waitForTimeout(1200);
    // đi qua đêm đầu: bấm các nút hành động có sẵn cho tới khi thấy nút giải đố
    let found = false;
    for (let i = 0; i < 40 && !found; i++) {
      if (await page.locator('button', { hasText: 'Giải đố' }).count()) { found = true; break; }
      const btn = page.locator('.ww-p.can:not(.me), .ww-side button:not([disabled]):not(:has-text("Giải đố")), .bg-sheet .btn').first();
      if (await btn.count()) await btn.click().catch(() => undefined);
      await page.waitForTimeout(700);
    }
    if (found) {
      await page.locator('button', { hasText: 'Giải đố' }).first().click(); await page.waitForTimeout(800);
      must(await page.locator('.lq-sheet').count() === 1, `${tag}: Ma sói không hiện câu hỏi`);
      await k.shot('ww-quiz'); await k.hscroll('ww-quiz');
      // trả lời đúng: lấy đáp án từ hàng đợi không được → chọn lần lượt, chỉ cần không lỗi
      await page.locator('.lq-opt').first().click(); await page.waitForTimeout(2000);
      must(await page.locator('.ww-line.clue').count() >= 1, `${tag}: không có dòng gợi ý sau khi giải đố`);
      await k.shot('ww-clue');
    } else { await k.shot('ww-stuck'); const dead = await page.locator('.ww-p.me.out').count(); if (!dead && !(await page.locator('.bg-overlay .bg-sheet').count())) fails.push(`${tag}: không tới được lượt thảo luận Ma sói`); }
    // Cá ngựa: bàn có ô ★
    await page.goto(base + '/#/board/ludo'); await page.waitForTimeout(900);
    await page.locator('.bg-setup .btn', { hasText: 'Chơi với bot' }).click(); await page.waitForTimeout(1000);
    let asked = false;
    for (let i = 0; i < 30 && !asked; i++) {
      if (await page.locator('.lq-sheet').count()) { asked = true; break; }
      const roll = page.locator('.dice-btn:not([disabled])').first();
      if (await roll.count()) await roll.click().catch(() => undefined);
      const piece = page.locator('g.horse.can').first();
      if (await piece.count()) await piece.click().catch(() => undefined);
      await page.waitForTimeout(1500);
    }
    must(asked, `${tag}: Cá ngựa chưa hỏi câu nào sau nhiều lượt gieo`);
    if (asked) { await k.shot('ludo-quiz'); await k.hscroll('ludo-quiz'); await page.locator('.lq-opt').first().click(); await page.waitForTimeout(2000); }
    // Bé tập vẽ: phải giải đố trước khi tô
    await page.goto(base + '/#/play/m1c-2'); await page.waitForTimeout(1500);
    for (let i = 0; i < 4 && !(await page.locator('.trace-quiz').count()); i++) { const b = page.locator('.btn', { hasText: /Bắt đầu|Chơi/ }).first(); if (await b.count()) await b.click().catch(() => undefined); await page.waitForTimeout(900); }
    must(await page.locator('.tq-opt').count() === 4, `${tag}: Bé tập vẽ thiếu 4 lựa chọn`);
    await k.shot('trace-pick'); await k.hscroll('trace-pick');
    if (await page.locator('.tq-opt').count()) {
      await page.locator('.tq-opt').first().click(); await page.waitForTimeout(1800);
      must(await page.locator('.trace-board').count() === 1, `${tag}: sau khi chọn không chuyển sang tô`);
      await k.shot('trace-draw');
    }
    must(!k.errs.length, `${tag}: lỗi trang: ${k.errs.join(' | ')}`);
    await k.ctx.close();
  }
} catch (e) { fails.push('ngoại lệ: ' + e.message); }
await browser.close(); srv.kill();
if (fails.length) { console.log('LỖI:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('Học kết hợp: OK');
