// Bộ máy sinh đề theo mẫu: một "khái niệm" (concept) là một bảng dữ liệu + các mẫu câu hỏi.
// Cùng một mẫu đề được lặp lại ở nhiều màn với đối tượng khác nhau (con vật, đồ vật, từ vựng…),
// số lượng khác nhau (3 hay 4 lựa chọn, 3–5 cặp, 4–7 mục hứng) và bậc khó khác nhau (ctx.tier = 1..4).
//
// gen(rnd, kind, ctx) trả về một câu hỏi đúng định dạng bank.js (đáp án đúng luôn ở vị trí 0) hoặc null.
//
// Khái niệm dạng "đối chiếu" (match):
//   items: [{ t: thuật ngữ, a: đáp án | khoá nhóm, emoji?, say?, spell? }]
//   cats:  { khoá: { label, which, catch, stmt(t) } }   → nếu có: đáp án là NHÓM (lặp lại giữa các mục)
//   q: { fwd(it), back(it), tf(it, aLabel), pairs, input(it), word(it), blank(it), say: 'en'|'vi', order }
// Khái niệm tự viết (custom): { gen(rnd, kind, ctx) }.
import { shuffle } from '../../../shared/logic.js';

/** L('vi', 'en') hoặc L('vi|en') hoặc L({vi, en}). */
export const L = (vi, en) => {
  if (typeof vi === 'object' && vi) return vi;
  const s = String(vi);
  if (en === undefined && s.includes('|')) { const [a, b] = s.split('|'); return { vi: a, en: b }; }
  return { vi: s, en: String(en ?? s) };
};
const L1 = (x) => L(x);
const key = (x) => L(x).vi.trim();
const pick = (rnd, a) => a[Math.floor(rnd() * a.length)];
export const sample = (rnd, a, n) => shuffle(rnd, a).slice(0, n);
export const tierOf = (ctx) => Math.max(1, Math.min(4, Number(ctx?.tier) || 1));
export const optCount = (ctx) => (tierOf(ctx) <= 1 ? 3 : 4);

/** Trắc nghiệm: đúng ở vị trí 0, nhiễu không trùng chữ. */
export function mc(prompt, right, wrongs, n = 4, extra = {}) {
  const seen = new Set([key(right)]);
  const opts = [L(right)];
  for (const w of wrongs) { if (opts.length >= n) break; const k = key(w); if (!k || seen.has(k)) continue; seen.add(k); opts.push(L(w)); }
  if (opts.length < 2) return null;
  return { kind: 'mc', prompt: L(prompt), options: opts, ...extra };
}
export const tf = (prompt, answer) => ({ kind: 'tf', prompt: L(prompt), answer: !!answer });
export const input = (prompt, answer, accept = [], unit = null) => ({ kind: 'input', prompt: L(prompt), answer: String(answer), accept: accept.map(String), ...(unit ? { unit: L(unit) } : {}) });

const WORD_OK = /^\p{L}{2,9}$/u;

export function makeGen(c) {
  if (c.gen) return c.gen;
  const items = c.items.map((it) => ({ ...it, t: L(it.t) }));
  const cats = c.cats ?? null;
  const ans = (it) => (cats ? cats[it.a].label : L(it.a));
  const q = c.q ?? {};
  const byCat = cats ? Object.keys(cats).map((k) => [k, items.filter((it) => it.a === k)]).filter(([, a]) => a.length) : [];

  function mcFwd(rnd, ctx) {
    if (!q.fwd) return null;
    const it = pick(rnd, items);
    const others = cats ? Object.keys(cats).filter((k) => k !== it.a).map((k) => cats[k].label) : items.filter((x) => key(ans(x)) !== key(ans(it))).map(ans);
    return mc(q.fwd(it), ans(it), shuffle(rnd, others), cats ? Math.min(optCount(ctx), Object.keys(cats).length) : optCount(ctx), q.title ? { title: q.title } : {});
  }
  function mcBack(rnd, ctx) {
    if (cats) {
      const [k, members] = pick(rnd, byCat);
      const rest = items.filter((x) => x.a !== k);
      if (!rest.length) return null;
      return mc(cats[k].which, pick(rnd, members).t, shuffle(rnd, rest).map((x) => x.t), optCount(ctx));
    }
    if (!q.back) return null;
    const it = pick(rnd, items);
    return mc(q.back(it, rnd), it.t, shuffle(rnd, items.filter((x) => key(x.t) !== key(it.t) && key(ans(x)) !== key(ans(it)))).map((x) => x.t), optCount(ctx));
  }
  function mcItem(rnd, ctx) {
    // ưu tiên dạng hỏi ngược khi có nhóm (Con vật nào…?), xen dạng hỏi xuôi
    const a = rnd() < 0.5 ? mcFwd(rnd, ctx) : mcBack(rnd, ctx);
    return a ?? mcFwd(rnd, ctx) ?? mcBack(rnd, ctx);
  }
  function tfItem(rnd) {
    const it = pick(rnd, items);
    const truth = rnd() < 0.5;
    if (cats) {
      const k = truth ? it.a : pick(rnd, Object.keys(cats).filter((x) => x !== it.a));
      return k ? tf(cats[k].stmt(it.t), k === it.a) : null;
    }
    if (!q.tf) return null;
    const other = pick(rnd, items.filter((x) => key(ans(x)) !== key(ans(it))));
    return tf(q.tf(it, truth || !other ? ans(it) : ans(other)), truth || !other);
  }
  function pairsItem(rnd, ctx) {
    if (!q.pairs) return null;
    const n = 3 + Math.min(2, tierOf(ctx));
    const used = new Set(), usedT = new Set(), out = [];
    for (const it of shuffle(rnd, items)) {
      const a = key(ans(it)), t = key(it.t);
      if (used.has(a) || usedT.has(t)) continue;
      used.add(a); usedT.add(t); out.push([it.t, ans(it)]);
      if (out.length >= n) break;
    }
    return out.length >= 3 ? { kind: 'pairs', prompt: L(q.pairs), pairs: out } : null;
  }
  function classifyItem(rnd, ctx) {
    if (!cats) return null;
    const groups = byCat.filter(([, m]) => m.length >= 3 && items.length - m.length >= 3);
    if (!groups.length) return null;
    const [k, members] = pick(rnd, groups);
    const nOk = 3 + Math.min(3, tierOf(ctx)), nBad = 4 + Math.min(3, tierOf(ctx));
    const ok = sample(rnd, members, nOk), okK = new Set(ok.map((x) => key(x.t)));
    const bad = sample(rnd, items.filter((x) => x.a !== k && !okK.has(key(x.t))), nBad);
    const seen = new Set();
    const list = [...ok.map((x) => ({ t: x.t, ok: true })), ...bad.map((x) => ({ t: x.t, ok: false }))].filter((x) => !seen.has(key(x.t)) && seen.add(key(x.t)));
    return { kind: 'classify', prompt: L(cats[k].catch), items: list };
  }
  function orderItem(rnd, ctx) {
    if (!q.order) return null;
    const { prompt, list } = typeof q.order === 'function' ? q.order(rnd, ctx) : q.order;
    if (!list || list.length < 3) return null;
    const n = Math.min(list.length, 3 + Math.min(2, tierOf(ctx)));
    const start = Math.floor(rnd() * (list.length - n + 1));
    return { kind: 'order', prompt: L(prompt), items: list.slice(start, start + n).map(L1) };
  }
  function listenItem(rnd, ctx) {
    if (!q.say) return null;
    const it = pick(rnd, items.filter((x) => (x.say ?? key(x.t)).length <= 24));
    if (!it) return null;
    const text = it.say ?? L(it.t)[q.say === 'en' ? 'en' : 'vi'];
    const pool = c.sayAlt ? c.sayAlt(it, rnd) : shuffle(rnd, items.filter((x) => key(x.t) !== key(it.t))).map((x) => x.t);
    return mc('Nghe và chọn đáp án đúng|Listen and choose', it.t, pool, optCount(ctx), { listen: true, say: { text, lang: q.say } });
  }
  function wordItem(rnd) {
    if (!q.word) return null;
    const cands = items.map((it) => ({ it, w: q.word(it) })).filter((x) => x.w && WORD_OK.test(x.w.answer.normalize('NFC')));
    if (!cands.length) return null;
    const { w } = pick(rnd, cands);
    return { kind: 'word', prompt: L(w.prompt), answer: w.answer.normalize('NFC') };
  }
  function inputItem(rnd) {
    if (!q.input) return null;
    const cands = items.map((it) => q.input(it)).filter(Boolean);
    if (!cands.length) return null;
    const x = pick(rnd, cands);
    return input(x.prompt, x.answer, x.accept ?? [], x.unit);
  }
  function blankItem(rnd, ctx) {
    if (!q.blank) return null;
    const it = pick(rnd, items);
    const b = q.blank(it, rnd);
    if (!b) return null;
    const wr = b.wrong ?? shuffle(rnd, items.filter((x) => key(ans(x)) !== key(ans(it)))).map(ans);
    return mc(b.prompt, b.answer ?? ans(it), wr, optCount(ctx), { blank: true });
  }

  return function gen(rnd, kind, ctx = {}) {
    const game = ctx.game;
    switch (kind) {
      case 'mc':
        if (game === 'listen-pick') return listenItem(rnd, ctx);
        if (game === 'fill-blank') return blankItem(rnd, ctx);
        // mini game hành động / đua xe: xen câu điền chỗ trống nếu có
        if (q.blank && rnd() < 0.25) return blankItem(rnd, ctx) ?? mcItem(rnd, ctx);
        return mcItem(rnd, ctx);
      case 'tf': return tfItem(rnd);
      case 'pairs': return pairsItem(rnd, ctx);
      case 'classify': return q.classify ? q.classify(rnd, ctx) : classifyItem(rnd, ctx);
      case 'order': return orderItem(rnd, ctx);
      case 'word': return wordItem(rnd);
      case 'input': return inputItem(rnd) ?? (rnd() < 0.5 ? wordAsInput(wordItem(rnd)) : null);
      default: return null;
    }
  };
}

function wordAsInput(w) {
  if (!w) return null;
  return input({ vi: w.prompt.vi.replace(/^Ghép từ/, 'Viết từ'), en: w.prompt.en.replace(/^Spell/, 'Type the word') }, w.answer);
}

/** Trộn nhiều khái niệm: mỗi câu lấy từ một khái niệm ngẫu nhiên hỗ trợ dạng đó. */
export function mixGen(gens) {
  return (rnd, kind, ctx) => {
    const start = Math.floor(rnd() * gens.length);
    for (let i = 0; i < gens.length; i++) { const it = gens[(start + i) % gens.length](rnd, kind, ctx); if (it) return it; }
    return null;
  };
}
