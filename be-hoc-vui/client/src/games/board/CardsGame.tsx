// Bài Màu Sắc (luật kiểu UNO) — bé đấu với 1–3 bot.
import { useEffect, useMemo, useRef, useState } from 'react';
import { makeRng } from '../../../../shared/logic.js';
import * as C from '../../../../shared/board/cards.js';
import type { Card, CardColor, CardsEvent, CardsState } from '../../../../shared/board/cards.js';
import type { Look } from '../../lib/types';
import { Btn } from '../../ui/kit';
import { sfx } from '../../lib/sfx';
import { Avatar, BOT_DELAY, botLook, type Level, type Tr } from './common';

const COLOR_HEX: Record<CardColor, string> = { red: '#E0574F', yellow: '#F2C14B', green: '#5FAE6E', blue: '#4F8FD6' };
const COLOR_NAME: Record<CardColor, [string, string]> = { red: ['Đỏ', 'Red'], yellow: ['Vàng', 'Yellow'], green: ['Xanh lá', 'Green'], blue: ['Xanh dương', 'Blue'] };
const BOTS = ['Mimi', 'Bo', 'Foxy'];

function face(v: string) { return v === 'skip' ? '⦸' : v === 'rev' ? '⇄' : v === 'wild' ? '✦' : v; }
export function CardView({ card, back, small, lift, dim, onClick, label }: { card?: Card; back?: boolean; small?: boolean; lift?: boolean; dim?: boolean; onClick?: () => void; label?: string }) {
  const cls = `pcard ${small ? 'small' : ''} ${lift ? 'lift' : ''} ${dim ? 'dim' : ''} ${back ? 'back' : card?.c ?? 'wild'}`;
  const inner = back ? <span className="pc-logo">★</span> : <><span className="pc-corner">{face(card!.v)}</span><span className="pc-mid">{face(card!.v)}</span></>;
  return onClick ? <button type="button" className={cls} onClick={onClick} aria-label={label}>{inner}</button> : <div className={cls} aria-hidden={!label}>{inner}</div>;
}

export function CardsGame({ players, level, tr, me, onEnd }: { players: number; level: Level; tr: Tr; me: { name: string; look: Look }; onEnd: (won: boolean) => void }) {
  const rnd = useRef(makeRng((Date.now() & 0xffffff) + 1)).current;
  const [s, setS] = useState<CardsState>(() => C.newGame(players, rnd));
  const [msg, setMsg] = useState(tr('Bé đi trước! Ra lá cùng màu hoặc cùng số với lá trên bàn.', 'You go first! Play a card matching the colour or number.'));
  const [called, setCalled] = useState(false);
  const [pickColor, setPickColor] = useState<number | null>(null);
  const ended = useRef(false);
  const names = useMemo(() => [me.name, ...BOTS].slice(0, players), [me.name, players]);
  const looks = useMemo(() => [me.look, botLook(0), botLook(3), botLook(1)].slice(0, players), [me.look, players]);
  const name = (p: number) => names[p];

  const describe = (e: CardsEvent): string | null => {
    switch (e.t) {
      case 'play': return e.card.c === null ? tr(`${name(e.p)} đổi màu sang ${COLOR_NAME[e.color][0]}`, `${name(e.p)} changes colour to ${COLOR_NAME[e.color][1]}`) : null;
      case 'draw': return tr(`${name(e.p)} phải bốc ${e.k} lá và mất lượt!`, `${name(e.p)} draws ${e.k} and loses a turn!`);
      case 'skip': return tr(`${name(e.p)} bị mất lượt!`, `${name(e.p)} is skipped!`);
      case 'rev': return players > 2 ? tr('Đổi chiều!', 'Reverse!') : null;
      case 'uno': return tr(`${name(e.p)}: “Một lá!”`, `${name(e.p)}: “Last card!”`);
      case 'forgot': return tr(`${name(e.p)} quên hô “Một lá!” — bốc phạt 2 lá`, `${name(e.p)} forgot to call “Last card!” — draws 2`);
      case 'win': return tr(`${name(e.p)} hết bài — thắng rồi!`, `${name(e.p)} is out of cards — wins!`);
      default: return null;
    }
  };
  const apply = (r: { s: CardsState; events: CardsEvent[] }) => {
    const lines = r.events.map(describe).filter(Boolean) as string[];
    if (lines.length) setMsg(lines.join(' · '));
    if (r.events.some((e) => e.t === 'draw' || e.t === 'forgot')) sfx.wrong(); else if (r.events.some((e) => e.t === 'play')) sfx.flip(); else sfx.tap();
    setS(r.s);
  };

  // lượt của bot
  useEffect(() => {
    if (s.winner !== null || s.turn === 0) return;
    const t = setTimeout(() => {
      const m = C.botMove(s, s.turn, level, rnd);
      if (m.type === 'play') apply(C.play(s, s.turn, m.idx, m.color, m.called, rnd));
      else if (m.type === 'draw') { setMsg(tr(`${name(s.turn)} bốc 1 lá`, `${name(s.turn)} draws a card`)); apply(C.draw(s, s.turn, rnd)); }
      else apply(C.pass(s, s.turn));
    }, BOT_DELAY);
    return () => clearTimeout(t);
  }, [s]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (s.winner === null || ended.current) return;
    ended.current = true;
    if (s.winner === 0) sfx.levelup(); else sfx.wrong();
    const t = setTimeout(() => onEnd(s.winner === 0), 1200);
    return () => clearTimeout(t);
  }, [s.winner]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (s.turn === 0 && s.drew === null) setMsg((m) => (m.includes('→') ? m : m)); setCalled(false); }, [s.turn]);

  const mine = s.hands[0];
  const ok = new Set(C.playable(s, 0));
  const myTurn = s.turn === 0 && s.winner === null;
  const doPlay = (idx: number, color: CardColor | null) => { setPickColor(null); apply(C.play(s, 0, idx, color, called, rnd)); };
  const tapCard = (idx: number) => {
    if (!myTurn || !ok.has(idx)) { sfx.wrong(); setMsg(myTurn ? tr('Lá này chưa ra được — cần cùng màu hoặc cùng số.', 'You can’t play that — match the colour or number.') : tr('Chưa tới lượt bé.', 'Not your turn yet.')); return; }
    if (mine[idx].c === null) setPickColor(idx); else doPlay(idx, null);
  };
  const t = C.top(s);

  return (
    <div className="cards-game">
      <div className="bg-opponents">
        {Array.from({ length: players - 1 }, (_, k) => k + 1).map((p) => (
          <div key={p} className={`bg-opp ${s.turn === p && s.winner === null ? 'active' : ''}`}>
            <Avatar look={looks[p]} size={50} />
            <div className="bg-opp-info"><b>{name(p)}</b><span>{tr(`${s.hands[p].length} lá`, `${s.hands[p].length} cards`)}</span></div>
            <div className="bg-fan">{s.hands[p].slice(0, 10).map((c) => <CardView key={c.id} back small />)}</div>
          </div>
        ))}
      </div>
      <div className="cards-table">
        <div className="cards-pile">
          <CardView back onClick={myTurn && s.drew === null ? () => apply(C.draw(s, 0, rnd)) : undefined} label={tr('Bốc bài', 'Draw')} lift={myTurn && s.drew === null && ok.size === 0} />
          <small>{tr('Nọc', 'Deck')} {s.deck.length}</small>
        </div>
        <div className="cards-discard"><CardView card={t} /></div>
        <div className="cards-state">
          <span className="cur-color" style={{ background: COLOR_HEX[s.color] }} title={tr(COLOR_NAME[s.color][0], COLOR_NAME[s.color][1])} />
          <span className="cur-dir" aria-label={tr('Chiều đánh', 'Direction')}>{s.dir === 1 ? '↻' : '↺'}</span>
        </div>
      </div>
      <p className="bg-msg" aria-live="polite">{myTurn ? `👉 ${tr('Lượt của bé', 'Your turn')} · ` : ''}{msg}</p>
      <div className={`bg-me ${myTurn ? 'active' : ''}`}>
        <div className="hand">{mine.map((c, i) => <CardView key={c.id} card={c} lift={myTurn && ok.has(i)} dim={myTurn && !ok.has(i)} onClick={() => tapCard(i)} label={`${c.c ?? 'wild'} ${c.v}`} />)}</div>
        <div className="bg-actions">
          {myTurn && mine.length === 2 && ok.size > 0 && <Btn tone={called ? 'lime' : 'orange'} size="sm" onClick={() => { sfx.pop(); setCalled(true); }}>{called ? tr('Đã hô “Một lá!”', 'Called!') : tr('Hô “Một lá!”', 'Call “Last card!”')}</Btn>}
          {myTurn && s.drew === null && <Btn tone={ok.size ? 'gray' : 'orange'} size="sm" onClick={() => apply(C.draw(s, 0, rnd))}>{tr('Bốc 1 lá', 'Draw a card')}</Btn>}
          {myTurn && s.drew !== null && <Btn tone="gray" size="sm" onClick={() => apply(C.pass(s, 0))}>{tr('Bỏ lượt', 'Pass')}</Btn>}
        </div>
      </div>
      {pickColor !== null && (
        <div className="bg-overlay" role="dialog" aria-label={tr('Chọn màu', 'Choose a colour')}>
          <div className="bg-sheet">
            <b>{tr('Chọn màu tiếp theo', 'Choose the next colour')}</b>
            <div className="color-pick">{C.COLORS.map((c) => <button key={c} type="button" style={{ background: COLOR_HEX[c] }} onClick={() => doPlay(pickColor, c)}>{tr(COLOR_NAME[c][0], COLOR_NAME[c][1])}</button>)}</div>
            <Btn tone="gray" size="sm" onClick={() => setPickColor(null)}>{tr('Thôi', 'Cancel')}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
