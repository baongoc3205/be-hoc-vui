// Kiểm thử ca biên và thử tấn công. Chạy: npm test
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDb } from '../server/db.js';
import { fakeTurso } from './fake-turso.js';
import { createApp } from '../server/index.js';
import * as G from '../server/game.js';
import { LESSONS } from '../server/content/index.js';
import { buildRounds } from '../server/rounds.js';
import { ENERGY_MS, MAX_ENERGY } from '../shared/logic.js';

const at = (iso) => new Date(iso).getTime();
async function family(db, email = `p${Math.random()}@x.vn`) {
  const pid = (await db.prepare('INSERT INTO parents (email, name, pass_hash, created_at) VALUES (?, ?, ?, ?)').run(email, 'P', 'x', Date.now())).lastInsertRowid;
  const c = await G.createChild(db, pid, { nickname: 'Bé Na', grade: 3 });
  return { pid, child: await db.prepare('SELECT * FROM children WHERE id = ?').get(c.id) };
}
const fresh = (db, id) => db.prepare('SELECT * FROM children WHERE id = ?').get(id);

/** Máy chủ thử + hàm gọi API giữ cookie riêng cho từng "trình duyệt". */
async function harness(db) {
  const server = createServer(createApp(db));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = () => {
    let cookie = '';
    return async (method, path, body) => {
      const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined });
      const sc = res.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
      return { status: res.status, data: await res.json().catch(() => ({})) };
    };
  };
  return { browser, base, close: () => server.close() };
}

test('ngày học tính theo giờ Việt Nam: 23:59 và 00:01 là hai ngày, chuỗi điểm danh nối tiếp', async (t) => {
  const db = await openDb({ file: ':memory:' });
  const { child } = await family(db);
  assert.equal(G.dayKey(at('2026-10-19T16:59:00Z')), '2026-10-19', '23:59 giờ VN');
  assert.equal(G.dayKey(at('2026-10-19T17:01:00Z')), '2026-10-20', '00:01 giờ VN là ngày mới');
  t.mock.timers.enable({ apis: ['Date'], now: at('2026-10-19T16:59:00Z') });
  const a = await G.doCheckin(db, child);
  assert.equal(a.day, 1);
  await assert.rejects(G.doCheckin(db, await fresh(db, child.id)), { code: 'ALREADY_CHECKED_IN' });
  t.mock.timers.setTime(at('2026-10-19T17:01:00Z'));
  const b = await G.doCheckin(db, await fresh(db, child.id));
  assert.equal(b.day, 2, 'qua nửa đêm giờ VN thì điểm danh tiếp ngày 2');
  // bỏ một ngày → về ngày 1
  t.mock.timers.setTime(at('2026-10-21T18:00:00Z'));
  assert.equal((await G.doCheckin(db, await fresh(db, child.id))).day, 1);
});

test('hết năng lượng thì không vào màn được, 10 phút sau hồi 1 năng lượng', async (t) => {
  const db = await openDb({ file: ':memory:' });
  const { child } = await family(db);
  t.mock.timers.enable({ apis: ['Date'], now: at('2026-10-20T03:00:00Z') });
  const first = LESSONS.find((l) => l.subject === 'math' && l.grade === 3);
  for (let i = 0; i < MAX_ENERGY; i++) await G.startSession(db, await fresh(db, child.id), first.id);
  await assert.rejects(G.startSession(db, await fresh(db, child.id), first.id), { code: 'NO_ENERGY' });
  t.mock.timers.setTime(at('2026-10-20T03:00:00Z') + ENERGY_MS + 1000);
  await G.startSession(db, await fresh(db, child.id), first.id);
  await assert.rejects(G.startSession(db, await fresh(db, child.id), first.id), { code: 'NO_ENERGY' });
});

test('mua đồ khi thiếu xu: bị từ chối và không trừ xu', async () => {
  const db = await openDb({ file: ':memory:' });
  const { child } = await family(db);
  await db.prepare('UPDATE children SET coins = 10 WHERE id = ?').run(child.id);
  await assert.rejects(G.buyItem(db, await fresh(db, child.id), 'outfit:princess'), { code: 'NOT_ENOUGH_COINS' });
  assert.equal((await fresh(db, child.id)).coins, 10);
  await assert.rejects(G.buyItem(db, await fresh(db, child.id), 'khong:co'), { code: 'ITEM_NOT_FOUND' });
  await assert.rejects(G.buyItem(db, await fresh(db, child.id), 'hair:bob'), { code: 'ALREADY_OWNED' }, 'đồ miễn phí không mua được');
  // không mặc được đồ chưa mua
  const st = await G.setLook(db, await fresh(db, child.id), { outfit: 'princess' });
  assert.notEqual(st.child.look.outfit, 'princess');
});

for (const kind of ['sqlite', 'turso']) {
  test(`giao dịch lỗi giữa chừng thì không ghi nửa vời (${kind})`, async () => {
    let fake = null;
    const db = kind === 'sqlite' ? await openDb({ file: ':memory:' }) : await openDb({ tursoUrl: (fake = await fakeTurso('k')).url, tursoToken: 'k' });
    try {
      const { child } = await family(db);
      await assert.rejects(db.tx(async (tx) => {
        await tx.prepare('UPDATE children SET coins = coins + 999 WHERE id = ?').run(child.id);
        await tx.prepare('INSERT INTO badges (child_id, badge_id, earned_at) VALUES (?, ?, ?)').run(child.id, 'gia', 1);
        throw new Error('mất điện');
      }), /mất điện/);
      assert.equal((await fresh(db, child.id)).coins, 50);
      assert.equal((await db.prepare('SELECT COUNT(*) n FROM badges WHERE child_id = ?').get(child.id)).n, 0);
    } finally { fake?.close(); }
  });
}

test('mất kết nối Turso: máy chủ báo lỗi gọn gàng, không treo', async () => {
  const fake = await fakeTurso('k');
  const db = await openDb({ tursoUrl: fake.url, tursoToken: 'k' });
  const h = await harness(db);
  try {
    const call = h.browser();
    assert.equal((await call('POST', '/api/auth/register', { email: 'a@b.vn', password: 'abc123', consent: true })).status, 201);
    fake.close(); // đứt mạng tới cơ sở dữ liệu
    const t0 = Date.now();
    const r = await call('GET', '/api/children');
    assert.equal(r.status, 500); assert.equal(r.data.error, 'SERVER_ERROR');
    assert.ok(Date.now() - t0 < 15000, 'phải trả lời trong vòng 15 giây');
  } finally { h.close(); }
});

test('thử tấn công: xem/sửa dữ liệu nhà khác, gửi điểm giả, chơi lại phiên cũ', async () => {
  const db = await openDb({ file: ':memory:' });
  const h = await harness(db);
  try {
    const A = h.browser(), B = h.browser(), anon = h.browser();
    await A('POST', '/api/auth/register', { email: 'a@x.vn', password: 'abc123', consent: true });
    await B('POST', '/api/auth/register', { email: 'b@x.vn', password: 'abc123', consent: true });
    const kid = (await A('POST', '/api/children', { nickname: 'Bé A', grade: 2 })).data.child.id;
    await A('PATCH', `/api/children/${kid}`, { settings: { energy: false } });
    // nhà B không đụng được vào bé nhà A
    for (const [m, p, b] of [['GET', `/api/children/${kid}/state`], ['GET', `/api/children/${kid}/report`], ['PATCH', `/api/children/${kid}`, { nickname: 'Hack' }], ['DELETE', `/api/children/${kid}`], ['POST', `/api/children/${kid}/checkin`], ['POST', `/api/children/${kid}/shop/ears:bunny`], ['POST', `/api/children/${kid}/sessions`, { lessonId: 'm2a-1' }]]) {
      assert.equal((await B(m, p, b)).status, 404, `${m} ${p}`);
      assert.equal((await anon(m, p, b)).status, 401, `ẩn danh ${m} ${p}`);
    }
    // điểm do máy chủ chấm: gửi bừa không được sao
    const lesson = LESSONS.find((l) => l.subject === 'math' && l.grade === 2 && l.game === 'quiz');
    const s = (await A('POST', `/api/children/${kid}/sessions`, { lessonId: lesson.id })).data;
    const junk = s.rounds.flatMap((r) => [{ round: r.id, given: 99 }, { round: r.id, given: 'abc' }, { round: 'r999', given: 0 }]);
    const f = (await A('POST', `/api/children/${kid}/sessions/${s.sessionId}/finish`, { answers: junk, durationSec: 999999, stars: 3, coins: 9999 })).data;
    assert.equal(f.stars, 0); assert.ok(f.coins < 10, 'không tự cộng xu'); assert.ok(f.durationSec <= 60 * 30);
    // phiên đã nộp không nộp lại được; phiên nhà khác không nộp được
    assert.equal((await A('POST', `/api/children/${kid}/sessions/${s.sessionId}/finish`, { answers: [] })).status, 409);
    const kidB = (await B('POST', '/api/children', { nickname: 'Bé B', grade: 2 })).data.child.id;
    const s2 = (await A('POST', `/api/children/${kid}/sessions`, { lessonId: lesson.id })).data;
    assert.equal((await B('POST', `/api/children/${kidB}/sessions/${s2.sessionId}/finish`, { answers: [] })).status, 404);
    // màn chưa mở thì không vào được (đi tắt qua API)
    const locked = LESSONS.filter((l) => l.subject === 'math' && l.grade === 2 && l.kind !== 'chest')[3];
    assert.equal((await A('POST', `/api/children/${kid}/sessions`, { lessonId: locked.id })).status, 403);
    // bảng xếp hạng chỉ có bé trong nhà
    const lb = (await A('GET', '/api/leaderboard')).data.rows.map((r) => r.nickname);
    assert.deepEqual(lb, ['Bé A']);
    // CSRF: form từ trang lạ (text/plain) bị từ chối
    const csrf = await fetch(`${h.base}/api/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x' });
    assert.equal(csrf.status, 415);
    // dữ liệu quá lớn bị chặn
    const big = await A('POST', '/api/client-error', { message: 'x'.repeat(40000) });
    assert.equal(big.status, 413);
  } finally { h.close(); }
});

test('mọi màn tạo vòng chơi hợp lệ với 100 hạt giống ngẫu nhiên', () => {
  let n = 0;
  for (const l of LESSONS.filter((x) => x.kind !== 'chest')) {
    for (let seed = 1; seed <= 100; seed++) {
      const { rounds } = buildRounds(l, seed * 2654435761 >>> 0);
      assert.ok(rounds.length >= 1, l.id);
      for (const r of rounds) {
        n++;
        if (r.kind === 'mc') {
          assert.ok(r.options.length >= 2 && r.answer >= 0 && r.answer < r.options.length, `${l.id}#${seed}`);
          assert.equal(new Set(r.options.map((o) => o.vi)).size, r.options.length, `${l.id}#${seed}: trùng lựa chọn ${r.options.map((o) => o.vi)}`);
          assert.ok(r.options.every((o) => o.vi && o.en && !/undefined|NaN|null/.test(o.vi + o.en)), `${l.id}#${seed}: lựa chọn lỗi`);
          assert.ok(!/undefined|NaN/.test(r.prompt.vi + r.prompt.en), `${l.id}#${seed}: đề lỗi ${r.prompt.vi}`);
        }
        if (r.kind === 'tf') assert.ok(!/undefined|NaN/.test(r.prompt.vi + r.prompt.en), `${l.id}#${seed}: đề lỗi`);
      }
    }
  }
  assert.ok(n > 100000, `chỉ có ${n} vòng`);
});

test('sao lưu và khôi phục: SQLite → Turso, đủ mọi bảng, chặn ghi đè nhầm', async () => {
  const { backup, restore, countRows } = await import('../server/backup.js');
  const src = await openDb({ file: ':memory:' });
  const { child, pid } = await family(src, 'goc@x.vn');
  await G.doCheckin(src, child);
  await src.prepare('INSERT INTO auth_tokens (token, parent_id, expires_at) VALUES (?, ?, ?)').run('tk', pid, Date.now() + 1e9);
  const data = JSON.parse(JSON.stringify(await backup(src)));
  const fake = await fakeTurso('k');
  try {
    const dst = await openDb({ tursoUrl: fake.url, tursoToken: 'k' });
    const counts = await restore(dst, data);
    assert.deepEqual(counts, await countRows(src));
    assert.equal((await dst.prepare("SELECT email FROM parents").get()).email, 'goc@x.vn');
    await assert.rejects(restore(dst, data), /đã có 1 tài khoản/);
    assert.deepEqual(await restore(dst, data, { force: true }), await countRows(src));
    await assert.rejects(restore(dst, { app: 'khac' }), /không hợp lệ/);
  } finally { fake.close(); }
});
