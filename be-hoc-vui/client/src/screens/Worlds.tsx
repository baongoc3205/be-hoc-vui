import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { go, setChildState, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { ChildState, MapData, MapNode, SubjectId } from '../lib/types';
import { Bar, Btn, Dialog, Panel, Spinner, Stars, TopBar } from '../ui/kit';
import { Scene, type SceneName } from '../ui/Scene';
import { Chibi, MASCOTS } from '../ui/Chibi';
import { ChestIcon, CoinIcon, CrownIcon, EnergyIcon, GameTile, LockIcon, SkillTile } from '../ui/Icons';
import { errText } from './Auth';
import { burstAt, flyCoins } from '../lib/fx';
import { sfx } from '../lib/sfx';

interface WorldInfo { subject: SubjectId; done: number; total: number; stars: number; maxStars: number; topics: { id: string; title: { vi: string; en: string }; practice?: boolean }[] }

function GradeBar({ grade, onPick }: { grade: number; onPick: (g: number) => void }) {
  const T = useT();
  return (
    <div className="grade-bar">
      <span className="title-out">{T.t('grade')}</span>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => <button key={g} type="button" className={`grade-pill ${g === grade ? 'on' : ''}`} onClick={() => { sfx.tap(); onPick(g); }}>{g}</button>)}
    </div>
  );
}

export function Worlds({ grade }: { grade: number }) {
  const T = useT();
  const childId = useApp((s) => s.childId);
  const catalog = useApp((s) => s.catalog)!;
  const [data, setData] = useState<WorldInfo[] | null>(null);
  useEffect(() => { setData(null); api.get<{ worlds: WorldInfo[] }>(`/children/${childId}/worlds?grade=${grade}`).then((r) => setData(r.worlds)).catch(() => setData([])); }, [childId, grade]);

  return (
    <div className="screen">
      <Scene name="meadow" />
      <div className="screen-content">
        <TopBar title={T.t('chooseWorld')} to="lobby" />
        <GradeBar grade={grade} onPick={(g) => go(`worlds/${g}`)} />
        {!data ? <Spinner /> : (
          <div className="worlds-grid">
            {catalog.subjects.map((s) => {
              const w = data.find((x) => x.subject === s.id);
              return (
                <button key={s.id} type="button" className="world-card" onClick={() => { sfx.pop(); go(`map/${s.id}/${grade}`); }}>
                  <Panel head={<h3>{T.tx(s.name)}</h3>}>
                    <div className="art"><SkillTile kind={s.id} size={76} /><Chibi look={MASCOTS[s.mascot]} mood="happy" size={160} /></div>
                    <div className="section-title">{T.tx(s.world)}</div>
                    <div className="topics">{w?.topics.filter((t) => !t.practice).map((t) => T.tx(t.title)).join(' · ')}{w && w.topics.some((t) => t.practice) ? ` · ${T.t('practiceCount', { n: w.topics.filter((t) => t.practice).length })}` : ''}</div>
                    <Bar label={<span style={{ fontSize: 18 }}>{T.t('progress')}</span>} right={<span style={{ fontSize: 18 }}>{w?.done ?? 0}/{w?.total ?? 0}</span>} value={w?.done ?? 0} max={w?.total ?? 1} />
                    <div className="stat-line"><Stars n={1} of={1} size={24} /> {w?.stars ?? 0}/{w?.maxStars ?? 0}</div>
                  </Panel>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function MapScreen({ subject, grade }: { subject: string; grade: number }) {
  const T = useT();
  const childId = useApp((s) => s.childId);
  const cs = useApp((s) => s.cs)!;
  const catalog = useApp((s) => s.catalog)!;
  const subj = catalog.subjects.find((s) => s.id === subject);
  const [map, setMap] = useState<MapData | null>(null);
  const [pick, setPick] = useState<MapNode | null>(null);
  const [chest, setChest] = useState<{ node: MapNode; coins?: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const load = () => api.get<MapData>(`/children/${childId}/map?subject=${subject}&grade=${grade}`).then(setMap).catch(() => toast(T.t('err_SERVER_ERROR'), 'warn'));
  useEffect(() => { setMap(null); load(); /* eslint-disable-next-line */ }, [childId, subject, grade]);
  useEffect(() => {
    if (!map || !scroller.current) return;
    const el = scroller.current.querySelector<HTMLElement>('.map-node.current');
    if (el) scroller.current.scrollLeft = el.offsetLeft - scroller.current.clientWidth / 2;
    const chip = document.querySelector<HTMLElement>('.chapter-chip.here'); const bar = chip?.parentElement;
    if (chip && bar) bar.scrollLeft = chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2;
  }, [map]);

  const STEP = 168, PAD = 130;
  const pos = (i: number) => ({ x: PAD + i * STEP, y: 54 + Math.sin(i * 0.95) * 26 });
  const width = map ? PAD * 2 + (map.nodes.length - 1) * STEP : 0;
  const pathD = map ? map.nodes.map((_, i) => { const p = pos(i); if (i === 0) return `M${p.x} ${p.y}`; const q = pos(i - 1); const mx = (q.x + p.x) / 2; return `C${mx} ${q.y} ${mx} ${p.y} ${p.x} ${p.y}`; }).join(' ') : '';

  const onNode = (n: MapNode) => {
    if (!n.unlocked) { sfx.wrong(); toast(T.t('err_LESSON_LOCKED'), 'warn'); return; }
    if (n.kind === 'chest') { if (n.done) { toast(T.t('chestTomorrow')); return; } setChest({ node: n }); return; }
    setPick(n);
  };
  const openChest = async (btn: HTMLElement | null) => {
    if (!chest) return;
    try {
      const r = await api.post<{ coins: number; state: ChildState }>(`/children/${childId}/chests/${chest.node.id}`);
      sfx.open(); burstAt(btn, 'confetti', 30); flyCoins(btn, 6);
      setChest({ ...chest, coins: r.coins }); setChildState(r.state); load();
    } catch (e) { toast(errText(T, e), 'warn'); setChest(null); }
  };
  const start = () => {
    if (!pick) return;
    if (cs.energy.enabled && cs.energy.value < 1) { toast(T.t('noEnergy', { m: Math.ceil(cs.energy.nextInMs / 60000) }), 'warn'); return; }
    if (cs.today.limit > 0 && cs.today.minutes >= cs.today.limit) { toast(T.t('timeLimitReached'), 'warn'); return; }
    go(`play/${pick.id}`);
  };

  const topicStart = new Map<string, number>();
  map?.nodes.forEach((n, i) => { if (!topicStart.has(n.topicId)) topicStart.set(n.topicId, i); });

  return (
    <div className="screen">
      <Scene name={(subject as SceneName) ?? 'meadow'} />
      <div className="screen-content">
        <TopBar title={`${T.tx(subj?.world)} · ${T.t('gradeN', { n: grade })}`} to={`worlds/${grade}`} />
        {map && map.topics.length > 1 && (
          <div className="chapter-bar" role="tablist" aria-label={T.t('chapters')}>
            {map.topics.map((t, k) => {
              const i = topicStart.get(t.id) ?? 0;
              const nodes = map.nodes.filter((n) => n.topicId === t.id);
              const done = nodes.length > 0 && nodes.every((n) => n.done);
              const here = nodes.some((n) => n.id === map.current);
              return (
                <button key={t.id} type="button" role="tab" aria-selected={here} className={`chapter-chip ${done ? 'done' : ''} ${here ? 'here' : ''} ${t.practice ? 'practice' : ''}`}
                  onClick={() => { sfx.tap(); const el = scroller.current; if (el) el.scrollLeft = pos(i).x - 150; }}>
                  <span className="n">{k + 1}</span>{T.tx(t.title)}
                </button>
              );
            })}
          </div>
        )}
        {!map ? <Spinner /> : (
          <div className="map-scroll" ref={scroller}>
            <div className="map-track" style={{ width }}>
              <svg className="map-path" viewBox={`0 0 ${width} 100`} preserveAspectRatio="none" width={width} height="100%">
                <path d={pathD} fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="16" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                <path d={pathD} fill="none" stroke="#B9A6A5" strokeWidth="5" strokeDasharray="2 16" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
              </svg>
              {map.topics.map((t) => { const i = topicStart.get(t.id) ?? 0; const p = pos(i); return <div key={t.id} className="topic-flag" style={{ left: Math.max(p.x + 40, 160), top: 4 }}>{T.tx(t.title)}</div>; })}
              {map.nodes.map((n, i) => {
                const p = pos(i);
                const isCur = n.id === map.current;
                const cls = `map-node ${n.done ? 'done' : ''} ${isCur ? 'current' : ''} ${!n.unlocked ? 'locked' : ''} ${n.kind === 'boss' ? 'boss' : ''}`;
                return (
                  <button key={n.id} type="button" className={cls} style={{ left: p.x, top: `${p.y}%` }} onClick={() => onNode(n)} aria-label={`${T.t('levelN', { n: n.index })} ${T.tx(n.name)}`}>
                    {isCur && <div className="me"><Chibi look={cs.child.look} mood="happy" size={92} /></div>}
                    <div className="disc">
                      {n.kind === 'boss' && <span className="crown"><CrownIcon size={40} /></span>}
                      {n.kind === 'chest' ? <ChestIcon size={60} open={n.done} /> : !n.unlocked ? <LockIcon size={32} /> : n.index}
                    </div>
                    {n.kind !== 'chest' && <Stars n={n.stars} size={20} />}
                    <span className="label">{n.kind === 'chest' ? T.t('chest') : T.tx(n.name)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {pick && (
        <Dialog title={`${T.t('levelN', { n: pick.index })} · ${T.tx(pick.name)}`} icon="flower" onClose={() => setPick(null)}
          actions={<><Btn tone="gray" icon={<span style={{ fontSize: 22 }}>✕</span>} onClick={() => setPick(null)}>{T.t('cancel')}</Btn><Btn tone="lime" icon={cs.energy.enabled ? <EnergyIcon size={28} /> : undefined} onClick={start}>{T.t('play')}</Btn></>}>
          <div className="lesson-pop">
            <GameTile game={pick.game} tone={subject} size={110} />
            <div>{T.tx(map?.topics.find((t) => t.id === pick.topicId)?.title)}</div>
            <Stars n={pick.stars} size={36} />
            {pick.tier ? <div className="tier-line">{T.t('difficulty')}: <span aria-label={`${pick.tier}/4`}>{'●'.repeat(pick.tier)}<span className="off">{'●'.repeat(4 - pick.tier)}</span></span></div> : null}
            <div className="goals"><span>{T.t('goal1')}</span><span>{T.t('goal2')}</span><span>{T.t('goal3')}</span></div>
            <div className="stat-line" style={{ justifyContent: 'center' }}>{T.t('reward')}: <CoinIcon size={28} /> ~{pick.coins}{cs.energy.enabled && <> · <span className="muted">{T.t('energyCost')}</span></>}</div>
          </div>
        </Dialog>
      )}
      {chest && (
        <Dialog title={T.t('chest')} icon="flower" onClose={() => setChest(null)}
          actions={chest.coins === undefined ? <><Btn tone="gray" onClick={() => setChest(null)}>{T.t('cancel')}</Btn><Btn tone="orange" onClick={(e) => openChest(e.currentTarget)}>{T.t('openChest')}</Btn></> : <Btn tone="lime" onClick={() => setChest(null)}>{T.t('ok')}</Btn>}>
          <div className="chest-big"><div className={`chest ${chest.coins === undefined ? '' : ''}`}><ChestIcon size={150} open={chest.coins !== undefined} /></div>
            {chest.coins !== undefined && <div>{T.t('chestOpened', { n: chest.coins })}</div>}
          </div>
        </Dialog>
      )}
    </div>
  );
}
