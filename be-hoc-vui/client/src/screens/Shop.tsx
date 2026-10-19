import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { setChildState, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { Badge, ChildState, Look, ShopItem } from '../lib/types';
import { Btn, Dialog, Panel, SideTabs, TopBar } from '../ui/kit';
import { Scene, type SceneName } from '../ui/Scene';
import { Chibi } from '../ui/Chibi';
import { CoinIcon } from '../ui/Icons';
import { ItemThumb, SLOTS } from './Character';
import { errText } from './Auth';
import { sfx } from '../lib/sfx';
import { burstAt } from '../lib/fx';

export function Shop() {
  const T = useT();
  const cs = useApp((s) => s.cs)!;
  const catalog = useApp((s) => s.catalog)!;
  const childId = useApp((s) => s.childId);
  const [slot, setSlot] = useState<keyof Look>('ears');
  const [tryOn, setTryOn] = useState<Look>(cs.child.look);
  const [ask, setAsk] = useState<ShopItem | null>(null);
  const items = useMemo(() => catalog.shop.filter((s) => s.slot === slot && s.price > 0).sort((a, b) => a.price - b.price), [catalog, slot]);

  const buy = async (el: HTMLElement) => {
    if (!ask) return;
    if (cs.coins < ask.price) { sfx.wrong(); toast(T.t('notEnough'), 'warn'); setAsk(null); return; }
    try {
      const r = await api.post<{ state: ChildState; newBadges: Badge[] }>(`/children/${childId}/shop/${ask.id}`);
      sfx.open(); burstAt(el, 'confetti', 30);
      const st = await api.post<ChildState>(`/children/${childId}/look`, { look: { [ask.slot]: ask.value } });
      setChildState(st); setTryOn(st.child.look);
      toast(r.newBadges.length ? `${T.t('bought')} ${T.t('newBadge')} ${T.tx(r.newBadges[0].name)}` : T.t('bought'));
    } catch (e) { toast(errText(T, e), 'warn'); }
    setAsk(null);
  };

  return (
    <div className="screen">
      <Scene name={(tryOn.scene as SceneName) || 'beach'} />
      <div className="screen-content">
        <TopBar title={T.t('shop')} to="lobby" />
        <div className="layout3">
          <div className="col-left"><SideTabs tabs={SLOTS.map((s) => ({ key: s, label: T.t(`slot_${s}` as 'slot_hair') }))} value={slot} onChange={(k) => { setSlot(k); }} /></div>
          <div className="col-center"><div className="char-stage"><Chibi look={tryOn} mood="happy" size={420} /></div></div>
          <div className="col-right">
            <Panel className="scroll-y" head={<h2>{T.t(`slot_${slot}` as 'slot_hair')}</h2>}>
              <div className="item-grid">
                {items.map((it) => {
                  const owned = cs.owned.includes(it.id);
                  return (
                    <button key={it.id} type="button" className={`item-card ${tryOn[it.slot] === it.value ? 'on' : ''}`} onClick={() => { sfx.tap(); setTryOn({ ...tryOn, [it.slot]: it.value }); }}>
                      {it.price >= 150 && !owned && <span className="new">HOT</span>}
                      <ItemThumb item={it} look={tryOn} />
                      <span>{T.tx(it.name)}</span>
                      {owned ? <span className="owned">{T.t('owned')}</span> : <span className="price"><CoinIcon size={18} /> {it.price}</span>}
                    </button>
                  );
                })}
              </div>
              <div className="panel-actions">
                <Btn tone="gray" onClick={() => setTryOn(cs.child.look)}>{T.t('cancel')}</Btn>
                {(() => {
                  const sel = items.find((i) => tryOn[i.slot] === i.value && !cs.owned.includes(i.id));
                  return <Btn tone="orange" disabled={!sel} icon={<CoinIcon size={26} />} onClick={() => sel && setAsk(sel)}>{sel ? `${T.t('buy')} ${sel.price}` : T.t('buy')}</Btn>;
                })()}
              </div>
            </Panel>
          </div>
        </div>
      </div>
      {ask && (
        <Dialog title={T.t('notice')} onClose={() => setAsk(null)}
          actions={<><Btn tone="gray" icon={<span>✕</span>} onClick={() => setAsk(null)}>{T.t('cancel')}</Btn><Btn tone="orange" icon={<span>◯</span>} onClick={(e) => buy(e.currentTarget)}>{T.t('confirm')}</Btn></>}>
          {T.t('buyAsk', { name: T.tx(ask.name), price: ask.price })}
        </Dialog>
      )}
    </div>
  );
}
