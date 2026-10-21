// Phần dùng chung cho các trò chơi cùng bot: chữ song ngữ, hình đại diện bot, tốc độ bot.
import type { Look } from '../../lib/types';
import { Chibi, MASCOTS } from '../../ui/Chibi';

export type Tr = (vi: string, en: string) => string;
export const makeTr = (lang: string): Tr => (vi, en) => (lang === 'en' ? en : vi);

const HAIR = ['bob', 'twin', 'spiky', 'long', 'bun', 'ponytail', 'curly', 'braids', 'pixie'];
const HAIRC = ['#6B4A3A', '#2F2A2E', '#D9A55B', '#C9565E', '#9CC3E0', '#8E5A3C', '#B9A3D6', '#F3E6D8'];
const EARS = ['cat', 'bunny', 'bear', 'fox', 'panda', 'mouse', 'puppy', 'tiger', 'koala', 'frog', 'none'];
const OUT = ['hoodie', 'tshirt', 'overall', 'dress', 'sailor', 'pajamas', 'tracksuit', 'baba'];
const OUTC = ['#9FC3DD', '#F0B48E', '#C2A9D6', '#B8C98A', '#F2D57E', '#D97B8A', '#9CD3BE', '#5D6E9A'];
const SKIN = ['#F7D9C4', '#F4D3BC', '#F8DCCB', '#E8C2A4', '#D9A988'];
const MASC = Object.values(MASCOTS);

/** Hình bot thứ i (cố định theo số thứ tự để bot không "đổi mặt" giữa ván). */
export function botLook(i: number): Look {
  if (i < MASC.length) return MASC[i];
  const k = i * 7 + 3;
  return { skin: SKIN[k % SKIN.length], hair: HAIR[k % HAIR.length], hairColor: HAIRC[(k * 3) % HAIRC.length], ears: EARS[(k * 5) % EARS.length], outfit: OUT[(k * 3) % OUT.length], outfitColor: OUTC[(k * 5) % OUTC.length], acc: 'none', shoes: 'sneakers', hold: 'none', scene: 'meadow' };
}

export function Avatar({ look, size = 56, dim, className = '' }: { look: Look; size?: number; dim?: boolean; className?: string }) {
  return <div className={`bg-avatar ${dim ? 'dim' : ''} ${className}`} style={{ width: size, height: size }}><Chibi look={look} size={size * 1.25} /></div>;
}

export type Level = 'easy' | 'normal';
export const BOT_DELAY = 750;
