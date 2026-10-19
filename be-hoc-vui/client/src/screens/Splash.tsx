import { go, setPrefs, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import { Btn, Segmented } from '../ui/kit';
import { Scene } from '../ui/Scene';
import { Chibi, MASCOTS } from '../ui/Chibi';
import { TulipIcon } from '../ui/Icons';
import { sfx } from '../lib/sfx';

export function Splash() {
  const T = useT();
  const parent = useApp((s) => s.parent);
  const childId = useApp((s) => s.childId);
  const lang = useApp((s) => s.prefs.lang);
  return (
    <div className="screen">
      <Scene name="meadow" />
      <div className="lang-switch">
        <Segmented options={[{ key: 'vi', label: 'Tiếng Việt' }, { key: 'en', label: 'English' }]} value={lang} onChange={(l) => setPrefs({ lang: l })} />
      </div>
      <div className="screen-content splash">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><TulipIcon size={64} /><div className="logo">Bé <span className="accent">Học</span> Vui</div></div>
        <div className="tag title-out">{T.t('tagline')}</div>
        <div className="chibi-row">
          <Chibi look={MASCOTS.bo} mood="idle" size={170} />
          <Chibi look={MASCOTS.mochi} mood="happy" size={190} />
          <Chibi look={MASCOTS.mimi} mood="wave" size={260} className="big" />
          <Chibi look={MASCOTS.foxy} mood="happy" size={190} />
          <Chibi look={MASCOTS.kiwi} mood="idle" size={170} />
        </div>
        <Btn tone="lime" size="lg" onClick={() => { sfx.pop(); go(!parent ? 'auth' : childId ? 'lobby' : 'profiles'); }}>{T.t('start')}</Btn>
      </div>
    </div>
  );
}
