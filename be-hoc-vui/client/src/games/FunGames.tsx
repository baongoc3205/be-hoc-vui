// Vui học kiểu mới: tia số, cân thăng bằng, bánh pizza phân số, đi chợ tính tiền, tìm lỗi sai, xếp câu, câu cá đáp án.
// Mỗi game nhận 1 vòng (round) và gọi onSubmit(given); máy chủ chấm lại bằng shared/logic.js → gradeRound.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { StepProps } from './StepGames';
import { sfx } from '../lib/sfx';
import { Btn } from '../ui/kit';
import { Glyph } from '../ui/Icons';

const fmtNum = (n: number, lang: string) => {
  const neg = n < 0; const s = String(Math.round(Math.abs(n) * 100) / 100);
  const [a, b] = s.split('.');
  const g = a.replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'vi' ? '.' : ',');
  return (neg ? '−' : '') + g + (b ? (lang === 'vi' ? ',' : '.') + b : '');
};
export const moneyText = (n: number, lang: string) => `${fmtNum(n, lang)} ${lang === 'vi' ? 'đồng' : 'dong'}`;
export { fmtNum };
const Hint = ({ children }: { children: React.ReactNode }) => <p className="muted fun-hint">{children}</p>;
const tr = (T: StepProps['T'], vi: string, en: string) => (T.lang === 'en' ? en : vi);

// ---------------- Tia số ----------------
export function NumberLine({ round, T, onSubmit, revealed, given }: StepProps) {
  const min = round.min ?? 0, max = round.max ?? 10, step = round.step ?? 1;
  const n = Math.round((max - min) / step);
  const [k, setK] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef(false);
  const X0 = 40, X1 = 600, W = X1 - X0;
  const xOf = (i: number) => X0 + (W * i) / n;
  const val = (i: number) => Math.round((min + i * step) * 100) / 100;
  const place = (e: React.PointerEvent) => {
    if (revealed) return;
    const r = svg.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 640;
    const i = Math.max(0, Math.min(n, Math.round(((x - X0) / W) * n)));
    if (i !== k) { setK(i); sfx.tap(); }
  };
  const targetI = Math.round(((round.target ?? 0) - min) / step);
  const givenI = revealed && typeof given === 'number' ? Math.round((given - min) / step) : k;
  const ok = revealed && givenI === targetI;
  const labels = new Set((round.labels ?? []).map((l) => Math.round((l - min) / step)));
  return (
    <>
      <Hint>{tr(T, 'Kéo hoặc chạm lên tia số để đặt mũi tên vào đúng chỗ, rồi bấm Kiểm tra.', 'Drag or tap the line to place the arrow, then press Check.')}</Hint>
      <div className="fun-card">
        <div className="nl-target title-out">{fmtNum(round.target ?? 0, T.lang)}</div>
        <svg ref={svg} className="nl-svg" viewBox="0 0 640 150" role="slider" aria-valuemin={min} aria-valuemax={max} aria-valuenow={k != null ? val(k) : undefined} tabIndex={0}
          onKeyDown={(e) => { if (revealed) return; if (e.key === 'ArrowRight') setK(Math.min(n, (k ?? 0) + 1)); if (e.key === 'ArrowLeft') setK(Math.max(0, (k ?? 0) - 1)); }}
          onPointerDown={(e) => { drag.current = true; svg.current!.setPointerCapture(e.pointerId); place(e); }} onPointerMove={(e) => drag.current && place(e)} onPointerUp={() => (drag.current = false)}>
          <rect x="0" y="0" width="640" height="150" fill="transparent" />
          <line x1={X0 - 20} y1="90" x2={X1 + 20} y2="90" stroke="#7B6668" strokeWidth="6" strokeLinecap="round" />
          <path d={`M${X1 + 26} 90l-12-8v16z`} fill="#7B6668" />
          {Array.from({ length: n + 1 }, (_, i) => {
            const big = labels.has(i) || n <= 20;
            return (<g key={i}>
              <line x1={xOf(i)} y1={big ? 74 : 80} x2={xOf(i)} y2={big ? 106 : 100} stroke="#7B6668" strokeWidth={labels.has(i) ? 5 : 3} strokeLinecap="round" />
              {(labels.has(i) || (n <= 10)) && <text x={xOf(i)} y="134" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize={labels.has(i) ? 24 : 18} fill={labels.has(i) ? '#4B3B3D' : '#9C8A8A'}>{fmtNum(val(i), T.lang)}</text>}
            </g>);
          })}
          {revealed && !ok && <g transform={`translate(${xOf(targetI)} 0)`}><path d="M0 62l-14-26h28z" fill="#8FBF4F" /><circle cx="0" cy="90" r="9" fill="#8FBF4F" /></g>}
          {givenI != null && <g transform={`translate(${xOf(givenI)} 0)`} className="nl-pin"><path d="M0 62l-16-30h32z" fill={revealed ? (ok ? '#8FBF4F' : '#E0786A') : '#E86A4A'} /><circle cx="0" cy="90" r="10" fill={revealed ? (ok ? '#8FBF4F' : '#E0786A') : '#E86A4A'} stroke="#fff" strokeWidth="3" />
            {!revealed && <text x="0" y="24" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="20" fill="#4B3B3D">{n > 10 ? '' : ''}</text>}</g>}
        </svg>
        {!revealed && <Btn tone="lime" disabled={k == null} onClick={() => k != null && onSubmit(val(k))}>{T.t('check')}</Btn>}
      </div>
    </>
  );
}

// ---------------- Cân thăng bằng ----------------
export function BalanceScale({ round, T, onSubmit, revealed, given }: StepProps) {
  const [w, setW] = useState<number | null>(revealed && typeof given === 'number' ? given : null);
  const a = (round.left ?? [null, 0])[1] ?? 0, b = (round.right ?? [0])[0] ?? 0;
  const op = round.op ?? '+';
  const leftVal = w == null ? (op === '+' ? a : 0) : op === '+' ? w + a : w * a;
  const tilt = leftVal === b ? 0 : leftVal > b ? -10 : 10; // âm = bên trái nặng hơn
  const choose = (x: number) => { if (revealed || w != null) return; sfx.pop(); setW(x); setTimeout(() => onSubmit(x), 900); };
  const sign = op === '+' ? '+' : '×';
  const weight = (v: number | null, x: number, key: string, tone = '#9FC3DD') => (
    <g key={key} transform={`translate(${x} 0)`}><path d="M-30 0h60l-8-44h-44z" fill={v == null ? '#FBF6F2' : tone} stroke={v == null ? '#C9B8B5' : 'none'} strokeWidth="3" strokeDasharray={v == null ? '6 5' : undefined} /><rect x="-10" y="-54" width="20" height="12" rx="5" fill={v == null ? '#E2D8D2' : '#7B6668'} />
      <text y="-14" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize={String(v ?? '?').length > 3 ? 16 : 22} fill="#4B3B3D">{v == null ? '?' : fmtNum(v, T.lang)}</text></g>
  );
  return (
    <>
      <Hint>{tr(T, 'Chọn quả cân bỏ vào ô trống để hai bên cân bằng.', 'Pick the weight that makes both sides balance.')}</Hint>
      <div className="fun-card">
        <svg className="bal-svg" viewBox="0 0 640 260" aria-hidden>
          <path d="M300 250h40l-10-150h-20z" fill="#B57A52" /><rect x="240" y="244" width="160" height="12" rx="6" fill="#9C6440" />
          <g className="bal-beam" style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '320px 100px' }}>
            <rect x="90" y="94" width="460" height="12" rx="6" fill="#7B6668" /><circle cx="320" cy="100" r="12" fill="#F2C14B" />
            <g style={{ transform: `translate(140px,106px) rotate(${-tilt}deg)` }}>
              <path d="M0 0l-60 70M0 0l60 70" stroke="#9C8A8A" strokeWidth="2.5" /><path d="M-80 70h160c0 16-30 24-80 24s-80-8-80-24z" fill="#D8C08E" />
              <g transform="translate(0 70)">{weight(w, -34, 'w', revealed ? (w === round.answer ? '#B9DE8C' : '#F2A79C') : '#F2D57E')}<text x="2" y="-18" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="22" fill="#4B3B3D">{sign}</text>{weight(a, 38, 'a')}</g>
            </g>
            <g style={{ transform: `translate(500px,106px) rotate(${-tilt}deg)` }}>
              <path d="M0 0l-60 70M0 0l60 70" stroke="#9C8A8A" strokeWidth="2.5" /><path d="M-80 70h160c0 16-30 24-80 24s-80-8-80-24z" fill="#D8C08E" />
              <g transform="translate(0 70)">{weight(b, 0, 'b', '#C2A9D6')}</g>
            </g>
          </g>
        </svg>
        <div className="bal-weights">
          {(round.weights ?? []).map((x) => {
            const good = revealed && x === round.answer, bad = revealed && x === given && x !== round.answer;
            return <button key={x} type="button" className={`bal-w ${good ? 'good' : ''} ${bad ? 'bad' : ''} ${w === x ? 'on' : ''}`} disabled={revealed || w != null} onClick={() => choose(x)}>{fmtNum(x, T.lang)}</button>;
          })}
        </div>
      </div>
    </>
  );
}

// ---------------- Bánh pizza phân số ----------------
export function Pizza({ round, T, onSubmit, revealed, given }: StepProps) {
  const parts = round.parts ?? 4;
  const [on, setOn] = useState<Set<number>>(new Set());
  const R = 120, C = 140;
  const wedge = (i: number) => {
    const a0 = (i / parts) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / parts) * Math.PI * 2 - Math.PI / 2;
    return `M${C} ${C}L${C + R * Math.cos(a0)} ${C + R * Math.sin(a0)}A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${C + R * Math.cos(a1)} ${C + R * Math.sin(a1)}z`;
  };
  const toggle = (i: number) => { if (revealed) return; sfx.pop(); const s = new Set(on); if (s.has(i)) s.delete(i); else s.add(i); setOn(s); };
  const ok = revealed && Number(given) === round.need;
  const dots = useMemo(() => Array.from({ length: parts * 2 }, (_, k) => { const i = Math.floor(k / 2); const a = ((i + 0.35 + (k % 2) * 0.3) / parts) * Math.PI * 2 - Math.PI / 2; const r = R * (k % 2 ? 0.45 : 0.72); return [C + r * Math.cos(a), C + r * Math.sin(a), i] as const; }), [parts]);
  return (
    <>
      <Hint>{tr(T, 'Chạm vào từng miếng bánh để tô màu, rồi bấm Kiểm tra.', 'Tap slices to colour them, then press Check.')}</Hint>
      <div className="fun-card pizza-card">
        <svg className="pizza-svg" viewBox="0 0 280 280" role="group" aria-label={tr(T, `Bánh chia ${parts} phần`, `Pizza cut into ${parts} slices`)}>
          <circle cx={C} cy={C} r={R + 12} fill="#E2B57A" />
          {Array.from({ length: parts }, (_, i) => (
            <path key={i} d={wedge(i)} className={`pz-slice ${on.has(i) ? 'on' : ''}`} fill={on.has(i) ? (revealed ? (ok ? '#F27B6E' : '#E9A06A') : '#F27B6E') : '#F8E3B8'} stroke="#E2B57A" strokeWidth="4" onClick={() => toggle(i)} role="checkbox" aria-checked={on.has(i)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } }} />
          ))}
          {dots.map(([x, y, i], k) => on.has(i) && <circle key={k} cx={x} cy={y} r="7" fill="#B5473F" pointerEvents="none" />)}
        </svg>
        <div className="pz-count title-out">{on.size}/{parts}</div>
        {!revealed && <Btn tone="lime" onClick={() => onSubmit(on.size)}>{T.t('check')}</Btn>}
      </div>
    </>
  );
}

// ---------------- Đi chợ tính tiền ----------------
const NOTE_COLOR: Record<number, string> = { 1000: '#C9B79C', 2000: '#B99A84', 5000: '#9FB3C9', 10000: '#D8B46A', 20000: '#8FB3D9', 50000: '#E39AAE', 100000: '#9DC08A' };
export function Market({ round, T, onSubmit, revealed, given }: StepProps) {
  const [tray, setTray] = useState<number[]>([]);
  const sum = tray.reduce((a, b) => a + b, 0);
  const target = round.target ?? 0;
  const ok = revealed && Array.isArray(given) && (given as number[]).reduce((a, b) => a + b, 0) === target;
  const note = (v: number, key: string | number, onClick?: () => void, disabled?: boolean) => (
    <button key={key} type="button" className="vnd-note" style={{ background: NOTE_COLOR[v] ?? '#ddd' }} disabled={disabled} onClick={onClick} aria-label={moneyText(v, T.lang)}>
      <span className="vnd-val">{fmtNum(v / 1000, T.lang)}<small>{T.lang === 'vi' ? '.000' : 'k'}</small></span>
    </button>
  );
  return (
    <>
      <Hint>{tr(T, 'Chọn các tờ tiền để trả ĐÚNG số tiền. Chạm tờ tiền trên khay để bỏ ra.', 'Pick notes to pay the EXACT amount. Tap a note on the tray to take it back.')}</Hint>
      <div className="fun-card market-card">
        <div className="mk-goods">{(round.goods ?? []).map((g, i) => <div key={i} className="mk-good"><span className="mk-ico" aria-hidden>{g.icon}</span><b>{T.tx(g.name)}</b><small>{moneyText(g.price, T.lang)}</small></div>)}</div>
        <div className={`mk-tray ${revealed ? (ok ? 'good' : 'bad') : ''}`}>
          <span className="mk-sum">{tr(T, 'Đã đưa:', 'Paid:')} <b>{moneyText(sum, T.lang)}</b>{!revealed && sum > target && <em> · {tr(T, 'nhiều quá rồi!', 'too much!')}</em>}</span>
          <div className="mk-notes">{tray.length ? tray.map((v, i) => note(v, `t${i}`, () => { if (!revealed) { sfx.tap(); setTray(tray.filter((_, k) => k !== i)); } }, revealed)) : <small className="muted">{tr(T, 'Khay đang trống', 'The tray is empty')}</small>}</div>
        </div>
        <div className="mk-wallet">{(round.notes ?? []).map((v) => note(v, v, () => { sfx.pop(); setTray([...tray, v]); }, revealed || tray.length >= 12))}</div>
        {!revealed && <div className="row-btns"><Btn tone="gray" size="sm" disabled={!tray.length} onClick={() => setTray([])}><Glyph name="refresh" size={16} /> {tr(T, 'Lấy lại', 'Clear')}</Btn><Btn tone="lime" disabled={!tray.length} onClick={() => onSubmit(tray)}>{T.t('check')}</Btn></div>}
      </div>
    </>
  );
}

// ---------------- Tìm lỗi sai ----------------
export function SpotMistake({ round, T, onSubmit, revealed, given }: StepProps) {
  const words = round.spot ?? [];
  return (
    <>
      <Hint>{tr(T, 'Đọc kỹ câu rồi chạm vào chữ bị sai.', 'Read carefully, then tap the wrong word.')}</Hint>
      <div className="fun-card">
        <div className="spot-line">
          {words.map((w, i) => {
            const good = revealed && i === round.answer, bad = revealed && i === given && i !== round.answer;
            return <button key={i} type="button" className={`spot-w ${good ? 'good' : ''} ${bad ? 'bad' : ''}`} disabled={revealed} onClick={() => { sfx.tap(); onSubmit(i); }}>
              {good ? <><s>{w}</s> <b>{round.fix}</b></> : w}
            </button>;
          })}
        </div>
      </div>
    </>
  );
}

// ---------------- Xếp câu ----------------
export function SentenceBuild({ round, T, onSubmit, revealed, given }: StepProps) {
  const words = round.words ?? [];
  const [slots, setSlots] = useState<string[]>([]);
  const used = new Set(slots);
  useEffect(() => { if (slots.length === words.length && words.length && !revealed) { const id = setTimeout(() => onSubmit(slots), 450); return () => clearTimeout(id); } }, [slots]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = revealed && Array.isArray(given) ? (given as string[]) : slots;
  const ok = revealed && shown.map((id) => words.find((w) => w.id === id)?.w).join(' ') === round.answer;
  return (
    <>
      <Hint>{tr(T, 'Chạm các mảnh chữ theo đúng thứ tự. Chạm lại trên dòng để bỏ ra.', 'Tap the words in order. Tap a word on the line to take it back.')}</Hint>
      <div className="fun-card">
        <div className={`sent-line ${revealed ? (ok ? 'good' : 'bad') : ''}`}>
          {shown.length ? shown.map((id, i) => <button key={id} type="button" className="sent-w placed" disabled={revealed} onClick={() => { sfx.tap(); setSlots(slots.filter((_, k) => k !== i)); }}>{words.find((w) => w.id === id)?.w}</button>) : <small className="muted">…</small>}
        </div>
        {revealed && !ok && <div className="sent-answer">✓ {String(round.answer)}</div>}
        <div className="sent-pool">{words.map((w) => <button key={w.id} type="button" className="sent-w" disabled={revealed || used.has(w.id)} onClick={() => { sfx.pop(); setSlots([...slots, w.id]); }}>{w.w}</button>)}</div>
      </div>
    </>
  );
}

// ---------------- Câu cá đáp án ----------------
const FISH = ['#F27B6E', '#9FC3DD', '#F2C14B', '#9CD3BE'];
export function Fishing({ round, T, onSubmit, revealed, given }: StepProps) {
  const opts = round.options ?? [];
  const [hook, setHook] = useState<number | null>(null);
  const catchIt = (i: number) => { if (revealed || hook != null) return; sfx.pop(); setHook(i); setTimeout(() => onSubmit(i), 750); };
  useEffect(() => {
    if (revealed) return;
    const f = (e: KeyboardEvent) => { const i = ['1', '2', '3', '4'].indexOf(e.key); if (i >= 0 && i < opts.length) catchIt(i); };
    addEventListener('keydown', f); return () => removeEventListener('keydown', f);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Hint>{tr(T, 'Chạm vào chú cá mang đáp án đúng để câu lên!', 'Tap the fish carrying the right answer!')}</Hint>
      <div className="fish-pond">
        <div className="fish-waves" aria-hidden />
        {opts.map((o, i) => {
          const good = revealed && i === round.answer, bad = revealed && i === given && i !== round.answer;
          return (
            <button key={i} type="button" disabled={revealed || hook != null} className={`fish lane${i} ${hook === i ? 'hooked' : ''} ${good ? 'good' : ''} ${bad ? 'bad' : ''}`} style={{ animationDelay: `${-i * 1.7}s` }} onClick={() => catchIt(i)}>
              <svg viewBox="0 0 120 60" className="fish-body" aria-hidden><path d="M100 30c0-16-22-26-46-26S10 14 10 30s20 26 44 26 46-10 46-26z" fill={FISH[i % 4]} /><path d="M98 30l20-18v36z" fill={FISH[i % 4]} /><circle cx="28" cy="24" r="5" fill="#3B3432" /><circle cx="27" cy="22.5" r="1.6" fill="#fff" /></svg>
              <span className="fish-txt"><i>{i + 1}</i>{T.tx(o)}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
