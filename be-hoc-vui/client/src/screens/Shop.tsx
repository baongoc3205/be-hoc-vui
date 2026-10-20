import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { setChildState, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { ActiveEvent, Badge, ChildState, Combo, Look, ShopItem } from '../lib/types';
import { Btn, Dialog, Panel, SideTabs, TopBar } from '../ui/kit';
import { Scene, type SceneName } from '../ui/Scene';
import { Chibi } from '../ui/Chibi';
import { CoinIcon } from '../ui/Icons';
import { ComboCard, ItemCard, SLOTS, TagChips, comboHave, comboLook } from '../ui/ShopCards';
import { errText } from './Auth';
import { sfx } from '../lib/sfx';
import { burstAt } from '../lib/fx';
import { COMBO_DISCOUNT, EVENT_DISCOUNT, comboPrice, itemPrice } from '../../../shared/shop.js';

type Tab = keyof Look | 'event' | 'combo';
type Sel = { kind: 'item'; id: string } | { kind: 'combo'; id: string } | null;
const dm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const pct = (x: number) => Math.round(x * 100);

export function Shop() {
  const T = useT();
  const cs = useApp((s) => s.cs)!;
  const catalog = useApp((s) => s.catalog)!;
  const childId = useApp((s) => s.childId);
  const events: ActiveEvent[] = cs.events?.active ?? [];
  const [tab, setTab] = useState<Tab>(events.length ? 'event' : 'combo');
  const [tag, setTag] = useState('all');
  const [tryOn, setTryOn] = useState<Look>(cs.child.look);
  const [sel, setSel] = useState<Sel>(null);
  const [ask, setAsk] = useState<Sel>(null);
  const byId = useMemo(() => new Map(catalog.shop.map((i) => [i.id, i])), [catalog]);
  const tags = useMemo(() => new Map((catalog.collections ?? []).map((c) => [c.id, c])), [catalog]);
  const combos = catalog.combos ?? [];

  const priceOfCombo = (c: Combo) => {
    const items = c.items.map((i) => byId.get(i)).filter((x): x is ShopItem => !!x);
    const r = comboPrice(c, items, cs.owned, events);
    const raw = items.filter((i) => r.missing.includes(i.id)).reduce((a, i) => a + i.price, 0);
    return { ...r, raw };
  };
  const slotItems = useMemo(() => (SLOTS.includes(tab as keyof Look) ? catalog.shop.filter((s) => s.slot === tab && s.price > 0) : []).sort((a, b) => a.price - b.price), [catalog, tab]);
  const slotTags = useMemo(() => [...new Set(slotItems.map((i) => i.tag).filter(Boolean))].map((t) => tags.get(t!)!).filter(Boolean), [slotItems, tags]);
  const comboTags = useMemo(() => [...new Set(combos.map((c) => c.tag))].map((t) => tags.get(t)!).filter(Boolean), [combos, tags]);

  const pickItem = (it: ShopItem) => { sfx.tap(); setTryOn({ ...tryOn, [it.slot]: it.value }); setSel({ kind: 'item', id: it.id }); };
  const pickCombo = (c: Combo) => { sfx.tap(); setTryOn({ ...tryOn, ...comboLook(c, byId) }); setSel({ kind: 'combo', id: c.id }); };

  const itemCards = (list: ShopItem[]) => list.map((it) => (
    <ItemCard key={it.id} item={it} look={tryOn} on={tryOn[it.slot] === it.value} owned={cs.owned.includes(it.id)} price={itemPrice(it, events)} tag={it.tag ? tags.get(it.tag) : undefined} onClick={() => pickItem(it)} />
  ));
  const comboCards = (list: Combo[]) => list.map((c) => { const p = priceOfCombo(c); return (
    <ComboCard key={c.id} combo={c} base={cs.child.look} byId={byId} owned={cs.owned} price={p.price} full={p.raw} on={sel?.kind === 'combo' && sel.id === c.id} tag={tags.get(c.tag)} onClick={() => pickCombo(c)} />
  ); });

  // nút mua theo lựa chọn hiện tại
  const buyInfo = (() => {
    if (!sel) return null;
    if (sel.kind === 'combo') {
      const c = combos.find((x) => x.id === sel.id); if (!c) return null;
      const p = priceOfCombo(c); if (!p.missing.length) return null;
      return { label: T.t('buyCombo', { price: p.price }), price: p.price };
    }
    const it = byId.get(sel.id); if (!it || cs.owned.includes(it.id) || tryOn[it.slot] !== it.value) return null;
    const price = itemPrice(it, events);
    return { label: `${T.t('buy')} ${price}`, price };
  })();

  const doBuy = async (el: HTMLElement) => {
    const a = ask; setAsk(null);
    if (!a) return;
    const price = a.kind === 'combo' ? priceOfCombo(combos.find((c) => c.id === a.id)!).price : itemPrice(byId.get(a.id), events);
    if (cs.coins < price) { sfx.wrong(); toast(T.t('notEnough'), 'warn'); return; }
    try {
      if (a.kind === 'combo') {
        const r = await api.post<{ state: ChildState; newBadges: Badge[] }>(`/children/${childId}/combo/${a.id}`);
        sfx.levelup(); burstAt(el, 'confetti', 44);
        setChildState(r.state); setTryOn(r.state.child.look);
        toast(r.newBadges.length ? `${T.t('comboWorn')} ${T.t('newBadge')} ${T.tx(r.newBadges[0].name)}` : T.t('comboWorn'));
      } else {
        const it = byId.get(a.id)!;
        const r = await api.post<{ state: ChildState; newBadges: Badge[] }>(`/children/${childId}/shop/${it.id}`);
        sfx.open(); burstAt(el, 'confetti', 30);
        const st = await api.post<ChildState>(`/children/${childId}/look`, { look: { [it.slot]: it.value } });
        setChildState(st); setTryOn(st.child.look);
        toast(r.newBadges.length ? `${T.t('bought')} ${T.t('newBadge')} ${T.tx(r.newBadges[0].name)}` : T.t('bought'));
      }
      setSel(null);
    } catch (e) { toast(errText(T, e), 'warn'); }
  };

  const claimGift = async (ev: ActiveEvent, el: HTMLElement) => {
    try {
      const r = await api.post<{ item: ShopItem | null; coins: number; state: ChildState; newBadges: Badge[] }>(`/children/${childId}/events/${ev.id}/gift`);
      sfx.open(); burstAt(el, 'confetti', 36); setChildState(r.state);
      if (r.item) { setTryOn({ ...tryOn, [r.item.slot]: r.item.value }); toast(T.t('giftGot', { name: T.tx(r.item.name) })); }
      else toast(T.t('giftCoins', { coins: r.coins }));
    } catch (e) { toast(errText(T, e), 'warn'); }
  };

  const askItem = ask?.kind === 'item' ? byId.get(ask.id) : null;
  const askCombo = ask?.kind === 'combo' ? combos.find((c) => c.id === ask.id) : null;
  const tabs = [
    { key: 'event' as Tab, label: T.t('tabEvent'), badge: events.some((e) => !e.claimed) },
    { key: 'combo' as Tab, label: T.t('tabCombo') },
    ...SLOTS.map((s) => ({ key: s as Tab, label: T.t(`slot_${s}` as 'slot_hair') })),
  ];
  const head = tab === 'event' ? `🎉 ${T.t('tabEvent')}` : tab === 'combo' ? T.t('comboTitle') : T.t(`slot_${tab}` as 'slot_hair');

  return (
    <div className="screen">
      <Scene name={(tryOn.scene as SceneName) || 'beach'} />
      <div className="screen-content">
        <TopBar title={T.t('shop')} to="lobby" />
        <div className="layout3">
          <div className="col-left"><SideTabs tabs={tabs} value={tab} onChange={(k) => { setTab(k); setTag('all'); setSel(null); }} /></div>
          <div className="col-center"><div className="char-stage"><Chibi look={tryOn} mood="happy" size={420} /></div></div>
          <div className="col-right">
            <Panel className="scroll-y" head={<h2>{head}</h2>}>
              {tab === 'event' && (<>
                {events.length === 0 && <p className="shop-note">{T.t('noEvent')}</p>}
                {cs.events?.next && <p className="shop-note small">{cs.events.next.icon} {T.t('eventNext', { name: T.tx(cs.events.next.name), date: dm(cs.events.next.start) })}</p>}
                {events.map((ev) => {
                  const theme = tags.get(ev.tag);
                  const evCombos = combos.filter((c) => c.tag === ev.tag);
                  const evItems = catalog.shop.filter((i) => i.tag === ev.tag && i.price > 0).sort((a, b) => a.price - b.price);
                  const gift = byId.get(ev.gift);
                  return (
                    <section key={ev.id} className="event-block">
                      <div className="event-card">
                        <span className="event-ico" aria-hidden>{ev.icon}</span>
                        <div className="event-text">
                          <b>{T.tx(ev.name)}</b>
                          <span>{T.tx(ev.desc)}</span>
                          <small>{T.t('eventUntil', { pct: pct(EVENT_DISCOUNT), date: dm(ev.end) })}</small>
                        </div>
                        <Btn tone={ev.claimed ? 'gray' : 'orange'} disabled={ev.claimed} onClick={(e) => claimGift(ev, e.currentTarget)}>
                          {ev.claimed ? T.t('giftClaimed') : `🎁 ${T.t('giftClaim')}${gift ? `: ${T.tx(gift.name)}` : ''}`}
                        </Btn>
                      </div>
                      {evCombos.length > 0 && <div className="item-grid">{comboCards(evCombos)}</div>}
                      {evItems.length > 0 && <><div className="section-title">{T.t('eventItems', { name: theme ? T.tx(theme.name) : T.tx(ev.name) })}</div><div className="item-grid">{itemCards(evItems)}</div></>}
                    </section>
                  );
                })}
              </>)}
              {tab === 'combo' && (<>
                <p className="shop-note small">{T.t('comboHint', { pct: pct(COMBO_DISCOUNT) })}</p>
                <TagChips tags={comboTags} value={tag} onChange={setTag} />
                <div className="item-grid">{comboCards(combos.filter((c) => tag === 'all' || c.tag === tag).sort((a, b) => Number(comboHave(a, byId, cs.owned).complete) - Number(comboHave(b, byId, cs.owned).complete)))}</div>
              </>)}
              {SLOTS.includes(tab as keyof Look) && (<>
                <TagChips tags={slotTags} value={tag} onChange={setTag} />
                <div className="item-grid">{itemCards(slotItems.filter((i) => tag === 'all' || i.tag === tag))}</div>
              </>)}
              <div className="panel-actions">
                <Btn tone="gray" onClick={() => { setTryOn(cs.child.look); setSel(null); }}>{T.t('cancel')}</Btn>
                <Btn tone="orange" disabled={!buyInfo} icon={<CoinIcon size={26} />} onClick={() => buyInfo && setAsk(sel)}>{buyInfo ? buyInfo.label : T.t('buy')}</Btn>
              </div>
            </Panel>
          </div>
        </div>
      </div>
      {ask && (
        <Dialog title={T.t('notice')} onClose={() => setAsk(null)}
          actions={<><Btn tone="gray" icon={<span>✕</span>} onClick={() => setAsk(null)}>{T.t('cancel')}</Btn><Btn tone="orange" icon={<span>◯</span>} onClick={(e) => doBuy(e.currentTarget)}>{T.t('confirm')}</Btn></>}>
          {askCombo ? (() => { const p = priceOfCombo(askCombo); return T.t('comboAsk', { name: T.tx(askCombo.name), n: p.missing.length, price: p.price }); })()
            : askItem ? T.t('buyAsk', { name: T.tx(askItem.name), price: itemPrice(askItem, events) }) : null}
        </Dialog>
      )}
    </div>
  );
}
