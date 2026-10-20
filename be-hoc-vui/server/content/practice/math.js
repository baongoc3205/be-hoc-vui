// Toán — các dạng đề sinh theo mẫu có BẬC KHÓ (ctx.tier 1..4): cùng một dạng nhưng số lớn dần,
// đổi đối tượng (quả táo, viên bi, con gà…) và đổi tên nhân vật mỗi lần chơi.
import { L, mc, tf, input, sample, optCount, tierOf } from './engine.js';
import { shuffle, randInt } from '../../../shared/logic.js';

const pick = (rnd, a) => a[Math.floor(rnd() * a.length)];
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const fv = (x) => (typeof x === 'number' ? String(Math.round(x * 1000) / 1000).replace('.', ',').replace('-', '−') : String(x));
const fe = (x) => (typeof x === 'number' ? String(Math.round(x * 1000) / 1000).replace('-', '−') : String(x));
const T = (vi, en) => L(vi, en ?? vi);

// Đối tượng để kể bài toán có lời văn: [số ít vi, đơn vị đếm, en số nhiều, emoji]
const THINGS = [['quả táo', 'quả', 'apples', '🍎'], ['viên bi', 'viên', 'marbles', '🔵'], ['quyển vở', 'quyển', 'notebooks', '📓'], ['bông hoa', 'bông', 'flowers', '🌸'], ['cái kẹo', 'cái', 'sweets', '🍬'], ['con gà', 'con', 'chickens', '🐔'], ['chiếc bút chì', 'chiếc', 'pencils', '✏️'], ['quả cam', 'quả', 'oranges', '🍊'], ['con cá', 'con', 'fish', '🐟'], ['cái bánh', 'cái', 'cakes', '🧁'], ['quả bóng', 'quả', 'balls', '⚽'], ['cuốn truyện', 'cuốn', 'storybooks', '📚'], ['chậu cây', 'chậu', 'plant pots', '🪴'], ['con vịt', 'con', 'ducks', '🦆']];
const NAMES = ['Lan', 'Nam', 'Mai', 'Huy', 'An', 'Bình', 'Hoa', 'Minh', 'Linh', 'Tùng'];
const PLACES = [['Cửa hàng', 'A shop'], ['Quầy hàng của cô Mai', "Ms Mai's stall"], ['Cửa hàng của bác Ba', "Mr Ba's shop"], ['Siêu thị nhỏ', 'A small supermarket']];

/** Bậc khó → giới hạn số theo lớp. */
function maxN(grade, tier) {
  const base = [0, 10, 100, 1000, 10000, 100000, 100, 100, 100, 100][grade];
  const scale = [0, 0.5, 1, 1.5, 2][tier];
  return Math.max(5, Math.round(base * Math.min(1, scale) * (tier >= 3 && grade <= 2 ? 1 : 1)));
}

/** Khái niệm số: make(rnd, tier, grade) → { q, a, near, expr?, stmt?(v), unit?, title? } */
function NUM(id, grade, title, make, extra = {}) {
  return {
    id, grade, title: L(title),
    gen(rnd, kind, ctx = {}) {
      const tier = tierOf(ctx), g = ctx.grade ?? grade;
      const p = make(rnd, tier, g);
      if (!p) return null;
      const near = [...new Set(p.near.filter((x) => x !== p.a && (typeof x !== 'number' || (Number.isFinite(x) && (x >= 0 || p.a < 0 || p.allowNeg)))))];
      const ttl = p.title ? { title: L(p.title) } : {};
      switch (kind) {
        case 'mc': return mc(p.q, T(fv(p.a), fe(p.a)), shuffle(rnd, near).map((x) => T(fv(x), fe(x))), optCount(ctx), ttl);
        case 'input': return p.noInput ? null : input(p.q, fv(p.a), [fe(p.a)], p.unit);
        case 'tf': {
          const ok = rnd() < 0.5 || !near.length; const v = ok ? p.a : pick(rnd, near);
          const qv = L(p.q).vi, qe = L(p.q).en;
          const st = p.stmt ? p.stmt(v) : / = \?/.test(qv) ? L(qv.replace(' = ?', ` = ${fv(v)}`), qe.replace(' = ?', ` = ${fe(v)}`)) : L(`${qv} Đáp số: ${fv(v)}${p.unit ? (L(p.unit).vi.startsWith('°') ? '' : ' ') + L(p.unit).vi : ''}.`, `${qe} Answer: ${fe(v)}${p.unit ? (L(p.unit).en.startsWith('°') ? '' : ' ') + L(p.unit).en : ''}.`);
          return tf(st, ok);
        }
        case 'pairs': {
          if (!p.expr) return null;
          const out = [], seen = new Set();
          for (let i = 0; i < 40 && out.length < 3 + Math.min(2, tier); i++) { const x = make(rnd, tier, g); if (!x?.expr || seen.has(fv(x.a))) continue; seen.add(fv(x.a)); out.push([L(x.expr), T(fv(x.a), fe(x.a))]); }
          return out.length >= 3 ? { kind: 'pairs', prompt: L('Nối phép tính với kết quả đúng|Match each calculation to its answer'), pairs: out } : null;
        }
        default: return extra[kind] ? extra[kind](rnd, tier, g, ctx) : null;
      }
    },
  };
}

// ---------- Các dạng ----------
const addSub = NUM('addsub', 1, 'Cộng, trừ|Addition & subtraction', (rnd, t, g) => {
  const M = maxN(g, t);
  const a = randInt(rnd, Math.floor(M / 10), M), b = randInt(rnd, 0, a);
  if (rnd() < 0.5) { const s = a, x = b, y = s - b; return { q: `${x} + ${y} = ?`, a: s, near: [s + 1, s - 1, s + 10, s - 10, x, y + 1], expr: `${x} + ${y}` }; }
  return { q: `${a} − ${b} = ?`, a: a - b, near: [a - b + 1, a - b - 1, a + b, a - b + 10, a - b - 10], expr: `${a} − ${b}` };
}, {
  classify: (rnd, t, g) => {
    const M = Math.max(20, maxN(g, t)), ok = [], bad = [], seen = new Set();
    for (let i = 0; i < 400 && ok.length + bad.length < 13; i++) { const n = randInt(rnd, 1, M); if (seen.has(n)) continue; seen.add(n); (n % 2 === 0 ? (ok.length < 6 && ok.push(n)) : (bad.length < 7 && bad.push(n))); }
    return { kind: 'classify', prompt: L('Hứng các số CHẴN!|Catch the EVEN numbers!'), items: [...ok.map((n) => ({ t: L(String(n)), ok: true })), ...bad.map((n) => ({ t: L(String(n)), ok: false }))] };
  },
  order: (rnd, t, g) => { const M = Math.max(20, maxN(g, t)); const xs = new Set(); for (let i = 0; i < 200 && xs.size < 3 + Math.min(2, t); i++) xs.add(randInt(rnd, 0, M)); return { kind: 'order', prompt: L('Xếp các số từ bé đến lớn|Order from smallest to largest'), items: [...xs].sort((a, b) => a - b).map((n) => L(String(n))) }; },
});
const counting = NUM('counting', 1, 'Đếm đồ vật|Counting things', (rnd, t) => {
  const [vi, , en, e] = pick(rnd, THINGS); const n = randInt(rnd, 2, [0, 6, 9, 12, 15][t]);
  return { q: `Có bao nhiêu ${vi}? ${e.repeat(n)}|How many ${en}? ${e.repeat(n)}`, a: n, near: [n + 1, n - 1, n + 2, n - 2], stmt: (v) => L(`${e.repeat(n)} có ${v} ${vi}.`, `${e.repeat(n)}: there are ${v} ${en}.`) };
});
const missing = NUM('missing', 1, 'Tìm số còn thiếu|Find the missing number', (rnd, t, g) => {
  const M = maxN(g, t); const c = randInt(rnd, 2, M), a = randInt(rnd, 0, c), b = c - a;
  return rnd() < 0.5 ? { q: `${a} + □ = ${c}. Số trong ô vuông là?|${a} + □ = ${c}. What is □?`, a: b, near: [b + 1, b - 1, c, c + a] } : { q: `□ − ${a} = ${b}. Số trong ô vuông là?|□ − ${a} = ${b}. What is □?`, a: c, near: [c + 1, c - 1, b - a, b] };
});
const compare = NUM('compare', 1, 'So sánh số|Comparing numbers', (rnd, t, g) => {
  const M = maxN(g, t); const a = randInt(rnd, 0, M), b = rnd() < 0.15 ? a : randInt(rnd, 0, M);
  const s = a > b ? '>' : a < b ? '<' : '=';
  return { q: `Điền dấu thích hợp: ${a} … ${b}|Choose the sign: ${a} … ${b}`, a: s, near: ['>', '<', '='], noInput: true, stmt: (v) => L(`${a} ${v} ${b}`) };
});
const wordProblems = NUM('word', 1, 'Bài toán có lời văn|Word problems', (rnd, t, g) => {
  const [vi, unit, en, e] = pick(rnd, THINGS), [n1, n2] = sample(rnd, NAMES, 2);
  const M = Math.max(10, Math.min(maxN(g, t), g <= 1 ? 10 : 100 * t));
  const k = g <= 1 ? randInt(rnd, 0, 1) : randInt(rnd, 0, g >= 3 ? 4 : 3);
  if (k === 0) { const a = randInt(rnd, 1, Math.floor(M / 2)), b = randInt(rnd, 1, Math.floor(M / 2)); return { title: 'Thêm vào thì cộng|Getting more: add', q: `${n1} có ${a} ${vi}, ${n2} cho thêm ${b} ${unit}. Hỏi ${n1} có tất cả bao nhiêu ${vi}? ${e}|${n1} has ${a} ${en} and ${n2} gives ${b} more. How many ${en} does ${n1} have now? ${e}`, a: a + b, near: [a + b + 1, a + b - 1, Math.abs(a - b), a + b + 10] }; }
  if (k === 1) { const a = randInt(rnd, 3, M), b = randInt(rnd, 1, a - 1); return { title: 'Bớt đi thì trừ|Taking away: subtract', q: `${n1} có ${a} ${vi}, đã cho ${n2} ${b} ${unit}. Hỏi ${n1} còn lại bao nhiêu ${vi}?|${n1} has ${a} ${en} and gives ${b} to ${n2}. How many are left?`, a: a - b, near: [a + b, a - b + 1, a - b - 1, a - b + 10] }; }
  if (k === 2) { const n = randInt(rnd, 2, 5 + t), each = randInt(rnd, 2, 5 + 2 * t); return { title: 'Mỗi nhóm bằng nhau thì nhân|Equal groups: multiply', q: `Mỗi hộp có ${each} ${vi}. Hỏi ${n} hộp như thế có bao nhiêu ${vi}?|Each box holds ${each} ${en}. How many in ${n} boxes?`, a: n * each, near: [n + each, n * each + each, n * each - n, (n + 1) * each] }; }
  if (k === 3) { const n = randInt(rnd, 2, 5 + t), each = randInt(rnd, 2, 5 + 2 * t); return { title: 'Chia đều thì chia|Sharing equally: divide', q: `Có ${n * each} ${vi} chia đều cho ${n} bạn. Hỏi mỗi bạn được bao nhiêu ${vi}?|${n * each} ${en} are shared equally among ${n} friends. How many does each get?`, a: each, near: [each + 1, each - 1, n, n * each - n] }; }
  const a = randInt(rnd, 20, 40 * t), b = randInt(rnd, 5, Math.floor(a / 2)), c = randInt(rnd, 5, Math.floor(a / 2));
  const [pv, pe] = pick(rnd, PLACES);
  return { title: 'Bài toán hai bước|Two-step problem', q: `${pv} có ${a + b} ${vi}. Buổi sáng bán được ${b} ${unit}, buổi chiều nhập thêm ${c} ${unit}. Hỏi lúc này còn bao nhiêu ${vi}?|${pe} has ${a + b} ${en}. It sells ${b} in the morning and gets ${c} more in the afternoon. How many are there now?`, a: a + c, near: [a, a + b + c, a - c, a + c + 10] };
});
const mulDiv = NUM('muldiv', 2, 'Nhân, chia|Multiplication & division', (rnd, t, g) => {
  const top = g <= 2 ? [0, 5, 5, 5, 5][t] : g === 3 ? [0, 6, 9, 9, 9][t] : [0, 9, 12, 20, 50][t];
  const a = randInt(rnd, 2, Math.max(2, g <= 2 ? 5 : 10)), b = randInt(rnd, 2, top);
  if (rnd() < 0.5) return { q: `${a} × ${b} = ?`, a: a * b, near: [a * b + a, a * b - b, a + b, a * (b + 1), a * b + 1], expr: `${a} × ${b}` };
  return { q: `${a * b} : ${a} = ?`, a: b, near: [b + 1, b - 1, a, a * b - a], expr: `${a * b} : ${a}` };
}, {
  classify: (rnd, t, g) => {
    const d = pick(rnd, g <= 3 ? [2, 5, 10] : [3, 4, 9]), ok = new Set(), bad = new Set(); const M = g <= 3 ? 100 : 1000;
    for (let i = 0; i < 500 && (ok.size < 6 || bad.size < 7); i++) { const n = randInt(rnd, 10, M); n % d === 0 ? ok.size < 6 && ok.add(n) : bad.size < 7 && bad.add(n); }
    return { kind: 'classify', prompt: L(`Hứng các số chia hết cho ${d}!|Catch the numbers divisible by ${d}!`), items: [...[...ok].map((n) => ({ t: L(String(n)), ok: true })), ...[...bad].map((n) => ({ t: L(String(n)), ok: false }))] };
  },
});
const sequences = NUM('seq', 2, 'Quy luật dãy số|Number patterns', (rnd, t, g) => {
  const step = randInt(rnd, 1 + (t > 1 ? 1 : 0), g <= 2 ? 5 * t : 10 * t + g), s = randInt(rnd, 0, g <= 2 ? 20 : 100);
  const geo = g >= 6 && t >= 3 && rnd() < 0.4;
  const xs = geo ? [1, 2, 3, 4].map((i) => s % 5 + 1 * Math.pow(2, i)) : [0, 1, 2, 3].map((i) => s + i * step);
  const next = geo ? xs[3] * 2 : xs[3] + step;
  return { q: `Số tiếp theo của dãy ${xs.join(', ')}, … là?|What comes next: ${xs.join(', ')}, …?`, a: next, near: [next + 1, next - 1, next + step, xs[3] + 1], title: 'Tìm quy luật|Find the rule' };
});
const timeMoney = NUM('time', 2, 'Thời gian và tiền|Time & money', (rnd, t) => {
  const k = randInt(rnd, 0, 3);
  if (k === 0) { const h = randInt(rnd, 1, 2 + t); return { q: `${h} giờ = ? phút|${h} hours = ? minutes`, a: h * 60, near: [h * 100, h * 60 + 10, h * 30, h * 6] }; }
  if (k === 1) { const d = randInt(rnd, 1, 3 + t); return { q: `${d} tuần = ? ngày|${d} weeks = ? days`, a: d * 7, near: [d * 5, d * 7 + 1, d * 10, d + 7] }; }
  if (k === 2) { const a = pick(rnd, [1000, 2000, 5000, 10000]), n = randInt(rnd, 2, 3 + t); return { q: `Mỗi cái bút giá ${a.toLocaleString('vi-VN')} đồng. Mua ${n} cái hết bao nhiêu đồng?|Each pen costs ${a} dong. How much for ${n} pens?`, a: a * n, near: [a * n + a, a + n, a * (n - 1), a * n * 10] }; }
  const y = randInt(rnd, 1, 2 + t); return { q: `${y} năm = ? tháng|${y} years = ? months`, a: y * 12, near: [y * 10, y * 12 + 1, y * 365, y * 24] };
});
const geometry = NUM('geo', 3, 'Chu vi, diện tích|Perimeter & area', (rnd, t, g) => {
  const big = 5 + 5 * t; const a = randInt(rnd, 3, big), b0 = randInt(rnd, 2, big), b = b0 === a ? a - 1 : Math.min(a, b0) === a ? b0 : b0;
  const [L1, W] = [Math.max(a, b), Math.min(a, b)];
  const k = randInt(rnd, 0, g >= 5 ? 4 : g >= 4 ? 3 : 2);
  if (k === 0) return { q: `Hình chữ nhật dài ${L1} cm, rộng ${W} cm. Chu vi là bao nhiêu xăng-ti-mét?|A ${L1} cm by ${W} cm rectangle. Perimeter in cm?`, a: 2 * (L1 + W), near: [L1 * W, L1 + W, 2 * L1 + W, 2 * (L1 + W) + 2], unit: 'cm' };
  if (k === 1) return { q: `Hình vuông cạnh ${a} cm. Chu vi là bao nhiêu xăng-ti-mét?|A square with ${a} cm sides. Perimeter in cm?`, a: 4 * a, near: [a * a, 2 * a, 4 * a + 4, a + 4], unit: 'cm' };
  if (k === 2) return { q: `Hình chữ nhật dài ${L1} cm, rộng ${W} cm. Diện tích là bao nhiêu xăng-ti-mét vuông?|A ${L1} cm by ${W} cm rectangle. Area in cm²?`, a: L1 * W, near: [2 * (L1 + W), L1 + W, L1 * W + W, L1 * W - L1], unit: 'cm²' };
  if (k === 3) return { q: `Hình vuông cạnh ${a} cm. Diện tích là bao nhiêu xăng-ti-mét vuông?|A square with ${a} cm sides. Area in cm²?`, a: a * a, near: [4 * a, 2 * a, a * a + a, (a + 1) * (a + 1)], unit: 'cm²' };
  const h = randInt(rnd, 2, big) * 2; return { q: `Tam giác có đáy ${L1} cm, chiều cao ${h} cm. Diện tích là bao nhiêu xăng-ti-mét vuông?|A triangle with base ${L1} cm and height ${h} cm. Area in cm²?`, a: (L1 * h) / 2, near: [L1 * h, L1 + h, (L1 * h) / 2 + L1, L1 * 2 + h], unit: 'cm²' };
});
const fractions = NUM('frac', 4, 'Phân số|Fractions', (rnd, t) => {
  const d = randInt(rnd, 2, 4 + 2 * t), n0 = randInt(rnd, 1, d - 1), n = n0 / gcd(n0, d) === n0 ? n0 : 1, k = randInt(rnd, 2, 3 + t);
  const kind = randInt(rnd, 0, 2);
  if (kind === 0) { const whole = d * k * randInt(rnd, 1, t); return { q: `${n}/${d} của ${whole} là bao nhiêu?|What is ${n}/${d} of ${whole}?`, a: (whole / d) * n, near: [whole / d, whole * n, (whole / d) * n + 1, whole - n] }; }
  if (kind === 1) { const g0 = gcd(n, d); const nn = n * k, dd = d * k; return { q: `Rút gọn phân số ${nn}/${dd} (viết dạng a/b)|Simplify ${nn}/${dd} (write a/b)`, a: `${n / g0}/${d / g0}`, near: [`${nn}/${d}`, `${n}/${dd}`, `${n / g0 + 1}/${d / g0}`, `${d / g0}/${n / g0}`] }; }
  const n2 = randInt(rnd, 1, d - 1), s = n + n2, g0 = gcd(s, d);
  return { q: `${n}/${d} + ${n2}/${d} = ? (viết phân số tối giản)|${n}/${d} + ${n2}/${d} = ? (lowest terms)`, a: s % d === 0 ? s / d : `${s / g0}/${d / g0}`, near: [`${s}/${d + d}`, `${n * n2}/${d}`, `${s + 1}/${d}`, `${s}/${d * 2 + 1}`] };
});
const rounding = NUM('round', 4, 'Làm tròn số|Rounding', (rnd, t) => {
  const p = pick(rnd, t <= 1 ? [10] : t === 2 ? [10, 100] : [100, 1000]); const n = randInt(rnd, p, p * 99);
  const r = Math.round(n / p) * p;
  return { q: `Làm tròn ${n} đến hàng ${p === 10 ? 'chục' : p === 100 ? 'trăm' : 'nghìn'}|Round ${n} to the nearest ${p}`, a: r, near: [r + p, r - p, Math.floor(n / p) * p === r ? r + p : Math.floor(n / p) * p, n] };
});
const decimals = NUM('dec', 5, 'Số thập phân|Decimals', (rnd, t) => {
  const a = randInt(rnd, 1, 50 * t) / 10, b = randInt(rnd, 1, 50 * t) / 10;
  const k = randInt(rnd, 0, t >= 3 ? 2 : 1);
  if (k === 0) return { q: `${fv(a)} + ${fv(b)} = ?|${fe(a)} + ${fe(b)} = ?`, a: Math.round((a + b) * 10) / 10, near: [Math.round((a + b + 1) * 10) / 10, Math.round((a + b + 0.1) * 10) / 10, Math.round((a + b) * 100) / 10, Math.round(Math.abs(a - b) * 10) / 10], expr: `${fv(a)} + ${fv(b)}|${fe(a)} + ${fe(b)}` };
  if (k === 1) { const [x, y] = a >= b ? [a, b] : [b, a]; return { q: `${fv(x)} − ${fv(y)} = ?|${fe(x)} − ${fe(y)} = ?`, a: Math.round((x - y) * 10) / 10, near: [Math.round((x - y + 1) * 10) / 10, Math.round((x - y + 0.1) * 10) / 10, Math.round((x + y) * 10) / 10, Math.round((x - y) * 100) / 10] }; }
  const m = pick(rnd, [10, 100, 1000]); return { q: `${fv(a)} × ${m} = ?|${fe(a)} × ${m} = ?`, a: Math.round(a * m * 10) / 10, near: [a * m * 10, a * m / 10, a + m, Math.round(a * 10 * 10) / 10].map((x) => Math.round(x * 10) / 10) };
});
const percent = NUM('pct', 5, 'Tỉ số phần trăm|Percentages', (rnd, t) => {
  const p = pick(rnd, t <= 1 ? [10, 50] : t === 2 ? [10, 20, 25, 50] : [5, 15, 20, 25, 40, 75]), n = randInt(rnd, 1, 4 * t) * (100 / gcd(p, 100));
  const a = (n * p) / 100;
  return { q: `${p}% của ${n} là bao nhiêu?|What is ${p}% of ${n}?`, a, near: [a * 10, a + p, n - a, a / 2] };
});
const integers = NUM('int', 6, 'Số nguyên|Integers', (rnd, t) => {
  const M = [0, 10, 20, 50, 100][t]; const a = randInt(rnd, -M, M), b = randInt(rnd, -M, M);
  const show = (x) => (x < 0 ? `(−${-x})` : String(x));
  const k = randInt(rnd, 0, t >= 3 ? 2 : 1);
  if (k === 0) return { q: `${show(a)} + ${show(b)} = ?`, a: a + b, near: [a - b, -(a + b), a + b + 1, a + b - 1], allowNeg: true, expr: `${show(a)} + ${show(b)}` };
  if (k === 1) return { q: `${show(a)} − ${show(b)} = ?`, a: a - b, near: [a + b, -(a - b), a - b + 1, b - a + 1], allowNeg: true, expr: `${show(a)} − ${show(b)}` };
  const x = randInt(rnd, -9, 9) || 2, y = randInt(rnd, -9, 9) || -3; return { q: `${show(x)} × ${show(y)} = ?`, a: x * y, near: [-(x * y), x + y, x * y + 1, x - y], allowNeg: true, expr: `${show(x)} × ${show(y)}` };
}, {
  order: (rnd, t) => { const M = [0, 10, 20, 50, 100][t]; const xs = new Set(); for (let i = 0; i < 200 && xs.size < 3 + Math.min(2, t); i++) xs.add(randInt(rnd, -M, M)); return { kind: 'order', prompt: L('Xếp các số nguyên tăng dần|Order the integers from smallest to largest'), items: [...xs].sort((a, b) => a - b).map((n) => L(fv(n), fe(n))) }; },
});
const powers = NUM('pow', 6, 'Lũy thừa và căn bậc hai|Powers & square roots', (rnd, t, g) => {
  const k = randInt(rnd, 0, g >= 7 ? 2 : 1);
  if (k === 0) { const b = randInt(rnd, 2, 5 + t), e = randInt(rnd, 2, t >= 3 ? 4 : 3); const sup = '⁰¹²³⁴⁵⁶⁷⁸⁹'; return { q: `${b}${String(e).split('').map((d) => sup[d]).join('')} = ?`, a: b ** e, near: [b * e, b ** e + b, b ** (e - 1), (b + 1) ** e], expr: `${b}${String(e).split('').map((d) => sup[d]).join('')}` }; }
  if (k === 1) { const b = randInt(rnd, 2, 9 + t * 2); return { q: `${b}² = ?`, a: b * b, near: [2 * b, b * b + b, (b - 1) * (b - 1), b * b + 1], expr: `${b}²` }; }
  const r = randInt(rnd, 2, 8 + 4 * t); return { q: `√${r * r} = ?`, a: r, near: [r + 1, r - 1, r * 2, r * r / 2], expr: `√${r * r}` };
});
const equations = NUM('eq', 7, 'Giải phương trình bậc nhất|Linear equations', (rnd, t) => {
  const a = randInt(rnd, 2, 3 + 2 * t), x = randInt(rnd, -3 * t, 4 * t) || 2, b = randInt(rnd, -20, 20) || 7;
  const c = a * x + b;
  return { q: `Giải phương trình: ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${fv(c)}. x = ?|Solve: ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${fe(c)}. x = ?`, a: x, near: [x + 1, x - 1, -x, (c + b) / a, c - b], allowNeg: true, stmt: (v) => L(`x = ${fv(v)} là nghiệm của ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${fv(c)}`, `x = ${fe(v)} solves ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${fe(c)}`) };
});
const angles = NUM('angles', 7, 'Góc trong tam giác|Angles in a triangle', (rnd, t) => {
  const A = randInt(rnd, 20, 100), B = randInt(rnd, 20, 160 - A - 1), C = 180 - A - B;
  if (t >= 3 && rnd() < 0.5) return { q: `Tam giác ABC có góc A = ${A}°, góc B = ${B}°. Góc ngoài tại đỉnh C bằng bao nhiêu độ?|Triangle ABC: A = ${A}°, B = ${B}°. What is the exterior angle at C (degrees)?`, a: A + B, near: [C, 180 - A, 360 - A - B, A + B + 10], unit: '°' };
  return { q: `Tam giác ABC có góc A = ${A}°, góc B = ${B}°. Góc C bằng bao nhiêu độ?|Triangle ABC: A = ${A}°, B = ${B}°. What is angle C (degrees)?`, a: C, near: [A + B, 90 - C > 0 ? 90 - C : C + 20, 360 - A - B, C + 10], unit: '°' };
});
const pythag = NUM('pyth', 8, 'Định lí Pythagore|Pythagoras', (rnd, t) => {
  const tri = pick(rnd, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25], [12, 16, 20], [20, 21, 29]].slice(0, 3 + 2 * t));
  const [a, b, c] = tri;
  if (rnd() < 0.5) return { q: `Tam giác vuông có hai cạnh góc vuông ${a} cm và ${b} cm. Cạnh huyền dài bao nhiêu xăng-ti-mét?|A right triangle has legs ${a} cm and ${b} cm. How long is the hypotenuse (cm)?`, a: c, near: [a + b, c + 1, c - 1, a * b / 2], unit: 'cm' };
  return { q: `Tam giác vuông có cạnh huyền ${c} cm, một cạnh góc vuông ${a} cm. Cạnh góc vuông còn lại dài bao nhiêu xăng-ti-mét?|A right triangle has hypotenuse ${c} cm and one leg ${a} cm. How long is the other leg (cm)?`, a: b, near: [c - a, b + 1, b - 1, c + a], unit: 'cm' };
});
const expand = NUM('identities', 8, 'Hằng đẳng thức đáng nhớ|Special products', (rnd, t) => {
  const a = randInt(rnd, 1, 3 + 2 * t), x = pick(rnd, ['x', 'y', 'a']);
  const k = randInt(rnd, 0, 2);
  if (k === 0) return { q: `(${x} + ${a})² = ?`, a: `${x}² + ${2 * a}${x} + ${a * a}`, near: [`${x}² + ${a}${x} + ${a * a}`, `${x}² + ${a * a}`, `${x}² + ${2 * a}${x} + ${2 * a}`, `${x}² − ${2 * a}${x} + ${a * a}`], noInput: true, expr: `(${x} + ${a})²` };
  if (k === 1) return { q: `(${x} − ${a})² = ?`, a: `${x}² − ${2 * a}${x} + ${a * a}`, near: [`${x}² − ${a}${x} + ${a * a}`, `${x}² − ${a * a}`, `${x}² + ${2 * a}${x} + ${a * a}`, `${x}² − ${2 * a}${x} − ${a * a}`], noInput: true, expr: `(${x} − ${a})²` };
  return { q: `${x}² − ${a * a} = ?`, a: `(${x} − ${a})(${x} + ${a})`, near: [`(${x} − ${a})²`, `(${x} + ${a})²`, `(${x} − ${a * a})(${x} + 1)`, `${x}(${x} − ${a})`], noInput: true, expr: `${x}² − ${a * a}` };
});
const quadratic = NUM('quad', 9, 'Phương trình bậc hai|Quadratic equations', (rnd, t) => {
  const r1 = randInt(rnd, -3 * t, 3 * t), r2 = randInt(rnd, -3 * t, 3 * t);
  const b = -(r1 + r2), c = r1 * r2;
  const poly = `x²${b === 0 ? '' : b < 0 ? ` − ${-b}x` : ` + ${b}x`}${c === 0 ? '' : c < 0 ? ` − ${-c}` : ` + ${c}`} = 0`;
  const k = randInt(rnd, 0, 2);
  if (k === 0) return { title: 'Viète: x₁ + x₂ = −b/a|Viète: x₁ + x₂ = −b/a', q: `Phương trình ${poly} có hai nghiệm x₁, x₂. Tổng x₁ + x₂ bằng?|For ${poly}, what is x₁ + x₂?`, a: r1 + r2, near: [b, c, r1 + r2 + 1, -c], allowNeg: true };
  if (k === 1) return { title: 'Viète: x₁ · x₂ = c/a|Viète: x₁ · x₂ = c/a', q: `Phương trình ${poly} có hai nghiệm x₁, x₂. Tích x₁ · x₂ bằng?|For ${poly}, what is x₁ · x₂?`, a: c, near: [-c, b, r1 + r2, c + 1], allowNeg: true };
  return { title: 'Δ = b² − 4ac', q: `Biệt thức Δ của phương trình ${poly} bằng?|What is the discriminant Δ of ${poly}?`, a: b * b - 4 * c, near: [b * b + 4 * c, b * b - c, 4 * c - b * b, b * b], allowNeg: true };
});
const linearFn = NUM('linear', 9, 'Hàm số bậc nhất|Linear functions', (rnd, t) => {
  const a = randInt(rnd, -3 - t, 3 + t) || 2, b = randInt(rnd, -9, 9), x = randInt(rnd, -3 - t, 3 + t);
  const f = `y = ${a === 1 ? '' : a === -1 ? '−' : fv(a)}x${b === 0 ? '' : b < 0 ? ` − ${-b}` : ` + ${b}`}`;
  return { q: `Với ${f}, khi x = ${fv(x)} thì y = ?|For ${f}, if x = ${fe(x)}, what is y?`, a: a * x + b, near: [a * x - b, a + x + b, -(a * x + b), a * x + b + 1], allowNeg: true };
});

export const MATH_CONCEPTS = {
  1: [counting, addSub, missing, compare, wordProblems, sequences],
  2: [addSub, mulDiv, missing, timeMoney, wordProblems, sequences, compare],
  3: [mulDiv, addSub, geometry, wordProblems, timeMoney, missing],
  4: [fractions, rounding, geometry, mulDiv, wordProblems, compare],
  5: [decimals, percent, fractions, geometry, wordProblems, sequences],
  6: [integers, powers, percent, sequences, fractions, mulDiv],
  7: [equations, angles, integers, powers, percent, decimals],
  8: [pythag, expand, equations, powers, geometry, integers],
  9: [quadratic, linearFn, pythag, expand, equations, powers],
};
