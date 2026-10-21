// Kiểm thử giao diện tương tác giữa hai bé ở hai trình duyệt: kết bạn bằng mã, nhắn tin, mời vào phòng,
// chơi Bài Màu Sắc / Thi đố cùng nhau, bảng xếp hạng + hồ sơ.
// Chạy:  npm run build:fast && node test/ui/social.mjs      (UI_SHOTS=thư-mục để lưu ảnh)
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
  const shot = async (label) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `social-${name}-${label}.png`) }); };
  const noScroll = async (label) => { const m = await page.evaluate(() => { const e = document.querySelector('.screen-content'); return e ? [e.scrollHeight, e.clientHeight, document.documentElement.scrollWidth, document.documentElement.clientWidth] : null; }); if (m && m[2] > m[3] + 2) fails.push(`${name} ${label}: tràn ngang`); };
  return { page, id, errs, shot, noScroll, ctx };
}

try {
  const na = await kid('Na');
  const bin = await kid('Bin', 390, 844);
  // 1. kết bạn bằng mã
  await bin.page.goto(base + '/#/friends'); await bin.page.waitForTimeout(800);
  const code = (await bin.page.locator('.my-code').innerText()).trim();
  must(/^[A-Z2-9]{6}$/.test(code), `mã bạn bè không hợp lệ: ${code}`);
  await na.page.goto(base + '/#/friends'); await na.page.waitForTimeout(700);
  await na.page.locator('.add-row input').first().fill(code);
  await na.page.locator('.add-row .btn').first().click(); await na.page.waitForTimeout(600);
  await bin.page.reload(); await bin.page.waitForTimeout(1200);
  must(await bin.page.locator('.friend-row', { hasText: 'Na' }).count() > 0, 'Bin không thấy lời mời của Na');
  await bin.page.locator('.friend-row .btn-lime').first().click(); await bin.page.waitForTimeout(800);
  await bin.shot('friends'); await bin.noScroll('friends');
  // 2. nhắn tin (có lọc số điện thoại)
  await na.page.reload(); await na.page.waitForTimeout(900);
  await na.page.locator('.fr-main', { hasText: 'Bin' }).click(); await na.page.waitForTimeout(800);
  await na.page.locator('.chat-input input').fill('Chào Bin! Số mình 0912345678 nè');
  await na.page.locator('.chat-input .btn').click(); await na.page.waitForTimeout(700);
  const sent = await na.page.locator('.bubble-row.mine .msg').last().innerText();
  must(sent.includes('Chào Bin') && !sent.includes('0912345678'), `tin nhắn chưa được lọc: ${sent}`);
  await na.shot('chat');
  await bin.page.goto(base + `/#/chat/${na.id}`); await bin.page.waitForTimeout(1200);
  must((await bin.page.locator('.bubble-row:not(.mine) .msg').count()) > 0, 'Bin không nhận được tin nhắn');
  await bin.page.locator('.chat-quick button').first().click(); await bin.page.waitForTimeout(500);
  await bin.shot('chat'); await bin.noScroll('chat');
  // 3. Na tạo phòng Bài Màu Sắc, mời Bin; Bin (đang ở sảnh) vào qua thanh lời mời
  await bin.page.goto(base + '/#/lobby'); await bin.page.waitForTimeout(600);
  await na.page.locator('.chat-tools .btn-orange').click(); await na.page.waitForTimeout(400);
  await na.page.locator('.pick-game', { hasText: 'Bài Màu Sắc' }).click(); await na.page.waitForTimeout(1200);
  must(na.page.url().includes('/room/'), 'Na chưa vào phòng');
  await na.shot('lobby');
  for (let i = 0; i < 25 && !(await bin.page.locator('.invite-banner').count()); i++) await bin.page.waitForTimeout(1000);
  must(await bin.page.locator('.invite-banner').count() > 0, 'Bin không thấy lời mời chơi');
  await bin.shot('invite');
  await bin.page.locator('.invite-banner .btn-orange').click(); await bin.page.waitForTimeout(1500);
  must(bin.page.url().includes('/room/'), 'Bin chưa vào phòng');
  must((await na.page.locator('.room-seat:not(.empty)').count()) >= 2 || (await na.page.waitForTimeout(1500), (await na.page.locator('.room-seat:not(.empty)').count()) >= 2), 'Na không thấy Bin trong phòng');
  await na.page.locator('.room-lobby .btn-orange').click(); await na.page.waitForTimeout(1500);
  must(await na.page.locator('.hand .pcard').count() === 7, 'Na không có 7 lá bài');
  must(await bin.page.locator('.hand .pcard').count() === 7, 'Bin không có 7 lá bài');
  // Na đánh 1 lá hoặc bốc
  const lift = na.page.locator('.hand .pcard.lift');
  if (await lift.count()) { await lift.first().click({ force: true }); await na.page.waitForTimeout(300); const col = na.page.locator('.color-pick button'); if (await col.count()) await col.first().click(); }
  else await na.page.locator('.bg-actions .btn-gray').first().click();
  await na.page.waitForTimeout(1500);
  await na.shot('cards'); await bin.shot('cards'); await bin.noScroll('cards');
  must(!(await na.page.locator('.bg-msg', { hasText: 'Lượt của bé' }).count()) || (await na.page.locator('.hand .pcard').count()) !== 7, 'nước đi của Na không được ghi nhận');
  // rời phòng
  await na.page.locator('.back-pill').click(); await na.page.waitForTimeout(500);
  await bin.page.locator('.back-pill').click(); await bin.page.waitForTimeout(500);
  // 4. Thi đố cùng bạn: Bin tạo, mời Na
  await bin.page.goto(base + '/#/friends'); await bin.page.waitForTimeout(900);
  await bin.page.locator('.friend-row .btn-orange').first().click(); await bin.page.waitForTimeout(400);
  await bin.page.locator('.pick-game', { hasText: 'Thi đố' }).click(); await bin.page.waitForTimeout(1200);
  const roomCode = (await bin.page.locator('.room-code b').innerText()).trim();
  await na.page.goto(base + '/#/friends'); await na.page.waitForTimeout(800);
  await na.page.locator('.add-row input').nth(1).fill(roomCode);
  await na.page.locator('.add-row .btn-orange').click(); await na.page.waitForTimeout(1500);
  await bin.page.locator('.room-lobby .btn-orange').click(); await bin.page.waitForTimeout(4500);
  for (const p of [na, bin]) {
    must(await p.page.locator('.duel-opt').count() >= 2, 'không thấy câu hỏi thi đố');
    await p.page.locator('.duel-opt').first().click(); await p.page.waitForTimeout(300);
  }
  await na.page.waitForTimeout(1500);
  await na.shot('quiz'); await bin.shot('quiz'); await bin.noScroll('quiz');
  must(await na.page.locator('.duel-p').count() === 2, 'thi đố phải có 2 người');
  // 5. bảng xếp hạng toàn app + hồ sơ
  await na.page.goto(base + '/#/ranking'); await na.page.waitForTimeout(1200);
  await na.shot('ranking'); await na.noScroll('ranking');
  await bin.page.goto(base + '/#/ranking'); await bin.page.waitForTimeout(1200);
  await bin.page.locator('.rank-tabs .chip').nth(1).click(); await bin.page.waitForTimeout(900);
  await bin.shot('ranking-friends');
  for (const p of [na, bin]) if (p.errs.length) fails.push(`lỗi trình duyệt: ${p.errs.join(' | ').slice(0, 300)}`);
} finally { await browser.close(); srv.kill(); }
if (fails.length) { console.log(`✗ ${fails.length} lỗi:\n - ${fails.join('\n - ')}`); process.exit(1); }
console.log('✓ Tương tác giữa hai bé chạy đúng.');
