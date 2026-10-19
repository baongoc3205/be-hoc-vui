// Bộ UI theo mẫu: nút viên thuốc có vệt sáng chéo, panel kem viền mauve, hộp thoại có rãnh khuyết,
// thanh tài nguyên tối mờ có nút "+", tab bên dạng nhãn mũi tên.
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { sfx } from '../lib/sfx';
import { go, useApp } from '../lib/store';
import { CoinIcon, EnergyIcon, Glyph, StarIcon } from './Icons';

type Tone = 'lime' | 'orange' | 'gray' | 'mauve' | 'cream';
export function Btn({ tone = 'lime', size = 'md', icon, children, className = '', onClick, wide, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; size?: 'sm' | 'md' | 'lg'; icon?: ReactNode; wide?: boolean }) {
  return (
    <button
      type="button"
      className={`btn btn-${tone} btn-${size} ${wide ? 'btn-wide' : ''} ${className}`}
      onClick={(e) => { sfx.tap(); onClick?.(e); }}
      {...rest}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      <span className="btn-label">{children}</span>
    </button>
  );
}

export function IconBtn({ name, label, onClick, tone = 'mauve', size = 44, className = '' }: { name: string; label: string; onClick?: () => void; tone?: 'mauve' | 'cream' | 'light'; size?: number; className?: string }) {
  return (
    <button type="button" className={`icon-btn icon-btn-${tone} ${className}`} style={{ width: size, height: size }} aria-label={label} title={label} onClick={() => { sfx.tap(); onClick?.(); }}>
      <Glyph name={name} size={size * 0.5} />
    </button>
  );
}

/** Panel kem có thanh tiêu đề mauve (tuỳ chọn). */
export function Panel({ head, children, className = '', bodyClass = '' }: { head?: ReactNode; children?: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={`panel ${className}`}>
      {head && <header className="panel-head">{head}</header>}
      {children != null && children !== false && <div className={`panel-body ${bodyClass}`}>{children}</div>}
    </section>
  );
}
/** Đường kẻ chấm với hai rãnh khuyết hai bên mép (như mẫu). */
export const Notch = () => <div className="notch" aria-hidden />;
export const Inset = ({ children, className = '' }: { children: ReactNode; className?: string }) => <div className={`inset ${className}`}>{children}</div>;

export function Dialog({ title, icon = 'alert', onClose, children, actions, wide }: { title: ReactNode; icon?: string | null; onClose?: () => void; children: ReactNode; actions?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    (ref.current?.querySelector<HTMLElement>('.dialog-body input, .dialog-actions button') ?? ref.current?.querySelector<HTMLElement>('button'))?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && onClose) onClose(); };
    addEventListener('keydown', onKey);
    sfx.pop();
    return () => { removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className={`dialog ${wide ? 'dialog-wide' : ''}`} role="dialog" aria-modal="true" ref={ref}>
        <header className="dialog-head">
          {icon && <Glyph name={icon} size={30} className="dialog-ico" />}
          <h2>{title}</h2>
          {onClose && <button type="button" className="dialog-x" aria-label="close" onClick={() => { sfx.tap(); onClose(); }}><Glyph name="close" size={30} /></button>}
        </header>
        <div className="dialog-body">{children}</div>
        {actions && (<><Notch /><footer className="dialog-actions">{actions}</footer></>)}
      </div>
    </div>
  );
}

/** Nút quay lại kiểu viên thuốc tối có mũi tên tròn (góc trên trái). */
export function BackPill({ title, to, onBack }: { title: ReactNode; to?: string; onBack?: () => void }) {
  return (
    <button type="button" className="back-pill" onClick={() => { sfx.tap(); if (onBack) onBack(); else if (to) go(to); else history.back(); }}>
      <span className="back-circle"><Glyph name="back" size={22} /></span>
      <span className="back-title">{title}</span>
    </button>
  );
}

function fmt(n: number) { return n.toLocaleString('vi-VN'); }
function useCount(value: number) {
  const [v, setV] = useState(value); const prev = useRef(value);
  useEffect(() => {
    const from = prev.current; prev.current = value;
    if (from === value) return;
    const t0 = performance.now(); let raf = 0;
    const step = (t: number) => { const k = Math.min(1, (t - t0) / 600); setV(Math.round(from + (value - from) * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [value]);
  return v;
}
function HudPill({ kind, icon, value, onPlus, label }: { kind: string; icon: ReactNode; value: ReactNode; onPlus?: () => void; label: string }) {
  return (
    <div className="hud-pill" data-hud={kind} aria-label={label}>
      <span className="hud-icon">{icon}</span>
      <span className="hud-val">{value}</span>
      {onPlus && <button type="button" className="hud-plus" aria-label={`+ ${label}`} onClick={() => { sfx.tap(); onPlus(); }}><Glyph name="plus" size={16} /></button>}
    </div>
  );
}
/** Thanh tài nguyên: năng lượng, sao, xu. */
export function Hud({ compact = false }: { compact?: boolean }) {
  const cs = useApp((s) => s.cs);
  const coins = useCount(cs?.coins ?? 0);
  if (!cs) return <div className="hud" />;
  return (
    <div className={`hud ${compact ? 'compact' : ''}`}>
      <HudPill kind="energy" label="energy" icon={<EnergyIcon size={34} />} value={cs.energy.enabled ? `${cs.energy.value}/${cs.energy.max}` : '∞'} onPlus={compact ? undefined : () => go('rewards/checkin')} />
      {!compact && <HudPill kind="stars" label="stars" icon={<StarIcon size={32} />} value={fmt(cs.stars)} onPlus={() => go('worlds')} />}
      <HudPill kind="coins" label="coins" icon={<CoinIcon size={34} />} value={fmt(coins)} onPlus={compact ? undefined : () => go('rewards')} />
    </div>
  );
}
export function TopBar({ title, to, onBack, right, hideHud }: { title: ReactNode; to?: string; onBack?: () => void; right?: ReactNode; hideHud?: boolean }) {
  return (
    <div className="topbar">
      <BackPill title={title} to={to} onBack={onBack} />
      <div className="topbar-right">{right}{!hideHud && <Hud />}</div>
    </div>
  );
}

/** Tab bên dạng nhãn mũi tên (đang chọn) hoặc chữ có bông hoa nhỏ. */
export function SideTabs<K extends string>({ tabs, value, onChange, vertical = true }: { tabs: { key: K; label: ReactNode; badge?: boolean }[]; value: K; onChange: (k: K) => void; vertical?: boolean }) {
  return (
    <nav className={`side-tabs ${vertical ? 'vertical' : 'horizontal'}`} role="tablist">
      {tabs.map((t) => (
        <button key={t.key} type="button" role="tab" aria-selected={t.key === value} className={`side-tab ${t.key === value ? 'on' : ''}`} onClick={() => { sfx.tap(); onChange(t.key); }}>
          <Glyph name="flower" size={t.key === value ? 22 : 16} className="side-tab-ico" />
          <span>{t.label}</span>
          {t.badge && <i className="dot" />}
        </button>
      ))}
    </nav>
  );
}

export function Bar({ value, max, label, right, tone = 'yellow' }: { value: number; max: number; label?: ReactNode; right?: ReactNode; tone?: 'yellow' | 'lime' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="bar-wrap">
      {(label || right) && <div className="bar-row"><span>{label}</span><span>{right}</span></div>}
      <div className="bar" role="progressbar" aria-valuenow={value} aria-valuemax={max}><i className={`bar-fill ${tone}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
export function Stars({ n, of = 3, size = 22, className = '' }: { n: number; of?: number; size?: number; className?: string }) {
  return <span className={`stars ${className}`} aria-label={`${n}/${of}`}>{Array.from({ length: of }, (_, i) => <StarIcon key={i} size={size} filled={i < n} />)}</span>;
}
export const LvPill = ({ children }: { children: ReactNode }) => <span className="lv-pill">{children}</span>;

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? 'on' : ''}`} onClick={() => { sfx.tap(); onChange(!on); }}>
      <i />
    </button>
  );
}
export function Segmented<K extends string | number>({ options, value, onChange }: { options: { key: K; label: ReactNode }[]; value: K; onChange: (k: K) => void }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => <button key={String(o.key)} type="button" role="radio" aria-checked={o.key === value} className={o.key === value ? 'on' : ''} onClick={() => { sfx.tap(); onChange(o.key); }}>{o.label}</button>)}
    </div>
  );
}
export function Field({ label, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="field"><span>{label}</span><input {...rest} /></label>
  );
}
export const Spinner = () => <div className="spinner" role="status"><i /><i /><i /></div>;

export function Toast() {
  const toast = useApp((s) => s.toast);
  if (!toast) return null;
  return <div key={toast.id} className={`toast ${toast.tone}`} role="status">{toast.text}</div>;
}

export function SpeechBubble({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bubble ${className}`}>{children}</div>;
}
