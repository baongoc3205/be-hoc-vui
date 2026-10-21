// Khai báo kiểu cho shared/board/werewolf.js
import type { LText } from '../logic.js';
export type Role = 'wolf' | 'seer' | 'guard' | 'witch' | 'villager';
export interface WPlayer { id: number; name: string; role: Role; alive: boolean; human: boolean }
export interface WLog { day: number; who: number | null; text: LText; kind: 'say' | 'claim' | 'sys' | 'phase' | 'death' | 'good' | 'clue' }
export interface WState { n: number; players: WPlayer[]; day: number; phase: 'night' | 'day' | 'end'; lastGuard: number | null; potions: { heal: boolean; kill: boolean }; checks: Record<number, boolean>; claims: Record<number, { day: number }>; log: WLog[]; winner: 'village' | 'wolf' | null; susM: number[][]; known?: Record<number, 'good'> }
export interface NightPlan { victim: number | null; guard: number | null; heal: boolean; poison: number | null; check: { seer: number; target: number | null } | null }
type Rnd = () => number;
export const ROLE_INFO: Record<Role, { icon: string; name: LText; goal: LText }>;
export const SETUPS: Record<number, Role[]>;
export function newGame(n: number, rnd: Rnd, opts?: { humanName?: string; humanRole?: Role | 'random' }): WState;
export function alive(s: WState): WPlayer[];
export function isWolf(s: WState, id: number): boolean;
export function checkWin(s: WState): 'village' | 'wolf' | null;
export function botWolfTarget(s: WState, rnd: Rnd): number | null;
export function botWitch(s: WState, wid: number, victim: number | null, rnd: Rnd): { heal: boolean; poison: number | null };
export function botNight(s: WState, rnd: Rnd): NightPlan;
export function resolveNight(s: WState, plan: NightPlan): { s: WState; deaths: number[] };
export function dayTalk(s: WState, rnd: Rnd): WState;
export function humanSay(s: WState, kind: 'accuse' | 'clear' | 'claimWolf' | 'claimClean', target: number, who?: number): WState;
export function botVotes(s: WState, rnd: Rnd): Record<number, number | null>;
export function resolveVote(s: WState, votes: Record<number, number | null>): { s: WState; out: number | null; tally: Record<number, number> };
export function clue(s: WState, rnd: Rnd): WState;
