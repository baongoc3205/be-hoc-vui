import { go, selectChild, setPrefs, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import { setMusic } from '../lib/sfx';
import { Btn, Dialog, Segmented, Toggle } from '../ui/kit';
import { Glyph } from '../ui/Icons';

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const T = useT();
  const p = useApp((s) => s.prefs);
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
      </div>
    </Dialog>
  );
}
