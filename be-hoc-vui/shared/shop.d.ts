// Khai báo kiểu cho shared/shop.js (dùng ở client TypeScript).
import type { LText } from './logic.js';
export interface ShopEvent { id: string; tag: string; icon: string; gift: string; name: LText; desc: LText; start: string; end: string }
export const EVENT_DISCOUNT: number;
export const COMBO_DISCOUNT: number;
export const GIFT_COINS: number;
export function activeEvents(day: string): ShopEvent[];
export function nextEvent(day: string): ShopEvent | null;
export function giftKey(ev: { id: string; start: string }): string;
export function onSale(tag: string | undefined, events: { tag: string }[]): boolean;
export function itemPrice(item: { price: number; tag?: string } | undefined, events?: { tag: string }[]): number;
export function comboPrice(combo: { tag?: string }, items: { id: string; price: number; tag?: string }[], owned?: string[], events?: { tag: string }[]): { price: number; full: number; missing: string[] };
export interface SaleWindow { open: boolean; start: string; end: string; event: string }
export function forSale(entry: { limited?: boolean; tag?: string } | undefined, events: { tag: string }[]): boolean;
export function saleWindow(tag: string, day: string): SaleWindow | null;
export function daysBetween(day: string, to: string): number;
