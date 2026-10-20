// Dựng các CHẶNG LUYỆN TẬP cho từng môn, từng lớp từ các khái niệm sinh đề theo mẫu.
// Mỗi lớp, mỗi môn:  chặng cơ bản (bậc 1–2) cho từng khái niệm → Ôn tập 1 → chặng nâng cao (bậc 3–4) → Ôn tập 2.
// Mỗi chặng 9 màn (8 màn + 1 màn trùm), game được chọn tự động trong số game mà khái niệm hỗ trợ,
// xoay vòng để các chặng liền nhau không giống nhau.
import { makeRng } from '../../../shared/logic.js';
import { fits, mcToInput } from '../../fits.js';
import { L, makeGen, mixGen } from './engine.js';
import { EN_CONCEPTS } from './en.js';
import { VI_CONCEPTS } from './vi.js';
import { SCI_CONCEPTS } from './sci.js';
import { MATH_CONCEPTS } from './math.js';

const SUBJECTS = { math: ['m', MATH_CONCEPTS], vietnamese: ['v', VI_CONCEPTS], english: ['e', EN_CONCEPTS], science: ['s', SCI_CONCEPTS] };
const POOL = {
  math: ['quiz', 'math-race', 'type-answer', 'true-false', 'balloon-pop', 'drag-match', 'multi-pick', 'fruit-slice', 'catch-fall', 'slingshot', 'memory', 'candy-match', 'sort-order'],
  other: ['quiz', 'true-false', 'type-answer', 'drag-match', 'listen-pick', 'fill-blank', 'catch-fall', 'word-builder', 'multi-pick', 'memory', 'sort-order', 'fruit-slice', 'candy-match', 'slingshot', 'balloon-pop'],
};
const KIND = { quiz: 'mc', 'math-race': 'mc', 'balloon-pop': 'mc', 'fruit-slice': 'mc', 'candy-match': 'mc', slingshot: 'mc', 'listen-pick': 'mc', 'fill-blank': 'mc', 'true-false': 'tf', 'drag-match': 'pairs', memory: 'pairs', 'catch-fall': 'classify', 'sort-order': 'order', 'word-builder': 'word' };
const PER_CHAPTER = 8;

/** Game này có đủ câu hỏi từ bộ sinh đề không (ít nhất 3 câu khác nhau). */
function supports(gen, game, grade) {
  const rnd = makeRng(4242 + game.length * 31 + grade);
  const seen = new Set();
  const ctx = { tier: 2, game, grade };
  for (let i = 0; i < 30 && seen.size < 3; i++) {
    let it;
    if (game === 'type-answer') it = gen(rnd, 'input', ctx) ?? mcToInput(gen(rnd, 'mc', ctx));
    else if (game === 'multi-pick') it = gen(rnd, 'classify', ctx) ?? gen(rnd, 'tf', ctx);
    else it = gen(rnd, KIND[game], ctx);
    if (!it) continue;
    if (game === 'multi-pick' ? !['classify', 'tf'].includes(it.kind) : !fits(game, it)) continue;
    seen.add(JSON.stringify(it));
  }
  return seen.size >= 3;
}

function chapter(subject, grade, id, title, gen, tiers, idx) {
  const pool = POOL[subject === 'math' ? 'math' : 'other'].filter((g) => supports(gen, g, grade));
  const rot = pool.length ? idx % pool.length : 0;
  const order = [...pool.slice(rot), ...pool.slice(0, rot)];
  const games = [];
  for (let i = 0; games.length < PER_CHAPTER && order.length; i++) games.push(order[i % order.length]);
  // không để hai màn liền nhau cùng một game nếu tránh được
  for (let i = 1; i < games.length; i++) if (games[i] === games[i - 1]) { const j = games.findIndex((g, k) => k > i && g !== games[i]); if (j > 0) [games[i], games[j]] = [games[j], games[i]]; }
  games.push('boss');
  return {
    id, subject, grade, title, practice: true,
    games, tiers: [...tiers.slice(0, PER_CHAPTER), tiers[tiers.length - 1]],
    gen: (rnd, kind, ctx = {}) => gen(rnd, kind, { ...ctx, grade }),
  };
}

export function buildPracticeTopics() {
  const out = [];
  for (const [subject, [p, byGrade]] of Object.entries(SUBJECTS)) {
    for (let grade = 1; grade <= 9; grade++) {
      const concepts = byGrade[grade] ?? [];
      const gens = concepts.map((c) => makeGen(c));
      let idx = 0;
      const t12 = [1, 1, 1, 1, 2, 2, 2, 2, 2], t34 = [3, 3, 3, 3, 4, 4, 4, 4, 4];
      concepts.forEach((c, i) => out.push(chapter(subject, grade, `${p}${grade}p-${c.id}`, L(`Luyện tập: ${c.title.vi}`, `Practice: ${c.title.en}`), gens[i], t12, idx++)));
      out.push(chapter(subject, grade, `${p}${grade}p-on1`, L('Ôn tập tổng hợp 1', 'Mixed review 1'), mixGen(gens), [2, 2, 2, 2, 2, 3, 3, 3, 3], idx++));
      concepts.forEach((c, i) => out.push(chapter(subject, grade, `${p}${grade}p-${c.id}-2`, L(`Nâng cao: ${c.title.vi}`, `Challenge: ${c.title.en}`), gens[i], t34, idx++)));
      out.push(chapter(subject, grade, `${p}${grade}p-on2`, L('Ôn tập tổng hợp 2', 'Mixed review 2'), mixGen(gens), [4, 4, 4, 4, 4, 4, 4, 4, 4], idx++));
    }
  }
  return out;
}
