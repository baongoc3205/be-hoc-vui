// Bàn chơi trực tuyến: chỉ hiển thị trạng thái máy chủ gửi về và gửi lại nước đi (máy chủ kiểm luật).
import { useEffect, useRef, useState } from 'react';
import * as C from '../../../../shared/board/cards.js';
import * as Lu from '../../../../shared/board/ludo.js';
import type { CardColor, CardsState } from '../../../../shared/board/cards.js';
import type { LudoState } from '../../../../shared/board/ludo.js';
import type { LText, Look, Round } from '../../lib/types';
import type { T as TT } from '../../lib/i18n';
import * as W from '../../../../shared/board/werewolf.js';
import { Quiz, CatchFall } from '../StepGames';
import { FruitSlice, CandyMatch, Slingshot, DrawTrace } from '../ArcadeGames';
import { MathRace, BalloonPop } from '../FlowGames';
import { Btn } from '../../ui/kit';
import { sfx } from '../../lib/sfx';
import { Avatar, botLook, type Tr } from './common';
import { CardView } from './CardsGame';
import { BoardSvg, CNAME, Dice, HEX } from './LudoGame';

export interface RoomSeat { name: string; look: Look | null; bot: boolean; botIdx: number | null; you: boolean; host: boolean; online: boolean; left: boolean; coins: number | null }
interface QuizView { startAt: number; deadline: number; perQ: number; total: number; done: boolean; now: number; question: { index: number; prompt: LText; options: LText[]; title: LText | null } | null; last: { choice: number | null; ok: boolean; pts: number; at: number; answer: number } | null; progress: { answered: number; correct: number; score: number }[] }
export interface RoomView {
  id: string; code: string; game: 'cards' | 'ludo' | 'quiz' | 'werewolf' | 'fruit-slice' | 'candy-match' | 'slingshot' | 'draw-trace' | 'balloon-pop' | 'catch-fall' | 'math-race'; status: 'lobby' | 'playing' | 'done'; opts: { players: number; level: string; exitOne: boolean }; seats: RoomSeat[]; mySeat: number; isHost: boolean; version: number;
  state: (CardsState & { deckCount: number }) | LudoState | QuizView | null; result: { winners: number[] } | null; log: { seat: number; t: string; v?: number; k?: number; victim?: number }[]; turnAt: number; turnMs: number; now: number;
}
type Act = (b: Record<string, unknown>) => Promise<void>;
const lookOf = (s: RoomSeat) => s.look ?? botLook(s.botIdx ?? 0);
const COLOR_HEX: Record<CardColor, string> = { red: '#E0574F', yellow: '#F2C14B', green: '#5FAE6E', blue: '#4F8FD6' };
const COLOR_NAME: Record<CardColor, [string, string]> = { red: ['Đỏ', 'Red'], yellow: ['Vàng', 'Yellow'], green: ['Xanh lá', 'Green'], blue: ['Xanh dương', 'Blue'] };

/** Đồng hồ đếm lượt (máy chủ cho bot đi hộ khi hết giờ). */
function TurnTimer({ v, mine }: { v: RoomView; mine: boolean }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(iv); }, []);
  if (!mine) return null;
  const skew = v.now - Date.now();
  const left = Math.max(0, Math.ceil((v.turnAt + v.turnMs - (now + skew)) / 1000));
  return <span className={`turn-timer ${left <= 8 ? 'low' : ''}`}>⏱ {left}s</span>;
}

function Seats({ v, active, extra }: { v: RoomView; active: number | null; extra?: (i: number) => string }) {
  return (
    <div className="bg-opponents">
      {v.seats.map((s, i) => (
        <div key={i} className={`bg-opp ${active === i && v.status === 'playing' ? 'active' : ''} ${s.you ? 'you' : ''}`}>
          <Avatar look={lookOf(s)} size={44} dim={!s.online && !s.bot} />
          <div className="bg-opp-info"><b>{s.name}{s.bot ? ' 🤖' : ''}</b><span>{extra?.(i) ?? ''}{!s.bot && !s.online ? ' · 💤' : ''}</span></div>
        </div>
      ))}
    </div>
  );
}

export function OnlineCards({ v, act, tr }: { v: RoomView; act: Act; tr: Tr }) {
  const s = v.state as CardsState & { deckCount: number };
  const me = v.mySeat;
  const [called, setCalled] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  useEffect(() => setCalled(false), [s.turn]);
  const myTurn = s.turn === me && s.winner === null && v.status === 'playing';
  const ok = new Set(myTurn ? C.playable(s, me) : []);
  const hand = s.hands[me];
  const tap = (i: number) => {
    if (!myTurn || !ok.has(i)) { sfx.wrong(); return; }
    if (hand[i].c === null) setPick(i); else { sfx.flip(); void act({ type: 'play', idx: i, called }); }
  };
  const last = v.log[v.log.length - 1];
  const msg = last ? ({ draw: tr(`${v.seats[last.seat]?.name} bốc ${last.k} lá!`, `${v.seats[last.seat]?.name} draws ${last.k}!`), skip: tr(`${v.seats[last.seat]?.name} mất lượt`, `${v.seats[last.seat]?.name} is skipped`), forgot: tr(`${v.seats[last.seat]?.name} quên hô “Một lá!”`, `${v.seats[last.seat]?.name} forgot “Last card!”`), uno: tr(`${v.seats[last.seat]?.name}: “Một lá!”`, `${v.seats[last.seat]?.name}: “Last card!”`), auto: tr(`Bot đi hộ ${v.seats[last.seat]?.name}`, `A bot played for ${v.seats[last.seat]?.name}`) } as Record<string, string>)[last.t] ?? '' : '';
  return (
    <div className="cards-game">
      <Seats v={v} active={s.turn} extra={(i) => tr(`${s.hands[i].length} lá`, `${s.hands[i].length} cards`)} />
      <div className="cards-table">
        <div className="cards-pile"><CardView back onClick={myTurn && s.drew === null ? () => act({ type: 'draw' }) : undefined} label={tr('Bốc bài', 'Draw')} /><small>{tr('Nọc', 'Deck')} {s.deckCount}</small></div>
        <div className="cards-discard"><CardView card={C.top(s)} /></div>
        <div className="cards-state"><span className="cur-color" style={{ background: COLOR_HEX[s.color] }} /><span className="cur-dir">{s.dir === 1 ? '↻' : '↺'}</span></div>
      </div>
      <p className="bg-msg">{myTurn ? `👉 ${tr('Lượt của bé', 'Your turn')} ` : `${tr('Lượt của', 'Turn:')} ${v.seats[s.turn]?.name} `}<TurnTimer v={v} mine={myTurn} />{msg ? ` · ${msg}` : ''}</p>
      <div className={`bg-me ${myTurn ? 'active' : ''}`}>
        <div className="hand">{hand.map((c, i) => <CardView key={c.id} card={c} lift={myTurn && ok.has(i)} dim={myTurn && !ok.has(i)} onClick={() => tap(i)} label={`${c.c ?? 'wild'} ${c.v}`} />)}</div>
        <div className="bg-actions">
          {myTurn && hand.length === 2 && ok.size > 0 && <Btn tone={called ? 'lime' : 'orange'} size="sm" onClick={() => setCalled(true)}>{called ? tr('Đã hô “Một lá!”', 'Called!') : tr('Hô “Một lá!”', 'Call “Last card!”')}</Btn>}
          {myTurn && s.drew === null && <Btn tone="gray" size="sm" onClick={() => act({ type: 'draw' })}>{tr('Bốc 1 lá', 'Draw a card')}</Btn>}
          {myTurn && s.drew !== null && <Btn tone="gray" size="sm" onClick={() => act({ type: 'pass' })}>{tr('Bỏ lượt', 'Pass')}</Btn>}
        </div>
      </div>
      {pick !== null && (
        <div className="bg-overlay"><div className="bg-sheet"><b>{tr('Chọn màu tiếp theo', 'Choose the next colour')}</b>
          <div className="color-pick">{C.COLORS.map((c) => <button key={c} type="button" style={{ background: COLOR_HEX[c] }} onClick={() => { setPick(null); void act({ type: 'play', idx: pick, color: c, called }); }}>{tr(...COLOR_NAME[c])}</button>)}</div>
          <Btn tone="gray" size="sm" onClick={() => setPick(null)}>{tr('Thôi', 'Cancel')}</Btn></div></div>
      )}
    </div>
  );
}

export function OnlineLudo({ v, act, tr }: { v: RoomView; act: Act; tr: Tr }) {
  const s = v.state as LudoState;
  const me = v.mySeat;
  const myTurn = s.turn === me && s.winner == null && v.status === 'playing';
  const moves = myTurn && s.dice != null ? Lu.legalMoves(s) : [];
  const myColor = s.seats[me];
  const last = v.log[v.log.length - 1];
  const lastRoll = [...v.log].reverse().find((l) => l.t === 'roll');
  const msg = last ? ({ capture: tr(`${v.seats[last.seat]?.name} đá ngựa của ${last.victim != null ? v.seats[last.victim]?.name : ''}!`, `${v.seats[last.seat]?.name} bumped ${last.victim != null ? v.seats[last.victim]?.name : ''}!`), home: tr(`${v.seats[last.seat]?.name} có ngựa về đích!`, `${v.seats[last.seat]?.name} got a horse home!`), again: tr(`${v.seats[last.seat]?.name} được gieo thêm`, `${v.seats[last.seat]?.name} rolls again`), nomove: tr(`${v.seats[last.seat]?.name} không đi được`, `${v.seats[last.seat]?.name} can’t move`), three6: tr('Ba lần 6 — mất lượt!', 'Three 6s — turn lost!'), auto: tr(`Bot đi hộ ${v.seats[last.seat]?.name}`, `A bot played for ${v.seats[last.seat]?.name}`), roll: tr(`${v.seats[last.seat]?.name} gieo được ${last.v}`, `${v.seats[last.seat]?.name} rolled ${last.v}`) } as Record<string, string>)[last.t] ?? '' : '';
  useEffect(() => { if (moves.length === 1) { const t = setTimeout(() => act({ type: 'move', piece: moves[0].piece }), 500); return () => clearTimeout(t); } }, [v.version]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="ludo-game">
      <div className="ludo-wrap"><BoardSvg s={s} movable={moves} onPick={(m) => { sfx.pop(); void act({ type: 'move', piece: m.piece }); }} /></div>
      <div className="ludo-side">
        <div className="ludo-players">{v.seats.map((st, i) => (
          <div key={i} className={`bg-opp ${s.turn === i && v.status === 'playing' ? 'active' : ''}`} style={{ borderColor: HEX[s.seats[i]] }}>
            <Avatar look={lookOf(st)} size={44} dim={!st.online && !st.bot} />
            <div className="bg-opp-info"><b style={{ color: HEX[s.seats[i]] }}>{st.name}{st.you ? ` (${tr('bé', 'you')})` : ''}</b><span>{s.pieces[s.seats[i]].filter((p) => p === Lu.FINISH).length}/4 · {tr(...CNAME[s.seats[i]])}</span></div>
          </div>
        ))}</div>
        <button type="button" className={`dice-btn ${myTurn && s.dice == null ? 'ready' : ''}`} disabled={!myTurn || s.dice != null} onClick={() => { sfx.tap(); void act({ type: 'roll' }); }}>
          <Dice value={s.dice ?? lastRoll?.v ?? null} /><span>{myTurn && s.dice == null ? tr('Gieo!', 'Roll!') : v.seats[s.turn]?.name}</span>
        </button>
        <p className="bg-msg">{myTurn ? `👉 ${tr(`Lượt của bé (ngựa ${CNAME[myColor][0]})`, `Your turn (${CNAME[myColor][1]})`)} ` : ''}<TurnTimer v={v} mine={myTurn} />{msg ? ` · ${msg}` : ''}</p>
        {myTurn && moves.length > 1 && <p className="ww-hint">{tr('Chạm vào con ngựa đang sáng để đi.', 'Tap a glowing horse to move.')}</p>}
      </div>
    </div>
  );
}

export function OnlineQuiz({ v, act, tr, lang }: { v: RoomView; act: Act; tr: Tr; lang: 'vi' | 'en' }) {
  const s = v.state as QuizView;
  const me = v.mySeat;
  const [now, setNow] = useState(Date.now());
  const [sent, setSent] = useState<number | null>(null);
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(iv); }, []);
  useEffect(() => setSent(null), [s.question?.index]);
  const skew = s.now - Date.now();
  const t = now + skew;
  const tx = (x: LText | null | undefined) => (x ? x[lang] ?? x.vi : '');
  const count = Math.ceil((s.startAt - t) / 1000);
  const qStart = s.question ? (s.question.index === 0 ? s.startAt : s.last?.at ?? s.startAt) : 0;
  const left = s.question ? Math.max(0, Math.ceil((qStart + s.perQ * 1000 - t) / 1000)) : 0;
  const answer = (i: number) => { if (sent !== null || !s.question) return; setSent(i); sfx.tap(); void act({ type: 'answer', q: s.question.index, choice: i }); };
  return (
    <div className="quiz-duel">
      <div className="duel-progress">{v.seats.map((st, i) => (
        <div key={i} className={`duel-p ${st.you ? 'you' : ''}`}>
          <Avatar look={lookOf(st)} size={40} dim={!st.online && !st.bot} />
          <div className="duel-bar"><b>{st.name}{st.bot ? ' 🤖' : ''}</b><div className="bar"><i style={{ width: `${(s.progress[i].answered / s.total) * 100}%` }} /></div><small>{tr('Câu', 'Q')} {s.progress[i].answered}/{s.total} · ✓ {s.progress[i].correct} · {s.progress[i].score} {tr('điểm', 'pts')}</small></div>
        </div>
      ))}</div>
      {count > 0 ? <div className="duel-count">{count}</div> : s.question ? (
        <div className="duel-q">
          <div className="duel-top"><span>{tr('Câu', 'Question')} {s.question.index + 1}/{s.total}</span><span className={`turn-timer ${left <= 5 ? 'low' : ''}`}>⏱ {left}s</span></div>
          {s.question.title && <small className="muted">{tx(s.question.title)}</small>}
          <h3 className="duel-prompt">{tx(s.question.prompt)}</h3>
          <div className="duel-opts">{s.question.options.map((o, i) => <button key={i} type="button" className={`duel-opt ${sent === i ? 'sent' : ''}`} disabled={sent !== null} onClick={() => answer(i)}><span>{'ABCD'[i]}</span>{tx(o)}</button>)}</div>
          {s.last && s.question.index > 0 && <p className={`duel-last ${s.last.ok ? 'ok' : 'no'}`}>{s.last.ok ? tr(`Câu trước đúng rồi! +${s.last.pts}`, `Last one correct! +${s.last.pts}`) : tr('Câu trước chưa đúng.', 'Last one was wrong.')}</p>}
        </div>
      ) : <div className="duel-wait"><b>{s.done ? tr('Hết giờ!', 'Finished!') : tr('Bé làm xong rồi! Chờ các bạn nhé…', 'All done! Waiting for the others…')}</b>{s.last && <p className={`duel-last ${s.last.ok ? 'ok' : 'no'}`}>{s.last.ok ? tr(`Câu cuối đúng! +${s.last.pts}`, `Last one correct! +${s.last.pts}`) : tr('Câu cuối chưa đúng.', 'Last one was wrong.')}</p>}<p>{tr(`Bé được ${s.progress[me].score} điểm`, `You scored ${s.progress[me].score}`)}</p></div>}
    </div>
  );
}

// ---------------- Thi đua minigame: cả phòng làm cùng một bộ đề ----------------
interface RaceView { startAt: number; deadline: number; perQ: number; total: number; done: boolean; now: number; question: { index: number; round: Round } | null; last: { ok: boolean; pts: number; at: number } | null; progress: { answered: number; correct: number; score: number }[] }
const NO_PROMPT = new Set(['math-race', 'balloon-pop']);

export function OnlineRace({ v, act, tr, T, look }: { v: RoomView; act: Act; tr: Tr; T: TT; look: Look }) {
  const s = v.state as unknown as RaceView;
  const me = v.mySeat;
  const [now, setNow] = useState(Date.now());
  const [sent, setSent] = useState<number | null>(null);
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(iv); }, []);
  useEffect(() => setSent(null), [s.question?.index]);
  const t = now + (s.now - Date.now());
  const count = Math.ceil((s.startAt - t) / 1000);
  const qStart = s.question ? (s.question.index === 0 ? s.startAt : s.last?.at ?? s.startAt) : 0;
  const left = s.question ? Math.max(0, Math.ceil((qStart + s.perQ * 1000 - t) / 1000)) : 0;
  const submit = (given: unknown) => { if (!s.question || sent === s.question.index) return; setSent(s.question.index); void act({ type: 'answer', q: s.question.index, given: given ?? null }); };
  const round = s.question?.round;
  const game = v.game as string;
  const body = () => {
    if (!round) return null;
    const p = { key: round.id, round, T, onSubmit: submit, revealed: sent === s.question!.index, given: undefined };
    if (game === 'math-race') return <MathRace rounds={[round]} T={T} look={look} onRound={(_, g) => submit(g)} onDone={() => undefined} key={round.id} />;
    if (game === 'balloon-pop') return <BalloonPop rounds={[round]} T={T} look={look} onRound={(_, g) => submit(g)} onDone={() => undefined} key={round.id} />;
    if (round.kind === 'classify') return <CatchFall {...p} />;
    if (round.kind === 'trace') return <DrawTrace {...p} />;
    if (game === 'fruit-slice') return <FruitSlice {...p} />;
    if (game === 'candy-match') return <CandyMatch {...p} />;
    if (game === 'slingshot') return <Slingshot {...p} />;
    return <Quiz {...p} />;
  };
  return (
    <div className="race-duel">
      <div className="duel-progress">{v.seats.map((st, i) => (
        <div key={i} className={`duel-p ${st.you ? 'you' : ''}`}>
          <Avatar look={lookOf(st)} size={40} dim={!st.online && !st.bot} />
          <div className="duel-bar"><b>{st.name}{st.bot ? ' 🤖' : ''}</b><div className="bar"><i style={{ width: `${(s.progress[i].answered / s.total) * 100}%` }} /></div><small>{s.progress[i].answered}/{s.total} · ✓ {s.progress[i].correct} · {s.progress[i].score} {tr('điểm', 'pts')}</small></div>
        </div>
      ))}</div>
      {count > 0 ? <div className="duel-count">{count}</div> : round ? (
        <div className="race-play">
          <div className="duel-top"><span>{tr('Vòng', 'Round')} {s.question!.index + 1}/{s.total}</span>{s.last && s.question!.index > 0 && <span className={`duel-last ${s.last.ok ? 'ok' : 'no'}`}>{s.last.ok ? tr(`Vòng trước đúng! +${s.last.pts}`, `Last round correct! +${s.last.pts}`) : tr('Vòng trước chưa đúng', 'Last round missed')}</span>}<span className={`turn-timer ${left <= 5 ? 'low' : ''}`}>⏱ {left}s</span></div>
          {!NO_PROMPT.has(game) && <div className="race-prompt">{round.title && <small>{T.tx(round.title)}</small>}<b>{T.tx(round.prompt)}</b></div>}
          <div className={`race-board ${sent === s.question!.index ? 'sent' : ''}`}>{body()}</div>
          {sent === s.question!.index && <p className="race-wait">{tr('Đã nộp! Chờ vòng sau…', 'Sent! Next round coming…')}</p>}
        </div>
      ) : <div className="duel-wait"><b>{s.done ? tr('Hết giờ!', 'Finished!') : tr('Bé làm xong rồi! Chờ các bạn nhé…', 'All done! Waiting for the others…')}</b>{s.last && <p className={`duel-last ${s.last.ok ? 'ok' : 'no'}`}>{s.last.ok ? tr(`Vòng cuối đúng! +${s.last.pts}`, `Last round correct! +${s.last.pts}`) : tr('Vòng cuối chưa đúng.', 'Last round missed.')}</p>}<p>{tr(`Bé được ${s.progress[me].score} điểm`, `You scored ${s.progress[me].score}`)}</p></div>}
    </div>
  );
}

// ---------------- Ma sói nhiều người ----------------
interface WWPlayer { id: number; name: string; alive: boolean; role: W.Role | null; claim: boolean }
interface WWView {
  day: number; step: 'night' | 'witch' | 'day' | 'vote' | 'end'; deadline: number; now: number; winner: 'wolf' | 'village' | null; players: WWPlayer[]; me: number;
  log: { day: number; who: number | null; text: LText; kind: string }[]; needs: boolean; waiting: number; said: number; ready: number; voted: number; humans: number; myVote?: number | null;
  checks?: Record<number, boolean>; lastGuard?: number | null; wolfVotes?: Record<number, number>; potions?: { heal: boolean; kill: boolean }; victim?: number | null; roles?: W.Role[];
}
type WPick = 'kill' | 'guard' | 'check' | 'poison' | 'accuse' | 'clear' | 'claimWolf' | 'claimClean' | 'vote' | null;

export function OnlineWerewolf({ v, act, tr, lang }: { v: RoomView; act: Act; tr: Tr; lang: 'vi' | 'en' }) {
  const s = v.state as unknown as WWView;
  const me = s.me; const my = s.players[me];
  const role = my.role ? W.ROLE_INFO[my.role] : null;
  const [pick, setPick] = useState<WPick>(null);
  const [heal, setHeal] = useState(false);
  const [now, setNow] = useState(Date.now());
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(iv); }, []);
  useEffect(() => { setPick(null); setHeal(false); }, [s.step, s.day]);
  useEffect(() => { logRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }); }, [s.log.length]);
  const tx = (x: LText) => x[lang] ?? x.vi;
  const nm = (id: number) => s.players[id]?.name ?? '?';
  const left = Math.max(0, Math.ceil((s.deadline - (now + (s.now - Date.now()))) / 1000));
  const night = s.step === 'night' || s.step === 'witch';
  const canAct = my.alive && s.needs;
  // vai đặc biệt ban đêm tự động mở chế độ chọn
  const nightPick: WPick = s.step === 'night' && canAct ? (my.role === 'wolf' ? 'kill' : my.role === 'guard' ? 'guard' : my.role === 'seer' ? 'check' : null) : null;
  const active: WPick = pick ?? nightPick ?? (s.step === 'vote' && canAct ? 'vote' : null);
  const can = (p: WWPlayer) => {
    if (!active || !p.alive) return false;
    if (active === 'guard') return p.id !== s.lastGuard;
    if (p.id === me) return false;
    if (active === 'kill') return p.role !== 'wolf';
    if (active === 'check') return !(s.checks && p.id in s.checks);
    if (active === 'claimWolf') return !!s.checks?.[p.id];
    if (active === 'claimClean') return s.checks?.[p.id] === false;
    return true;
  };
  const choose = (id: number) => {
    sfx.pop();
    if (active === 'kill' || active === 'guard' || active === 'check') void act({ type: active, target: id });
    else if (active === 'poison') void act({ type: 'witch', heal, poison: id });
    else if (active === 'vote') void act({ type: 'vote', target: id });
    else if (active) void act({ type: 'say', kind: active, target: id });
    setPick(null);
  };
  const badge = (p: WWPlayer) => {
    if (s.roles) return W.ROLE_INFO[s.roles[p.id]].icon;
    if (p.role && (p.id === me || !p.alive || my.role === 'wolf')) return W.ROLE_INFO[p.role].icon;
    if (s.checks && p.id in s.checks) return s.checks[p.id] ? '🐺?' : '✅';
    if (p.claim) return '🔮?';
    return '';
  };
  const wolfVotesFor = (id: number) => Object.entries(s.wolfVotes ?? {}).filter(([, t]) => t === id).map(([w]) => nm(Number(w)));
  const stepTitle = s.step === 'night' ? tr(`🌙 Đêm thứ ${s.day}`, `🌙 Night ${s.day}`) : s.step === 'witch' ? tr('🧪 Phù thuỷ thức dậy', '🧪 The witch wakes') : s.step === 'day' ? tr(`☀️ Ngày ${s.day} — thảo luận`, `☀️ Day ${s.day} — talk`) : s.step === 'vote' ? tr('🗳️ Bỏ phiếu', '🗳️ Vote') : s.winner === 'village' ? tr('🎉 Dân làng thắng!', '🎉 The village wins!') : tr('🐺 Bầy sói thắng!', '🐺 The wolves win!');
  const prompt = !my.alive ? tr('Bé đã rời làng — xem tiếp các bạn chơi nhé.', 'You are out — watch the others play.')
    : active === 'kill' ? tr('Chọn người bầy sói sẽ bắt đêm nay', 'Pick who the wolves take tonight')
    : active === 'guard' ? tr('Chọn người bé che chở đêm nay', 'Pick who to protect tonight')
    : active === 'check' ? tr('Chọn người bé muốn soi', 'Pick someone to check')
    : active === 'poison' ? tr('Chọn người bị bình độc', 'Pick who gets the poison')
    : active === 'accuse' ? tr('Bé nghi ai là sói?', 'Who do you suspect?')
    : active === 'clear' ? tr('Bé tin ai là người tốt?', 'Who do you trust?')
    : active === 'claimWolf' || active === 'claimClean' ? tr('Công bố kết quả soi của ai?', 'Reveal which check?')
    : active === 'vote' ? tr('Chạm vào người bé muốn mời rời làng', 'Tap who should leave the village')
    : s.step === 'night' ? (s.needs ? '' : tr('🌙 Cả làng đi ngủ… chờ các vai đặc biệt.', '🌙 The village sleeps… waiting for special roles.'))
    : s.step === 'witch' ? (s.needs ? '' : tr('🧪 Chờ Phù thuỷ…', '🧪 Waiting for the witch…'))
    : s.step === 'day' ? tr(`Các bạn đang bàn bạc. ${s.ready}/${s.humans} bạn sẵn sàng bỏ phiếu.`, `Talking… ${s.ready}/${s.humans} ready to vote.`)
    : s.step === 'vote' ? tr(`Đã bỏ phiếu ${s.voted}/${s.humans}. Chờ các bạn khác…`, `${s.voted}/${s.humans} voted. Waiting…`) : '';
  return (
    <div className={`ww-game ${night ? 'is-night' : 'is-day'}`}>
      <div className="ww-players">
        {s.players.map((p) => {
          const ok = can(p); const b = badge(p); const wv = wolfVotesFor(p.id);
          return (
            <button key={p.id} type="button" className={`ww-p ${p.alive ? '' : 'out'} ${ok ? 'can' : ''} ${p.id === me ? 'me' : ''}`} disabled={!ok} onClick={() => choose(p.id)}>
              <Avatar look={lookOf(v.seats[p.id])} size={52} dim={!p.alive || (!v.seats[p.id].online && !v.seats[p.id].bot)} />
              <b>{p.id === me ? `${p.name} (${tr('bé', 'you')})` : `${p.name}${v.seats[p.id].bot ? ' 🤖' : ''}`}</b>
              {b && <span className="ww-badge">{b}</span>}
              {!p.alive && <span className="ww-out">{tr('đã rời làng', 'gone')}</span>}
              {wv.length > 0 && <span className="ww-votes">🐺 {wv.join(', ')}</span>}
              {s.myVote === p.id && <span className="ww-votes">🗳️</span>}
            </button>
          );
        })}
      </div>
      <div className="ww-side">
        <div className="ww-role"><span>{role?.icon ?? '❔'}</span><div><b>{tr('Vai của bé:', 'Your role:')} {role ? tx(role.name) : '?'}</b><small>{role ? tx(role.goal) : ''}</small></div></div>
        <div className="ww-phase"><b>{stepTitle}</b>{s.step !== 'end' && <span className={`turn-timer ${left <= 8 ? 'low' : ''}`}>⏱ {left}s</span>}</div>
        <div className="ww-log" ref={logRef} aria-live="polite">
          {s.log.map((e, i) => (
            <div key={i} className={`ww-line ${e.kind}`}>
              {e.who != null && <Avatar look={lookOf(v.seats[e.who])} size={30} />}
              <span>{e.who != null && <b>{nm(e.who)}: </b>}{tx(e.text)}</span>
            </div>
          ))}
        </div>
        <div className="ww-actions">
          {prompt && <p className="ww-prompt">{prompt}</p>}
          {s.step === 'night' && my.role === 'wolf' && my.alive && <p className="ww-hint">{tr('Bầy sói:', 'Wolf pack:')} {s.players.filter((p) => p.role === 'wolf').map((p) => (p.id === me ? tr('bé', 'you') : p.name)).join(', ')}</p>}
          {s.step === 'night' && !s.needs && my.alive && ['wolf', 'guard', 'seer'].includes(my.role ?? '') && <p className="ww-hint">✓ {tr('Bé đã chọn xong, chờ các bạn khác.', 'Done — waiting for the others.')}</p>}
          {s.step === 'witch' && canAct && (
            <>
              <p className="ww-prompt">🧪 {s.victim != null ? tr(`Đêm nay sói định bắt ${nm(s.victim)}.`, `The wolves are after ${nm(s.victim)}.`) : tr('Đêm nay sói chưa bắt ai.', 'The wolves took nobody tonight.')}</p>
              <div className="ww-btns">
                {s.potions?.heal && s.victim != null && <Btn tone={heal ? 'lime' : 'cream'} size="sm" onClick={() => { sfx.tap(); setHeal(!heal); }}>{heal ? '✓ ' : ''}{tr(`Cứu ${nm(s.victim)}`, `Save ${nm(s.victim)}`)}</Btn>}
                {s.potions?.kill && <Btn tone="mauve" size="sm" onClick={() => setPick('poison')}>{tr('Dùng bình độc', 'Use poison')}</Btn>}
                <Btn tone="orange" size="sm" onClick={() => void act({ type: 'witch', heal, poison: null })}>{tr('Xong', 'Done')}</Btn>
              </div>
            </>
          )}
          {s.step === 'day' && my.alive && !pick && (
            <div className="ww-btns">
              {s.said < 2 && <Btn tone="mauve" size="sm" onClick={() => setPick('accuse')}>{tr('Nêu nghi ngờ', 'Accuse')}</Btn>}
              {s.said < 2 && <Btn tone="cream" size="sm" onClick={() => setPick('clear')}>{tr('Bênh vực', 'Defend')}</Btn>}
              {s.said < 2 && my.role === 'seer' && Object.values(s.checks ?? {}).some((w) => w) && <Btn tone="cream" size="sm" onClick={() => setPick('claimWolf')}>{tr('Công bố: đã soi ra sói', 'Reveal a wolf')}</Btn>}
              {s.said < 2 && my.role === 'seer' && Object.values(s.checks ?? {}).some((w) => !w) && <Btn tone="cream" size="sm" onClick={() => setPick('claimClean')}>{tr('Công bố: người tốt', 'Reveal an innocent')}</Btn>}
              {s.needs ? <Btn tone="orange" size="sm" onClick={() => { sfx.tap(); void act({ type: 'ready' }); }}>{tr('🗳️ Sẵn sàng bỏ phiếu', '🗳️ Ready to vote')}</Btn> : <span className="ww-hint">✓ {tr('Bé đã sẵn sàng', 'You are ready')}</span>}
            </div>
          )}
          {pick && <Btn tone="gray" size="sm" onClick={() => setPick(null)}>{tr('Thôi', 'Cancel')}</Btn>}
          {s.step === 'vote' && canAct && <Btn tone="gray" size="sm" onClick={() => { sfx.tap(); void act({ type: 'vote', target: null }); }}>{tr('Bỏ phiếu trắng', 'Skip vote')}</Btn>}
        </div>
      </div>
    </div>
  );
}
