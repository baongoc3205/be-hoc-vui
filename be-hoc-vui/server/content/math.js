// Bộ sinh câu hỏi Toán theo seed — lớp 1 đến lớp 9.
// Mỗi chủ đề có hàm gen(rnd, kind) trả về một "item" thuộc dạng kind.
import { randInt, pick, shuffle } from '../../shared/logic.js';

const L = (vi, en) => ({ vi, en: en ?? vi });

/** Tạo bộ lựa chọn số: đáp án đúng ở vị trí 0, các đáp án nhiễu không trùng. */
function numOptions(rnd, correct, extra = [], count = 4, fmt = String) {
  const set = new Set([fmt(correct)]);
  const out = [fmt(correct)];
  const cands = [...extra, correct + 1, correct - 1, correct + 2, correct - 2, correct + 10, correct - 10, correct * 2];
  for (const c of shuffle(rnd, cands)) {
    if (out.length >= count) break;
    if (typeof c === 'number' && (c < 0 && correct >= 0)) continue;
    const s = fmt(c);
    if (!set.has(s) && Number.isFinite(Number(c))) { set.add(s); out.push(s); }
  }
  let k = 3;
  while (out.length < count) { const s = fmt(correct + k++); if (!set.has(s)) { set.add(s); out.push(s); } }
  return out;
}
const mc = (prompt, options, extra = {}) => ({ kind: 'mc', prompt, options, ...extra });
const tf = (prompt, answer) => ({ kind: 'tf', prompt, answer });
const fmtDec = (x) => String(Math.round(x * 100) / 100).replace('.', ',');
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };

/** Phép tính có kết quả, dùng chung cho mc/tf/pairs/race. */
function arithItem(rnd, kind, make, prompt = L('Kết quả là bao nhiêu?', 'What is the answer?')) {
  if (kind === 'mc') { const { q, a, near } = make(); return mc(L(`${q} = ?`), numOptions(rnd, a, near), { title: prompt }); }
  if (kind === 'tf') {
    const { q, a } = make();
    const ok = rnd() < 0.5; const shown = ok ? a : a + pick(rnd, [-2, -1, 1, 2, 10]);
    return tf(L(`${q} = ${shown}`), ok || shown === a);
  }
  if (kind === 'pairs') {
    const pairs = []; const seen = new Set();
    while (pairs.length < 4) { const { q, a } = make(); if (seen.has(a)) continue; seen.add(a); pairs.push([L(q), L(String(a))]); }
    return { kind: 'pairs', prompt: L('Nối phép tính với kết quả đúng', 'Match each sum to its answer'), pairs };
  }
  return null;
}


/** Sinh dãy số cho game hứng đồ: luôn có cả số đúng và số sai. */
function classifyNums(rnd, prompt, okFn, min, max, okCount = 6, badCount = 8) {
  const ok = new Set(), bad = new Set();
  for (let i = 0; i < 2000 && (ok.size < okCount || bad.size < badCount); i++) {
    const n = randInt(rnd, min, max);
    if (okFn(n)) { if (ok.size < okCount) ok.add(n); } else if (bad.size < badCount) bad.add(n);
  }
  return { kind: 'classify', prompt, items: [...[...ok].map((n) => ({ t: L(String(n)), ok: true })), ...[...bad].map((n) => ({ t: L(String(n)), ok: false }))] };
}

export const mathTopics = [
  // ---------------- LỚP 1 ----------------
  {
    id: 'm1a', grade: 1, title: L('Cộng trừ trong phạm vi 10', 'Add & subtract within 10'),
    games: ['quiz', 'balloon-pop', 'drag-match', 'true-false', 'math-race', 'boss'],
    gen(rnd, kind) {
      const make = () => {
        if (rnd() < 0.55) { const a = randInt(rnd, 0, 9), b = randInt(rnd, 0, 10 - a); return { q: `${a} + ${b}`, a: a + b }; }
        const a = randInt(rnd, 1, 10), b = randInt(rnd, 0, a); return { q: `${a} − ${b}`, a: a - b };
      };
      if (kind === 'mc' && rnd() < 0.3) {
        const n = randInt(rnd, 2, 6), m = randInt(rnd, 1, 4); const f = pick(rnd, ['🍎', '🐟', '⭐', '🌸', '🍓']);
        return mc(L(`${f.repeat(n)} + ${f.repeat(m)} = ?`), numOptions(rnd, n + m), { title: L('Đếm và cộng nhé!', 'Count and add!') });
      }
      return arithItem(rnd, kind, make);
    },
  },
  {
    id: 'm1b', grade: 1, title: L('Đếm và so sánh số đến 100', 'Count & compare up to 100'),
    games: ['quiz', 'sort-order', 'catch-fall', 'true-false', 'memory', 'boss'],
    gen(rnd, kind) {
      if (kind === 'mc') {
        const t = randInt(rnd, 0, 2);
        if (t === 0) { const n = randInt(rnd, 1, 98); return mc(L(`Số liền sau của ${n} là số nào?`, `Which number comes right after ${n}?`), numOptions(rnd, n + 1, [n - 1, n + 10])); }
        if (t === 1) { const n = randInt(rnd, 3, 9); const f = pick(rnd, ['🐥', '🍌', '🎈', '🐞']); return mc(L(`Có bao nhiêu? ${f.repeat(n)}`, `How many? ${f.repeat(n)}`), numOptions(rnd, n)); }
        const a = randInt(rnd, 10, 99); let b = randInt(rnd, 10, 99); if (b === a) b = a + 1;
        return mc(L(`Số nào lớn hơn: ${a} hay ${b}?`, `Which is bigger: ${a} or ${b}?`), [String(Math.max(a, b)), String(Math.min(a, b))]);
      }
      if (kind === 'tf') { const a = randInt(rnd, 10, 99), b = randInt(rnd, 10, 99); const s = pick(rnd, ['>', '<']); return tf(L(`${a} ${s} ${b}`), s === '>' ? a > b : a < b); }
      if (kind === 'order') {
        const set = new Set(); while (set.size < 4) set.add(randInt(rnd, 1, 99));
        return { kind: 'order', prompt: L('Xếp các số từ bé đến lớn', 'Order from smallest to biggest'), items: [...set].sort((x, y) => x - y).map((n) => L(String(n))) };
      }
      if (kind === 'classify') return classifyNums(rnd, L('Hứng các số CHẴN!', 'Catch the EVEN numbers!'), (n) => n % 2 === 0, 1, 50);
      if (kind === 'pairs') {
        const fs = ['🍎', '⭐', '🐟', '🌸', '🎈', '🍓'];
        const nums = shuffle(rnd, [1, 2, 3, 4, 5, 6]).slice(0, 4);
        return { kind: 'pairs', prompt: L('Tìm cặp số và hình giống nhau', 'Match numbers and pictures'), pairs: nums.map((n, i) => [L(String(n)), L(fs[i].repeat(n))]) };
      }
      return null;
    },
  },
  // ---------------- LỚP 2 ----------------
  {
    id: 'm2a', grade: 2, title: L('Bảng nhân 2 và 5', 'Times tables 2 and 5'),
    games: ['quiz', 'memory', 'true-false', 'math-race', 'balloon-pop', 'boss'],
    gen(rnd, kind) {
      const make = () => { const a = pick(rnd, [2, 5]), b = randInt(rnd, 1, 10); return { q: `${a} × ${b}`, a: a * b, near: [a * (b + 1), a * (b - 1), a + b] }; };
      return arithItem(rnd, kind, make);
    },
  },
  {
    id: 'm2b', grade: 2, title: L('Xem đồng hồ', 'Telling the time'),
    games: ['clock', 'quiz', 'true-false', 'clock', 'boss'],
    gen(rnd, kind) {
      const h = randInt(rnd, 1, 12), m = pick(rnd, [0, 0, 30, 15, 45]);
      const t = (hh, mm) => `${hh}:${String(mm).padStart(2, '0')}`;
      if (kind === 'clock') return { kind: 'clock', h, m: pick(rnd, [0, 30, 15, 45, 5, 20, 40, 10]), prompt: L('Kéo kim đồng hồ chỉ đúng giờ', 'Set the clock to the time') };
      if (kind === 'mc') {
        const opts = [t(h, m), t((h % 12) + 1, m), t(h, (m + 30) % 60), t(((h + 10) % 12) + 1, m)];
        return mc(L(`Kim ngắn chỉ gần số ${h}, kim dài chỉ số ${m === 0 ? 12 : m / 5}. Là mấy giờ?`, `Short hand near ${h}, long hand on ${m === 0 ? 12 : m / 5}. What time is it?`), [...new Set(opts)]);
      }
      if (kind === 'tf') { const ok = rnd() < 0.5; return tf(L(`Kim dài chỉ số 6 nghĩa là ${ok ? '30' : '6'} phút`, `Long hand on 6 means ${ok ? '30' : '6'} minutes`), ok); }
      return null;
    },
  },
  // ---------------- LỚP 3 ----------------
  {
    id: 'm3a', grade: 3, title: L('Nhân chia trong bảng', 'Multiplication & division facts'),
    games: ['quiz', 'drag-match', 'math-race', 'catch-fall', 'true-false', 'boss'],
    gen(rnd, kind) {
      const make = () => {
        const a = randInt(rnd, 2, 9), b = randInt(rnd, 2, 9);
        return rnd() < 0.5 ? { q: `${a} × ${b}`, a: a * b, near: [a * (b + 1), (a + 1) * b, a + b] } : { q: `${a * b} : ${a}`, a: b, near: [a, b + 1, b - 1] };
      };
      if (kind === 'classify') return classifyNums(rnd, L('Hứng các số chia hết cho 3!', 'Catch numbers divisible by 3!'), (n) => n % 3 === 0, 2, 40);
      return arithItem(rnd, kind, make);
    },
  },
  {
    id: 'm3b', grade: 3, title: L('Chu vi và phân số đơn giản', 'Perimeter & simple fractions'),
    games: ['quiz', 'memory', 'true-false', 'quiz', 'boss'],
    gen(rnd, kind) {
      if (kind === 'mc') {
        if (rnd() < 0.5) { const a = randInt(rnd, 2, 12), b = randInt(rnd, 2, 12); return mc(L(`Hình chữ nhật dài ${a} cm, rộng ${b} cm. Chu vi là?`, `Rectangle ${a} cm by ${b} cm. Perimeter?`), numOptions(rnd, 2 * (a + b), [a * b, a + b]).map((x) => `${x} cm`)); }
        const n = pick(rnd, [2, 3, 4, 5]), k = n * randInt(rnd, 2, 6);
        return mc(L(`1/${n} của ${k} là bao nhiêu?`, `What is 1/${n} of ${k}?`), numOptions(rnd, k / n, [k - n, n]));
      }
      if (kind === 'tf') { const a = randInt(rnd, 2, 9); const ok = rnd() < 0.5; return tf(L(`Hình vuông cạnh ${a} cm có chu vi ${ok ? a * 4 : a * 2} cm`, `A square with side ${a} cm has perimeter ${ok ? a * 4 : a * 2} cm`), ok); }
      if (kind === 'pairs') return { kind: 'pairs', prompt: L('Ghép cách đọc với phân số', 'Match words to fractions'), pairs: shuffle(rnd, [[L('Một phần hai', 'One half'), L('1/2')], [L('Một phần ba', 'One third'), L('1/3')], [L('Một phần tư', 'One quarter'), L('1/4')], [L('Một phần năm', 'One fifth'), L('1/5')], [L('Hai phần ba', 'Two thirds'), L('2/3')]]).slice(0, 4) };
      return null;
    },
  },
  // ---------------- LỚP 4 ----------------
  {
    id: 'm4a', grade: 4, title: L('Số có nhiều chữ số', 'Large numbers'),
    games: ['quiz', 'sort-order', 'catch-fall', 'true-false', 'boss'],
    gen(rnd, kind) {
      if (kind === 'mc') {
        const n = randInt(rnd, 10000, 999999); const digits = String(n); const pos = randInt(rnd, 0, digits.length - 1);
        const names = [L('hàng đơn vị', 'ones'), L('hàng chục', 'tens'), L('hàng trăm', 'hundreds'), L('hàng nghìn', 'thousands'), L('hàng chục nghìn', 'ten thousands'), L('hàng trăm nghìn', 'hundred thousands')];
        const idx = digits.length - 1 - pos; const d = Number(digits[pos]);
        const others = shuffle(rnd, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x !== d)).slice(0, 3);
        return mc(L(`Trong số ${n.toLocaleString('vi-VN')}, chữ số ${names[idx].vi} là?`, `In ${n.toLocaleString('en-US')}, which digit is in the ${names[idx].en} place?`), [String(d), ...others.map(String)]);
      }
      if (kind === 'order') {
        const s = new Set(); while (s.size < 4) s.add(randInt(rnd, 1000, 99999));
        return { kind: 'order', prompt: L('Xếp từ bé đến lớn', 'Order smallest to biggest'), items: [...s].sort((a, b) => a - b).map((n) => L(n.toLocaleString('vi-VN'), n.toLocaleString('en-US'))) };
      }
      if (kind === 'classify') return classifyNums(rnd, L('Hứng số chia hết cho 5!', 'Catch numbers divisible by 5!'), (n) => n % 5 === 0, 100, 9999);
      if (kind === 'tf') { const n = randInt(rnd, 1000, 9999); const r = Math.round(n / 100) * 100; const ok = rnd() < 0.5; return tf(L(`Làm tròn ${n} đến hàng trăm được ${ok ? r : r + 100}`, `${n} rounded to the nearest hundred is ${ok ? r : r + 100}`), ok); }
      return null;
    },
  },
  {
    id: 'm4b', grade: 4, title: L('Phân số', 'Fractions'),
    games: ['quiz', 'drag-match', 'true-false', 'quiz', 'boss'],
    gen(rnd, kind) {
      if (kind === 'mc') {
        if (rnd() < 0.5) { const a = randInt(rnd, 1, 5), b = randInt(rnd, a + 1, 9), k = randInt(rnd, 2, 4); return mc(L(`Rút gọn phân số ${a * k}/${b * k}`, `Simplify ${a * k}/${b * k}`), [...new Set([`${a / gcd(a, b)}/${b / gcd(a, b)}`, `${a}/${b * k}`, `${a * k}/${b}`, `${b}/${a}`])]); }
        const d = randInt(rnd, 3, 9), a = randInt(rnd, 1, d - 1), b = randInt(rnd, 1, d - 1); const s = a + b;
        const g = gcd(s, d);
        return mc(L(`${a}/${d} + ${b}/${d} = ?`), [...new Set([`${s / g}/${d / g}`, `${s}/${d * 2}`, `${a * b}/${d}`, `${s + 1}/${d}`])]);
      }
      if (kind === 'pairs') { const base = shuffle(rnd, [[1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [1, 4]]).slice(0, 4); return { kind: 'pairs', prompt: L('Ghép các phân số bằng nhau', 'Match equal fractions'), pairs: base.map(([a, b]) => { const k = randInt(rnd, 2, 4); return [L(`${a}/${b}`), L(`${a * k}/${b * k}`)]; }) }; }
      if (kind === 'tf') { const a = randInt(rnd, 1, 4), b = randInt(rnd, a + 1, 8), c = randInt(rnd, 1, 4), d = randInt(rnd, c + 1, 8); const real = a / b > c / d; return tf(L(`${a}/${b} > ${c}/${d}`), real); }
      return null;
    },
  },
  // ---------------- LỚP 5 ----------------
  {
    id: 'm5a', grade: 5, title: L('Số thập phân', 'Decimals'),
    games: ['quiz', 'sort-order', 'math-race', 'true-false', 'boss'],
    gen(rnd, kind) {
      const dec = () => randInt(rnd, 10, 999) / 10;
      if (kind === 'mc') {
        const a = dec(), b = dec(); const op = rnd() < 0.6 ? '+' : '−'; const [x, y] = op === '−' && b > a ? [b, a] : [a, b]; const r = op === '+' ? x + y : x - y;
        const en = (v) => String(Math.round(v * 100) / 100);
        return mc(L(`${fmtDec(x)} ${op} ${fmtDec(y)} = ?`, `${en(x)} ${op} ${en(y)} = ?`), [r, r + 1, r - 0.1, r + 10].map((v) => L(fmtDec(v), en(v))));
      }
      if (kind === 'order') { const s = new Set(); while (s.size < 4) s.add(randInt(rnd, 1, 99) / 10 + randInt(rnd, 0, 3)); return { kind: 'order', prompt: L('Xếp từ bé đến lớn', 'Order smallest to biggest'), items: [...s].sort((a, b) => a - b).map((n) => L(fmtDec(n), String(Math.round(n * 100) / 100))) }; }
      if (kind === 'tf') { const a = randInt(rnd, 1, 9); const b = randInt(rnd, 10, 99); return tf(L(`${a},${b} > ${a},${String(b).slice(0, 1)}`, `${a}.${b} > ${a}.${String(b).slice(0, 1)}`), Number(`${a}.${b}`) > Number(`${a}.${String(b).slice(0, 1)}`)); }
      return null;
    },
  },
  {
    id: 'm5b', grade: 5, title: L('Tỉ số phần trăm', 'Percentages'),
    games: ['quiz', 'drag-match', 'true-false', 'quiz', 'boss'],
    gen(rnd, kind) {
      if (kind === 'mc') { const p = pick(rnd, [10, 20, 25, 50, 75]), n = pick(rnd, [20, 40, 60, 80, 100, 120, 200]); const r = (p * n) / 100; return mc(L(`${p}% của ${n} là bao nhiêu?`, `What is ${p}% of ${n}?`), numOptions(rnd, r, [n - r, p, r * 2])); }
      if (kind === 'pairs') return { kind: 'pairs', prompt: L('Ghép phân số với tỉ số phần trăm', 'Match fractions to percents'), pairs: shuffle(rnd, [['1/2', '50%'], ['1/4', '25%'], ['3/4', '75%'], ['1/10', '10%'], ['1/5', '20%'], ['2/5', '40%']]).slice(0, 4).map(([a, b]) => [L(a), L(b)]) };
      if (kind === 'tf') { const n = pick(rnd, [40, 80, 200]); const ok = rnd() < 0.5; return tf(L(`50% của ${n} là ${ok ? n / 2 : n / 4}`, `50% of ${n} is ${ok ? n / 2 : n / 4}`), ok); }
      return null;
    },
  },
  // ---------------- LỚP 6 ----------------
  {
    id: 'm6a', grade: 6, title: L('Số nguyên', 'Integers'),
    games: ['quiz', 'sort-order', 'math-race', 'true-false', 'boss'],
    gen(rnd, kind) {
      const make = () => { const a = randInt(rnd, -20, 20), b = randInt(rnd, -20, 20); const show = (x) => (x < 0 ? `(${x})` : String(x)); return rnd() < 0.5 ? { q: `${show(a)} + ${show(b)}`, a: a + b, near: [a - b, -(a + b)] } : { q: `${show(a)} − ${show(b)}`, a: a - b, near: [a + b, b - a] }; };
      if (kind === 'mc') { const { q, a, near } = make(); return mc(L(`${q} = ?`), numOptions(rnd, a, near).map(String)); }
      if (kind === 'order') { const s = new Set(); while (s.size < 5) s.add(randInt(rnd, -30, 30)); return { kind: 'order', prompt: L('Xếp các số nguyên tăng dần', 'Order integers ascending'), items: [...s].sort((a, b) => a - b).map((n) => L(String(n))) }; }
      return arithItem(rnd, kind, make);
    },
  },
  {
    id: 'm6b', grade: 6, title: L('Số nguyên tố, ƯCLN, BCNN', 'Primes, GCD & LCM'),
    games: ['quiz', 'catch-fall', 'true-false', 'quiz', 'boss'],
    gen(rnd, kind) {
      if (kind === 'mc') {
        const a = randInt(rnd, 2, 12) * randInt(rnd, 1, 4), b = randInt(rnd, 2, 12) * randInt(rnd, 1, 4); const g = gcd(a, b), l = (a * b) / g;
        return rnd() < 0.5 ? mc(L(`ƯCLN(${a}, ${b}) = ?`, `GCD(${a}, ${b}) = ?`), numOptions(rnd, g, [l, a, b].filter((x) => x !== g))) : mc(L(`BCNN(${a}, ${b}) = ?`, `LCM(${a}, ${b}) = ?`), numOptions(rnd, l, [a * b, g, l + a]));
      }
      if (kind === 'classify') return classifyNums(rnd, L('Hứng các số NGUYÊN TỐ!', 'Catch the PRIME numbers!'), isPrime, 2, 50);
      if (kind === 'tf') { const n = randInt(rnd, 2, 60); return tf(L(`${n} là số nguyên tố`, `${n} is a prime number`), isPrime(n)); }
      return null;
    },
  },
  // ---------------- LỚP 7 ----------------
  {
    id: 'm7a', grade: 7, title: L('Số hữu tỉ', 'Rational numbers'),
    games: ['quiz', 'sort-order', 'true-false', 'quiz', 'boss'],
    gen(rnd, kind) {
      if (kind === 'mc') { const a = randInt(rnd, 1, 9), b = randInt(rnd, 2, 9), c = randInt(rnd, 1, 9), d = randInt(rnd, 2, 9); const n = a * d - c * b, m = b * d, g = gcd(n, m) || 1; const r = `${n / g}/${m / g}`; return mc(L(`${a}/${b} − ${c}/${d} = ?`), [...new Set([r, `${a - c}/${b - d === 0 ? b : Math.abs(b - d)}`, `${(a * d + c * b) / gcd(a * d + c * b, m)}/${m / gcd(a * d + c * b, m)}`, `${-n / g}/${m / g}`])]); }
      if (kind === 'order') { const s = new Map(); while (s.size < 4) { const p = randInt(rnd, -9, 9), q = randInt(rnd, 2, 6); const v = p / q; if (![...s.values()].includes(v)) s.set(`${p}/${q}`, v); } return { kind: 'order', prompt: L('Xếp tăng dần', 'Order ascending'), items: [...s.entries()].sort((x, y) => x[1] - y[1]).map(([k]) => L(k)) }; }
      if (kind === 'tf') { const p = randInt(rnd, 1, 9), q = randInt(rnd, 2, 9), r = randInt(rnd, 1, 9), t = randInt(rnd, 2, 9); if (p * t === r * q) return tf(L(`${p}/${q} = ${r * 2}/${t * 2}`), p * t * 2 === r * 2 * q); return tf(L(`${p}/${q} > ${r}/${t}`), p / q > r / t); }
      return null;
    },
  },
  {
    id: 'm7b', grade: 7, title: L('Tỉ lệ thức và tam giác', 'Proportions & triangles'),
    games: ['quiz', 'drag-match', 'true-false', 'quiz', 'boss'],
    gen(rnd, kind) {
      if (kind === 'mc') {
        if (rnd() < 0.5) { const a = randInt(rnd, 2, 9), b = randInt(rnd, 2, 9), k = randInt(rnd, 2, 5); return mc(L(`Tìm x: x/${a * k} = ${b}/${a}`, `Find x: x/${a * k} = ${b}/${a}`), numOptions(rnd, b * k, [b * a, a * k])); }
        const A = randInt(rnd, 30, 90), B = randInt(rnd, 20, 150 - A); return mc(L(`Tam giác có hai góc ${A}° và ${B}°. Góc còn lại?`, `A triangle has angles ${A}° and ${B}°. The third angle?`), numOptions(rnd, 180 - A - B, [360 - A - B, A + B - 90]).map((x) => `${x}°`));
      }
      if (kind === 'pairs') return { kind: 'pairs', prompt: L('Ghép loại tam giác với đặc điểm', 'Match triangle types'), pairs: [[L('Tam giác đều', 'Equilateral'), L('3 cạnh bằng nhau', '3 equal sides')], [L('Tam giác vuông', 'Right triangle'), L('Có góc 90°', 'Has a 90° angle')], [L('Tam giác cân', 'Isosceles'), L('2 cạnh bằng nhau', '2 equal sides')], [L('Tam giác tù', 'Obtuse'), L('Có góc > 90°', 'Has an angle > 90°')]] };
      if (kind === 'tf') { const A = randInt(rnd, 30, 80), B = randInt(rnd, 30, 80); const ok = rnd() < 0.5; const C = ok ? 180 - A - B : 180 - A - B + 10; return tf(L(`Tam giác có các góc ${A}°, ${B}°, ${C}°`, `A triangle can have angles ${A}°, ${B}°, ${C}°`), A + B + C === 180); }
      return null;
    },
  },
  // ---------------- LỚP 8 ----------------
  {
    id: 'm8a', grade: 8, title: L('Hằng đẳng thức đáng nhớ', 'Algebraic identities'),
    games: ['quiz', 'drag-match', 'true-false', 'memory', 'boss'],
    gen(rnd, kind) {
      const v = pick(rnd, ['x', 'a', 'y']); const n = randInt(rnd, 2, 9);
      if (kind === 'mc') {
        const t = randInt(rnd, 0, 2);
        if (t === 0) return mc(L(`(${v} + ${n})² = ?`), [`${v}² + ${2 * n}${v} + ${n * n}`, `${v}² + ${n * n}`, `${v}² + ${n}${v} + ${n * n}`, `${v}² − ${2 * n}${v} + ${n * n}`]);
        if (t === 1) return mc(L(`(${v} − ${n})² = ?`), [`${v}² − ${2 * n}${v} + ${n * n}`, `${v}² − ${n * n}`, `${v}² + ${2 * n}${v} − ${n * n}`, `${v}² − ${n}${v} + ${n * n}`]);
        return mc(L(`${v}² − ${n * n} = ?`), [`(${v} − ${n})(${v} + ${n})`, `(${v} − ${n})²`, `(${v} + ${n})²`, `(${v} − ${n * n})(${v} + 1)`]);
      }
      if (kind === 'pairs') return { kind: 'pairs', prompt: L('Ghép hai vế của hằng đẳng thức', 'Match both sides'), pairs: [[L('(a + b)²'), L('a² + 2ab + b²')], [L('(a − b)²'), L('a² − 2ab + b²')], [L('a² − b²'), L('(a − b)(a + b)')], [L('(a + b)³'), L('a³ + 3a²b + 3ab² + b³')]] };
      if (kind === 'tf') { const ok = rnd() < 0.5; return tf(L(`(${v} + ${n})² = ${v}² + ${ok ? 2 * n : n}${v} + ${n * n}`), ok); }
      return null;
    },
  },
  {
    id: 'm8b', grade: 8, title: L('Phương trình bậc nhất', 'Linear equations'),
    games: ['quiz', 'math-race', 'true-false', 'quiz', 'boss'],
    gen(rnd, kind) {
      const make = () => { const x = randInt(rnd, -9, 12), a = randInt(rnd, 2, 9), b = randInt(rnd, -20, 20); const c = a * x + b; const bs = b < 0 ? `− ${-b}` : `+ ${b}`; return { q: `${a}x ${bs} = ${c}`, a: x, near: [-x, x + 1, Math.round(c / a)] }; };
      if (kind === 'mc') { const { q, a, near } = make(); return mc(L(`Giải: ${q}. x = ?`, `Solve: ${q}. x = ?`), numOptions(rnd, a, near).map(String)); }
      if (kind === 'tf') { const { q, a } = make(); const ok = rnd() < 0.5; return tf(L(`x = ${ok ? a : a + 1} là nghiệm của ${q}`, `x = ${ok ? a : a + 1} solves ${q}`), ok); }
      return null;
    },
  },
  // ---------------- LỚP 9 ----------------
  {
    id: 'm9a', grade: 9, title: L('Căn bậc hai', 'Square roots'),
    games: ['quiz', 'catch-fall', 'memory', 'true-false', 'boss'],
    gen(rnd, kind) {
      if (kind === 'mc') { const n = randInt(rnd, 2, 20); return mc(L(`√${n * n} = ?`), numOptions(rnd, n, [n * 2, n * n / 2 | 0])); }
      if (kind === 'classify') return classifyNums(rnd, L('Hứng các SỐ CHÍNH PHƯƠNG!', 'Catch PERFECT SQUARES!'), (n) => Number.isInteger(Math.sqrt(n)), 2, 150);
      if (kind === 'pairs') { const ns = shuffle(rnd, [4, 5, 6, 7, 8, 9, 11, 12]).slice(0, 4); return { kind: 'pairs', prompt: L('Ghép căn với kết quả', 'Match the roots'), pairs: ns.map((n) => [L(`√${n * n}`), L(String(n))]) }; }
      if (kind === 'tf') { const a = randInt(rnd, 2, 6), b = randInt(rnd, 2, 6); return tf(L(`√${a * a} + √${b * b} = √${a * a + b * b}`), a * a + b * b === (a + b) ** 2); }
      return null;
    },
  },
  {
    id: 'm9b', grade: 9, title: L('Hàm số bậc nhất & hệ phương trình', 'Linear functions & systems'),
    games: ['quiz', 'true-false', 'drag-match', 'quiz', 'boss'],
    gen(rnd, kind) {
      const a = randInt(rnd, -5, 6) || 2, b = randInt(rnd, -9, 9);
      const fx = `y = ${a}x ${b < 0 ? '− ' + -b : '+ ' + b}`;
      if (kind === 'mc') {
        if (rnd() < 0.5) { const x = randInt(rnd, -4, 5); return mc(L(`Với ${fx}, khi x = ${x} thì y = ?`, `For ${fx}, if x = ${x}, y = ?`), numOptions(rnd, a * x + b, [a + x + b, a * x - b]).map(String)); }
        const x = randInt(rnd, -5, 5), y = randInt(rnd, -5, 5); return mc(L(`Giải hệ: x + y = ${x + y}; x − y = ${x - y}`, `Solve: x + y = ${x + y}; x − y = ${x - y}`), [...new Set([`(${x}; ${y})`, `(${y}; ${x})`, `(${x + 1}; ${y - 1})`, `(${-x}; ${y})`])]);
      }
      if (kind === 'tf') { return tf(L(`Hàm số ${fx} đồng biến`, `The function ${fx} is increasing`), a > 0); }
      if (kind === 'pairs') { const fs = shuffle(rnd, [1, 2, 3, -1, -2, 4]).slice(0, 4); return { kind: 'pairs', prompt: L('Ghép hàm số với hệ số góc', 'Match function to slope'), pairs: fs.map((k, i) => [L(`y = ${k}x + ${i + 1}`), L(`a = ${k}`)]) }; }
      return null;
    },
  },
];
