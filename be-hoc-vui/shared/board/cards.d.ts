// Khai báo kiểu cho shared/board/cards.js
export type CardColor = 'red' | 'yellow' | 'green' | 'blue';
export interface Card { id: number; c: CardColor | null; v: string }
export interface CardsState { n: number; deck: Card[]; discard: Card[]; hands: Card[][]; turn: number; dir: 1 | -1; color: CardColor; drew: number | null; winner: number | null; moves: number }
export type CardsEvent = { t: 'play'; p: number; card: Card; color: CardColor } | { t: 'win' | 'uno' | 'forgot' | 'rev' | 'skip' | 'drew' | 'pass'; p: number } | { t: 'draw'; p: number; k: number };
export type BotMove = { type: 'play'; idx: number; color: CardColor | null; called: boolean } | { type: 'draw' } | { type: 'pass' };
type Rnd = () => number;
export const COLORS: CardColor[];
export function makeDeck(): Card[];
export function newGame(n: number, rnd: Rnd, handSize?: number): CardsState;
export function top(s: CardsState): Card;
export function nextSeat(s: CardsState, from?: number, steps?: number): number;
export function canPlay(s: CardsState, p: number, card: Card): boolean;
export function playable(s: CardsState, p: number): number[];
export function play(s: CardsState, p: number, idx: number, color: CardColor | null, called: boolean, rnd: Rnd): { s: CardsState; events: CardsEvent[] };
export function draw(s: CardsState, p: number, rnd: Rnd): { s: CardsState; events: CardsEvent[] };
export function pass(s: CardsState, p: number): { s: CardsState; events: CardsEvent[] };
export function bestColor(hand: Card[], rnd: Rnd): CardColor;
export function botMove(s: CardsState, p: number, level: 'easy' | 'normal', rnd: Rnd): BotMove;
