// Các dạng Toán bổ sung: hình học, đại số, toán có lời văn và toán nâng cao, lớp 1–9.
// Bám theo chương trình GDPT 2018. Đề do máy sinh theo mẫu (không chép đề có bản quyền);
// đáp án luôn do máy tính ra, và có kiểm thử tự động cho từng dạng.
import { randInt, pick, shuffle } from '../../shared/logic.js';

const L = (vi, en) => ({ vi, en: en ?? vi });
const mc = (prompt, options, extra = {}) => ({ kind: 'mc', prompt, options, ...extra });
const tf = (prompt, answer) => ({ kind: 'tf', prompt, answer });
const trace = (shape, prompt) => ({ kind: 'trace', shape, prompt });
const dec = (x) => String(Math.round(x * 100) / 100).replace('.', ',');
const decEn = (x) => String(Math.round(x * 100) / 100);
const sup = (n) => String(n).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)] ?? c).join('');
const sgn = (n) => (n < 0 ? `− ${-n}` : `+ ${n}`); // "+ 3" / "− 3"

/** Lựa chọn số: đáp án đúng ở vị trí 0, các đáp án nhiễu khác nhau và không âm (nếu đáp án không âm). */
function nums(rnd, correct, extra = [], fmt = String, count = 4) {
  const out = [correct]; const seen = new Set([fmt(correct)]);
  const cands = shuffle(rnd, [...extra, correct + 1, correct - 1, correct + 2, correct - 2, correct + 10, correct - 10, correct * 2, Math.round(correct / 2)]);
  for (const c of cands) {
    if (out.length >= count) break;
    if (!Number.isFinite(c) || (correct >= 0 && c < 0)) continue;
    const s = fmt(c); if (seen.has(s)) continue; seen.add(s); out.push(c);
  }
  for (let k = 3; out.length < count; k++) { const s = fmt(correct + k); if (!seen.has(s)) { seen.add(s); out.push(correct + k); } }
  return out.map(fmt);
}
/** Lựa chọn dạng chữ: đáp án ở vị trí 0, bỏ trùng. */
function opts(correct, wrongs, count = 4) {
  const out = [correct]; const seen = new Set([JSON.stringify(correct)]);
  for (const w of wrongs) { const k = JSON.stringify(w); if (out.length >= count) break; if (!seen.has(k)) { seen.add(k); out.push(w); } }
  return out;
}
const unit = (u) => (n) => `${n} ${u}`;
/** Đúng/sai từ một phép tính: đưa ra kết quả đúng hoặc lệch một chút. */
function tfNum(rnd, qVi, qEn, a, fmt = String) {
  const ok = rnd() < 0.5; const shown = ok ? a : a + pick(rnd, [-2, -1, 1, 2, 10]);
  return tf(L(`${qVi} ${fmt(shown)}`, `${qEn} ${fmt(shown)}`), shown === a);
}
function pairsOf(prompt, list) { return { kind: 'pairs', prompt, pairs: list.map(([a, b]) => [L(...[].concat(a)), L(...[].concat(b))]) }; }

const SHAPES = [
  { k: 'circle', g: '●', vi: 'hình tròn', en: 'circle', sides: 0 },
  { k: 'triangle', g: '▲', vi: 'hình tam giác', en: 'triangle', sides: 3 },
  { k: 'square', g: '■', vi: 'hình vuông', en: 'square', sides: 4 },
  { k: 'rect', g: '▬', vi: 'hình chữ nhật', en: 'rectangle', sides: 4 },
];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

export const mathTopics2 = [
  // ======================= LỚP 1 =======================
  {
    id: 'm1c', grade: 1, title: L('Hình vuông, hình tròn, hình tam giác', 'Squares, circles & triangles'),
    games: ['quiz', 'draw-trace', 'fruit-slice', 'candy-match', 'memory', 'boss'],
    gen(rnd, kind) {
      if (kind === 'trace') { const s = pick(rnd, ['circle', 'triangle', 'square', 'rect', 'star', 'heart']); const n = { circle: L('hình tròn', 'a circle'), triangle: L('hình tam giác', 'a triangle'), square: L('hình vuông', 'a square'), rect: L('hình chữ nhật', 'a rectangle'), star: L('ngôi sao', 'a star'), heart: L('trái tim', 'a heart') }[s]; return trace(s, L(`Tô theo nét chấm để vẽ ${n.vi}`, `Trace the dots to draw ${n.en}`)); }
      if (kind === 'mc') {
        const t = randInt(rnd, 0, 2);
        if (t === 0) { const s = pick(rnd, SHAPES); return mc(L(`Hình nào là ${s.vi}?`, `Which one is a ${s.en}?`), [s.g, ...shuffle(rnd, SHAPES.filter((x) => x !== s)).map((x) => x.g)]); }
        if (t === 1) { const s = pick(rnd, SHAPES.slice(1)); return mc(L(`${cap(s.vi)} có mấy cạnh?`, `How many sides does a ${s.en} have?`), nums(rnd, s.sides, [0, 5, 6])); }
        const n = randInt(rnd, 2, 6); const s = pick(rnd, SHAPES);
        const row = shuffle(rnd, [...Array(n).fill(s.g), ...SHAPES.filter((x) => x !== s).map((x) => x.g)]).join(' ');
        return mc(L(`Có bao nhiêu ${s.vi}? ${row}`, `How many ${s.en}s? ${row}`), nums(rnd, n, [n + 3]), { title: L('Đếm hình nhé!', 'Count the shapes!') });
      }
      if (kind === 'tf') {
        const facts = [[L('Hình vuông có 4 cạnh', 'A square has 4 sides'), true], [L('Hình tam giác có 4 cạnh', 'A triangle has 4 sides'), false], [L('Hình tròn không có góc nào', 'A circle has no corners'), true], [L('Hình chữ nhật có 3 góc', 'A rectangle has 3 corners'), false], [L('Hình tam giác có 3 góc', 'A triangle has 3 corners'), true], [L('Hình vuông có 4 cạnh dài bằng nhau', 'All 4 sides of a square are equal'), true]];
        const [p, a] = pick(rnd, facts); return tf(p, a);
      }
      if (kind === 'pairs') return pairsOf(L('Nối tên hình với hình', 'Match names and shapes'), [...SHAPES.map((s) => [[cap(s.vi), cap(s.en)], s.g]), [['Ngôi sao', 'Star'], '★']]);
      return null;
    },
  },
  {
    id: 'm1d', grade: 1, title: L('Tập viết số và tìm số còn thiếu', 'Writing digits & missing numbers'),
    games: ['draw-trace', 'quiz', 'slingshot', 'fruit-slice', 'true-false', 'boss'],
    gen(rnd, kind) {
      if (kind === 'trace') { const d = randInt(rnd, 0, 9); return trace(`d${d}`, L(`Tô theo nét chấm để viết số ${d}`, `Trace the dots to write ${d}`)); }
      if (kind === 'mc') {
        if (rnd() < 0.5) { const a = randInt(rnd, 0, 9), c = randInt(rnd, a, 10); return mc(L(`${a} + □ = ${c}. Số trong ô vuông là?`, `${a} + □ = ${c}. What goes in the box?`), nums(rnd, c - a, [c, a])); }
        const c = randInt(rnd, 0, 8), b = randInt(rnd, 1, 10 - c); return mc(L(`□ − ${b} = ${c}. Số trong ô vuông là?`, `□ − ${b} = ${c}. What goes in the box?`), nums(rnd, c + b, [c, b, c - b]));
      }
      if (kind === 'tf') { const a = randInt(rnd, 0, 9), b = randInt(rnd, 0, 10 - a); return tfNum(rnd, `${a} + ${b} =`, `${a} + ${b} =`, a + b); }
      return null;
    },
  },
  // ======================= LỚP 2 =======================
  {
    id: 'm2c', grade: 2, title: L('Cộng, trừ có nhớ trong phạm vi 100', 'Adding & subtracting with carrying to 100'),
    games: ['quiz', 'fruit-slice', 'candy-match', 'slingshot', 'math-race', 'boss'],
    gen(rnd, kind) {
      const make = () => {
        // có nhớ: hàng đơn vị cộng lại ≥ 10, hoặc phải mượn khi trừ
        if (rnd() < 0.5) { const a = randInt(rnd, 1, 8) * 10 + randInt(rnd, 1, 9); const u = randInt(rnd, 10 - (a % 10), 9); const b = randInt(rnd, 0, Math.floor((99 - a - u) / 10)) * 10 + u; return { q: `${a} + ${b}`, a: a + b, near: [a + b - 10, a + b + 10] }; }
        const a = randInt(rnd, 2, 9) * 10 + randInt(rnd, 0, 8); const u = randInt(rnd, (a % 10) + 1, 9);
        const b = randInt(rnd, 0, Math.floor(a / 10) - 1) * 10 + u; return { q: `${a} − ${b}`, a: a - b, near: [a - b + 10, a - b - 10] };
      };
      const m = make();
      if (kind === 'mc') return mc(L(`${m.q} = ?`), nums(rnd, m.a, m.near), { title: L('Nhớ sang hàng chục nhé!', 'Remember to carry!') });
      if (kind === 'tf') return tfNum(rnd, `${m.q} =`, `${m.q} =`, m.a);
      return null;
    },
  },
  {
    id: 'm2d', grade: 2, title: L('Bài toán có lời văn', 'Word problems'),
    games: ['quiz', 'true-false', 'slingshot', 'fruit-slice', 'boss'],
    gen(rnd, kind) {
      const things = [['quả táo', 'apples', 'quả'], ['cái kẹo', 'sweets', 'cái'], ['bông hoa', 'flowers', 'bông'], ['quyển vở', 'notebooks', 'quyển'], ['viên bi', 'marbles', 'viên']];
      const names = [['Lan', 'Lan'], ['Nam', 'Nam'], ['Mai', 'Mai'], ['Huy', 'Huy']];
      const [tv, te, cl] = pick(rnd, things); const [nv, ne] = pick(rnd, names);
      const t = randInt(rnd, 0, 2); let q, a, near;
      if (t === 0) { const x = randInt(rnd, 12, 60), y = randInt(rnd, 5, 35); a = x + y; near = [x - y, a + 10]; q = L(`${nv} có ${x} ${tv}, mẹ cho thêm ${y} ${cl}. Hỏi ${nv} có tất cả bao nhiêu ${tv}?`, `${ne} has ${x} ${te} and gets ${y} more. How many ${te} now?`); }
      else if (t === 1) { const x = randInt(rnd, 30, 95), y = randInt(rnd, 5, x - 5); a = x - y; near = [x + y, a + 10]; q = L(`${nv} có ${x} ${tv}, đã cho bạn ${y} ${cl}. Hỏi ${nv} còn lại bao nhiêu ${tv}?`, `${ne} has ${x} ${te} and gives away ${y}. How many are left?`); }
      else { const x = randInt(rnd, 2, 5), y = randInt(rnd, 2, 9); a = x * y; near = [x + y, a + x]; q = L(`Mỗi đĩa có ${x} ${tv}. Hỏi ${y} đĩa như thế có bao nhiêu ${tv}?`, `Each plate holds ${x} ${te}. How many ${te} on ${y} plates?`); }
      if (kind === 'mc') return mc(q, nums(rnd, a, near), { title: L('Đọc kĩ đề bài nhé', 'Read carefully') });
      if (kind === 'tf') { const ok = rnd() < 0.5; const shown = ok ? a : a + pick(rnd, [-10, -1, 1, 10]); return tf(L(`${q.vi} Đáp số: ${shown}`, `${q.en} Answer: ${shown}`), shown === a); }
      return null;
    },
  },
  // ======================= LỚP 3 =======================
  {
    id: 'm3c', grade: 3, title: L('Diện tích hình chữ nhật, hình vuông', 'Area of rectangles & squares'),
    games: ['quiz', 'candy-match', 'true-false', 'fruit-slice', 'draw-trace', 'boss'],
    gen(rnd, kind) {
      if (kind === 'trace') { const s = pick(rnd, ['square', 'rect', 'right']); const n = { square: L('hình vuông', 'a square'), rect: L('hình chữ nhật', 'a rectangle'), right: L('góc vuông', 'a right angle') }[s]; return trace(s, L(`Tô theo nét chấm để vẽ ${n.vi}`, `Trace to draw ${n.en}`)); }
      const sq = rnd() < 0.4; const x1 = randInt(rnd, 2, 12), x2 = randInt(rnd, 2, 12); const a = Math.max(x1, x2), b = sq ? a : Math.min(x1, x2) === a ? a - 1 : Math.min(x1, x2); // chiều dài ≥ chiều rộng
      const area = a * b; const per = 2 * (a + b);
      const shape = sq ? L(`Hình vuông cạnh ${a} cm`, `A square with ${a} cm sides`) : L(`Hình chữ nhật dài ${a} cm, rộng ${b} cm`, `A ${a} cm by ${b} cm rectangle`);
      if (kind === 'mc') {
        if (rnd() < 0.7) return mc(L(`${shape.vi}. Diện tích là?`, `${shape.en}. What is its area?`), nums(rnd, area, [per, a + b], unit('cm²')));
        return mc(L(`${shape.vi}. Chu vi là?`, `${shape.en}. What is its perimeter?`), nums(rnd, per, [area, a + b], unit('cm')));
      }
      if (kind === 'tf') { const ok = rnd() < 0.5; const shown = ok ? area : per; return tf(L(`${shape.vi} có diện tích ${shown} cm²`, `${shape.en} has an area of ${shown} cm²`), shown === area); }
      return null;
    },
  },
  {
    id: 'm3d', grade: 3, title: L('Nâng cao: bài toán giải bằng hai bước tính', 'Challenge: two-step problems'),
    games: ['quiz', 'slingshot', 'candy-match', 'true-false', 'boss'],
    gen(rnd, kind) {
      const t = randInt(rnd, 0, 2); let q, a, near;
      if (t === 0) { const x = randInt(rnd, 60, 300), y = randInt(rnd, 10, 50), z = randInt(rnd, 10, 50); a = x - y - z; near = [x - y, x - z, a + 10]; q = L(`Cửa hàng có ${x} kg gạo. Buổi sáng bán ${y} kg, buổi chiều bán ${z} kg. Cửa hàng còn lại bao nhiêu ki-lô-gam gạo?`, `A shop has ${x} kg of rice. It sells ${y} kg in the morning and ${z} kg in the afternoon. How much rice is left?`); }
      else if (t === 1) { const x = randInt(rnd, 3, 9), y = randInt(rnd, 3, 9), z = randInt(rnd, 1, x * y - 1); a = x * y - z; near = [x * y, x * y + z, x + y - z]; q = L(`Mỗi hộp có ${x} cái bút, có ${y} hộp. Lớp đã dùng ${z} cái bút. Hỏi còn lại bao nhiêu cái bút?`, `Each box has ${x} pens and there are ${y} boxes. The class used ${z} pens. How many pens are left?`); }
      else { const per = randInt(rnd, 2, 9), k = randInt(rnd, 2, 9), extra = randInt(rnd, 1, 9); const x = per * k; a = per + extra; near = [per, x - extra, per * extra]; q = L(`Có ${x} quyển truyện chia đều cho ${k} bạn. Sau đó mỗi bạn được tặng thêm ${extra} quyển. Hỏi mỗi bạn có bao nhiêu quyển truyện?`, `${x} storybooks are shared equally among ${k} friends. Then each gets ${extra} more. How many does each friend have?`); }
      if (kind === 'mc') return mc(q, nums(rnd, a, near), { title: L('Bài toán hai bước', 'Two steps') });
      if (kind === 'tf') { const ok = rnd() < 0.5; const shown = ok ? a : near[0]; return tf(L(`${q.vi} Đáp số: ${shown}`, `${q.en} Answer: ${shown}`), shown === a); }
      return null;
    },
  },
  // ======================= LỚP 4 =======================
  {
    id: 'm4c', grade: 4, title: L('Góc nhọn, góc tù, góc bẹt và trung bình cộng', 'Angles & averages'),
    games: ['quiz', 'fruit-slice', 'draw-trace', 'true-false', 'candy-match', 'boss'],
    gen(rnd, kind) {
      const angleName = (d) => (d < 90 ? L('Góc nhọn', 'Acute') : d === 90 ? L('Góc vuông', 'Right') : d < 180 ? L('Góc tù', 'Obtuse') : L('Góc bẹt', 'Straight'));
      const ALL = [L('Góc nhọn', 'Acute'), L('Góc vuông', 'Right'), L('Góc tù', 'Obtuse'), L('Góc bẹt', 'Straight')];
      if (kind === 'trace') { const s = pick(rnd, ['para', 'rhombus', 'right']); const n = { para: L('hình bình hành', 'a parallelogram'), rhombus: L('hình thoi', 'a rhombus'), right: L('góc vuông', 'a right angle') }[s]; return trace(s, L(`Tô theo nét chấm để vẽ ${n.vi}`, `Trace to draw ${n.en}`)); }
      if (kind === 'mc') {
        if (rnd() < 0.5) { const d = pick(rnd, [30, 45, 60, 75, 90, 90, 100, 120, 135, 150, 180]); const right = angleName(d); return mc(L(`Góc ${d}° là góc gì?`, `What kind of angle is ${d}°?`), opts(right, shuffle(rnd, ALL.filter((x) => x.vi !== right.vi)))); }
        const n = pick(rnd, [3, 4]); const avg = randInt(rnd, 10, 60); const vals = Array.from({ length: n - 1 }, () => avg + randInt(rnd, -9, 9)); vals.push(avg * n - vals.reduce((s, x) => s + x, 0));
        if (vals.some((v) => v < 0)) return null;
        return mc(L(`Trung bình cộng của ${vals.join('; ')} là?`, `What is the average of ${vals.join(', ')}?`), nums(rnd, avg, [vals.reduce((s, x) => s + x, 0), avg + 1]));
      }
      if (kind === 'tf') { const d = pick(rnd, [40, 90, 110, 180, 60, 150]); const claim = pick(rnd, ALL); return tf(L(`Góc ${d}° là ${claim.vi.toLowerCase()}`, `A ${d}° angle is ${claim.en.toLowerCase()}`), claim.vi === angleName(d).vi); }
      return null;
    },
  },
  {
    id: 'm4d', grade: 4, title: L('Nâng cao: tìm hai số khi biết tổng và hiệu', 'Challenge: sum and difference'),
    games: ['quiz', 'slingshot', 'true-false', 'candy-match', 'boss'],
    gen(rnd, kind) {
      const small = randInt(rnd, 5, 120), d = randInt(rnd, 2, 60); const big = small + d; const s = big + small;
      const askBig = rnd() < 0.5;
      const t = randInt(rnd, 0, 1);
      const q = t === 0
        ? L(`Tổng hai số là ${s}, hiệu hai số là ${d}. Tìm số ${askBig ? 'lớn' : 'bé'}.`, `Two numbers add up to ${s} and differ by ${d}. Find the ${askBig ? 'larger' : 'smaller'} one.`)
        : L(`Hai anh em có tổng cộng ${s} viên bi, anh nhiều hơn em ${d} viên. Hỏi ${askBig ? 'anh' : 'em'} có bao nhiêu viên bi?`, `Two brothers have ${s} marbles in total; the elder has ${d} more. How many does the ${askBig ? 'elder' : 'younger'} have?`);
      const a = askBig ? big : small;
      if (kind === 'mc') return mc(q, nums(rnd, a, [askBig ? small : big, s - d, (s + d)]), { title: L('Số lớn = (tổng + hiệu) : 2', 'Larger = (sum + difference) ÷ 2') });
      if (kind === 'tf') { const ok = rnd() < 0.5; const shown = ok ? a : (askBig ? small : big); return tf(L(`${q.vi} Đáp số: ${shown}`, `${q.en} Answer: ${shown}`), shown === a); }
      return null;
    },
  },
  // ======================= LỚP 5 =======================
  {
    id: 'm5c', grade: 5, title: L('Diện tích tam giác, hình thang, hình tròn và thể tích', 'Area of triangles, trapezoids, circles & volume'),
    games: ['quiz', 'fruit-slice', 'candy-match', 'true-false', 'draw-trace', 'boss'],
    gen(rnd, kind) {
      if (kind === 'trace') { const s = pick(rnd, ['trapezoid', 'triangle', 'circle']); const n = { trapezoid: L('hình thang', 'a trapezoid'), triangle: L('hình tam giác', 'a triangle'), circle: L('hình tròn', 'a circle') }[s]; return trace(s, L(`Tô theo nét chấm để vẽ ${n.vi}`, `Trace to draw ${n.en}`)); }
      const t = randInt(rnd, 0, 4); let q, a, wrong, f = unit('cm²'), fEn;
      if (t === 0) { const b = 2 * randInt(rnd, 2, 12), h = randInt(rnd, 2, 15); a = (b * h) / 2; wrong = [b * h, b + h]; q = L(`Tam giác có đáy ${b} cm, chiều cao ${h} cm. Diện tích là?`, `A triangle has base ${b} cm and height ${h} cm. Its area?`); }
      else if (t === 1) { const x = randInt(rnd, 3, 15), y = randInt(rnd, 3, 15), h = 2 * randInt(rnd, 1, 8); a = ((x + y) * h) / 2; wrong = [(x + y) * h, x * y]; q = L(`Hình thang có hai đáy ${x} cm và ${y} cm, chiều cao ${h} cm. Diện tích là?`, `A trapezoid has bases ${x} cm and ${y} cm and height ${h} cm. Its area?`); }
      else if (t === 2) { const r = randInt(rnd, 1, 10); a = r * r * 3.14; wrong = [2 * r * 3.14, r * 3.14, r * r * 3.14 * 2]; q = L(`Hình tròn bán kính ${r} cm. Diện tích là? (π ≈ 3,14)`, `A circle has radius ${r} cm. Its area? (π ≈ 3.14)`); f = (n) => `${dec(n)} cm²`; fEn = true; }
      else if (t === 3) { const d = randInt(rnd, 2, 20); a = d * 3.14; wrong = [d * 3.14 * 2, (d / 2) * (d / 2) * 3.14, d * 3]; q = L(`Hình tròn đường kính ${d} cm. Chu vi là? (π ≈ 3,14)`, `A circle has diameter ${d} cm. Its circumference? (π ≈ 3.14)`); f = (n) => `${dec(n)} cm`; fEn = true; }
      else { const x = randInt(rnd, 2, 12), y = randInt(rnd, 2, 10), z = randInt(rnd, 2, 10); a = x * y * z; wrong = [x * y + z, 2 * (x * y + y * z + x * z), x + y + z]; q = L(`Hình hộp chữ nhật dài ${x} cm, rộng ${y} cm, cao ${z} cm. Thể tích là?`, `A box is ${x} cm long, ${y} cm wide and ${z} cm high. Its volume?`); f = unit('cm³'); }
      if (kind === 'mc') { const o = opts(f(a), wrong.map(f)); for (let k = 7; o.length < 4; k += 7) { const c = f(a + k); if (!o.includes(c)) o.push(c); } return mc(q, fEn ? o.map((s) => L(s, s.replace(/(\d),(\d)/g, '$1.$2'))) : o); }
      if (kind === 'tf') { const ok = rnd() < 0.5; const shown = ok ? f(a) : f(wrong[0]); return tf(L(`${q.vi.replace(/là\?.*$/, 'là')} ${shown}`, `${q.en.replace(/\?.*$/, ' is')} ${fEn ? shown.replace(/(\d),(\d)/g, '$1.$2') : shown}`), ok || shown === f(a)); }
      return null;
    },
  },
  {
    id: 'm5d', grade: 5, title: L('Toán chuyển động đều', 'Speed, distance & time'),
    games: ['quiz', 'slingshot', 'math-race', 'true-false', 'boss'],
    gen(rnd, kind) {
      const v = pick(rnd, [4, 5, 12, 15, 20, 30, 36, 40, 45, 50, 60]), tt = randInt(rnd, 2, 6), s = v * tt;
      const who = pick(rnd, [['Một người đi bộ', 'A walker'], ['Một xe đạp', 'A bike'], ['Một ô tô', 'A car'], ['Một xe máy', 'A motorbike']]);
      const k = randInt(rnd, 0, 2); let q, a, f, wrong;
      if (k === 0) { a = s; f = unit('km'); wrong = [v + tt, s + v, Math.round(v / tt)]; q = L(`${who[0]} đi với vận tốc ${v} km/giờ trong ${tt} giờ. Quãng đường đi được là?`, `${who[1]} goes at ${v} km/h for ${tt} hours. How far does it go?`); }
      else if (k === 1) { a = v; f = unit('km/giờ'); wrong = [s - tt, v * 2, s + tt]; q = L(`${who[0]} đi quãng đường ${s} km hết ${tt} giờ. Vận tốc là?`, `${who[1]} covers ${s} km in ${tt} hours. What is its speed?`); }
      else { a = tt; f = unit('giờ'); wrong = [tt + 1, tt * 2, s - v]; q = L(`${who[0]} đi quãng đường ${s} km với vận tốc ${v} km/giờ. Thời gian đi là?`, `${who[1]} covers ${s} km at ${v} km/h. How long does it take?`); }
      const fe = (n) => f(n).replace('km/giờ', 'km/h').replace(' giờ', ' h');
      if (kind === 'mc') { const vals = nums(rnd, a, wrong, Number); return mc(q, vals.map((n) => L(f(n), fe(n))), { title: L('s = v × t', 's = v × t') }); }
      if (kind === 'tf') { const ok = rnd() < 0.5; const shown = ok ? a : wrong[0]; return tf(L(`${q.vi.replace(/ là\?$/, '')} là ${f(shown)}`, `${q.en.replace(/\?$/, '')}: ${fe(shown)}`), shown === a); }
      return null;
    },
  },
  // ======================= LỚP 6 =======================
  {
    id: 'm6c', grade: 6, title: L('Luỹ thừa và thứ tự thực hiện phép tính', 'Powers & order of operations'),
    games: ['quiz', 'fruit-slice', 'candy-match', 'true-false', 'math-race', 'boss'],
    gen(rnd, kind) {
      const t = randInt(rnd, 0, 2); let q, a, near;
      if (t === 0) { const [b, n] = pick(rnd, [[2, randInt(rnd, 2, 10)], [3, randInt(rnd, 2, 5)], [5, randInt(rnd, 2, 4)], [10, randInt(rnd, 2, 6)], [4, 3], [6, 2], [7, 2]]); a = b ** n; near = [b * n, b ** (n - 1), b ** n + b]; q = `${b}${sup(n)}`; }
      else if (t === 1) {
        const m = randInt(rnd, 2, 9), n = randInt(rnd, 2, 9); const mul = rnd() < 0.6; a = mul ? m + n : m - n; if (!mul && a <= 0) return null;
        const qv = mul ? `a${sup(m)} · a${sup(n)}` : `a${sup(m)} : a${sup(n)}`;
        if (kind === 'mc') return mc(L(`${qv} = a^? (a ≠ 0)`), nums(rnd, a, [m * n, a + 1, Math.abs(a - 1)]), { title: L('Số mũ cần điền là?', 'Which exponent?') });
        if (kind === 'tf') { const ok = rnd() < 0.5; const e = ok ? a : (mul ? m * n : a + 1); return tf(L(`${qv} = a${sup(e)}`), e === a); }
        return null;
      }
      else { const x = randInt(rnd, 2, 30), y = randInt(rnd, 2, 9), z = randInt(rnd, 2, 9); const form = randInt(rnd, 0, 2);
        if (form === 0) { a = x + y * z; near = [(x + y) * z, x * y + z]; q = `${x} + ${y} × ${z}`; }
        else if (form === 1) { a = (x + y) * z; near = [x + y * z, x + y + z]; q = `(${x} + ${y}) × ${z}`; }
        else { const w = y * z; a = x * 2 - w / y; if (a < 0) return null; near = [(x * 2 - w) / y, a + y]; q = `${x} × 2 − ${w} : ${y}`; } }
      if (kind === 'mc') return mc(L(`${q} = ?`), nums(rnd, a, near.filter(Number.isInteger)), { title: L('Nhân chia trước, cộng trừ sau', 'Multiply/divide before add/subtract') });
      if (kind === 'tf') return tfNum(rnd, `${q} =`, `${q} =`, a);
      return null;
    },
  },
  {
    id: 'm6d', grade: 6, title: L('Nâng cao: dãy số theo quy luật và dấu hiệu chia hết', 'Challenge: number patterns & divisibility'),
    games: ['quiz', 'slingshot', 'true-false', 'candy-match', 'boss'],
    gen(rnd, kind) {
      const t = randInt(rnd, 0, 3);
      if (t <= 2) {
        let seq, next;
        if (t === 0) { const a = randInt(rnd, 1, 30), d = randInt(rnd, 2, 15); seq = [0, 1, 2, 3].map((i) => a + i * d); next = a + 4 * d; }
        else if (t === 1) { const a = randInt(rnd, 1, 5), r = pick(rnd, [2, 3]); seq = [0, 1, 2, 3].map((i) => a * r ** i); next = a * r ** 4; }
        else { const k = randInt(rnd, 1, 6); seq = [0, 1, 2, 3].map((i) => (k + i) ** 2); next = (k + 4) ** 2; }
        const d1 = seq[3] - seq[2];
        if (kind === 'mc') return mc(L(`Số tiếp theo của dãy ${seq.join(', ')}, … là?`, `What comes next: ${seq.join(', ')}, …?`), nums(rnd, next, [seq[3] + d1, next + 1, next - 2]), { title: L('Tìm quy luật', 'Find the pattern') });
        if (kind === 'tf') { const ok = rnd() < 0.5; const shown = ok ? next : seq[3] + d1 === next ? next + 2 : seq[3] + d1; return tf(L(`Số tiếp theo của dãy ${seq.join(', ')}, … là ${shown}`, `The next number after ${seq.join(', ')} is ${shown}`), shown === next); }
        return null;
      }
      const base = randInt(rnd, 2, 30) * 30; // chia hết cho 2, 3, 5
      const wrongs = shuffle(rnd, [base + 10, base + 15, base + 6, base + 20, base + 12]).slice(0, 3);
      if (kind === 'mc') return mc(L('Số nào chia hết cho cả 2, 3 và 5?', 'Which number is divisible by 2, 3 and 5?'), [String(base), ...wrongs.map(String)]);
      if (kind === 'tf') { const n = pick(rnd, [base, ...wrongs]); return tf(L(`${n} chia hết cho cả 2, 3 và 5`, `${n} is divisible by 2, 3 and 5`), n % 30 === 0); }
      return null;
    },
  },
  // ======================= LỚP 7 =======================
  {
    id: 'm7c', grade: 7, title: L('Biểu thức đại số và đa thức một biến', 'Algebraic expressions & polynomials'),
    games: ['quiz', 'fruit-slice', 'candy-match', 'true-false', 'boss'],
    gen(rnd, kind) {
      const t = randInt(rnd, 0, 2);
      if (t === 0) {
        const p = randInt(rnd, 2, 9), c = randInt(rnd, 1, 9) * (rnd() < 0.5 ? -1 : 1), x = randInt(rnd, -5, 6); const a = p * x + c;
        const q = `${p}x ${sgn(c)}`; const pre = L(`Giá trị của biểu thức ${q} tại x = ${x} là?`, `The value of ${q} when x = ${x} is?`);
        if (kind === 'mc') return mc(pre, nums(rnd, a, [p * x - c, p + x + c, -a]));
        if (kind === 'tf') { const ok = rnd() < 0.5; const shown = ok ? a : p * x - c === a ? a + 1 : p * x - c; return tf(L(`Tại x = ${x}, biểu thức ${q} có giá trị ${shown}`, `When x = ${x}, ${q} equals ${shown}`), shown === a); }
        return null;
      }
      if (t === 1) {
        const m = randInt(rnd, 2, 9); let n = randInt(rnd, 1, 9); const plus = rnd() < 0.6; if (!plus && n === m) n = m - 1; const r = plus ? m + n : m - n;
        const fmt = (k) => (k === 0 ? '0' : k === 1 ? 'x' : k === -1 ? '−x' : `${k < 0 ? '−' : ''}${Math.abs(k)}x`);
        const q = `${m}x ${plus ? '+' : '−'} ${n}x`;
        if (kind === 'mc') return mc(L(`Thu gọn: ${q} = ?`, `Simplify: ${q} = ?`), opts(fmt(r), [fmt(plus ? m - n : m + n), `${fmt(r)}²`, fmt(m * n), fmt(r + 1)]));
        if (kind === 'tf') { const ok = rnd() < 0.5; return tf(L(`${q} = ${ok ? fmt(r) : `${fmt(r)}²`}`), ok); }
        return null;
      }
      const deg = randInt(rnd, 2, 6); const lower = randInt(rnd, 1, deg - 1); const k = randInt(rnd, 2, 9), j = randInt(rnd, 1, 9);
      const poly = `${k}x${sup(deg)} − ${j}x${lower === 1 ? '' : sup(lower)} + ${randInt(rnd, 1, 9)}`;
      if (kind === 'mc') return mc(L(`Bậc của đa thức ${poly} là?`, `What is the degree of ${poly}?`), nums(rnd, deg, [lower, k, deg + lower]));
      if (kind === 'tf') { const ok = rnd() < 0.5; const shown = ok ? deg : k; return tf(L(`Đa thức ${poly} có bậc là ${shown}`, `${poly} has degree ${shown}`), shown === deg); }
      return null;
    },
  },
  {
    id: 'm7d', grade: 7, title: L('Tổng ba góc của tam giác', 'Angles in a triangle'),
    games: ['quiz', 'slingshot', 'true-false', 'draw-trace', 'boss'],
    gen(rnd, kind) {
      if (kind === 'trace') return trace('triangle', L('Tô theo nét chấm để vẽ tam giác ABC', 'Trace to draw triangle ABC'));
      const t = randInt(rnd, 0, 2); let q, a, near; const deg = (n) => `${n}°`;
      if (t === 0) { const x = randInt(rnd, 20, 100), y = randInt(rnd, 20, 150 - x); a = 180 - x - y; near = [x + y, 90 - x, a + 10]; q = L(`Tam giác ABC có góc A = ${x}°, góc B = ${y}°. Góc C bằng?`, `In triangle ABC, A = ${x}° and B = ${y}°. What is angle C?`); }
      else if (t === 1) { const top = 2 * randInt(rnd, 10, 70); a = (180 - top) / 2; near = [180 - top, top, a + 10]; q = L(`Tam giác ABC cân tại A có góc A = ${top}°. Góc B bằng?`, `Triangle ABC is isosceles at A with A = ${top}°. What is angle B?`); }
      else { const x = randInt(rnd, 25, 80), y = randInt(rnd, 25, 80); a = x + y; near = [180 - x - y, 180 - x, Math.abs(x - y)]; q = L(`Tam giác ABC có góc A = ${x}°, góc B = ${y}°. Góc ngoài tại đỉnh C bằng?`, `In triangle ABC, A = ${x}°, B = ${y}°. What is the exterior angle at C?`); }
      if (kind === 'mc') return mc(q, nums(rnd, a, near.filter((n) => n > 0), deg), { title: L('Tổng ba góc bằng 180°', 'Angles add to 180°') });
      if (kind === 'tf') { const ok = rnd() < 0.5; const shown = ok ? a : near[0]; return tf(L(`${q.vi.replace(/ bằng\?$/, '')} bằng ${shown}°`, `${q.en.replace(/\?$/, '')}: ${shown}°`), shown === a); }
      return null;
    },
  },
  // ======================= LỚP 8 =======================
  {
    id: 'm8c', grade: 8, title: L('Định lí Pythagore', 'Pythagoras’ theorem'),
    games: ['quiz', 'candy-match', 'true-false', 'fruit-slice', 'boss'],
    gen(rnd, kind) {
      const [p, q0, r] = pick(rnd, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]]); const k = pick(rnd, [1, 1, 2, 3]);
      const [x, y, z] = [p * k, q0 * k, r * k];
      if (kind === 'mc') {
        if (rnd() < 0.5) return mc(L(`Tam giác ABC vuông tại A có AB = ${x} cm, AC = ${y} cm. Cạnh huyền BC bằng?`, `Right triangle ABC (right angle at A): AB = ${x} cm, AC = ${y} cm. How long is BC?`), nums(rnd, z, [x + y, z + 1, y - x + z], unit('cm')), { title: L('BC² = AB² + AC²', 'BC² = AB² + AC²') });
        return mc(L(`Tam giác ABC vuông tại A có BC = ${z} cm, AB = ${x} cm. Cạnh AC bằng?`, `Right triangle ABC (right angle at A): BC = ${z} cm, AB = ${x} cm. How long is AC?`), nums(rnd, y, [z - x, z + x, y + 1], unit('cm')), { title: L('AC² = BC² − AB²', 'AC² = BC² − AB²') });
      }
      if (kind === 'tf') { const ok = rnd() < 0.5; const c = ok ? z : z + pick(rnd, [1, 2]); return tf(L(`Tam giác có ba cạnh ${x} cm, ${y} cm, ${c} cm là tam giác vuông`, `A triangle with sides ${x}, ${y} and ${c} cm is a right triangle`), x * x + y * y === c * c); }
      return null;
    },
  },
  {
    id: 'm8d', grade: 8, title: L('Phân tích đa thức thành nhân tử', 'Factorising polynomials'),
    games: ['quiz', 'slingshot', 'true-false', 'candy-match', 'boss'],
    gen(rnd, kind) {
      const t = randInt(rnd, 0, 3); let q, right, wrong;
      const P = (n) => (n < 0 ? `(x − ${-n})` : `(x + ${n})`);
      if (t === 0) { const a = randInt(rnd, 2, 12); q = `x² − ${a * a}`; right = `(x − ${a})(x + ${a})`; wrong = [`(x − ${a})²`, `(x + ${a})²`, `(x − ${a * a})(x + 1)`]; }
      else if (t === 1) { const a = randInt(rnd, 2, 9); q = `x² + ${2 * a}x + ${a * a}`; right = `(x + ${a})²`; wrong = [`(x − ${a})²`, `(x + ${a})(x − ${a})`, `(x + ${2 * a})²`]; }
      else if (t === 2) { const a = randInt(rnd, 2, 9), b = randInt(rnd, 2, 9); q = `${a}x + ${a * b}`; right = `${a}(x + ${b})`; wrong = [`${a}(x + ${a * b})`, `x(${a} + ${b})`, `${b}(x + ${a})`]; if (a === b) wrong[2] = `${a}(x − ${b})`; }
      else {
        // (x + m)(x + n) với m, n ≠ 0, m ≠ n và m ≠ −n (để các lựa chọn sai không trùng đa thức đúng)
        let m = 0, n = 0; while (m === 0 || n === 0 || m === n || m === -n) { m = randInt(rnd, -7, 7); n = randInt(rnd, -7, 7); }
        const s = m + n, pr = m * n;
        q = `x² ${s === 0 ? '' : s === 1 ? '+ x ' : s === -1 ? '− x ' : `${sgn(s)}x `}${sgn(pr)}`.replace(/\s+/g, ' ').trim(); right = `${P(m)}${P(n)}`; wrong = [`${P(-m)}${P(-n)}`, `${P(m)}${P(-n)}`, `${P(-m)}${P(n)}`]; }
      if (kind === 'mc') return mc(L(`Phân tích ${q} thành nhân tử:`, `Factorise ${q}:`), opts(right, wrong));
      if (kind === 'tf') { const ok = rnd() < 0.5; return tf(L(`${q} = ${ok ? right : wrong[0]}`), ok); }
      return null;
    },
  },
  // ======================= LỚP 9 =======================
  {
    id: 'm9c', grade: 9, title: L('Phương trình bậc hai và định lí Viète', 'Quadratic equations & Vieta'),
    games: ['quiz', 'fruit-slice', 'candy-match', 'true-false', 'boss'],
    gen(rnd, kind) {
      let p = randInt(rnd, -9, 9), r = randInt(rnd, -9, 9); if (p === r) r = p + 2;
      const S = p + r, Pp = p * r;
      const eq = `x² ${S === 0 ? '' : S === 1 ? '− x ' : S === -1 ? '+ x ' : `${sgn(-S)}x `}${Pp === 0 ? '' : sgn(Pp)} = 0`.replace(/\s+/g, ' ').replace(' = 0', ' = 0').trim();
      const t = randInt(rnd, 0, 3);
      const [lo, hi] = [Math.min(p, r), Math.max(p, r)];
      const roots = (a, b) => `x = ${Math.min(a, b)}; x = ${Math.max(a, b)}`;
      if (t === 0) {
        if (kind === 'mc') return mc(L(`Giải phương trình ${eq}`, `Solve ${eq}`), opts(roots(lo, hi), [roots(-lo, -hi), roots(lo, -hi), roots(-lo, hi), roots(lo + 1, hi + 1)].filter((s) => s !== roots(lo, hi))));
        if (kind === 'tf') { const ok = rnd() < 0.5; const sh = ok ? roots(lo, hi) : roots(-lo, -hi); return tf(L(`Phương trình ${eq} có nghiệm ${sh}`, `${eq} has roots ${sh}`), sh === roots(lo, hi)); }
        return null;
      }
      if (t === 1) {
        if (kind === 'mc') return mc(L(`Phương trình ${eq} có hai nghiệm x₁, x₂. Tổng x₁ + x₂ bằng?`, `${eq} has roots x₁, x₂. What is x₁ + x₂?`), nums(rnd, S, [-S, Pp, S + 1]), { title: L('Định lí Viète: x₁ + x₂ = −b/a', 'Vieta: x₁ + x₂ = −b/a') });
        if (kind === 'tf') { const ok = rnd() < 0.5; return tf(L(`Phương trình ${eq} có x₁ + x₂ = ${ok ? S : -S}`, `For ${eq}, x₁ + x₂ = ${ok ? S : -S}`), ok || S === 0); }
        return null;
      }
      if (t === 2) {
        if (kind === 'mc') return mc(L(`Phương trình ${eq} có hai nghiệm x₁, x₂. Tích x₁ · x₂ bằng?`, `${eq} has roots x₁, x₂. What is x₁ · x₂?`), nums(rnd, Pp, [-Pp, S, Pp + 1]), { title: L('Định lí Viète: x₁ · x₂ = c/a', 'Vieta: x₁ · x₂ = c/a') });
        if (kind === 'tf') { const ok = rnd() < 0.5; return tf(L(`Phương trình ${eq} có x₁ · x₂ = ${ok ? Pp : Pp + 1}`, `For ${eq}, x₁ · x₂ = ${ok ? Pp : Pp + 1}`), ok); }
        return null;
      }
      // biệt thức Δ của ax² + bx + c
      const a = randInt(rnd, 1, 4), b = randInt(rnd, -9, 9), c = randInt(rnd, -9, 9); const D = b * b - 4 * a * c;
      const e2 = `${a === 1 ? '' : a}x² ${b === 0 ? '' : b === 1 ? '+ x ' : b === -1 ? '− x ' : `${sgn(b)}x `}${c === 0 ? '' : sgn(c)} = 0`.replace(/\s+/g, ' ').trim();
      const nRoots = D > 0 ? L('Hai nghiệm phân biệt', 'Two distinct roots') : D === 0 ? L('Nghiệm kép', 'One repeated root') : L('Vô nghiệm', 'No real roots');
      const ALL = [L('Hai nghiệm phân biệt', 'Two distinct roots'), L('Nghiệm kép', 'One repeated root'), L('Vô nghiệm', 'No real roots')];
      if (kind === 'mc') return rnd() < 0.5 ? mc(L(`Biệt thức Δ của phương trình ${e2} bằng?`, `What is the discriminant Δ of ${e2}?`), nums(rnd, D, [b * b + 4 * a * c, b - 4 * a * c, D + 4]), { title: L('Δ = b² − 4ac') }) : mc(L(`Phương trình ${e2} có bao nhiêu nghiệm?`, `How many real roots does ${e2} have?`), opts(nRoots, ALL.filter((x) => x.vi !== nRoots.vi)));
      if (kind === 'tf') { const ok = rnd() < 0.5; return tf(L(`Phương trình ${e2} có Δ = ${ok ? D : D + 4}`, `${e2} has Δ = ${ok ? D : D + 4}`), ok); }
      return null;
    },
  },
  {
    id: 'm9d', grade: 9, title: L('Tỉ số lượng giác và đường tròn', 'Trigonometric ratios & circles'),
    games: ['quiz', 'slingshot', 'true-false', 'candy-match', 'boss'],
    gen(rnd, kind) {
      const t = randInt(rnd, 0, 2);
      if (t === 0) {
        const TABLE = { sin: { 30: '1/2', 45: '√2/2', 60: '√3/2' }, cos: { 30: '√3/2', 45: '√2/2', 60: '1/2' }, tan: { 30: '√3/3', 45: '1', 60: '√3' } };
        const fn = pick(rnd, ['sin', 'cos', 'tan']); const ang = pick(rnd, [30, 45, 60]); const right = TABLE[fn][ang];
        const pool = ['1/2', '√2/2', '√3/2', '√3/3', '1', '√3', '2'];
        if (kind === 'mc') return mc(L(`${fn} ${ang}° = ?`), opts(right, shuffle(rnd, pool.filter((x) => x !== right))));
        if (kind === 'tf') { const claim = pick(rnd, [right, ...pool.filter((x) => x !== right)]); return tf(L(`${fn} ${ang}° = ${claim}`), claim === right); }
        return null;
      }
      if (t === 1) {
        const [p, q0, r] = pick(rnd, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]);
        // tam giác vuông tại A: AB = p, AC = q0, BC = r; xét góc B
        const fn = pick(rnd, ['sin', 'cos', 'tan']); const right = { sin: `${q0}/${r}`, cos: `${p}/${r}`, tan: `${q0}/${p}` }[fn];
        const pool = [`${q0}/${r}`, `${p}/${r}`, `${q0}/${p}`, `${p}/${q0}`, `${r}/${p}`];
        const pre = L(`Tam giác ABC vuông tại A, AB = ${p}, AC = ${q0}, BC = ${r}. ${fn} B = ?`, `Right triangle ABC (right angle at A), AB = ${p}, AC = ${q0}, BC = ${r}. ${fn} B = ?`);
        if (kind === 'mc') return mc(pre, opts(right, shuffle(rnd, pool.filter((x) => x !== right))), { title: L('Đối/huyền, kề/huyền, đối/kề', 'Opposite/hypotenuse…') });
        if (kind === 'tf') { const claim = pick(rnd, pool); return tf(L(`${pre.vi.replace(' = ?', '')} = ${claim}`, `${pre.en.replace(' = ?', '')} = ${claim}`), claim === right); }
        return null;
      }
      const R = pick(rnd, [3, 4, 6, 9, 12]); const n = pick(rnd, [60, 90, 120, 180]);
      const arcK = (R * n) / 180; const fmtPi = (k) => (Number.isInteger(k) ? (k === 1 ? 'π' : `${k}π`) : `${dec(k)}π`);
      if (rnd() < 0.5) {
        const right = `${fmtPi(arcK)} cm`;
        if (kind === 'mc') return mc(L(`Đường tròn bán kính ${R} cm. Độ dài cung ${n}° là?`, `A circle has radius ${R} cm. How long is a ${n}° arc?`), opts(L(right, right.replace(',', '.')), [fmtPi(2 * arcK), fmtPi(arcK / 2), fmtPi(R * R * n / 360)].map((s) => L(`${s} cm`, `${s} cm`.replace(',', '.')))), { title: L('l = πRn/180') });
        if (kind === 'tf') { const ok = rnd() < 0.5; const s = ok ? right : `${fmtPi(2 * arcK)} cm`; return tf(L(`Cung ${n}° của đường tròn bán kính ${R} cm dài ${s}`, `A ${n}° arc of a radius-${R} cm circle is ${s.replace(',', '.')} long`), ok); }
        return null;
      }
      const right = `${fmtPi(R * R)} cm²`;
      if (kind === 'mc') return mc(L(`Hình tròn bán kính ${R} cm có diện tích là?`, `A circle of radius ${R} cm has area?`), opts(right, [`${fmtPi(2 * R)} cm²`, `${fmtPi(R * R * 2)} cm²`, `${fmtPi(R)} cm²`]), { title: L('S = πR²') });
      if (kind === 'tf') { const ok = rnd() < 0.5; return tf(L(`Hình tròn bán kính ${R} cm có diện tích ${ok ? right : `${fmtPi(2 * R)} cm²`}`, `A circle of radius ${R} cm has area ${ok ? right : `${fmtPi(2 * R)} cm²`}`), ok); }
      return null;
    },
  },
];
