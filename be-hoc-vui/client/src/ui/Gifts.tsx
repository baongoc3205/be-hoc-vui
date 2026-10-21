// Tặng quà cho bạn: chọn bạn (bạn bè đã kết bạn hoặc anh chị em cùng nhà), kèm lời chúc; hộp quà để mở quà nhận được.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api';
import { refreshChild, refreshSocial, setChildState, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { ChildState, FriendsData, GiftInbox, Look, ShopItem } from '../lib/types';
import { Btn, Dialog, Spinner } from './kit';
import { Avatar } from '../games/board/common';
import { ItemThumb } from './ShopCards';
import { CoinIcon } from './Icons';
import { WithPresence } from './Presence';
import { errText } from '../screens/Auth';
import { sfx } from '../lib/sfx';
import { burstAt } from '../lib/fx';

const NOTES: [string, string][] = [['Tặng bạn nè!', 'A gift for you!'], ['Chúc bạn học giỏi!', 'Good luck with your studies!'], ['Chúc mừng sinh nhật!', 'Happy birthday!'], ['Bạn mặc chắc xinh lắm!', 'This will look great on you!'], ['Cảm ơn bạn nhé!', 'Thank you!']];

/** Bạn được chọn sẵn khi bé bấm "Tặng quà" ở danh sách bạn bè rồi sang cửa hàng chọn món. */
let target: { id: number; nickname: string } | null = null;
export const setGiftTarget = (t: typeof target) => { target = t; };
export const giftTarget = () => target;

export function GiftDialog({ item, price, onClose }: { item: ShopItem; price: number; onClose: () => void }) {
  const T = useT(); const tr = (vi: string, en: string) => (T.lang === 'en' ? en : vi);
  const childId = useApp((s) => s.childId);
  const kids = useApp((s) => s.children);
  const coins = useApp((s) => s.cs?.coins ?? 0);
  const [d, setD] = useState<FriendsData | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(target?.id ?? null);
  const [note, setNote] = useState(tr(...NOTES[0]));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get<FriendsData>(`/children/${childId}/friends`).then(setD).catch(() => setD({ friends: [], incoming: [], outgoing: [], code: '', social: false }));
    api.get<GiftInbox>(`/children/${childId}/gifts`).then((g) => setLeft(g.left)).catch(() => undefined);
  }, [childId]);
  const people = [
    ...kids.filter((k) => k.id !== childId).map((k) => ({ id: k.id, nickname: k.nickname, look: k.look, tag: tr('Anh chị em', 'Sibling'), online: (d?.family ?? []).find((x) => x.id === k.id)?.online ?? null as boolean | null })),
    ...(d?.friends ?? []).filter((f) => f.social).map((f) => ({ id: f.id, nickname: f.nickname, look: f.look, tag: tr('Bạn bè', 'Friend'), online: f.online })),
  ].filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i);
  const send = async (el: HTMLElement) => {
    if (!to) return;
    setBusy(true);
    try {
      const r = await api.post<{ paid: number; left: number; masked: string[] }>(`/children/${childId}/gifts`, { to, itemId: item.id, note });
      sfx.levelup(); burstAt(el, 'confetti', 40);
      const who = people.find((p) => p.id === to)?.nickname ?? '';
      toast(tr(`Đã gửi quà cho ${who}! (-${r.paid} xu)`, `Gift sent to ${who}! (-${r.paid} coins)`));
      target = null;
      await refreshChild(); void refreshSocial();
      onClose();
    } catch (e) { sfx.wrong(); toast(errText(T, e), 'warn'); } finally { setBusy(false); }
  };
  return (
    <Dialog title={`🎁 ${tr('Tặng bạn', 'Send as a gift')}`} icon={null} onClose={onClose}
      actions={<><Btn tone="gray" onClick={onClose}>{T.t('cancel')}</Btn><Btn tone="orange" disabled={!to || busy || coins < price || left === 0} icon={<CoinIcon size={24} />} onClick={(e) => send(e.currentTarget)}>{tr(`Tặng ${price}`, `Give ${price}`)}</Btn></>}>
      <div className="gift-dlg">
        <div className="gift-item"><GiftPreview item={item} /><b>{T.tx(item.name)}</b></div>
        {!d ? <Spinner /> : people.length === 0 ? <p className="shop-note small">{tr('Bé chưa có bạn để tặng. Kết bạn bằng mã ở màn Bạn bè nhé!', 'No friends to give to yet. Add friends with a code first!')}</p> : (
          <div className="gift-people" role="radiogroup">
            {people.map((p) => <button key={p.id} type="button" role="radio" aria-checked={to === p.id} className={`gift-person ${to === p.id ? 'on' : ''}`} onClick={() => { sfx.tap(); setTo(p.id); }}><WithPresence online={p.online ?? null} size={12}><Avatar look={p.look} size={48} /></WithPresence><span><b>{p.nickname}</b><small>{p.tag}{p.online ? ' · ● online' : ''}</small></span></button>)}
          </div>
        )}
        <div className="chips gift-notes">{NOTES.map((n) => <button key={n[0]} type="button" className={`chip ${note === tr(...n) ? 'on' : ''}`} onClick={() => { sfx.tap(); setNote(tr(...n)); }}>{tr(...n)}</button>)}</div>
        <input className="input" value={note} maxLength={60} onChange={(e) => setNote(e.target.value)} aria-label={tr('Lời chúc', 'Message')} />
        <small className="muted">{left !== null ? tr(`Hôm nay bé còn tặng được ${left} quà. Xu của bé: ${coins}.`, `${left} gifts left today. Your coins: ${coins}.`) : ''} {tr('Bạn đã có món này thì không tặng được.', 'You can’t give an item your friend already has.')}</small>
      </div>
    </Dialog>
  );
}

function GiftPreview({ item }: { item: ShopItem }) {
  const look = useApp((s) => s.cs?.child.look);
  return look ? <ItemThumb item={item} look={look} /> : null;
}

/** Hộp quà: danh sách quà nhận được, mở quà có hiệu ứng, mặc thử ngay. */
export function GiftInboxDialog({ onClose }: { onClose: () => void }) {
  const T = useT(); const tr = (vi: string, en: string) => (T.lang === 'en' ? en : vi);
  const childId = useApp((s) => s.childId);
  const catalog = useApp((s) => s.catalog);
  const [g, setG] = useState<GiftInbox | null>(null);
  const [opening, setOpening] = useState<number | null>(null);
  const load = () => api.get<GiftInbox>(`/children/${childId}/gifts`).then(setG).catch(() => setG({ gifts: [], unopened: 0, left: 0, enabled: false }));
  useEffect(() => { void load(); }, [childId]); // eslint-disable-line react-hooks/exhaustive-deps
  const byId = new Map((catalog?.shop ?? []).map((i) => [i.id, i]));
  const open = async (id: number, el: HTMLElement) => {
    setOpening(id); sfx.open();
    try { await api.post(`/children/${childId}/gifts/${id}/open`); setTimeout(() => { burstAt(el, 'confetti', 36); sfx.levelup(); setOpening(null); void load(); void refreshSocial(); }, 900); }
    catch (e) { setOpening(null); toast(errText(T, e), 'warn'); }
  };
  const wear = async (it: ShopItem) => {
    try { const st = await api.post<ChildState>(`/children/${childId}/look`, { look: { [it.slot]: it.value } as Partial<Look> }); setChildState(st); sfx.pop(); toast(tr('Đã mặc vào rồi!', 'Wearing it now!')); }
    catch (e) { toast(errText(T, e), 'warn'); }
  };
  return (
    <Dialog title={`🎁 ${tr('Hộp quà', 'Gift box')}`} icon={null} onClose={onClose} actions={<Btn tone="gray" onClick={onClose}>{T.t('close')}</Btn>}>
      {!g ? <Spinner /> : g.gifts.length === 0 ? <p className="shop-note">{tr('Chưa có quà nào. Bạn bè tặng quà cho bé sẽ hiện ở đây.', 'No gifts yet. Gifts from friends will show up here.')}</p> : (
        <div className="gift-list">
          {g.gifts.map((x) => { const it = byId.get(x.item); return (
            <div key={x.id} className={`gift-row ${x.opened ? 'opened' : ''}`}>
              {x.opened && it ? <GiftPreview item={it} /> : <span className={`gift-box ${opening === x.id ? 'shake' : ''}`} aria-hidden>🎁</span>}
              <div className="gift-text"><b>{tr(`${x.from} tặng bé`, `From ${x.from}`)}{x.opened && it ? `: ${T.tx(it.name)}` : ''}</b>{x.note && <small>“{x.note}”</small>}</div>
              {!x.opened ? <Btn tone="orange" size="sm" disabled={opening !== null} onClick={(e) => open(x.id, e.currentTarget)}>{tr('Mở quà', 'Open')}</Btn>
                : it ? <Btn tone="lime" size="sm" onClick={() => wear(it)}>{tr('Mặc ngay', 'Wear')}</Btn> : null}
            </div>
          ); })}
        </div>
      )}
    </Dialog>
  );
}

/** Thanh báo có quà chưa mở (hiện ở mọi màn hình chính). */
let bannerHidden = false;
export function GiftBanner() {
  const T = useT(); const tr = (vi: string, en: string) => (T.lang === 'en' ? en : vi);
  const n = useApp((s) => s.social?.gifts ?? 0);
  const [show, setShow] = useState(false);
  const [, force] = useState(0);
  const dlg = show ? createPortal(<GiftInboxDialog onClose={() => setShow(false)} />, document.body) : null;
  if (!n || bannerHidden) return dlg;
  return (<>
    <div className="invite-banner gift-banner notice" role="status">
      <span className="nb-ico" aria-hidden>🎁</span>
      <span className="nb-text"><b>{tr(`Bé có ${n} món quà chưa mở!`, `You have ${n} unopened gift${n > 1 ? 's' : ''}!`)}</b><small>{tr('Bạn bè vừa gửi quà cho bé', 'A friend sent you something')}</small></span>
      <div className="nb-btns">
        <Btn tone="orange" size="sm" onClick={() => { bannerHidden = true; setShow(true); force((k) => k + 1); }}>{tr('Mở ngay', 'Open')}</Btn>
        <Btn tone="gray" size="sm" onClick={() => { bannerHidden = true; force((k) => k + 1); }}>{tr('Để sau', 'Later')}</Btn>
      </div>
    </div>
    {dlg}
  </>);
}
