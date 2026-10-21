import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { go, setChildState, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { ChildState, RankRow } from '../lib/types';
import { ProfileDialog } from '../ui/ProfileDialog';
import { Avatar } from '../games/board/common';
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
  const T = useT(); const tr = (vi: string, en: string) => (T.lang === 'en' ? en : vi);
  const childId = useApp((s) => s.childId);
  const [scope, setScope] = useState<'global' | 'friends' | 'family'>('global');
  const [data, setData] = useState<{ rows: RankRow[]; me: { rank: number | null; xp: number } | null } | null>(null);
  const [profile, setProfile] = useState<number | null>(null);
  useEffect(() => { setData(null); api.get<{ rows: RankRow[]; me: { rank: number | null; xp: number } | null }>(`/children/${childId}/ranking?scope=${scope}`).then(setData).catch(() => setData({ rows: [], me: null })); }, [scope, childId]);
  const rows = data?.rows ?? [];
  const order = [rows[1], rows[0], rows[2]];
  return (
    <div className="screen">
      <Scene name="meadow" />
      <div className="screen-content">
        <TopBar title={T.t('ranking')} to="lobby" right={<Btn tone="cream" size="sm" onClick={() => go('friends')}>👫 {T.t('friends')}</Btn>} />
        <div className="rank-wrap">
          <Panel className="scroll-y" head={<h2>{tr('Bảng xếp hạng 7 ngày', 'Last 7 days')}</h2>}>
            <div className="chips rank-tabs">
              {([['global', tr('🌏 Toàn app', '🌏 Everyone')], ['friends', tr('👫 Bạn bè', '👫 Friends')], ['family', tr('🏠 Gia đình', '🏠 Family')]] as const).map(([k, l]) => <button key={k} type="button" className={`chip ${scope === k ? 'on' : ''}`} onClick={() => setScope(k)}>{l}</button>)}
            </div>
            {!data ? <Spinner /> : !rows.length ? <p className="shop-note">{scope === 'friends' ? tr('Kết bạn để thi đua cùng nhau nhé!', 'Add friends to compete together!') : tr('Chưa có ai học trong 7 ngày qua.', 'Nobody has played in the last 7 days.')}</p> : (<>
              <div className="podium">
                {order.map((r, k) => r && (
                  <button key={r.id} type="button" className="p" onClick={() => !r.me && setProfile(r.id)}><Chibi look={r.look} mood={k === 1 ? 'cheer' : 'happy'} size={120} /><div className="section-title">{r.nickname}</div>
                    <div className="block" style={{ height: k === 1 ? 120 : k === 0 ? 90 : 70 }}>{k === 1 ? 1 : k === 0 ? 2 : 3}</div></button>
                ))}
              </div>
              {rows.map((r, i) => (
                <button key={r.id} type="button" className={`rank-row ${r.me ? 'me' : ''}`} onClick={() => !r.me && setProfile(r.id)}>
                  <span className="rk">{i + 1}</span><Avatar look={r.look} size={40} /><span className="nm">{r.nickname}{r.me ? ` (${tr('bé', 'you')})` : ''}<small>{T.t('gradeN', { n: r.grade })} · Lv. {r.level}</small></span><span>{T.t('xpWeek', { n: r.xp })}</span>
                </button>
              ))}
              {data.me && !data.me.rank && <div className="rank-row me"><span className="rk">…</span><span className="nm">{tr('Bé', 'You')}</span><span>{T.t('xpWeek', { n: data.me.xp })}</span></div>}
              <p className="muted" style={{ margin: 0, fontWeight: 700 }}>{scope === 'global' ? tr('Chạm vào một bạn để xem hồ sơ và kết bạn. Phụ huynh có thể ẩn bé khỏi bảng này trong trang Phụ huynh.', 'Tap someone to see their profile. Parents can hide a child from this board.') : scope === 'friends' ? tr('Chỉ hiện bé và bạn bè của bé.', 'Only you and your friends.') : T.t('onlyFamily')}</p>
            </>)}
          </Panel>
        </div>
      </div>
      {profile && <ProfileDialog id={profile} onClose={() => setProfile(null)} />}
    </div>
  );
}
