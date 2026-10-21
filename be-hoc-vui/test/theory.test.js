// Góc lý thuyết: mọi bài đều đủ song ngữ, đúng khối lớp, khối nội dung hợp lệ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEORY } from '../server/content/theory/index.js';

const ok = (x) => x && typeof x.vi === 'string' && x.vi.trim() && typeof x.en === 'string' && x.en.trim() && !/undefined|NaN/.test(x.vi + x.en);
test('Góc lý thuyết: dữ liệu hợp lệ cho cả 4 môn, lớp 1–9', () => {
  assert.equal(new Set(THEORY.map((t) => t.id)).size, THEORY.length, 'trùng mã bài');
  for (const s of ['math', 'vietnamese', 'english', 'science']) for (let g = 1; g <= 9; g++) {
    if (s === 'english' && g === 1) continue;
    assert.ok(THEORY.some((t) => t.subject === s && t.from <= g && g <= t.to), `${s} lớp ${g} chưa có bài`);
  }
  for (const t of THEORY) {
    assert.ok(t.from >= 1 && t.to <= 9 && t.from <= t.to, `${t.id}: khối lớp sai`);
    assert.ok(ok(t.title) && ok(t.intro), `${t.id}: tiêu đề/giới thiệu thiếu`);
    assert.ok(t.blocks.length >= 2, `${t.id}: quá ngắn`);
    for (const b of t.blocks) {
      if (b.t === 'p' || b.t === 'rule') assert.ok(ok(b.text), `${t.id}: đoạn văn thiếu`);
      if (b.t === 'list') b.items.forEach((x) => assert.ok(ok(x), `${t.id}: mục danh sách thiếu`));
      if (b.t === 'ex') assert.ok(ok(b.q) && ok(b.a), `${t.id}: ví dụ thiếu`);
      if (b.t === 'f') assert.ok(b.items.length && b.items.every((x) => typeof x === 'string' && x.trim()), `${t.id}: công thức trống`);
      if (b.t === 'table') for (const r of b.rows) assert.equal(r.length, b.head.length, `${t.id}: bảng lệch cột`);
      if (b.t === 'w') assert.ok(['times', 'add', 'primes', 'squares', 'periodic'].includes(b.name), `${t.id}: bảng tương tác lạ`);
    }
  }
  assert.ok(THEORY.some((t) => t.blocks.some((b) => b.t === 'w' && b.name === 'times')), 'thiếu bảng cửu chương');
  assert.ok(THEORY.some((t) => t.id === 'm-inequality'), 'thiếu bài bất đẳng thức');
});
