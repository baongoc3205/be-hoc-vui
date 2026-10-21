// Chấm xanh "đang online" trên hình đại diện và dòng chữ "Đang online / 5 phút trước / Offline".
import type { ReactNode } from 'react';

export function seenText(p: { online?: boolean | null; seenAt?: number | null }, lang: string) {
  const vi = lang !== 'en';
  if (p.online) return vi ? 'Đang online' : 'Online now';
  if (!p.seenAt) return vi ? 'Offline' : 'Offline';
  const m = Math.max(1, Math.round((Date.now() - p.seenAt) / 60000));
  if (m < 60) return vi ? `Online ${m} phút trước` : `Online ${m} min ago`;
  const h = Math.round(m / 60);
  return vi ? `Online ${h} giờ trước` : `Online ${h} h ago`;
}

/** Bọc hình đại diện, thêm chấm trạng thái ở góc dưới. */
export function WithPresence({ online, children, size = 14 }: { online?: boolean | null; children: ReactNode; size?: number }) {
  return (
    <span className="pres-wrap">
      {children}
      {online != null && <i className={`pres-dot ${online ? 'on' : ''}`} style={{ width: size, height: size }} aria-hidden />}
    </span>
  );
}
