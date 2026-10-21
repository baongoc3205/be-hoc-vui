// Bảng tương tác trong Góc lý thuyết: cửu chương, bảng cộng, số nguyên tố, bình phương, 20 nguyên tố, trục số.
import { useState } from 'react';
import { sfx } from '../lib/sfx';
import { speak } from '../lib/speech';

type Tr = (vi: string, en: string) => string;
const R = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Bảng nhân hoặc bảng cộng dạng lưới, chạm vào ô để xem phép tính, có chế độ che đáp án. */
export function OpTable({ op, tr, lang }: { op: 'x' | '+'; tr: Tr; lang: 'vi' | 'en' }) {
  const lo = op === 'x' ? 1 : 0;
  const nums = R(op === 'x' ? 10 : 11).map((i) => i + lo);
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [focus, setFocus] = useState<number | null>(op === 'x' ? 2 : null);
  const [hide, setHide] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const calc = (a: number, b: number) => (op === 'x' ? a * b : a + b);
  const sym = op === 'x' ? '×' : '+';
  const tap = (a: number, b: number) => {
    sfx.tap(); setSel([a, b]); setSeen((s) => new Set(s).add(`${a},${b}`));
    speak(lang === 'vi' ? `${a} ${op === 'x' ? 'nhân' : 'cộng'} ${b} bằng ${calc(a, b)}` : `${a} ${op === 'x' ? 'times' : 'plus'} ${b} is ${calc(a, b)}`, lang);
  };
  const show = (a: number, b: number) => !hide || seen.has(`${a},${b}`);
  return (
    <div className="tw-op">
      <div className="tw-bar">
        <div className="tw-say" aria-live="polite">{sel ? <>{sel[0]} {sym} {sel[1]} = <b>{calc(sel[0], sel[1])}</b></> : tr('Chạm vào một ô', 'Tap a cell')}</div>
        <label className="tw-toggle"><input type="checkbox" checked={hide} onChange={(e) => { setHide(e.target.checked); setSeen(new Set()); }} /> {tr('Che đáp án', 'Hide answers')}</label>
      </div>
      <div className="tw-grid-wrap">
        <table className="tw-grid">
          <thead><tr><th>{sym}</th>{nums.map((b) => <th key={b} className={sel?.[1] === b ? 'hl' : ''}>{b}</th>)}</tr></thead>
          <tbody>{nums.map((a) => (
            <tr key={a} className={focus === a ? 'focus' : ''}><th className={sel?.[0] === a ? 'hl' : ''} onClick={() => setFocus(focus === a ? null : a)}>{a}</th>
              {nums.map((b) => <td key={b} className={`${sel && (sel[0] === a || sel[1] === b) ? 'line' : ''} ${sel?.[0] === a && sel?.[1] === b ? 'on' : ''}`} onClick={() => tap(a, b)}>{show(a, b) ? calc(a, b) : '?'}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {op === 'x' && (
        <div className="tw-focus">
          <div className="chips">{nums.slice(1).map((n) => <button key={n} type="button" className={`chip ${focus === n ? 'on' : ''}`} onClick={() => { sfx.tap(); setFocus(n); }}>{tr(`Bảng ${n}`, `${n}s`)}</button>)}</div>
          {focus && <div className="tw-list">{nums.map((b) => <button key={b} type="button" className={!show(focus, b) ? 'hid' : ''} onClick={() => tap(focus, b)}>{focus} × {b} = <b>{show(focus, b) ? focus * b : '?'}</b></button>)}</div>}
        </div>
      )}
    </div>
  );
}

const isPrime = (n: number) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
const factor = (n: number) => { const out: number[] = []; let x = n; for (let d = 2; x > 1; d++) while (x % d === 0) { out.push(d); x /= d; } return out; };

export function Primes({ tr }: { tr: Tr }) {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="tw-primes">
      <div className="tw-say" aria-live="polite">{sel == null ? tr('Ô màu là số nguyên tố. Chạm để xem.', 'Coloured cells are primes. Tap one.') : sel === 1 ? tr('1 không phải số nguyên tố.', '1 is not prime.') : isPrime(sel) ? tr(`${sel} là số nguyên tố.`, `${sel} is prime.`) : `${sel} = ${factor(sel).join(' × ')}`}</div>
      <div className="tw-hundred">{R(100).map((i) => i + 1).map((n) => <button key={n} type="button" className={`${isPrime(n) ? 'prime' : ''} ${sel === n ? 'on' : ''}`} onClick={() => { sfx.tap(); setSel(n); }}>{n}</button>)}</div>
    </div>
  );
}

export function Squares({ tr }: { tr: Tr }) {
  return (
    <div className="tw-grid-wrap">
      <table className="th-table tw-squares">
        <thead><tr><th>n</th>{R(15).map((i) => <th key={i}>{i + 1}</th>)}</tr></thead>
        <tbody>
          <tr><th>n²</th>{R(15).map((i) => <td key={i}>{(i + 1) ** 2}</td>)}</tr>
          <tr><th>n³</th>{R(15).map((i) => <td key={i}>{(i + 1) ** 3}</td>)}</tr>
        </tbody>
      </table>
      <p className="th-note">{tr('Đọc ngược hàng n²: √144 = 12, √225 = 15.', 'Read the n² row backwards: √144 = 12, √225 = 15.')}</p>
    </div>
  );
}

const ELEMENTS: [string, string, string, number][] = [
  ['H', 'Hiđro', 'Hydrogen', 1], ['He', 'Heli', 'Helium', 4], ['Li', 'Liti', 'Lithium', 7], ['Be', 'Beri', 'Beryllium', 9], ['B', 'Bo', 'Boron', 11],
  ['C', 'Cacbon', 'Carbon', 12], ['N', 'Nitơ', 'Nitrogen', 14], ['O', 'Oxi', 'Oxygen', 16], ['F', 'Flo', 'Fluorine', 19], ['Ne', 'Neon', 'Neon', 20],
  ['Na', 'Natri', 'Sodium', 23], ['Mg', 'Magie', 'Magnesium', 24], ['Al', 'Nhôm', 'Aluminium', 27], ['Si', 'Silic', 'Silicon', 28], ['P', 'Photpho', 'Phosphorus', 31],
  ['S', 'Lưu huỳnh', 'Sulfur', 32], ['Cl', 'Clo', 'Chlorine', 35.5], ['Ar', 'Agon', 'Argon', 40], ['K', 'Kali', 'Potassium', 39], ['Ca', 'Canxi', 'Calcium', 40],
];
const METAL = new Set(['Li', 'Be', 'Na', 'Mg', 'Al', 'K', 'Ca']);
const NOBLE = new Set(['He', 'Ne', 'Ar']);
export function Periodic({ tr, lang }: { tr: Tr; lang: 'vi' | 'en' }) {
  return (
    <>
      <div className="tw-periodic">{ELEMENTS.map(([sym, vi, en, m], i) => (
        <div key={sym} className={`el ${METAL.has(sym) ? 'metal' : NOBLE.has(sym) ? 'noble' : 'non'}`}><small>{i + 1}</small><b>{sym}</b><span>{lang === 'en' ? en : vi}</span><i>{m}</i></div>
      ))}</div>
      <p className="th-note"><span className="dot metal" /> {tr('Kim loại', 'Metal')} &nbsp; <span className="dot non" /> {tr('Phi kim', 'Non-metal')} &nbsp; <span className="dot noble" /> {tr('Khí hiếm', 'Noble gas')} · {tr('Số nhỏ: số hiệu nguyên tử; số dưới: nguyên tử khối.', 'Small number: atomic number; bottom: atomic mass.')}</p>
    </>
  );
}

/** Trục số minh hoạ tập nghiệm x op v. */
export function NumberLine({ op, v, label }: { op: string; v: number; label: string }) {
  const lo = v - 5, hi = v + 5, W = 520, pad = 30;
  const X = (n: number) => pad + ((n - lo) / (hi - lo)) * (W - pad * 2);
  const right = op === '>' || op === '>=';
  const closed = op === '>=' || op === '<=';
  return (
    <figure className="th-nl">
      <svg viewBox={`0 0 ${W} 70`} role="img" aria-label={label}>
        <rect x={right ? X(v) : pad - 10} y="22" width={right ? W - pad + 10 - X(v) : X(v) - pad + 10} height="16" rx="8" fill="#9DB88A" opacity=".55" />
        <path d={`M${pad - 14} 30H${W - pad + 14}`} stroke="#5E4A4C" strokeWidth="3" />
        <path d={`M${W - pad + 14} 30l-10 -6v12z`} fill="#5E4A4C" />
        {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((n) => <g key={n}><path d={`M${X(n)} 24v12`} stroke="#5E4A4C" strokeWidth="2" /><text x={X(n)} y="58" textAnchor="middle" fontSize="14" fontWeight="700" fill="#5E4A4C">{n}</text></g>)}
        <circle cx={X(v)} cy="30" r="8" fill={closed ? '#E2804F' : '#fff'} stroke="#E2804F" strokeWidth="3.5" />
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}
