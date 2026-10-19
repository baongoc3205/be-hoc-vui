// Lưới huy hiệu gọn: chỉ hiện huy chương + tên; chạm vào để xem điều kiện đạt.
import { toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import { BadgeMedal } from './Icons';
import { sfx } from '../lib/sfx';

export function BadgeGrid() {
  const T = useT();
  const cs = useApp((s) => s.cs)!;
  const catalog = useApp((s) => s.catalog)!;
  const got = new Set(cs.badges);
  const list = [...catalog.badges].sort((a, b) => Number(got.has(b.id)) - Number(got.has(a.id)));
  return (
    <>
      <div className="muted badge-count">{got.size}/{catalog.badges.length} · {T.t('earned')}</div>
      <div className="badge-grid">
        {list.map((b) => {
          const ok = got.has(b.id);
          return (
            <button key={b.id} type="button" title={T.tx(b.desc)} className={`badge-card ${ok ? '' : 'off'}`} onClick={() => { sfx.tap(); toast(`${T.tx(b.name)}: ${T.tx(b.desc)}`); }}>
              <BadgeMedal icon={b.icon} size={52} earned={ok} />
              <h4>{T.tx(b.name)}</h4>
            </button>
          );
        })}
      </div>
    </>
  );
}
