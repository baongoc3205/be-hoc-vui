// Khai báo kiểu cho shared/logic.js (dùng ở client TypeScript).
export type LText = { vi: string; en: string };
export type RoundKind = 'mc' | 'tf' | 'pairs' | 'order' | 'word' | 'clock' | 'classify' | 'trace' | 'input' | 'multi';
export interface Round {
  id: string;
  kind: RoundKind;
  prompt: LText;
  title?: LText | null;
  options?: LText[];
  answer?: number | boolean | string | number[];
  /** input: các cách viết khác cũng được chấp nhận; unit: đơn vị hiện sau ô nhập; numeric: hiện bàn phím số */
  accept?: string[];
  unit?: string | null;
  numeric?: boolean;
  /** đọc hiểu: đoạn văn đi kèm câu hỏi */
  passage?: LText | null;
  say?: { text: string; lang: 'vi' | 'en' } | null;
  blank?: boolean;
  pairs?: [LText, LText][];
  memory?: boolean;
  items?: LText[] | { t: LText; ok: boolean }[];
  tiles?: { id: string; ch: string }[];
  h?: number;
  m?: number;
  shape?: string;
}
export function makeRng(seed: number): () => number;
export function shuffle<T>(rnd: () => number, arr: T[]): T[];
export function norm(s: string): string;
export function normAnswer(s: unknown): string;
export function stripMarks(s: unknown): string;
export function gradeRound(round: Round, given: unknown): number;
export function starsFor(accuracy: number): 0 | 1 | 2 | 3;
export function levelInfo(xp: number): { level: number; current: number; needed: number };
export const MAX_ENERGY: number;
