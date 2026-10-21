// "Vui học kiểu mới": các dạng câu hỏi tương tác (tia số, cân thăng bằng, bánh pizza, đi chợ, tìm lỗi sai, xếp câu)
// và cách chơi mới (câu cá). Mỗi môn mỗi lớp có một chủ đề, đặt trước chặng luyện tập.
// Câu trắc nghiệm cho game Câu cá / Thử thách trùm lấy từ các chủ đề cũ cùng môn, cùng lớp.
const L = (vi, en) => ({ vi, en: en ?? vi });
const pick = (rnd, a) => a[Math.floor(rnd() * a.length)];
const int = (rnd, lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const fmt = (n, lang) => {
  const s = Math.abs(n) % 1 ? String(Math.round(n * 100) / 100) : String(Math.abs(n));
  const [a, b] = s.split('.');
  const g = a.replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'vi' ? '.' : ',');
  return (n < 0 ? '−' : '') + g + (b ? (lang === 'vi' ? ',' : '.') + b : '');
};
const num = (n) => L(fmt(n, 'vi'), fmt(n, 'en'));

// ---------------- Toán: tia số ----------------
function numberline(rnd, grade) {
  const conf = grade <= 1 ? { min: 0, max: 10, step: 1, labels: [0, 5, 10] }
    : grade === 2 ? { min: 0, max: 100, step: 10, labels: [0, 50, 100] }
    : grade === 3 ? { min: 0, max: 100, step: 5, labels: [0, 20, 40, 60, 80, 100] }
    : grade === 4 ? { min: 0, max: 1000, step: 50, labels: [0, 500, 1000] }
    : grade === 5 ? { min: 0, max: 1, step: 0.1, labels: [0, 0.5, 1] }
    : grade <= 7 ? { min: -10, max: 10, step: 1, labels: [-10, -5, 0, 5, 10] }
    : { min: -5, max: 5, step: 0.5, labels: [-5, 0, 5] };
  const n = Math.round((conf.max - conf.min) / conf.step);
  let k = int(rnd, 1, n - 1);
  if (conf.labels.some((l) => Math.abs(l - (conf.min + k * conf.step)) < 1e-9)) k = Math.min(n - 1, k + 1);
  const target = Math.round((conf.min + k * conf.step) * 100) / 100;
  return { kind: 'numberline', prompt: L(`Đặt số ${fmt(target, 'vi')} lên tia số`, `Put ${fmt(target, 'en')} on the number line`), ...conf, target, tol: 0 };
}

// ---------------- Toán: cân thăng bằng ----------------
function balance(rnd, grade) {
  let a, b, op = '+';
  if (grade <= 1) { b = int(rnd, 4, 10); a = int(rnd, 1, b - 1); }
  else if (grade === 2) { b = int(rnd, 20, 100); a = int(rnd, 5, b - 5); }
  else if (grade <= 4 && rnd() < 0.6) { op = '×'; const x = int(rnd, 2, 9), y = int(rnd, 2, 9); a = x; b = x * y; }
  else if (grade <= 4) { b = int(rnd, 100, 1000); a = int(rnd, 10, b - 10); }
  else { op = rnd() < 0.5 ? '×' : '+'; if (op === '×') { const x = int(rnd, 3, 12), y = int(rnd, 6, 15); a = x; b = x * y; } else { b = int(rnd, 500, 5000); a = int(rnd, 50, b - 50); } }
  const answer = op === '+' ? b - a : b / a;
  const wrong = new Set();
  for (const d of [1, -1, 2, -2, 10, -10, a, 3]) { const w = answer + d; if (w > 0 && w !== answer) wrong.add(w); if (wrong.size >= 3) break; }
  const weights = [answer, ...[...wrong].slice(0, 3)].sort(() => rnd() - 0.5);
  const sign = op === '+' ? '+' : '×';
  return {
    kind: 'balance', op, left: [null, a], right: [b], answer, weights,
    prompt: L(`Chọn quả cân để cân thăng bằng: □ ${sign} ${fmt(a, 'vi')} = ${fmt(b, 'vi')}`, `Pick the weight that balances: □ ${sign} ${fmt(a, 'en')} = ${fmt(b, 'en')}`),
  };
}

// ---------------- Toán: bánh pizza (phân số) ----------------
function fraction(rnd, grade) {
  if (grade >= 5 && rnd() < 0.5) {
    const [n, d, parts] = pick(rnd, [[1, 2, 8], [1, 2, 6], [1, 3, 6], [2, 3, 6], [1, 4, 8], [3, 4, 8], [1, 2, 4]]);
    return { kind: 'fraction', parts, need: (n * parts) / d, prompt: L(`Tô số phần bằng ${n}/${d} chiếc bánh (bánh chia ${parts} phần)`, `Colour ${n}/${d} of the pizza (cut into ${parts} slices)`) };
  }
  const parts = pick(rnd, grade <= 2 ? [2, 3, 4] : grade <= 3 ? [3, 4, 5, 6] : [4, 5, 6, 8]);
  const need = int(rnd, 1, parts - 1);
  return { kind: 'fraction', parts, need, prompt: L(`Tô ${need}/${parts} chiếc bánh`, `Colour ${need}/${parts} of the pizza`) };
}

// ---------------- Toán: đi chợ (tiền Việt Nam) ----------------
const GOODS_SMALL = [['🍬', 'Kẹo', 'Sweets', 1000], ['✏️', 'Bút chì', 'Pencil', 2000], ['🍌', 'Quả chuối', 'Banana', 2000], ['🎈', 'Bóng bay', 'Balloon', 3000], ['📒', 'Quyển vở', 'Notebook', 5000], ['🧃', 'Hộp sữa', 'Milk carton', 6000], ['🥖', 'Bánh mì', 'Bread roll', 8000]];
const GOODS_BIG = [['🥤', 'Nước cam', 'Orange juice', 15000], ['📚', 'Truyện tranh', 'Comic book', 25000], ['⚽', 'Quả bóng', 'Football', 60000], ['🧸', 'Gấu bông', 'Teddy bear', 85000], ['🍕', 'Bánh pizza', 'Pizza', 90000], ['🎒', 'Cặp sách', 'School bag', 120000], ['🖍️', 'Hộp bút màu', 'Crayons', 35000]];
function money(rnd, grade) {
  const small = grade <= 2;
  const list = small ? GOODS_SMALL : GOODS_BIG;
  const notes = small ? [1000, 2000, 5000, 10000] : [10000, 20000, 50000, 100000, 5000];
  const n = small ? int(rnd, 1, 2) : int(rnd, 1, grade >= 4 ? 3 : 2);
  const goods = [];
  for (let i = 0; i < n; i++) { const g = pick(rnd, list); if (!goods.some((x) => x.name.vi === g[1])) goods.push({ icon: g[0], name: L(g[1], g[2]), price: g[3] }); }
  const target = goods.reduce((a, g) => a + g.price, 0);
  return { kind: 'money', goods, target, notes: notes.sort((a, b) => a - b), prompt: L(`Trả đúng ${fmt(target, 'vi')} đồng`, `Pay exactly ${fmt(target, 'en')} dong`) };
}

// ---------------- Tiếng Việt: tìm lỗi chính tả, xếp câu ----------------
// [câu đúng, vị trí chữ bị viết sai, chữ viết sai]
const VI_SPELL = [
  ['Con trâu đang gặm cỏ ngoài đồng', 1, 'châu'], ['Mẹ mua cho bé một quả chuối', 6, 'chúi'], ['Bầu trời hôm nay rất trong xanh', 5, 'chong'],
  ['Em nặn con lợn bằng đất sét', 1, 'lặn'], ['Những bông sen nở trên mặt hồ', 2, 'xen'], ['Chú gà trống gáy vang buổi sáng', 6, 'xáng'],
  ['Lớp em trồng cây ở sân trường', 2, 'chồng'], ['Dòng sông quê em uốn lượn quanh làng', 5, 'nượn'], ['Em luôn lễ phép với ông bà', 2, 'nễ'],
  ['Mùa xuân cây cối đâm chồi nảy lộc', 6, 'lảy'], ['Chim sẻ ríu rít trên cành cây', 1, 'xẻ'], ['Bạn Lan có giọng hát rất hay', 3, 'dọng'],
  ['Ông em thích đọc báo mỗi sáng', 3, 'đọt'], ['Chiếc lá vàng rơi xuống sân', 4, 'suống'], ['Bé rửa tay sạch sẽ trước khi ăn', 1, 'rữa'],
  ['Trời mưa to nên đường rất trơn', 6, 'chơn'], ['Cô giáo khen em viết chữ đẹp', 5, 'trữ'], ['Con mèo nằm sưởi nắng bên hiên', 3, 'xưởi'],
  ['Em giữ gìn sách vở cẩn thận', 1, 'giử'], ['Những giọt sương long lanh trên lá', 2, 'xương'], ['Bố em là kĩ sư xây dựng', 5, 'sây'],
  ['Ngoài vườn hoa nở rực rỡ', 5, 'rở'], ['Em bé ngủ say trong nôi', 5, 'lôi'], ['Chúng em chơi nhảy dây giờ ra chơi', 3, 'nhẩy'],
  ['Mặt trời mọc ở đằng đông', 4, 'đằn'], ['Cây bàng trước cổng trường rất to', 1, 'bàn'], ['Em được điểm mười môn chính tả', 6, 'tã'],
  ['Quả cam chín vàng trĩu cành', 4, 'chĩu'], ['Bé tập vẽ ngôi nhà và cái cây', 2, 'vẻ'], ['Mẹ nấu canh rau ngót rất ngon', 1, 'lấu'],
];
// ---------------- Tiếng Anh: tìm lỗi ngữ pháp, xếp câu ----------------
// [câu đúng, vị trí chữ sai, chữ sai, lớp từ]
const EN_SPOT = [
  ['She goes to school every day', 1, 'go', 3], ['They are playing football now', 1, 'is', 3], ['I have two brothers', 1, 'has', 3],
  ['He can swim very well', 2, 'swims', 3], ['There are five apples on the table', 1, 'is', 3], ['Tom and Mary are good friends', 3, 'is', 3],
  ['My father works in a hospital', 2, 'work', 4], ['We went to the zoo yesterday', 1, 'go', 4], ['She does not like milk', 1, 'do', 4],
  ['The cat is sleeping under the bed', 3, 'sleep', 4], ['How many children are there', 1, 'much', 4], ['Did you watch TV last night', 0, 'Do', 5],
  ['I am taller than my sister', 2, 'tall', 5], ['We should brush our teeth twice a day', 4, 'tooth', 5], ['This is the biggest house in the street', 3, 'bigger', 6],
  ['They were watching TV when I came', 1, 'was', 6], ['English is easier than Maths for me', 2, 'easy', 6], ['She enjoys reading books', 2, 'read', 6],
  ['He has lived here since 2015', 1, 'have', 7], ['If it rains we will stay at home', 2, 'rain', 7], ['I have never been to Hanoi', 3, 'be', 7],
  ['The weather is getting colder', 4, 'cold', 7], ['He is interested in science', 2, 'interesting', 7], ['The book was written by my teacher', 3, 'wrote', 8],
  ['My bike was stolen last week', 3, 'stole', 8], ['A new school will be built next year', 5, 'build', 9], ['She asked me where I lived', 5, 'live', 9],
  ['I wish I could fly', 3, 'can', 9],
];
const EN_ORDER = [
  ['I like apples', 1], ['This is my bag', 1], ['I am seven', 1], ['She is my mother', 2], ['I can ride a bike', 2], ['Where do you live', 2],
  ['We go to school by bus', 3], ['My favourite colour is blue', 3], ['There is a cat under the table', 3], ['It is sunny and hot today', 3],
  ['What time do you get up', 4], ['He plays football after school', 4], ['My sister is reading a book now', 4], ['I went to the beach last summer', 5],
  ['She is taller than her brother', 5], ['How much is this T-shirt', 5], ['You should drink more water', 6], ['We are going to visit our grandparents', 6],
  ['Have you ever eaten durian', 7], ['I have lived here for five years', 7], ['The bridge was built in 1990', 8], ['English is spoken all over the world', 8],
  ['If I had wings I would fly', 9], ['She said that she was tired', 9],
];
function spotVi(rnd, grade) {
  const pool = VI_SPELL.filter((_, i) => grade >= 3 || VI_SPELL[i][0].split(' ').length <= 7);
  const [s, k, wrong] = pick(rnd, pool);
  const words = s.split(' '); const fix = words[k]; words[k] = wrong;
  return { kind: 'spot', spot: words, answer: k, fix, prompt: L('Chạm vào chữ viết SAI chính tả', 'Tap the word that is spelled wrong') };
}
function spotEn(rnd, grade) {
  const pool = EN_SPOT.filter((x) => x[3] <= Math.max(3, grade));
  const [s, k, wrong] = pick(rnd, pool);
  const words = s.split(' '); const fix = words[k]; words[k] = wrong;
  return { kind: 'spot', spot: words, answer: k, fix, prompt: L('Chạm vào chữ dùng SAI trong câu tiếng Anh', 'Tap the word that is wrong') };
}
function orderEn(rnd, grade) {
  const pool = EN_ORDER.filter((x) => x[1] <= Math.max(1, grade) && x[1] >= Math.max(1, grade - 3));
  const [s] = pick(rnd, pool.length ? pool : EN_ORDER);
  return { kind: 'sentence', answer: s, prompt: L('Xếp các từ thành câu tiếng Anh đúng', 'Put the words in the right order') };
}
function orderVi(rnd, grade) {
  const pool = VI_SPELL.filter((x) => x[0].split(' ').length <= (grade <= 2 ? 6 : 9));
  const [s] = pick(rnd, pool);
  return { kind: 'sentence', answer: s, prompt: L('Xếp các từ thành câu hoàn chỉnh', 'Put the words in order to make a sentence') };
}

/** Lấy một câu (mc/tf) từ các chủ đề cũ cùng môn, cùng lớp — cho game Câu cá và Thử thách trùm. */
function borrow(src, rnd, kind, ctx) {
  for (let k = 0; k < 12; k++) {
    const t = pick(rnd, src);
    if (t.gen) { const it = t.gen(rnd, kind, ctx); if (it && it.kind === kind && !it.passage && !it.listen) return it; }
    else if (t.items) { const pool = t.items.filter((x) => x.kind === kind && !x.passage && !x.listen); if (pool.length) return pick(rnd, pool); }
  }
  return null;
}

const MATH_GAMES = {
  1: ['number-line', 'market', 'balance', 'fishing', 'number-line', 'boss'],
  2: ['number-line', 'pizza', 'market', 'balance', 'fishing', 'boss'],
  3: ['balance', 'pizza', 'number-line', 'market', 'fishing', 'boss'],
  4: ['pizza', 'number-line', 'balance', 'market', 'fishing', 'boss'],
  5: ['pizza', 'number-line', 'balance', 'market', 'fishing', 'boss'],
};
const gamesFor = (subject, grade) => {
  if (subject === 'math') return MATH_GAMES[grade] ?? ['number-line', 'balance', 'pizza', 'fishing', 'balance', 'boss'];
  if (subject === 'vietnamese') return ['spot-mistake', 'sentence', 'fishing', 'spot-mistake', 'sentence', 'boss'];
  if (subject === 'english') return grade <= 2 ? ['sentence', 'fishing', 'sentence', 'fishing', 'boss'] : ['sentence', 'spot-mistake', 'fishing', 'sentence', 'spot-mistake', 'boss'];
  return ['fishing', 'quiz', 'fishing', 'true-false', 'fishing', 'boss'];
};

/** Tạo chủ đề "Vui học kiểu mới" cho mọi môn, lớp 1–9. `old` = các chủ đề sẵn có để mượn câu trắc nghiệm. */
export function buildFunTopics(old) {
  const out = [];
  for (const subject of ['math', 'vietnamese', 'english', 'science']) {
    for (let grade = 1; grade <= 9; grade++) {
      const src = old.filter((t) => t.subject === subject && t.grade === grade && (t.gen || t.items));
      if (!src.length) continue;
      out.push({
        id: `fun-${subject}${grade}`, subject, grade, fun: true,
        title: L('Vui học kiểu mới', 'New ways to learn'),
        games: gamesFor(subject, grade),
        gen(rnd, kind, ctx = {}) {
          switch (kind) {
            case 'numberline': return numberline(rnd, grade);
            case 'balance': return balance(rnd, grade);
            case 'fraction': return fraction(rnd, grade);
            case 'money': return money(rnd, grade);
            case 'spot': return subject === 'english' ? spotEn(rnd, grade) : spotVi(rnd, grade);
            case 'sentence': return subject === 'english' ? orderEn(rnd, grade) : orderVi(rnd, grade);
            default: return borrow(src, rnd, kind, ctx);
          }
        },
      });
    }
  }
  return out;
}
export const _data = { VI_SPELL, EN_SPOT, EN_ORDER, fmt };
