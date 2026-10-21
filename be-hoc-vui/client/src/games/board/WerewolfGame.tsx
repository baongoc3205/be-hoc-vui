// Ma sói — bé chơi cùng các bạn bot. Đêm: làm nhiệm vụ theo vai. Ngày: nghe các bạn bàn, nêu nghi ngờ, bỏ phiếu.
import { useEffect, useMemo, useRef, useState } from 'react';
import { makeRng } from '../../../../shared/logic.js';
import * as W from '../../../../shared/board/werewolf.js';
import type { NightPlan, Role, WState } from '../../../../shared/board/werewolf.js';
import type { Look } from '../../lib/types';
import { Btn } from '../../ui/kit';
import { sfx } from '../../lib/sfx';
import { Avatar, botLook, type Tr } from './common';
import type { Ask } from './LearnQuiz';

type Stage = 'intro' | 'night' | 'talk' | 'discuss' | 'vote' | 'voted' | 'end';
type Pick = { kind: 'guard' | 'wolf' | 'seer' | 'poison' | 'accuse' | 'clear' | 'claim' | 'vote'; options: number[] };

export function WerewolfGame({ players, role, tr, lang, me, onEnd, ask = null }: { players: number; role: Role | 'random'; tr: Tr; lang: 'vi' | 'en'; me: { name: string; look: Look }; onEnd: (won: boolean) => void; ask?: Ask }) {
  const rnd = useRef(makeRng((Date.now() & 0xffffff) + 13)).current;
  const [s, setS] = useState<WState>(() => W.newGame(players, rnd, { humanName: me.name, humanRole: role }));
  const [stage, setStage] = useState<Stage>('intro');
  const [shown, setShown] = useState(1);
  const [pick, setPick] = useState<Pick | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [said, setSaid] = useState(false);
  const [votes, setVotes] = useState<Record<number, number | null> | null>(null);
  const [puzzles, setPuzzles] = useState(0); // số câu đố đã giải trong ngày
  const [solving, setSolving] = useState(false);
  const plan = useRef<NightPlan>({ victim: null, guard: null, heal: false, poison: null, check: null });
  const logRef = useRef<HTMLDivElement>(null);
  const ended = useRef(false);
  const looks = useMemo(() => s.players.map((p, i) => (p.human ? me.look : botLook(i - 1))), []); // eslint-disable-line react-hooks/exhaustive-deps
  const meP = s.players[0];
  const myRole = W.ROLE_INFO[meP.role];
  const nm = (id: number) => s.players[id].name;
  const tx = (t: { vi: string; en: string }) => t[lang];
  const others = (pred: (id: number) => boolean = () => true) => W.alive(s).filter((p) => p.id !== 0 && pred(p.id)).map((p) => p.id);

  // hiện dần từng câu trong nhật ký
  useEffect(() => {
    if (shown >= s.log.length) { if (stage === 'talk') setStage('discuss'); return; }
    const t = setTimeout(() => { setShown((n) => n + 1); sfx.tap(); }, stage === 'talk' ? 900 : 350);
    return () => clearTimeout(t);
  }, [shown, s.log.length, stage]);
  useEffect(() => { logRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }); }, [shown]);

  // ---------- đêm ----------
  const startNight = (st: WState) => {
    plan.current = W.botNight(st, rnd);
    const q: string[] = [];
    if (st.players[0].alive) {
      const r = st.players[0].role;
      if (r === 'guard') q.push('guard');
      if (r === 'wolf') q.push('wolf');
      if (r === 'seer') q.push('seer');
      if (r === 'witch') q.push('witch');
    }
    setQueue(q); setNote(null); setSaid(false); setVotes(null); setPuzzles(0); setStage('night');
  };
  useEffect(() => {
    if (stage !== 'night') return;
    if (!queue.length) { const t = setTimeout(finishNight, meP.alive ? 1600 : 900); return () => clearTimeout(t); }
    const step = queue[0];
    if (step === 'guard') setPick({ kind: 'guard', options: W.alive(s).map((p) => p.id).filter((id) => id !== s.lastGuard) });
    if (step === 'wolf') setPick({ kind: 'wolf', options: others((id) => !W.isWolf(s, id)) });
    if (step === 'seer') setPick({ kind: 'seer', options: others((id) => !(id in s.checks)) });
    if (step === 'witch') setPick(null);
  }, [stage, queue]); // eslint-disable-line react-hooks/exhaustive-deps
  const nextStep = () => setQueue((q) => q.slice(1));
  const finishNight = () => {
    const wit = W.alive(s).find((p) => p.role === 'witch' && !p.human);
    if (wit) Object.assign(plan.current, W.botWitch(s, wit.id, plan.current.victim, rnd));
    const r = W.resolveNight(s, plan.current);
    setPick(null);
    if (r.s.winner) { setS(r.s); setStage('end'); return; }
    const talked = W.dayTalk(r.s, rnd);
    setS(talked); setStage('talk');
    if (r.deaths.includes(0)) sfx.wrong(); else sfx.open();
  };
  const choose = (id: number) => {
    if (!pick || !pick.options.includes(id)) return;
    sfx.pop();
    const k = pick.kind;
    if (k === 'guard') { plan.current.guard = id; setPick(null); nextStep(); }
    if (k === 'wolf') { plan.current.victim = id; setPick(null); nextStep(); }
    if (k === 'seer') { plan.current.check = { seer: 0, target: id }; setPick(null); setNote(W.isWolf(s, id) ? tr(`🔮 ${nm(id)} là SÓI! 🐺`, `🔮 ${nm(id)} is a WOLF! 🐺`) : tr(`🔮 ${nm(id)} là người tốt.`, `🔮 ${nm(id)} is innocent.`)); }
    if (k === 'poison') { plan.current.poison = id; setPick(null); nextStep(); }
    if (k === 'accuse' || k === 'clear') { setS(W.humanSay(s, k, id)); setShown((n) => n); setPick(null); setSaid(true); }
    if (k === 'claim') { setS(W.humanSay(s, W.isWolf(s, id) ? 'claimWolf' : 'claimClean', id)); setPick(null); setSaid(true); }
    if (k === 'vote') { setPick(null); castVotes(id); }
  };

  // ---------- bỏ phiếu ----------
  const castVotes = (mine: number | null) => {
    const v = W.botVotes(s, rnd);
    if (meP.alive) v[0] = mine;
    const r = W.resolveVote(s, v);
    setVotes(v); setS(r.s); setStage(r.s.winner ? 'end' : 'voted');
    if (r.out != null && W.isWolf(r.s, r.out)) sfx.correct(); else sfx.flip();
  };
  const startVote = () => { if (!meP.alive) { castVotes(null); return; } setStage('vote'); setPick({ kind: 'vote', options: others() }); };
  // bé đã bị loại: tự chạy tiếp
  useEffect(() => {
    if (meP.alive || ended.current) return;
    if (stage === 'discuss') { const t = setTimeout(startVote, 1400); return () => clearTimeout(t); }
    if (stage === 'voted') { const t = setTimeout(() => startNight(s), 1800); return () => clearTimeout(t); }
  }, [stage, meP.alive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stage !== 'end' || ended.current) return;
    ended.current = true; setShown(s.log.length);
    const myTeam = meP.role === 'wolf' ? 'wolf' : 'village';
    if (s.winner === myTeam) sfx.levelup(); else sfx.wrong();
    const t = setTimeout(() => onEnd(s.winner === myTeam), 2600); return () => clearTimeout(t);
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // vai hiển thị trên thẻ người chơi
  const badge = (id: number) => {
    const p = s.players[id];
    if (stage === 'end' || !p.alive || id === 0) return W.ROLE_INFO[p.role].icon;
    if (meP.role === 'wolf' && p.role === 'wolf') return '🐺';
    if (meP.role === 'seer' && id in s.checks) return s.checks[id] ? '🐺' : '✅';
    if (s.known?.[id] === 'good') return '✅';
    if (s.claims[id]) return '🔮?';
    return null;
  };
  const voteFor = (id: number) => (votes ? Object.values(votes).filter((v) => v === id).length : 0);
  const prompt = pick ? {
    guard: tr('🛡️ Bé muốn che chở cho ai đêm nay?', '🛡️ Who will you protect tonight?'),
    wolf: tr('🐺 Bầy sói chọn bắt ai đêm nay?', '🐺 Who will the pack take tonight?'),
    seer: tr('🔮 Bé muốn soi ai?', '🔮 Who do you want to check?'),
    poison: tr('🧪 Đổ bình độc lên ai?', '🧪 Who gets the poison?'),
    accuse: tr('Bé nghi ai là sói?', 'Who do you suspect?'),
    clear: tr('Bé tin ai là người tốt?', 'Who do you trust?'),
    claim: tr('Công bố kết quả soi của ai?', 'Reveal whose check?'),
    vote: tr('🗳️ Bé bỏ phiếu mời ai rời làng?', '🗳️ Who should leave the village?'),
  }[pick.kind] : null;
  const night = stage === 'night' || stage === 'intro';
  const victim = plan.current.victim;

  return (
    <div className={`ww-game ${night ? 'is-night' : 'is-day'}`}>
      <div className="ww-players">
        {s.players.map((p) => {
          const can = pick?.options.includes(p.id);
          const b = badge(p.id);
          return (
            <button key={p.id} type="button" className={`ww-p ${p.alive ? '' : 'out'} ${can ? 'can' : ''} ${p.human ? 'me' : ''}`} disabled={!can} onClick={() => choose(p.id)}>
              <Avatar look={looks[p.id]} size={52} dim={!p.alive} />
              <b>{p.human ? `${p.name} (${tr('bé', 'you')})` : p.name}</b>
              {b && <span className="ww-badge">{b}</span>}
              {!p.alive && <span className="ww-out">{tr('đã rời làng', 'gone')}</span>}
              {votes && voteFor(p.id) > 0 && <span className="ww-votes">{voteFor(p.id)} 🗳️</span>}
            </button>
          );
        })}
      </div>
      <div className="ww-side">
        <div className="ww-role"><span>{myRole.icon}</span><div><b>{tr('Vai của bé:', 'Your role:')} {tx(myRole.name)}</b><small>{tx(myRole.goal)}</small></div></div>
        <div className="ww-log" ref={logRef} aria-live="polite">
          {s.log.slice(0, shown).map((e, i) => (
            <div key={i} className={`ww-line ${e.kind}`}>
              {e.who != null && <Avatar look={looks[e.who]} size={30} />}
              <span>{e.who != null && <b>{nm(e.who)}: </b>}{tx(e.text)}</span>
            </div>
          ))}
          {votes && stage !== 'vote' && <div className="ww-line sys"><span>🗳️ {Object.entries(votes).map(([v, t]) => `${nm(Number(v))} → ${t == null ? tr('bỏ qua', 'skip') : nm(t)}`).join(' · ')}</span></div>}
        </div>
        <div className="ww-actions">
          {prompt && <p className="ww-prompt">{prompt}</p>}
          {stage === 'intro' && <Btn tone="orange" onClick={() => { sfx.open(); startNight(s); }}>{tr('🌙 Bắt đầu đêm đầu tiên', '🌙 Begin the first night')}</Btn>}
          {stage === 'night' && !pick && !note && queue[0] !== 'witch' && <p className="ww-prompt">{meP.alive ? tr('🌙 Cả làng đi ngủ… các vai đặc biệt đang thức dậy.', '🌙 The village sleeps… special roles are awake.') : tr('🌙 Đêm xuống…', '🌙 Night falls…')}</p>}
          {stage === 'night' && meP.role === 'wolf' && pick?.kind === 'wolf' && <p className="ww-hint">{tr('Đồng đội sói của bé:', 'Your wolf pack:')} {s.players.filter((p) => p.role === 'wolf' && !p.human).map((p) => p.name).join(', ') || tr('chỉ mình bé', 'just you')}</p>}
          {note && <><p className="ww-prompt">{note}</p><Btn tone="lime" size="sm" onClick={() => { setNote(null); nextStep(); }}>{tr('Tiếp tục', 'Continue')}</Btn></>}
          {stage === 'night' && queue[0] === 'witch' && !pick && (
            <>
              <p className="ww-prompt">🧪 {victim != null ? tr(`Đêm nay sói định bắt ${nm(victim)}.`, `Tonight the wolves are after ${nm(victim)}.`) : tr('Đêm nay sói chưa bắt ai.', 'The wolves took nobody tonight.')}</p>
              <div className="ww-btns">
                {s.potions.heal && victim != null && <Btn tone="lime" size="sm" onClick={() => { plan.current.heal = true; nextStep(); }}>{tr(`Cứu ${nm(victim)}`, `Save ${nm(victim)}`)}</Btn>}
                {s.potions.kill && <Btn tone="mauve" size="sm" onClick={() => setPick({ kind: 'poison', options: others() })}>{tr('Dùng bình độc', 'Use poison')}</Btn>}
                <Btn tone="gray" size="sm" onClick={nextStep}>{tr('Không làm gì', 'Do nothing')}</Btn>
              </div>
            </>
          )}
          {stage === 'discuss' && meP.alive && !pick && (
            <div className="ww-btns">
              {ask && puzzles < 2 && <Btn tone="lime" size="sm" disabled={solving} onClick={async () => {
                setSolving(true);
                const ok = await ask(tr('Giải câu đố của làng để nhận một gợi ý', 'Solve the village puzzle to get a clue'));
                setSolving(false); setPuzzles((n) => n + 1);
                if (ok) { setS((cur) => W.clue(cur, rnd)); sfx.star(); }
                else setS((cur) => ({ ...cur, log: [...cur.log, { day: cur.day, who: null, text: { vi: '🧩 Chưa đúng — chưa có gợi ý lần này.', en: '🧩 Not quite — no clue this time.' }, kind: 'clue' }] }));
              }}>🧩 {tr(`Giải đố lấy gợi ý (${2 - puzzles})`, `Puzzle for a clue (${2 - puzzles})`)}</Btn>}
              {!said && <Btn tone="mauve" size="sm" onClick={() => setPick({ kind: 'accuse', options: others() })}>{tr('Nêu nghi ngờ', 'Accuse')}</Btn>}
              {!said && <Btn tone="cream" size="sm" onClick={() => setPick({ kind: 'clear', options: others() })}>{tr('Bênh vực', 'Defend')}</Btn>}
              {!said && meP.role === 'seer' && Object.keys(s.checks).some((id) => s.players[Number(id)].alive) && <Btn tone="cream" size="sm" onClick={() => setPick({ kind: 'claim', options: Object.keys(s.checks).map(Number).filter((id) => s.players[id].alive) })}>{tr('Công bố kết quả soi', 'Reveal a check')}</Btn>}
              <Btn tone="orange" size="sm" onClick={startVote}>{tr('🗳️ Bỏ phiếu', '🗳️ Vote')}</Btn>
            </div>
          )}
          {pick && ['accuse', 'clear', 'claim', 'poison'].includes(pick.kind) && <Btn tone="gray" size="sm" onClick={() => setPick(null)}>{tr('Thôi', 'Cancel')}</Btn>}
          {stage === 'vote' && pick && <Btn tone="gray" size="sm" onClick={() => { setPick(null); castVotes(null); }}>{tr('Bỏ qua phiếu', 'Skip vote')}</Btn>}
          {stage === 'voted' && meP.alive && <Btn tone="orange" onClick={() => startNight(s)}>{tr('🌙 Đi ngủ', '🌙 Go to sleep')}</Btn>}
          {stage === 'end' && <p className="ww-prompt big">{s.winner === 'village' ? tr('🎉 Dân làng thắng — đã đuổi hết sói!', '🎉 The village wins — all wolves are gone!') : tr('🐺 Bầy sói thắng!', '🐺 The wolves win!')}</p>}
        </div>
      </div>
    </div>
  );
}
