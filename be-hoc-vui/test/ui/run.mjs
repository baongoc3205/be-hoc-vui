// Kiểm thử giao diện tự động (Playwright): mở từng màn hình ở nhiều cỡ màn hình, chơi thử mọi loại trò chơi,
// báo lỗi nếu trang phải cuộn cả trang hoặc trình duyệt có lỗi JavaScript.
// Chạy:  npm run build:fast && npm run test:ui
// Cần gói playwright và trình duyệt Chromium:  npm i --no-save playwright && npx playwright install chromium
// (hoặc đặt PLAYWRIGHT_MODULE=đường-dẫn-tới/playwright/index.mjs nếu đã có sẵn ở nơi khác)
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
if (!existsSync(join(ROOT, 'client', 'dist', 'index.html'))) { console.error('Chưa build giao diện. Chạy: npm run build:fast'); process.exit(1); }
const mod = process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright';
const { chromium } = await import(mod);
const SHOTS = process.env.UI_SHOTS ? resolve(process.env.UI_SHOTS) : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

// ---- khởi động máy chủ thử (DB trong bộ nhớ, mở khoá mọi màn) ----
const PORT = 5300 + Math.floor(Math.random() * 500);
const srv = spawn(process.execPath, [join(ROOT, 'server', 'index.js')], { env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', DB_FILE: ':memory:', DEMO_UNLOCK: '1', TURSO_DATABASE_URL: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
srv.stderr.on('data', (d) => process.stderr.write(d));
const base = `http://127.0.0.1:${PORT}`;
for (let i = 0; i < 50; i++) { try { if ((await fetch(base + '/api/health')).ok) break; } catch { /* chờ */ } await new Promise((r) => setTimeout(r, 200)); }

const SIZES = [[1366, 768, 'laptop'], [1920, 1080, 'fullhd'], [1024, 768, 'tablet-ngang'], [768, 1024, 'tablet-doc'], [390, 844, 'iphone'], [360, 740, 'android-nho'], [844, 390, 'dien-thoai-ngang']];
const PAGES = ['lobby', 'worlds', 'map/math/3', 'character', 'character/outfit', 'shop', 'rewards', 'rewards/checkin', 'rewards/badges', 'ranking', 'arcade', 'board/cards', 'board/ludo', 'board/werewolf', 'theory', 'theory/m-times', 'theory/m-inequality', 'theory/s-atoms', 'theory/e-past', 'friends'];
// màn được phép cuộn cả trang (dành cho người lớn, nhiều chữ)
const SCROLL_OK = new Set(['privacy', 'parents']);
const GAMES = { quiz: 'm1a-1', 'balloon-pop': 'm1a-2', 'drag-match': 'm1a-3', 'true-false': 'm1a-4', 'math-race': 'm1a-5', boss: 'm1a-6', 'sort-order': 'm1b-2', 'catch-fall': 'm1b-3', memory: 'm1b-5', 'draw-trace': 'm1c-2', 'fruit-slice': 'm1c-3', 'candy-match': 'm1c-4', slingshot: 'm1d-3', clock: 'm2b-1', 'listen-pick': 'v1-1', 'word-builder': 'v1-2', 'fill-blank': 'v2-4', 'type-answer': 'm3r-1', 'multi-pick': 'm3r-2', reading: 'v3b-1', 'reading-en': 'e9b-1', 'type-text': 'e5b-3', 'multi-text': 's8b-4', 'practice-quiz': 'e3p-jobs-1', 'practice-boss': 'm3p-word-2-9' };
// trò chọn đáp án bằng phím số 1–4
const KEY_GAMES = new Set(['quiz', 'boss', 'practice-quiz', 'practice-boss', 'fill-blank', 'listen-pick', 'fruit-slice', 'candy-match', 'slingshot', 'reading', 'reading-en']);
// trò phải chọn/gõ rồi bấm Enter để nộp
const ENTER_GAMES = new Set(['type-answer', 'multi-pick', 'type-text', 'multi-text']);

const fails = [];
let checks = 0;
const browser = await chromium.launch();
try {
  for (const [w, h, name] of SIZES) {
    const phone = w < 900;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'vi-VN', isMobile: phone && w < h, hasTouch: phone });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_NAME|net::ERR_|Failed to load resource/.test(m.text())) errs.push(m.text()); });
    const check = async (label) => {
      checks++;
      const m = await page.evaluate(() => { const e = document.querySelector('.screen-content'); return e ? { sh: e.scrollHeight, ch: e.clientHeight, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth } : null; });
      if (!m) fails.push(`${name} ${label}: không thấy nội dung`);
      else {
        if (!SCROLL_OK.has(label) && m.sh > m.ch + 2) fails.push(`${name} ${label}: trang phải cuộn (${m.sh}/${m.ch})`);
        if (m.sw > m.cw + 2) fails.push(`${name} ${label}: tràn ngang (${m.sw}/${m.cw})`);
      }
      if (errs.length) { fails.push(`${name} ${label}: lỗi trình duyệt — ${errs.join(' | ').slice(0, 300)}`); errs.length = 0; }
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}-${label.replace(/[/:]/g, '_')}.png`) });
    };

    await page.goto(base + '/#/');
    await page.evaluate(async () => {
      await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Kiểm thử', email: `ui${Date.now()}${Math.random()}@test.vn`, password: 'abc123', consent: true }) });
      const j = await (await fetch('/api/children', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: 'Bé Thử', grade: 3 }) })).json();
      await fetch(`/api/children/${j.child.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: { energy: false, dailyLimitMin: 0 } }) });
      await fetch(`/api/children/${j.child.id}/checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      localStorage.setItem('bhv_child', String(j.child.id));
    });
    await page.goto(base + '/#/lobby'); await page.reload(); await page.waitForTimeout(1200);
    for (const p of PAGES) {
      await page.goto(`${base}/#/${p}`); await page.waitForTimeout(700);
      await check(p);
    }
    await page.goto(base + '/#/privacy'); await page.waitForTimeout(500); await check('privacy');
    // cửa hàng: các thẻ Ngày lễ / Combo / lọc chủ đề, thử cả bộ; tủ đồ: thẻ Combo
    await page.goto(base + '/#/shop'); await page.waitForTimeout(700);
    for (const label of ['Combo', 'Ngày lễ', 'Trang phục']) {
      const tab = page.locator('.side-tab', { hasText: label }).first();
      if (!(await tab.count())) { fails.push(`${name} shop: thiếu thẻ "${label}"`); continue; }
      await tab.click(); await page.waitForTimeout(400);
      if (label !== 'Ngày lễ') { const chip = page.locator('.tag-chips .chip').nth(1); if (await chip.count()) { await chip.click(); await page.waitForTimeout(250); } }
      const card = page.locator('.item-grid .item-card').first();
      if (await card.count()) { await card.click(); await page.waitForTimeout(250); }
      else if (label !== 'Ngày lễ') fails.push(`${name} shop ${label}: không có món nào`);
      await check(`shop-${label}`);
    }
    // trò chơi cùng bot: vào ván, thao tác vài bước
    for (const g of ['cards', 'ludo', 'werewolf']) {
      await page.goto(`${base}/#/board/${g}?r=${Date.now()}`); await page.waitForTimeout(600);
      await page.locator('.bg-setup .btn-orange').click(); await page.waitForTimeout(700);
      if (g === 'cards') { const c = page.locator('.hand .pcard.lift').first(); if (await c.count()) await c.click(); else await page.locator('.cards-pile .pcard').click(); await page.waitForTimeout(400); const col = page.locator('.color-pick button').first(); if (await col.count()) await col.click(); await page.waitForTimeout(2600); if (!(await page.locator('.hand .pcard').count())) fails.push(`${name} board-cards: không thấy bài trên tay`); }
      if (g === 'ludo') { await page.locator('.dice-btn').click(); await page.waitForTimeout(1500); if (!(await page.locator('.horse').count())) fails.push(`${name} board-ludo: không thấy ngựa`); }
      if (g === 'werewolf') {
        await page.locator('.ww-actions .btn').first().click(); await page.waitForTimeout(500);
        for (let i = 0; i < 3; i++) { const p = page.locator('.ww-p.can').first(); if (await p.count()) { await p.click(); await page.waitForTimeout(400); } const go2 = page.locator('.ww-actions .btn-lime, .ww-actions .btn-gray').first(); if (await go2.count()) { await go2.click(); await page.waitForTimeout(300); } }
        await page.waitForTimeout(2500);
        if ((await page.locator('.ww-p').count()) < 6) fails.push(`${name} board-werewolf: thiếu người chơi`);
      }
      await check(`board-${g}-play`);
    }
    await page.goto(base + '/#/character/outfit'); await page.waitForTimeout(600);
    await page.locator('.slot-chips .chip', { hasText: 'Combo' }).first().click(); await page.waitForTimeout(400);
    if (!(await page.locator('.combo-card').count())) fails.push(`${name} tủ đồ: không thấy combo`);
    await check('character-combo');

    // chơi thử mọi loại trò chơi (ở 2 cỡ: máy tính và điện thoại dọc là đủ)
    if (name === 'laptop' || name === 'iphone') {
      for (const [game, lesson] of Object.entries(GAMES)) {
        await page.goto(`${base}/#/play/${lesson}?r=${Date.now()}`); await page.waitForTimeout(1500);
        const ok = await page.locator('.play-main').count();
        if (!ok) { fails.push(`${name} ${game}: không vào được màn chơi`); continue; }
        if (KEY_GAMES.has(game)) {
          await page.keyboard.press('1'); await page.waitForTimeout(game === 'fruit-slice' || game === 'slingshot' ? 1000 : 500);
          if (!(await page.locator('.feedback').count())) fails.push(`${name} ${game}: chọn đáp án bằng phím 1 không có phản hồi`);
        } else if (ENTER_GAMES.has(game)) {
          await page.keyboard.press('1'); await page.waitForTimeout(250); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
          if (!(await page.locator('.feedback').count())) fails.push(`${name} ${game}: gõ/chọn rồi Enter không có phản hồi`);
        } else await page.waitForTimeout(1200);
        await check(`play-${game}`);
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.kill();
}
console.log(`\n  Đã kiểm ${checks} màn hình ở ${SIZES.length} cỡ màn hình.`);
if (fails.length) { console.log(`  ✗ ${fails.length} lỗi:\n   - ${fails.join('\n   - ')}\n`); process.exit(1); }
console.log('  ✓ Không có lỗi.\n');
