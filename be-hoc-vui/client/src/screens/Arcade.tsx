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
import { BOARD_GAMES } from './Board';
import { createRoomAndInvite } from './Friends';

interface MenuItem { game: GameType; subjects: SubjectId[]; total: number }
const BOARD_TONE: Record<string, string> = { cards: 'rose', ludo: 'science', werewolf: 'english' };
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
  const [mode, setMode] = useState<'solo' | 'friends'>('solo');
  const go2 = (game: string, sid: string) => { setPick(null); if (mode === 'friends') createRoomAndInvite(game, undefined, { subject: sid === 'any' ? null : sid }).catch((e) => toast(errText(T as never, e), 'warn')); else void playArcade(game, sid); };
  useEffect(() => { api.get<{ games: MenuItem[] }>(`/children/${childId}/arcade`).then((r) => setMenu(r.games)).catch(() => setMenu([])); }, [childId]);
  const open = (m: MenuItem) => {
    sfx.pop();
    setMode('solo'); setPick(m);
  };
  return (
    <div className="screen arcade">
      <Scene name="sakura" />
      <div className="screen-content">
        <TopBar title={T.t('arcade')} to="lobby" />
        <p className="arcade-sub title-out">{T.t('arcadeSub')}</p>
        {!menu ? <Spinner /> : (
          <div className="arcade-grid">
            {BOARD_GAMES.map((g, k) => (
              <button key={g.id} type="button" className="arcade-card" style={{ animationDelay: `${k * 0.05}s` }} onClick={() => { sfx.pop(); go(`board/${g.id}`); }}>
                <GameTile game={g.id} tone={BOARD_TONE[g.id]} size={78} />
                <span className="ac-text"><b>{T.lang === 'en' ? g.name[1] : g.name[0]}</b><small>{T.lang === 'en' ? g.desc[1] : g.desc[0]}</small></span>
              </button>
            ))}
            <button type="button" className="arcade-card" style={{ animationDelay: '.15s' }} onClick={() => { sfx.pop(); createRoomAndInvite('quiz').catch((e) => toast(errText(T as never, e), 'warn')); }}>
              <GameTile game="quiz-duel" tone="english" size={78} />
              <span className="ac-text"><b>{T.lang === 'en' ? 'Quiz duel' : 'Thi đố cùng bạn'}</b><small>{T.lang === 'en' ? 'Same questions for everyone — most correct and fastest wins' : 'Cùng một bộ câu hỏi đúng lớp, ai đúng nhiều và nhanh hơn thì thắng'}</small></span>
            </button>
            {menu.map((m, k) => (
              <button key={m.game} type="button" className="arcade-card" style={{ animationDelay: `${(k + 3) * 0.05}s` }} onClick={() => open(m)}>
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
            <div className="arcade-mode" role="radiogroup">
              <button type="button" role="radio" aria-checked={mode === 'solo'} className={`gender-btn ${mode === 'solo' ? 'on' : ''}`} onClick={() => { sfx.tap(); setMode('solo'); }}><span aria-hidden>🙋</span>{T.lang === 'en' ? 'Play alone' : 'Chơi một mình'}</button>
              <button type="button" role="radio" aria-checked={mode === 'friends'} className={`gender-btn ${mode === 'friends' ? 'on' : ''}`} onClick={() => { sfx.tap(); setMode('friends'); }}><span aria-hidden>👫</span>{T.lang === 'en' ? 'With friends' : 'Chơi cùng bạn'}</button>
            </div>
            {mode === 'friends' && <p className="arcade-mode-note">{T.lang === 'en' ? 'Everyone in the room gets the same rounds — most correct and fastest wins. Empty seats get bots.' : 'Cả phòng làm cùng một bộ đề, ai đúng nhiều và nhanh hơn thì thắng. Ghế trống có bot chơi cùng.'}</p>}
            <p style={{ margin: '0 0 6px' }}>{T.t('pickSubject')}</p>
            <div className="arcade-subjects">
              {pick.subjects.map((sid) => { const s = catalog.subjects.find((x) => x.id === sid)!; return (
                <button key={sid} type="button" className="arcade-subj" onClick={() => go2(pick.game, sid)}>
                  <SkillTile kind={sid} size={64} /><span>{T.tx(s.name)}</span>
                </button>
              ); })}
              <button type="button" className="arcade-subj any" onClick={() => go2(pick.game, 'any')}>
                <SkillTile kind="rose" size={64}><text x="46" y="60" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="40" fill="#fff">★</text></SkillTile><span>{T.t('anySubject')}</span>
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
