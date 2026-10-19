// Điểm danh 7 ngày: lịch 7 ô, nút nhận quà, và hộp thoại tự bật khi bé vào sảnh lần đầu trong ngày.
import { useState } from 'react';
import { api } from '../lib/api';
import { setChildState, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { Badge, ChildState, ShopItem } from '../lib/types';
import { Btn, Dialog } from './kit';
import { ChestIcon, CoinIcon, EnergyIcon, Glyph } from './Icons';
import { errText } from '../screens/Auth';
import { ItemThumb } from '../screens/Character';
import { sfx } from '../lib/sfx';
import { confettiRain, flyCoins } from '../lib/fx';

export interface CheckinResult { day: number; coins: number; energy: number; item: { id: string } | null; newBadges: Badge[]; state: ChildState }

/** Gọi API điểm danh + hiệu ứng. Trả về kết quả (hoặc null nếu lỗi). */
export function useCheckin() {
  const T = useT();
  const childId = useApp((s) => s.childId);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const claim = async (el: HTMLElement | null) => {
    if (busy) return null;
    setBusy(true);
    try {
      const r = await api.post<CheckinResult>(`/children/${childId}/checkin`);
      sfx.open(); flyCoins(el, 6); if (r.item || r.day === 7) confettiRain();
      setResult(r); setChildState(r.state);
      if (r.newBadges.length) toast(`${T.t('newBadge')} ${T.tx(r.newBadges[0].name)}`);
      return r;
    } catch (e) { toast(errText(T, e), 'warn'); return null; } finally { setBusy(false); }
  };
  return { claim, busy, result };
}

export function CheckinCalendar({ compact = false }: { compact?: boolean }) {
  const T = useT();
  const ck = useApp((s) => s.cs)!.checkin;
  return (
    <div className={`ck-grid ${compact ? 'compact' : ''}`} role="list" aria-label={T.t('checkinTitle')}>
      {ck.rewards.map((r) => {
        const got = r.day <= ck.claimed;
        const isToday = ck.today ? r.day === ck.claimed : r.day === ck.nextSeq;
        return (
          <div key={r.day} role="listitem" className={`ck-day ${got ? 'got' : ''} ${isToday ? 'today' : ''} ${r.gift ? 'gift' : ''}`}>
            <span className="ck-label">{isToday ? T.t('checkinToday') : T.t('checkinDay', { n: r.day })}</span>
            <span className="ck-ico">{r.gift ? <ChestIcon size={compact ? 40 : 52} open={got} /> : <CoinIcon size={compact ? 28 : 34} />}</span>
            <span className="ck-val">{r.gift ? `${r.coins} + 🎁` : r.coins}</span>
            {got && <span className="ck-stamp" aria-label="✓"><Glyph name="check" size={compact ? 18 : 22} /></span>}
          </div>
        );
      })}
    </div>
  );
}

/** Kết quả vừa nhận (xu, năng lượng, món quà ngày 7). */
export function CheckinGot({ r }: { r: CheckinResult }) {
  const T = useT();
  const catalog = useApp((s) => s.catalog)!;
  const cs = useApp((s) => s.cs)!;
  const item = r.item ? catalog.shop.find((i) => i.id === r.item!.id) as ShopItem | undefined : undefined;
  return (
    <div className="ck-got">
      <div className="reward-row">
        <span className="reward"><CoinIcon size={34} />+{r.coins}</span>
        <span className="reward"><EnergyIcon size={34} />+{r.energy}</span>
      </div>
      {item && <div className="ck-gift"><ItemThumb item={item} look={cs.child.look} /><b>{T.t('checkinGiftGot', { name: T.tx(item.name) })}</b></div>}
    </div>
  );
}

/** Hộp thoại điểm danh (dùng ở sảnh). */
export function CheckinDialog({ onClose }: { onClose: () => void }) {
  const T = useT();
  const ck = useApp((s) => s.cs)!.checkin;
  const { claim, busy, result } = useCheckin();
  return (
    <Dialog title={T.t('checkinTitle')} icon="calendar" onClose={onClose} wide
      actions={result || ck.today
        ? <Btn tone="lime" onClick={onClose}>{T.t('ok')}</Btn>
        : <><Btn tone="gray" onClick={onClose}>{T.t('checkinLater')}</Btn><Btn tone="orange" disabled={busy} onClick={(e) => claim(e.currentTarget)}>{T.t('checkinBtn')}</Btn></>}>
      <div className="ck-dialog">
        <CheckinCalendar compact />
        {result ? <CheckinGot r={result} /> : <p className="muted ck-hint">{T.t('checkinHint')}</p>}
      </div>
    </Dialog>
  );
}
