import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import { go, loadChildren, setState } from '../lib/store';
import type { Parent } from '../lib/types';
import { useT } from '../lib/hooks';
import { Btn, Field, Panel, Segmented } from '../ui/kit';
import { Scene } from '../ui/Scene';
import { Chibi, MASCOTS } from '../ui/Chibi';

export function errText(T: ReturnType<typeof useT>, e: unknown) {
  const code = e instanceof ApiError ? e.code : 'SERVER_ERROR';
  const key = `err_${code}` as Parameters<typeof T.t>[0];
  return (T.d as Record<string, unknown>)[key] ? T.t(key) : T.t('err_SERVER_ERROR');
}

export function Auth() {
  const T = useT();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  const done = async (parent: Parent) => {
    setState({ parent });
    const kids = await loadChildren();
    go(kids.length ? 'profiles' : 'onboarding');
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = mode === 'login' ? await api.post<{ parent: Parent }>('/auth/login', { email, password: pw }) : await api.post<{ parent: Parent }>('/auth/register', { name, email, password: pw });
      await done(r.parent);
    } catch (ex) { setErr(errText(T, ex)); } finally { setBusy(false); }
  };
  const guest = async () => { setBusy(true); try { await done((await api.post<{ parent: Parent }>('/auth/guest')).parent); } catch (ex) { setErr(errText(T, ex)); } finally { setBusy(false); } };

  return (
    <div className="screen">
      <Scene name="beach" />
      <div className="screen-content">
        <div className="auth-wrap">
          <div className="hero">
            <div className="logo">Bé <span className="accent">Học</span> Vui</div>
            <Chibi look={MASCOTS.mimi} mood="wave" size={300} />
          </div>
          <Panel className="auth-panel" head={<h2>{T.t('authTitle')}</h2>}>
            <Segmented options={[{ key: 'login', label: T.t('login') }, { key: 'register', label: T.t('register') }]} value={mode} onChange={(m) => { setMode(m); setErr(''); }} />
            <p className="muted" style={{ margin: 0, fontWeight: 700 }}>{T.t('authHint')}</p>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mode === 'register' && <Field label={T.t('parentName')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={40} />}
              <Field label={T.t('email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              <Field label={T.t('password')} type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={6} />
              <div className="form-error" role="alert">{err}</div>
              <Btn tone="lime" type="submit" disabled={busy} wide>{mode === 'login' ? T.t('login') : T.t('register')}</Btn>
            </form>
            <button type="button" className="link-btn" onClick={guest} disabled={busy}>{T.t('guest')}</button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
