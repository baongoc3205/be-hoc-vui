// Kiểm thử giao diện: tặng quà từ cửa hàng, hộp quà, thú cưng, hàng giới hạn ngày lễ, bé trai.
// Chạy:  npm run build:fast && node test/ui/gifts.mjs      (UI_SHOTS=thư-mục để lưu ảnh)
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
async function kid(name, look, w = 1366, h = 768) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'vi-VN' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(base + '/#/');
  const id = await page.evaluate(async ([nick, lk]) => {
    await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'PH', email: `g${Date.now()}${Math.random()}@t.vn`, password: 'abc123', consent: true }) });
    const j = await (await fetch('/api/children', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: nick, grade: 3, look: lk }) })).json();
    await fetch(`/api/children/${j.child.id}/checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    localStorage.setItem('bhv_child', String(j.child.id));
    return j.child.id;
  }, [name, look]);
  await page.goto(base + '/#/lobby'); await page.reload(); await page.waitForTimeout(900);
  const shot = async (label) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `gifts-${name}-${label}.png`) }); };
  const hscroll = async (label) => { const m = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (m[0] > m[1] + 2) fails.push(`${name} ${label}: tràn ngang`); };
  const api = (path, method = 'GET', body) => page.evaluate(async ([p, m, b]) => { const r = await fetch(p, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return r.json(); }, [path, method, body]);
  return { page, id, errs, shot, hscroll, ctx, api };
}
const closeDialogs = async (p) => { for (let i = 0; i < 3; i++) { const b = p.locator('.dialog button', { hasText: /Để sau|Đóng/ }).first(); if (await b.count()) await b.click().catch(() => undefined); await p.waitForTimeout(250); } };

try {
  const na = await kid('Na', { gender: 'girl', pet: 'chick' }, Number(process.env.NA_W || 1366), Number(process.env.NA_H || 768));
  const bin = await kid('Bin', { gender: 'boy', pet: 'chick' }, 390, 844);
  const code = (await bin.api(`/api/children/${bin.id}/friends`)).code;
  await na.api(`/api/children/${na.id}/friends`, 'POST', { code });
  await bin.api(`/api/children/${bin.id}/friends/${na.id}/accept`, 'POST');
  // màn Bạn bè trên điện thoại: hàng bạn có nút Mời chơi / 🎁 / Hồ sơ không bị tràn
  await bin.page.goto(base + '/#/friends'); await bin.page.waitForTimeout(1200); await closeDialogs(bin.page);
  await bin.shot('friends'); await bin.hscroll('friends');
  const row = await bin.page.locator('.friend-row').first().boundingBox();
  must(row && row.x + row.width <= 392, 'hàng bạn bè tràn khỏi màn hình điện thoại');
  // cửa hàng của Na: chọn món rẻ, bấm Tặng bạn
  await na.page.goto(base + '/#/shop'); await na.page.waitForTimeout(900); await closeDialogs(na.page);
  await na.page.locator('.side-tabs button, .sidetabs button, [role=tab]', { hasText: 'Phụ kiện' }).first().click().catch(() => undefined);
  await na.page.waitForTimeout(500);
  const cards = na.page.locator('.item-card:not(.locked)');
  await cards.first().click(); await na.page.waitForTimeout(300);
  const giftBtn = na.page.locator('.panel-actions button', { hasText: 'Tặng bạn' });
  must(await giftBtn.count() === 1, 'không có nút Tặng bạn khi chọn món');
  await giftBtn.click(); await na.page.waitForTimeout(800);
  must(await na.page.locator('.gift-person', { hasText: 'Bin' }).count() === 1, 'hộp thoại tặng quà không có Bin');
  await na.page.locator('.gift-person', { hasText: 'Bin' }).click();
  await na.shot('gift-dialog'); await na.hscroll('gift-dialog');
  await na.page.locator('.dialog-actions button', { hasText: /Tặng/ }).click(); await na.page.waitForTimeout(1200);
  // Bin nhận quà: thanh báo + hộp quà
  await bin.page.goto(base + '/#/lobby'); await bin.page.reload(); await bin.page.waitForTimeout(1500); await closeDialogs(bin.page);
  await bin.page.waitForTimeout(800);
  must(await bin.page.locator('.gift-banner').count() === 1, 'Bin không thấy thanh báo có quà');
  await bin.shot('banner'); await bin.hscroll('banner');
  await bin.page.locator('.gift-banner button', { hasText: 'Mở ngay' }).click(); await bin.page.waitForTimeout(700);
  await bin.page.locator('.gift-row button', { hasText: 'Mở quà' }).first().click(); await bin.page.waitForTimeout(1800);
  must(await bin.page.locator('.gift-row.opened').count() === 1, 'mở quà không được');
  await bin.shot('inbox-open'); await bin.hscroll('inbox-open');
  await bin.page.locator('.gift-row button', { hasText: 'Mặc ngay' }).first().click(); await bin.page.waitForTimeout(700);
  // thú cưng: tab Thú cưng ở Nhân vật, cho ăn
  await bin.page.goto(base + '/#/character'); await bin.page.waitForTimeout(900); await closeDialogs(bin.page);
  await bin.page.locator('button', { hasText: /^Thú cưng$/ }).first().click(); await bin.page.waitForTimeout(500);
  await bin.page.locator('button', { hasText: 'Cho ăn' }).click(); await bin.page.waitForTimeout(900);
  must(await bin.page.locator('button', { hasText: 'Hôm nay bé cho ăn rồi' }).count() === 1, 'cho ăn không ghi nhận');
  await bin.shot('pet'); await bin.hscroll('pet');
  // hàng giới hạn: tab Sắp mở bán có khoá, nút Mua bị khoá
  await na.page.goto(base + '/#/shop'); await na.page.waitForTimeout(900); await closeDialogs(na.page);
  await na.page.locator('button', { hasText: 'Sắp mở bán' }).first().click(); await na.page.waitForTimeout(600);
  await na.page.locator('.item-card.locked').first().click(); await na.page.waitForTimeout(300);
  must(await na.page.locator('.panel-actions button', { hasText: 'Chưa mở bán' }).count() === 1, 'món chưa mở bán vẫn mua được');
  await na.shot('soon');
  for (const k of [na, bin]) must(!k.errs.length, `lỗi trang: ${k.errs.join(' | ')}`);
} catch (e) { fails.push('ngoại lệ: ' + e.message.split('\n').slice(0, 6).join(' | ')); }
await browser.close(); srv.kill();
if (fails.length) { console.log('LỖI:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('Tặng quà, thú cưng, hàng giới hạn: OK');
