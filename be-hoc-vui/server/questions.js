// Kho câu hỏi trắc nghiệm đúng lớp cho các trò chơi giải trí (Bài Màu Sắc, Cá ngựa, Ma sói, Thi đố cùng bạn)
// và câu đố "chọn hình/số" cho trò Bé tập vẽ.
import { makeRng, shuffle } from '../shared/logic.js';
import { LESSONS, SUBJECTS } from './content/index.js';
import { buildRounds } from './rounds.js';

const L = (vi, en) => ({ vi, en: en ?? vi });
const asked = (q) => JSON.stringify(q.prompt) + JSON.stringify(q.options?.[0]);

/** n câu trắc nghiệm (kind 'mc') của môn subject (null = trộn) gần lớp grade nhất. */
export function quizPool(grade, subject, n, rnd) {
  const sub = SUBJECTS.some((s) => s.id === subject) ? subject : null;
  let pool = LESSONS.filter((l) => l.game === 'quiz' && (!sub || l.subject === sub));
  const best = Math.min(...pool.map((l) => Math.abs(l.grade - grade)));
  pool = pool.filter((l) => Math.abs(l.grade - grade) === best);
  const out = []; const seen = new Set();
  for (let tries = 0; out.length < n && tries < n * 3; tries++) {
    const lesson = pool[Math.floor(rnd() * pool.length)];
    for (const q of buildRounds(lesson, Math.floor(rnd() * 1e9)).rounds) {
      if (q.kind !== 'mc' || q.passage || q.say || out.length >= n || seen.has(asked(q))) continue;
      seen.add(asked(q)); out.push({ ...q, id: `q${out.length}`, subject: lesson.subject });
    }
  }
  return out;
}

// ---------------- Câu đố cho Bé tập vẽ ----------------
const SHAPES = {
  circle: [L('Hình nào không có cạnh và không có góc?', 'Which shape has no sides and no corners?'), L('Hình nào có mọi điểm trên đường bao đều cách đều tâm?', 'Which shape has every edge point the same distance from the centre?')],
  triangle: [L('Hình nào có 3 cạnh và 3 góc?', 'Which shape has 3 sides and 3 corners?'), L('Hình nào có tổng các góc bằng 180°?', 'Which shape’s angles add up to 180°?')],
  square: [L('Hình nào có 4 cạnh bằng nhau và 4 góc vuông?', 'Which shape has 4 equal sides and 4 right angles?')],
  rect: [L('Hình nào có 4 góc vuông, 2 cạnh dài bằng nhau và 2 cạnh ngắn bằng nhau?', 'Which shape has 4 right angles, 2 equal long sides and 2 equal short sides?')],
  star: [L('Hình nào có 5 cánh nhọn, giống ngôi sao trên lá cờ Việt Nam?', 'Which shape has 5 points, like the star on Vietnam’s flag?')],
  heart: [L('Hình nào là biểu tượng của tình yêu thương?', 'Which shape stands for love?')],
  para: [L('Hình nào có 2 cặp cạnh đối song song và bằng nhau nhưng không có góc vuông?', 'Which shape has 2 pairs of equal parallel sides but no right angle?')],
  rhombus: [L('Hình nào có 4 cạnh bằng nhau nhưng không có góc vuông?', 'Which shape has 4 equal sides but no right angle?')],
  trapezoid: [L('Hình nào có đúng một cặp cạnh đối song song?', 'Which shape has exactly one pair of parallel sides?')],
  right: [L('Góc nào có số đo đúng 90°?', 'Which angle measures exactly 90°?')],
};
const SHAPE_KEYS = Object.keys(SHAPES);
const FRUIT = ['🍎', '🍊', '🍌', '🍓', '⭐', '🐟', '🌸', '🎈'];

/** Câu hỏi mà đáp án chính là chữ số d, độ khó theo lớp. */
function digitQuestion(d, grade, rnd) {
  const r = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  if (grade <= 1 && d > 0) { const f = FRUIT[r(0, FRUIT.length - 1)]; return L(`Có bao nhiêu ${f}?  ${f.repeat(d)}`, `How many ${f}?  ${f.repeat(d)}`); }
  if (grade <= 3) {
    if (rnd() < 0.5 || d === 0) { const a = r(d, d + 9); return L(`${a} − ${a - d} = ?`, `${a} − ${a - d} = ?`); }
    const a = r(0, d); return L(`${a} + ${d - a} = ?`, `${a} + ${d - a} = ?`);
  }
  if (d === 0) { const a = r(2, 9); return L(`${a} × 0 = ?`, `${a} × 0 = ?`); }
  const b = r(2, 9);
  if (rnd() < 0.5) return L(`${d * b} : ${b} = ?`, `${d * b} ÷ ${b} = ?`);
  const n = r(1, 9) * 100 + r(0, 9) * 10 + d;
  return L(`Chữ số hàng đơn vị của số ${n} là?`, `What is the ones digit of ${n}?`);
}

/** Thêm câu đố cho một vòng tô: bé chọn đúng hình/số là đáp án rồi mới tô. */
export function traceQuiz(shape, grade, seed) {
  const rnd = makeRng(seed);
  let prompt, pool;
  if (/^d\d$/.test(shape)) {
    const d = Number(shape[1]);
    prompt = digitQuestion(d, grade, rnd);
    pool = shuffle(rnd, Array.from({ length: 10 }, (_, i) => `d${i}`).filter((x) => x !== shape)).slice(0, 3);
  } else if (SHAPES[shape]) {
    const qs = SHAPES[shape]; prompt = qs[grade >= 5 && qs.length > 1 ? 1 : 0];
    pool = shuffle(rnd, SHAPE_KEYS.filter((x) => x !== shape && (shape === 'right' || x !== 'right'))).slice(0, 3);
  } else return null;
  const options = shuffle(rnd, [shape, ...pool]);
  return { prompt, options, answer: options.indexOf(shape) };
}
