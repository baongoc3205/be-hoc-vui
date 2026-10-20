// Khu vui chơi: chọn mini game (+ môn học), máy chủ chọn ngẫu nhiên câu hỏi đúng lớp của bé.
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getState, go, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { GameType, SubjectId } from '../lib/types';
import { Btn, Dialog, Spinner, TopBar } from '../ui/kit';
import { Scene } from '../ui/Scene';
import { GameTile, SkillTile } from '../ui/Icons';
import { sfx } from '../lib/sfx';
import { errText } from './Auth';
import { makeT } from '../lib/i18n';

interface MenuItem { game: GameType; subjects: SubjectId[]; total: number }
const TONE: Record<string, string> = { 'fruit-slice': 'rose', 'candy-match': 'english', slingshot: 'science', 'draw-trace': 'vietnamese', 'balloon-pop': 'math', 'catch-fall': 'rose', 'math-race': 'math' };

/** Bắt đầu một ván mini game (dùng cả ở màn kết quả để "Chơi tiếp"). */
export async function playArcade(game: string, subject: string) {
  const { childId, prefs } = getState();
  try {
    const r = await api.post<{ lessonId: string }>(`/children/${childId}/arcade`, { game, subject });
    go(`play/${r.lessonId}?r=${Date.now()}`);
  } catch (e) { const T = makeT(prefs.lang); toast(errText(T as never, e), 'warn'); }
}

export function Arcade() {
  const T = useT();
  const childId = useApp((s) => s.childId);
  const catalog = useApp((s) => s.catalog)!;
  const [menu, setMenu] = useState<MenuItem[] | null>(null);
  const [pick, setPick] = useState<MenuItem | null>(null);
  useEffect(() => { api.get<{ games: MenuItem[] }>(`/children/${childId}/arcade`).then((r) => setMenu(r.games)).catch(() => setMenu([])); }, [childId]);
  const open = (m: MenuItem) => {
    sfx.pop();
    if (m.subjects.length <= 1) { void playArcade(m.game, m.subjects[0] ?? 'any'); return; }
    setPick(m);
  };
  return (
    <div className="screen arcade">
      <Scene name="sakura" />
      <div className="screen-content">
        <TopBar title={T.t('arcade')} to="lobby" />
        <p className="arcade-sub title-out">{T.t('arcadeSub')}</p>
        {!menu ? <Spinner /> : (
          <div className="arcade-grid">
            {menu.map((m, k) => (
              <button key={m.game} type="button" className="arcade-card" style={{ animationDelay: `${k * 0.05}s` }} onClick={() => open(m)}>
                <GameTile game={m.game} tone={TONE[m.game]} size={78} />
                <span className="ac-text">
                  <b>{T.tx(catalog.games[m.game]?.name)}</b>
                  <small>{T.t(`ad_${m.game}` as 'ad_fruit-slice')}</small>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      {pick && (
        <Dialog title={T.tx(catalog.games[pick.game]?.name)} icon="flower" onClose={() => setPick(null)} wide
          actions={<Btn tone="gray" onClick={() => setPick(null)}>{T.t('cancel')}</Btn>}>
          <div className="arcade-pick">
            <p style={{ margin: '0 0 6px' }}>{T.t('pickSubject')}</p>
            <div className="arcade-subjects">
              {pick.subjects.map((sid) => { const s = catalog.subjects.find((x) => x.id === sid)!; return (
                <button key={sid} type="button" className="arcade-subj" onClick={() => { setPick(null); void playArcade(pick.game, sid); }}>
                  <SkillTile kind={sid} size={64} /><span>{T.tx(s.name)}</span>
                </button>
              ); })}
              <button type="button" className="arcade-subj any" onClick={() => { setPick(null); void playArcade(pick.game, 'any'); }}>
                <SkillTile kind="rose" size={64}><text x="46" y="60" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="40" fill="#fff">★</text></SkillTile><span>{T.t('anySubject')}</span>
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
