// Hồ sơ một bạn (mở từ bảng xếp hạng / danh sách bạn bè): xem thành tích, kết bạn, nhắn tin, chặn, báo cáo.
import { useEffect, useState } from 'react';
import { seenText } from './Presence';
import { api } from '../lib/api';
import { go, refreshSocial, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { Profile } from '../lib/types';
import { Btn, Dialog, Spinner } from './kit';
import { Chibi } from './Chibi';
import { errText } from '../screens/Auth';
import { sfx } from '../lib/sfx';

export const REPORT_REASONS: [string, string][] = [['Nói lời xấu, trêu chọc', 'Rude or mean words'], ['Làm phiền, nhắn quá nhiều', 'Spamming or bothering me'], ['Hỏi số điện thoại, địa chỉ, hẹn gặp', 'Asked for my phone, address or to meet'], ['Lý do khác', 'Something else']];

export function ReportDialog({ friendId, name, onClose, onDone }: { friendId: number; name: string; onClose: () => void; onDone?: () => void }) {
  const T = useT(); const tr = (vi: string, en: string) => (T.lang === 'en' ? en : vi);
  const childId = useApp((s) => s.childId);
  const [blockToo, setBlockToo] = useState(true);
  const submit = async (reason: string) => {
    try {
      await api.post(`/children/${childId}/report/${friendId}`, { reason });
      if (blockToo) await api.post(`/children/${childId}/block/${friendId}`);
      toast(tr('Cảm ơn bé đã báo cho người lớn biết. Bé hãy kể thêm với bố mẹ nhé!', 'Thanks for telling us. Please tell a grown-up too!'));
      onDone?.(); onClose();
    } catch (e) { toast(errText(T, e), 'warn'); }
  };
  return (
    <Dialog title={tr(`Báo cáo ${name}`, `Report ${name}`)} onClose={onClose} actions={<Btn tone="gray" onClick={onClose}>{T.t('cancel')}</Btn>}>
      <p style={{ marginTop: 0 }}>{tr('Có chuyện gì vậy? Phụ huynh của bé sẽ xem được báo cáo này.', 'What happened? Your parent will be able to see this report.')}</p>
      <div className="report-list">{REPORT_REASONS.map(([vi, en]) => <Btn key={vi} tone="cream" onClick={() => submit(vi)}>{tr(vi, en)}</Btn>)}</div>
      <label className="tw-toggle" style={{ marginTop: 10 }}><input type="checkbox" checked={blockToo} onChange={(e) => setBlockToo(e.target.checked)} /> {tr('Chặn luôn bạn này', 'Also block this player')}</label>
    </Dialog>
  );
}

export function ProfileDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const T = useT(); const tr = (vi: string, en: string) => (T.lang === 'en' ? en : vi);
  const childId = useApp((s) => s.childId);
  const [p, setP] = useState<Profile | null>(null);
  const [err, setErr] = useState(false);
  const [reporting, setReporting] = useState(false);
  const load = () => api.get<Profile>(`/children/${childId}/profile/${id}`).then(setP).catch(() => setErr(true));
  useEffect(() => { void load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const act = async (fn: () => Promise<unknown>, msg?: string) => { try { await fn(); sfx.pop(); if (msg) toast(msg); await load(); void refreshSocial(); } catch (e) { toast(errText(T, e), 'warn'); } };
  const rel = p?.relation;
  if (reporting && p) return <ReportDialog friendId={p.id} name={p.nickname} onClose={() => setReporting(false)} onDone={onClose} />;
  return (
    <Dialog title={p ? p.nickname : tr('Hồ sơ', 'Profile')} icon={null} onClose={onClose} wide
      actions={p && rel !== 'self' ? <>
        {(rel === 'none' || rel === 'family') && <Btn tone="lime" onClick={() => act(() => api.post(`/children/${childId}/friends`, { childId: p.id }), tr('Đã gửi lời mời kết bạn!', 'Friend request sent!'))}>{tr('Kết bạn', 'Add friend')}</Btn>}
        {rel === 'sent' && <Btn tone="gray" disabled>{tr('Đã gửi lời mời', 'Request sent')}</Btn>}
        {rel === 'received' && <Btn tone="lime" onClick={() => act(() => api.post(`/children/${childId}/friends/${p.id}/accept`), tr('Đã thành bạn bè!', 'You are now friends!'))}>{tr('Đồng ý kết bạn', 'Accept')}</Btn>}
        {rel === 'friends' && p.canChat && <Btn tone="orange" onClick={() => { onClose(); go(`chat/${p.id}`); }}>{tr('Nhắn tin', 'Message')}</Btn>}
        {rel === 'blocked'
          ? <Btn tone="gray" onClick={() => act(() => api.del(`/children/${childId}/block/${p.id}`), tr('Đã bỏ chặn', 'Unblocked'))}>{tr('Bỏ chặn', 'Unblock')}</Btn>
          : <Btn tone="gray" onClick={() => act(() => api.post(`/children/${childId}/block/${p.id}`), tr('Đã chặn', 'Blocked'))}>{tr('Chặn', 'Block')}</Btn>}
        <Btn tone="gray" onClick={() => setReporting(true)}>{tr('Báo cáo', 'Report')}</Btn>
      </> : <Btn tone="gray" onClick={onClose}>{T.t('close')}</Btn>}>
      {err ? <p>{tr('Không xem được hồ sơ này.', 'This profile isn’t available.')}</p> : !p ? <Spinner /> : (
        <div className="fp-card">
          <div className="fp-hero"><Chibi look={p.look} mood="happy" size={140} /></div>
          <div className="fp-info">
            <b className="fp-name">{p.nickname}</b>
            <span>{T.t('gradeN', { n: p.grade })} · Lv. {p.level}</span>
            {p.online != null && p.relation !== 'self' && <span className={`fp-pres ${p.online ? 'on' : ''}`}><i />{seenText(p, T.lang)}</span>}
            <div className="fp-stats">
              <span>⭐ {p.stars}</span><span>🏅 {p.badges.length}</span><span>🔥 {p.streak}</span><span>⚡ {T.t('xpWeek', { n: p.xpWeek })}</span>
            </div>
            {rel === 'friends' && <span className="chip-dark">{tr('Bạn bè', 'Friends')}</span>}
            {rel === 'family' && <span className="chip-dark">{tr('Cùng gia đình', 'Family')}</span>}
            {!p.social && rel !== 'self' && <small className="muted">{tr('Bạn này đang tắt kết bạn & nhắn tin.', 'This player has chat turned off.')}</small>}
          </div>
        </div>
      )}
    </Dialog>
  );
}
