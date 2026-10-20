// Logic dùng chung cho server và client (ESM thuần, không phụ thuộc gói ngoài).
// Mọi hàm ở đây là hàm thuần → dễ test, server và client cho ra cùng kết quả.

/** RNG có seed (mulberry32) để tái hiện ván chơi. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rnd() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const randInt = (rnd, min, max) => min + Math.floor(rnd() * (max - min + 1));
export const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
export function shuffle(rnd, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Chuẩn hoá chuỗi để so sánh (tiếng Việt: NFC, bỏ khoảng trắng thừa, không phân biệt hoa thường). */
export function norm(s) {
  return String(s ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
}

/**
 * Chấm một vòng chơi. Trả về chất lượng q ∈ [0, 1].
 * Các dạng vòng (round.kind):
 *  - mc:       given = chỉ số đáp án
 *  - tf:       given = true/false
 *  - pairs:    given = số lần ghép sai
 *  - order:    given = mảng chỉ số gốc theo thứ tự người chơi xếp
 *  - word:     given = chuỗi từ ghép được
 *  - clock:    given = [giờ, phút]
 *  - classify: given = { hits, wrong }
 */
export function gradeRound(round, given) {
  switch (round.kind) {
    case 'mc':
      return Number(given) === round.answer ? 1 : 0;
    case 'tf':
      return Boolean(given) === round.answer ? 1 : 0;
    case 'pairs': {
      const n = round.pairs.length;
      // Lật thẻ: được phép lật sai n lần (vì phải lật để nhớ) mà không bị trừ.
      const mistakes = Math.max(0, Math.floor(Number(given) || 0) - (round.memory ? n : 0));
      return Math.max(0, 1 - mistakes / (n + 1));
    }
    case 'order': {
      if (!Array.isArray(given) || given.length !== round.items.length) return 0;
      return given.every((v, i) => Number(v) === i) ? 1 : 0;
    }
    case 'word':
      return norm(given) === norm(round.answer) ? 1 : 0;
    case 'clock': {
      if (!Array.isArray(given)) return 0;
      const [h, m] = given.map(Number);
      return h % 12 === round.h % 12 && m === round.m ? 1 : 0;
    }
    case 'classify': {
      const okCount = round.items.filter((it) => it.ok).length || 1;
      const hits = Math.max(0, Number(given?.hits) || 0);
      const wrong = Math.max(0, Number(given?.wrong) || 0);
      return Math.max(0, Math.min(1, hits / okCount - wrong * 0.15));
    }
    case 'trace': {
      // Bé tô theo nét: trình duyệt đo độ phủ (cover) và tỉ lệ nét vẽ lệch ra ngoài (stray), đều trong khoảng 0..1.
      const cover = Math.max(0, Math.min(1, Number(given?.cover) || 0));
      const stray = Math.max(0, Math.min(1, Number(given?.stray) || 0));
      if (cover >= 0.75 && stray <= 0.35) return 1;
      return Math.max(0, Math.min(0.49, cover * 0.6 - stray * 0.3));
    }
    default:
      return 0;
  }
}

export function starsFor(accuracy) {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  if (accuracy >= 0.4) return 1;
  return 0;
}

/** Tổng XP cần để đạt cấp n (cấp 1 = 0 XP). */
export function xpForLevel(n) {
  if (n <= 1) return 0;
  let total = 0;
  for (let i = 1; i < n; i++) total += Math.round(50 * Math.pow(i, 1.5));
  return total;
}
export function levelInfo(xp) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: xp - base, needed: next - base };
}

/**
 * Tính phần thưởng cuối màn.
 * @param {{ qualities:number[], maxCombo:number, baseCoins:number, baseXp:number, prevStars:number }} p
 */
export function computeRewards({ qualities, maxCombo, baseCoins, baseXp, prevStars }) {
  const total = qualities.length || 1;
  const sum = qualities.reduce((a, b) => a + b, 0);
  const accuracy = sum / total;
  const stars = starsFor(accuracy);
  let coins = stars === 0 ? 2 : Math.ceil((baseCoins * stars) / 3) + Math.floor(maxCombo / 3);
  if (stars === 3 && prevStars < 3) coins += 10; // lần đầu đạt 3 sao
  if (prevStars === 3) coins = Math.max(1, Math.ceil(coins * 0.2)); // chơi lại màn đã 3 sao: tránh "cày"
  const xp = Math.round(baseXp * (0.4 + 0.6 * accuracy));
  const correct = qualities.filter((q) => q >= 0.5).length;
  return { accuracy, stars, coins, xp, correct, total };
}

export const MAX_ENERGY = 10;
export const ENERGY_MS = 10 * 60 * 1000;

/** Tính năng lượng hiện tại theo thời gian hồi. */
export function currentEnergy(value, updatedAtMs, nowMs) {
  if (value >= MAX_ENERGY) return { value: MAX_ENERGY, updatedAt: nowMs, nextInMs: 0 };
  const gained = Math.floor((nowMs - updatedAtMs) / ENERGY_MS);
  const v = Math.min(MAX_ENERGY, value + Math.max(0, gained));
  const updatedAt = v >= MAX_ENERGY ? nowMs : updatedAtMs + gained * ENERGY_MS;
  const nextInMs = v >= MAX_ENERGY ? 0 : ENERGY_MS - (nowMs - updatedAt);
  return { value: v, updatedAt, nextInMs };
}

export function ageThemeForGrade(grade) {
  return grade <= 2 ? 'sprout' : grade <= 5 ? 'bud' : 'wing';
}

/** Số vòng mỗi loại game. */
export const GAME_ROUNDS = {
  quiz: 8,
  'true-false': 8,
  'balloon-pop': 6,
  'math-race': 10,
  'fill-blank': 6,
  'listen-pick': 6,
  'drag-match': 2,
  memory: 1,
  'sort-order': 4,
  'word-builder': 5,
  clock: 6,
  'catch-fall': 1,
  'fruit-slice': 6,
  'candy-match': 5,
  slingshot: 5,
  'draw-trace': 4,
  boss: 10,
};

/** Dạng câu hỏi mà mỗi game dùng. */
export const GAME_KIND = {
  quiz: 'mc',
  'true-false': 'tf',
  'balloon-pop': 'mc',
  'math-race': 'mc',
  'fill-blank': 'mc',
  'listen-pick': 'mc',
  'drag-match': 'pairs',
  memory: 'pairs',
  'sort-order': 'order',
  'word-builder': 'word',
  clock: 'clock',
  'catch-fall': 'classify',
  'fruit-slice': 'mc',
  'candy-match': 'mc',
  slingshot: 'mc',
  'draw-trace': 'trace',
  boss: 'mc',
};
