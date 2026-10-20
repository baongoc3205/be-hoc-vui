// Các game theo từng vòng: mỗi component nhận 1 vòng (round) và gọi onSubmit(given) khi bé trả lời xong.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Round } from '../lib/types';
import type { T } from '../lib/i18n';
import { sfx } from '../lib/sfx';
import { hasVoice, speak } from '../lib/speech';
import { burstAt } from '../lib/fx';
import { Btn } from '../ui/kit';
import { Glyph } from '../ui/Icons';
import { gradeRound } from '../../../shared/logic.js';

export interface StepProps { round: Round; T: T; onSubmit: (given: unknown) => void; revealed: boolean; given?: unknown }
const shuffleLocal = <X,>(a: X[]) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const KEYS = ['1', '2', '3', '4'];

/** Phím số 1–4 chọn đáp án. */
function useKeyPick(n: number, enabled: boolean, pick: (i: number) => void) {
  useEffect(() => {
    if (!enabled) return;
    const f = (e: KeyboardEvent) => { const i = KEYS.indexOf(e.key); if (i >= 0 && i < n) pick(i); };
    addEventListener('keydown', f); return () => removeEventListener('keydown', f);
  }, [n, enabled, pick]);
}

// ---------------- Trắc nghiệm / Nghe và chọn ----------------
export function Quiz({ round, T, onSubmit, revealed, given, listen }: StepProps & { listen?: boolean }) {
  const opts = round.options ?? [];
  const [showText, setShowText] = useState(false);
  const say = round.say;
  const canVoice = say ? hasVoice(say.lang) : false;
  const play = () => { if (say) { speak(say.text, say.lang, true); sfx.tap(); } };
  useEffect(() => { if (listen && say) { const id = setTimeout(play, 350); return () => clearTimeout(id); } /* eslint-disable-next-line */ }, [round.id]);
  useKeyPick(opts.length, !revealed, onSubmit);
  return (
    <>
      {listen && say && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <button type="button" className="listen-btn" aria-label={T.t('listen')} onClick={play}><Glyph name="speaker" size={64} /></button>
          {(!canVoice || showText) ? <div className="bubble">{say.text}</div> : <button type="button" className="link-btn" onClick={() => setShowText(true)}>{T.t('showText')}</button>}
        </div>
      )}
      <div className={`opts ${opts.some((o) => T.tx(o).length > 28) ? 'one-col' : ''}`}>
        {opts.map((o, i) => {
          const isGood = revealed && i === round.answer; const isBad = revealed && given === i && i !== round.answer;
          return (
            <button key={i} type="button" disabled={revealed} className={`opt ${isGood ? 'good' : ''} ${isBad ? 'bad' : ''} ${revealed && !isGood && !isBad ? 'dim' : ''}`} onClick={() => onSubmit(i)}>
              <span className="key">{isGood ? <Glyph name="check" size={20} /> : isBad ? <Glyph name="close" size={18} /> : i + 1}</span>
              <span>{T.tx(o)}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ---------------- Điền chỗ trống ----------------
export function FillBlank({ round, T, onSubmit, revealed, given }: StepProps) {
  const opts = round.options ?? [];
  const text = T.tx(round.prompt);
  const [a, b] = text.includes('___') ? text.split('___') : [text + ' ', ''];
  const chosen = typeof given === 'number' ? opts[given] : null;
  const good = revealed && given === round.answer;
  useKeyPick(opts.length, !revealed, onSubmit);
  return (
    <>
      <div className="blank-sent">{a}<span className={`blank-slot ${chosen ? 'filled' : ''} ${revealed ? (good ? 'good' : 'bad') : ''}`}>{chosen ? T.tx(chosen) : ' ? '}</span>{b}</div>
      <div className="chip-row">
        {opts.map((o, i) => <button key={i} type="button" className="word-chip" disabled={revealed} onClick={() => onSubmit(i)}>{T.tx(o)}</button>)}
      </div>
    </>
  );
}

// ---------------- Đúng / Sai (vuốt thẻ) ----------------
export function TrueFalse({ round, T, onSubmit, revealed, given }: StepProps) {
  const [dx, setDx] = useState(0); const [out, setOut] = useState<'' | 'l' | 'r'>('');
  const start = useRef<number | null>(null);
  const submit = (v: boolean) => { if (revealed) return; setOut(v ? 'r' : 'l'); setTimeout(() => onSubmit(v), 220); };
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') submit(true); if (e.key === 'ArrowLeft') submit(false); };
    addEventListener('keydown', f); return () => removeEventListener('keydown', f);
  });
  useEffect(() => { setOut(''); setDx(0); }, [round.id]);
  const good = revealed && given === round.answer;
  return (
    <>
      <div
        className={`tf-card ${out && !revealed ? `out-${out}` : ''}`}
        style={{ transform: !out && dx ? `translateX(${dx}px) rotate(${dx / 18}deg)` : undefined, boxShadow: revealed ? `0 8px 0 ${good ? 'var(--lime-3)' : 'var(--coral-d)'}, 0 0 0 5px ${good ? 'var(--lime-2)' : 'var(--coral)'}` : undefined }}
        onPointerDown={(e) => { if (revealed) return; start.current = e.clientX; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
        onPointerMove={(e) => { if (start.current !== null) setDx(e.clientX - start.current); }}
        onPointerUp={() => { if (start.current === null) return; start.current = null; if (Math.abs(dx) > 110) submit(dx > 0); else setDx(0); }}
      >
        {T.tx(round.prompt)}
      </div>
      <p className="muted" style={{ textAlign: 'center', margin: 0, fontWeight: 800 }}>{T.t('swipeHint')}</p>
      <div className="tf-btns">
        <Btn tone="orange" icon={<Glyph name="close" size={22} />} disabled={revealed} onClick={() => submit(false)}>{T.t('falseWord')}</Btn>
        <Btn tone="lime" icon={<Glyph name="check" size={24} />} disabled={revealed} onClick={() => submit(true)}>{T.t('trueWord')}</Btn>
      </div>
    </>
  );
}

// ---------------- Nối cặp ----------------
export function Match({ round, T, onSubmit }: StepProps) {
  const pairs = round.pairs ?? [];
  const left = useMemo(() => shuffleLocal(pairs.map((_, i) => i)), [round.id]); // eslint-disable-line
  const right = useMemo(() => shuffleLocal(pairs.map((_, i) => i)), [round.id]); // eslint-disable-line
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [bad, setBad] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
  useLayoutEffect(() => {
    const w = wrap.current; if (!w) return;
    const box = w.getBoundingClientRect();
    setLines(done.map((i) => {
      const a = w.querySelector(`[data-l="${i}"]`)!.getBoundingClientRect(); const b = w.querySelector(`[data-r="${i}"]`)!.getBoundingClientRect();
      return { x1: a.right - box.left, y1: a.top + a.height / 2 - box.top, x2: b.left - box.left, y2: b.top + b.height / 2 - box.top };
    }));
  }, [done]);
  const pickRight = (i: number, el: HTMLElement) => {
    if (sel === null || done.includes(i)) return;
    if (sel === i) {
      sfx.correct(); burstAt(el, 'sparkle', 10);
      const nd = [...done, i]; setDone(nd); setSel(null);
      if (nd.length === pairs.length) setTimeout(() => onSubmit(mistakes), 500);
    } else { sfx.wrong(); setMistakes((m) => m + 1); setBad(i); setTimeout(() => setBad(null), 450); }
  };
  return (
    <>
      <p className="muted" style={{ textAlign: 'center', margin: 0, fontWeight: 800 }}>{T.t('matchHint')} · {T.t('mistakes', { n: mistakes })}</p>
      <div className="match-wrap" ref={wrap}>
        <svg className="match-svg" width="100%" height="100%">
          {lines.map((l, k) => <path key={k} d={`M${l.x1} ${l.y1} C${(l.x1 + l.x2) / 2} ${l.y1} ${(l.x1 + l.x2) / 2} ${l.y2} ${l.x2} ${l.y2}`} stroke="#98AE25" strokeWidth="6" fill="none" strokeLinecap="round" />)}
        </svg>
        {left.map((li, k) => {
          const ri = right[k];
          return [
            <button key={`l${li}`} data-l={li} type="button" className={`match-card ${sel === li ? 'sel' : ''} ${done.includes(li) ? 'done' : ''}`} disabled={done.includes(li)} onClick={() => { sfx.tap(); setSel(li); }}>{T.tx(pairs[li][0])}</button>,
            <button key={`r${ri}`} data-r={ri} type="button" className={`match-card ${done.includes(ri) ? 'done' : ''} ${bad === ri ? 'bad' : ''}`} disabled={done.includes(ri)} onClick={(e) => pickRight(ri, e.currentTarget)}>{T.tx(pairs[ri][1])}</button>,
          ];
        })}
      </div>
    </>
  );
}

// ---------------- Lật thẻ trí nhớ ----------------
export function Memory({ round, T, onSubmit }: StepProps) {
  const pairs = round.pairs ?? [];
  const cards = useMemo(() => shuffleLocal(pairs.flatMap((p, i) => [{ k: `${i}a`, pid: i, text: p[0] }, { k: `${i}b`, pid: i, text: p[1] }])), [round.id]); // eslint-disable-line
  const [up, setUp] = useState<number[]>([]);
  const [done, setDone] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const lock = useRef(false);
  const flip = (idx: number, el: HTMLElement) => {
    if (lock.current || up.includes(idx) || done.includes(cards[idx].pid)) return;
    sfx.tap();
    const nu = [...up, idx]; setUp(nu);
    if (nu.length === 2) {
      lock.current = true;
      const [a, b] = nu;
      if (cards[a].pid === cards[b].pid) {
        setTimeout(() => { sfx.correct(); burstAt(el, 'stars', 10); const nd = [...done, cards[a].pid]; setDone(nd); setUp([]); lock.current = false; if (nd.length === pairs.length) setTimeout(() => onSubmit(mistakes), 450); }, 380);
      } else {
        setTimeout(() => { sfx.wrong(); setMistakes((m) => m + 1); setUp([]); lock.current = false; }, 850);
      }
    }
  };
  return (
    <>
      <p className="muted" style={{ textAlign: 'center', margin: 0, fontWeight: 800 }}>{T.t('memoryHint')} · {T.t('mistakes', { n: mistakes })}</p>
      <div className="mem-grid" style={{ gridTemplateColumns: cards.length <= 8 ? 'repeat(4, 1fr)' : undefined }}>
        {cards.map((c, i) => (
          <button key={c.k} type="button" className={`mem-card ${up.includes(i) ? 'up' : ''} ${done.includes(c.pid) ? 'done' : ''}`} onClick={(e) => flip(i, e.currentTarget)} aria-label={up.includes(i) || done.includes(c.pid) ? T.tx(c.text) : '?'}>
            <span className="mem-face mem-back"><Glyph name="flower" size={40} /></span>
            <span className="mem-face mem-front">{T.tx(c.text)}</span>
          </button>
        ))}
      </div>
    </>
  );
}

// ---------------- Sắp xếp ----------------
export function SortOrder({ round, T, onSubmit, revealed }: StepProps) {
  const items = (round.items ?? []) as { vi: string; en: string }[];
  const [order, setOrder] = useState<number[]>(() => { let o = shuffleLocal(items.map((_, i) => i)); let k = 0; while (o.every((v, i) => v === i) && k++ < 10) o = shuffleLocal(o); return o; });
  const [drag, setDrag] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const move = (from: number, to: number) => { if (to < 0 || to >= order.length) return; const o = order.slice(); const [x] = o.splice(from, 1); o.splice(to, 0, x); setOrder(o); sfx.tap(); };
  const onMove = (e: React.PointerEvent) => {
    if (drag === null || !listRef.current) return;
    const kids = Array.from(listRef.current.children) as HTMLElement[];
    const idx = kids.findIndex((k) => { const r = k.getBoundingClientRect(); return e.clientY >= r.top && e.clientY <= r.bottom; });
    if (idx >= 0 && idx !== drag) { move(drag, idx); setDrag(idx); }
  };
  return (
    <>
      <p className="muted" style={{ textAlign: 'center', margin: 0, fontWeight: 800 }}>{T.t('sortHint')}</p>
      <div className="sort-list" ref={listRef} onPointerMove={onMove} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}>
        {order.map((oi, pos) => (
          <div key={oi} className={`sort-item ${drag === pos ? 'drag' : ''} ${revealed ? (oi === pos ? 'good' : 'bad') : ''}`} onPointerDown={(e) => { if (revealed) return; (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); setDrag(pos); }}>
            <span className="num">{pos + 1}</span>
            <span className="txt">{T.tx(items[oi])}</span>
            {!revealed && <span className="arrows">
              <button type="button" aria-label="up" onPointerDown={(e) => e.stopPropagation()} onClick={() => move(pos, pos - 1)}><Glyph name="up" size={18} /></button>
              <button type="button" aria-label="down" onPointerDown={(e) => e.stopPropagation()} onClick={() => move(pos, pos + 1)}><Glyph name="down" size={18} /></button>
            </span>}
          </div>
        ))}
      </div>
      {!revealed && <div style={{ textAlign: 'center' }}><Btn tone="lime" onClick={() => onSubmit(order)}>{T.t('check')}</Btn></div>}
    </>
  );
}

// ---------------- Ghép chữ ----------------
export function WordBuilder({ round, T, onSubmit, revealed, given }: StepProps) {
  const tiles = round.tiles ?? [];
  const [slots, setSlots] = useState<string[]>([]);
  const used = new Set(slots);
  const word = slots.map((id) => tiles.find((t) => t.id === id)?.ch ?? '').join('');
  useEffect(() => { if (slots.length === tiles.length && !revealed) { const id = setTimeout(() => onSubmit(word), 350); return () => clearTimeout(id); } }, [slots]); // eslint-disable-line
  const good = revealed && typeof given === 'string' && given.normalize('NFC').toLowerCase() === String(round.answer).normalize('NFC').toLowerCase();
  return (
    <>
      <p className="muted" style={{ textAlign: 'center', margin: 0, fontWeight: 800 }}>{T.t('wordHint')}</p>
      <div className="word-slots">
        {tiles.map((_, i) => {
          const id = slots[i]; const ch = id ? tiles.find((t) => t.id === id)?.ch : '';
          return <button key={i} type="button" className={`word-slot ${id ? 'filled' : ''} ${revealed ? (good ? 'good' : 'bad') : ''}`} disabled={revealed || !id} onClick={() => { sfx.tap(); setSlots(slots.filter((_, k) => k !== i)); }}>{ch}</button>;
        })}
      </div>
      <div className="tile-row">
        {tiles.map((t) => <button key={t.id} type="button" className="tile" disabled={revealed || used.has(t.id)} onClick={() => { sfx.pop(); setSlots([...slots, t.id]); }}>{t.ch}</button>)}
      </div>
      {!revealed && slots.length > 0 && <div style={{ textAlign: 'center' }}><button type="button" className="link-btn" onClick={() => setSlots([])}><Glyph name="refresh" size={18} /> {T.t('retry')}</button></div>}
    </>
  );
}

// ---------------- Xem đồng hồ ----------------
export function ClockGame({ round, T, onSubmit, revealed }: StepProps) {
  const [h, setH] = useState(12); const [m, setM] = useState(0);
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef<'h' | 'm' | null>(null);
  const angle = (e: React.PointerEvent) => { const r = svg.current!.getBoundingClientRect(); const x = e.clientX - (r.left + r.width / 2); const y = e.clientY - (r.top + r.height / 2); return ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360; };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current || revealed) return;
    const a = angle(e);
    if (dragging.current === 'm') { const nm = (Math.round(a / 30) * 5) % 60; if (nm !== m) { setM(nm); sfx.tap(); } }
    else { const nh = Math.round(a / 30) % 12 || 12; if (nh !== h) { setH(nh); sfx.tap(); } }
  };
  const hourA = ((h % 12) + m / 60) * 30; const minA = m * 6;
  const target = `${round.h}:${String(round.m).padStart(2, '0')}`;
  return (
    <>
      <p className="muted" style={{ textAlign: 'center', margin: 0, fontWeight: 800 }}>{T.t('clockHint')}</p>
      <div className="clock-wrap">
        <div className="clock-target title-out">{target}</div>
        <svg ref={svg} className="clock-svg" viewBox="0 0 300 300" onPointerMove={onMove} onPointerUp={() => (dragging.current = null)} onPointerLeave={() => (dragging.current = null)}>
          <circle cx="150" cy="150" r="140" fill="#B57A52" />
          <circle cx="150" cy="150" r="128" fill="#FCF7F3" />
          {Array.from({ length: 60 }, (_, i) => <line key={i} x1="150" y1={i % 5 ? 30 : 28} x2="150" y2={i % 5 ? 36 : 44} stroke="#BBA8A6" strokeWidth={i % 5 ? 2 : 4} transform={`rotate(${i * 6} 150 150)`} />)}
          {Array.from({ length: 12 }, (_, i) => { const a = ((i + 1) * 30 * Math.PI) / 180; return <text key={i} x={150 + Math.sin(a) * 92} y={150 - Math.cos(a) * 92 + 11} textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="30" fill="#5E4A4C">{i + 1}</text>; })}
          <g className="hand" transform={`rotate(${hourA} 150 150)`} onPointerDown={(e) => { dragging.current = 'h'; (e.currentTarget.ownerSVGElement as SVGSVGElement).setPointerCapture(e.pointerId); }}>
            <line x1="150" y1="150" x2="150" y2="84" stroke="#7B6668" strokeWidth="14" strokeLinecap="round" />
            <line x1="150" y1="150" x2="150" y2="60" stroke="transparent" strokeWidth="44" />
          </g>
          <g className="hand" transform={`rotate(${minA} 150 150)`} onPointerDown={(e) => { dragging.current = 'm'; (e.currentTarget.ownerSVGElement as SVGSVGElement).setPointerCapture(e.pointerId); }}>
            <line x1="150" y1="150" x2="150" y2="44" stroke="#E2804F" strokeWidth="9" strokeLinecap="round" />
            <line x1="150" y1="150" x2="150" y2="34" stroke="transparent" strokeWidth="40" />
          </g>
          <circle cx="150" cy="150" r="11" fill="#5E4A4C" />
        </svg>
        <div className="clock-ctrl">
          <div className="row"><Btn tone="gray" size="sm" onClick={() => setH(((h + 10) % 12) + 1)} disabled={revealed}>−</Btn><span>{h} h</span><Btn tone="gray" size="sm" onClick={() => setH((h % 12) + 1)} disabled={revealed}>+</Btn></div>
          <div className="row"><Btn tone="gray" size="sm" onClick={() => setM((m + 55) % 60)} disabled={revealed}>−</Btn><span>{String(m).padStart(2, '0')} ph</span><Btn tone="gray" size="sm" onClick={() => setM((m + 5) % 60)} disabled={revealed}>+</Btn></div>
          {!revealed && <Btn tone="lime" onClick={() => onSubmit([h, m])}>{T.t('check')}</Btn>}
        </div>
      </div>
    </>
  );
}

// ---------------- Hứng đồ ----------------
export function CatchFall({ round, T, onSubmit }: StepProps) {
  const items = (round.items ?? []) as { t: { vi: string; en: string }; ok: boolean }[];
  const arena = useRef<HTMLDivElement>(null);
  const basket = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const [score, setScore] = useState({ hits: 0, wrong: 0 });
  const bx = useRef(50);
  useEffect(() => {
    const ar = arena.current!; let raf = 0; const t0 = performance.now();
    const SPAWN = 1500, FALL = 4300;
    const st = items.map((_, i) => ({ x: 12 + ((i * 37) % 76), start: i * SPAWN + 600, done: false }));
    let hits = 0, wrong = 0;
    const tick = (now: number) => {
      const H = ar.clientHeight, W = ar.clientWidth; const t = now - t0;
      st.forEach((s, i) => {
        const el = els.current[i]; if (!el || s.done) return;
        const k = (t - s.start) / FALL;
        if (k < 0) { el.style.opacity = '0'; return; }
        el.style.opacity = '1';
        const y = k * (H + 40) - 40;
        el.style.transform = `translate(-50%, ${y}px) rotate(${Math.sin(k * 6 + i) * 6}deg)`;
        el.style.left = `${s.x}%`;
        const by = H - 100;
        if (y > by - 30 && y < by + 20 && Math.abs((s.x - bx.current) / 100 * W) < 85) {
          s.done = true;
          if (items[i].ok) { hits++; sfx.correct(); el.classList.add('hit-ok'); burstAt(el, 'stars', 8); } else { wrong++; sfx.wrong(); el.classList.add('hit-bad'); }
          setScore({ hits, wrong }); setTimeout(() => { el.style.opacity = '0'; }, 200);
        } else if (y > H) { s.done = true; el.style.opacity = '0'; }
      });
      if (st.every((s) => s.done)) { setTimeout(() => onSubmit({ hits, wrong }), 400); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const key = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') bx.current = Math.max(6, bx.current - 7); if (e.key === 'ArrowRight') bx.current = Math.min(94, bx.current + 7); if (basket.current) basket.current.style.left = `${bx.current}%`; };
    addEventListener('keydown', key);
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', key); };
  }, [round.id]); // eslint-disable-line
  const move = (e: React.PointerEvent) => { const r = arena.current!.getBoundingClientRect(); bx.current = Math.max(6, Math.min(94, ((e.clientX - r.left) / r.width) * 100)); if (basket.current) basket.current.style.left = `${bx.current}%`; };
  return (
    <div className="arena" ref={arena} onPointerMove={move} onPointerDown={move}>
      <div className="arena-hud"><span>{T.t('hits', { n: score.hits })}</span><span>{T.t('mistakes', { n: score.wrong })}</span></div>
      {items.map((it, i) => <div key={i} ref={(el) => { els.current[i] = el; }} className="faller" style={{ opacity: 0 }}>{T.tx(it.t)}</div>)}
      <div className="basket" ref={basket} style={{ left: '50%' }}>
        <svg viewBox="0 0 150 90" width="150" height="90"><ellipse cx="75" cy="84" rx="60" ry="6" fill="#000" opacity=".12" /><path d="M8 18h134l-14 62H22z" fill="#C88A60" /><path d="M8 18h134v10H8z" fill="#B57A52" /><path d="M30 34l8 40M55 34l3 40M80 34v40M105 34l-3 40M128 34l-8 40" stroke="#A86F48" strokeWidth="4" /></svg>
      </div>
    </div>
  );
}

// ---------------- Đoạn văn đọc hiểu ----------------
export function Passage({ round, T }: { round: Round; T: T }) {
  if (!round.passage) return null;
  return (
    <div className="passage" tabIndex={0} aria-label={T.t('passage')}>
      <div className="passage-tag"><Glyph name="book" size={18} /> {T.t('passage')}</div>
      {T.tx(round.passage).split(' / ').map((line, i, all) => <p key={i} className={all.length > 1 ? 'verse' : ''}>{line}</p>)}
    </div>
  );
}

// ---------------- Tự điền đáp án ----------------
const PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', ','];
export function TypeAnswer({ round, T, onSubmit, revealed, given }: StepProps) {
  const [val, setVal] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const numeric = !!round.numeric;
  const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  useEffect(() => { setVal(''); const id = setTimeout(() => input.current?.focus({ preventScroll: true }), 120); return () => clearTimeout(id); }, [round.id]);
  const send = () => { if (!revealed && val.trim()) { sfx.tap(); onSubmit(val); } };
  const key = (k: string) => { if (revealed) return; sfx.tap(); setVal((v) => (k === '⌫' ? v.slice(0, -1) : (v + k).slice(0, 24))); };
  const q = revealed ? gradeRound(round, given) : 0;
  const unit = round.unit ? T.tx(round.unit) : '';
  return (
    <div className="type-wrap">
      <form className={`type-row ${revealed ? (q >= 1 ? 'good' : q >= 0.5 ? 'half' : 'bad') : ''}`} onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input ref={input} className="type-input" value={revealed && typeof given === 'string' ? given : val} disabled={revealed} maxLength={24}
          inputMode={numeric && touch ? 'none' : numeric ? 'decimal' : 'text'} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} enterKeyHint="done"
          placeholder={T.t('typePlaceholder')} aria-label={T.t('typePlaceholder')} onChange={(e) => setVal(e.target.value.slice(0, 24))} />
        {unit && <span className="type-unit">{unit}</span>}
        {!revealed && <Btn tone="lime" type="submit" disabled={!val.trim()}>{T.t('check')}</Btn>}
      </form>
      {String(round.answer).includes('/') && !revealed && <p className="muted type-note">{T.t('typeFraction')}</p>}
      {numeric && !revealed && (
        <div className="keypad" role="group">
          {PAD.map((k) => <button key={k} type="button" className="key-btn" onClick={() => key(k)}>{k === '-' ? '−' : k}</button>)}
          <button type="button" className="key-btn wide" onClick={() => key('/')}>/</button>
          <button type="button" className="key-btn wide" aria-label="xoá" onClick={() => key('⌫')}>⌫</button>
        </div>
      )}
    </div>
  );
}

// ---------------- Chọn nhiều đáp án ----------------
export function MultiPick({ round, T, onSubmit, revealed, given }: StepProps) {
  const opts = round.options ?? [];
  const [sel, setSel] = useState<number[]>([]);
  useEffect(() => setSel([]), [round.id]);
  const right = new Set(Array.isArray(round.answer) ? round.answer : []);
  const picked = revealed && Array.isArray(given) ? new Set(given as number[]) : new Set(sel);
  const toggle = (i: number) => { if (revealed) return; sfx.tap(); setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i])); };
  useEffect(() => {
    if (revealed) return;
    const f = (e: KeyboardEvent) => { const i = Number(e.key) - 1; if (Number.isInteger(i) && i >= 0 && i < opts.length) toggle(i); if (e.key === 'Enter' && sel.length) { e.preventDefault(); onSubmit(sel); } };
    addEventListener('keydown', f); return () => removeEventListener('keydown', f);
  });
  const long = opts.some((o) => T.tx(o).length > 22);
  return (
    <>
      <p className="muted" style={{ textAlign: 'center', margin: 0, fontWeight: 800 }}>{T.t('multiHint')} · {T.t('multiPicked', { n: picked.size })}</p>
      <div className={`opts multi ${long ? 'one-col' : opts.length > 4 ? 'three-col' : ''}`}>
        {opts.map((o, i) => {
          const on = picked.has(i);
          const cls = revealed ? (right.has(i) ? (on ? 'good' : 'missed') : on ? 'bad' : 'dim') : on ? 'on' : '';
          return (
            <button key={i} type="button" role="checkbox" aria-checked={on} disabled={revealed} className={`opt ${cls}`} onClick={() => toggle(i)}>
              <span className="key box">{on || (revealed && right.has(i)) ? <Glyph name={revealed && !right.has(i) ? 'close' : 'check'} size={20} /> : i + 1}</span>
              <span>{T.tx(o)}</span>
            </button>
          );
        })}
      </div>
      {!revealed && <div style={{ textAlign: 'center' }}><Btn tone="lime" disabled={!sel.length} onClick={() => onSubmit(sel)}>{T.t('check')}</Btn></div>}
    </>
  );
}
