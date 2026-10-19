// Âm thanh tự tổng hợp bằng Web Audio API — không cần file âm thanh.
import { getState } from './store';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
function ac() {
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; vol?: number; delay?: number; slideTo?: number; attack?: number } = {}) {
  const c = ac(); if (!c || !master) return;
  const t0 = c.currentTime + (opts.delay ?? 0);
  const o = c.createOscillator(); const g = c.createGain(); const f = c.createBiquadFilter();
  o.type = opts.type ?? 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
  f.type = 'lowpass'; f.frequency.value = 2600;
  const v = opts.vol ?? 0.25;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + (opts.attack ?? 0.012));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(f); f.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
const N = (n: number) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz

export const sfx = {
  tap: () => on() && tone(660, 0.07, { type: 'triangle', vol: 0.15 }),
  pop: () => on() && tone(520, 0.09, { slideTo: 880, vol: 0.2 }),
  correct: () => { if (!on()) return; tone(N(84), 0.12, { type: 'triangle', vol: 0.22 }); tone(N(88), 0.18, { type: 'triangle', vol: 0.22, delay: 0.09 }); },
  wrong: () => on() && tone(330, 0.22, { slideTo: 250, vol: 0.14 }),
  star: (i = 0) => { if (!on()) return; const n = [88, 91, 96][i] ?? 96; tone(N(n), 0.35, { vol: 0.2 }); tone(N(n + 12), 0.25, { vol: 0.07 }); },
  coin: () => { if (!on()) return; tone(N(83), 0.06, { type: 'square', vol: 0.08 }); tone(N(88), 0.16, { type: 'square', vol: 0.08, delay: 0.06 }); },
  levelup: () => { if (!on()) return; [72, 76, 79, 84].forEach((n, i) => tone(N(n), 0.25, { type: 'triangle', vol: 0.2, delay: i * 0.09 })); },
  whoosh: () => on() && tone(300, 0.25, { type: 'sawtooth', slideTo: 1200, vol: 0.04 }),
  open: () => { if (!on()) return; [67, 71, 74, 79, 83].forEach((n, i) => tone(N(n), 0.2, { vol: 0.16, delay: i * 0.06 })); },
};
function on() { return getState().prefs.sound; }

// ---------- Nhạc nền nhẹ (ngũ cung, tự sinh) ----------
let bgmTimer: number | null = null;
export function setMusic(enabled: boolean) {
  if (!enabled) { if (bgmTimer) clearInterval(bgmTimer); bgmTimer = null; return; }
  if (bgmTimer || !ac()) return;
  const scale = [60, 62, 64, 67, 69, 72, 74, 76];
  const chords = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]];
  let step = 0;
  const beat = 60 / 92;
  bgmTimer = window.setInterval(() => {
    if (!getState().prefs.music) return;
    const bar = Math.floor(step / 4) % chords.length;
    if (step % 4 === 0) chords[bar].forEach((n) => tone(N(n), beat * 3.6, { vol: 0.035, attack: 0.2 }));
    if (Math.random() < 0.7) tone(N(scale[Math.floor(Math.random() * scale.length)]), beat * 0.9, { type: 'triangle', vol: 0.04 });
    step++;
  }, beat * 1000);
}
export const unlockAudio = () => { ac(); };
