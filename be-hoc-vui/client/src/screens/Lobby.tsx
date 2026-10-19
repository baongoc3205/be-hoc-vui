import { useEffect, useState } from 'react';
import { go, useApp } from '../lib/store';
import { useT, openSettings } from '../lib/hooks';
import { Bar, Btn, Hud, IconBtn, Inset, Panel, SideTabs, SpeechBubble } from '../ui/kit';
import { Scene, type SceneName } from '../ui/Scene';
import { Chibi } from '../ui/Chibi';
import { GameTile, Glyph, TulipIcon } from '../ui/Icons';
import { CheckinDialog } from '../ui/Checkin';

/** Hộp thoại điểm danh chỉ tự bật 1 lần mỗi ngày cho mỗi bé (trong phiên mở trang). */
const autoShown = new Set<string>();

export type MenuKey = 'learn' | 'quests' | 'treasure' | 'shop' | 'character' | 'ranking';
export function MainMenu({ value }: { value: MenuKey | 'lobby' }) {
  const T = useT();
  const cs = useApp((s) => s.cs);
  const questReady = cs?.quests.some((q) => q.done && !q.claimed) || (cs ? !cs.checkin.today : false);
  const tabs: { key: MenuKey | 'lobby'; label: string; badge?: boolean }[] = [
    { key: 'lobby', label: T.t('lobby') }, { key: 'learn', label: T.t('learn') }, { key: 'quests', label: T.t('quests'), badge: !!questReady },
    { key: 'shop', label: T.t('shop') }, { key: 'character', label: T.t('character') }, { key: 'ranking', label: T.t('ranking') },
  ];
  const to: Record<string, string> = { lobby: 'lobby', learn: 'worlds', quests: 'rewards', treasure: 'rewards/badges', shop: 'shop', character: 'character', ranking: 'ranking' };
  return <SideTabs tabs={tabs} value={value} onChange={(k) => go(to[k])} />;
}

function greeting(T: ReturnType<typeof useT>, name: string) {
  const h = new Date().getHours();
  if (h >= 21 || h < 5) return T.t('lateNight');
  const part = h < 11 ? T.t('morning') : h < 18 ? T.t('afternoon') : T.t('evening');
  return `${part}, ${name}!`;
}

export function Lobby() {
  const T = useT();
  const cs = useApp((s) => s.cs)!;
  const catalog = useApp((s) => s.catalog)!;
  const child = cs.child;
  const next = cs.next;
  const subj = catalog.subjects.find((s) => s.id === next?.subject);
  const claimable = cs.quests.filter((q) => q.done && !q.claimed).length;
  const parent = useApp((s) => s.parent);
  const [ckOpen, setCkOpen] = useState(false);
  useEffect(() => {
    const key = `${child.id}:${new Date().toDateString()}`;
    if (!cs.checkin.today && !autoShown.has(key)) { autoShown.add(key); const t = setTimeout(() => setCkOpen(true), 700); return () => clearTimeout(t); }
  }, [child.id, cs.checkin.today]);

  return (
    <div className="screen lobby">
      <Scene name={(child.look.scene as SceneName) || 'meadow'} />
      <div className="screen-content">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TulipIcon size={46} />
            <div className="logo lobby-logo">Bé <span className="accent">Học</span> Vui</div>
          </div>
          <div className="topbar-right"><Hud /><IconBtn name="gear" label={T.t('settings')} onClick={openSettings} /></div>
        </div>
        <div className="layout3">
          <div className="col-left"><MainMenu value="lobby" /></div>
          <div className="col-center">
            <div className="char-stage has-bubble">
              <SpeechBubble>{greeting(T, child.nickname)}</SpeechBubble>
              <Chibi look={child.look} mood="wave" size={420} title={child.nickname} />
            </div>
          </div>
          <div className="col-right">
            <Panel
              className="scroll-y"
              head={<>
                <TulipIcon size={52} />
                <div className="char-name"><span className="grad-text grade-tag">{T.t('gradeN', { n: child.grade })}</span><span className="nm">{child.nickname}</span></div>
                <span className="chip-dark lv-text"><small>Lv.</small>{cs.level.level}</span>
              </>}
            >
              {parent?.isGuest && (
                <button type="button" className="guest-note" onClick={() => go('parents')}>
                  <Glyph name="alert" size={22} /><span>{T.t('guestWarn')}</span><b>{T.t('saveProgress')}</b>
                </button>
              )}
              <Bar label={T.t('exp')} right={`${cs.level.current}/${cs.level.needed}`} value={cs.level.current} max={cs.level.needed} />
              <Inset>
                <div className="section-title" style={{ marginBottom: 10 }}>{T.t('todayPick')}</div>
                {next?.lesson ? (
                  <div className="next-card">
                    <GameTile game={next.lesson.game} tone={next.subject} size={86} />
                    <div className="meta">
                      <div className="muted" style={{ fontWeight: 800 }}>{T.tx(subj?.world)} · {T.t('levelN', { n: next.lesson.index })}</div>
                      <h3>{T.tx(next.topic)}</h3>
                      <div style={{ fontWeight: 800 }}>{T.tx(next.lesson.name)}</div>
                    </div>
                  </div>
                ) : <p style={{ margin: 0, fontWeight: 800 }}>{T.t('allDone')}</p>}
              </Inset>
              <div className="quick-grid">
                <button type="button" className={`quick ${cs.checkin.today ? '' : 'hot'}`} onClick={() => setCkOpen(true)}>
                  <span className="ico"><Glyph name="calendar" size={30} /></span>{T.t('checkin')}
                  {!cs.checkin.today && <i className="dot" />}
                </button>
                <button type="button" className="quick" onClick={() => go('rewards')}>
                  <span className="ico"><Glyph name="scroll" size={30} /></span>{T.t('quests')}
                  {claimable > 0 && <i className="dot" />}
                </button>
                <div className="quick">
                  <span className="ico" style={{ color: '#E2804F' }}><Glyph name="flame" size={30} /></span>{T.t('streakDays', { n: cs.streak })}
                </div>
              </div>
              {cs.today.limit > 0 && <Bar label={<span style={{ fontSize: 18 }}>{T.t('todayMinutes', { m: cs.today.minutes })}</span>} right={<span style={{ fontSize: 18 }}>{cs.today.limit} {T.t('minutes')}</span>} value={cs.today.minutes} max={cs.today.limit} tone="lime" />}
              <div className="panel-actions">
                <Btn tone="gray" onClick={() => go('worlds')}>{T.t('chooseWorld')}</Btn>
                <Btn tone="lime" onClick={() => go(next?.lesson ? `map/${next.subject}/${child.grade}` : 'worlds')}>{T.t('play')}</Btn>
              </div>
            </Panel>
          </div>
        </div>
      </div>
      {ckOpen && <CheckinDialog onClose={() => setCkOpen(false)} />}
    </div>
  );
}
