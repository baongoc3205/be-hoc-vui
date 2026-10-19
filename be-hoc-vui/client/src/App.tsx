import { useEffect, useRef, useState } from 'react';
import { boot, go, refreshChild, toast, useApp, useRoute } from './lib/store';
import { useT } from './lib/hooks';
import { installAudioUnlock, setMusic, sfx, unlockAudio } from './lib/sfx';
import { Toast, Spinner } from './ui/kit';
import { Scene } from './ui/Scene';
import { Glyph } from './ui/Icons';
import { Splash } from './screens/Splash';
import { Auth } from './screens/Auth';
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


export function App() {
  const route = useRoute();
  const booted = useApp((s) => s.booted);
  const parent = useApp((s) => s.parent);
  const childId = useApp((s) => s.childId);
  const cs = useApp((s) => s.cs);
  const prefs = useApp((s) => s.prefs);
  const [settings, setSettings] = useState(false);
  const [bootErr, setBootErr] = useState(false);
  const T = useT();

  useEffect(() => { boot().catch(() => setBootErr(true)); }, []);
  useEffect(() => { const f = () => setSettings(true); addEventListener('bhv:settings', f); return () => removeEventListener('bhv:settings', f); }, []);
  useEffect(() => { if (childId && !cs) refreshChild().catch(() => undefined); }, [childId, cs]);
  // giao diện theo tuổi, ngôn ngữ, giảm chuyển động
  useEffect(() => {
    const el = document.documentElement;
    el.lang = prefs.lang;
    el.dataset.age = cs?.child.ageTheme ?? 'bud';
    el.classList.toggle('reduce-motion', prefs.reduceMotion);
    document.title = T.t('appName');
  }, [prefs.lang, prefs.reduceMotion, cs?.child.ageTheme, T]);
  // nhạc nền bật sau lần chạm đầu tiên (chính sách tự phát của trình duyệt)
  useEffect(() => {
    const first = () => { unlockAudio(); setMusic(prefs.music); };
    const evs = ['pointerup', 'touchend', 'keydown'];
    evs.forEach((e) => addEventListener(e, first, { once: true }));
    setMusic(prefs.music);
    return () => evs.forEach((e) => removeEventListener(e, first));
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
    <div className="screen splash"><Scene name="meadow" /><div className="screen-content splash"><div className="logo">{T.t('appName')}</div><div className="bubble">{T.t('err_OFFLINE')}</div></div></div>
  );
  if (!booted) return <div className="screen"><Scene name="meadow" /><div className="screen-content splash"><Spinner /></div></div>;

  const [head, ...rest] = route.split('/');
  let view;
  if (head === '' || head === 'splash') view = <Splash />;
  else if (!parent) view = <Auth />;
  else if (head === 'parents') view = <Parents />;
  else if (head === 'onboarding') view = <Onboarding />;
  else if (head === 'profiles' || !childId) view = <Profiles />;
  else if (!cs) view = <div className="screen"><Scene name="meadow" /><div className="screen-content splash"><Spinner /></div></div>;
  else switch (head) {
    case 'lobby': view = <Lobby />; break;
    case 'worlds': view = <Worlds grade={Number(rest[0]) || cs.child.grade} />; break;
    case 'map': view = <MapScreen subject={rest[0]} grade={Number(rest[1]) || cs.child.grade} />; break;
    case 'play': view = <Play key={rest[0]} lessonId={rest[0].split('?')[0]} />; break;
    case 'character': view = <Character tab={rest[0]} />; break;
    case 'shop': view = <Shop />; break;
    case 'rewards': view = <Rewards tab={rest[0]} />; break;
    case 'ranking': view = <Ranking />; break;
    default: view = <Lobby />;
  }
  const showDock = parent && cs && ['lobby', 'worlds', 'character', 'shop', 'rewards', 'ranking', 'map'].includes(head);

  return (
    <>
      {view}
      {showDock && <Dock active={head} />}
      {settings && <SettingsDialog onClose={() => setSettings(false)} />}
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
        <button key={k} type="button" className={active === k || (k === 'worlds' && active === 'map') ? 'on' : ''} onClick={() => go(k)}>
          <Glyph name={ico} size={24} />{label}
        </button>
      ))}
    </nav>
  );
}
