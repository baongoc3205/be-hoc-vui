// Khai báo kiểu cho shared/logic.js (dùng ở client TypeScript).
export type LText = { vi: string; en: string };
export type RoundKind = 'mc' | 'tf' | 'pairs' | 'order' | 'word' | 'clock' | 'classify';
export interface Round {
  id: string;
  kind: RoundKind;
  prompt: LText;
  title?: LText | null;
  options?: LText[];
  answer?: number | boolean | string;
  say?: { text: string; lang: 'vi' | 'en' } | null;
  blank?: boolean;
  pairs?: [LText, LText][];
  memory?: boolean;
  items?: LText[] | { t: LText; ok: boolean }[];
  tiles?: { id: string; ch: string }[];
  h?: number;
  m?: number;
}
export function makeRng(seed: number): () => number;
export function shuffle<T>(rnd: () => number, arr: T[]): T[];
export function norm(s: string): string;
export function gradeRound(round: Round, given: unknown): number;
export function starsFor(accuracy: number): 0 | 1 | 2 | 3;
export function levelInfo(xp: number): { level: number; current: number; needed: number };
export const MAX_ENERGY: number;
