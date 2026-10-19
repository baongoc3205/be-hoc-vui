import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { setChildState, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { ChildState, Look } from '../lib/types';
import { Bar, Btn, Panel, SideTabs, Spinner, TopBar } from '../ui/kit';
import { BadgeGrid } from '../ui/Badges';
import { Scene } from '../ui/Scene';
import { Chibi } from '../ui/Chibi';
import { CoinIcon, Glyph } from '../ui/Icons';
import { CheckinCalendar, CheckinGot, useCheckin } from '../ui/Checkin';
import { errText } from './Auth';
import { burstAt, flyCoins } from '../lib/fx';

export function Rewards({ tab = 'quests' }: { tab?: string }) {
  const T = useT();
  const cs = useApp((s) => s.cs)!;
  const childId = useApp((s) => s.childId);
  const initial = tab === 'chest' ? 'checkin' : tab;
  const [cur, setCur] = useState<'quests' | 'checkin' | 'badges'>((['quests', 'checkin', 'badges'].includes(initial) ? initial : 'quests') as 'quests');
  useEffect(() => { const t = tab === 'chest' ? 'checkin' : tab; if (['quests', 'checkin', 'badges'].includes(t)) setCur(t as 'quests'); }, [tab]);
  const ck = useCheckin();
  const got = ck.result;

  const claim = async (id: string, el: HTMLElement) => {
    try { const r = await api.post<{ coins: number; state: ChildState }>(`/children/${childId}/quests/${id}/claim`); flyCoins(el, 5); burstAt(el, 'stars', 12); setChildState(r.state); }
    catch (e) { toast(errText(T, e), 'warn'); }
  };

  return (
    <div className="screen">
      <Scene name="village" />
      <div className="screen-content">
        <TopBar title={T.t('treasure')} to="lobby" />
        <div className="layout3">
          <div className="col-left"><SideTabs tabs={[{ key: 'quests', label: T.t('quests'), badge: cs.quests.some((q) => q.done && !q.claimed) }, { key: 'checkin', label: T.t('checkin'), badge: !cs.checkin.today }, { key: 'badges', label: T.t('achievements') }]} value={cur} onChange={setCur} /></div>
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
            {cur === 'checkin' && (
              <Panel className="scroll-y" head={<><Glyph name="calendar" size={34} /><h2>{T.t('checkinTitle')}</h2></>}>
                <CheckinCalendar />
                {got ? <CheckinGot r={got} /> : <p className="muted ck-hint">{cs.checkin.today ? T.t('checkinDone') : T.t('checkinHint')}</p>}
                <div className="muted ck-total">{T.t('checkinTotal', { n: cs.checkin.total })}</div>
                <div className="panel-actions">
                  <Btn tone={cs.checkin.today ? 'gray' : 'orange'} disabled={cs.checkin.today || ck.busy} onClick={(e) => ck.claim(e.currentTarget)}>{cs.checkin.today ? T.t('checkinDoneShort') : T.t('checkinBtn')}</Btn>
                </div>
              </Panel>
            )}
            {cur === 'badges' && (
              <Panel className="scroll-y" head={<h2>{T.t('badgesTitle')}</h2>}>
                <BadgeGrid />
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
