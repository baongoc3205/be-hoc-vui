// Cửa hàng: dữ liệu trang phục, combo, chủ đề, ngày lễ và giá giảm. Chạy: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../server/db.js';
import * as G from '../server/game.js';
import { COLLECTIONS, COMBOS, FREE_ITEMS, SHOP, shopById } from '../server/content/index.js';
import { EVENTS, activeEvents, comboPrice, itemPrice, nextEvent } from '../shared/shop.js';

const at = (iso) => new Date(iso).getTime();
async function kid(db, coins = 0) {
  const pid = (await db.prepare('INSERT INTO parents (email, name, pass_hash, created_at) VALUES (?, ?, ?, ?)').run(`p${Math.random()}@x.vn`, 'P', 'x', Date.now())).lastInsertRowid;
  const c = await G.createChild(db, pid, { nickname: 'Bé Na', grade: 3 });
  await db.prepare('UPDATE children SET coins = ? WHERE id = ?').run(coins, c.id);
  return c.id;
}
const fresh = (db, id) => db.prepare('SELECT * FROM children WHERE id = ?').get(id);

test('dữ liệu cửa hàng hợp lệ: mã không trùng, combo/quà/chủ đề trỏ đúng món', () => {
  assert.equal(new Set(SHOP.map((s) => s.id)).size, SHOP.length, 'trùng mã món');
  const tags = new Set(COLLECTIONS.map((c) => c.id));
  for (const s of SHOP) {
    assert.ok(tags.has(s.tag), `${s.id}: chủ đề "${s.tag}" không tồn tại`);
    assert.ok(Number.isInteger(s.price) && s.price >= 0, `${s.id}: giá hỏng`);
    if (s.slot.endsWith('Color')) assert.match(s.value, /^#[0-9A-F]{6}$/i, `${s.id}: mã màu hỏng`);
  }
  assert.ok(SHOP.filter((s) => s.slot === 'outfit').length >= 45, 'cần nhiều trang phục');
  assert.ok(COMBOS.length >= 40, 'cần nhiều combo');
  assert.equal(new Set(COMBOS.map((c) => c.id)).size, COMBOS.length, 'trùng mã combo');
  for (const c of COMBOS) {
    assert.ok(tags.has(c.tag), `combo ${c.id}: chủ đề lạ`);
    assert.ok(c.items.length >= 3, `combo ${c.id}: quá ít món`);
    for (const i of c.items) assert.ok(shopById.has(i), `combo ${c.id}: thiếu món ${i}`);
    const slots = c.items.map((i) => shopById.get(i).slot);
    assert.equal(new Set(slots).size, slots.length, `combo ${c.id}: hai món cùng một ô`);
    assert.ok(c.items.some((i) => shopById.get(i).price > 0), `combo ${c.id}: toàn đồ miễn phí`);
  }
  for (const e of EVENTS) {
    assert.ok(tags.has(e.tag), `sự kiện ${e.id}: chủ đề lạ`);
    assert.ok(shopById.get(e.gift)?.price > 0, `sự kiện ${e.id}: quà không phải món bán trong cửa hàng`);
    for (const y of [2026, 2027, 2028, 2029, 2030]) { const w = e.when(y); assert.ok(w && w[0] <= w[1], `sự kiện ${e.id} năm ${y}: thiếu ngày`); }
  }
  // mọi chủ đề lễ đều có ít nhất một combo
  for (const c of COLLECTIONS) assert.ok(COMBOS.some((k) => k.tag === c.id), `chủ đề ${c.id} chưa có combo`);
});

test('lịch ngày lễ: Halloween, 20/10, Tết âm lịch, Trung thu, Giáng sinh', () => {
  const ids = (d) => activeEvents(d).map((e) => e.id).sort();
  assert.deepEqual(ids('2026-10-20'), ['halloween', 'women-10']);
  assert.deepEqual(ids('2027-02-06'), ['tet'], 'mùng 1 Tết Đinh Mùi');
  assert.deepEqual(ids('2027-01-24'), ['tet'], '13 ngày trước Tết');
  assert.deepEqual(ids('2026-09-25'), ['moon'], 'rằm tháng 8');
  assert.deepEqual(ids('2026-12-24'), ['noel']);
  assert.deepEqual(ids('2026-04-15'), []);
  assert.equal(nextEvent('2026-04-15').id, 'children');
  assert.equal(nextEvent('2026-12-31').id, 'tet', 'sang năm mới vẫn tìm được dịp lễ kế tiếp');
});

test('giá: giảm ngày lễ cho đúng chủ đề, combo rẻ hơn mua lẻ', () => {
  const hw = activeEvents('2026-10-20');
  const witch = shopById.get('outfit:witch'); const tutu = shopById.get('outfit:tutu');
  assert.ok(itemPrice(witch, hw) < witch.price, 'đồ Halloween được giảm');
  assert.equal(itemPrice(tutu, hw), tutu.price, 'đồ chủ đề khác giữ giá');
  for (const c of COMBOS) {
    const items = c.items.map((i) => shopById.get(i));
    const sum = items.reduce((a, i) => a + i.price, 0);
    const { price, missing } = comboPrice(c, items, FREE_ITEMS, []);
    assert.ok(missing.length >= 1);
    if (missing.length >= 2) assert.ok(price < sum, `combo ${c.id} phải rẻ hơn mua lẻ`);
    const owningAllButOne = [...FREE_ITEMS, ...missing.slice(1)];
    assert.equal(comboPrice(c, items, owningAllButOne, []).price, shopById.get(missing[0]).price, 'chỉ thiếu 1 món thì tính giá lẻ');
  }
});

test('mua combo: trả tiền món còn thiếu, mặc luôn cả bộ, đủ bộ thì không mua lại', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: at('2026-04-15T03:00:00Z') });
  const db = await openDb({ file: ':memory:' });
  const id = await kid(db, 100);
  await assert.rejects(G.buyCombo(db, await fresh(db, id), 'witch'), { code: 'NOT_ENOUGH_COINS' });
  assert.equal((await fresh(db, id)).coins, 100, 'thiếu xu không bị trừ');
  await assert.rejects(G.buyCombo(db, await fresh(db, id), 'khong-co'), { code: 'ITEM_NOT_FOUND' });
  await db.prepare('UPDATE children SET coins = 5000 WHERE id = ?').run(id);
  await G.buyItem(db, await fresh(db, id), 'acc:witchhat');
  const before = (await fresh(db, id)).coins;
  const r = await G.buyCombo(db, await fresh(db, id), 'witch');
  assert.ok(!r.items.includes('acc:witchhat'), 'không tính tiền món đã có');
  assert.equal(before - (await fresh(db, id)).coins, r.paid);
  assert.equal(r.state.child.look.outfit, 'witch'); assert.equal(r.state.child.look.acc, 'witchhat'); assert.equal(r.state.child.look.scene, 'halloween');
  assert.ok(r.newBadges.some((b) => b.id === 'combo-1'), 'nhận huy hiệu Cả bộ cánh');
  await assert.rejects(G.buyCombo(db, await fresh(db, id), 'witch'), { code: 'ALREADY_OWNED' });
});

test('ngày lễ: giá giảm khi mua, nhận quà một lần, hết lễ thì không nhận được', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: at('2026-10-25T03:00:00Z') });
  const db = await openDb({ file: ':memory:' });
  const id = await kid(db, 1000);
  const st = await G.stateOf(db, await fresh(db, id));
  assert.deepEqual(st.events.active.map((e) => e.id), ['halloween']);
  assert.equal(st.events.active[0].claimed, false);
  const g = await G.claimEventGift(db, await fresh(db, id), 'halloween');
  assert.equal(g.item.id, 'hold:pumpkin');
  assert.ok(g.state.owned.includes('hold:pumpkin'));
  assert.equal(g.state.events.active[0].claimed, true);
  await assert.rejects(G.claimEventGift(db, await fresh(db, id), 'halloween'), { code: 'ALREADY_CLAIMED' });
  await assert.rejects(G.claimEventGift(db, await fresh(db, id), 'noel'), { code: 'EVENT_NOT_ACTIVE' });
  const coins = (await fresh(db, id)).coins;
  await G.buyItem(db, await fresh(db, id), 'outfit:witch');
  assert.equal(coins - (await fresh(db, id)).coins, itemPrice(shopById.get('outfit:witch'), activeEvents('2026-10-25')));
  // mùa lễ năm sau được nhận lại; đã có quà thì tặng xu
  t.mock.timers.setTime(at('2027-10-25T03:00:00Z'));
  const g2 = await G.claimEventGift(db, await fresh(db, id), 'halloween');
  assert.equal(g2.item, null); assert.ok(g2.coins > 0);
});
