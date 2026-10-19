import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { setChildState, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { ChildState, Look } from '../lib/types';
import { Bar, Btn, Panel, SideTabs, Spinner, TopBar } from '../ui/kit';
import { Scene } from '../ui/Scene';
import { Chibi } from '../ui/Chibi';
import { BadgeMedal, ChestIcon, CoinIcon, Glyph } from '../ui/Icons';
import { errText } from './Auth';
import { sfx } from '../lib/sfx';
import { burstAt, confettiRain, flyCoins } from '../lib/fx';

export function Rewards({ tab = 'quests' }: { tab?: string }) {
  const T = useT();
  const cs = useApp((s) => s.cs)!;
  const catalog = useApp((s) => s.catalog)!;
  const childId = useApp((s) => s.childId);
  const [cur, setCur] = useState<'quests' | 'chest' | 'badges'>((['quests', 'chest', 'badges'].includes(tab) ? tab : 'quests') as 'quests');
  const [shake, setShake] = useState(false);
  const [got, setGot] = useState<{ c: number; e: number } | null>(null);

  const claim = async (id: string, el: HTMLElement) => {
    try { const r = await api.post<{ coins: number; state: ChildState }>(`/children/${childId}/quests/${id}/claim`); flyCoins(el, 5); burstAt(el, 'stars', 12); setChildState(r.state); }
    catch (e) { toast(errText(T, e), 'warn'); }
  };
  const openChest = async (el: HTMLElement) => {
    setShake(true); sfx.whoosh();
    setTimeout(async () => {
      try { const r = await api.post<{ coins: number; energy: number; state: ChildState }>(`/children/${childId}/daily-chest`); sfx.open(); confettiRain(); flyCoins(el, 7); setGot({ c: r.coins, e: r.energy }); setChildState(r.state); }
      catch (e) { toast(errText(T, e), 'warn'); }
      setShake(false);
    }, 900);
  };

  return (
    <div className="screen">
      <Scene name="village" />
      <div className="screen-content">
        <TopBar title={T.t('treasure')} to="lobby" />
        <div className="layout3">
          <div className="col-left"><SideTabs tabs={[{ key: 'quests', label: T.t('quests'), badge: cs.quests.some((q) => q.done && !q.claimed) }, { key: 'chest', label: T.t('dailyChest'), badge: cs.chestAvailable }, { key: 'badges', label: T.t('achievements') }]} value={cur} onChange={setCur} /></div>
          <div className="col-center"><div className="char-stage"><Chibi look={cs.child.look} mood={got ? 'cheer' : 'idle'} size={400} /></div></div>
          <div className="col-right">
            {cur === 'quests' && (
              <Panel className="scroll-y" head={<h2>{T.t('dailyQuests')}</h2>}>
                {cs.quests.map((q) => (
                  <div key={q.id} className="quest">
                    <Glyph name={q.claimed ? 'check' : 'scroll'} size={32} style={{ color: q.claimed ? 'var(--lime-3)' : 'var(--mauve-600)' }} />
                    <div className="q-main"><h4>{T.tx(q.name)}</h4><Bar value={q.progress} max={q.target} right={<span style={{ fontSize: 16 }}>{q.progress}/{q.target}</span>} /></div>
                    <span className="q-coins"><CoinIcon size={26} />{q.coins}</span>
                    <Btn tone={q.done && !q.claimed ? 'orange' : 'gray'} size="sm" disabled={!q.done || q.claimed} onClick={(e) => claim(q.id, e.currentTarget)}>{q.claimed ? '✓' : T.t('claim')}</Btn>
                  </div>
                ))}
              </Panel>
            )}
            {cur === 'chest' && (
              <Panel head={<h2>{T.t('chestTitle')}</h2>}>
                <div className="chest-big">
                  <div className={`chest ${shake ? 'shake' : ''}`}><ChestIcon size={200} open={!cs.chestAvailable} /></div>
                  {got ? <div className="section-title">{T.t('chestGot', { c: got.c, e: got.e })}</div> : null}
                  {cs.chestAvailable ? <Btn tone="orange" size="lg" disabled={shake} onClick={(e) => openChest(e.currentTarget)}>{T.t('chestReady')}</Btn> : <div className="muted section-title">{T.t('chestTomorrow')}</div>}
                </div>
              </Panel>
            )}
            {cur === 'badges' && (
              <Panel className="scroll-y" head={<h2>{T.t('badgesTitle')}</h2>}>
                <div className="badge-grid">
                  {catalog.badges.map((b) => { const ok = cs.badges.includes(b.id); return <div key={b.id} className={`badge-card ${ok ? '' : 'off'}`}><BadgeMedal icon={b.icon} size={64} earned={ok} /><h4>{T.tx(b.name)}</h4><p>{T.tx(b.desc)}</p></div>; })}
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Ranking() {
  const T = useT();
  const [rows, setRows] = useState<{ id: number; nickname: string; look: Look; xp: number; stars: number }[] | null>(null);
  useEffect(() => { api.get<{ rows: typeof rows }>('/leaderboard').then((r) => setRows(r.rows)).catch(() => setRows([])); }, []);
  const order = rows ? [rows[1], rows[0], rows[2]] : [];
  return (
    <div className="screen">
      <Scene name="meadow" />
      <div className="screen-content">
        <TopBar title={T.t('ranking')} to="lobby" />
        <div style={{ maxWidth: 820, width: '100%', margin: '0 auto' }}>
          <Panel head={<h2>{T.t('familyBoard')}</h2>}>
            {!rows ? <Spinner /> : (<>
              <div className="podium">
                {order.map((r, k) => r && (
                  <div key={r.id} className="p"><Chibi look={r.look} mood={k === 1 ? 'cheer' : 'happy'} size={130} /><div className="section-title">{r.nickname}</div>
                    <div className="block" style={{ height: k === 1 ? 140 : k === 0 ? 100 : 76 }}>{k === 1 ? 1 : k === 0 ? 2 : 3}</div></div>
                ))}
              </div>
              {rows.map((r, i) => <div key={r.id} className="rank-row"><span style={{ width: 30 }}>{i + 1}</span><span style={{ flex: 1 }}>{r.nickname}</span><span>{T.t('xpWeek', { n: r.xp })}</span></div>)}
              <p className="muted" style={{ margin: 0, fontWeight: 700 }}>{T.t('onlyFamily')}</p>
            </>)}
          </Panel>
        </div>
      </div>
    </div>
  );
}
