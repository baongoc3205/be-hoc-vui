// Xuất toàn bộ câu hỏi ra bảng tính để giáo viên duyệt:  npm run export:content
// Tạo docs/duyet-noi-dung.csv (UTF-8, mở được bằng Excel hoặc Google Sheets).
// Câu soạn sẵn: xuất đủ từng câu. Toán sinh tự động: mỗi dạng xuất vài ví dụ (giáo viên duyệt MẪU đề,
// vì mỗi lần chơi máy sinh số mới; đáp án đã có kiểm thử tự động giải lại).
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUBJECTS, TOPICS } from '../server/content/index.js';
import { makeRng } from '../shared/logic.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const T = (x) => (x == null ? '' : typeof x === 'string' ? x : x.vi ?? '');
const E = (x) => (x == null ? '' : typeof x === 'string' ? x : x.en ?? '');
const subjName = Object.fromEntries(SUBJECTS.map((s) => [s.id, s.name.vi]));
const KIND = { mc: 'Trắc nghiệm', tf: 'Đúng/Sai', pairs: 'Nối cặp', order: 'Sắp xếp', word: 'Ghép chữ', classify: 'Hứng đồ (chọn đúng)', clock: 'Xem đồng hồ', trace: 'Tô theo nét' };

function describe(it) {
  switch (it.kind) {
    case 'mc': return { q: T(it.prompt) + (it.say ? ` [đọc: "${it.say.text}"]` : ''), a: T(it.options[0]), other: it.options.slice(1).map(T).join(' | '), qe: E(it.prompt), ae: E(it.options[0]) };
    case 'tf': return { q: T(it.prompt), a: it.answer ? 'Đúng' : 'Sai', other: '', qe: E(it.prompt), ae: it.answer ? 'True' : 'False' };
    case 'pairs': return { q: T(it.prompt), a: it.pairs.map(([l, r]) => `${T(l)} ↔ ${T(r)}`).join(' | '), other: '', qe: E(it.prompt), ae: it.pairs.map(([l, r]) => `${E(l)} ↔ ${E(r)}`).join(' | ') };
    case 'order': return { q: T(it.prompt), a: it.items.map(T).join(' → '), other: '', qe: E(it.prompt), ae: it.items.map(E).join(' → ') };
    case 'word': return { q: T(it.prompt), a: it.answer, other: '', qe: E(it.prompt), ae: it.answer };
    case 'classify': return { q: T(it.prompt), a: it.items.filter((x) => x.ok).map((x) => T(x.t)).join(', '), other: 'Sai: ' + it.items.filter((x) => !x.ok).map((x) => T(x.t)).join(', '), qe: E(it.prompt), ae: '' };
    case 'clock': return { q: T(it.prompt), a: `${it.h}:${String(it.m).padStart(2, '0')}`, other: '', qe: E(it.prompt), ae: '' };
    case 'trace': return { q: T(it.prompt), a: `(hình: ${it.shape})`, other: '', qe: E(it.prompt), ae: '' };
    default: return { q: T(it.prompt), a: '', other: '', qe: E(it.prompt), ae: '' };
  }
}

const rows = [];
for (const topic of TOPICS) {
  const base = { mon: subjName[topic.subject], lop: topic.grade, chude: topic.title.vi, id: topic.id };
  if (topic.items) {
    for (const it of topic.items) rows.push({ ...base, nguon: 'Soạn sẵn', loai: KIND[it.kind] ?? it.kind, ...describe(it) });
  } else {
    // toán tự sinh: 6 ví dụ khác nhau cho mỗi loại câu mà chủ đề có
    const rnd = makeRng(20261020 + topic.id.length);
    for (const kind of ['mc', 'tf', 'pairs', 'order', 'classify', 'clock', 'trace']) {
      const seen = new Set(); let tries = 0;
      while (seen.size < 6 && tries++ < 200) {
        const it = topic.gen(rnd, kind); if (!it || it.kind !== kind) { if (tries > 20 && !seen.size) break; continue; }
        const d = describe(it); const k = d.q + d.a; if (seen.has(k)) continue; seen.add(k);
        rows.push({ ...base, nguon: 'Tự sinh (ví dụ)', loai: KIND[kind], ...d });
      }
    }
  }
}

const head = ['STT', 'Mã chủ đề', 'Môn', 'Lớp', 'Chủ đề', 'Nguồn', 'Loại câu', 'Câu hỏi', 'Đáp án đúng', 'Các lựa chọn sai / ghi chú', 'Câu hỏi (tiếng Anh)', 'Đáp án (tiếng Anh)', 'Kết luận (Đạt / Sai / Cần sửa)', 'Góp ý của giáo viên'];
const esc = (v) => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const lines = [head, ...rows.map((r, i) => [i + 1, r.id, r.mon, r.lop, r.chude, r.nguon, r.loai, r.q, r.a, r.other, r.qe, r.ae, '', ''])].map((cols) => cols.map(esc).join(','));
const out = join(ROOT, 'docs', 'duyet-noi-dung.csv');
writeFileSync(out, '﻿' + lines.join('\r\n'));
const by = rows.reduce((m, r) => ((m[r.mon] = (m[r.mon] ?? 0) + 1), m), {});
console.log(`\n  ✔ Đã xuất ${rows.length} câu vào ${out}`);
console.log('  ' + Object.entries(by).map(([k, v]) => `${k}: ${v}`).join(' · ') + '\n');
