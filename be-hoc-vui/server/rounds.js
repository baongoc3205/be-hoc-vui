// Tạo các vòng chơi cho một màn từ ngân hàng câu hỏi / bộ sinh câu hỏi.
import { makeRng, shuffle, GAME_KIND, GAME_ROUNDS } from '../shared/logic.js';
import { topicById } from './content/index.js';

const keyOf = (item) => JSON.stringify(item.prompt) + JSON.stringify(item.options ?? item.pairs ?? item.items ?? item.answer ?? '');

/** Chọn bộ lọc item phù hợp từng loại game. */
function fits(game, item) {
  const kind = GAME_KIND[game];
  if (game === 'boss') return (item.kind === 'mc' && !item.listen) || item.kind === 'tf';
  if (item.kind !== kind) return false;
  if (game === 'listen-pick') return !!item.listen;
  if (game === 'fill-blank') return !!item.blank;
  if (kind === 'mc') return !item.listen;
  return true;
}

const T = (x) => (typeof x === 'string' ? { vi: x, en: x } : x);

function toRound(rnd, item, idx, game) {
  const base = { id: `r${idx}`, kind: item.kind, prompt: item.prompt, title: item.title ?? null };
  switch (item.kind) {
    case 'mc': {
      const order = shuffle(rnd, item.options.map((_, i) => i));
      const options = order.map((i) => T(item.options[i]));
      return { ...base, options, answer: order.indexOf(0), say: item.say ?? null, blank: !!item.blank };
    }
    case 'tf':
      return { ...base, answer: item.answer };
    case 'pairs': {
      const max = game === 'memory' ? 6 : 5;
      return { ...base, pairs: shuffle(rnd, item.pairs).slice(0, max), memory: game === 'memory' };
    }
    case 'order':
      return { ...base, items: item.items.map(T) };
    case 'word': {
      const letters = Array.from(item.answer.normalize('NFC'));
      return { ...base, answer: item.answer, tiles: shuffle(rnd, letters.map((ch, i) => ({ id: `t${i}`, ch }))) };
    }
    case 'clock':
      return { ...base, h: item.h, m: item.m };
    case 'classify':
      return { ...base, items: shuffle(rnd, item.items) };
    default:
      return base;
  }
}

/** Trả về { game, rounds } — game có thể bị đổi sang 'quiz' nếu chủ đề thiếu dạng câu. */
export function buildRounds(lesson, seed) {
  const topic = topicById.get(lesson.topicId);
  const rnd = makeRng(seed);
  let game = lesson.game;
  const want = GAME_ROUNDS[game] ?? 6;
  let items = [];

  if (topic.gen) {
    const seen = new Set();
    const kinds = game === 'boss' ? ['mc', 'mc', 'tf'] : [GAME_KIND[game]];
    for (let tries = 0; items.length < want && tries < want * 25; tries++) {
      const it = topic.gen(rnd, kinds[tries % kinds.length]);
      if (!it) continue;
      const k = keyOf(it);
      if (seen.has(k) && tries < want * 20) continue;
      seen.add(k);
      items.push(it);
    }
  } else {
    let pool = topic.items.filter((it) => fits(game, it));
    if (pool.length === 0) { game = 'quiz'; pool = topic.items.filter((it) => fits('quiz', it)); }
    pool = shuffle(rnd, pool);
    items = pool.slice(0, Math.min(want, pool.length));
    // Game một-vòng (lật thẻ, hứng đồ) hoặc 2 vòng (nối cặp): lặp lại nếu thiếu.
    while (items.length < Math.min(want, 2) && pool.length) items.push(pool[items.length % pool.length]);
  }
  return { game, rounds: items.map((it, i) => toRound(rnd, it, i, game)) };
}
