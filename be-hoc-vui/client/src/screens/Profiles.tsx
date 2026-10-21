import { useState } from 'react';
import { api } from '../lib/api';
import { go, loadChildren, selectChild, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { Child, Look } from '../lib/types';
import { Btn, Field, IconBtn, Panel } from '../ui/kit';
import { Scene } from '../ui/Scene';
import { Chibi } from '../ui/Chibi';
import { Glyph } from '../ui/Icons';
import { errText } from './Auth';
import { sfx } from '../lib/sfx';

export function Profiles() {
  const T = useT();
  const kids = useApp((s) => s.children);
  return (
    <div className="screen">
      <Scene name="meadow" />
      <div className="screen-content">
        <div className="topbar">
          <div className="logo" style={{ fontSize: 48 }}>Bé <span className="accent">Học</span> Vui</div>
          <div className="topbar-right"><IconBtn name="family" label={T.t('parentsArea')} onClick={() => go('parents')} size={52} /></div>
        </div>
        <h1 className="title-out" style={{ textAlign: 'center', fontSize: 42, marginTop: 20 }}>{T.t('whoPlays')}</h1>
        <div className="profiles-grid" style={{ marginTop: 20 }}>
          {kids.map((k) => (
            <button key={k.id} type="button" className="profile-card" onClick={() => { sfx.pop(); selectChild(k.id); go('lobby'); }}>
              <div className="avatar-circle"><Chibi look={k.look} mood="happy" size={170} /></div>
              <div className="name">{k.nickname}</div>
              <span className="lv-pill">{T.t('gradeN', { n: k.grade })}</span>
            </button>
          ))}
          {kids.length < 4 && (
            <button type="button" className="profile-card add" onClick={() => go('onboarding')}>
              <Glyph name="plus" size={64} />
              <div className="name" style={{ color: 'inherit' }}>{T.t('addChild')}</div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const GIRL_LOOKS: Partial<Look>[] = [
  { ears: 'cat', hair: 'bob', hairColor: '#6B4A3A', outfit: 'dress', outfitColor: '#B8C98A' },
  { ears: 'cat', hair: 'twin', hairColor: '#2F2A2E', outfit: 'dress', outfitColor: '#F0B48E' },
  { ears: 'none', hair: 'bob', hairColor: '#2F2A2E', outfit: 'overall', outfitColor: '#B8C98A' },
  { ears: 'none', hair: 'twin', hairColor: '#6B4A3A', outfit: 'overall', outfitColor: '#F0B48E' },
  { ears: 'none', hair: 'bob', hairColor: '#2F2A2E', outfit: 'school', outfitColor: '#B8C98A', shoes: 'sneakers', hold: 'pencil' },
  { ears: 'cat', hair: 'bob', hairColor: '#6B4A3A', outfit: 'school', outfitColor: '#F0B48E', shoes: 'maryjane', hold: 'pencil' },
];
const BOY_LOOKS: Partial<Look>[] = [
  { ears: 'none', hair: 'crew', hairColor: '#2F2A2E', outfit: 'shirtshorts', outfitColor: '#F0B48E', shoes: 'sneakers' },
  { ears: 'none', hair: 'crew', hairColor: '#6B4A3A', outfit: 'shirtshorts', outfitColor: '#B8C98A', shoes: 'sneakers' },
  { ears: 'cat', hair: 'crew', hairColor: '#2F2A2E', outfit: 'overall', outfitColor: '#B8C98A', shoes: 'sneakers' },
  { ears: 'none', hair: 'crew', hairColor: '#6B4A3A', outfit: 'overall', outfitColor: '#F0B48E', shoes: 'sneakers' },
  { ears: 'none', hair: 'crew', hairColor: '#2F2A2E', outfit: 'school', outfitColor: '#B8C98A', shoes: 'sneakers', hold: 'pencil' },
  { ears: 'none', hair: 'bob', hairColor: '#2F2A2E', outfit: 'shirtshorts', outfitColor: '#F0B48E', shoes: 'sneakers', hold: 'pencil' },
];
const SKINS = ['#F7D9C4', '#F1C9A8', '#E2AE88', '#C98D68', '#A8704F'];
const BASE: Look = { skin: '#F7D9C4', hair: 'bob', hairColor: '#6B4A3A', ears: 'cat', outfit: 'dress', outfitColor: '#B8C98A', acc: 'none', shoes: 'maryjane', hold: 'none', scene: 'meadow', gender: 'girl', pet: 'chick' };

export function Onboarding() {
  const T = useT();
  const hasKids = useApp((s) => s.children.length > 0);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(1);
  const [look, setLook] = useState<Look>(BASE);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    setBusy(true); setErr('');
    try {
      const { child } = await api.post<{ child: Child }>('/children', { nickname: name, grade, look });
      await loadChildren();
      selectChild(child.id);
      sfx.levelup();
      go('lobby');
    } catch (e) { setErr(errText(T, e)); setStep(1); } finally { setBusy(false); }
  };

  return (
    <div className="screen">
      <Scene name="village" />
      <div className="screen-content">
        <div className="topbar"><Btn tone="gray" size="sm" icon={<Glyph name="back" size={18} />} onClick={() => (step > 1 ? setStep(step - 1) : go(hasKids ? 'profiles' : 'auth'))}>{T.t('back')}</Btn></div>
        <div className="auth-wrap">
          <div className="hero">
            <div className="bubble">{step === 1 ? T.t('obName') : step === 2 ? T.t('obGrade') : T.t('obLook')}</div>
            <Chibi look={look} mood={step === 3 ? 'happy' : 'wave'} size={300} />
          </div>
          <Panel head={<><h2>{T.t('step', { n: step })}</h2></>}>
            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) setStep(2); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Field label={T.t('obName')} value={name} onChange={(e) => setName(e.target.value.slice(0, 12))} maxLength={12} autoFocus />
                <p className="muted" style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{T.t('obNameHint')}</p>
                <div className="form-error">{err}</div>
                <Btn tone="lime" type="submit" disabled={!name.trim()} wide>{T.t('next')}</Btn>
              </form>
            )}
            {step === 2 && (
              <>
                <div className="grade-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                    <button key={g} type="button" className={`grade-chip ${grade === g ? 'on' : ''}`} onClick={() => { sfx.tap(); setGrade(g); }}>
                      {g}<small>{T.t('grade')}</small>
                    </button>
                  ))}
                </div>
                <Btn tone="lime" wide onClick={() => setStep(3)}>{T.t('next')}</Btn>
              </>
            )}
            {step === 3 && (
              <>
                <div className="section-title">{T.t('obGender')}</div>
                <div className="gender-pick">
                  {(['girl', 'boy'] as const).map((g) => (
                    <button key={g} type="button" className={`gender-btn ${look.gender === g ? 'on' : ''}`} onClick={() => { sfx.tap(); setLook({ ...look, gender: g, ...(g === 'boy' ? BOY_LOOKS : GIRL_LOOKS)[0], acc: 'none', hold: 'none' }); }}>
                      <span aria-hidden>{g === 'boy' ? '👦' : '👧'}</span>{T.t(g === 'boy' ? 'boy' : 'girl')}
                    </button>
                  ))}
                </div>
                <div className="section-title">{T.t('obLook')}</div>
                <div className="chips">
                  {(look.gender === 'boy' ? BOY_LOOKS : GIRL_LOOKS).map((l, i) => (
                    <button key={i} type="button" className="item-card" style={{ width: 110 }} onClick={() => { sfx.tap(); setLook({ ...look, ...l }); }}>
                      <div className="thumb"><Chibi look={{ ...look, ...l }} size={120} /></div>
                    </button>
                  ))}
                </div>
                <div className="section-title">{T.t('slot_skin')}</div>
                <div className="swatches">
                  {SKINS.map((s) => <button key={s} type="button" aria-label={s} className={`swatch ${look.skin === s ? 'on' : ''}`} style={{ background: s }} onClick={() => { sfx.tap(); setLook({ ...look, skin: s }); }} />)}
                </div>
                <div className="section-title">{T.t('obPet')}</div>
                <div className="gender-pick">
                  {['chick', 'none'].map((pk) => (
                    <button key={pk} type="button" className={`gender-btn ${look.pet === pk ? 'on' : ''}`} onClick={() => { sfx.tap(); setLook({ ...look, pet: pk }); }}>{pk === 'chick' ? <><span aria-hidden>🐥</span>{T.t('obPetChick')}</> : T.t('obPetNone')}</button>
                  ))}
                </div>
                <div className="form-error">{err}</div>
                <Btn tone="lime" wide disabled={busy} onClick={finish}>{T.t('obDone')}</Btn>
              </>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
