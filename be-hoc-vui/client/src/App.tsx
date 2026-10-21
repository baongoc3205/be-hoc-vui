import { useEffect, useRef, useState } from 'react';
import { boot, go, refreshChild, refreshSocial, toast, useApp, useRoute } from './lib/store';
import { useT } from './lib/hooks';
import { installAudioUnlock, musicStatus, setMusic, setMusicTheme, sfx, unlockAudio } from './lib/sfx';
import { themeById } from './lib/themes';
import { Toast, Spinner } from './ui/kit';
import { Scene } from './ui/Scene';
import { Glyph } from './ui/Icons';
import { Splash } from './screens/Splash';
import { Auth } from './screens/Auth';
import { Privacy } from './screens/Privacy';
import { ApiError } from './lib/api';
import { Chibi, MASCOTS } from './ui/Chibi';
import { Btn } from './ui/kit';
import { Profiles, Onboarding } from './screens/Profiles';
import { Lobby } from './screens/Lobby';
import { Worlds, MapScreen } from './screens/Worlds';
import { Play } from './screens/Play';
import { Character } from './screens/Character';
import { Shop } from './screens/Shop';
import { Rewards, Ranking } from './screens/Rewards';
import { SettingsDialog } from './screens/Settings';

// mở khoá âm thanh ở thao tác đầu tiên (chuột / chạm / phím)
installAudioUnlock();
import { Parents } from './screens/Parents';
import { Arcade } from './screens/Arcade';
import { Board, type BoardId } from './screens/Board';
import { Theory } from './screens/Theory';
import { Friends, Chat, InviteBanner } from './screens/Friends';
import { Room } from './screens/Room';


export function App() {
  const route = useRoute();
  const booted = useApp((s) => s.booted);
  const parent = useApp((s) => s.parent);
  const childId = useApp((s) => s.childId);
  const cs = useApp((s) => s.cs);
  const prefs = useApp((s) => s.prefs);
  const [settings, setSettings] = useState(false);
  const [bootErr, setBootErr] = useState(false);
  const [waking, setWaking] = useState(0); // số giây đã chờ máy chủ thức dậy
  const T = useT();

  // Render gói miễn phí cho máy chủ ngủ sau 15 phút: lần mở đầu có thể lỗi 502/503 hoặc mất mạng
  // trong 30–60 giây. Tự thử lại mỗi 3 giây (tối đa ~90 giây) và hiện màn chờ thân thiện.
  const startBoot = () => {
    setBootErr(false); setWaking(0);
    const t0 = Date.now();
    const attempt = () => boot().then(() => setWaking(0)).catch((e) => {
      const retriable = !(e instanceof ApiError) || e.code === 'OFFLINE' || e.status >= 500;
      const secs = Math.round((Date.now() - t0) / 1000);
      if (retriable && secs < 90) { setWaking(Math.max(1, secs)); setTimeout(attempt, 3000); } else { setWaking(0); setBootErr(true); }
    });
    attempt();
  };
  useEffect(startBoot, []); // eslint-disable-line
  useEffect(() => { const f = () => setSettings(true); addEventListener('bhv:settings', f); return () => removeEventListener('bhv:settings', f); }, []);
  useEffect(() => { if (childId && !cs) refreshChild().catch(() => undefined); }, [childId, cs]);
  // tin nhắn / lời mời mới: hỏi máy chủ mỗi 15 giây khi đang mở app
  useEffect(() => {
    if (!childId || !parent) return;
    const tick = () => { if (document.visibilityState === 'visible') refreshSocial().catch(() => undefined); };
    tick(); const iv = setInterval(tick, 15_000);
    return () => clearInterval(iv);
  }, [childId, parent]);
  // giao diện theo tuổi, ngôn ngữ, giảm chuyển động
  useEffect(() => {
    const el = document.documentElement;
    el.lang = prefs.lang;
    el.dataset.age = cs?.child.ageTheme ?? 'bud';
    el.classList.toggle('reduce-motion', prefs.reduceMotion);
    el.dataset.theme = prefs.theme || 'fairy';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeById(prefs.theme).swatch[0]);
    document.title = T.t('appName');
  }, [prefs.lang, prefs.reduceMotion, prefs.theme, cs?.child.ageTheme, T]);
  useEffect(() => { setMusicTheme(prefs.theme); }, [prefs.theme]);
  // nhạc nền bật sau lần chạm đầu tiên (chính sách tự phát của trình duyệt)
  useEffect(() => {
    // thử ở mọi thao tác cho tới khi âm thanh thật sự chạy (một số trình duyệt cần vài lần chạm)
    const evs = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
    const off = () => evs.forEach((e) => removeEventListener(e, first, true));
    function first() {
      unlockAudio(); setMusicTheme(prefs.theme); setMusic(prefs.music);
      setTimeout(() => { if (musicStatus().audio === 'running') off(); }, 400);
    }
    evs.forEach((e) => addEventListener(e, first, true));
    setMusic(prefs.music);
    return off;
  }, [prefs.music]);
  // tiếng lật trang khi chuyển màn hình
  const pageKey = route.split('/')[0];
  const firstPage = useRef(true);
  useEffect(() => { if (firstPage.current) { firstPage.current = false; return; } sfx.page(); }, [pageKey]);
  // nhắc nghỉ mắt mỗi 20 phút đang dùng
  useEffect(() => {
    let active = 0;
    const id = setInterval(() => { if (document.visibilityState === 'visible') { active += 1; if (active % 20 === 0) toast(T.t('eyeBreak'), 'warn'); } }, 60_000);
    return () => clearInterval(id);
  }, [T]);

  if (bootErr) return (
    <div className="screen splash"><Scene name="meadow" /><div className="screen-content splash"><div className="logo">{T.t('appName')}</div><div className="bubble">{T.t('err_OFFLINE')}</div><Btn tone="lime" onClick={startBoot}>{T.t('tryAgain')}</Btn></div></div>
  );
  if (!booted && waking > 0) return (
    <div className="screen splash"><Scene name="night" /><div className="screen-content splash waking">
      <Chibi look={MASCOTS.mimi} mood="sleep" size={220} />
      <div className="bubble">{T.t('waking')}</div>
      <Spinner />
      <p className="title-out" style={{ fontSize: 18, margin: 0 }}>{T.t('wakingHint')} ({waking}s)</p>
    </div></div>
  );
  if (!booted) return <div className="screen"><Scene name="meadow" /><div className="screen-content splash"><Spinner /></div></div>;

  const [head, ...rest] = route.split('/');
  let view;
  if (head === '' || head === 'splash') view = <Splash />;
  else if (head === 'privacy') view = <Privacy />;
  else if (!parent) view = <Auth />;
  else if (head === 'parents') view = <Parents />;
  else if (head === 'onboarding') view = <Onboarding />;
  else if (head === 'profiles' || !childId) view = <Profiles />;
  else if (!cs) view = <div className="screen"><Scene name="meadow" /><div className="screen-content splash"><Spinner /></div></div>;
  else switch (head.split('?')[0]) {
    case 'lobby': view = <Lobby />; break;
    case 'worlds': view = <Worlds grade={Number(rest[0]) || cs.child.grade} />; break;
    case 'map': view = <MapScreen subject={rest[0]} grade={Number(rest[1]) || cs.child.grade} />; break;
    case 'play': view = <Play key={rest[0]} lessonId={rest[0].split('?')[0]} />; break;
    case 'character': view = <Character tab={rest[0]} />; break;
    case 'shop': view = <Shop />; break;
    case 'rewards': view = <Rewards tab={rest[0]} />; break;
    case 'ranking': view = <Ranking />; break;
    case 'arcade': view = <Arcade />; break;
    case 'theory': view = <Theory key={route} id={rest[0]?.split('?')[0] || undefined} query={route.includes('?') ? route.slice(route.indexOf('?') + 1) : ''} />; break;
    case 'friends': view = <Friends tab={rest[0]} />; break;
    case 'chat': view = <Chat key={rest[0]} friendId={Number(rest[0])} />; break;
    case 'room': view = <Room key={rest[0]} roomId={(rest[0] ?? '').split('?')[0]} />; break;
    case 'board': { const g = (rest[0] ?? '').split('?')[0] as BoardId; view = <Board key={g} game={g || 'cards'} />; break; }
    default: view = <Lobby />;
  }
  const showDock = parent && cs && ['lobby', 'worlds', 'character', 'shop', 'rewards', 'ranking', 'map', 'arcade', 'board', 'theory', 'friends'].includes(head.split('?')[0]);

  return (
    <>
      {view}
      {showDock && <Dock active={head} />}
      {settings && <SettingsDialog onClose={() => setSettings(false)} />}
      {showDock && <InviteBanner />}
      <Toast />
    </>
  );
}

function Dock({ active }: { active: string }) {
  const T = useT();
  const items: [string, string, string][] = [['lobby', 'home', T.t('lobby')], ['worlds', 'map', T.t('learn')], ['rewards', 'trophy', T.t('treasure')], ['shop', 'bag', T.t('shop')], ['character', 'user', T.t('character')]];
  return (
    <nav className="dock" aria-label="menu">
      {items.map(([k, ico, label]) => (
        <button key={k} type="button" className={active === k || (k === 'worlds' && active === 'map') || (k === 'lobby' && ['arcade', 'board', 'theory'].includes(active.split('?')[0])) ? 'on' : ''} onClick={() => go(k)}>
          <Glyph name={ico} size={24} />{label}
        </button>
      ))}
    </nav>
  );
}
