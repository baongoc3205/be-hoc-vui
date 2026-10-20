// Mini game hành động (vừa chơi vừa học): Chém trái cây, Xếp kẹo, Bắn ná, Bé tập vẽ.
// Mỗi game nhận một vòng (round) giống các game khác và gọi onSubmit(given) khi bé chọn xong.
// Hình vẽ đều tự thiết kế bằng SVG (không dùng nhân vật hay hình ảnh của trò chơi khác).
import { useEffect, useMemo, useRef, useState } from 'react';
import type { StepProps } from './StepGames';
import { sfx } from '../lib/sfx';
import { burstAt } from '../lib/fx';
import { Btn } from '../ui/kit';

const KEYS = ['1', '2', '3', '4'];
function useKeys(n: number, on: boolean, pick: (i: number) => void) {
  useEffect(() => {
    if (!on) return;
    const f = (e: KeyboardEvent) => { const i = KEYS.indexOf(e.key); if (i >= 0 && i < n) pick(i); };
    addEventListener('keydown', f); return () => removeEventListener('keydown', f);
  }, [n, on, pick]);
}
const fitText = (s: string, base: number) => (s.length <= 4 ? base : s.length <= 8 ? base * 0.8 : s.length <= 14 ? base * 0.62 : base * 0.5);

// =====================================================================
// 1) CHÉM TRÁI CÂY — vuốt qua trái cây mang đáp án đúng
// =====================================================================
const FRUITS = [
  { body: '#F27C6B', inner: '#FFD9C7', leaf: '#7FB55A', kind: 'melon' },
  { body: '#F6A63B', inner: '#FFE3A8', leaf: '#6FA84B', kind: 'orange' },
  { body: '#E95A8A', inner: '#FFF4F6', leaf: '#8DBE59', kind: 'dragon' },
  { body: '#F3C64A', inner: '#FFF0B3', leaf: '#76AE52', kind: 'mango' },
];
function FruitSvg({ f, half }: { f: (typeof FRUITS)[number]; half?: 'l' | 'r' }) {
  const clip = half === 'l' ? 'inset(0 50% 0 0)' : half === 'r' ? 'inset(0 0 0 50%)' : undefined;
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" style={{ clipPath: clip, overflow: 'visible' }} aria-hidden>
      <ellipse cx="60" cy="112" rx="34" ry="5" fill="#000" opacity=".08" />
      {f.kind === 'dragon' && [0, 1, 2, 3, 4, 5].map((k) => <path key={k} d="M60 14q8 10 0 18q-8-8 0-18z" fill="#9CCB5C" transform={`rotate(${k * 60} 60 62)`} />)}
      <circle cx="60" cy="62" r="44" fill={f.body} />
      <circle cx="60" cy="62" r="34" fill={f.inner} opacity={half ? 1 : 0.0} />
      <ellipse cx="44" cy="44" rx="13" ry="9" fill="#fff" opacity=".45" transform="rotate(-30 44 44)" />
      {f.kind === 'melon' && <g fill="#3E3433" opacity=".55">{[[50, 70], [66, 74], [58, 56], [74, 60]].map(([x, y], k) => <ellipse key={k} cx={x} cy={y} rx="2.6" ry="4" />)}</g>}
      {f.kind === 'dragon' && half && <g fill="#3E3433" opacity=".6">{Array.from({ length: 14 }, (_, k) => <circle key={k} cx={40 + ((k * 37) % 42)} cy={42 + ((k * 23) % 42)} r="1.8" />)}</g>}
      <path d="M60 18c2-8 8-12 14-12-1 7-6 12-14 12z" fill={f.leaf} />
      <circle cx="49" cy="66" r="3.4" fill="#4b3b3d" /><circle cx="71" cy="66" r="3.4" fill="#4b3b3d" />
      <path d="M55 74q5 4 10 0" stroke="#4b3b3d" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <ellipse cx="42" cy="75" rx="6" ry="3.5" fill="#fff" opacity=".35" /><ellipse cx="78" cy="75" rx="6" ry="3.5" fill="#fff" opacity=".35" />
    </svg>
  );
}

export function FruitSlice({ round, T, onSubmit, revealed, given }: StepProps) {
  const opts = round.options ?? [];
  const arena = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const trail = useRef<SVGPolylineElement>(null);
  const pos = useRef<{ x: number; y: number; r: number; alive: boolean }[]>([]);
  const [cut, setCut] = useState<number | null>(null);
  const done = useRef(false);
  const fruits = useMemo(() => opts.map((_, i) => FRUITS[(i + round.id.length) % FRUITS.length]), [round.id]); // eslint-disable-line

  const slice = (i: number) => {
    if (done.current || revealed) return;
    done.current = true; setCut(i); sfx.whoosh(); setTimeout(() => sfx.pop(), 60);
    const el = els.current[i]; if (el) burstAt(el, 'confetti', 14);
    setTimeout(() => onSubmit(i), 450);
  };
  useKeys(opts.length, !revealed, slice);

  useEffect(() => {
    const ar = arena.current!; let raf = 0; const t0 = performance.now();
    const n = opts.length; const WAVE = 4200, GAP = 420, D = 3600;
    // mỗi trái có điểm xuất phát / hạ cánh khác nhau, phân bố đều theo chiều ngang
    const lanes = Array.from({ length: n }, (_, i) => (i + 0.5) / n);
    const tick = (now: number) => {
      const W = ar.clientWidth, H = ar.clientHeight; const R = Math.max(44, Math.min(72, Math.min(W / (n * 2.2), H / 4.4)));
      const t = now - t0; const wave = Math.floor(t / (WAVE + n * GAP));
      const tw = t % (WAVE + n * GAP);
      lanes.forEach((lx, i) => {
        const el = els.current[i]; if (!el) return;
        if (cut === i) return; // trái đã chém: để CSS lo hiệu ứng bổ đôi
        const order = (i + wave) % n; // đổi thứ tự bay mỗi đợt
        const u = (tw - order * GAP) / D;
        const visible = u >= 0 && u <= 1 && !done.current;
        const x0 = (lx + (wave % 2 ? 0.08 : -0.08)) * W, x1 = (lx + (wave % 2 ? -0.06 : 0.06)) * W;
        const apex = H * (0.62 + 0.18 * ((i * 7 + wave * 3) % 5) / 4);
        const uu = Math.max(0, Math.min(1, u));
        const x = Math.max(R + 4, Math.min(W - R - 4, x0 + (x1 - x0) * uu)); const y = H + R - (apex + R) * 4 * uu * (1 - uu);
        pos.current[i] = { x, y, r: R, alive: visible };
        el.style.width = `${R * 2}px`; el.style.height = `${R * 2}px`;
        el.style.transform = `translate(${x - R}px, ${y - R}px)`; el.style.setProperty('--rot', `${(uu - 0.5) * (i % 2 ? 70 : -70)}deg`);
        el.style.opacity = visible || revealed ? '1' : '0';
      });
      raf = requestAnimationFrame(tick);
    };
    if (!revealed) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [round.id, cut, revealed]); // eslint-disable-line

  // vệt lưỡi dao
  const pts = useRef<{ x: number; y: number; t: number }[]>([]);
  const down = useRef(false);
  const local = (e: React.PointerEvent) => { const r = arena.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
  const drawTrail = () => { const now = performance.now(); pts.current = pts.current.filter((p) => now - p.t < 180); trail.current?.setAttribute('points', pts.current.map((p) => `${p.x},${p.y}`).join(' ')); };
  const segHit = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    pos.current.forEach((p, i) => {
      if (!p || !p.alive) return;
      const dx = b.x - a.x, dy = b.y - a.y; const L2 = dx * dx + dy * dy || 1;
      const k = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2));
      const cx = a.x + k * dx - p.x, cy = a.y + k * dy - p.y;
      if (cx * cx + cy * cy <= (p.r + 12) ** 2) slice(i);
    });
  };
  const onDown = (e: React.PointerEvent) => { down.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); pts.current = [local(e)]; drawTrail(); };
  const onMove = (e: React.PointerEvent) => {
    // vuốt bắt đầu từ ngoài khung vẫn tính (miễn là đang giữ ngón tay / chuột)
    if (!down.current) { if (!(e.buttons & 1)) return; down.current = true; pts.current = []; }
    const p = local(e); const last = pts.current[pts.current.length - 1];
    pts.current.push(p); if (last) segHit(last, p); drawTrail();
  };
  const onUp = () => { down.current = false; setTimeout(() => { pts.current = []; drawTrail(); }, 120); };

  return (
    <div className="arena fruit-arena" ref={arena} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <div className="arena-hud"><span>{T.t('sliceHint')}</span></div>
      {opts.map((o, i) => {
        const good = revealed && i === round.answer; const bad = revealed && given === i && i !== round.answer;
        const label = T.tx(o);
        return (
          <div key={i} ref={(el) => { els.current[i] = el; }} className={`fruit ${cut === i ? 'cut' : ''} ${good ? 'good' : ''} ${bad ? 'bad' : ''}`}
            role="button" tabIndex={0} aria-label={`${i + 1}. ${label}`} onClick={() => slice(i)} onKeyDown={(e) => { if (e.key === 'Enter') slice(i); }}>
            {cut === i ? (<><span className="half l"><FruitSvg f={fruits[i]} half="l" /></span><span className="half r"><FruitSvg f={fruits[i]} half="r" /></span><span className="splash" style={{ background: fruits[i].body }} /></>) : <FruitSvg f={fruits[i]} />}
            <span className="fruit-label" style={{ fontSize: fitText(label, 26) }}>{label}</span>
          </div>
        );
      })}
      <svg className="blade" aria-hidden><polyline ref={trail} points="" /></svg>
    </div>
  );
}

// =====================================================================
// 2) XẾP KẸO — đổi chỗ 2 viên kẹo cạnh nhau để có 3 viên cùng màu của đáp án đúng
// =====================================================================
const CANDY = [
  { fill: '#F28B9B', dark: '#D46378', shape: 'round' },
  { fill: '#8FC4E8', dark: '#5E9CC8', shape: 'drop' },
  { fill: '#B6D86A', dark: '#8DB33F', shape: 'star' },
  { fill: '#F6C25B', dark: '#D9A034', shape: 'heart' },
];
const COLS = 6, ROWS = 6;
type Cell = { id: number; c: number } | null;
let candyId = 1;
function CandySvg({ c }: { c: number }) {
  const k = CANDY[c];
  return (
    <svg viewBox="0 0 60 60" width="100%" height="100%" aria-hidden>
      {k.shape === 'round' && <><path d="M8 30l-7-7v14zM52 30l7-7v14z" fill={k.dark} /><circle cx="30" cy="30" r="21" fill={k.fill} /><path d="M16 22q14-10 28 0" stroke="#fff" strokeOpacity=".7" strokeWidth="4" fill="none" strokeLinecap="round" /></>}
      {k.shape === 'drop' && <><path d="M30 6c12 14 20 24 20 33a20 20 0 01-40 0c0-9 8-19 20-33z" fill={k.fill} /><ellipse cx="22" cy="36" rx="5" ry="8" fill="#fff" opacity=".5" /></>}
      {k.shape === 'star' && <><path d="M30 5l7 15 16 2-12 11 3 16-14-8-14 8 3-16L7 22l16-2z" fill={k.fill} stroke={k.dark} strokeWidth="2" strokeLinejoin="round" /><circle cx="24" cy="24" r="4" fill="#fff" opacity=".6" /></>}
      {k.shape === 'heart' && <><path d="M30 52C10 38 5 26 10 17c5-9 16-8 20 2 4-10 15-11 20-2 5 9 0 21-20 35z" fill={k.fill} stroke={k.dark} strokeWidth="2" /><ellipse cx="19" cy="22" rx="4" ry="6" fill="#fff" opacity=".55" transform="rotate(-30 19 22)" /></>}
      <circle cx="24" cy="33" r="2" fill="#4b3b3d" /><circle cx="36" cy="33" r="2" fill="#4b3b3d" /><path d="M27 38q3 2.5 6 0" stroke="#4b3b3d" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
const at = (g: Cell[], r: number, c: number) => (r < 0 || c < 0 || r >= ROWS || c >= COLS ? null : g[r * COLS + c]);
/** Các ô thuộc dãy ≥ 3 cùng màu. */
function findMatches(g: Cell[]) {
  const hit = new Set<number>();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const v = at(g, r, c)?.c; if (v === undefined) continue;
    if (c <= COLS - 3 && at(g, r, c + 1)?.c === v && at(g, r, c + 2)?.c === v) { let k = c; while (at(g, r, k)?.c === v) hit.add(r * COLS + k++); }
    if (r <= ROWS - 3 && at(g, r + 1, c)?.c === v && at(g, r + 2, c)?.c === v) { let k = r; while (at(g, k, c)?.c === v) hit.add(k * COLS + c), k++; }
  }
  return hit;
}
const swapped = (g: Cell[], a: number, b: number) => { const h = g.slice(); [h[a], h[b]] = [h[b], h[a]]; return h; };
/** Màu nào có ít nhất một nước đi tạo được dãy 3. */
function movableColors(g: Cell[]) {
  const out = new Set<number>();
  for (let i = 0; i < g.length; i++) for (const j of [i + 1, i + COLS]) {
    if ((j === i + 1 && (i % COLS) === COLS - 1) || j >= g.length) continue;
    const h = swapped(g, i, j); const m = findMatches(h); m.forEach((k) => out.add(h[k]!.c));
  }
  return out;
}
function makeBoard(n: number): Cell[] {
  for (let tries = 0; tries < 400; tries++) {
    const g: Cell[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      let v = 0; let guard = 0;
      do { v = Math.floor(Math.random() * n); guard++; } while (guard < 20 && ((c >= 2 && g[r * COLS + c - 1]!.c === v && g[r * COLS + c - 2]!.c === v) || (r >= 2 && g[(r - 1) * COLS + c]!.c === v && g[(r - 2) * COLS + c]!.c === v)));
      g.push({ id: candyId++, c: v });
    }
    if (findMatches(g).size === 0 && movableColors(g).size === n) return g;
  }
  return Array.from({ length: ROWS * COLS }, (_, i) => ({ id: candyId++, c: i % n }));
}

export function CandyMatch({ round, T, onSubmit, revealed, given }: StepProps) {
  const opts = round.options ?? [];
  const n = opts.length;
  const [grid, setGrid] = useState<Cell[]>(() => makeBoard(n));
  const [sel, setSel] = useState<number | null>(null);
  const [popping, setPopping] = useState<Set<number>>(new Set());
  const [shake, setShake] = useState<number[]>([]);
  const fresh = useRef<Set<number>>(new Set());
  const busy = useRef(false);
  const start = useRef<{ i: number; x: number; y: number } | null>(null);
  useEffect(() => { setGrid(makeBoard(n)); setSel(null); busy.current = false; }, [round.id]); // eslint-disable-line

  const choose = (i: number) => { if (busy.current || revealed) return; busy.current = true; onSubmit(i); };
  useKeys(n, !revealed, choose);

  const trySwap = (a: number, b: number) => {
    if (busy.current || revealed) return;
    const ra = Math.floor(a / COLS), rb = Math.floor(b / COLS);
    if (!(Math.abs(a - b) === COLS || (Math.abs(a - b) === 1 && ra === rb))) { setSel(b); return; }
    const h = swapped(grid, a, b); const m = findMatches(h);
    setSel(null);
    if (!m.size) { sfx.wrong(); setGrid(h); setShake([a, b]); setTimeout(() => { setGrid(grid); setShake([]); }, 320); return; }
    busy.current = true; sfx.flip(); setGrid(h);
    // màu được chọn = màu của viên vừa đổi chỗ có tạo dãy (ưu tiên viên được kéo)
    const color = m.has(b) ? h[b]!.c : m.has(a) ? h[a]!.c : h[[...m][0]]!.c;
    setTimeout(() => {
      sfx.pop(); setPopping(m);
      const el = document.querySelector(`[data-cell="${[...m][0]}"]`); burstAt(el, 'stars', 10);
      setTimeout(() => {
        // xoá viên đã ghép, cho rơi xuống và thêm kẹo mới từ trên
        const g2 = h.slice(); m.forEach((k) => { g2[k] = null; });
        for (let c = 0; c < COLS; c++) {
          const col: Cell[] = []; for (let r = ROWS - 1; r >= 0; r--) { const v = g2[r * COLS + c]; if (v) col.push(v); }
          while (col.length < ROWS) { const nc = { id: candyId++, c: Math.floor(Math.random() * n) }; fresh.current.add(nc.id); col.push(nc); }
          for (let r = ROWS - 1, k = 0; r >= 0; r--, k++) g2[r * COLS + c] = col[k];
        }
        setPopping(new Set()); setGrid(g2);
        busy.current = false; choose(color);
      }, 380);
    }, 220);
  };
  const onDown = (i: number, e: React.PointerEvent) => { start.current = { i, x: e.clientX, y: e.clientY }; };
  const onUp = (i: number, e: React.PointerEvent) => {
    const s = start.current; start.current = null; if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.hypot(dx, dy) > 18) { const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : (dy > 0 ? COLS : -COLS); const j = s.i + dir; if (j >= 0 && j < ROWS * COLS) trySwap(s.i, j); return; }
    if (sel === null) { sfx.tap(); setSel(i); } else if (sel === i) setSel(null); else trySwap(sel, i);
  };

  return (
    <div className="candy-wrap">
      <div className="candy-legend">
        {opts.map((o, i) => {
          const good = revealed && i === round.answer; const bad = revealed && given === i && i !== round.answer;
          return <button key={i} type="button" className={`candy-key ${good ? 'good' : ''} ${bad ? 'bad' : ''}`} onClick={() => sfx.tap()} aria-label={`${i + 1}. ${T.tx(o)}`}><span className="ck"><CandySvg c={i} /></span><span>{T.tx(o)}</span></button>;
        })}
      </div>
      <div className="candy-board" style={{ aspectRatio: `${COLS} / ${ROWS}` }} onPointerLeave={() => { start.current = null; }}>
        {grid.map((cell, i) => cell && (
          <div key={cell.id} data-cell={i} className={`candy ${sel === i ? 'sel' : ''} ${popping.has(i) ? 'pop' : ''} ${shake.includes(i) ? 'shake' : ''}`}
            style={{ transform: `translate(${(i % COLS) * 100}%, ${Math.floor(i / COLS) * 100}%)`, width: `${100 / COLS}%`, height: `${100 / ROWS}%` }}
            onPointerDown={(e) => onDown(i, e)} onPointerUp={(e) => onUp(i, e)}>
            <span className={`candy-in ${fresh.current.has(cell.id) ? 'fresh' : ''}`}><CandySvg c={cell.c} /></span>
          </div>
        ))}
      </div>
      <p className="arcade-tip">{T.t('candyHint')}</p>
    </div>
  );
}

// =====================================================================
// 3) BẮN NÁ — kéo ná rồi thả, bắn trúng thùng mang đáp án đúng
// =====================================================================
const GRAV = 900, MAXPULL = 120;
type Target = { x: number; y: number; w: number; h: number };
type SlingLayout = { VW: number; VH: number; O: { x: number; y: number }; targets: Target[]; tall: boolean; power: number };
/** Màn ngang: ná bên trái, thùng bên phải. Màn dọc (điện thoại): ná ở dưới, thùng ở trên. */
function slingLayout(n: number, tall: boolean): SlingLayout {
  if (!tall) {
    const xs = n <= 2 ? [600, 830] : n === 3 ? [560, 720, 880] : [520, 650, 780, 905];
    const ys = [430, 330, 400, 280];
    return { VW: 1000, VH: 560, O: { x: 170, y: 380 }, tall, power: 6.4, targets: xs.map((x, i) => ({ x, y: ys[i % ys.length] - 92, w: 104, h: 92 })) };
  }
  const VW = 600, VH = 860; const cols = n <= 2 ? [150, 450] : n === 3 ? [100, 300, 500] : [75, 225, 375, 525];
  const ys = [190, 120, 210, 140];
  return { VW, VH, O: { x: 300, y: 690 }, tall, power: 9.4, targets: cols.map((cx, i) => ({ x: cx - 58, y: ys[i % ys.length], w: 116, h: 96 })) };
}
export function Slingshot({ round, T, onSubmit, revealed, given }: StepProps) {
  const opts = round.options ?? [];
  const box = useRef<HTMLDivElement>(null);
  const [tall, setTall] = useState(() => innerHeight > innerWidth * 1.05);
  useEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(() => setTall(el.clientHeight > el.clientWidth * 1.05)); ro.observe(el); return () => ro.disconnect(); }, []);
  const { VW, VH, O: ORIGIN, targets, power: POWER } = useMemo(() => slingLayout(opts.length, tall), [opts.length, tall]);
  const svg = useRef<SVGSVGElement>(null);
  const [pull, setPull] = useState<{ x: number; y: number } | null>(null);
  const [ball, setBall] = useState<{ x: number; y: number } | null>(null);
  const [hit, setHit] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const flying = useRef(false);
  useEffect(() => { setHit(null); setBall(null); setPull(null); setMisses(0); flying.current = false; }, [round.id]);
  const choose = (i: number) => { if (revealed || hit !== null) return; setHit(i); sfx.open(); setTimeout(() => onSubmit(i), 650); };
  useKeys(opts.length, !revealed && hit === null, choose);

  const toSvg = (e: React.PointerEvent) => { const p = svg.current!.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = svg.current!.getScreenCTM()!.inverse(); const q = p.matrixTransform(m); return { x: q.x, y: q.y }; };
  const clampPull = (q: { x: number; y: number }) => { let dx = q.x - ORIGIN.x, dy = q.y - ORIGIN.y; const d = Math.hypot(dx, dy); if (d > MAXPULL) { dx *= MAXPULL / d; dy *= MAXPULL / d; } return { x: dx, y: dy }; };
  const onDown = (e: React.PointerEvent) => { if (flying.current || revealed || hit !== null) return; const q = toSvg(e); if (tall ? q.y < VH * 0.5 : q.x > VW * 0.48) return; (e.target as Element).setPointerCapture?.(e.pointerId); setPull(clampPull(q)); sfx.tap(); };
  const onMove = (e: React.PointerEvent) => { if (pull) setPull(clampPull(toSvg(e))); };
  const onUp = () => {
    if (!pull) return; const p = pull; setPull(null);
    if (Math.hypot(p.x, p.y) < 20) return;
    flying.current = true; sfx.whoosh();
    let x = ORIGIN.x, y = ORIGIN.y, vx = -p.x * POWER, vy = -p.y * POWER; let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      vy += GRAV * dt; x += vx * dt; y += vy * dt; setBall({ x, y });
      const ti = targets.findIndex((t) => x + 22 > t.x && x - 22 < t.x + t.w && y + 22 > t.y && y - 22 < t.y + t.h);
      if (ti >= 0) { flying.current = false; setBall(null); choose(ti); return; }
      if (y > VH + 60 || x > VW + 60 || x < -60 || y < -400) { flying.current = false; setBall(null); setMisses((m) => m + 1); sfx.wrong(); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  // đường ngắm: dài hơn sau mỗi lần bắn trượt
  const preview = useMemo(() => {
    if (!pull) return [];
    const out: { x: number; y: number }[] = []; const vx = -pull.x * POWER, vy = -pull.y * POWER; const span = 0.35 + Math.min(3, misses) * 0.2;
    for (let t = 0.05; t < span; t += 0.05) out.push({ x: ORIGIN.x + vx * t, y: ORIGIN.y + vy * t + 0.5 * GRAV * t * t });
    return out;
  }, [pull, misses]);
  const bx = ball ? ball.x : ORIGIN.x + (pull?.x ?? 0), by = ball ? ball.y : ORIGIN.y + (pull?.y ?? 0);

  return (
    <div className="arena sling-arena" ref={box}>
      <svg ref={svg} data-ox={ORIGIN.x} data-oy={ORIGIN.y} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMax meet" className="sling-svg" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => setPull(null)}>
        <defs><linearGradient id="slg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C99566" /><stop offset="1" stopColor="#9C6B45" /></linearGradient></defs>
        <rect x="0" y={VH - 40} width={VW} height="40" fill="#B9C98E" /><rect x="0" y={VH - 40} width={VW} height="8" fill="#A3B677" />
        {/* bệ và thùng đáp án */}
        {targets.map((t, i) => {
          const label = T.tx(opts[i]); const good = revealed && i === round.answer; const bad = revealed && given === i && i !== round.answer;
          return (
            <g key={i} data-tx={t.x + t.w / 2} data-ty={t.y + t.h / 2} className={`crate ${hit === i ? 'down' : ''}`} style={{ transformOrigin: `${t.x + t.w}px ${t.y + t.h}px` }}>
              {tall ? <path d={`M${t.x + 20} 0V${t.y}M${t.x + t.w - 20} 0V${t.y}`} stroke="#B98A5B" strokeWidth="4" /> : <rect x={t.x + 12} y={t.y + t.h} width={t.w - 24} height={VH - 40 - t.y - t.h} fill="#D9C2A6" />}
              <rect x={t.x} y={t.y} width={t.w} height={t.h} rx="10" fill={good ? '#CFE38A' : bad ? '#F2B5AC' : '#E9C79A'} stroke="#B98A5B" strokeWidth="5" />
              <path d={`M${t.x + 8} ${t.y + 8}L${t.x + t.w - 8} ${t.y + t.h - 8}M${t.x + t.w - 8} ${t.y + 8}L${t.x + 8} ${t.y + t.h - 8}`} stroke="#B98A5B" strokeWidth="4" opacity=".35" />
              <rect x={t.x - 8} y={tall ? t.y + t.h + 8 : t.y - 50} width={t.w + 16} height="44" rx="14" fill="#fffaf6" stroke="#D6C4C1" strokeWidth="3" />
              <text x={t.x + t.w / 2} y={tall ? t.y + t.h + 38 : t.y - 20} textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize={fitText(label, 30)} fill="#5e4a4c">{label}</text>
              <text x={t.x + t.w / 2} y={t.y + t.h / 2 + 12} textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="34" fill="#9C6B45" opacity=".75">{i + 1}</text>
            </g>
          );
        })}
        {/* ná */}
        <path d={`M${ORIGIN.x} ${VH - 40}V${ORIGIN.y + 40}`} stroke="url(#slg)" strokeWidth="18" strokeLinecap="round" />
        <path d={`M${ORIGIN.x} ${ORIGIN.y + 44}L${ORIGIN.x - 34} ${ORIGIN.y - 18}M${ORIGIN.x} ${ORIGIN.y + 44}L${ORIGIN.x + 34} ${ORIGIN.y - 18}`} stroke="url(#slg)" strokeWidth="16" strokeLinecap="round" />
        {!ball && <path d={`M${ORIGIN.x - 34} ${ORIGIN.y - 18}L${bx} ${by}L${ORIGIN.x + 34} ${ORIGIN.y - 18}`} stroke="#7B5B43" strokeWidth="6" fill="none" />}
        {preview.map((p, k) => <circle key={k} cx={p.x} cy={p.y} r={6 - k * 0.12} fill="#fff" opacity={0.9 - k * 0.04} />)}
        {/* viên đạn: bé mochi tròn */}
        {hit === null && (
          <g transform={`translate(${bx} ${by})`}>
            <circle r="24" fill="#F7E1C8" stroke="#E2B98F" strokeWidth="3" />
            <ellipse cx="-8" cy="-9" rx="6" ry="4" fill="#fff" opacity=".7" />
            <circle cx="-8" cy="2" r="3" fill="#4b3b3d" /><circle cx="8" cy="2" r="3" fill="#4b3b3d" />
            <path d="M-4 9q4 3 8 0" stroke="#4b3b3d" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <ellipse cx="-15" cy="8" rx="5" ry="3" fill="#F29A92" opacity=".55" /><ellipse cx="15" cy="8" rx="5" ry="3" fill="#F29A92" opacity=".55" />
          </g>
        )}
      </svg>
      <div className="arena-hud"><span>{misses >= 2 ? T.t('slingAssist') : T.t('slingHint')}</span></div>
    </div>
  );
}

// =====================================================================
// 4) BÉ TẬP VẼ — tô theo nét chấm; đo độ phủ và độ lệch ngay trên máy
// =====================================================================
function starPath(cx: number, cy: number, R: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + (k * Math.PI) / 5; const rr = k % 2 ? r : R; return `${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`; });
  return `M${pts.join(' L')} Z`;
}
export const TRACE_PATHS: Record<string, string> = {
  circle: 'M150 45 A105 105 0 1 1 149.9 45 Z',
  triangle: 'M150 45 L255 245 L45 245 Z',
  square: 'M55 55 L245 55 L245 245 L55 245 Z',
  rect: 'M30 85 L270 85 L270 215 L30 215 Z',
  star: starPath(150, 160, 115, 48),
  heart: 'M150 250 C 60 185 35 130 60 90 C 85 52 135 60 150 100 C 165 60 215 52 240 90 C 265 130 240 185 150 250 Z',
  para: 'M95 80 L270 80 L205 220 L30 220 Z',
  rhombus: 'M150 40 L255 150 L150 260 L45 150 Z',
  trapezoid: 'M100 80 L200 80 L265 220 L35 220 Z',
  right: 'M70 50 L70 240 L250 240',
  d0: 'M150 50 C 90 50 72 110 72 150 C 72 200 95 250 150 250 C 205 250 228 200 228 150 C 228 100 210 50 150 50 Z',
  d1: 'M110 95 L165 50 L165 250',
  d2: 'M85 100 C 90 60 130 45 155 48 C 200 52 220 90 205 125 C 190 160 120 205 80 250 L225 250',
  d3: 'M85 75 C 110 45 200 40 205 95 C 208 130 175 145 140 148 C 185 150 215 170 212 205 C 208 255 120 262 82 228',
  d4: 'M190 250 L190 50 L70 185 L235 185',
  d5: 'M215 50 L105 50 L92 140 C 120 122 170 118 198 140 C 230 168 222 230 175 248 C 140 262 100 252 80 232',
  d6: 'M200 65 C 170 45 120 45 98 85 C 75 125 72 200 100 232 C 130 262 195 255 205 210 C 215 165 180 140 145 140 C 115 140 95 158 88 180',
  d7: 'M75 50 L225 50 L130 250',
  d8: 'M150 148 C 105 140 90 115 92 95 C 95 62 125 48 150 48 C 175 48 205 62 208 95 C 210 115 195 140 150 148 C 100 156 82 185 84 205 C 86 235 115 252 150 252 C 185 252 214 235 216 205 C 218 185 200 156 150 148 Z',
  d9: 'M210 120 C 205 160 175 168 150 166 C 110 164 88 135 90 105 C 93 70 125 50 155 50 C 190 50 212 78 210 120 L205 250',
};
const CRAYONS = ['#E2804F', '#7B9FD0', '#98AE25', '#C96A9A', '#5e4a4c'];
export function DrawTrace({ round, T, onSubmit, revealed }: StepProps) {
  const d = TRACE_PATHS[round.shape ?? 'circle'] ?? TRACE_PATHS.circle;
  const guide = useRef<SVGPathElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [color, setColor] = useState(CRAYONS[0]);
  const drawing = useRef(false);
  const samples = useRef<{ x: number; y: number }[]>([]);
  const [score, setScore] = useState({ cover: 0, stray: 0 });
  const sent = useRef(false);
  useEffect(() => {
    setStrokes([]); setScore({ cover: 0, stray: 0 }); sent.current = false;
    const g = guide.current; if (!g) return; const len = g.getTotalLength(); const out: { x: number; y: number }[] = [];
    for (let s = 0; s <= len; s += 6) { const p = g.getPointAtLength(s); out.push({ x: p.x, y: p.y }); }
    samples.current = out;
  }, [round.id]);
  const measure = (all: { x: number; y: number }[][]) => {
    const pts = all.flat(); const S = samples.current; if (!pts.length || !S.length) return { cover: 0, stray: 0 };
    const near = (a: { x: number; y: number }, list: { x: number; y: number }[], r: number) => list.some((b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= r * r);
    const cover = S.filter((s) => near(s, pts, 16)).length / S.length;
    const stray = pts.filter((p) => !near(p, S, 24)).length / pts.length;
    return { cover, stray };
  };
  const submit = (sc = score) => { if (sent.current || revealed) return; sent.current = true; onSubmit({ cover: Math.round(sc.cover * 100) / 100, stray: Math.round(sc.stray * 100) / 100 }); };
  const toSvg = (e: React.PointerEvent) => { const p = svg.current!.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.current!.getScreenCTM()!.inverse()); return { x: q.x, y: q.y }; };
  const onDown = (e: React.PointerEvent) => { if (revealed) return; drawing.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); setStrokes((s) => [...s, [toSvg(e)]]); };
  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return; const p = toSvg(e);
    setStrokes((s) => { const cur = s[s.length - 1]; const last = cur[cur.length - 1]; if (last && (last.x - p.x) ** 2 + (last.y - p.y) ** 2 < 9) return s; const n = [...s.slice(0, -1), [...cur, p]]; return n; });
  };
  const onUp = () => {
    if (!drawing.current) return; drawing.current = false;
    setStrokes((s) => { const sc = measure(s); setScore(sc); if (sc.cover >= 0.92 && sc.stray <= 0.25) { sfx.correct(); setTimeout(() => submit(sc), 250); } else sfx.flip(); return s; });
  };
  const start = samples.current[0];
  return (
    <div className="trace-wrap">
      <div className="trace-board">
        <svg ref={svg} viewBox="0 0 300 300" className="trace-svg" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} role="img" aria-label={T.tx(round.prompt)}>
          <rect x="4" y="4" width="292" height="292" rx="26" fill="#fffaf6" />
          <g stroke="#efe3dc" strokeWidth="1">{[50, 100, 150, 200, 250].map((v) => <g key={v}><path d={`M${v} 10V290`} /><path d={`M10 ${v}H290`} /></g>)}</g>
          <path ref={guide} d={d} fill="none" stroke={revealed ? '#B2C739' : '#D6C4C1'} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
          <path d={d} fill="none" stroke={revealed ? '#98AE25' : '#A08B8C'} strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" strokeLinejoin="round" />
          {start && !revealed && <g><circle cx={start.x} cy={start.y} r="13" fill="#98AE25" /><circle cx={start.x} cy={start.y} r="13" fill="none" stroke="#98AE25" strokeWidth="3" className="trace-ping" /></g>}
          {strokes.map((s, k) => <polyline key={k} points={s.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />)}
        </svg>
      </div>
      <div className="trace-side">
        <div className="crayons">{CRAYONS.map((c) => <button key={c} type="button" aria-label={c} className={`crayon ${c === color ? 'on' : ''}`} style={{ background: c }} onClick={() => { sfx.tap(); setColor(c); }} />)}</div>
        <div className="trace-meter" aria-label={`${Math.round(score.cover * 100)}%`}><i style={{ width: `${Math.round(score.cover * 100)}%` }} /></div>
        <div className="trace-btns">
          <Btn tone="gray" size="sm" disabled={revealed || !strokes.length} onClick={() => { setStrokes([]); setScore({ cover: 0, stray: 0 }); }}>{T.t('erase')}</Btn>
          <Btn tone="lime" size="sm" disabled={revealed || score.cover < 0.3} onClick={() => submit()}>{T.t('doneDraw')}</Btn>
        </div>
      </div>
    </div>
  );
}
