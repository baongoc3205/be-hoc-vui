// Rà soát tự động bộ đề: tìm câu hỏi lỗi trước khi bé nhìn thấy.
// Chạy:  npm run audit:content      (in danh sách lỗi, thoát mã 1 nếu có lỗi)
// Bộ kiểm thử cũng gọi auditContent() nên lỗi nội dung làm hỏng CI.
import { TOPICS, LESSONS } from '../server/content/index.js';
import { buildRounds } from '../server/rounds.js';
import { gradeRound, makeRng, GAME_KIND } from '../shared/logic.js';
import { fileURLToPath } from 'node:url';

const txt = (x) => (typeof x === 'string' ? [x, x] : x ? [x.vi, x.en] : []);
const bad = (s) => typeof s !== 'string' || !s.trim() || /undefined|NaN|Infinity|\[object|null\b/.test(s);
const KINDS = ['mc', 'tf', 'pairs', 'order', 'word', 'classify', 'clock', 'trace', 'input'];

function checkItem(where, it, out) {
  const P = (m) => out.push(`${where}: ${m}`);
  for (const s of txt(it.prompt)) if (bad(s)) P(`đề rỗng hoặc hỏng "${s}"`);
  if (it.passage) for (const s of txt(it.passage)) if (bad(s) || s.length < 40) P('đoạn đọc hiểu quá ngắn hoặc hỏng');
  switch (it.kind) {
    case 'mc': {
      const vi = it.options.map((o) => txt(o)[0]);
      const en = it.options.map((o) => txt(o)[1]);
      if (it.options.length < 2) P('ít hơn 2 lựa chọn');
      if (new Set(vi.map((s) => s.trim())).size !== vi.length) P(`lựa chọn trùng nhau: ${vi.join(' / ')}`);
      if (new Set(en.map((s) => s.trim())).size !== en.length) P(`lựa chọn (EN) trùng nhau: ${en.join(' / ')}`);
      for (const s of [...vi, ...en]) if (bad(s)) P(`lựa chọn hỏng "${s}"`);
      if (it.blank && !txt(it.prompt).every((s) => s.includes('___'))) P('câu điền chỗ trống thiếu "___"');
      break;
    }
    case 'tf': if (typeof it.answer !== 'boolean') P('thiếu đáp án đúng/sai'); break;
    case 'pairs': {
      const L = it.pairs.map((p) => txt(p[0])[0]); const R = it.pairs.map((p) => txt(p[1])[0]);
      if (it.pairs.length < 3) P('ít hơn 3 cặp');
      if (new Set(L).size !== L.length || new Set(R).size !== R.length) P(`cặp bị trùng: ${L.join(', ')} ↔ ${R.join(', ')}`);
      for (const s of [...L, ...R]) if (bad(s)) P(`thẻ hỏng "${s}"`);
      break;
    }
    case 'order': {
      const v = it.items.map((x) => txt(x)[0]);
      if (v.length < 3) P('ít hơn 3 mục để sắp xếp');
      if (new Set(v).size !== v.length) P('mục sắp xếp trùng nhau');
      break;
    }
    case 'word': if (!/^\p{L}+$/u.test(it.answer.normalize('NFC')) || Array.from(it.answer).length > 9) P(`từ ghép chữ không hợp lệ "${it.answer}"`); break;
    case 'classify': {
      const ok = it.items.filter((x) => x.ok).map((x) => txt(x.t)[0]); const no = it.items.filter((x) => !x.ok).map((x) => txt(x.t)[0]);
      if (ok.length < 3 || no.length < 3) P('hứng đồ cần ít nhất 3 đúng và 3 sai');
      if (new Set([...ok, ...no]).size !== ok.length + no.length) P('hứng đồ có mục trùng');
      break;
    }
    case 'input': {
      const all = [it.answer, ...(it.accept ?? [])];
      for (const s of all) if (bad(String(s)) || String(s).length > 24) P(`đáp án tự điền không hợp lệ "${s}"`);
      break;
    }
    case 'clock': if (!(it.h >= 1 && it.h <= 12 && it.m >= 0 && it.m < 60 && it.m % 5 === 0)) P('giờ không hợp lệ'); break;
    case 'trace': if (!it.shape) P('thiếu hình để tô'); break;
    default: P(`dạng câu lạ "${it.kind}"`);
  }
}

/** Trả về danh sách lỗi (mảng chuỗi rỗng = ổn). seeds: số lần sinh thử cho mỗi chủ đề Toán. */
export function auditContent({ seeds = 60 } = {}) {
  const out = [];
  const ids = new Set();
  for (const t of TOPICS) {
    if (ids.has(t.id)) out.push(`${t.id}: trùng mã chủ đề`); ids.add(t.id);
    for (const s of txt(t.title)) if (bad(s)) out.push(`${t.id}: tên chủ đề hỏng`);
    if (t.items) {
      const seen = new Map();
      t.items.forEach((it, i) => {
        checkItem(`${t.id}#${i + 1}`, it, out);
        const key = JSON.stringify([it.kind, it.prompt, it.options?.[0] ?? it.answer ?? it.pairs?.[0] ?? it.items?.[0], it.passage ?? null]);
        if (seen.has(key)) out.push(`${t.id}#${i + 1}: trùng hệt câu #${seen.get(key) + 1}`); else seen.set(key, i);
      });
    } else {
      for (let s = 1; s <= seeds; s++) {
        const rnd = makeRng(s * 7919 + t.id.length);
        for (const k of KINDS) {
          const it = t.gen(rnd, k);
          if (it) checkItem(`${t.id}(seed ${s}, ${k})`, it, out);
        }
      }
    }
  }
  // Mọi màn chơi đều dựng được vòng chơi đúng dạng, và đáp án đúng chấm được 100%.
  for (const l of LESSONS) {
    if (l.kind === 'chest') continue;
    for (let s = 1; s <= 3; s++) {
      const { game, rounds } = buildRounds(l, s * 101);
      if (!rounds.length) { out.push(`${l.id}: không dựng được vòng chơi nào`); break; }
      if (game !== l.game) out.push(`${l.id}: game ${l.game} thiếu câu phù hợp, bị đổi sang ${game}`);
      for (const r of rounds) {
        const want = GAME_KIND[game];
        if (game !== 'boss' && r.kind !== want) out.push(`${l.id}: vòng ${r.kind} không khớp game ${game}`);
        const right = r.kind === 'mc' ? r.answer : r.kind === 'tf' ? r.answer : r.kind === 'input' ? r.answer : r.kind === 'multi' ? r.answer : null;
        if (right !== null && gradeRound(r, right) !== 1) out.push(`${l.id}: đáp án đúng không được chấm điểm tối đa (${r.kind})`);
        if (r.kind === 'multi' && (r.answer.length < 1 || r.answer.length >= r.options.length)) out.push(`${l.id}: chọn nhiều cần ít nhất 1 đúng và 1 sai`);
      }
    }
  }
  return [...new Set(out)];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errs = auditContent();
  const n = TOPICS.reduce((a, t) => a + (t.items?.length ?? 0), 0);
  console.log(`Đã rà ${TOPICS.length} chủ đề, ${n} câu soạn sẵn, ${TOPICS.filter((t) => t.gen).length} bộ sinh đề Toán, ${LESSONS.length} màn chơi.`);
  if (errs.length) { console.log(`✗ ${errs.length} lỗi:\n - ${errs.slice(0, 200).join('\n - ')}`); process.exit(1); }
  console.log('✓ Không thấy lỗi.');
}
