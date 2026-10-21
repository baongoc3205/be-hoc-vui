import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { go, setChildState, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import { gradeRound } from '../../../shared/logic.js';
import type { FinishResult, Round, SessionStart } from '../lib/types';
import { Bar, Btn, Dialog, Panel, Spinner, SpeechBubble } from '../ui/kit';
import { Scene, type SceneName } from '../ui/Scene';
import { Chibi, MASCOTS, type Mood } from '../ui/Chibi';
import { BalanceScale, Fishing, Market, NumberLine, Pizza, SentenceBuild, SpotMistake, fmtNum, moneyText } from '../games/FunGames';
import { BadgeMedal, CoinIcon, Glyph, HeartIcon, StarIcon } from '../ui/Icons';
import { CatchFall, ClockGame, FillBlank, Match, Memory, MultiPick, Passage, Quiz, SortOrder, TrueFalse, TypeAnswer, WordBuilder } from '../games/StepGames';
import { BalloonPop, MathRace } from '../games/FlowGames';
import { CandyMatch, DrawTrace, FruitSlice, Slingshot } from '../games/ArcadeGames';
import { sfx } from '../lib/sfx';
import { speak, stopSpeak, voiceStatus } from '../lib/speech';
import { burstAt, confettiRain, flyCoins } from '../lib/fx';
import { errText } from './Auth';
import { playArcade } from './Arcade';

type Answer = { round: string; given: unknown };
const FLOW = new Set(['math-race', 'balloon-pop']);

export function Play({ lessonId }: { lessonId: string }) {
  const T = useT();
  const childId = useApp((s) => s.childId);
  const cs = useApp((s) => s.cs)!;
  const prefs = useApp((s) => s.prefs);
  const [sess, setSess] = useState<SessionStart | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [given, setGiven] = useState<unknown>(undefined);
  const [fb, setFb] = useState<{ ok: boolean; title: string; text: string } | null>(null);
  const [combo, setCombo] = useState(0);
  const [comboShow, setComboShow] = useState(0);
  const [hearts, setHearts] = useState<number | null>(null);
  const [mood, setMood] = useState<Mood>('wave');
  const [quit, setQuit] = useState(false);
  const [result, setResult] = useState<FinishResult | null>(null);
  const started = useRef(performance.now());
  const sending = useRef(false);

  useEffect(() => {
    api.post<SessionStart>(`/children/${childId}/sessions`, { lessonId })
      .then((s) => { setSess(s); setHearts(s.lesson.hearts); started.current = performance.now(); setChildState({ ...cs, energy: { ...cs.energy, value: cs.energy.enabled ? Math.max(0, cs.energy.value - 1) : cs.energy.value } }); })
      .catch((e) => setErr(e instanceof ApiError && e.code === 'DAILY_LIMIT' ? T.t('timeLimitReached') : e instanceof ApiError && e.code === 'NO_ENERGY' ? T.t('noEnergy', { m: Math.ceil(cs.energy.nextInMs / 60000) || 10 }) : errText(T, e)));
    return () => stopSpeak();
  }, [lessonId]); // eslint-disable-line

  const round: Round | undefined = sess?.rounds[idx];
  const game = sess?.game;
  // tự đọc câu hỏi cho các bé lớp 1–2
  useEffect(() => {
    if (!round || !sess || FLOW.has(sess.game) || round.say) return;
    if (prefs.autoRead && cs.child.ageTheme === 'sprout') { const id = setTimeout(() => speak(T.tx(round.prompt), T.lang), 300); return () => clearTimeout(id); }
  }, [round?.id]); // eslint-disable-line

  const finish = useCallback(async (all: Answer[]) => {
    if (!sess || sending.current) return;
    sending.current = true;
    try {
      const r = await api.post<FinishResult>(`/children/${childId}/sessions/${sess.sessionId}/finish`, { answers: all, durationSec: Math.round((performance.now() - started.current) / 1000) });
      setResult(r); setChildState(r.state);
      if (r.stars >= 1) { confettiRain(); sfx.levelup(); } else sfx.whoosh();
    } catch (e) { setErr(errText(T, e)); }
  }, [sess, childId, T]);

  const answerText = (r: Round) => {
    switch (r.kind) {
      case 'mc': return T.tx(r.options![r.answer as number]);
      case 'tf': return r.answer ? T.t('trueWord') : T.t('falseWord');
      case 'word': return String(r.answer);
      case 'clock': return `${r.h}:${String(r.m).padStart(2, '0')}`;
      case 'input': return `${String(r.answer)}${r.unit ? ` ${T.tx(r.unit)}` : ''}`;
      case 'multi': return (r.answer as number[]).map((i) => T.tx(r.options![i])).join(' · ');
      case 'numberline': return fmtNum(r.target ?? 0, T.lang);
      case 'balance': return fmtNum(Number(r.answer), T.lang);
      case 'fraction': return `${r.need}/${r.parts}`;
      case 'money': return moneyText(r.target ?? 0, T.lang);
      case 'spot': return `${(r.spot ?? [])[Number(r.answer)] ?? ''} → ${r.fix ?? ''}`;
      case 'sentence': return String(r.answer);
      default: return '';
    }
  };

  const submit = (g: unknown) => {
    if (!round || fb) return;
    const q = gradeRound(round, g);
    const ok = q >= 0.5;
    const all = [...answers, { round: round.id, given: g }];
    setAnswers(all); setGiven(g);
    const nc = ok ? combo + 1 : 0; setCombo(nc);
    if (ok) { sfx.correct(); setMood('cheer'); burstAt(document.querySelector('.opt.good, .q-card'), 'stars', 12); if (nc >= 3 && nc % 3 === 0) { setComboShow(nc); setTimeout(() => setComboShow(0), 1100); } }
    else { sfx.wrong(); setMood('sad'); if (hearts !== null) setHearts(hearts - 1); }
    const ans = answerText(round);
    const pctText = round.kind === 'pairs' || round.kind === 'classify' || round.kind === 'trace' ? `${Math.round(q * 100)}%` : '';
    const text = round.kind === 'input' && ok && q < 1 ? T.t('typeMarks', { a: ans }) : ok ? pctText : ans ? T.t('rightAnswer', { a: ans }) : pctText;
    setFb({ ok, title: T.pickOne(ok ? 'correct' : 'wrong'), text });
  };
  const next = () => {
    if (!sess) return;
    setFb(null); setGiven(undefined); setMood('idle');
    const outOfHearts = hearts !== null && hearts <= 0;
    if (idx + 1 >= sess.rounds.length || outOfHearts) finish(answers);
    else setIdx(idx + 1);
  };
  // phím Enter để tiếp tục
  useEffect(() => { if (!fb) return; const f = (e: KeyboardEvent) => { if (e.key === 'Enter' && !e.defaultPrevented && !(e.target instanceof HTMLInputElement)) next(); }; addEventListener('keydown', f); return () => removeEventListener('keydown', f); });

  const mascot = MASCOTS[{ math: 'bo', vietnamese: 'mochi', english: 'foxy', science: 'kiwi' }[sess?.lesson.subject ?? 'math'] ?? 'mimi'];
  const hint = game ? ({ 'drag-match': T.t('matchHint'), memory: T.t('memoryHint'), 'sort-order': T.t('sortHint'), 'word-builder': T.t('wordHint'), clock: T.t('clockHint'), 'catch-fall': T.t('catchHint'), 'true-false': T.t('swipeHint'), 'fruit-slice': T.t('sliceHint'), 'candy-match': T.t('candyShort'), slingshot: T.t('slingHint'), 'draw-trace': T.t('traceHint'), 'type-answer': T.t('typeHint'), 'multi-pick': T.t('multiHint'), reading: T.t('readHint') } as Record<string, string>)[game] : '';

  if (err) return (
    <div className="screen"><Scene name="night" /><div className="screen-content splash">
      <Chibi look={cs.child.look} mood="sleep" size={260} />
      <div className="bubble" style={{ maxWidth: 520, textAlign: 'center' }}>{err}</div>
      <Btn tone="lime" onClick={() => history.back()}>{T.t('back')}</Btn>
    </div></div>
  );
  if (!sess) return <div className="screen"><Scene name="meadow" /><div className="screen-content splash"><Spinner /></div></div>;

  const progress = FLOW.has(sess.game) ? answers.length : idx + (fb ? 1 : 0);
  const showPrompt = round && !['math-race', 'balloon-pop', 'fill-blank'].includes(sess.game);

  return (
    <div className="screen play">
      <Scene name={sess.lesson.subject as SceneName} />
      <div className="screen-content">
        <div className="play-top">
          <button type="button" className="back-pill" onClick={() => { sfx.tap(); setQuit(true); }}>
            <span className="back-circle"><Glyph name="pause" size={20} /></span>
            <span className="back-title">{sess.lesson.kind === 'arcade' ? '' : `${T.t('levelN', { n: sess.lesson.index })} · `}{T.tx(sess.lesson.name)}</span>
          </button>
          <Bar value={progress} max={sess.rounds.length} />
          {hearts !== null && <div className="hearts">{Array.from({ length: sess.lesson.hearts ?? 0 }, (_, i) => <HeartIcon key={i} size={36} filled={i < hearts} />)}</div>}
        </div>
        <div className="play-main">
          <div className="guide">
            <SpeechBubble>{fb ? fb.title : hint || T.tx(sess.lesson.topic)}</SpeechBubble>
            <Chibi look={mascot} mood={mood} size={230} />
          </div>
          <div className={`board ${round?.passage ? 'with-passage' : ''}`}>
            <span className="sr-only" aria-live="polite">{fb ? `${fb.title} ${fb.text}` : ''}</span>
            {round?.passage && !FLOW.has(sess.game) && <Passage round={round} T={T} />}
            {showPrompt && round && (
              <Panel className="q-card" head={<h2>{round.title && <span className="q-sub">{T.tx(round.title)}</span>}{round.kind === 'tf' ? T.t('tfAsk') : T.tx(round.prompt)}
                {!round.say && <button type="button" className="icon-btn icon-btn-mauve q-say" style={{ width: 40, height: 40, verticalAlign: 'middle' }} aria-label={T.t('listen')} onClick={() => { const vs = voiceStatus(T.lang); if (vs === 'missing' || vs === 'none') toast(T.t(vs === 'none' ? 'noSpeech' : 'noVoice'), 'warn'); speak(T.tx(round.prompt).replace(/[^\p{L}\p{N}\s.,?!:×+−=/%()]/gu, ''), T.lang, true); }}><Glyph name="speaker" size={20} /></button>}
              </h2>} />
            )}
            {sess.game === 'math-race' && <MathRace rounds={sess.rounds} T={T} look={cs.child.look} onRound={(r, g) => setAnswers((a) => [...a, { round: r.id, given: g }])} onDone={() => setAnswers((a) => { finish(a); return a; })} />}
            {sess.game === 'balloon-pop' && <BalloonPop rounds={sess.rounds} T={T} look={cs.child.look} onRound={(r, g) => setAnswers((a) => [...a, { round: r.id, given: g }])} onDone={() => setAnswers((a) => { finish(a); return a; })} />}
            {round && !FLOW.has(sess.game) && (() => {
              const p = { key: round.id, round, T, onSubmit: submit, revealed: !!fb, given };
              if (round.kind === 'tf') return <TrueFalse {...p} />;
              if (round.kind === 'pairs') return round.memory ? <Memory {...p} /> : <Match {...p} />;
              if (round.kind === 'order') return <SortOrder {...p} />;
              if (round.kind === 'word') return <WordBuilder {...p} />;
              if (round.kind === 'clock') return <ClockGame {...p} />;
              if (round.kind === 'classify') return <CatchFall {...p} />;
              if (round.kind === 'trace') return <DrawTrace {...p} />;
              if (round.kind === 'input') return <TypeAnswer {...p} />;
              if (round.kind === 'multi') return <MultiPick {...p} />;
              if (round.kind === 'numberline') return <NumberLine {...p} />;
              if (round.kind === 'balance') return <BalanceScale {...p} />;
              if (round.kind === 'fraction') return <Pizza {...p} />;
              if (round.kind === 'money') return <Market {...p} />;
              if (round.kind === 'spot') return <SpotMistake {...p} />;
              if (round.kind === 'sentence') return <SentenceBuild {...p} />;
              if (sess.game === 'fishing') return <Fishing {...p} />;
              if (sess.game === 'fruit-slice') return <FruitSlice {...p} />;
              if (sess.game === 'candy-match') return <CandyMatch {...p} />;
              if (sess.game === 'slingshot') return <Slingshot {...p} />;
              if (round.blank) return <Panel className="q-card" head={<h2>{T.t('fillHint')}</h2>}><FillBlank {...p} /></Panel>;
              return <Quiz {...p} listen={!!round.say} />;
            })()}
          </div>
        </div>
      </div>

      {fb && (
        <div className={`feedback ${fb.ok ? 'ok' : 'no'}`} role="status">
          <span className="fb-ico"><Glyph name={fb.ok ? 'check' : 'ring'} size={34} /></span>
          <div className="fb-text"><h3>{fb.title}</h3>{fb.text && <p>{fb.text}</p>}{hearts === 0 && <p>{T.t('heartsOut')}</p>}</div>
          <Btn tone={fb.ok ? 'lime' : 'orange'} onClick={next} autoFocus>{T.t('next')}</Btn>
        </div>
      )}
      {comboShow > 0 && <div className="combo title-out">{T.t('combo', { n: comboShow })}</div>}

      {quit && (
        <Dialog title={T.t('pause')} onClose={() => setQuit(false)}
          actions={<><Btn tone="gray" icon={<Glyph name="close" size={20} />} onClick={() => go(sess.lesson.kind === 'arcade' ? 'arcade' : `map/${sess.lesson.subject}/${sess.lesson.grade}`)}>{T.t('quit')}</Btn><Btn tone="orange" icon={<Glyph name="ring" size={20} />} onClick={() => setQuit(false)}>{T.t('keepPlaying')}</Btn></>}>
          {T.t('quitAsk')}
        </Dialog>
      )}
      {result && <ResultDialog r={result} subject={sess.lesson.subject} grade={sess.lesson.grade} lessonId={sess.lesson.id} arcade={sess.lesson.kind === 'arcade' ? sess.game : null} />}
    </div>
  );
}

function ResultDialog({ r, subject, grade, lessonId, arcade }: { r: FinishResult; subject: string; grade: number; lessonId: string; arcade: string | null }) {
  const T = useT();
  const cs = useApp((s) => s.cs)!;
  const coinRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    r.stars && [0, 1, 2].slice(0, r.stars).forEach((i) => setTimeout(() => sfx.star(i), 350 + i * 380));
    const id = setTimeout(() => flyCoins(coinRef.current, Math.min(8, Math.max(2, Math.round(r.coins / 4)))), 1300);
    return () => clearTimeout(id);
  }, [r]);
  const won = r.stars >= 1;
  return (
    <Dialog title={won ? T.t('complete') : T.t('almost')} icon="star"
      actions={<>
        {arcade ? <>
          <Btn tone="gray" onClick={() => go('arcade')}>{T.t('arcade')}</Btn>
          <Btn tone="lime" icon={<Glyph name="refresh" size={20} />} onClick={() => playArcade(arcade, subject)}>{T.t('playAgain')}</Btn>
        </> : <>
          <Btn tone="gray" icon={<Glyph name="refresh" size={20} />} onClick={() => { location.hash = `/play/${lessonId}?r=${Date.now()}`; }}>{T.t('retry')}</Btn>
          <Btn tone="lime" onClick={() => go(r.next && r.next.kind !== 'chest' && won ? `play/${r.next.id}` : `map/${subject}/${grade}`)}>{T.t('next')}</Btn>
        </>}
      </>}>
      <div className="result">
        <div className="big-stars">
          {won && <div className="sunburst" />}
          {[0, 1, 2].map((i) => <span key={i} className="s" style={{ animationDelay: `${0.35 + i * 0.38}s` }}><StarIcon size={i === 1 ? 110 : 84} filled={i < r.stars} /></span>)}
        </div>
        <Chibi look={cs.child.look} mood={won ? 'cheer' : 'think'} size={150} />
        <div>{T.t('correctCount', { c: r.correct, t: r.total })}{r.stars > r.prevStars && r.prevStars > 0 ? ` · ${T.t('newRecord')}` : ''}</div>
        <div className="reward-row">
          <div className="reward" ref={coinRef} style={{ animationDelay: '1.2s' }}><CoinIcon size={38} />+{r.coins}</div>
          <div className="reward" style={{ animationDelay: '1.35s' }}><span className="lv-text" style={{ fontSize: 22 }}>EXP</span>+{r.xp}</div>
        </div>
        {r.levelUp && <div className="title-out" style={{ fontSize: 36 }}>{T.t('levelUp', { n: r.levelUp })}</div>}
        {r.pet && <div className={`pet-gain ${r.pet.grew ? 'grew' : ''}`}>{(() => { const nm = cs.child.look.petName || T.t('slot_pet'); return r.pet.grew ? `🎉 ${T.t('petGrew', { name: nm })}` : `🐾 ${T.t('petResult', { name: nm, n: r.pet.after - r.pet.before })}`; })()}</div>}
        {r.newBadges.map((b) => (
          <div key={b.id} className="badge-new"><BadgeMedal icon={b.icon} size={58} /><div><div className="muted" style={{ fontSize: 16 }}>{T.t('newBadge')}</div><div>{T.tx(b.name)}</div></div></div>
        ))}
      </div>
    </Dialog>
  );
}
