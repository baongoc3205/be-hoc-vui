// Game liên tục (không dừng sau mỗi câu): Đua xe Toán và Bắn bóng bay.
import { useEffect, useRef, useState } from 'react';
import type { Look, Round } from '../lib/types';
import type { T } from '../lib/i18n';
import { sfx } from '../lib/sfx';
import { burstAt } from '../lib/fx';
import { Glyph } from '../ui/Icons';

export interface FlowProps { rounds: Round[]; T: T; look: Look; onRound: (r: Round, given: unknown) => void; onDone: () => void }

function Car({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 84 48" width="84" height="48">
      <ellipse cx="42" cy="44" rx="34" ry="4" fill="#000" opacity=".18" />
      <path d="M6 32c0-6 4-10 10-10l10-10c2-2 5-3 8-3h18c4 0 7 2 9 4l8 9c6 0 10 4 10 10v4H6z" fill={color} />
      <path d="M30 13h10v9H22zM44 13h8c2 0 4 1 5 3l5 6H44z" fill="#DCEBF2" />
      <circle cx="22" cy="37" r="7" fill="#4B3B3D" /><circle cx="22" cy="37" r="3" fill="#D6C4C1" />
      <circle cx="64" cy="37" r="7" fill="#4B3B3D" /><circle cx="64" cy="37" r="3" fill="#D6C4C1" />
      <rect x="10" y="25" width="14" height="4" rx="2" fill="#fff" opacity=".4" />
    </svg>
  );
}

export function MathRace({ rounds, T, onRound, onDone }: FlowProps) {
  const [i, setI] = useState(0);
  const [mine, setMine] = useState(0);
  const [bots, setBots] = useState([0, 0]);
  const [flash, setFlash] = useState<'' | 'ok' | 'no'>('');
  const avg = useRef(5000); const qStart = useRef(performance.now()); const t0 = useRef(performance.now());
  const total = rounds.length;
  const finished = i >= total;
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => {
      const t = performance.now() - t0.current;
      setBots([Math.min(0.97, t / (avg.current * total * 1.08)), Math.min(0.97, t / (avg.current * total * 1.3))]);
    }, 200);
    return () => clearInterval(id);
  }, [finished, total]);
  useEffect(() => { qStart.current = performance.now(); }, [i]);
  const r = rounds[i];
  const answer = (k: number, el: HTMLElement) => {
    if (finished || flash) return;
    const dt = performance.now() - qStart.current; avg.current = avg.current * 0.6 + Math.min(9000, dt) * 0.4;
    onRound(r, k);
    const ok = k === r.answer;
    if (ok) { sfx.correct(); burstAt(el, 'stars', 8); setMine((m) => m + 1); } else sfx.wrong();
    setFlash(ok ? 'ok' : 'no');
    setTimeout(() => { setFlash(''); if (i + 1 >= total) { sfx.levelup(); setTimeout(onDone, 900); } setI(i + 1); }, ok ? 350 : 750);
  };
  useEffect(() => {
    const f = (e: KeyboardEvent) => { const k = ['1', '2', '3', '4'].indexOf(e.key); if (k >= 0 && r?.options && k < r.options.length) answer(k, document.querySelector('.opt') as HTMLElement); };
    addEventListener('keydown', f); return () => removeEventListener('keydown', f);
  });
  const lanes = [{ p: mine / total, c: '#E2804F', nm: '★' }, { p: bots[0], c: '#8FB3C9', nm: 'Bơ' }, { p: bots[1], c: '#B49BC4', nm: 'Foxy' }];
  const place = 1 + [bots[0], bots[1]].filter((b) => b > mine / total).length;
  return (
    <>
      <div className="race-track">
        {lanes.map((l, k) => <div key={k} className="lane"><div className="car" style={{ left: `calc(${l.p * 100}% - ${l.p * 90}px)` }}><Car color={l.c} /><span className="nm">{l.nm}</span></div></div>)}
      </div>
      {!finished && r ? (
        <>
          <div className="title-out" style={{ textAlign: 'center', fontSize: 44 }}>{T.tx(r.prompt)}</div>
          <div className="opts" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {r.options!.map((o, k) => <button key={k} type="button" className={`opt ${flash && k === r.answer ? 'good' : ''}`} style={{ justifyContent: 'center' }} onClick={(e) => answer(k, e.currentTarget)}>{T.tx(o)}</button>)}
          </div>
          <p className="muted" style={{ textAlign: 'center', margin: 0, fontWeight: 800 }}>{T.t('raceHint')} · {i + 1}/{total} · {T.t('position', { n: place })}</p>
        </>
      ) : <div className="title-out" style={{ textAlign: 'center', fontSize: 52 }}>{T.t('finish')} {T.t('position', { n: place })}</div>}
    </>
  );
}

const BALLOON_COLORS = ['#E2804F', '#8FB3C9', '#B2C739', '#C2A9D6', '#F27B8E', '#F4CB0A'];
export function BalloonPop({ rounds, T, onRound, onDone }: FlowProps) {
  const [i, setI] = useState(0);
  const [state, setState] = useState<{ picked: number | null }>({ picked: null });
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const r = rounds[i];
  useEffect(() => {
    if (!r) return;
    setState({ picked: null });
    const speeds = r.options!.map(() => 0.55 + Math.random() * 0.35);
    const t0 = performance.now(); let raf = 0; let ended = false;
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      let allOut = true;
      refs.current.forEach((el, k) => {
        if (!el) return;
        const H = el.parentElement!.clientHeight + 200;
        const y = -Math.min(H + 60, t * speeds[k] * 110 + k * 10);
        if (-y < H) allOut = false;
        el.style.transform = `translateX(calc(-50% + ${Math.sin(t * 1.5 + k) * 14}px)) translateY(${y}px)`;
      });
      if (allOut && !ended) { ended = true; onRound(r, -1); next(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i]); // eslint-disable-line
  const next = () => setTimeout(() => { if (i + 1 >= rounds.length) onDone(); else setI(i + 1); }, 900);
  const pop = (k: number) => {
    if (state.picked !== null) return;
    setState({ picked: k }); onRound(r, k);
    const el = refs.current[k];
    if (k === r.answer) { sfx.pop(); sfx.correct(); burstAt(el, 'confetti', 24); } else { sfx.wrong(); }
    next();
  };
  if (!r) return null;
  return (
    <>
      <div className="title-out" style={{ textAlign: 'center', fontSize: 'clamp(26px, 3.4vw, 42px)' }}>{T.tx(r.prompt)}</div>
      <div className="arena">
        <div className="arena-hud"><span>{i + 1}/{rounds.length}</span><span>{T.t('balloonHint')}</span></div>
        {r.options!.map((o, k) => {
          const cls = state.picked === null ? '' : k === r.answer ? (state.picked === k ? 'popped' : '') : state.picked === k ? 'miss' : '';
          return (
            <button key={`${i}-${k}`} ref={(el) => { refs.current[k] = el; }} type="button" className={`balloon ${cls}`} style={{ left: `${14 + k * (72 / Math.max(1, r.options!.length - 1))}%` }} onClick={() => pop(k)} aria-label={T.tx(o)}>
              <svg viewBox="0 0 132 180"><ellipse cx="66" cy="62" rx="54" ry="60" fill={BALLOON_COLORS[(k + i) % BALLOON_COLORS.length]} /><ellipse cx="46" cy="38" rx="12" ry="18" fill="#fff" opacity=".35" transform="rotate(-25 46 38)" /><path d="M60 121l6 8 6-8z" fill={BALLOON_COLORS[(k + i) % BALLOON_COLORS.length]} /><path d="M66 129c-8 14 8 24 0 50" stroke="#7B6668" strokeWidth="2" fill="none" /></svg>
              <span className="b-text">{T.tx(o)}</span>
            </button>
          );
        })}
        {state.picked !== null && state.picked !== r.answer && <div className="arena-hud" style={{ top: 'auto', bottom: 14, justifyContent: 'center' }}><span><Glyph name="check" size={16} /> {T.tx(r.options![r.answer as number])}</span></div>}
      </div>
    </>
  );
}
