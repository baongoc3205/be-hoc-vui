// Cá ngựa — bé (màu Đỏ) đấu với 1–3 bot.
import { useEffect, useMemo, useRef, useState } from 'react';
import { makeRng } from '../../../../shared/logic.js';
import * as Lu from '../../../../shared/board/ludo.js';
import type { LudoEvent, LudoMove, LudoState } from '../../../../shared/board/ludo.js';
import type { Look } from '../../lib/types';
import { Btn } from '../../ui/kit';
import { sfx } from '../../lib/sfx';
import { Avatar, BOT_DELAY, botLook, type Level, type Tr } from './common';

export const HEX = ['#E0574F', '#5FAE6E', '#F2C14B', '#4F8FD6'];
const SOFT = ['#F6C9C4', '#CBE6CF', '#FBE7B3', '#C6DCF3'];
export const CNAME: [string, string][] = [['Đỏ', 'Red'], ['Xanh lá', 'Green'], ['Vàng', 'Yellow'], ['Xanh dương', 'Blue']];
const BOTS = ['Bo', 'Foxy', 'Kiwi'];
const CELL = 40;
// góc chuồng: [hàng, cột] góc trên trái của khu 6×6
const YARD: [number, number][] = [[0, 0], [0, 9], [9, 9], [9, 0]];
const SEATS: Record<number, number[]> = { 2: [0, 2], 3: [0, 1, 2], 4: [0, 1, 2, 3] };
const PIP: Record<number, [number, number][]> = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [0, 2], [2, 0], [2, 2]], 5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]], 6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]] };

export function Dice({ value, rolling }: { value: number | null; rolling?: boolean }) {
  const v = value ?? 6;
  return (
    <svg viewBox="0 0 60 60" className={`dice ${rolling ? 'rolling' : ''}`} aria-hidden>
      <rect x="3" y="3" width="54" height="54" rx="12" fill="#fff" stroke="#D6CFCB" strokeWidth="3" />
      {PIP[v].map(([r, c], k) => <circle key={k} cx={16 + c * 14} cy={16 + r * 14} r="5.5" fill={v === 1 ? '#E0574F' : '#4B3B3D'} />)}
    </svg>
  );
}

/** Toạ độ tâm (px) của ngựa. */
function spot(col: number, pos: number, k: number): [number, number] {
  const at = (r: number, c: number): [number, number] => [c * CELL + CELL / 2, r * CELL + CELL / 2];
  if (pos === -1) { const [r, c] = YARD[col]; return [(c + 2 + (k & 1) * 2) * CELL, (r + 2 + (k >> 1) * 2) * CELL]; }
  if (pos === Lu.FINISH) {
    const d = [[-1, 0], [0, -1], [1, 0], [0, 1]][col]; const side = (k - 1.5) * 13;
    return [7.5 * CELL + d[0] * 34 + (d[0] ? 0 : side), 7.5 * CELL + d[1] * 34 + (d[1] ? 0 : side)];
  }
  if (pos > 50) { const [r, c] = Lu.HOME[col][pos - 51]; return at(r, c); }
  const [r, c] = Lu.TRACK[Lu.cellOf(col, pos)!]; return at(r, c);
}

export function BoardSvg({ s, movable, onPick }: { s: LudoState; movable: LudoMove[]; onPick: (m: LudoMove) => void }) {
  const cells = [];
  for (let i = 0; i < 52; i++) {
    const [r, c] = Lu.TRACK[i];
    const startCol = Lu.START.indexOf(i);
    cells.push(<rect key={`t${i}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL} fill={startCol >= 0 ? HEX[startCol] : '#FFFDF9'} stroke="#D9CEC8" strokeWidth="1.5" />);
    if (Lu.SAFE.has(i) && startCol < 0) cells.push(<text key={`s${i}`} x={c * CELL + CELL / 2} y={r * CELL + CELL / 2 + 7} textAnchor="middle" fontSize="20" fill="#C9BBB5">★</text>);
  }
  Lu.HOME.forEach((h, col) => h.forEach(([r, c], k) => cells.push(<rect key={`h${col}${k}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL} fill={SOFT[col]} stroke="#D9CEC8" strokeWidth="1.5" />)));
  // xếp chồng ngựa cùng ô
  const groups = new Map<string, { col: number; k: number }[]>();
  for (const col of s.seats) s.pieces[col].forEach((pos, k) => { if (pos < 0 || pos === Lu.FINISH) return; const key = spot(col, pos, k).join(','); groups.set(key, [...(groups.get(key) ?? []), { col, k }]); });
  const offset = (col: number, k: number) => { const pos = s.pieces[col][k]; if (pos < 0 || pos === Lu.FINISH) return [0, 0]; const g = groups.get(spot(col, pos, k).join(','))!; if (g.length < 2) return [0, 0]; const i = g.findIndex((x) => x.col === col && x.k === k); return [(i - (g.length - 1) / 2) * 9, (i % 2) * -5]; };
  return (
    <svg viewBox={`0 0 ${CELL * 15} ${CELL * 15}`} className="ludo-board" role="img" aria-label="Ludo">
      <rect width={CELL * 15} height={CELL * 15} rx="18" fill="#F3E9E2" />
      {YARD.map(([r, c], col) => (
        <g key={col} opacity={s.seats.includes(col) ? 1 : 0.35}>
          <rect x={c * CELL + 4} y={r * CELL + 4} width={CELL * 6 - 8} height={CELL * 6 - 8} rx="20" fill={HEX[col]} />
          <rect x={c * CELL + CELL} y={r * CELL + CELL} width={CELL * 4} height={CELL * 4} rx="16" fill="#FFFDF9" />
          {[0, 1, 2, 3].map((k) => <circle key={k} cx={(c + 2 + (k & 1) * 2) * CELL} cy={(r + 2 + (k >> 1) * 2) * CELL} r="17" fill={SOFT[col]} stroke={HEX[col]} strokeWidth="2" />)}
        </g>
      ))}
      {cells}
      <g transform={`translate(${CELL * 6} ${CELL * 6})`}>
        <path d={`M0 0L${CELL * 1.5} ${CELL * 1.5}L0 ${CELL * 3}z`} fill={HEX[0]} />
        <path d={`M0 0L${CELL * 1.5} ${CELL * 1.5}L${CELL * 3} 0z`} fill={HEX[1]} />
        <path d={`M${CELL * 3} 0L${CELL * 1.5} ${CELL * 1.5}L${CELL * 3} ${CELL * 3}z`} fill={HEX[2]} />
        <path d={`M0 ${CELL * 3}L${CELL * 1.5} ${CELL * 1.5}L${CELL * 3} ${CELL * 3}z`} fill={HEX[3]} />
      </g>
      {s.seats.map((col) => s.pieces[col].map((pos, k) => {
        const [x, y] = spot(col, pos, k); const [dx, dy] = offset(col, k);
        const m = movable.find((mm) => mm.piece === k && Lu.current(s) === col);
        return (
          <g key={`${col}-${k}`} className={`horse ${m ? 'can' : ''}`} style={{ transform: `translate(${x + dx}px, ${y + dy}px)` }} onClick={m ? () => onPick(m) : undefined} role={m ? 'button' : undefined} aria-label={m ? `${CNAME[col][0]} ${k + 1}` : undefined}>
            {m && <circle r="19" fill="none" stroke="#fff" strokeWidth="4" className="horse-ring" />}
            <ellipse cy="12" rx="13" ry="4" fill="#3A2A2A" opacity=".2" />
            <path d="M-11 12c0-10 4-16 8-20-2-4 0-9 5-10l3 4c5 1 8 5 8 10l-5 2-3-3c0 6 2 11 5 17z" fill={HEX[col]} stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="3" cy="-8" r="1.8" fill="#3B3432" />
          </g>
        );
      }))}
    </svg>
  );
}

export function LudoGame({ players, level, exitOn, tr, me, onEnd }: { players: number; level: Level; exitOn: number[]; tr: Tr; me: { name: string; look: Look }; onEnd: (won: boolean) => void }) {
  const rnd = useRef(makeRng((Date.now() & 0xffffff) + 7)).current;
  const seats = SEATS[players] ?? SEATS[2];
  const [s, setS] = useState<LudoState>(() => Lu.newGame(seats, { exitOn }));
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState<number | null>(null);
  const [msg, setMsg] = useState(tr(`Bé cầm ngựa Đỏ. Gieo được ${exitOn.join(' hoặc ')} mới ra chuồng!`, `You are Red. Roll ${exitOn.join(' or ')} to leave the stable!`));
  const ended = useRef(false);
  const names = useMemo(() => Object.fromEntries(seats.map((c, i) => [c, i === 0 ? me.name : BOTS[i - 1]])), [seats, me.name]);
  const looks = useMemo(() => Object.fromEntries(seats.map((c, i) => [c, i === 0 ? me.look : botLook(i)])), [seats, me.look]);
  const cur = Lu.current(s);
  const human = cur === 0;
  const moves = Lu.legalMoves(s);

  const say = (ev: LudoEvent[], who: number) => {
    const lines: string[] = [];
    for (const e of ev) {
      if (e.t === 'capture') { lines.push(tr(`${names[who]} đá ngựa ${CNAME[e.victim!][0]} về chuồng!`, `${names[who]} sends a ${CNAME[e.victim!][1]} horse home!`)); sfx.whoosh(); }
      if (e.t === 'home') { lines.push(tr(`${names[who]} đưa 1 ngựa về đích!`, `${names[who]} gets a horse home!`)); sfx.star(); }
      if (e.t === 'three6') lines.push(tr(`${names[who]} gieo ba lần 6 liền — mất lượt!`, `${names[who]} rolled three 6s — turn lost!`));
      if (e.t === 'nomove') lines.push(tr(`${names[who]} không đi được nước nào.`, `${names[who]} can’t move.`));
      if (e.t === 'again') lines.push(tr(`${names[who]} được gieo thêm!`, `${names[who]} rolls again!`));
      if (e.t === 'win') lines.push(tr(`${names[who]} về đích đủ 4 ngựa — chiến thắng!`, `${names[who]} brings all 4 horses home — wins!`));
    }
    if (lines.length) setMsg(lines.join(' · '));
  };
  const doRoll = () => {
    if (rolling || s.dice != null || s.winner != null) return;
    setRolling(true); sfx.tap();
    const v = 1 + Math.floor(rnd() * 6);
    let n = 0;
    const iv = setInterval(() => { setFace(1 + Math.floor(Math.random() * 6)); if (++n >= 6) { clearInterval(iv); setFace(v); setRolling(false); const r = Lu.roll(s, v); setS(r.s); if (!r.events.length) setMsg(tr(`${names[cur]} gieo được ${v}.`, `${names[cur]} rolled ${v}.`)); say(r.events, cur); } }, 70);
  };
  const doMove = (m: LudoMove) => { sfx.pop(); const r = Lu.move(s, m); say(r.events, cur); setS(r.s); };

  // bot: gieo rồi đi
  useEffect(() => {
    if (s.winner != null || human || rolling) return;
    const t = setTimeout(() => {
      if (s.dice == null) doRoll();
      else { const m = Lu.botChoose(s, level, rnd); if (m) doMove(m); }
    }, BOT_DELAY);
    return () => clearTimeout(t);
  }, [s, rolling]); // eslint-disable-line react-hooks/exhaustive-deps
  // bé: chỉ có 1 nước thì tự đi
  useEffect(() => {
    if (!human || s.dice == null || rolling) return;
    if (moves.length === 1) { const t = setTimeout(() => doMove(moves[0]), 450); return () => clearTimeout(t); }
    if (moves.length > 1) setMsg(tr(`Bé gieo được ${s.dice}. Chạm vào con ngựa đang sáng để đi.`, `You rolled ${s.dice}. Tap a glowing horse to move.`));
  }, [s, rolling]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (s.winner == null || ended.current) return;
    ended.current = true; if (s.winner === 0) sfx.levelup(); else sfx.wrong();
    const t = setTimeout(() => onEnd(s.winner === 0), 1400); return () => clearTimeout(t);
  }, [s.winner]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ludo-game">
      <div className="ludo-wrap"><BoardSvg s={s} movable={human && !rolling ? moves : []} onPick={doMove} /></div>
      <div className="ludo-side">
        <div className="ludo-players">
          {seats.map((c) => (
            <div key={c} className={`bg-opp ${cur === c && s.winner == null ? 'active' : ''}`} style={{ borderColor: HEX[c] }}>
              <Avatar look={looks[c]} size={44} />
              <div className="bg-opp-info"><b style={{ color: HEX[c] }}>{names[c]}</b><span>{tr(`${s.pieces[c].filter((p) => p === Lu.FINISH).length}/4 về đích`, `${s.pieces[c].filter((p) => p === Lu.FINISH).length}/4 home`)}</span></div>
            </div>
          ))}
        </div>
        <button type="button" className={`dice-btn ${human && s.dice == null && !rolling && s.winner == null ? 'ready' : ''}`} disabled={!human || s.dice != null || rolling || s.winner != null} onClick={doRoll} aria-label={tr('Gieo xúc xắc', 'Roll the dice')}>
          <Dice value={face} rolling={rolling} />
          <span>{human && s.dice == null ? tr('Gieo!', 'Roll!') : `${names[cur]}`}</span>
        </button>
        <p className="bg-msg" aria-live="polite">{msg}</p>
        {human && s.dice != null && moves.length > 1 && <Btn tone="gray" size="sm" onClick={() => doMove(moves.reduce((a, b) => (b.to > a.to ? b : a)))}>{tr('Đi ngựa xa nhất', 'Move my lead horse')}</Btn>}
      </div>
    </div>
  );
}
