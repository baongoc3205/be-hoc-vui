// Kiểm thử giao diện chơi cùng bạn: mọi minigame (thi đua cùng đề) và Ma sói nhiều người, máy tính + điện thoại.
// Chạy:  npm run build:fast && node test/ui/rooms.mjs      (UI_SHOTS=thư-mục để lưu ảnh)
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
async function kid(name, w = 1366, h = 768) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'vi-VN' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(base + '/#/');
  const id = await page.evaluate(async (nick) => {
    await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'PH', email: `s${Date.now()}${Math.random()}@t.vn`, password: 'abc123', consent: true }) });
    const j = await (await fetch('/api/children', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: nick, grade: 3 }) })).json();
    await fetch(`/api/children/${j.child.id}/checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    localStorage.setItem('bhv_child', String(j.child.id));
    return j.child.id;
  }, name);
  await page.goto(base + '/#/lobby'); await page.reload(); await page.waitForTimeout(900);
  const shot = async (label) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `rooms-${name}-${label}.png`) }); };
  const noScroll = async (label) => { const m = await page.evaluate(() => { const e = document.querySelector('.screen-content'); return e ? [e.scrollHeight, e.clientHeight, document.documentElement.scrollWidth, document.documentElement.clientWidth] : null; }); if (m && m[2] > m[3] + 2) fails.push(`${name} ${label}: tràn ngang`); };
  return { page, id, errs, shot, noScroll, ctx };
}

try {
  const na = await kid('Na');
  const bin = await kid('Bin', 390, 844);
  const api = (k, path, method = 'GET', body) => k.page.evaluate(async ([p, m, b]) => { const r = await fetch(p, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return r.json(); }, [path, method, body]);
  const code = (await api(bin, `/api/children/${bin.id}/friends`)).code;
  await api(na, `/api/children/${na.id}/friends`, 'POST', { code });
  await api(bin, `/api/children/${bin.id}/friends/${na.id}/accept`, 'POST');
  // 1. Khu vui chơi: chọn "Chơi cùng bạn" cho Chém trái cây
  await na.page.goto(base + '/#/arcade'); await na.page.waitForTimeout(1000);
  await na.page.locator('.arcade-card', { hasText: 'Chém trái cây' }).click(); await na.page.waitForTimeout(400);
  await na.page.locator('.arcade-mode button', { hasText: 'Chơi cùng bạn' }).click();
  await na.shot('arcade-mode');
  await na.page.locator('.arcade-subj').first().click(); await na.page.waitForTimeout(1300);
  must(na.page.url().includes('/room/'), 'Chơi cùng bạn ở Khu vui chơi không tạo phòng');
  // mời Bin trong phòng chờ, Bin vào bằng thanh lời mời
  await bin.page.goto(base + '/#/lobby'); await bin.page.waitForTimeout(500);
  await na.page.locator('.room-inv', { hasText: 'Bin' }).click(); await na.page.waitForTimeout(400);
  for (let i = 0; i < 25 && !(await bin.page.locator('.invite-banner').count()); i++) await bin.page.waitForTimeout(1000);
  must(await bin.page.locator('.invite-banner', { hasText: 'Chém trái cây' }).count() > 0, 'Bin không thấy lời mời Chém trái cây');
  await bin.shot('invite'); await bin.noScroll('invite');
  await bin.page.locator('.invite-banner .btn-orange').click(); await bin.page.waitForTimeout(1500);
  await na.page.waitForTimeout(1200);
  await na.page.locator('.room-lobby .btn-orange').click(); await na.page.waitForTimeout(4800);
  for (const k of [na, bin]) {
    must(await k.page.locator('.race-board').count() === 1, `${k.name ?? ''} không thấy bàn chơi thi đua`);
    must(await k.page.locator('.duel-p').count() === 2, 'thi đua phải có 2 người');
  }
  await na.shot('race-fruit'); await bin.shot('race-fruit'); await bin.noScroll('race-fruit');
  await na.page.locator('.back-pill').click(); await na.page.waitForTimeout(400);
  await bin.page.locator('.back-pill').click(); await bin.page.waitForTimeout(400);
  // 2. các minigame còn lại: tạo phòng bằng API, vào chơi một mình với bot, kiểm tra hiện đúng game
  for (const g of ['candy-match', 'slingshot', 'draw-trace', 'balloon-pop', 'catch-fall', 'math-race']) {
    for (const k of [na, bin]) {
      const room = await api(k, `/api/children/${k.id}/rooms`, 'POST', { game: g, opts: { subject: 'math' } });
      await api(k, `/api/children/${k.id}/rooms/${room.id}/start`, 'POST');
      await k.page.goto(base + `/#/room/${room.id}`); await k.page.waitForTimeout(4600);
      must(await k.page.locator('.race-board').count() === 1, `${g}: không thấy bàn chơi`);
      await k.shot(`race-${g}`); await k.noScroll(`race-${g}`);
      await k.page.locator('.back-pill').click(); await k.page.waitForTimeout(300);
    }
  }
  // 3. Ma sói hai bé cùng làng
  const room = await api(na, `/api/children/${na.id}/rooms`, 'POST', { game: 'werewolf', opts: { players: 6 } });
  await api(bin, `/api/children/${bin.id}/rooms/join`, 'POST', { code: room.code });
  await na.page.goto(base + `/#/room/${room.id}`); await bin.page.goto(base + `/#/room/${room.id}`); await na.page.waitForTimeout(1200);
  must(await na.page.locator('.room-seat').count() === 6, 'phòng Ma sói 6 người phải có 6 ghế');
  await na.page.locator('.room-lobby .btn-orange').click(); await na.page.waitForTimeout(2000);
  for (const k of [na, bin]) {
    await k.page.waitForTimeout(500);
    must(await k.page.locator('.ww-game').count() === 1, 'không thấy làng Ma sói');
    must(await k.page.locator('.ww-p').count() === 6, 'làng phải có 6 người');
    const roleTxt = await k.page.locator('.ww-role b').innerText();
    must(!roleTxt.includes('?'), 'bé không biết vai của mình');
  }
  // ai có việc ban đêm thì chọn
  for (const k of [na, bin]) { const c = k.page.locator('.ww-p.can'); if (await c.count()) await c.first().click(); await k.page.waitForTimeout(400); }
  await na.shot('werewolf'); await bin.shot('werewolf'); await bin.noScroll('werewolf');
  for (const p of [na, bin]) if (p.errs.length) fails.push(`lỗi trình duyệt: ${p.errs.join(' | ').slice(0, 300)}`);
} finally { await browser.close(); srv.kill(); }
if (fails.length) { console.log(`✗ ${fails.length} lỗi:\n - ${fails.join('\n - ')}`); process.exit(1); }
console.log('✓ Mọi minigame và Ma sói chơi cùng bạn được.');
