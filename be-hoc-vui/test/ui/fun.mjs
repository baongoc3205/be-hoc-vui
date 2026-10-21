// Kiểm thử giao diện "Vui học kiểu mới": tia số, cân, pizza, đi chợ, tìm lỗi, xếp câu, câu cá — trên máy tính và điện thoại.
// Chạy:  npm run build:fast && node test/ui/fun.mjs      (UI_SHOTS=thư-mục để lưu ảnh)
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
// một thao tác trả lời bất kỳ cho từng game (đúng hay sai không quan trọng, chỉ cần ra phản hồi)
const ACT = {
  'number-line': async (p) => { const b = await p.locator('.nl-svg').boundingBox(); await p.mouse.click(b.x + b.width * 0.55, b.y + b.height * 0.6); await p.locator('.fun-card .btn', { hasText: 'Kiểm tra' }).click(); },
  balance: async (p) => { await p.locator('.bal-w').first().click(); },
  pizza: async (p) => { await p.locator('.pz-slice').first().click(); await p.locator('.fun-card .btn', { hasText: 'Kiểm tra' }).click(); },
  market: async (p) => { await p.locator('.mk-wallet .vnd-note').first().click(); await p.locator('.fun-card .btn', { hasText: 'Kiểm tra' }).click(); },
  'spot-mistake': async (p) => { await p.locator('.spot-w').first().click(); },
  sentence: async (p) => { const n = await p.locator('.sent-pool .sent-w').count(); for (let i = 0; i < n; i++) await p.locator('.sent-pool .sent-w:not([disabled])').first().click(); },
  fishing: async (p) => { await p.locator('.fish').first().dispatchEvent('click'); },
};
const LESSONS = { 'number-line': 'fun-math2-1', pizza: 'fun-math2-2', market: 'fun-math2-3', balance: 'fun-math2-4', fishing: 'fun-math2-5', 'spot-mistake': 'fun-vietnamese3-1', sentence: 'fun-english4-1' };

try {
  for (const [w, h, tag] of [[1366, 768, 'pc'], [390, 844, 'mb']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'vi-VN' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(base + '/#/');
    await page.evaluate(async () => {
      await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'PH', email: `f${Date.now()}${Math.random()}@t.vn`, password: 'abc123', consent: true }) });
      const j = await (await fetch('/api/children', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: 'Na', grade: 2 }) })).json();
      await fetch(`/api/children/${j.child.id}/checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      await fetch(`/api/children/${j.child.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: { energy: false } }) });
      localStorage.setItem('bhv_child', String(j.child.id));
    });
    for (const [game, lesson] of Object.entries(LESSONS)) {
      await page.goto(`${base}/#/play/${lesson}?r=${Date.now()}`); await page.reload(); await page.waitForTimeout(1500);
      try { await ACT[game](page); } catch (e) { fails.push(`${tag} ${game}: không thao tác được (${e.message.split('\n')[0]})`); continue; }
      await page.waitForTimeout(1300);
      must(await page.locator('.feedback').count() === 1, `${tag} ${game}: không có phản hồi sau khi trả lời`);
      const m = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      must(m[0] <= m[1] + 2, `${tag} ${game}: tràn ngang`);
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `fun-${tag}-${game}.png`) });
    }
    // chơi trọn một màn Tìm lỗi sai tới bảng kết quả
    await page.goto(`${base}/#/play/fun-vietnamese3-1?r=${Date.now()}`); await page.reload(); await page.waitForTimeout(1500);
    for (let i = 0; i < 12 && !(await page.locator('.result').count()); i++) {
      const wbtn = page.locator('.spot-w:not([disabled])').first();
      if (await wbtn.count()) await wbtn.click();
      await page.waitForTimeout(500);
      const nx = page.locator('.feedback .btn'); if (await nx.count()) await nx.click();
      await page.waitForTimeout(700);
    }
    must(await page.locator('.result').count() === 1, `${tag}: chơi hết màn Tìm lỗi sai không ra bảng kết quả`);
    must(!errs.length, `${tag}: lỗi trang: ${errs.join(' | ')}`);
    await ctx.close();
  }
} catch (e) { fails.push('ngoại lệ: ' + e.message); }
await browser.close(); srv.kill();
if (fails.length) { console.log('LỖI:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('Vui học kiểu mới: OK');
