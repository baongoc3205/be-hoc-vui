import { go, selectChild, setPrefs, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import { previewTheme, setMusic, setMusicTheme, themeHasFile } from '../lib/sfx';
import { useEffect, useState } from 'react';
import { THEMES, themeById } from '../lib/themes';
import { toast } from '../lib/store';
import { Btn, Dialog, Segmented, Toggle } from '../ui/kit';
import { Glyph } from '../ui/Icons';

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const T = useT();
  const p = useApp((s) => s.prefs);
  const [hasFile, setHasFile] = useState<boolean | null>(null);
  useEffect(() => { setHasFile(null); void themeHasFile(p.theme).then(setHasFile); }, [p.theme]);
  const rows: [string, boolean, (v: boolean) => void][] = [
    [T.t('sound'), p.sound, (v) => setPrefs({ sound: v })],
    [T.t('music'), p.music, (v) => { setPrefs({ music: v }); setMusic(v); }],
    [T.t('voice'), p.voice, (v) => setPrefs({ voice: v })],
    [`${T.t('autoRead')} (${T.t('gradeN', { n: '1–2' })})`, p.autoRead, (v) => setPrefs({ autoRead: v })],
    [T.t('reduceMotion'), p.reduceMotion, (v) => setPrefs({ reduceMotion: v })],
  ];
  return (
    <Dialog title={T.t('settings')} icon="gear" onClose={onClose}
      actions={<><Btn tone="gray" icon={<Glyph name="family" size={22} />} onClick={() => { onClose(); go('parents'); }}>{T.t('parentsArea')}</Btn><Btn tone="orange" icon={<Glyph name="user" size={22} />} onClick={() => { onClose(); selectChild(null); go('profiles'); }}>{T.t('switchChild')}</Btn></>}>
      <div className="dialog-body left" style={{ padding: 0 }}>
        <div className="setting-row"><span>{T.t('language')}</span><Segmented options={[{ key: 'vi', label: 'Tiếng Việt' }, { key: 'en', label: 'English' }]} value={p.lang} onChange={(l) => setPrefs({ lang: l })} /></div>
        {rows.map(([label, on, set]) => <div key={label} className="setting-row"><span>{label}</span><Toggle on={on} onChange={set} label={label} /></div>)}
        <div className="setting-row col">
          <span>{T.t('themeLabel')}</span>
          <div className="theme-grid" role="radiogroup" aria-label={T.t('themeLabel')}>
            {THEMES.map((th) => {
              const on = (p.theme || 'fairy') === th.id;
              return (
                <div key={th.id} className={`theme-card ${on ? 'on' : ''}`}>
                  <button type="button" role="radio" aria-checked={on} className="theme-pick" onClick={() => { setPrefs({ theme: th.id }); setMusicTheme(th.id); }}>
                    <span className="theme-sw" style={{ background: `linear-gradient(135deg, ${th.swatch[1]} 0 45%, ${th.swatch[0]} 45% 78%, ${th.swatch[2]} 78%)` }} aria-hidden="true" />
                    <span className="theme-txt"><b>{T.tx(th.name)}</b><small>{T.tx(th.desc)}</small></span>
                  </button>
                  <button type="button" className="icon-btn icon-btn-mauve theme-play" aria-label={`${T.t('preview')}: ${T.tx(th.name)}`} onClick={async () => { const ok = await previewTheme(th.id); if (!ok) toast(T.t('musicMissing'), 'warn'); }}><Glyph name="music" size={18} /></button>
                </div>
              );
            })}
          </div>
          {hasFile === false && <small className="theme-missing">{T.t('musicMissing')}</small>}
          {!p.music && <small className="theme-missing">{T.t('musicOff')}</small>}
          <small className="muted theme-credit">{T.t('musicCredit')}: {themeById(p.theme).credit} · Pixabay</small>
        </div>
      </div>
    </Dialog>
  );
}
