import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { go, setChildState, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { ChildState, Look } from '../lib/types';
import { Bar, Btn, Inset, LvPill, Notch, Panel, SideTabs, TopBar } from '../ui/kit';
import { BadgeGrid } from '../ui/Badges';
import { Scene, type SceneName } from '../ui/Scene';
import { Chibi } from '../ui/Chibi';
import { Glyph, LockIcon, SkillTile, StarIcon, TulipIcon } from '../ui/Icons';
import { errText } from './Auth';
import { ComboCard, ItemThumb, SLOTS, TagChips, comboHave, comboLook } from '../ui/ShopCards';
import { sfx } from '../lib/sfx';
import { burstAt } from '../lib/fx';

interface Report { stats: { lessonsDone: number; bySubject: Record<string, number>; threeStars: number; correctTotal: number; streak: number } }
export { ItemThumb, SLOTS };

export function Character({ tab = 'info' }: { tab?: string }) {
  const T = useT();
  const cs = useApp((s) => s.cs)!;
  const catalog = useApp((s) => s.catalog)!;
  const childId = useApp((s) => s.childId);
  const [cur, setCur] = useState<'info' | 'outfit' | 'achievements'>((['info', 'outfit', 'achievements'].includes(tab) ? tab : 'info') as 'info');
  const [rep, setRep] = useState<Report | null>(null);
  const [draft, setDraft] = useState<Look>(cs.child.look);
  const [slot, setSlot] = useState<keyof Look | 'combo'>('hair');
  const [tag, setTag] = useState('all');
  useEffect(() => { api.get<Report>(`/children/${childId}/report`).then(setRep).catch(() => undefined); }, [childId, cs.xp]);
  useEffect(() => setDraft(cs.child.look), [cs.child.look]);
  const child = cs.child;
  const dirty = JSON.stringify(draft) !== JSON.stringify(child.look);
  const items = useMemo(() => catalog.shop.filter((s) => s.slot === slot), [catalog, slot]);
  const byId = useMemo(() => new Map(catalog.shop.map((i) => [i.id, i])), [catalog]);
  const tags = useMemo(() => new Map((catalog.collections ?? []).map((c) => [c.id, c])), [catalog]);
  const slotTags = useMemo(() => [...new Set(items.map((i) => i.tag).filter(Boolean))].map((t) => tags.get(t!)!).filter(Boolean), [items, tags]);
  const combos = useMemo(() => (catalog.combos ?? []).map((c) => ({ c, h: comboHave(c, byId, cs.owned) })).sort((a, b) => (b.h.have / b.h.total) - (a.h.have / a.h.total)), [catalog, byId, cs.owned]);

  const save = async (el: HTMLElement) => {
    try { const st = await api.post<ChildState>(`/children/${childId}/look`, { look: draft }); setChildState(st); sfx.levelup(); burstAt(el, 'stars', 16); toast(T.t('saved')); }
    catch (e) { toast(errText(T, e), 'warn'); }
  };
  const subjLv = (id: string) => 1 + Math.floor((rep?.stats.bySubject[id] ?? 0) / 3);
  const levelStars = Math.min(5, 1 + Math.floor(cs.level.level / 3));

  const stats: [string, string, number][] = [
    ['heartWave', T.t('stLessons'), rep?.stats.lessonsDone ?? 0], ['burst', T.t('stStars'), cs.stars],
    ['sword', T.t('stCorrect'), rep?.stats.correctTotal ?? 0], ['boot', T.t('stStreak'), cs.streak],
    ['shield', T.t('stBadges'), cs.badges.length], ['bolt', T.t('stCoins'), cs.coins],
  ];

  return (
    <div className="screen">
      <Scene name={(draft.scene as SceneName) || 'meadow'} />
      <div className="screen-content">
        <TopBar title={T.t('character')} to="lobby" />
        <div className="layout3">
          <div className="col-left">
            <SideTabs tabs={[{ key: 'info', label: T.t('info') }, { key: 'outfit', label: T.t('outfit') }, { key: 'achievements', label: T.t('achievements') }]} value={cur} onChange={(k) => { setCur(k); if (k !== 'outfit') setDraft(child.look); }} />
          </div>
          <div className="col-center"><div className="char-stage"><Chibi look={draft} mood={cur === 'outfit' ? 'happy' : 'idle'} size={420} title={child.nickname} /></div></div>
          <div className="col-right">
            <Panel key={cur} className="scroll-y" head={<>
              <TulipIcon size={54} />
              <div className="char-name">
                <span><span className="grad-text grade-tag">{T.t('gradeN', { n: child.grade })}</span> <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>{Array.from({ length: 5 }, (_, i) => <StarIcon key={i} size={22} filled={i < levelStars} />)}</span></span>
                <span className="nm">{child.nickname}</span>
              </div>
              <span className="chip-dark lv-text"><small>Lv.</small>{cs.level.level}</span>
            </>}>
              {cur === 'info' && (<>
                <Bar label={T.t('exp')} right={`${cs.level.current}/${cs.level.needed}`} value={cs.level.current} max={cs.level.needed} />
                <Inset><div className="stats-grid">{stats.map(([ico, label, v]) => <div key={label} className="stat"><Glyph name={ico} size={22} />{label}<span className="v">{v.toLocaleString('vi-VN')}</span></div>)}</div></Inset>
                <Notch />
                <Inset>
                  <div className="section-title" style={{ marginBottom: 10 }}>{T.t('skills')}</div>
                  <div className="skills">{catalog.subjects.map((s) => <div key={s.id} className="skill"><SkillTile kind={s.id} size={84} /><LvPill>Lv. {subjLv(s.id)}</LvPill><span>{T.tx(s.name)}</span></div>)}</div>
                </Inset>
                <div className="panel-actions">
                  <Btn tone="gray" onClick={() => setCur('outfit')}>{T.t('dressUp')}</Btn>
                  <Btn tone="lime" onClick={() => go(cs.next?.lesson ? `map/${cs.next.subject}/${child.grade}` : 'worlds')}>{T.t('keepLearning')}</Btn>
                </div>
              </>)}
              {cur === 'outfit' && (<>
                <div className="chips slot-chips">
                  <button type="button" className={`chip ${slot === 'combo' ? 'on' : ''}`} onClick={() => { sfx.tap(); setSlot('combo'); setTag('all'); }}>{T.t('tabCombo')}</button>
                  {SLOTS.map((s) => <button key={s} type="button" className={`chip ${slot === s ? 'on' : ''}`} onClick={() => { sfx.tap(); setSlot(s); setTag('all'); }}>{T.t(`slot_${s}` as 'slot_hair')}</button>)}
                </div>
                {slot !== 'combo' && <TagChips tags={slotTags} value={tag} onChange={setTag} />}
                <div className="item-grid">
                  {slot === 'combo' && combos.map(({ c, h }) => (
                    <ComboCard key={c.id} combo={c} base={draft} byId={byId} owned={cs.owned} price={h.items.filter((i) => i.price > 0 && !cs.owned.includes(i.id)).reduce((a, i) => a + i.price, 0)} full={0} locked
                      on={h.complete && Object.entries(comboLook(c, byId)).every(([k, v]) => draft[k as keyof Look] === v)} tag={tags.get(c.tag)}
                      onClick={() => { sfx.tap(); if (h.complete) setDraft({ ...draft, ...comboLook(c, byId) }); else toast(T.t('comboHave', { a: h.have, b: h.total }) + ' — ' + T.t('notOwned'), 'warn'); }} />
                  ))}
                  {slot !== 'combo' && items.filter((i) => tag === 'all' || i.tag === tag).map((it) => {
                    const owned = cs.owned.includes(it.id);
                    const on = draft[it.slot] === it.value;
                    return (
                      <button key={it.id} type="button" className={`item-card ${on ? 'on' : ''}`} onClick={() => { sfx.tap(); if (owned) setDraft({ ...draft, [it.slot]: it.value }); else toast(T.t('notOwned'), 'warn'); }}>
                        <ItemThumb item={it} look={draft} />
                        <span>{T.tx(it.name)}</span>
                        {owned ? (on ? <span className="owned">{T.t('equipped')}</span> : null) : <span className="price"><LockIcon size={14} /> {it.price}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="panel-actions">
                  <Btn tone="gray" onClick={() => go('shop')}>{T.t('shop')}</Btn>
                  <Btn tone="lime" disabled={!dirty} onClick={(e) => save(e.currentTarget)}>{T.t('save')}</Btn>
                </div>
              </>)}
              {cur === 'achievements' && (
                <BadgeGrid />
              )}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
