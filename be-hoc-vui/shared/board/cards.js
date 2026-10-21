// Bài Màu Sắc — luật giống trò bài đổi màu quen thuộc (kiểu UNO): ra lá cùng màu hoặc cùng số/ký hiệu,
// lá Đổi màu và +4 ra lúc nào cũng được (+4 chỉ khi không còn lá nào cùng màu đang đánh).
// Hết bài trước là thắng. Còn 1 lá phải bấm "Một lá!", quên thì bốc phạt 2 lá.
// Tất cả hàm đều thuần (không sửa state cũ, trả về state mới) để dễ kiểm thử và để bot dùng chung.

export const COLORS = ['red', 'yellow', 'green', 'blue'];
const ACTIONS = ['skip', 'rev', '+2'];

function shuffle(rnd, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

/** Bộ 108 lá. Mỗi lá: { id, c: màu | null (lá đen), v: '0'..'9' | 'skip' | 'rev' | '+2' | 'wild' | '+4' } */
export function makeDeck() {
  const d = []; let id = 0;
  for (const c of COLORS) {
    d.push({ id: id++, c, v: '0' });
    for (let k = 0; k < 2; k++) {
      for (let n = 1; n <= 9; n++) d.push({ id: id++, c, v: String(n) });
      for (const v of ACTIONS) d.push({ id: id++, c, v });
    }
  }
  for (let k = 0; k < 4; k++) { d.push({ id: id++, c: null, v: 'wild' }); d.push({ id: id++, c: null, v: '+4' }); }
  return d;
}

const clone = (s) => ({ ...s, deck: s.deck.slice(), discard: s.discard.slice(), hands: s.hands.map((h) => h.slice()), log: s.log.slice(-30) });
export const top = (s) => s.discard[s.discard.length - 1];
export const nextSeat = (s, from = s.turn, steps = 1) => (((from + s.dir * steps) % s.n) + s.n) % s.n;

/** Rút một lá; hết nọc thì xào lại chồng bài đã đánh (trừ lá trên cùng). */
function take(s, rnd) {
  if (!s.deck.length) {
    const t = s.discard.pop();
    s.deck = shuffle(rnd, s.discard);
    s.discard = [t];
  }
  return s.deck.pop() ?? null;
}
function give(s, p, k, rnd) { let got = 0; for (let i = 0; i < k; i++) { const c = take(s, rnd); if (!c) break; s.hands[p].push(c); got++; } return got; }

export function newGame(n, rnd, handSize = 7) {
  const s = { n, deck: shuffle(rnd, makeDeck()), discard: [], hands: Array.from({ length: n }, () => []), turn: 0, dir: 1, color: null, drew: null, winner: null, log: [], moves: 0 };
  for (let r = 0; r < handSize; r++) for (let p = 0; p < n; p++) s.hands[p].push(s.deck.pop());
  // lá mở đầu phải là lá số
  let first = s.deck.pop();
  while (!/^\d$/.test(first.v)) { s.deck.unshift(first); first = s.deck.pop(); }
  s.discard.push(first); s.color = first.c;
  return s;
}

/** Lá này có ra được không (đúng luật). */
export function canPlay(s, p, card) {
  const t = top(s);
  if (card.v === '+4') return !s.hands[p].some((c) => c.c === s.color);
  if (card.c === null) return true;
  return card.c === s.color || card.v === t.v;
}
/** Chỉ số các lá người chơi p ra được. Vừa bốc thì chỉ được ra đúng lá vừa bốc. */
export function playable(s, p) {
  if (s.winner !== null || p !== s.turn) return [];
  const h = s.hands[p];
  if (s.drew !== null) { const i = h.findIndex((c) => c.id === s.drew); return i >= 0 && canPlay(s, p, h[i]) ? [i] : []; }
  return h.map((c, i) => (canPlay(s, p, c) ? i : -1)).filter((i) => i >= 0);
}

/** Đánh lá thứ idx. color: màu chọn cho lá đen. called: đã bấm "Một lá!" chưa. Trả về { s, events }. */
export function play(s0, p, idx, color, called, rnd) {
  if (!playable(s0, p).includes(idx)) throw new Error('ILLEGAL');
  const s = clone(s0); const ev = [];
  const card = s.hands[p].splice(idx, 1)[0];
  s.discard.push(card); s.color = card.c ?? (COLORS.includes(color) ? color : COLORS[0]); s.drew = null; s.moves++;
  ev.push({ t: 'play', p, card, color: s.color });
  if (s.hands[p].length === 0) { s.winner = p; ev.push({ t: 'win', p }); return { s, events: ev }; }
  if (s.hands[p].length === 1) {
    if (called) ev.push({ t: 'uno', p });
    else { give(s, p, 2, rnd); ev.push({ t: 'forgot', p }); }
  }
  let skip = 0;
  if (card.v === 'rev') { if (s.n === 2) skip = 1; else s.dir = -s.dir; ev.push({ t: 'rev', p }); }
  if (card.v === 'skip') { skip = 1; ev.push({ t: 'skip', p: nextSeat(s) }); }
  if (card.v === '+2' || card.v === '+4') {
    const victim = nextSeat(s); const k = card.v === '+2' ? 2 : 4;
    give(s, victim, k, rnd); skip = 1; ev.push({ t: 'draw', p: victim, k });
  }
  s.turn = nextSeat(s, s.turn, 1 + skip);
  return { s, events: ev };
}

/** Bốc 1 lá. Nếu ra được thì người chơi được chọn đánh luôn hoặc bỏ lượt. */
export function draw(s0, p, rnd) {
  if (p !== s0.turn || s0.drew !== null || s0.winner !== null) throw new Error('ILLEGAL');
  const s = clone(s0);
  const got = give(s, p, 1, rnd);
  const card = got ? s.hands[p][s.hands[p].length - 1] : null;
  s.moves++;
  if (card && canPlay(s, p, card)) { s.drew = card.id; return { s, events: [{ t: 'drew', p }] }; }
  s.drew = null; s.turn = nextSeat(s);
  return { s, events: [{ t: 'drew', p }, { t: 'pass', p }] };
}
/** Bỏ lượt sau khi đã bốc. */
export function pass(s0, p) {
  if (p !== s0.turn || s0.drew === null) throw new Error('ILLEGAL');
  const s = clone(s0); s.drew = null; s.turn = nextSeat(s);
  return { s, events: [{ t: 'pass', p }] };
}

/** Màu nhiều nhất trong tay (để bot chọn màu cho lá đen). */
export function bestColor(hand, rnd) {
  const cnt = Object.fromEntries(COLORS.map((c) => [c, 0]));
  for (const c of hand) if (c.c) cnt[c.c]++;
  const max = Math.max(...Object.values(cnt));
  const best = COLORS.filter((c) => cnt[c] === max);
  return best[Math.floor(rnd() * best.length)];
}

/**
 * Bot chọn nước đi. level: 'easy' | 'normal'.
 * Trả về { type: 'play', idx, color, called } | { type: 'draw' } | { type: 'pass' }.
 */
export function botMove(s, p, level, rnd) {
  const opts = playable(s, p);
  if (!opts.length) return s.drew !== null ? { type: 'pass' } : { type: 'draw' };
  const hand = s.hands[p];
  let idx;
  if (level === 'easy') idx = opts[Math.floor(rnd() * opts.length)];
  else {
    const nextCount = s.hands[nextSeat(s)].length;
    const colorCount = (c) => hand.filter((x) => x.c === c).length;
    const score = (i) => {
      const c = hand[i]; let sc = 0;
      if (c.c === null) sc -= c.v === '+4' ? 8 : 6;               // giữ lá đen để cứu nguy
      if (['+2', 'skip', 'rev', '+4'].includes(c.v)) sc += nextCount <= 2 ? 10 : 1; // chặn người sắp thắng
      if (c.c) sc += colorCount(c.c) * 1.5;                        // giữ được màu mình nhiều
      if (/^\d$/.test(c.v)) sc += Number(c.v) / 10;                // bỏ lá số lớn trước
      return sc + rnd() * 0.5;
    };
    idx = opts.reduce((a, b) => (score(b) > score(a) ? b : a));
  }
  const rest = hand.filter((_, i) => i !== idx);
  const color = hand[idx].c === null ? bestColor(rest, rnd) : null;
  const called = hand.length === 2 ? (level === 'easy' ? rnd() > 0.25 : rnd() > 0.05) : false;
  return { type: 'play', idx, color, called };
}

/** Trả lại nọc k lá người chơi p vừa phải bốc (bé/bot trả lời đúng câu hỏi để "chặn" lá +2/+4). */
export function returnCards(s0, p, k) {
  const s = clone(s0);
  const back = s.hands[p].splice(Math.max(0, s.hands[p].length - k), k);
  s.deck.push(...back.reverse());
  return s;
}
