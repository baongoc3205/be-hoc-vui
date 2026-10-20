// Tạo các vòng chơi cho một màn từ ngân hàng câu hỏi / bộ sinh câu hỏi.
import { makeRng, shuffle, GAME_KIND, GAME_ROUNDS } from '../shared/logic.js';
import { topicById } from './content/index.js';

const keyOf = (item) => JSON.stringify(item.prompt) + JSON.stringify(item.options ?? item.pairs ?? item.items ?? item.answer ?? '');

/** Chọn bộ lọc item phù hợp từng loại game. */
function fits(game, item) {
  const kind = GAME_KIND[game];
  // câu đọc hiểu (có đoạn văn) dùng trong game Đọc hiểu và Đố vui (kèm đoạn văn)
  if (game === 'reading') return item.kind === 'mc' && !!item.passage;
  if (item.passage) return game === 'quiz';
  if (game === 'type-answer') return item.kind === 'input' || item.kind === 'word';
  if (game === 'multi-pick') return item.kind === 'classify';
  if (item.kind === 'input') return false;
  if (game === 'boss') return (item.kind === 'mc' && !item.listen) || item.kind === 'tf';
  if (item.kind !== kind) return false;
  if (game === 'listen-pick') return !!item.listen;
  if (game === 'fill-blank') return !!item.blank;
  if (kind === 'mc' && item.listen) return false;
  // mini game hành động: chữ trên trái cây / kẹo / bia phải ngắn
  if (['fruit-slice', 'candy-match', 'slingshot'].includes(game)) return item.options.every((o) => (typeof o === 'string' ? o : o.vi).length <= 26);
  return true;
}

const T = (x) => (typeof x === 'string' ? { vi: x, en: x } : x);
const NUMERIC = /^-?[\d.,/]+$/;
const UNIT = /^(-?[\d.,]+(?:\/\d+)?)\s?(cm|cm²|cm³|dm|dm²|m|m²|m³|km|km²|kg|g|l|ml|giờ|phút|giây|km\/giờ|°|°C|%)$/;

/** Đổi câu trắc nghiệm Toán (đáp án là số) thành câu tự điền. Trả về null nếu đề cần nhìn các lựa chọn mới làm được. */
export function mcToInput(it) {
  if (!it || it.kind !== 'mc' || it.listen || it.passage) return null;
  const right = T(it.options[0]);
  const vi = it.prompt.vi;
  if (/\bnào\b/.test(vi) && !/là số nào\?$/.test(vi) && !/ hay /.test(vi)) return null;
  let answer = right.vi.replace(/−/g, '-'), unit = null;
  const m = answer.match(UNIT);
  if (m) { answer = m[1]; unit = m[2]; }
  if (!NUMERIC.test(answer)) return null;
  const unitEn = unit && T(right).en.match(UNIT)?.[2];
  return { kind: 'input', prompt: it.prompt, title: it.title ?? null, answer, unit: unit ? { vi: unit, en: unitEn ?? unit } : null };
}

/** "Hứng các số CHẴN!" → "Chọn TẤT CẢ các số CHẴN". */
function multiPrompt(p) {
  const vi = T(p).vi.replace(/^Hứng\s+/i, 'Chọn TẤT CẢ ').replace(/!$/, '');
  const en = T(p).en.replace(/^Catch\s+(the\s+)?/i, 'Pick ALL the ').replace(/!$/, '');
  return { vi, en };
}

/** Một vòng "chọn nhiều đáp án" từ câu hứng đồ: lấy 2–3 mục đúng và vài mục sai. */
function multiFromClassify(rnd, item, idx) {
  const ok = shuffle(rnd, item.items.filter((x) => x.ok)), no = shuffle(rnd, item.items.filter((x) => !x.ok));
  const long = item.items.some((x) => T(x.t).vi.length > 16);
  const total = long ? 5 : 6;
  const k = Math.min(ok.length, total - 2, 2 + Math.floor(rnd() * 2));
  const picked = shuffle(rnd, [...ok.slice(0, k), ...no.slice(0, total - k)]);
  return { id: `r${idx}`, kind: 'multi', prompt: multiPrompt(item.prompt), title: null, options: picked.map((x) => T(x.t)), answer: picked.map((x, i) => (x.ok ? i : -1)).filter((i) => i >= 0) };
}

/** Một vòng "chọn tất cả các câu đúng" từ 4 nhận định đúng/sai (có ít nhất 1 đúng và 1 sai). */
function multiFromTf(rnd, tfs, idx) {
  const yes = shuffle(rnd, tfs.filter((x) => x.answer)), no = shuffle(rnd, tfs.filter((x) => !x.answer));
  if (!yes.length || !no.length) return null;
  const k = Math.min(yes.length, 4 - Math.min(no.length, 3), 1 + Math.floor(rnd() * 2));
  const picked = shuffle(rnd, [...yes.slice(0, k), ...no.slice(0, 4 - k)]);
  return { id: `r${idx}`, kind: 'multi', prompt: { vi: 'Chọn TẤT CẢ các câu ĐÚNG', en: 'Pick ALL the TRUE statements' }, title: null, options: picked.map((x) => T(x.prompt)), answer: picked.map((x, i) => (x.answer ? i : -1)).filter((i) => i >= 0) };
}

function toRound(rnd, item, idx, game) {
  const base = { id: `r${idx}`, kind: item.kind, prompt: item.prompt, title: item.title ?? null };
  switch (item.kind) {
    case 'mc': {
      const order = shuffle(rnd, item.options.map((_, i) => i));
      const options = order.map((i) => T(item.options[i]));
      return { ...base, options, answer: order.indexOf(0), say: item.say ?? null, blank: !!item.blank, passage: item.passage ?? null };
    }
    case 'input': {
      const answer = String(item.answer);
      return { ...base, answer, accept: (item.accept ?? []).map(String), unit: item.unit ? T(item.unit) : null, numeric: NUMERIC.test(answer) };
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
      if (game === 'type-answer') {
        const prompt = { vi: T(item.prompt).vi.replace(/^Ghép từ/, 'Viết từ'), en: T(item.prompt).en.replace(/^Spell/, 'Type the word') };
        return { ...base, kind: 'input', prompt, answer: item.answer, accept: [], unit: null, numeric: false };
      }
      const letters = Array.from(item.answer.normalize('NFC'));
      return { ...base, answer: item.answer, tiles: shuffle(rnd, letters.map((ch, i) => ({ id: `t${i}`, ch }))) };
    }
    case 'clock':
      return { ...base, h: item.h, m: item.m };
    case 'classify':
      return { ...base, items: shuffle(rnd, item.items) };
    case 'trace':
      return { ...base, shape: item.shape };
    default:
      return base;
  }
}

export { fits };

/** Trả về { game, rounds } — game có thể bị đổi sang 'quiz' nếu chủ đề thiếu dạng câu. */
export function buildRounds(lesson, seed) {
  const topic = topicById.get(lesson.topicId);
  const rnd = makeRng(seed);
  let game = lesson.game;
  const want = GAME_ROUNDS[game] ?? 6;
  let items = [];

  if (game === 'multi-pick') return { game, rounds: buildMulti(topic, rnd, want) };
  if (game === 'reading' && topic.items) {
    // đọc hiểu: lấy trọn từng đoạn văn với các câu hỏi của nó
    const groups = new Map();
    for (const it of topic.items.filter((x) => fits('reading', x))) { const k = JSON.stringify(it.passage); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); }
    for (const g of shuffle(rnd, [...groups.values()])) { if (items.length >= want) break; items.push(...g.slice(0, want - items.length)); }
    if (items.length) return { game, rounds: items.map((it, i) => toRound(rnd, it, i, game)) };
    game = 'quiz';
  }

  if (topic.gen) {
    const seen = new Set();
    const kinds = game === 'boss' ? ['mc', 'mc', 'tf'] : game === 'type-answer' ? ['mc'] : [GAME_KIND[game]];
    for (let tries = 0; items.length < want && tries < want * 25; tries++) {
      let it = topic.gen(rnd, kinds[tries % kinds.length]);
      if (game === 'type-answer') it = mcToInput(it);
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

/** Game "Chọn nhiều đáp án": xen kẽ vòng từ câu hứng đồ và vòng "chọn các câu đúng". */
function buildMulti(topic, rnd, want) {
  let cls = [], tfs = [];
  if (topic.gen) {
    const seen = new Set();
    for (let i = 0; i < 12; i++) { const it = topic.gen(rnd, 'classify'); if (it) { cls.push(it); break; } }
    for (let i = 0; i < 80 && tfs.length < want * 5; i++) { const it = topic.gen(rnd, 'tf'); if (it && !seen.has(keyOf(it))) { seen.add(keyOf(it)); tfs.push(it); } }
  } else {
    cls = shuffle(rnd, topic.items.filter((x) => x.kind === 'classify'));
    tfs = topic.items.filter((x) => x.kind === 'tf');
  }
  const rounds = [];
  for (let r = 0; rounds.length < want && r < want * 3; r++) {
    const useCls = cls.length && (r % 2 === 0 || tfs.length < 4);
    const round = useCls ? multiFromClassify(rnd, cls[r % cls.length], rounds.length) : multiFromTf(rnd, tfs, rounds.length);
    if (round) rounds.push(round);
  }
  return rounds;
}
