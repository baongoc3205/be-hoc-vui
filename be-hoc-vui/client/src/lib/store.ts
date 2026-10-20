// Kho trạng thái toàn cục rất nhỏ (không cần thư viện) + điều hướng theo hash.
import { useSyncExternalStore } from 'react';
import { api } from './api';
import type { Catalog, Child, ChildState, Lang, Parent } from './types';

export interface Prefs { lang: Lang; sound: boolean; music: boolean; voice: boolean; autoRead: boolean; reduceMotion: boolean; theme: string }
export interface AppState {
  booted: boolean;
  parent: Parent | null;
  children: Child[];
  childId: number | null;
  cs: ChildState | null;
  catalog: Catalog | null;
  prefs: Prefs;
  toast: { id: number; text: string; tone?: 'ok' | 'warn' } | null;
}

const PREFS_KEY = 'bhv_prefs';
const CHILD_KEY = 'bhv_child';
function loadPrefs(): Prefs {
  const def: Prefs = { lang: navigator.language?.startsWith('en') ? 'en' : 'vi', sound: true, music: true, voice: true, autoRead: true, theme: 'fairy', reduceMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false };
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    // bản cũ mặc định TẮT nhạc nền; khi lên bản có chủ đề + nhạc thì bật lại một lần
    if (saved && typeof saved === 'object' && !('theme' in saved)) saved.music = true;
    return { ...def, ...saved };
  } catch { return def; }
}
const readChild = () => { try { return Number(localStorage.getItem(CHILD_KEY)) || null; } catch { return null; } };

let state: AppState = { booted: false, parent: null, children: [], childId: readChild(), cs: null, catalog: null, prefs: loadPrefs(), toast: null };
const subs = new Set<() => void>();
export const getState = () => state;
export function setState(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
}
export function useApp<T>(sel: (s: AppState) => T): T {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => sel(state));
}

export function setPrefs(p: Partial<Prefs>) {
  const prefs = { ...state.prefs, ...p };
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* bỏ qua */ }
  setState({ prefs });
}
export function selectChild(id: number | null) {
  try { if (id) localStorage.setItem(CHILD_KEY, String(id)); else localStorage.removeItem(CHILD_KEY); } catch { /* bỏ qua */ }
  setState({ childId: id, cs: null });
}

let toastId = 0;
export function toast(text: string, tone: 'ok' | 'warn' = 'ok') {
  const id = ++toastId;
  setState({ toast: { id, text, tone } });
  setTimeout(() => { if (state.toast?.id === id) setState({ toast: null }); }, 2600);
}

// ---------- tải dữ liệu ----------
export async function boot() {
  const [{ parent }, catalog] = await Promise.all([api.get<{ parent: Parent | null }>('/auth/me'), api.get<Catalog>('/catalog')]);
  setState({ parent, catalog });
  if (parent) await loadChildren();
  setState({ booted: true });
}
export async function loadChildren() {
  const { children } = await api.get<{ children: Child[] }>('/children');
  const childId = children.some((c) => c.id === state.childId) ? state.childId : null;
  setState({ children, childId });
  return children;
}
export async function refreshChild() {
  if (!state.childId) return null;
  const cs = await api.get<ChildState>(`/children/${state.childId}/state`);
  setState({ cs });
  return cs;
}
export const setChildState = (cs: ChildState) => setState({ cs: { ...cs, next: cs.next ?? state.cs?.next } });

// ---------- điều hướng ----------
export function useRoute() {
  return useSyncExternalStore(
    (cb) => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb); },
    () => window.location.hash.replace(/^#\/?/, '') || '',
  );
}
export const go = (path: string) => { window.location.hash = '/' + path.replace(/^\//, ''); };
