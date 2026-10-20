// Hiệu ứng âm thanh tự tổng hợp bằng Web Audio API; nhạc nền phát từ file theo chủ đề.
// Mỗi hiệu ứng là vài nốt ngắn có bao âm (ADSR) + bộ nén để to, rõ mà không rè.
import { getState } from './store';
import { THEMES, themeById, type Theme } from './themes';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;

function ac() {
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

type ToneOpts = { type?: OscillatorType; vol?: number; delay?: number; slideTo?: number; attack?: number; bus?: 'fx' | 'music'; cutoff?: number };
function tone(freq: number, dur: number, opts: ToneOpts = {}) {
  const c = ac(); if (!c || !master) return;
  const t0 = c.currentTime + 0.005 + (opts.delay ?? 0);
  const o = c.createOscillator(); const g = c.createGain(); const f = c.createBiquadFilter();
  o.type = opts.type ?? 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur * 0.9);
  f.type = 'lowpass'; f.frequency.value = opts.cutoff ?? 5200;
  const v = opts.vol ?? 0.4;
  const a = opts.attack ?? 0.008;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + a);
  g.gain.exponentialRampToValueAtTime(v * 0.55, t0 + a + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(f); f.connect(g); g.connect(opts.bus === 'music' ? musicBus! : master);
  o.start(t0); o.stop(t0 + dur + 0.03);
}
/** Tiếng "bụp" bong bóng: sóng sin trượt nhanh từ cao xuống. */
function blip(from: number, to: number, dur: number, vol = 0.45, delay = 0) { tone(from, dur, { slideTo: to, vol, delay, attack: 0.004 }); }
/** Chuông lấp lánh: nốt chính + hoạ âm quãng tám. */
function bell(freq: number, dur: number, vol = 0.32, delay = 0) { tone(freq, dur, { type: 'triangle', vol, delay }); tone(freq * 2, dur * 0.7, { vol: vol * 0.35, delay }); tone(freq * 3, dur * 0.4, { vol: vol * 0.12, delay }); }
/** Tiếng xì/xoẹt bằng nhiễu trắng qua bộ lọc. */
function noise(dur: number, vol = 0.18, from = 800, to = 3200, delay = 0) {
  const c = ac(); if (!c || !master) return;
  const t0 = c.currentTime + 0.005 + delay;
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
  const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(from, t0); f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(t0); src.stop(t0 + dur + 0.02);
}
const N = (n: number) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz

let lastTap = 0;
export const sfx = {
  /** chạm nút */
  tap: () => { if (!on()) return; const now = performance.now(); if (now - lastTap < 40) return; lastTap = now; blip(900, 520, 0.09, 0.38); },
  /** mở hộp thoại / chọn */
  pop: () => { if (!on()) return; blip(420, 980, 0.12, 0.42); },
  /** trả lời đúng: ting-ting đi lên */
  correct: () => { if (!on()) return; bell(N(84), 0.22, 0.34); bell(N(91), 0.38, 0.34, 0.1); },
  /** trả lời sai: "ư-ừm" trầm, nhẹ nhàng (không làm bé sợ) */
  wrong: () => { if (!on()) return; tone(N(58), 0.18, { type: 'square', vol: 0.12, cutoff: 1400 }); tone(N(55), 0.3, { type: 'square', vol: 0.12, cutoff: 1200, delay: 0.16 }); },
  /** sao kết quả (i = 0,1,2) */
  star: (i = 0) => { if (!on()) return; const n = [84, 88, 91][i] ?? 91; bell(N(n), 0.5, 0.36); noise(0.18, 0.05, 3000, 9000); },
  /** xu bay vào túi */
  coin: () => { if (!on()) return; tone(N(88), 0.07, { type: 'square', vol: 0.13, cutoff: 4000 }); tone(N(95), 0.22, { type: 'square', vol: 0.13, cutoff: 4000, delay: 0.07 }); },
  /** lên cấp / hoàn thành */
  levelup: () => { if (!on()) return; [72, 76, 79, 84, 88].forEach((n, i) => bell(N(n), 0.32, 0.28, i * 0.08)); },
  /** chuyển màn, lắc rương */
  whoosh: () => { if (!on()) return; noise(0.32, 0.22, 500, 4000); },
  /** mở rương, nhận quà */
  open: () => { if (!on()) return; noise(0.2, 0.12, 2000, 8000); [67, 71, 74, 79, 83, 86].forEach((n, i) => bell(N(n), 0.28, 0.26, 0.05 + i * 0.06)); },
  /** lật thẻ, kéo thả */
  flip: () => { if (!on()) return; noise(0.08, 0.14, 1500, 5000); blip(600, 750, 0.06, 0.2); },
  /** chuyển trang */
  page: () => { if (!on()) return; noise(0.16, 0.08, 900, 2600); },
};
function on() { return getState().prefs.sound; }

// ---------- Nhạc nền theo chủ đề ----------
// Phát file nhạc của chủ đề bằng Web Audio (lặp liền mạch, chuyển chủ đề thì nhạc cũ nhỏ dần, nhạc mới to dần).
// Nếu chưa có file nhạc (hoặc tải lỗi) thì phát nhạc ngũ cung tự tổng hợp thay thế.
const buffers = new Map<string, Promise<AudioBuffer | null>>();
let wantOn = false;
let wantTheme: Theme = THEMES[0];
let playing: { url: string; src: AudioBufferSourceNode; gain: GainNode } | null = null;
let bgmTimer: number | null = null;

function loadBuffer(c: AudioContext, url: string) {
  let p = buffers.get(url);
  if (!p) {
    p = fetch(url).then(async (r) => {
      const type = r.headers.get('content-type') ?? '';
      if (!r.ok || !/audio|octet-stream/.test(type)) return null;
      const data = await r.arrayBuffer();
      return await new Promise<AudioBuffer | null>((ok) => { c.decodeAudioData(data, (b) => ok(b), () => ok(null)); });
    }).catch(() => null);
    buffers.set(url, p);
  }
  return p;
}
function stopTrack(fade = 0.9) {
  if (!playing || !ctx) return;
  const { src, gain } = playing; playing = null;
  const t = ctx.currentTime;
  gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(0.0001, t + fade);
  try { src.stop(t + fade + 0.05); } catch { /* bỏ qua */ }
}
function stopSynth() { if (bgmTimer) clearInterval(bgmTimer); bgmTimer = null; }
function startSynth() {
  if (bgmTimer || !ac()) return;
  const scale = [72, 74, 76, 79, 81, 84, 86, 88];
  const chords = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]];
  let step = 0;
  const beat = 60 / 96;
  bgmTimer = window.setInterval(() => {
    if (!getState().prefs.music || document.visibilityState !== 'visible') return;
    const bar = Math.floor(step / 4) % chords.length;
    if (step % 4 === 0) chords[bar].forEach((n) => tone(N(n), beat * 3.6, { vol: 0.07, attack: 0.25, bus: 'music', cutoff: 1800 }));
    if (step % 2 === 0) tone(N(chords[bar][0] - 12), beat * 0.9, { vol: 0.08, bus: 'music', cutoff: 900 });
    if (Math.random() < 0.65) tone(N(scale[Math.floor(Math.random() * scale.length)]), beat * 0.8, { type: 'triangle', vol: 0.07, bus: 'music' });
    step++;
  }, beat * 1000);
}
async function syncMusic() {
  const c = ac();
  if (!c || !musicBus) return;
  if (!wantOn) { stopTrack(); stopSynth(); return; }
  const theme = wantTheme;
  if (playing?.url === theme.music) return;
  const buf = await loadBuffer(c, theme.music);
  if (!wantOn || wantTheme !== theme) return; // người dùng đã đổi ý trong lúc tải
  if (!buf) { stopTrack(); startSynth(); return; }
  stopSynth(); stopTrack();
  const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
  const gain = c.createGain(); gain.gain.value = 0.0001;
  src.connect(gain); gain.connect(musicBus);
  const t = c.currentTime;
  gain.gain.linearRampToValueAtTime(theme.volume, t + 1.4);
  src.start(t);
  playing = { url: theme.music, src, gain };
}
/** Bật / tắt nhạc nền. */
export function setMusic(enabled: boolean) { wantOn = enabled; void syncMusic(); }
/** Đổi bản nhạc theo chủ đề (nếu nhạc đang bật thì chuyển mượt sang bản mới). */
export function setMusicTheme(id: string) { wantTheme = themeById(id); void syncMusic(); }
/** Nghe thử nhạc của một chủ đề trong cài đặt (kể cả khi nhạc nền đang tắt, phát 8 giây). */
export async function previewTheme(id: string) {
  const c = ac(); if (!c || !musicBus) return false;
  const th = themeById(id);
  const buf = await loadBuffer(c, th.music);
  if (!buf) return false;
  if (wantOn) { setMusicTheme(id); return true; }
  const src = c.createBufferSource(); src.buffer = buf;
  const g = c.createGain(); g.gain.value = 0.0001; src.connect(g); g.connect(musicBus);
  const t = c.currentTime;
  g.gain.linearRampToValueAtTime(th.volume, t + 0.4); g.gain.setValueAtTime(th.volume, t + 7); g.gain.linearRampToValueAtTime(0.0001, t + 8);
  src.start(t); src.stop(t + 8.1);
  return true;
}
// tạm im nhạc khi chuyển sang tab / ứng dụng khác
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (!ctx || !musicBus) return;
  const t = ctx.currentTime, v = document.visibilityState === 'visible' ? 0.55 : 0.0001;
  musicBus.gain.cancelScheduledValues(t); musicBus.gain.setValueAtTime(musicBus.gain.value, t); musicBus.gain.linearRampToValueAtTime(v, t + 0.5);
});

// ---------- Mở khoá âm thanh ----------
// Trình duyệt chỉ cho phát âm thanh sau một thao tác của người dùng. iPhone còn tắt tiếng Web Audio
// khi gạt nút im lặng, nên phát kèm một đoạn <audio> im lặng để chuyển sang chế độ "phát nhạc".
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
let unlocked = false;
export function unlockAudio() {
  const c = ac();
  try { (navigator as unknown as { audioSession?: { type: string } }).audioSession && ((navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback'); } catch { /* bỏ qua */ }
  if (unlocked || !c) return;
  try {
    const el = new Audio(SILENT_WAV); el.setAttribute('playsinline', ''); el.volume = 0.01;
    void el.play().catch(() => undefined);
    const b = c.createBuffer(1, 1, 22050); const s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);
  } catch { /* bỏ qua */ }
  if (c.state === 'running') unlocked = true;
  else void c.resume().then(() => { unlocked = c.state === 'running'; });
}
/** Gắn mở khoá vào mọi kiểu thao tác (chuột, chạm, phím) cho tới khi âm thanh chạy. */
export function installAudioUnlock() {
  const evs = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;
  const h = () => { unlockAudio(); if (unlocked) evs.forEach((e) => removeEventListener(e, h, true)); };
  evs.forEach((e) => addEventListener(e, h, { capture: true, passive: true }));
  // quay lại tab sau khi điện thoại khoá màn hình → ngữ cảnh có thể bị treo, mở lại khi chạm
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && ctx?.state !== 'running') { unlocked = false; evs.forEach((e) => addEventListener(e, h, { capture: true, passive: true })); } });
}
