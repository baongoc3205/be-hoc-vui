// Thẻ món đồ, thẻ combo và hàng chip chủ đề — dùng chung cho Cửa hàng và Tủ đồ.
import type { ReactNode } from 'react';
import type { Collection, Combo, Look, ShopItem } from '../lib/types';
import { useT } from '../lib/hooks';
import { sfx } from '../lib/sfx';
import { Chibi } from './Chibi';
import { Scene, type SceneName } from './Scene';
import { CoinIcon, LockIcon } from './Icons';

export const SLOTS: (keyof Look)[] = ['hair', 'hairColor', 'ears', 'outfit', 'outfitColor', 'acc', 'shoes', 'hold', 'scene'];
const FULL_BODY = new Set(['outfit', 'shoes', 'hold']);
const COLOR_SLOTS = new Set(['hairColor', 'outfitColor']);

/** Ô xem trước một món đồ: màu → chấm tròn, còn lại → nhân vật mặc thử. */
export function ItemThumb({ item, look }: { item: ShopItem; look: Look }) {
  if (COLOR_SLOTS.has(item.slot)) return <span className="swatch" style={{ background: item.value, width: 72, height: 72 }} />;
  if (item.slot === 'scene') return <div className="thumb" style={{ position: 'relative' }}><Scene name={item.value as SceneName} blur={false} /></div>;
  if (FULL_BODY.has(item.slot)) return <div className="thumb full"><Chibi look={{ ...look, [item.slot]: item.value }} size={88} /></div>;
  return <div className="thumb"><Chibi look={{ ...look, [item.slot]: item.value }} size={120} /></div>;
}

/** Bộ đồ của combo dưới dạng một phần Look. */
export function comboLook(combo: Combo, byId: Map<string, ShopItem>): Partial<Look> {
  const out: Partial<Look> = {};
  for (const id of combo.items) { const it = byId.get(id); if (it) out[it.slot] = it.value; }
  return out;
}

/** Số món của combo bé đã có (đồ miễn phí tính là đã có). */
export function comboHave(combo: Combo, byId: Map<string, ShopItem>, owned: string[]) {
  const items = combo.items.map((i) => byId.get(i)).filter((x): x is ShopItem => !!x);
  const have = items.filter((i) => i.price === 0 || owned.includes(i.id)).length;
  return { have, total: items.length, items, complete: have === items.length };
}

/** Dải chip lọc theo chủ đề. */
export function TagChips({ tags, value, onChange }: { tags: Collection[]; value: string; onChange: (id: string) => void }) {
  const T = useT();
  if (tags.length < 2) return null;
  return (
    <div className="chips tag-chips" role="tablist">
      <button type="button" className={`chip ${value === 'all' ? 'on' : ''}`} onClick={() => { sfx.tap(); onChange('all'); }}>{T.t('allTags')}</button>
      {tags.map((c) => <button key={c.id} type="button" className={`chip ${value === c.id ? 'on' : ''}`} onClick={() => { sfx.tap(); onChange(c.id); }}><span aria-hidden>{c.icon}</span> {T.tx(c.name)}</button>)}
    </div>
  );
}

/** Nhãn giá: đang giảm thì gạch giá cũ. */
export function PriceTag({ price, full, locked }: { price: number; full?: number; locked?: boolean }) {
  return (
    <span className="price">
      {locked ? <LockIcon size={14} /> : <CoinIcon size={18} />}
      {full && full > price ? <s className="was">{full}</s> : null} {price}
    </span>
  );
}

export function ItemCard({ item, look, on, owned, price, tag, onClick, status }: {
  item: ShopItem; look: Look; on: boolean; owned: boolean; price: number; tag?: Collection; onClick: () => void; status?: ReactNode;
}) {
  const T = useT();
  const sale = price < item.price;
  return (
    <button type="button" className={`item-card ${on ? 'on' : ''}`} onClick={onClick}>
      {!owned && sale && <span className="new sale">-{Math.round((1 - price / item.price) * 100)}%</span>}
      {!owned && !sale && item.price >= 200 && <span className="new">HOT</span>}
      {tag?.holiday && <span className="tag-ico" title={T.tx(tag.name)}>{tag.icon}</span>}
      <ItemThumb item={item} look={look} />
      <span>{T.tx(item.name)}</span>
      {status ?? (owned ? <span className="owned">{T.t('owned')}</span> : <PriceTag price={price} full={item.price} />)}
    </button>
  );
}

export function ComboCard({ combo, base, byId, owned, price, full, on, tag, onClick, locked }: {
  combo: Combo; base: Look; byId: Map<string, ShopItem>; owned: string[]; price: number; full: number; on: boolean; tag?: Collection; onClick: () => void; locked?: boolean;
}) {
  const T = useT();
  const { have, total, complete } = comboHave(combo, byId, owned);
  return (
    <button type="button" className={`item-card combo-card ${on ? 'on' : ''} ${complete ? 'complete' : ''}`} onClick={onClick}>
      {!complete && full > price && <span className="new sale">-{Math.round((1 - price / full) * 100)}%</span>}
      {tag && <span className="tag-ico" title={T.tx(tag.name)}>{tag.icon}</span>}
      <div className="thumb full"><Chibi look={{ ...base, ...comboLook(combo, byId) }} size={88} /></div>
      <span>{T.tx(combo.name)}</span>
      <small className="combo-count">{T.t('comboHave', { a: have, b: total })}</small>
      {complete ? <span className="owned">{T.t('comboOwned')}</span> : <PriceTag price={price} full={full} locked={locked} />}
    </button>
  );
}
