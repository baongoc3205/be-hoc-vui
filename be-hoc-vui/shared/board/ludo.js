// Cá ngựa: bàn 15×15, đường đua 52 ô, mỗi màu 4 ngựa.
// Luật: gieo được 6 (hoặc 1 nếu bật luật "ra quân 1 hoặc 6") mới ra chuồng; gieo 6 hoặc đá được ngựa
// đối thủ thì được gieo thêm (gieo ba lần 6 liền thì mất lượt); đá ngựa đối thủ về chuồng trừ ô an toàn;
// về đích phải đúng số. Ai đưa đủ 4 ngựa về đích trước là thắng.

/** Toạ độ [hàng, cột] của 52 ô đường đua, bắt đầu từ ô xuất phát của màu Đỏ, đi theo chiều kim đồng hồ. */
export const TRACK = (() => {
  const t = [];
  const seg = (r0, c0, dr, dc, n) => { for (let i = 0; i < n; i++) t.push([r0 + dr * i, c0 + dc * i]); };
  seg(6, 1, 0, 1, 5); seg(5, 6, -1, 0, 6); seg(0, 7, 0, 1, 2);
  seg(1, 8, 1, 0, 5); seg(6, 9, 0, 1, 6); seg(7, 14, 1, 0, 2);
  seg(8, 13, 0, -1, 5); seg(9, 8, 1, 0, 6); seg(14, 7, 0, -1, 2);
  seg(13, 6, -1, 0, 5); seg(8, 5, 0, -1, 6); seg(7, 0, -1, 0, 2);
  return t;
})();
/** 0 đỏ (trên trái), 1 xanh lá (trên phải), 2 vàng (dưới phải), 3 xanh dương (dưới trái). */
export const COLORS = ['red', 'green', 'yellow', 'blue'];
export const START = [0, 13, 26, 39];
export const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
/** Đường về đích của từng màu (5 ô) — pos 51..55; pos 56 = đã về đích. */
export const HOME = [
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
];
export const FINISH = 56;
const LAST_TRACK = 50;

/** Ô tuyệt đối trên đường đua (0..51) của ngựa màu col ở vị trí pos, hoặc null nếu không nằm trên đường đua. */
export const cellOf = (col, pos) => (pos >= 0 && pos <= LAST_TRACK ? (START[col] + pos) % 52 : null);

/** seats: danh sách màu tham gia theo thứ tự lượt chơi (người chơi luôn là seats[0]). */
export function newGame(seats, opts = {}) {
  return { seats, pieces: Object.fromEntries(seats.map((c) => [c, [-1, -1, -1, -1]])), turn: 0, dice: null, sixes: 0, winner: null, exitOn: opts.exitOn ?? [6], moves: 0 };
}
const clone = (s) => ({ ...s, pieces: Object.fromEntries(Object.entries(s.pieces).map(([k, v]) => [k, v.slice()])) });
export const current = (s) => s.seats[s.turn];

/** Các nước đi hợp lệ với số vừa gieo. Mỗi nước: { piece, from, to, captures: [[màu, ngựa]...] } */
export function legalMoves(s) {
  if (s.dice == null || s.winner != null) return [];
  const col = current(s); const d = s.dice; const out = [];
  s.pieces[col].forEach((pos, piece) => {
    let to;
    if (pos === -1) { if (!s.exitOn.includes(d)) return; to = 0; }
    else if (pos === FINISH) return;
    else { to = pos + d; if (to > FINISH) return; }
    const captures = [];
    const cell = cellOf(col, to);
    if (cell != null && !SAFE.has(cell)) {
      for (const other of s.seats) if (other !== col) s.pieces[other].forEach((p, k) => { if (cellOf(other, p) === cell) captures.push([other, k]); });
    }
    out.push({ piece, from: pos, to, captures });
  });
  return out;
}

const passTurn = (s) => { s.turn = (s.turn + 1) % s.seats.length; s.sixes = 0; s.dice = null; };

/** Gieo xúc xắc (value 1..6). Không có nước đi thì tự chuyển lượt. */
export function roll(s0, value) {
  if (s0.dice != null || s0.winner != null) throw new Error('ILLEGAL');
  const s = clone(s0);
  s.dice = value;
  if (value === 6) s.sixes++;
  if (s.sixes >= 3) { passTurn(s); return { s, events: [{ t: 'three6', col: current(s0) }] }; }
  if (!legalMoves(s).length) {
    const again = value === 6;
    if (again) s.dice = null; else passTurn(s);
    return { s, events: [{ t: 'nomove', col: current(s0) }] };
  }
  return { s, events: [] };
}

/** Đi một nước (phải là một trong legalMoves). */
export function move(s0, m) {
  const ok = legalMoves(s0).find((x) => x.piece === m.piece);
  if (!ok) throw new Error('ILLEGAL');
  const s = clone(s0); const col = current(s); const ev = [];
  s.pieces[col][ok.piece] = ok.to; s.moves++;
  for (const [o, k] of ok.captures) { s.pieces[o][k] = -1; ev.push({ t: 'capture', col, victim: o }); }
  if (ok.to === FINISH) ev.push({ t: 'home', col });
  if (s.pieces[col].every((p) => p === FINISH)) { s.winner = col; s.dice = null; ev.push({ t: 'win', col }); return { s, events: ev }; }
  const again = s0.dice === 6 || ok.captures.length > 0;
  if (again) { s.dice = null; ev.push({ t: 'again', col }); } else passTurn(s);
  return { s, events: ev };
}

/** Ô này có bị ngựa đối thủ đứng sau trong vòng 6 ô đe doạ không. */
function danger(s, col, cell) {
  if (cell == null || SAFE.has(cell)) return 0;
  let n = 0;
  for (const o of s.seats) if (o !== col) for (const p of s.pieces[o]) {
    const c = cellOf(o, p); if (c == null) continue;
    const dist = (cell - c + 52) % 52;
    if (dist >= 1 && dist <= 6) n++;
  }
  return n;
}

/** Bot chọn nước. level 'easy' chọn ngẫu nhiên; 'normal' ưu tiên đá ngựa, về đích, ra quân, tránh bị đá. */
export function botChoose(s, level, rnd) {
  const ms = legalMoves(s);
  if (!ms.length) return null;
  if (level === 'easy') return ms[Math.floor(rnd() * ms.length)];
  const col = current(s);
  const score = (m) => {
    let sc = 0;
    if (m.to === FINISH) sc += 50;
    sc += m.captures.length * 40;
    if (m.from === -1) sc += 30;
    if (m.to > LAST_TRACK && m.from <= LAST_TRACK) sc += 25;           // vào đường về đích là an toàn
    const cell = cellOf(col, m.to);
    if (cell != null && SAFE.has(cell)) sc += 10;
    sc -= danger(s, col, cell) * 12;
    sc += danger(s, col, cellOf(col, m.from)) * 8;                      // đang bị đe doạ thì chạy
    sc += m.to / 10;
    return sc + rnd();
  };
  return ms.reduce((a, b) => (score(b) > score(a) ? b : a));
}

// ---------------- Học kết hợp ----------------
/** Màu đang tới lượt còn ngựa trong chuồng không. */
export const hasStable = (s, col = current(s)) => s.pieces[col].some((p) => p === -1);
/** Trả lời đúng câu hỏi khi không gieo được số ra quân: đưa 1 ngựa ra ô xuất phát (có thể đá ngựa đối thủ đang đứng đó), rồi hết lượt. */
export function quizExit(s0) {
  if (s0.winner != null || s0.dice != null || !hasStable(s0)) throw new Error('ILLEGAL');
  const s = clone(s0); const col = current(s); const ev = [];
  const k = s.pieces[col].indexOf(-1);
  s.pieces[col][k] = 0; s.moves++;
  const cell = cellOf(col, 0);
  if (!SAFE.has(cell)) for (const o of s.seats) if (o !== col) s.pieces[o].forEach((p, j) => { if (cellOf(o, p) === cell) { s.pieces[o][j] = -1; ev.push({ t: 'capture', col, victim: o }); } });
  ev.push({ t: 'quizExit', col });
  passTurn(s);
  return { s, events: ev };
}
/** Ô ★ (ô an toàn không phải ô xuất phát): đi vào đây và trả lời đúng thì được gieo thêm. */
export const STAR_CELLS = new Set([...SAFE].filter((c) => !START.includes(c)));
export const onStar = (col, pos) => { const c = cellOf(col, pos); return c != null && STAR_CELLS.has(c); };
/** Cho màu col gieo thêm một lượt (sau khi trả lời đúng ở ô ★). */
export function grantExtra(s0, col) {
  const s = clone(s0);
  if (s.winner != null) return s;
  s.turn = s.seats.indexOf(col); s.dice = null; s.sixes = 0;
  return s;
}
