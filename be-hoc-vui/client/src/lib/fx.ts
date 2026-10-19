// Hiệu ứng hạt (pháo giấy, sao, lấp lánh) trên một canvas toàn màn hình + xu bay vào HUD.
import { getState } from './store';
import { sfx } from './sfx';

type P = { x: number; y: number; vx: number; vy: number; g: number; r: number; vr: number; s: number; life: number; max: number; color: string; shape: 'star' | 'rect' | 'dot' | 'spark' };
let canvas: HTMLCanvasElement | null = null; let c2: CanvasRenderingContext2D | null = null;
const parts: P[] = []; let raf = 0;
const COLORS = ['#F4CB0A', '#B7CA49', '#DC7B4E', '#F3B7A8', '#A9C8DE', '#C9A8D8', '#FFFFFF'];

function ensure() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.className = 'fx-layer';
  document.body.appendChild(canvas);
  c2 = canvas.getContext('2d');
  const resize = () => { if (!canvas) return; const d = Math.min(2, devicePixelRatio || 1); canvas.width = innerWidth * d; canvas.height = innerHeight * d; c2?.setTransform(d, 0, 0, d, 0, 0); };
  resize(); addEventListener('resize', resize);
}
function starPath(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath();
}
function loop() {
  if (!c2 || !canvas) return;
  c2.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life++; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.r += p.vr;
    const a = 1 - p.life / p.max;
    if (a <= 0) { parts.splice(i, 1); continue; }
    c2.save(); c2.globalAlpha = Math.min(1, a * 1.5); c2.translate(p.x, p.y); c2.rotate(p.r); c2.fillStyle = p.color;
    if (p.shape === 'star') { starPath(c2, p.s); c2.fill(); }
    else if (p.shape === 'rect') c2.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    else if (p.shape === 'spark') { c2.fillRect(-p.s / 2, -1, p.s, 2); c2.fillRect(-1, -p.s / 2, 2, p.s); }
    else { c2.beginPath(); c2.arc(0, 0, p.s / 2, 0, 7); c2.fill(); }
    c2.restore();
  }
  raf = parts.length ? requestAnimationFrame(loop) : 0;
}
const rm = () => getState().prefs.reduceMotion;

export function burst(x: number, y: number, kind: 'stars' | 'confetti' | 'sparkle' = 'stars', n = 14) {
  if (rm()) return;
  ensure();
  for (let i = 0; i < n && parts.length < 320; i++) {
    const a = Math.random() * Math.PI * 2; const sp = kind === 'confetti' ? 4 + Math.random() * 7 : 2 + Math.random() * 4;
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === 'confetti' ? 5 : 1), g: kind === 'sparkle' ? 0.02 : 0.18, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, s: kind === 'confetti' ? 10 + Math.random() * 6 : 6 + Math.random() * 8, life: 0, max: 50 + Math.random() * 40, color: kind === 'stars' ? (Math.random() < 0.7 ? '#F4CB0A' : '#FFF4C2') : COLORS[Math.floor(Math.random() * COLORS.length)], shape: kind === 'confetti' ? 'rect' : kind === 'sparkle' ? 'spark' : 'star' });
  }
  if (!raf) raf = requestAnimationFrame(loop);
}
export function confettiRain() {
  if (rm()) return;
  burst(innerWidth * 0.15, innerHeight * 0.9, 'confetti', 50);
  burst(innerWidth * 0.85, innerHeight * 0.9, 'confetti', 50);
}
export function burstAt(el: Element | null, kind: 'stars' | 'confetti' | 'sparkle' = 'stars', n = 14) {
  if (!el) return; const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, kind, n);
}

/** Cho n đồng xu bay từ phần tử `from` đến ô xu trên HUD. */
export function flyCoins(from: Element | null, n = 6) {
  const target = document.querySelector('[data-hud="coins"] .hud-icon');
  if (!from || !target || rm()) { if (n) sfx.coin(); return; }
  const a = from.getBoundingClientRect(); const b = target.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div'); el.className = 'fly-coin';
    el.innerHTML = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#F2B21B"/><circle cx="20" cy="20" r="14" fill="#F7C93B"/><g fill="#E58A1A"><circle cx="20" cy="14" r="4"/><circle cx="26" cy="20" r="4"/><circle cx="20" cy="26" r="4"/><circle cx="14" cy="20" r="4"/></g><circle cx="20" cy="20" r="3" fill="#FFE68A"/></svg>';
    const sx = a.left + a.width / 2 + (Math.random() - 0.5) * 60; const sy = a.top + a.height / 2 + (Math.random() - 0.5) * 30;
    el.style.left = `${sx}px`; el.style.top = `${sy}px`;
    document.body.appendChild(el);
    const dx = b.left + b.width / 2 - sx; const dy = b.top + b.height / 2 - sy;
    el.animate([
      { transform: 'translate(-50%,-50%) scale(0.4)', opacity: 0 },
      { transform: `translate(calc(-50% + ${dx * 0.2}px), calc(-50% + ${dy * 0.2 - 60}px)) scale(1.1)`, opacity: 1, offset: 0.35 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.6)`, opacity: 0.9 },
    ], { duration: 750 + i * 70, easing: 'cubic-bezier(.5,0,.6,1)' }).onfinish = () => {
      el.remove(); sfx.coin();
      target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 220 });
    };
  }
}
