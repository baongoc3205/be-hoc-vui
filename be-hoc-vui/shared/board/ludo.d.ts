// Khai báo kiểu cho shared/board/ludo.js
export interface LudoState { seats: number[]; pieces: Record<number, number[]>; turn: number; dice: number | null; sixes: number; winner: number | null; exitOn: number[]; moves: number }
export interface LudoMove { piece: number; from: number; to: number; captures: [number, number][] }
export type LudoEvent = { t: 'three6' | 'nomove' | 'capture' | 'home' | 'win' | 'again'; col: number; victim?: number };
type Rnd = () => number;
export const TRACK: [number, number][];
export const COLORS: string[];
export const START: number[];
export const SAFE: Set<number>;
export const HOME: [number, number][][];
export const FINISH: number;
export function cellOf(col: number, pos: number): number | null;
export function newGame(seats: number[], opts?: { exitOn?: number[] }): LudoState;
export function current(s: LudoState): number;
export function legalMoves(s: LudoState): LudoMove[];
export function roll(s: LudoState, value: number): { s: LudoState; events: LudoEvent[] };
export function move(s: LudoState, m: { piece: number }): { s: LudoState; events: LudoEvent[] };
export function botChoose(s: LudoState, level: 'easy' | 'normal', rnd: Rnd): LudoMove | null;
