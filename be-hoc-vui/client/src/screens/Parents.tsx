import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { getState, go, loadChildren, refreshChild, selectChild, setState, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { Child, Parent } from '../lib/types';
import { Btn, Dialog, Field, Inset, Panel, Segmented, Toggle, TopBar } from '../ui/kit';
import { Chibi } from '../ui/Chibi';
import { Glyph } from '../ui/Icons';
import { Consent, errText, RecoveryCodeDialog } from './Auth';
import { sfx } from '../lib/sfx';

let gateUntil = 0; // mở khoá cổng phụ huynh trong 10 phút

interface Report {
  child: Child;
  week: { day: string; minutes: number; correct: number; answered: number; lessons: number }[];
  bySubject: { subject: string; name: { vi: string; en: string }; accuracy: number | null; sessions: number }[];
  recent: { lesson_id: string; gameName: { vi: string; en: string }; topic: { vi: string; en: string }; subject: string; stars: number; correct: number; total: number; finished_at: number; duration_sec: number }[];
  stats: { lessonsDone: number; threeStars: number; correctTotal: number; streak: number };
}

function Gate({ onOk }: { onOk: () => void }) {
  const T = useT();
  const [q] = useState(() => { const a = 6 + Math.floor(Math.random() * 7), b = 6 + Math.floor(Math.random() * 7); return { a, b }; });
  const [v, setV] = useState(''); const [err, setErr] = useState(false);
  const check = () => { if (Number(v) === q.a * q.b) { gateUntil = Date.now() + 10 * 60e3; onOk(); } else { sfx.wrong(); setErr(true); setV(''); } };
  return (
    <Dialog title={T.t('gateTitle')} icon="family" onClose={() => go(getState().childId ? 'lobby' : 'profiles')} actions={<Btn tone="lime" onClick={check}>{T.t('confirm')}</Btn>}>
      <p style={{ margin: '0 0 10px' }}>{T.t('gateAsk')}</p>
      <div className="gate-q">{q.a} × {q.b} = ?</div>
      <input className="gate-input" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, '').slice(0, 3))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); check(); } }} autoFocus aria-label="answer" />
      <div className="form-error">{err ? T.t('gateWrong') : ''}</div>
    </Dialog>
  );
}

function WeekChart({ week, lang }: { week: Report['week']; lang: 'vi' | 'en' }) {
  const max = Math.max(10, ...week.map((d) => d.minutes));
  const W = 560, H = 220, bw = 50, gap = (W - 40 - bw * 7) / 6;
  const fmt = new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', { weekday: 'short' });
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H + 40}`} role="img" aria-label="minutes per day">
      {[0, 0.5, 1].map((k) => <g key={k}><line x1="30" x2={W} y1={H - k * (H - 20)} y2={H - k * (H - 20)} stroke="#E6D9D3" strokeWidth="2" strokeDasharray="4 6" /><text x="0" y={H - k * (H - 20) + 5} fontSize="14" fill="#8B7577" fontWeight="700">{Math.round(k * max)}</text></g>)}
      {week.map((d, i) => {
        const h = (d.minutes / max) * (H - 20); const x = 40 + i * (bw + gap);
        return (<g key={d.day}>
          <rect x={x} y={H - h} width={bw} height={Math.max(h, 2)} rx="12" fill={i === 6 ? '#E2804F' : '#B2C739'} />
          {d.minutes > 0 && <text x={x + bw / 2} y={H - h - 8} textAnchor="middle" fontSize="15" fontWeight="800" fill="#5E4A4C">{d.minutes}</text>}
          <text x={x + bw / 2} y={H + 26} textAnchor="middle" fontSize="15" fontWeight="800" fill="#8B7577">{fmt.format(new Date(`${d.day}T12:00:00`))}</text>
        </g>);
      })}
    </svg>
  );
}

export function Parents() {
  const T = useT();
  const parent = useApp((s) => s.parent)!;
  const kids = useApp((s) => s.children);
  const activeChild = useApp((s) => s.childId);
  const [open, setOpen] = useState(Date.now() < gateUntil);
  const [sel, setSel] = useState<number | null>(activeChild ?? kids[0]?.id ?? null);
  const [rep, setRep] = useState<Report | null>(null);
  const [edit, setEdit] = useState<Child | null>(null);
  const [del, setDel] = useState<Child | null>(null);
  const [pw, setPw] = useState(''); const [err, setErr] = useState('');
  const [acct, setAcct] = useState<'upgrade' | 'password' | null>(null);
  const [delAcct, setDelAcct] = useState(false);
  const [codeAsk, setCodeAsk] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', current: '' });

  const load = () => { if (sel) api.get<Report>(`/children/${sel}/report`).then(setRep).catch(() => setRep(null)); };
  useEffect(() => { if (open) load(); /* eslint-disable-next-line */ }, [sel, open]);
  const child = kids.find((k) => k.id === sel) ?? null;
  const totals = useMemo(() => rep ? { minutes: rep.week.reduce((a, d) => a + d.minutes, 0), lessons: rep.week.reduce((a, d) => a + d.lessons, 0) } : null, [rep]);

  if (!open) return <div className="screen parents"><Gate onOk={() => setOpen(true)} /></div>;

  const patch = async (body: unknown) => {
    if (!sel) return;
    try { await api.patch(`/children/${sel}`, body); await loadChildren(); if (sel === activeChild) await refreshChild(); load(); toast(T.t('saved')); } catch (e) { toast(errText(T, e), 'warn'); }
  };
  const doDelete = async () => {
    if (!del) return; setErr('');
    try { await api.post('/auth/verify', { password: pw }); await api.del(`/children/${del.id}`); if (activeChild === del.id) selectChild(null); const ks = await loadChildren(); setSel(ks[0]?.id ?? null); setDel(null); setPw(''); }
    catch (e) { setErr(errText(T, e)); }
  };
  const exportData = async () => {
    try {
      const res = await fetch('/api/account/export', { credentials: 'same-origin' });
      if (!res.ok) throw new Error(String(res.status));
      const blob = new Blob([JSON.stringify(await res.json(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `be-hoc-vui-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch { toast(T.t('err_SERVER_ERROR'), 'warn'); }
  };
  const deleteAccount = async () => {
    setErr('');
    try { await api.post('/account/delete', { password: pw }); selectChild(null); setState({ parent: null, children: [], cs: null }); setDelAcct(false); toast(T.t('accountDeleted')); go('auth'); }
    catch (e) { setErr(errText(T, e)); }
  };
  const makeCode = async () => {
    setErr('');
    try { const r = await api.post<{ recoveryCode: string }>('/auth/recovery-code', { password: pw }); setCodeAsk(false); setPw(''); setState({ parent: { ...parent, hasRecovery: true } }); setCode(r.recoveryCode); }
    catch (e) { setErr(errText(T, e)); }
  };
  const logout = async () => { await api.post('/auth/logout'); selectChild(null); setState({ parent: null, children: [], cs: null }); go('auth'); };
  const saveAcct = async () => {
    setErr('');
    try {
      if (acct === 'upgrade') { if (!consent) { setErr(T.t('err_CONSENT_REQUIRED')); return; } const r = await api.post<{ parent: Parent; recoveryCode: string }>('/auth/upgrade', { ...form, consent }); setState({ parent: { ...r.parent, hasRecovery: true } }); setCode(r.recoveryCode); }
      else await api.post('/auth/password', { current: form.current, next: form.password });
      setAcct(null); setForm({ name: '', email: '', password: '', current: '' }); toast(T.t('saved'));
    } catch (e) { setErr(errText(T, e)); }
  };
  const limits = [0, 15, 30, 45, 60, 90, 120];

  return (
    <div className="screen parents">
      <div className="screen-content">
        <TopBar title={T.t('parentsArea')} onBack={() => go(activeChild ? 'lobby' : 'profiles')} hideHud right={<Btn tone="gray" size="sm" icon={<Glyph name="logout" size={18} />} onClick={logout}>{T.t('logout')}</Btn>} />
        {!parent.isGuest && parent.hasRecovery === false && <Inset className="row"><div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}><b style={{ flex: 1 }}>{T.t('noRecoveryYet')}</b><Btn tone="orange" size="sm" onClick={() => { setErr(''); setPw(''); setCodeAsk(true); }}>{T.t('newRecovery')}</Btn></div></Inset>}
        {parent.isGuest && <Inset className="row"><div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}><b style={{ flex: 1 }}>{T.t('guestAccount')}</b><Btn tone="orange" size="sm" onClick={() => { setErr(''); setAcct('upgrade'); }}>{T.t('createAccount')}</Btn></div></Inset>}
        <div className="p-grid">
          <div className="p-kids">
            {kids.map((k) => (
              <button key={k.id} type="button" className={`p-kid ${k.id === sel ? 'on' : ''}`} onClick={() => setSel(k.id)}>
                <span className="av"><Chibi look={k.look} size={84} /></span>
                <span>{k.nickname}<small>{T.t('gradeN', { n: k.grade })}</small></span>
              </button>
            ))}
            {kids.length < 4 && <Btn tone="cream" size="sm" icon={<Glyph name="plus" size={18} />} onClick={() => go('onboarding')}>{T.t('addChild')}</Btn>}
            {!parent.isGuest && <button type="button" className="link-btn" onClick={() => { setErr(''); setAcct('password'); }}>{T.t('changePassword')}</button>}
            <div className="family-data">
              <b>{T.t('familyData')}</b>
              <button type="button" className="link-btn" onClick={exportData}>{T.t('exportData')}</button>
              {!parent.isGuest && <button type="button" className="link-btn" onClick={() => { setErr(''); setPw(''); setCodeAsk(true); }}>{T.t('newRecovery')}</button>}
              <button type="button" className="link-btn danger" onClick={() => { setErr(''); setPw(''); setDelAcct(true); }}>{T.t('deleteAccount')}</button>
              <a className="link-btn" href="#/privacy">{T.t('privacyPolicy')}</a>
            </div>
          </div>
          {child && rep ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="p-cards">
                <div className="p-card"><b>{totals?.minutes ?? 0}</b><span>{T.t('minutes')} · {T.t('week')}</span></div>
                <div className="p-card"><b>{totals?.lessons ?? 0}</b><span>{T.t('stLessons')} · {T.t('week')}</span></div>
                <div className="p-card"><b>{rep.stats.correctTotal}</b><span>{T.t('stCorrect')}</span></div>
                <div className="p-card"><b>{rep.stats.streak}</b><span>{T.t('stStreak')}</span></div>
              </div>
              <Panel head={<h3>{T.t('report')} · {T.t('week')}</h3>}><WeekChart week={rep.week} lang={T.lang} /></Panel>
              <Panel head={<h3>{T.t('accuracy')}</h3>}>
                {rep.bySubject.map((s) => (
                  <div key={s.subject} className="acc-row"><span>{T.tx(s.name)}</span>
                    <div className="bar"><i className="bar-fill lime" style={{ width: `${Math.round((s.accuracy ?? 0) * 100)}%` }} /></div>
                    <span>{s.accuracy === null ? '—' : `${Math.round(s.accuracy * 100)}%`}</span></div>
                ))}
              </Panel>
              <Panel head={<h3>{T.t('recent')}</h3>}>
                {rep.recent.length === 0 ? <p className="muted">{T.t('noData')}</p> : (
                  <table className="recent-table"><thead><tr><th>{T.t('report')}</th><th>{T.t('accuracy')}</th><th>★</th><th>{T.t('minutes')}</th></tr></thead>
                    <tbody>{rep.recent.map((r, i) => <tr key={i}><td>{T.tx(r.topic)} · {T.tx(r.gameName)}<br /><small className="muted">{new Date(r.finished_at).toLocaleString(T.lang === 'vi' ? 'vi-VN' : 'en-GB')}</small></td><td>{r.correct}/{r.total}</td><td>{'★'.repeat(r.stars)}</td><td>{Math.max(1, Math.round(r.duration_sec / 60))}</td></tr>)}</tbody></table>
                )}
              </Panel>
              <Panel head={<h3>{T.t('settings')} · {child.nickname}</h3>}>
                <div className="setting-row" style={{ flexWrap: 'wrap' }}><span>{T.t('limit')}</span>
                  <Segmented options={limits.map((m) => ({ key: m, label: m === 0 ? T.t('noLimit') : `${m}′` }))} value={child.settings.dailyLimitMin} onChange={(m) => patch({ settings: { dailyLimitMin: m } })} /></div>
                <div className="setting-row"><span>{T.t('energySys')}</span><Toggle on={child.settings.energy} onChange={(v) => patch({ settings: { energy: v } })} label="energy" /></div>
                <div className="setting-row"><span>{T.t('boardOn')}</span><Toggle on={child.settings.leaderboard} onChange={(v) => patch({ settings: { leaderboard: v } })} label="leaderboard" /></div>
                <div className="panel-actions">
                  <Btn tone="gray" icon={<Glyph name="trash" size={20} />} onClick={() => { setErr(''); setPw(''); setDel(child); }}>{T.t('deleteChild')}</Btn>
                  <Btn tone="lime" icon={<Glyph name="edit" size={20} />} onClick={() => setEdit({ ...child })}>{T.t('editChild')}</Btn>
                </div>
              </Panel>
            </div>
          ) : <Panel><p>{kids.length ? T.t('loading') : T.t('noData')}</p></Panel>}
        </div>
      </div>

      {edit && (
        <Dialog title={T.t('editChild')} icon="edit" onClose={() => setEdit(null)} actions={<><Btn tone="gray" onClick={() => setEdit(null)}>{T.t('cancel')}</Btn><Btn tone="lime" onClick={async () => { await patch({ nickname: edit.nickname, grade: edit.grade }); setEdit(null); }}>{T.t('save')}</Btn></>}>
          <div className="dialog-body left" style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label={T.t('obName')} value={edit.nickname} maxLength={12} onChange={(e) => setEdit({ ...edit, nickname: e.target.value })} />
            <span className="section-title">{T.t('grade')}</span>
            <Segmented options={[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => ({ key: g, label: String(g) }))} value={edit.grade} onChange={(g) => setEdit({ ...edit, grade: g })} />
          </div>
        </Dialog>
      )}
      {del && (
        <Dialog title={T.t('deleteChild')} onClose={() => setDel(null)} actions={<><Btn tone="gray" onClick={() => setDel(null)}>{T.t('cancel')}</Btn><Btn tone="orange" onClick={doDelete}>{T.t('confirm')}</Btn></>}>
          <p style={{ marginTop: 0 }}>{T.t('deleteAsk', { name: del.nickname })}</p>
          {!parent.isGuest && <Field label={T.t('enterPassword')} type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />}
          <div className="form-error">{err}</div>
        </Dialog>
      )}
      {codeAsk && (
        <Dialog title={T.t('newRecovery')} icon="shield" onClose={() => setCodeAsk(false)} actions={<><Btn tone="gray" onClick={() => setCodeAsk(false)}>{T.t('cancel')}</Btn><Btn tone="lime" onClick={makeCode}>{T.t('goOn')}</Btn></>}>
          <Field label={T.t('enterPassword')} type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
          <div className="form-error">{err}</div>
        </Dialog>
      )}
      {code && <RecoveryCodeDialog code={code} email={parent.email} onDone={() => setCode(null)} />}
      {delAcct && (
        <Dialog title={T.t('deleteAccount')} onClose={() => setDelAcct(false)} actions={<><Btn tone="gray" onClick={() => setDelAcct(false)}>{T.t('cancel')}</Btn><Btn tone="orange" onClick={deleteAccount}>{T.t('confirm')}</Btn></>}>
          <p style={{ marginTop: 0 }}>{T.t('deleteAccountAsk')}</p>
          {!parent.isGuest && <Field label={T.t('enterPassword')} type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />}
          <div className="form-error">{err}</div>
        </Dialog>
      )}
      {acct && (
        <Dialog title={acct === 'upgrade' ? T.t('createAccount') : T.t('changePassword')} icon="user" onClose={() => setAcct(null)} actions={<><Btn tone="gray" onClick={() => setAcct(null)}>{T.t('cancel')}</Btn><Btn tone="lime" onClick={saveAcct}>{T.t('save')}</Btn></>}>
          <div className="dialog-body left" style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {acct === 'upgrade' ? (<>
              <Field label={T.t('parentName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Field label={T.t('email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
              <Field label={T.t('password')} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
              <Consent on={consent} onChange={setConsent} />
            </>) : (<>
              <Field label={T.t('currentPassword')} type="password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} autoComplete="current-password" />
              <Field label={T.t('newPassword')} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
            </>)}
            <div className="form-error">{err}</div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
