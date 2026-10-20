import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import { go, loadChildren, setState, toast } from '../lib/store';
import type { Parent } from '../lib/types';
import { useT } from '../lib/hooks';
import { Btn, Dialog, Field, Panel, Segmented } from '../ui/kit';
import { Scene } from '../ui/Scene';
import { Chibi, MASCOTS } from '../ui/Chibi';

export function errText(T: ReturnType<typeof useT>, e: unknown) {
  const code = e instanceof ApiError ? e.code : 'SERVER_ERROR';
  const key = `err_${code}` as Parameters<typeof T.t>[0];
  return (T.d as Record<string, unknown>)[key] ? T.t(key) : T.t('err_SERVER_ERROR');
}

/** Ô đánh dấu đồng ý chính sách (kèm link mở trang chính sách). */
export function Consent({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const T = useT();
  return (
    <label className="consent">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span>{T.t('consentLabel')} <a href="#/privacy" onClick={(e) => e.stopPropagation()}>{T.t('privacyPolicy')}</a></span>
    </label>
  );
}

/** Hộp thoại hiện mã khôi phục (chỉ hiện một lần): sao chép, tải file, phải tick "đã lưu" mới đi tiếp. */
export function RecoveryCodeDialog({ code, email, onDone }: { code: string; email?: string | null; onDone: () => void }) {
  const T = useT();
  const [saved, setSaved] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(code); toast(T.t('copied')); } catch { /* trình duyệt chặn: bé/phụ huynh tự chép */ } };
  const download = () => {
    const text = `Bé Học Vui — ${T.t('recoveryCode')}\n\nEmail: ${email ?? ''}\n${T.t('recoveryCode')}: ${code}\n\n${T.t('recoveryWhy')}\n`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); a.download = 'be-hoc-vui-ma-khoi-phuc.txt';
    document.body.appendChild(a); a.click(); a.remove();
  };
  return (
    <Dialog title={T.t('recoveryTitle')} icon="shield" actions={<Btn tone="lime" disabled={!saved} onClick={onDone}>{T.t('goOn')}</Btn>}>
      <div className="dialog-body left" style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 18 }}>{T.t('recoveryWhy')}</p>
        <div className="recovery-code" aria-label={T.t('recoveryCode')}>{code}</div>
        <div className="auth-links"><Btn tone="cream" size="sm" onClick={copy}>{T.t('copy')}</Btn><Btn tone="cream" size="sm" onClick={download}>{T.t('downloadFile')}</Btn></div>
        <label className="consent"><input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} /><span>{T.t('savedCheck')}</span></label>
      </div>
    </Dialog>
  );
}

export function Auth() {
  const T = useT();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState<null | { email: string; code: string; pw: string; err?: string }>(null);
  const [shown, setShown] = useState<null | { code: string; parent: Parent }>(null);

  const done = async (parent: Parent) => {
    setState({ parent });
    const kids = await loadChildren();
    go(kids.length ? 'profiles' : 'onboarding');
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = mode === 'login' ? await api.post<{ parent: Parent; recoveryCode?: string }>('/auth/login', { email, password: pw }) : await api.post<{ parent: Parent; recoveryCode?: string }>('/auth/register', { name, email, password: pw, consent });
      if (r.recoveryCode) setShown({ code: r.recoveryCode, parent: r.parent }); else await done(r.parent);
    } catch (ex) { setErr(errText(T, ex)); } finally { setBusy(false); }
  };
  const guest = async () => { setBusy(true); try { await done((await api.post<{ parent: Parent }>('/auth/guest', { consent: true })).parent); } catch (ex) { setErr(errText(T, ex)); } finally { setBusy(false); } };
  const sendForgot = async () => {
    if (!forgot) return;
    try { const r = await api.post<{ parent: Parent; recoveryCode: string }>('/auth/recover', { email: forgot.email, code: forgot.code, password: forgot.pw }); setForgot(null); setShown({ code: r.recoveryCode, parent: r.parent }); }
    catch (ex) { setForgot({ ...forgot, err: errText(T, ex) }); }
  };

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
              {mode === 'register' && <Consent on={consent} onChange={setConsent} />}
              <div className="form-error" role="alert">{err}</div>
              <Btn tone="lime" type="submit" disabled={busy || (mode === 'register' && !consent)} wide>{mode === 'login' ? T.t('login') : T.t('register')}</Btn>
            </form>
            <div className="auth-links">
              {mode === 'login' && <button type="button" className="link-btn" onClick={() => setForgot({ email, code: '', pw: '' })}>{T.t('forgot')}</button>}
              <button type="button" className="link-btn" onClick={guest} disabled={busy}>{T.t('guest')}</button>
            </div>
            <p className="muted consent-note">{T.t('guestConsent')} <a href="#/privacy">{T.t('privacyPolicy')}</a>.</p>
          </Panel>
        </div>
      </div>
      {forgot && (
        <Dialog title={T.t('forgotTitle')} icon="user" onClose={() => setForgot(null)}
          actions={<><Btn tone="gray" onClick={() => setForgot(null)}>{T.t('cancel')}</Btn><Btn tone="lime" onClick={sendForgot}>{T.t('resetBtn')}</Btn></>}>
          <div className="dialog-body left" style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 18 }}>{T.t('forgotHint')}</p>
            <Field label={T.t('email')} type="email" value={forgot.email} onChange={(e) => setForgot({ ...forgot, email: e.target.value })} autoComplete="email" />
            <Field label={T.t('recoveryCode')} value={forgot.code} placeholder="XXXX-XXXX-XXXX" onChange={(e) => setForgot({ ...forgot, code: e.target.value.toUpperCase() })} autoComplete="off" spellCheck={false} />
            <Field label={T.t('newPassword')} type="password" value={forgot.pw} onChange={(e) => setForgot({ ...forgot, pw: e.target.value })} autoComplete="new-password" minLength={6} />
            <div className="form-error">{forgot.err}</div>
            <p className="muted" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{T.t('forgotNoCode')}</p>
          </div>
        </Dialog>
      )}
      {shown && <RecoveryCodeDialog code={shown.code} email={shown.parent.email} onDone={() => { const p = shown.parent; setShown(null); void done(p); }} />}
    </div>
  );
}
