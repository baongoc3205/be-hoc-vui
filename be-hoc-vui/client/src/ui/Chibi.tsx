// Nhân vật chibi kiểu "búp bê vinyl" vẽ bằng SVG: đổ bóng mềm bằng gradient, không viền.
// Dựng từ bộ phận tách rời (tóc sau, tai, đầu, mặt, tóc mái, thân, tay, chân) để tuỳ biến & tạo chuyển động.
import { useId, type ReactElement } from 'react';
import type { Look } from '../lib/types';

export type Mood = 'idle' | 'happy' | 'cheer' | 'sad' | 'think' | 'wave' | 'sleep' | 'wow';

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  r = f(r); g = f(g); b = f(b);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Đường ngôi sao 5 cánh. */
const star = (cx: number, cy: number, R: number, r = R * 0.45) => {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const k = i % 2 ? r : R; d += `${i ? 'L' : 'M'}${(cx + k * Math.cos(a)).toFixed(1)} ${(cy + k * Math.sin(a)).toFixed(1)}`; }
  return `${d}z`;
};
/** Đường trái tim, tâm (cx, cy), cỡ s. */
const heart = (cx: number, cy: number, s: number) => `M${cx} ${cy + s * 0.9}C${cx - s * 1.6} ${cy - s * 0.1} ${cx - s * 0.7} ${cy - s * 1.3} ${cx} ${cy - s * 0.45}C${cx + s * 0.7} ${cy - s * 1.3} ${cx + s * 1.6} ${cy - s * 0.1} ${cx} ${cy + s * 0.9}z`;
/** Bông hoa 5 cánh (hoa mai, hoa nhí). */
function Blossom({ x, y, r, c, center }: { x: number; y: number; r: number; c: string; center: string }) {
  return <g transform={`translate(${x} ${y})`}>{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cy={-r * 0.9} rx={r * 0.6} ry={r} fill={c} transform={`rotate(${a})`} />)}<circle r={r * 0.45} fill={center} /></g>;
}
const LABCOAT = 'M82 186c0-10 10-16 24-18l14 30 14-30c14 2 24 8 24 18l10 64c0 8-6 12-14 12h-17l-17-62-17 62H86c-8 0-14-4-14-12z';
const SPLATS: [number, number, number, string][] = [[96, 214, 7, '#E86A4A'], [142, 206, 6, '#5E8AC9'], [108, 244, 8, '#F2C14B'], [146, 238, 6, '#9DB88A'], [124, 226, 5, '#C2A9D6']];
const CONFETTI: [number, number, number, string][] = [[94, 196, 20, '#F27B8E'], [146, 200, -30, '#9FC3DD'], [104, 214, 45, '#F2C14B'], [136, 220, 10, '#9DB88A'], [120, 198, -15, '#fff'], [96, 228, 60, '#C2A9D6'], [148, 214, 35, '#F27B8E']];
// màu tay áo theo trang phục (áo trắng thì tay áo trắng...)
const WHITE_SLEEVE = ['school', 'chef', 'labcoat', 'sailor', 'doctor', 'karate', 'painter', 'pirate'];
const SLEEVE: Record<string, string> = { robot: '#B8C0CA', explorer: '#D8C08E', scout: '#7E9A5C', suit: '#FBF6F2', skeleton: '#3B3432', gingerbread: '#C07A48', astronaut: '#F1EEEC', firefighter: '#C9473F', santa: '#D9473E', pilot: '#3E4F7A', knight: '#C9CED6', ninja: '#3D3A4B', witch: '#4A3A5E', vampire: '#3B3432', bee: '#3B3432', elf: '#4FA37A', tet: '#D9473E', lion: '#E9B949', pumpkin: '#EE8A3C', snowman: '#F7F5F2', redstar: '#D9473E' };
const SKIN_SLEEVE = ['swimsuit', 'mermaid', 'basketball'];
const HATS = ['capback', 'beanie', 'khanxep', 'nonla', 'cap', 'beret', 'witchhat', 'santahat', 'elfhat', 'wizardhat', 'piratehat', 'gradcap', 'pilotcap', 'firehelmet', 'chefhat', 'sunhat', 'khandong', 'lionhead', 'earmuffs'];

export const MASCOTS: Record<string, Look> = {
  mimi: { skin: '#F7D9C4', hair: 'bob', hairColor: '#F1E4D6', ears: 'cat', outfit: 'dress', outfitColor: '#B8C98A', acc: 'flower', scene: 'meadow', shoes: 'maryjane', hold: 'tulip' },
  bo: { gender: 'boy', skin: '#F4D3BC', hair: 'spiky', hairColor: '#7A6A60', ears: 'bear', outfit: 'overall', outfitColor: '#9FC3DD', acc: 'glasses', scene: 'meadow', shoes: 'sneakers', hold: 'pencil' },
  mochi: { skin: '#F8DCCB', hair: 'twin', hairColor: '#F3E6D8', ears: 'bunny', outfit: 'aodai', outfitColor: '#F0B48E', acc: 'none', scene: 'meadow', shoes: 'maryjane', hold: 'book' },
  foxy: { gender: 'boy', skin: '#F4D3BC', hair: 'spiky', hairColor: '#D9864F', ears: 'fox', outfit: 'hoodie', outfitColor: '#C2A9D6', acc: 'none', scene: 'meadow', shoes: 'sneakers', hold: 'none' },
  kiwi: { skin: '#F7D9C4', hair: 'bob', hairColor: '#5E4A3A', ears: 'frog', outfit: 'raincoat', outfitColor: '#B8C98A', acc: 'none', scene: 'meadow', shoes: 'rainboots', hold: 'none' },
};

// ---------- thú cưng (đứng cạnh chân nhân vật) ----------
/** Bậc tiến hoá theo điểm thân thiết: 0 = bé xíu, 1 = lớn, 2 = lấp lánh. */
export const petStage = (xp = 0) => (xp >= 120 ? 2 : xp >= 30 ? 1 : 0);
export const PET_STAGE_XP = [0, 30, 120];
type Critter = { fur: string; belly?: string; ears?: 'cat' | 'dog' | 'bunny' | 'round' | 'none'; earC?: string; tail?: 'cat' | 'fox' | 'puff' | 'none'; eye?: string };
function critter(c: Critter, extra?: ReactElement) {
  const d = shade(c.fur, -0.18);
  return (<g>
    {c.tail === 'cat' && <path d="M14 14c14-2 18-14 12-22" stroke={c.fur} strokeWidth="6" fill="none" strokeLinecap="round" />}
    {c.tail === 'fox' && <path d="M12 14c18 4 26-10 20-24-10 2-18 12-20 24z" fill={c.fur} />}
    {c.tail === 'fox' && <path d="M30 -8c-4 2-6 6-6 10 4 0 8-4 8-8z" fill="#FBF6F2" />}
    {c.tail === 'puff' && <circle cx="16" cy="14" r="6" fill={c.belly ?? '#FBF6F2'} />}
    <ellipse cx="0" cy="12" rx="17" ry="11" fill={c.fur} />
    {c.belly && <ellipse cx="0" cy="15" rx="9" ry="7" fill={c.belly} />}
    <ellipse cx="-9" cy="21" rx="5" ry="3" fill={d} /><ellipse cx="9" cy="21" rx="5" ry="3" fill={d} />
    {c.ears === 'cat' && <><path d="M-14 -14l2-14 10 8z" fill={c.fur} /><path d="M14 -14l-2-14-10 8z" fill={c.fur} /><path d="M-11 -16l1-7 5 4z" fill="#F4B7C0" /><path d="M11 -16l-1-7-5 4z" fill="#F4B7C0" /></>}
    {c.ears === 'bunny' && <><ellipse cx="-6" cy="-26" rx="4.5" ry="12" fill={c.fur} /><ellipse cx="6" cy="-26" rx="4.5" ry="12" fill={c.fur} /><ellipse cx="-6" cy="-25" rx="2" ry="8" fill="#F4B7C0" /><ellipse cx="6" cy="-25" rx="2" ry="8" fill="#F4B7C0" /></>}
    {c.ears === 'round' && <><circle cx="-12" cy="-17" r="5.5" fill={c.earC ?? c.fur} /><circle cx="12" cy="-17" r="5.5" fill={c.earC ?? c.fur} /></>}
    <circle cx="0" cy="-6" r="16" fill={c.fur} />
    {c.ears === 'dog' && <><ellipse cx="-15" cy="-4" rx="5" ry="10" fill={c.earC ?? d} transform="rotate(14 -15 -4)" /><ellipse cx="15" cy="-4" rx="5" ry="10" fill={c.earC ?? d} transform="rotate(-14 15 -4)" /></>}
    {extra}
    <circle cx="-6" cy="-6" r="3" fill={c.eye ?? '#3B3432'} /><circle cx="6" cy="-6" r="3" fill={c.eye ?? '#3B3432'} />
    <circle cx="-7" cy="-7.2" r="1.1" fill="#fff" /><circle cx="5" cy="-7.2" r="1.1" fill="#fff" />
    <ellipse cx="-10" cy="0" rx="3" ry="1.8" fill="#F29A92" opacity=".55" /><ellipse cx="10" cy="0" rx="3" ry="1.8" fill="#F29A92" opacity=".55" />
  </g>);
}
const nose = (c = '#8C4A44') => <path d="M-2 -1h4l-2 2.4z" fill={c} />;
function petArt(kind: string): ReactElement | null {
  switch (kind) {
    case 'chick': return (<g><path d="M-2 -26c2-6 6-6 6 0" stroke="#E9B949" strokeWidth="2.5" fill="none" />
      <ellipse cx="0" cy="6" rx="18" ry="17" fill="#F6D464" /><ellipse cx="-15" cy="8" rx="5" ry="8" fill="#EBC24B" transform="rotate(20 -15 8)" /><ellipse cx="15" cy="8" rx="5" ry="8" fill="#EBC24B" transform="rotate(-20 15 8)" />
      <path d="M-4 0h8l-4 5z" fill="#EE8A3C" /><circle cx="-6" cy="-5" r="2.8" fill="#3B3432" /><circle cx="6" cy="-5" r="2.8" fill="#3B3432" /><ellipse cx="-11" cy="2" rx="3" ry="1.8" fill="#F29A92" opacity=".6" /><ellipse cx="11" cy="2" rx="3" ry="1.8" fill="#F29A92" opacity=".6" />
      <path d="M-6 22v-3M6 22v-3" stroke="#EE8A3C" strokeWidth="3" strokeLinecap="round" /></g>);
    case 'cat': return critter({ fur: '#F0B48E', belly: '#FBEFE6', ears: 'cat', tail: 'cat' }, <>{nose()}<path d="M-12 -10l-6-1M12 -10l6-1" stroke="#C88A60" strokeWidth="1.5" /></>);
    case 'blackcat': return critter({ fur: '#4A4248', belly: '#5E5560', ears: 'cat', tail: 'cat', eye: '#E9B949' }, <>{nose('#F4B7C0')}<path d="M-10 -22l10-14 10 14z" fill="#5A4A70" /><rect x="-14" y="-23" width="28" height="4" rx="2" fill="#EE8A3C" /></>);
    case 'puppy': return critter({ fur: '#E9D2B4', belly: '#FBF6F2', ears: 'dog', earC: '#B07A52', tail: 'cat' }, <><ellipse cx="0" cy="0" rx="6" ry="4" fill="#FBF6F2" />{nose('#3B3432')}<circle cx="8" cy="-12" r="4" fill="#C88A60" opacity=".7" /></>);
    case 'bunny': return critter({ fur: '#FBF6F2', belly: '#F4E9E2', ears: 'bunny', tail: 'puff' }, nose('#E98AA0'));
    case 'hamster': return critter({ fur: '#E8A86A', belly: '#FBF1E6', ears: 'round', earC: '#F4B7C0', tail: 'none' }, <><ellipse cx="-9" cy="0" rx="6" ry="5" fill="#FBF1E6" /><ellipse cx="9" cy="0" rx="6" ry="5" fill="#FBF1E6" />{nose()}</>);
    case 'panda': return critter({ fur: '#FBF6F2', belly: '#FBF6F2', ears: 'round', earC: '#3B3432', tail: 'none' }, <><ellipse cx="-6" cy="-6" rx="5.5" ry="6.5" fill="#3B3432" transform="rotate(-20 -6 -6)" /><ellipse cx="6" cy="-6" rx="5.5" ry="6.5" fill="#3B3432" transform="rotate(20 6 -6)" />{nose('#3B3432')}</>);
    case 'penguin': return (<g><ellipse cx="0" cy="4" rx="17" ry="20" fill="#4A4F66" /><ellipse cx="0" cy="8" rx="11" ry="14" fill="#FBF6F2" /><ellipse cx="-16" cy="8" rx="4" ry="10" fill="#3B3F52" transform="rotate(16 -16 8)" /><ellipse cx="16" cy="8" rx="4" ry="10" fill="#3B3F52" transform="rotate(-16 16 8)" />
      <circle cx="-5" cy="-6" r="2.8" fill="#3B3432" /><circle cx="5" cy="-6" r="2.8" fill="#3B3432" /><circle cx="-6" cy="-7" r="1" fill="#fff" /><circle cx="4" cy="-7" r="1" fill="#fff" /><path d="M-4 -2h8l-4 4z" fill="#EE8A3C" /><ellipse cx="-6" cy="23" rx="5" ry="2.5" fill="#EE8A3C" /><ellipse cx="6" cy="23" rx="5" ry="2.5" fill="#EE8A3C" /></g>);
    case 'fox': return critter({ fur: '#E8884A', belly: '#FBF6F2', ears: 'cat', tail: 'fox' }, <><path d="M-10 0c4 6 16 6 20 0-4-4-16-4-20 0z" fill="#FBF6F2" />{nose('#3B3432')}</>);
    case 'turtle': return (<g><ellipse cx="-17" cy="8" rx="7" ry="6" fill="#9DB88A" /><ellipse cx="12" cy="20" rx="5" ry="3" fill="#8DA87A" /><ellipse cx="-10" cy="20" rx="5" ry="3" fill="#8DA87A" />
      <path d="M-14 14c0-20 8-28 20-28s20 8 20 28z" fill="#6E9A55" /><path d="M-4 -6l10 0 5 8-5 8h-10l-5-8z" fill="#8DB86B" /><path d="M-14 14h40" stroke="#5E8A48" strokeWidth="3" />
      <circle cx="-19" cy="5" r="2.2" fill="#3B3432" /><path d="M-21 11c2 1 4 1 5 0" stroke="#3B3432" strokeWidth="1.2" fill="none" /></g>);
    case 'dragon': return critter({ fur: '#8FC58A', belly: '#F6D98A', ears: 'none', tail: 'fox' }, <><path d="M-8 -20l-3-9 7 5zM8 -20l3-9-7 5z" fill="#F2C14B" /><path d="M-16 4c-10-6-14-16-10-22 4 6 8 10 12 12zM16 4c10-6 14-16 10-22-4 6-8 10-12 12z" fill="#B7DDB0" />{nose('#5E8A48')}</>);
    case 'unicorn': return critter({ fur: '#FBF6F2', belly: '#F4E9F2', ears: 'cat', tail: 'fox' }, <><path d="M-4 -20l4-16 4 16z" fill="#F2C14B" /><path d="M-14 -16c-4 6-4 14 0 20M-10 -20c-6 4-8 12-6 18" stroke="#C2A9D6" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M-12 -18c-2 4 0 8 2 10" stroke="#F4B7C0" strokeWidth="4" fill="none" strokeLinecap="round" />{nose('#E98AA0')}</>);
    case 'reindeer': return critter({ fur: '#B07A52', belly: '#E9D2B4', ears: 'dog', earC: '#9C6440', tail: 'puff' }, <><path d="M-8 -20l-6-12M-11 -26l-6 0M8 -20l6-12M11 -26l6 0" stroke="#8C5A3A" strokeWidth="3" strokeLinecap="round" /><circle cx="0" cy="0" r="3.5" fill="#E0403A" /></>);
    case 'kylan': return critter({ fur: '#D9473E', belly: '#F2C14B', ears: 'round', earC: '#F2C14B', tail: 'puff' }, <><path d="M-4 -20l4-10 4 10z" fill="#F2C14B" />{[-16, -10, 10, 16].map((x) => <circle key={x} cx={x} cy={-14 + Math.abs(x) / 3} r="4" fill="#F2C14B" />)}<path d="M-8 2c4 4 12 4 16 0" stroke="#FBF6F2" strokeWidth="2.5" fill="none" /></>);
    default: return null;
  }
}
export function PetSprite({ kind, xp = 0, size = 80, name }: { kind: string; xp?: number; size?: number; name?: string }) {
  const st = petStage(xp);
  return <svg viewBox="-34 -44 68 72" width={size} height={size * 72 / 68} className={`pet-sprite stage-${st}`} role="img" aria-label={name || kind}>{petBody(kind, st)}</svg>;
}
function petBody(kind: string, st: number) {
  const art = petArt(kind); if (!art) return null;
  return (<g className="pet-bob">
    <ellipse cx="0" cy="24" rx="16" ry="3.5" fill="#3A2A2A" opacity=".15" />
    <g transform={`scale(${[0.78, 0.94, 1.04][st]}) translate(0 ${[6, 1, -1][st]})`}>{art}</g>
    {st === 2 && <g className="pet-sparkle" fill="#F6D464"><path d={star(-22, -24, 4)} /><path d={star(22, -18, 3)} /><path d={star(-18, 6, 2.5)} /></g>}
    {st === 2 && <path d="M-7 -34l3 6 4-8 4 8 3-6 1 8h-16z" fill="#F2C14B" />}
  </g>);
}

interface Props { look: Look; mood?: Mood; size?: number; className?: string; flip?: boolean; title?: string; noPet?: boolean }

export function Chibi({ look, mood = 'idle', size = 240, className = '', flip = false, title, noPet = false }: Props) {
  const boy = look.gender === 'boy';
  const uid = useId().replace(/[:]/g, '');
  const id = (s: string) => `${uid}-${s}`;
  const hair = look.hairColor, hairD = shade(hair, -0.22), hairL = shade(hair, 0.35);
  const skin = look.skin, skinD = shade(skin, -0.12);
  const cloth = look.outfitColor, clothD = shade(cloth, -0.2), clothL = shade(cloth, 0.35);
  const eyesClosed = mood === 'sleep';
  // tay áo: áo trắng thì tay áo trắng
  const o = look.outfit;
  const sleeve = SKIN_SLEEVE.includes(o) ? `url(#${id('skin')})` : SLEEVE[o] ?? (WHITE_SLEEVE.includes(o) ? '#FBF6F2' : `url(#${id('cloth')})`);
  const hatCovers = HATS.includes(look.acc);
  const noLegs = o === 'mermaid';
  const legFill = o === 'swimsuit' || boy ? skin : '#ECE3DE';

  const mouth = (() => {
    switch (mood) {
      case 'cheer': case 'happy': return <path d="M110 151c4 7 16 7 20 0-4 2-16 2-20 0z" fill="#B5473F" />;
      case 'wow': return <ellipse cx="120" cy="153" rx="5" ry="6" fill="#B5473F" />;
      case 'sad': return <path d="M112 155c4-5 12-5 16 0" stroke="#8C4A44" strokeWidth="3" fill="none" strokeLinecap="round" />;
      case 'think': return <path d="M114 153h12" stroke="#8C4A44" strokeWidth="3" strokeLinecap="round" />;
      case 'sleep': return <ellipse cx="120" cy="152" rx="3.5" ry="3" fill="#B5473F" opacity=".8" />;
      default: return <path d="M114 150c3 4 9 4 12 0" stroke="#8C4A44" strokeWidth="3" fill="none" strokeLinecap="round" />;
    }
  })();

  // ---------- tai thú ----------
  const ears = (() => {
    if (hatCovers) return null;
    const inner = '#F2B7B0';
    switch (look.ears) {
      case 'cat': return (<g className="ch-ears">
        <path d="M58 70c-6-24 0-40 6-44 8 4 22 18 30 30z" fill={`url(#${id('hair')})`} /><path d="M66 60c-2-12 0-20 3-23 5 4 12 11 16 18z" fill={inner} />
        <path d="M182 70c6-24 0-40-6-44-8 4-22 18-30 30z" fill={`url(#${id('hair')})`} /><path d="M174 60c2-12 0-20-3-23-5 4-12 11-16 18z" fill={inner} /></g>);
      case 'bunny': return (<g className="ch-ears">
        <g className="ch-ear-l"><ellipse cx="86" cy="22" rx="15" ry="42" fill={`url(#${id('hair')})`} transform="rotate(-12 86 50)" /><ellipse cx="86" cy="24" rx="7" ry="30" fill={inner} transform="rotate(-12 86 50)" /></g>
        <g className="ch-ear-r"><ellipse cx="154" cy="22" rx="15" ry="42" fill={`url(#${id('hair')})`} transform="rotate(12 154 50)" /><ellipse cx="154" cy="24" rx="7" ry="30" fill={inner} transform="rotate(12 154 50)" /></g></g>);
      case 'bear': return (<g className="ch-ears">
        <circle cx="62" cy="52" r="20" fill={`url(#${id('hair')})`} /><circle cx="62" cy="52" r="10" fill={inner} />
        <circle cx="178" cy="52" r="20" fill={`url(#${id('hair')})`} /><circle cx="178" cy="52" r="10" fill={inner} /></g>);
      case 'fox': return (<g className="ch-ears">
        <path d="M54 76L60 18l40 34z" fill={`url(#${id('hair')})`} strokeLinejoin="round" stroke={hair} strokeWidth="6" /><path d="M62 58l2-26 18 16z" fill="#FFF4EC" />
        <path d="M186 76l-6-58-40 34z" fill={`url(#${id('hair')})`} strokeLinejoin="round" stroke={hair} strokeWidth="6" /><path d="M178 58l-2-26-18 16z" fill="#FFF4EC" /></g>);
      case 'panda': return (<g className="ch-ears">
        <circle cx="62" cy="52" r="21" fill="#3B3432" /><circle cx="62" cy="52" r="9" fill="#5E5254" />
        <circle cx="178" cy="52" r="21" fill="#3B3432" /><circle cx="178" cy="52" r="9" fill="#5E5254" /></g>);
      case 'mouse': return (<g className="ch-ears">
        <circle cx="54" cy="58" r="30" fill={`url(#${id('hair')})`} /><circle cx="54" cy="58" r="18" fill={inner} />
        <circle cx="186" cy="58" r="30" fill={`url(#${id('hair')})`} /><circle cx="186" cy="58" r="18" fill={inner} /></g>);
      case 'puppy': return (<g className="ch-ears">
        <g className="ch-ear-l"><ellipse cx="46" cy="104" rx="20" ry="44" fill={hairD} transform="rotate(14 46 70)" /></g>
        <g className="ch-ear-r"><ellipse cx="194" cy="104" rx="20" ry="44" fill={hairD} transform="rotate(-14 194 70)" /></g></g>);
      case 'deer': return (<g className="ch-ears">
        <g stroke="#A8784F" strokeWidth="7" strokeLinecap="round" fill="none"><path d="M78 52L66 14M70 30L52 22M68 20L74 4" /><path d="M162 52l12-38M170 30l18-8M172 20l-6-16" /></g>
        <ellipse cx="54" cy="66" rx="18" ry="10" fill={`url(#${id('hair')})`} transform="rotate(-30 54 66)" /><ellipse cx="186" cy="66" rx="18" ry="10" fill={`url(#${id('hair')})`} transform="rotate(30 186 66)" /></g>);
      case 'owl': return (<g className="ch-ears">
        <path d="M66 58c-4-14 2-26 8-30 2 10 10 18 18 22z" fill={`url(#${id('hair')})`} />
        <path d="M174 58c4-14-2-26-8-30-2 10-10 18-18 22z" fill={`url(#${id('hair')})`} /></g>);
      case 'frog': return (<g className="ch-ears">
        <circle cx="80" cy="44" r="22" fill="#9DB88A" /><circle cx="160" cy="44" r="22" fill="#9DB88A" />
        <circle cx="80" cy="42" r="12" fill="#fff" /><circle cx="160" cy="42" r="12" fill="#fff" />
        <circle cx="82" cy="44" r="6" fill="#3B3432" /><circle cx="158" cy="44" r="6" fill="#3B3432" />
        <path d="M58 70c10-22 114-22 124 0" fill="#9DB88A" /></g>);
      case 'tiger': return (<g className="ch-ears">
        <circle cx="62" cy="52" r="20" fill="#E8964A" /><circle cx="62" cy="52" r="10" fill="#FFF4EC" /><path d="M48 40l8 6M44 50l8 2" stroke="#4B3B3D" strokeWidth="3" strokeLinecap="round" />
        <circle cx="178" cy="52" r="20" fill="#E8964A" /><circle cx="178" cy="52" r="10" fill="#FFF4EC" /><path d="M192 40l-8 6M196 50l-8 2" stroke="#4B3B3D" strokeWidth="3" strokeLinecap="round" /></g>);
      case 'koala': return (<g className="ch-ears">
        <circle cx="50" cy="64" r="30" fill="#A8A2A6" /><circle cx="50" cy="64" r="17" fill="#F4F1EE" />
        <circle cx="190" cy="64" r="30" fill="#A8A2A6" /><circle cx="190" cy="64" r="17" fill="#F4F1EE" /></g>);
      case 'sheep': return (<g className="ch-ears">{[46, 194].map((x) => <g key={x}><circle cx={x} cy="90" r="20" fill="#E9D7C0" /><path d={`M${x} 90m-12 0a12 12 0 1 1 24 0a7 7 0 1 1 -14 0a3 3 0 1 1 6 0`} stroke="#B9A182" strokeWidth="3" fill="none" /></g>)}</g>);
      case 'elf': return (<g className="ch-ears">
        <path d="M56 104L14 82l40 40z" fill={`url(#${id('skin')})`} /><path d="M54 108L28 92l26 22z" fill="#F2B7B0" opacity=".6" />
        <path d="M184 104l42-22-40 40z" fill={`url(#${id('skin')})`} /><path d="M186 108l26-16-26 22z" fill="#F2B7B0" opacity=".6" /></g>);
      case 'unicorn': return (<g className="ch-ears">
        <path d="M58 70c-6-20 0-34 6-38 8 4 20 16 26 26z" fill={`url(#${id('hair')})`} /><path d="M182 70c6-20 0-34-6-38-8 4-20 16-26 26z" fill={`url(#${id('hair')})`} />
        <path d="M108 54L120 -2l12 56z" fill="#F8E08A" /><path d="M112 40l16-6M114 26l12-5M116 12l8-3" stroke="#E9B949" strokeWidth="2.5" /></g>);
      case 'dragon': return (<g className="ch-ears">
        <path d="M78 58C66 44 64 24 72 8c4 16 14 28 26 36z" fill="#F2C14B" /><path d="M162 58c12-14 14-34 6-50-4 16-14 28-26 36z" fill="#F2C14B" />
        <path d="M54 92l-22-12 24-4zM186 92l22-12-24-4z" fill="#9DB88A" /></g>);
      case 'devil': return (<g className="ch-ears">
        <path d="M80 54c-10-12-12-26-6-38 4 10 12 18 24 24z" fill="#D9473E" /><path d="M160 54c10-12 12-26 6-38-4 10-12 18-24 24z" fill="#D9473E" /></g>);
      default: return null;
    }
  })();

  // ---------- tóc sau ----------
  const backHair = (() => {
    switch (look.hair) {
      // ---- tóc ngắn (bé trai) ----
      case 'crew': case 'sidepart': case 'messy': case 'quiff': case 'fringe': case 'fauxhawk': return <path d="M52 110c-2-48 30-78 68-78s70 30 68 78l-4 12c-8 5-120 5-128 0z" fill={`url(#${id('hair')})`} />;
      case 'buzz': return <path d="M56 104c0-44 28-70 64-70s64 26 64 70l-4 8c-8 4-112 4-120 0z" fill={`url(#${id('hair')})`} />;
      case 'curlyshort': return (<g fill={`url(#${id('hair')})`}>{[[56, 104, 18], [62, 76, 20], [86, 54, 22], [120, 44, 24], [154, 54, 22], [178, 76, 20], [184, 104, 18]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} />)}</g>);
      case 'long': return <path d="M44 110c-4-56 34-86 76-86s80 30 76 86l4 104c0 14-18 18-30 10-6 8-26 10-50 10s-44-2-50-10c-12 8-30 4-30-10z" fill={`url(#${id('hair')})`} />;
      case 'twin': return (<g>
        <path d="M46 112c-4-54 32-84 74-84s78 30 74 84l-2 40c-10 10-134 10-144 0z" fill={`url(#${id('hair')})`} />
        <g className="ch-tail-l"><ellipse cx="38" cy="160" rx="22" ry="38" fill={`url(#${id('hair')})`} transform="rotate(12 38 130)" /></g>
        <g className="ch-tail-r"><ellipse cx="202" cy="160" rx="22" ry="38" fill={`url(#${id('hair')})`} transform="rotate(-12 202 130)" /></g>
        <circle cx="50" cy="128" r="7" fill="#E86A4A" /><circle cx="190" cy="128" r="7" fill="#E86A4A" /></g>);
      case 'ponytail': return (<g>
        <g className="ch-tail-r"><path d="M170 60c40-6 56 40 40 92-6 20-24 30-34 24 14-26 18-60-6-90z" fill={`url(#${id('hair')})`} /></g>
        <path d="M46 112c-4-54 32-84 74-84s78 30 74 84l-2 24c-10 8-134 8-144 0z" fill={`url(#${id('hair')})`} /><circle cx="176" cy="62" r="8" fill="#E86A4A" /></g>);
      case 'curly': return (<g fill={`url(#${id('hair')})`}>{[[52, 112, 30], [62, 70, 30], [92, 44, 30], [128, 36, 32], [164, 48, 30], [186, 78, 30], [190, 116, 30], [58, 150, 24], [184, 150, 24]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} />)}</g>);
      case 'braids': return (<g>
        <path d="M46 112c-4-54 32-84 74-84s78 30 74 84l-2 30c-10 8-134 8-144 0z" fill={`url(#${id('hair')})`} />
        {[0, 1].map((side) => <g key={side} className={side ? 'ch-tail-r' : 'ch-tail-l'}>{[0, 1, 2, 3].map((k) => <ellipse key={k} cx={side ? 184 : 56} cy={150 + k * 20} rx={14 - k} ry="12" fill={`url(#${id('hair')})`} />)}<circle cx={side ? 184 : 56} cy="228" r="7" fill="#F4B7C0" /></g>)}</g>);
      case 'pixie': return <path d="M52 112c-4-50 30-80 68-80s72 30 68 80l-6 12c-8 4-118 4-124 0z" fill={`url(#${id('hair')})`} />;
      case 'bun': return (<g><circle cx="120" cy="30" r="24" fill={`url(#${id('hair')})`} /><path d="M46 112c-4-54 32-84 74-84s78 30 74 84l-2 30c-10 8-134 8-144 0z" fill={`url(#${id('hair')})`} /></g>);
      case 'spiky': return <path d="M50 112c-4-50 30-80 70-80s74 30 70 80l-4 18c-10 6-122 6-132 0z" fill={`url(#${id('hair')})`} />;
      default: return <path d="M44 112c-4-56 34-86 76-86s80 30 76 86l-4 56c-2 10-14 12-22 6-8 6-34 8-50 8s-42-2-50-8c-8 6-20 4-22-6z" fill={`url(#${id('hair')})`} />;
    }
  })();

  // ---------- tóc mái ----------
  const bangs = (() => {
    switch (look.hair) {
      // ---- tóc ngắn (bé trai) ----
      case 'crew': return <path d="M50 100c0-42 30-68 70-68s70 26 70 68c-6-8-10-16-12-26-16 8-40 11-58 9s-38-4-52-12c-4 11-10 21-18 29z" fill={`url(#${id('hair')})`} />;
      case 'sidepart': return (<g><path d="M50 104c0-46 30-72 70-72s70 26 70 70c-6-6-10-14-12-24-22 4-52-2-72-18-14 16-32 30-56 44z" fill={`url(#${id('hair')})`} /><path d="M102 38c4 10 12 18 22 24" stroke={hairD} strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" /></g>);
      case 'messy': return <path d="M50 104c0-44 30-72 70-72s70 28 70 72l-14-20-4 14-12-22-8 16-12-20-8 16-12-20-8 18-12-18-4 16-10-12z" fill={`url(#${id('hair')})`} />;
      case 'quiff': return (<g><path d="M50 102c0-40 26-64 60-70 16-16 54-16 70 2-14-2-26 2-32 8 22 6 40 26 42 58-8-12-20-20-34-22-20-4-44-2-62 4-16 4-30 12-44 20z" fill={`url(#${id('hair')})`} /><path d="M118 30c14-8 34-8 46 2" stroke={hairL} strokeWidth="4" fill="none" strokeLinecap="round" opacity=".7" /></g>);
      case 'buzz': return (<g><path d="M54 96c4-40 32-62 66-62s62 22 66 62c-20-14-42-20-66-20s-46 6-66 20z" fill={`url(#${id('hair')})`} />{[[80, 60], [100, 50], [120, 47], [140, 50], [160, 60], [90, 70], [150, 70]].map(([x, y]) => <circle key={x * y} cx={x} cy={y} r="1.8" fill={hairD} opacity=".6" />)}</g>);
      case 'curlyshort': return <g fill={`url(#${id('hair')})`}>{[[70, 78, 15], [92, 66, 16], [120, 62, 17], [148, 66, 16], [170, 78, 15]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} />)}</g>;
      case 'fauxhawk': return (<g><path d="M52 98c4-40 32-64 68-64s64 24 68 64c-20-14-44-20-68-20s-48 6-68 20z" fill={`url(#${id('hair')})`} /><path d="M102 74c-2-20 6-40 18-58 12 18 20 38 18 58-12-4-24-4-36 0z" fill={`url(#${id('hair')})`} /><path d="M112 60c2-12 4-22 8-30" stroke={hairL} strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" /></g>);
      case 'fringe': return <path d="M48 108c0-48 30-76 72-76s72 26 72 70c-30-2-62-12-86-34-4 22-20 38-44 50-4-2-10-6-14-10z" fill={`url(#${id('hair')})`} />;
      case 'spiky': return <path d="M52 100c2-40 30-66 68-66s66 26 68 66c-10-6-16-18-18-26-6 10-18 16-28 16 2-6 2-12 0-16-8 10-22 14-34 12 2-4 2-10 0-14-8 10-20 18-34 18-4 4-12 8-22 10z" fill={`url(#${id('hair')})`} />;
      case 'curly': return <g fill={`url(#${id('hair')})`}>{[[66, 76, 18], [90, 60, 20], [120, 54, 21], [150, 60, 20], [174, 76, 18]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} />)}</g>;
      case 'pixie': return <path d="M50 104c0-44 30-72 70-72s70 26 70 70c-30 0-70-6-100-36-6 18-20 30-40 38z" fill={`url(#${id('hair')})`} />;
      case 'long': return <path d="M48 108c0-48 32-76 72-76s72 28 72 76c-6-4-12-14-14-24-14 12-36 16-58 14-20 0-40-4-56-14-2 10-8 20-16 24z" fill={`url(#${id('hair')})`} />;
      default: return <path d="M46 112c0-50 32-80 74-80s74 30 74 80c-8-2-14-12-16-22-6 8-16 12-24 10 0-6-2-10-4-14-8 8-20 12-30 10-10 2-22-2-30-10-2 4-4 8-4 14-8 2-18-2-24-10-2 10-8 20-16 22z" fill={`url(#${id('hair')})`} />;
    }
  })();

  // ---------- phần sau lưng của trang phục (cánh, áo choàng, đuôi) ----------
  const outfitBack = (() => {
    switch (o) {
      case 'shark': return <path d="M80 206c-16-4-26-16-28-32 14 2 24 10 30 20z" fill={clothD} />;
      case 'fairy': return (<g opacity=".85" fill={clothL} stroke="#fff" strokeWidth="3">
        <ellipse cx="64" cy="174" rx="36" ry="24" transform="rotate(-30 64 174)" /><ellipse cx="176" cy="174" rx="36" ry="24" transform="rotate(30 176 174)" />
        <ellipse cx="74" cy="218" rx="24" ry="15" transform="rotate(20 74 218)" /><ellipse cx="166" cy="218" rx="24" ry="15" transform="rotate(-20 166 218)" /></g>);
      case 'bee': return (<g fill="#fff" opacity=".8" stroke="#DDE6EE" strokeWidth="2">
        <ellipse cx="72" cy="176" rx="28" ry="18" transform="rotate(-35 72 176)" /><ellipse cx="168" cy="176" rx="28" ry="18" transform="rotate(35 168 176)" /></g>);
      case 'hero': return <path d="M86 176L60 272c40 12 80 12 120 0L154 176z" fill="#D9473E" />;
      case 'vampire': return (<g><path d="M84 178L56 272c42 12 86 12 128 0L156 178z" fill="#3B3432" /><path d="M90 186L68 264c34 8 70 8 104 0L150 186z" fill="#9C2F3A" /></g>);
      case 'dino': return (<g>
        <path d="M90 236c-30 4-50 18-66 40 22-2 48-10 70-24z" fill={clothD} />
        {[[46, 258], [62, 248], [78, 240]].map(([x, y]) => <path key={x} d={`M${x - 6} ${y + 4}l6-14 6 12z`} fill={clothL} />)}
        {[[78, 188], [72, 206], [70, 226]].map(([x, y]) => <path key={y} d={`M${x + 6} ${y - 8}l-14 6 14 8z`} fill={clothL} />)}</g>);
      default: return null;
    }
  })();

  // ---------- trang phục ----------
  const outfit = (() => {
    switch (o) {
      // ---- trang phục mới (dùng chung, gợi ý cho bé trai) ----
      case 'shirtshorts': case 'polo': { const polo = o === 'polo'; return (<g>
        <path d="M84 222h72l4 26c0 4-4 6-8 6h-22l-10-14-10 14H88c-4 0-8-2-8-6z" fill={polo ? '#F3E6D2' : '#5D6E9A'} />
        <path d="M82 186c0-12 14-18 38-18s38 6 38 18l2 40H80z" fill={`url(#${id('cloth')})`} />
        {polo ? <><path d="M104 170l16 10 16-10-2 10-14 8-14-8z" fill={clothL} /><rect x="117" y="180" width="6" height="22" rx="2" fill={clothL} /><path d="M80 214h80" stroke={clothD} strokeWidth="5" opacity=".5" /></>
          : <><path d="M104 170l16 12 16-12-4 12-12 6-12-6z" fill="#FBF6F2" />{[194, 206, 218].map((y) => <circle key={y} cx="120" cy={y} r="2.6" fill="#FBF6F2" />)}<rect x="136" y="190" width="12" height="10" rx="2" fill={clothD} opacity=".5" /></>}
      </g>); }
      case 'bomber': return (<g>
        <path d="M84 224h72l4 32c0 4-4 6-8 6h-24l-8-24-8 24H88c-4 0-8-2-8-6z" fill="#5E7FC9" />
        <path d="M80 186c0-12 14-18 40-18s40 6 40 18l2 42H78z" fill={`url(#${id('cloth')})`} />
        <path d="M108 170h24l-4 58h-16z" fill="#FBF6F2" /><path d="M110 178c4 6 16 6 20 0" stroke="#E2D8D2" strokeWidth="3" fill="none" />
        <path d="M110 176v52M130 176v52" stroke={clothD} strokeWidth="3" />
        <rect x="78" y="222" width="84" height="8" rx="4" fill={clothD} /><path d="M80 226h80" stroke={clothL} strokeWidth="2" strokeDasharray="4 4" />
        <path d="M100 170c4 4 10 6 20 6s16-2 20-6" stroke={clothD} strokeWidth="6" fill="none" strokeLinecap="round" />
      </g>);
      case 'suit': return (<g>
        <path d="M84 224h72l4 36c0 4-4 6-8 6h-24l-8-26-8 26H88c-4 0-8-2-8-6z" fill="#3B3432" />
        <path d="M82 186c0-12 14-18 38-18s38 6 38 18l2 42H80z" fill="#FBF6F2" />
        <path d="M82 188c0-10 10-16 22-18l16 26 16-26c12 2 22 8 22 18l2 40H80z" fill={`url(#${id('cloth')})`} />
        {[204, 216].map((y) => <circle key={y} cx="120" cy={y} r="3" fill={clothD} />)}
        <path d="M120 178l-12-7v14zM120 178l12-7v14z" fill="#D9473E" /><circle cx="120" cy="178" r="3.5" fill="#B5382F" />
      </g>);
      case 'aodainam': return (<g>
        <path d="M86 236h68l4 26c0 4-4 6-8 6h-24l-6-20-6 20H90c-4 0-8-2-8-6z" fill="#FBF6F2" />
        <path d="M82 186c0-12 14-18 38-18s38 6 38 18l6 66c0 4-4 6-8 6H84c-4 0-8-2-8-6z" fill={`url(#${id('cloth')})`} />
        <path d="M106 170h28v8c-6 5-22 5-28 0z" fill="#F2C14B" /><path d="M120 178c6 8 14 12 26 14" stroke="#F2C14B" strokeWidth="3" fill="none" />
        <g opacity=".5">{[[100, 210], [140, 222], [104, 238]].map(([x, y]) => <path key={x} d={star(x, y, 5)} fill="#F2C14B" />)}</g>
      </g>);
      case 'basketball': return (<g>
        <path d="M84 222h72l4 30c0 4-4 6-8 6h-22l-10-14-10 14H88c-4 0-8-2-8-6z" fill={`url(#${id('cloth')})`} />
        <path d="M90 176c4-6 8-8 12-8 4 10 32 10 36 0 4 0 8 2 12 8l2 52H88z" fill={`url(#${id('cloth')})`} />
        <path d="M102 168c4 10 32 10 36 0" stroke="#FBF6F2" strokeWidth="4" fill="none" /><path d="M90 178v48M150 178v48" stroke="#FBF6F2" strokeWidth="3" />
        <text x="120" y="214" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="24" fill="#FBF6F2">23</text>
        <path d="M84 244h72" stroke="#FBF6F2" strokeWidth="3" />
      </g>);
      case 'robot': return (<g>
        <rect x="88" y="226" width="64" height="34" rx="6" fill="#8E97A3" />
        <rect x="78" y="172" width="84" height="60" rx="12" fill="#B8C0CA" /><rect x="92" y="184" width="56" height="34" rx="6" fill="#4A5463" />
        {[[104, 196, '#F27B8E'], [120, 196, '#F2C14B'], [136, 196, '#9CD3BE']].map(([x, y, c]) => <circle key={String(x)} cx={x as number} cy={y as number} r="4.5" fill={c as string} />)}
        <path d="M100 208h40" stroke="#9FC3DD" strokeWidth="3" strokeDasharray="5 3" /><circle cx="86" cy="180" r="3" fill="#8E97A3" /><circle cx="154" cy="180" r="3" fill="#8E97A3" />
      </g>);
      case 'shark': return (<g>
        <path d="M84 224h72l3 36c0 4-4 6-8 6h-24l-7-26-7 26H89c-4 0-8-2-8-6z" fill={`url(#${id('cloth')})`} />
        <path d="M80 186c0-12 14-18 40-18s40 6 40 18l2 44H78z" fill={`url(#${id('cloth')})`} />
        <path d="M98 184c0-6 10-10 22-10s22 4 22 10l2 50c-6 6-42 6-48 0z" fill="#F4F1EE" />
        <path d="M102 174l5 7 5-7 5 7 5-7 5 7 5-7 5 7" stroke="#FBF6F2" strokeWidth="3" fill="none" />
        <path d="M80 200l8 4-8 4M80 212l8 4-8 4" stroke={clothD} strokeWidth="2.5" fill="none" />
      </g>);
      case 'explorer': return (<g>
        <path d="M84 222h72l4 26c0 4-4 6-8 6h-22l-10-14-10 14H88c-4 0-8-2-8-6z" fill="#9C6B4E" />
        <path d="M82 186c0-12 14-18 38-18s38 6 38 18l2 40H80z" fill="#D8C08E" />
        <path d="M104 170l16 12 16-12-4 12-12 6-12-6z" fill="#C2A774" /><path d="M120 184v40" stroke="#C2A774" strokeWidth="2" />
        <rect x="92" y="192" width="18" height="14" rx="3" fill="#C2A774" /><rect x="130" y="192" width="18" height="14" rx="3" fill="#C2A774" />
        <rect x="80" y="220" width="80" height="7" rx="3" fill="#6B4A3A" /><rect x="114" y="219" width="12" height="9" rx="2" fill="#F2C14B" />
      </g>);
      case 'scout': return (<g>
        <path d="M84 222h72l4 26c0 4-4 6-8 6h-22l-10-14-10 14H88c-4 0-8-2-8-6z" fill="#6B5A3E" />
        <path d="M82 186c0-12 14-18 38-18s38 6 38 18l2 40H80z" fill="#7E9A5C" />
        <path d="M100 170l20 30 20-30z" fill="#D9473E" /><circle cx="120" cy="190" r="4" fill="#F2C14B" />
        <circle cx="96" cy="208" r="6" fill="#F2C14B" /><path d={star(96, 208, 4)} fill="#D9473E" /><rect x="138" y="202" width="12" height="12" rx="3" fill="#9FC3DD" />
      </g>);
      // ---- đồ ngày lễ giới hạn ----
      case 'gam': return (<g>
        <path d="M86 226h68l4 34c0 4-4 6-8 6h-24l-6-24-6 24H90c-4 0-8-2-8-6z" fill="#3B3432" />
        <path d="M80 186c0-12 14-18 40-18s40 6 40 18l4 56c0 6-4 8-8 8H84c-4 0-8-2-8-8z" fill={`url(#${id('cloth')})`} />
        <g opacity=".6">{[[96, 198], [146, 202], [100, 232], [140, 234]].map(([x, y]) => <Blossom key={`${x}-${y}`} x={x} y={y} r={4.5} c="#F2C14B" center="#E3A43A" />)}</g>
        <path d="M78 240c14 6 70 6 84 0" stroke="#F2C14B" strokeWidth="4" fill="none" />
        <path d="M120 176v66" stroke="#F2C14B" strokeWidth="3" />
        {[188, 202, 216].map((y) => <circle key={y} cx="120" cy={y} r="3.2" fill="#F2C14B" />)}
        <path d="M104 168h32v8c-6 5-26 5-32 0z" fill="#F2C14B" />
      </g>);
      case 'skeleton': return (<g>
        <path d="M84 224h72l3 36c0 4-4 6-8 6h-24l-7-26-7 26H89c-4 0-8-2-8-6z" fill="#3B3432" />
        <path d="M80 186c0-12 14-18 40-18s40 6 40 18l2 44H78z" fill="#3B3432" />
        <rect x="116" y="176" width="8" height="50" rx="3" fill="#F4F1EE" />
        {[188, 199, 210].map((y) => <path key={y} d={`M117 ${y}c-9-3-17-1-23 4M123 ${y}c9-3 17-1 23 4`} stroke="#F4F1EE" strokeWidth="5" fill="none" strokeLinecap="round" />)}
        <path d="M104 226c4 9 28 9 32 0z" fill="#F4F1EE" />
        <rect x="103" y="240" width="7" height="20" rx="3" fill="#F4F1EE" /><rect x="130" y="240" width="7" height="20" rx="3" fill="#F4F1EE" />
      </g>);
      case 'gingerbread': return (<g>
        <path d="M80 186c0-12 14-18 40-18s40 6 40 18l4 64c0 8-6 12-14 12H90c-8 0-14-4-14-12z" fill="#C07A48" />
        <path d="M80 246l8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6" stroke="#FBF6F2" strokeWidth="4" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {[192, 210, 228].map((y, k) => <circle key={y} cx="120" cy={y} r="6" fill={['#D9473E', '#4F8F6A', '#D9473E'][k]} />)}
        <path d="M106 172l14 8 14-8v12l-14-6-14 6z" fill="#D9473E" />
      </g>);
      case 'tshirt': case 'redstar': { const red = o === 'redstar'; return (<g>
        <path d="M84 222h72l4 28c0 4-4 6-8 6h-22l-10-16-10 16H88c-4 0-8-2-8-6z" fill={red ? '#F3E6D2' : '#5D6E9A'} />
        <path d="M82 186c0-12 14-18 38-18s38 6 38 18l2 38H80z" fill={red ? '#D9473E' : `url(#${id('cloth')})`} />
        <path d="M104 170c4 8 28 8 32 0" stroke={red ? '#B5382F' : clothD} strokeWidth="4" fill="none" strokeLinecap="round" />
        {red ? <path d={star(120, 202, 15)} fill="#FFDD00" /> : <path d={heart(120, 202, 9)} fill="#FBF6F2" opacity=".85" />}
      </g>); }
      case 'pajamas': return (<g>
        <path d="M84 224h72l3 36c0 4-4 6-8 6h-24l-7-26-7 26H89c-4 0-8-2-8-6z" fill={`url(#${id('cloth')})`} />
        <path d="M80 186c0-12 14-18 40-18s40 6 40 18l2 44H78z" fill={`url(#${id('cloth')})`} />
        <path d="M104 171l16 13 16-13" fill="none" stroke={clothL} strokeWidth="6" strokeLinejoin="round" />
        <path d="M120 184v46" stroke={clothD} strokeWidth="2" opacity=".5" />
        {[196, 212].map((y) => <circle key={y} cx="124" cy={y} r="2.8" fill="#FBF6F2" />)}
        <g fill="#FBF6F2" opacity=".7">{[[92, 196], [148, 194], [100, 220], [142, 218], [96, 248], [146, 250], [134, 238], [106, 238]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" />)}</g>
      </g>);
      case 'swimsuit': return (<g>
        <path d="M96 176c0-5 10-8 24-8s24 3 24 8l4 52c-6 12-50 12-56 0z" fill={`url(#${id('cloth')})`} />
        <path d="M94 196h52M93 212h54" stroke="#FBF6F2" strokeWidth="5" opacity=".8" />
        <path d="M88 226c10 10 54 10 64 0l4 10c-12 12-60 12-72 0z" fill={clothL} />
        <path d="M104 176l-6-8M136 176l6-8" stroke={clothD} strokeWidth="5" strokeLinecap="round" />
      </g>);
      case 'mermaid': return (<g>
        <path d="M94 180c0-8 12-12 26-12s26 4 26 12l2 34H92z" fill={`url(#${id('skin')})`} />
        <path d="M88 212c-6 30 4 50 22 62h20c18-12 28-32 22-62z" fill={`url(#${id('cloth')})`} />
        <path d="M110 272c-12 4-24 12-30 20 14 2 28-2 40-10 12 8 26 12 40 10-6-8-18-16-30-20z" fill={clothD} />
        <g fill="none" stroke={clothL} strokeWidth="2.5" opacity=".8">{[[104, 226], [120, 226], [136, 226], [112, 240], [128, 240], [120, 254]].map(([x, y]) => <path key={`${x}-${y}`} d={`M${x - 7} ${y}c3 6 11 6 14 0`} />)}</g>
        <path d="M90 212c10 6 50 6 60 0" stroke={clothL} strokeWidth="5" fill="none" />
        <g fill="#F4B7C0"><path d="M106 186c-10 0-12 14-2 16 6 0 12-2 14-8-2-6-6-8-12-8z" /><path d="M134 186c10 0 12 14 2 16-6 0-12-2-14-8 2-6 6-8 12-8z" /></g>
      </g>);
      case 'soccer': return (<g>
        <path d="M84 222h72l3 30c0 4-4 6-8 6H89c-4 0-8-2-8-6z" fill="#FBF6F2" />
        <path d="M86 226v28M154 226v28" stroke={cloth} strokeWidth="4" />
        <path d="M82 186c0-12 14-18 38-18s38 6 38 18l2 40H80z" fill={`url(#${id('cloth')})`} />
        <path d="M106 170l14 14 14-14" fill="none" stroke="#FBF6F2" strokeWidth="5" strokeLinejoin="round" />
        <text x="120" y="218" textAnchor="middle" fontSize="24" fontWeight="800" fill="#FBF6F2" fontFamily="Baloo 2, sans-serif">10</text>
      </g>);
      case 'karate': return (<g>
        <path d="M82 226h76l3 34c0 4-4 6-8 6h-24l-9-28-9 28H87c-4 0-8-2-8-6z" fill="#FBF6F2" />
        <path d="M80 186c0-12 14-18 40-18s40 6 40 18l4 44H76z" fill="#FBF6F2" />
        <path d="M104 170l30 52M136 170l-18 32" stroke="#E2D8D2" strokeWidth="5" strokeLinecap="round" />
        <rect x="78" y="218" width="84" height="9" rx="3" fill={`url(#${id('cloth')})`} />
        <path d="M114 226l-6 18M126 226l6 18" stroke={cloth} strokeWidth="6" strokeLinecap="round" />
      </g>);
      case 'doctor': return (<g>
        <path d="M100 172h40l10 50H90z" fill="#9CD3BE" />
        <path d={LABCOAT} fill="#FBF6F2" />
        <path d="M104 176c-6 22 0 36 16 36s22-14 16-36" stroke="#5E6E86" strokeWidth="3" fill="none" /><circle cx="120" cy="214" r="5" fill="#8FA3B8" />
        <rect x="140" y="212" width="16" height="16" rx="3" fill="#E9E1DD" /><path d="M148 214v12M142 220h12" stroke="#E0403A" strokeWidth="3.5" />
      </g>);
      case 'firefighter': return (<g>
        <path d="M80 186c0-12 14-18 40-18s40 6 40 18l6 66c0 6-6 10-12 10H86c-6 0-12-4-12-10z" fill="#C9473F" />
        <path d="M120 172v90" stroke="#9C3530" strokeWidth="3" />
        <path d="M78 222h84M76 248h88" stroke="#F2D57E" strokeWidth="7" /><path d="M78 222h84M76 248h88" stroke="#EDEAE6" strokeWidth="2.5" />
        {[196, 236].map((y) => <g key={y} fill="#3B3432"><rect x="108" y={y - 3} width="8" height="6" rx="2" /><rect x="124" y={y - 3} width="8" height="6" rx="2" /></g>)}
        <path d="M100 172c6 8 34 8 40 0l2 8c-8 8-36 8-44 0z" fill="#9C3530" />
      </g>);
      case 'pilot': return (<g>
        <path d="M82 186c0-12 14-18 38-18s38 6 38 18l6 66c0 6-6 10-12 10H88c-6 0-12-4-12-10z" fill="#3E4F7A" />
        <path d="M104 170l16 26 16-26z" fill="#FBF6F2" />
        <path d="M117 180h6l3 20-6 7-6-7z" fill={`url(#${id('cloth')})`} />
        {[[108, 216], [132, 216], [108, 238], [132, 238]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" fill="#F2C14B" />)}
        <path d="M136 198c6-5 16-5 20 0-6 1-14 2-20 0z" fill="#F2C14B" />
      </g>);
      case 'painter': return (<g>
        <path d="M82 184c0-10 14-16 38-16s38 6 38 16l10 66c0 8-6 12-14 12H86c-8 0-14-4-14-12z" fill="#FBF6F2" />
        <path d="M100 174c6 10 34 10 40 0" stroke={cloth} strokeWidth="9" fill="none" strokeLinecap="round" /><path d="M120 182l-10 14h20z" fill={clothD} />
        {SPLATS.map(([x, y, r, c]) => <circle key={c} cx={x} cy={y} r={r} fill={c} opacity=".85" />)}
        <rect x="132" y="220" width="20" height="14" rx="3" fill="#E9E1DD" />
      </g>);
      case 'knight': return (<g>
        <path d="M82 226h76l6 32c0 4-4 6-8 6H84c-4 0-8-2-8-6z" fill={`url(#${id('cloth')})`} />
        <path d="M80 188c0-12 14-20 40-20s40 8 40 20l2 40H78z" fill="#C9CED6" />
        <path d="M120 172v54" stroke="#9AA2AE" strokeWidth="3" />
        <path d="M106 188h28v16c0 10-8 14-14 16-6-2-14-6-14-16z" fill={`url(#${id('cloth')})`} stroke="#F2C14B" strokeWidth="2.5" />
        <path d={star(120, 202, 6)} fill="#F2C14B" />
        <rect x="78" y="222" width="84" height="9" rx="3" fill="#8A5636" /><rect x="114" y="220" width="12" height="13" rx="2" fill="#F2C14B" />
        <ellipse cx="82" cy="186" rx="16" ry="11" fill="#DDE1E7" /><ellipse cx="158" cy="186" rx="16" ry="11" fill="#DDE1E7" />
      </g>);
      case 'wizard': return (<g>
        <path d="M88 180c0-8 12-12 32-12s32 4 32 12l18 76c2 8-6 12-14 12H84c-8 0-16-4-14-12z" fill={`url(#${id('cloth')})`} />
        <path d="M120 172v96" stroke="#F2C14B" strokeWidth="4" />
        <path d="M92 214c10 6 46 6 56 0" stroke="#F2C14B" strokeWidth="3" fill="none" />
        <path d={star(100, 236, 7)} fill="#F8CF1F" /><path d={star(146, 196, 6)} fill="#F8CF1F" /><path d={star(144, 250, 5)} fill="#FFF4C4" />
        <path d="M98 190a9 9 0 1 0 10 12a7 7 0 1 1 -10 -12z" fill="#FFF4C4" />
      </g>);
      case 'fairy': return (<g>
        {[-36, 36, -18, 18, 0].map((dx, k) => <path key={dx} d={`M${120 + dx} 204C${98 + dx} 226 ${110 + dx} 256 ${120 + dx} 264C${130 + dx} 256 ${142 + dx} 226 ${120 + dx} 204z`} fill={k % 2 ? `url(#${id('cloth')})` : clothL} />)}
        <path d="M96 178c0-6 10-10 24-10s24 4 24 10l2 30H94z" fill={`url(#${id('cloth')})`} />
        <path d="M94 206c10 6 42 6 52 0" stroke={clothL} strokeWidth="5" fill="none" />
        {[[104, 190], [136, 192], [120, 238]].map(([x, y]) => <path key={x} d={star(x, y, 4)} fill="#fff" />)}
      </g>);
      case 'hero': return (<g>
        <path d="M84 226h72l2 30c0 4-4 6-8 6H90c-4 0-8-2-8-6z" fill={clothD} />
        <path d="M80 188c0-12 14-20 40-20s40 8 40 20l2 40H78z" fill={`url(#${id('cloth')})`} />
        <circle cx="120" cy="202" r="14" fill="#F2C14B" /><path d={star(120, 202, 10)} fill="#D9473E" />
        <rect x="80" y="222" width="80" height="8" rx="3" fill="#F2C14B" />
        <circle cx="88" cy="178" r="5" fill="#F2C14B" /><circle cx="152" cy="178" r="5" fill="#F2C14B" />
      </g>);
      case 'vampire': return (<g>
        <path d="M86 226h68l2 32c0 4-4 6-8 6H92c-4 0-8-2-8-6z" fill="#3B3432" />
        <path d="M90 180c0-8 12-12 30-12s30 4 30 12l2 48H88z" fill="#FBF6F2" />
        <path d="M90 186h20l10 42H88zM150 186h-20l-10 42h32z" fill={`url(#${id('cloth')})`} />
        <path d="M110 178l10 6 10-6v10l-10-4-10 4z" fill="#3B3432" />
        <path d="M84 180L66 150l34 18zM156 180l18-30-34 18z" fill="#3B3432" /><path d="M84 177L72 158l22 12zM156 177l12-19-22 12z" fill="#9C2F3A" />
      </g>);
      case 'pirate': return (<g>
        <path d="M84 228h72l2 30c0 4-4 6-8 6H90c-4 0-8-2-8-6z" fill="#3B3432" />
        <path d="M82 186c0-12 14-18 38-18s38 6 38 18l2 42H80z" fill="#FBF6F2" />
        <path d="M106 172l14 18 14-18" fill="none" stroke="#E2D8D2" strokeWidth="3" />
        <path d="M82 186c0-10 10-16 22-18l4 60H80zM158 186c0-10-10-16-22-18l-4 60h28z" fill={`url(#${id('cloth')})`} />
        <rect x="80" y="218" width="80" height="12" rx="3" fill="#D9473E" /><path d="M136 228l8 18M140 228l-2 20" stroke="#D9473E" strokeWidth="5" strokeLinecap="round" />
        <rect x="112" y="219" width="14" height="10" rx="2" fill="#F2C14B" />
      </g>);
      case 'ninja': return (<g>
        <path d="M84 226h72l3 32c0 4-4 6-8 6H89c-4 0-8-2-8-6z" fill="#3D3A4B" />
        <path d="M80 188c0-12 14-20 40-20s40 8 40 20l2 40H78z" fill="#3D3A4B" />
        <path d="M104 170l30 46M136 170l-16 26" stroke="#55516A" strokeWidth="5" strokeLinecap="round" />
        <rect x="78" y="220" width="84" height="9" rx="3" fill={`url(#${id('cloth')})`} />
        <path d="M146 228l6 16M150 228l10 12" stroke={cloth} strokeWidth="5" strokeLinecap="round" />
        <path d={star(96, 202, 7, 2.6)} fill="#C9CED6" />
      </g>);
      case 'dino': return (<g>
        <path d="M78 188c0-14 16-20 42-20s42 6 42 20l4 62c0 8-8 12-14 12H88c-6 0-14-4-14-12z" fill={`url(#${id('cloth')})`} />
        <ellipse cx="120" cy="226" rx="24" ry="30" fill={clothL} />
        <path d="M100 210h40M98 226h44M100 242h40" stroke={cloth} strokeWidth="2" opacity=".5" />
        <circle cx="92" cy="198" r="4" fill={clothD} opacity=".6" /><circle cx="152" cy="240" r="5" fill={clothD} opacity=".6" />
      </g>);
      case 'bee': return (<g>
        <clipPath id={id('bee')}><path d="M80 196c0-18 16-28 40-28s40 10 40 28v34c0 18-18 30-40 30s-40-12-40-30z" /></clipPath>
        <path d="M80 196c0-18 16-28 40-28s40 10 40 28v34c0 18-18 30-40 30s-40-12-40-30z" fill="#F2C14B" />
        <g clipPath={`url(#${id('bee')})`} fill="#3B3432"><rect x="76" y="200" width="88" height="11" /><rect x="76" y="224" width="88" height="11" /><rect x="76" y="248" width="88" height="11" /></g>
        <path d="M114 258l6 12 6-12z" fill="#3B3432" />
      </g>);
      case 'sweater': return (<g>
        <path d="M90 242h60l2 18c0 4-4 6-8 6H96c-4 0-8-2-8-6z" fill="#5D6E9A" />
        <path d="M80 188c0-12 14-20 40-20s40 8 40 20l2 50c0 6-4 8-8 8H86c-4 0-8-2-8-8z" fill={`url(#${id('cloth')})`} />
        <rect x="79" y="200" width="82" height="18" fill="#FBF6F2" opacity=".92" />
        <g stroke={clothD} strokeWidth="2.5" strokeLinecap="round">{[96, 120, 144].map((x) => <path key={x} d={`M${x} 203v12M${x - 5} 206l10 6M${x - 5} 212l10-6`} />)}</g>
        <rect x="80" y="236" width="80" height="10" rx="4" fill={clothD} />
        <path d="M100 172c6 8 34 8 40 0l2 6c-8 10-36 10-44 0z" fill={clothD} />
      </g>);
      case 'snowman': return (<g>
        <ellipse cx="120" cy="224" rx="48" ry="42" fill="#F7F5F2" />
        <ellipse cx="134" cy="236" rx="32" ry="26" fill="#E3E9F0" opacity=".7" />
        {[204, 222, 240].map((y) => <circle key={y} cx="120" cy={y} r="4.5" fill="#3B3432" />)}
        <path d="M90 176c10 12 50 12 60 0l3 11c-14 13-52 13-66 0z" fill={`url(#${id('cloth')})`} />
        <path d="M134 186l8 32h-12l-4-28z" fill={clothD} />
      </g>);
      case 'gown': return (<g>
        <path d="M86 180c0-8 12-12 34-12s34 4 34 12l14 76c2 8-6 12-14 12H86c-8 0-16-4-14-12z" fill={`url(#${id('cloth')})`} />
        <path d="M106 172l-6 74h10l8-66zM134 172l6 74h-10l-8-66z" fill="#F2C14B" />
        <path d="M104 170l16 18 16-18" fill="#FBF6F2" />
      </g>);
      case 'tet': return (<g>
        <path d="M92 254h56l-4 14H96z" fill="#F2D57E" />
        <path d="M90 180c0-8 12-12 30-12s30 4 30 12l2 34 14 50H74l14-50z" fill="#D9473E" />
        <path d="M120 170c-6 0-10 2-12 6l12 14 12-14c-2-4-6-6-12-6z" fill="#F2C14B" />
        {[[102, 212, 6], [140, 230, 7], [110, 248, 5], [134, 204, 4], [92, 238, 4], [148, 254, 4]].map(([x, y, r]) => <Blossom key={`${x}-${y}`} x={x} y={y} r={r} c="#F8CF1F" center="#E9806A" />)}
        <path d="M76 262h88" stroke="#F2C14B" strokeWidth="3" />
      </g>);
      case 'heartdress': return (<g>
        <path d="M88 180c0-8 12-12 32-12s32 4 32 12l20 64c2 10-6 16-16 16H84c-10 0-18-6-16-16z" fill={`url(#${id('cloth')})`} />
        <path d="M70 248c14 12 86 12 100 0l2 6c0 8-6 12-14 12H82c-8 0-14-4-14-12z" fill="#FBF6F2" />
        <path d={heart(120, 198, 12)} fill="#FBF6F2" /><path d={heart(120, 198, 7)} fill="#E0605A" />
        {[[94, 230], [146, 226], [120, 238], [104, 214], [138, 212]].map(([x, y]) => <path key={x} d={heart(x, y, 4.5)} fill={clothL} />)}
      </g>);
      case 'flowerdress': return (<g>
        <path d="M90 200h60l26 48c4 10-4 16-14 16H78c-10 0-18-6-14-16z" fill={`url(#${id('cloth')})`} />
        <path d="M94 178c0-6 10-10 26-10s26 4 26 10l4 24H90z" fill={`url(#${id('cloth')})`} />
        <path d="M90 202c10 6 50 6 60 0" stroke="#9DB88A" strokeWidth="4" fill="none" />
        {([[92, 238, '#FBF6F2'], [120, 226, '#F8E08A'], [148, 240, '#FBF6F2'], [106, 252, '#F4B7C0'], [136, 254, '#F8E08A'], [108, 188, '#FBF6F2'], [134, 190, '#F4B7C0']] as [number, number, string][]).map(([x, y, c]) => <Blossom key={`${x}-${y}`} x={x} y={y} r={5} c={c} center="#F2C14B" />)}
        <path d="M68 254c20 8 84 8 104 0" stroke={clothL} strokeWidth="5" fill="none" />
      </g>);
      case 'party': return (<g>
        <path d="M84 222h72l3 30c0 4-4 6-8 6H89c-4 0-8-2-8-6z" fill="#5D6E9A" />
        <path d="M82 186c0-12 14-18 38-18s38 6 38 18l2 38H80z" fill={`url(#${id('cloth')})`} />
        {CONFETTI.map(([x, y, r, c]) => <rect key={`${x}-${y}`} x={x - 4} y={y - 2} width="8" height="4" rx="1" fill={c} transform={`rotate(${r} ${x} ${y})`} />)}
        <path d={star(140, 232, 4)} fill="#fff" /><path d={star(100, 240, 3)} fill="#fff" />
        <path d="M110 176l10 6 10-6v10l-10-4-10 4z" fill="#E0605A" />
      </g>);
      case 'lion': return (<g>
        <path d="M86 228h68l3 30c0 4-4 6-8 6H91c-4 0-8-2-8-6z" fill="#D9473E" />
        <path d="M80 186c0-12 14-18 40-18s40 6 40 18l4 52c0 6-6 10-12 10H88c-6 0-12-4-12-10z" fill="#E9B949" />
        <g fill="none" stroke="#D9473E" strokeWidth="2.5">{[196, 212, 228].map((y, r) => [92, 106, 120, 134, 148].map((x) => <path key={`${x}-${y}`} d={`M${x - 7 + (r % 2) * 7} ${y}c3 6 11 6 14 0`} />))}</g>
        {Array.from({ length: 13 }, (_, i) => <path key={i} d={`M${80 + i * 6.7} 244v14`} stroke={i % 2 ? '#FBF6F2' : '#D9473E'} strokeWidth="5" strokeLinecap="round" />)}
        <path d="M98 172c6 8 38 8 44 0l2 8c-8 8-40 8-48 0z" fill="#D9473E" />
      </g>);
      case 'witch': return (<g>
        <path d="M90 180C90 172 102 168 120 168S150 172 150 180L172 256L160 248L150 258L140 250L130 260L120 250L110 260L100 250L90 258L80 248L68 256Z" fill="#4A3A5E" />
        <path d="M100 172l20 14 20-14 4 10-24 12-24-12z" fill={`url(#${id('cloth')})`} />
        <rect x="86" y="212" width="68" height="8" rx="3" fill={`url(#${id('cloth')})`} /><rect x="114" y="210" width="12" height="12" rx="2" fill="none" stroke="#F2C14B" strokeWidth="2.5" />
        <path d={star(104, 236, 5)} fill="#F2C14B" /><path d={star(140, 230, 4)} fill="#F2C14B" />
      </g>);
      case 'pumpkin': return (<g>
        <ellipse cx="120" cy="222" rx="52" ry="44" fill="#EE8A3C" />
        <path d="M120 180v84M98 182c-12 24-12 56 0 80M142 182c12 24 12 56 0 80" stroke="#D2702A" strokeWidth="3" fill="none" />
        <path d="M100 206l8-10 8 10zM124 206l8-10 8 10z" fill="#5A3A2E" />
        <path d="M98 226l6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6c-4 16-44 16-48 0z" fill="#5A3A2E" />
        <path d="M98 176c6 8 38 8 44 0l-2-8c-10 4-30 4-40 0z" fill="#6E9A55" />
      </g>);
      case 'santa': return (<g>
        <path d="M80 186c0-12 14-18 40-18s40 6 40 18l8 62c0 8-6 12-14 12H86c-8 0-14-4-14-12z" fill="#D9473E" />
        <rect x="113" y="172" width="14" height="76" fill="#FBF6F2" />
        <path d="M72 244c16 8 80 8 96 0l2 8c0 8-6 12-14 12H84c-8 0-14-4-14-12z" fill="#FBF6F2" />
        <rect x="76" y="212" width="88" height="11" rx="3" fill="#3B3432" /><rect x="111" y="209" width="18" height="17" rx="3" fill="none" stroke="#F2C14B" strokeWidth="3.5" />
        <path d="M96 175c8 9 40 9 48 0" stroke="#FBF6F2" strokeWidth="10" strokeLinecap="round" fill="none" />
      </g>);
      case 'elf': return (<g>
        <path d="M84 182C84 172 98 168 120 168S156 172 156 182L166 244L154 236L144 246L132 238L120 248L108 238L96 246L86 236L74 244Z" fill="#4FA37A" />
        <path d="M96 172l8 14 8-10 8 12 8-12 8 10 8-14z" fill="#D9473E" />
        <rect x="80" y="210" width="80" height="9" rx="3" fill="#3B3432" /><rect x="113" y="208" width="14" height="13" rx="2" fill="#F2C14B" />
        {[104, 136].map((x) => <circle key={x} cx={x} cy="190" r="3.5" fill="#F2C14B" />)}
      </g>);
      case 'baba': return (<g>
        <path d="M84 226h72l6 38c0 4-4 6-8 6h-26l-8-30-8 30H86c-4 0-8-2-8-6z" fill="#3B3432" />
        <path d="M84 182c0-10 14-14 36-14s36 4 36 14l4 48H80z" fill={`url(#${id('cloth')})`} />
        <path d="M120 170v60" stroke={clothD} strokeWidth="2" />
        {[184, 198, 212].map((y) => <circle key={y} cx="124" cy={y} r="2.6" fill={clothL} />)}
        <rect x="88" y="210" width="18" height="12" rx="2" fill={clothD} opacity=".35" /><rect x="134" y="210" width="18" height="12" rx="2" fill={clothD} opacity=".35" />
        <path d="M108 170c4 6 20 6 24 0" stroke={clothD} strokeWidth="3" fill="none" />
      </g>);
      case 'overall': return (<g>
        <path d="M84 178c0-6 6-10 12-10h48c6 0 12 4 12 10v30H84z" fill="#FBF6F2" />
        <path d="M86 196h68l6 50c0 6-6 10-12 10H92c-6 0-12-4-12-10z" fill={`url(#${id('cloth')})`} />
        <rect x="100" y="186" width="40" height="30" rx="8" fill={`url(#${id('cloth')})`} />
        <path d="M100 188l-8-18M140 188l8-18" stroke={clothD} strokeWidth="7" strokeLinecap="round" />
        <circle cx="104" cy="194" r="3.5" fill="#F2C14B" /><circle cx="136" cy="194" r="3.5" fill="#F2C14B" />
        <rect x="108" y="212" width="24" height="16" rx="5" fill={clothL} opacity=".55" />
      </g>);
      case 'hoodie': return (<g>
        <path d="M76 190c0-14 14-22 44-22s44 8 44 22l4 56c0 8-8 12-14 12H86c-6 0-14-4-14-12z" fill={`url(#${id('cloth')})`} />
        <path d="M94 228h52v16c0 4-4 6-8 6h-36c-4 0-8-2-8-6z" fill={clothD} opacity=".45" />
        <path d="M110 176v18M130 176v18" stroke="#FBF6F2" strokeWidth="3" strokeLinecap="round" />
        <circle cx="110" cy="196" r="3" fill="#FBF6F2" /><circle cx="130" cy="196" r="3" fill="#FBF6F2" />
      </g>);
      case 'aodai': return (<g>
        <path d="M92 254h56l-4 14H96z" fill="#FBF6F2" />
        <path d="M90 180c0-8 12-12 30-12s30 4 30 12l2 34 14 50H74l14-50z" fill={`url(#${id('cloth')})`} />
        <path d="M120 170c-6 0-10 2-12 6l12 14 12-14c-2-4-6-6-12-6z" fill={clothD} />
        <path d="M120 190v70" stroke={clothD} strokeWidth="2" opacity=".4" />
        <circle cx="104" cy="214" r="5" fill={clothL} opacity=".7" /><circle cx="138" cy="236" r="6" fill={clothL} opacity=".7" /><circle cx="112" cy="246" r="4" fill={clothL} opacity=".7" />
      </g>);
      case 'raincoat': return (<g>
        <path d="M84 182c0-10 14-14 36-14s36 4 36 14l12 70c0 6-6 10-12 10H84c-6 0-12-4-12-10z" fill={`url(#${id('cloth')})`} />
        <path d="M120 172v86" stroke={clothD} strokeWidth="3" opacity=".5" />
        {[192, 212, 232].map((y) => <rect key={y} x="112" y={y} width="16" height="5" rx="2.5" fill="#FBF6F2" />)}
        <path d="M84 184c10 8 62 8 72 0" stroke={clothL} strokeWidth="6" fill="none" opacity=".6" />
      </g>);
      case 'school': return (<g>
        <path d="M84 182c0-8 14-14 36-14s36 6 36 14l2 32H82z" fill="#FBF6F2" />
        <path d="M82 212h76l8 40c0 6-6 10-12 10H86c-6 0-12-4-12-10z" fill="#3E4F7A" />
        <path d="M106 172l14 26 14-26c-4-2-24-2-28 0z" fill="#E0403A" /><path d="M112 192l-8 22M128 192l8 22" stroke="#E0403A" strokeWidth="7" strokeLinecap="round" />
        {[188, 200].map((y) => <circle key={y} cx="120" cy={y + 10} r="2.6" fill="#C9BBB5" />)}
      </g>);
      case 'sailor': return (<g>
        <path d="M86 182c0-8 12-14 34-14s34 6 34 14l2 34H84z" fill="#FBF6F2" />
        <path d="M90 176c10 10 50 10 60 0l6 18c-10 14-62 14-72 0z" fill={`url(#${id('cloth')})`} /><path d="M92 186c10 6 46 6 56 0" stroke="#fff" strokeWidth="3" fill="none" />
        <path d="M112 196l8 10 8-10-8-4z" fill="#E0403A" /><path d="M84 214h72l14 38c2 8-4 12-12 12H82c-8 0-14-4-12-12z" fill={`url(#${id('cloth')})`} />
        <path d="M78 246h84" stroke="#fff" strokeWidth="4" opacity=".7" />
      </g>);
      case 'princess': return (<g>
        <path d="M94 178c0-6 10-10 26-10s26 4 26 10l4 22H90z" fill={`url(#${id('cloth')})`} />
        <path d="M90 198h60l34 50c4 10-4 16-16 16H72c-12 0-20-6-16-16z" fill={`url(#${id('cloth')})`} />
        <path d="M66 236c18 10 90 10 108 0l8 14c2 8-6 14-16 14H74c-10 0-18-6-16-14z" fill={clothL} />
        <path d="M90 200c10 6 50 6 60 0" stroke="#F2C14B" strokeWidth="5" fill="none" />
        {[[96, 226], [140, 222], [120, 244], [80, 248], [158, 250]].map(([x, y], k) => <path key={k} d={`M${x} ${y - 5}l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z`} fill="#fff" />)}
      </g>);
      case 'tracksuit': return (<g>
        <path d="M80 188c0-12 14-20 40-20s40 8 40 20l2 40H78z" fill={`url(#${id('cloth')})`} />
        <path d="M120 170v58" stroke={clothD} strokeWidth="3" /><path d="M84 190v34M156 190v34" stroke="#fff" strokeWidth="5" opacity=".85" />
        <path d="M86 226h68l2 32c0 4-4 6-8 6H92c-4 0-8-2-8-6z" fill={clothD} /><path d="M100 228v32M140 228v32" stroke="#fff" strokeWidth="3" opacity=".7" />
      </g>);
      case 'chef': return (<g>
        <path d="M82 186c0-12 14-18 38-18s38 6 38 18l6 66c0 6-6 10-12 10H88c-6 0-12-4-12-10z" fill="#FBF6F2" />
        <path d="M104 172c6 10 26 10 32 0l4 8c-8 10-32 10-40 0z" fill={`url(#${id('cloth')})`} />
        {[196, 214, 232].map((y) => <g key={y} fill="#C9BBB5"><circle cx="108" cy={y} r="3" /><circle cx="132" cy={y} r="3" /></g>)}
      </g>);
      case 'astronaut': return (<g>
        <path d="M78 190c0-14 16-22 42-22s42 8 42 22l4 58c0 8-8 14-16 14H90c-8 0-16-6-16-14z" fill="#F1EEEC" />
        <rect x="100" y="196" width="40" height="26" rx="6" fill={`url(#${id('cloth')})`} /><circle cx="110" cy="209" r="4" fill="#F4CB0A" /><circle cx="122" cy="209" r="4" fill="#E86A4A" /><rect x="128" y="205" width="8" height="8" rx="2" fill="#fff" />
        <path d="M78 232h84" stroke={cloth} strokeWidth="6" /><path d="M88 186c-6 10-8 30-6 44M152 186c6 10 8 30 6 44" stroke="#D6CFCB" strokeWidth="3" fill="none" />
      </g>);
      case 'labcoat': return (<g>
        <path d="M100 172h40l10 50H90z" fill={`url(#${id('cloth')})`} />
        <path d="M82 186c0-10 10-16 24-18l14 30 14-30c14 2 24 8 24 18l10 64c0 8-6 12-14 12h-17l-17-62-17 62H86c-8 0-14-4-14-12z" fill="#FBF6F2" />
        <rect x="142" y="212" width="14" height="16" rx="3" fill="#E9E1DD" /><path d="M146 206v10M151 204v12" stroke="#5E8AC9" strokeWidth="3" strokeLinecap="round" />
      </g>);
      case 'tutu': return (<g>
        <path d="M94 178c0-6 10-10 26-10s26 4 26 10l2 32H92z" fill={`url(#${id('cloth')})`} />
        <path d="M70 214c10-10 90-10 100 0 10 6 6 18-10 22-20 6-60 6-80 0-16-4-20-16-10-22z" fill={clothL} opacity=".9" />
        <path d="M76 224c12-8 76-8 88 0 8 6 2 16-12 18-18 4-46 4-64 0-14-2-20-12-12-18z" fill="#fff" opacity=".75" />
      </g>);
      default: return (<g>
        <path d="M88 180c0-8 12-12 32-12s32 4 32 12l20 64c2 10-6 16-16 16H84c-10 0-18-6-16-16z" fill={`url(#${id('cloth')})`} />
        <path d="M74 244c8 10 84 10 92 0l4 6c2 8-4 12-12 12H82c-8 0-14-4-12-12z" fill="#FBF6F2" />
        {[80, 94, 108, 122, 136, 150].map((x) => <circle key={x} cx={x + 4} cy="258" r="6" fill="#FBF6F2" />)}
        <path d="M104 172l16 10 16-10" fill="#FBF6F2" />
        <path d="M100 172c4 8 12 12 20 12s16-4 20-12" fill="none" stroke="#8C4A44" strokeWidth="5" strokeLinecap="round" />
        <g fill="#D9473E"><path d="M114 204l-8-5v10zM126 204l8-5v10z" /><circle cx="120" cy="204" r="3" /><path d="M114 222l-8-5v10zM126 222l8-5v10z" /><circle cx="120" cy="222" r="3" /></g>
      </g>);
    }
  })();

  // ---------- phụ kiện ----------
  const acc = (() => {
    switch (look.acc) {
      // ---- phụ kiện mới (dùng chung, gợi ý cho bé trai) ----
      case 'capback': return <g><path d="M58 70c0-36 26-50 62-50s62 14 62 50z" fill="#E86A4A" /><path d="M66 66c-18-6-38-2-50 8 10 6 34 4 52 0z" fill="#C9473F" /><circle cx="120" cy="22" r="6" fill="#C9473F" /><rect x="132" y="54" width="22" height="10" rx="4" fill="#FBF6F2" opacity=".7" /></g>;
      case 'beanie': return <g><path d="M54 80c0-42 30-62 66-62s66 20 66 62z" fill="#5867B5" /><rect x="50" y="70" width="140" height="18" rx="9" fill="#7A88CE" />{[70, 90, 110, 130, 150, 170].map((x) => <path key={x} d={`M${x} 72v14`} stroke="#5867B5" strokeWidth="3" />)}<circle cx="120" cy="16" r="12" fill="#F2D57E" /></g>;
      case 'gamerset': return <g><path d="M48 118c-6-70 150-70 144 0" stroke="#3B3432" strokeWidth="10" fill="none" /><rect x="32" y="102" width="28" height="42" rx="12" fill="#3B3432" /><rect x="180" y="102" width="28" height="42" rx="12" fill="#3B3432" /><rect x="186" y="110" width="16" height="26" rx="7" fill="#9CD3BE" /><rect x="38" y="110" width="16" height="26" rx="7" fill="#9CD3BE" /><path d="M46 140c4 20 20 30 44 32" stroke="#3B3432" strokeWidth="4" fill="none" strokeLinecap="round" /><circle cx="92" cy="172" r="5" fill="#F27B8E" /></g>;
      case 'khanxep': return <g><path d="M52 86c0-34 30-52 68-52s68 18 68 52c-14 8-40 12-68 12s-54-4-68-12z" fill={`url(#${id('cloth')})`} />{[60, 70, 80].map((y, k) => <path key={y} d={`M${56 + k * 2} ${y + 4}c30 ${10 - k * 3} 98 ${10 - k * 3} 128 0`} stroke={clothD} strokeWidth="3" fill="none" />)}</g>;
      case 'bandana': return <g><path d="M54 88c22-30 110-30 132 0l-4 10c-26-22-98-22-124 0z" fill="#D9473E" /><path d="M182 88l18-4-6 14 10 8-18 0z" fill="#B5382F" />{[80, 110, 140, 165].map((x) => <circle key={x} cx={x} cy="80" r="2.2" fill="#FBF6F2" />)}</g>;
      case 'aviator': return <g><path d="M54 80c22-26 110-26 132 0" stroke="#9C6B4E" strokeWidth="9" fill="none" /><circle cx="98" cy="68" r="16" fill="#9FC3DD" stroke="#C9A34A" strokeWidth="5" /><circle cx="142" cy="68" r="16" fill="#9FC3DD" stroke="#C9A34A" strokeWidth="5" /><path d="M114 68h12" stroke="#C9A34A" strokeWidth="4" /><ellipse cx="93" cy="63" rx="4" ry="6" fill="#fff" opacity=".6" /><ellipse cx="137" cy="63" rx="4" ry="6" fill="#fff" opacity=".6" /></g>;
      // ---- đồ ngày lễ giới hạn ----
      case 'heartglasses': return <g><path d={heart(92, 124, 17)} fill="#F27B8E" opacity=".92" /><path d={heart(148, 124, 17)} fill="#F27B8E" opacity=".92" /><path d="M108 122c4-4 20-4 24 0" stroke="#D9566E" strokeWidth="4" fill="none" /><ellipse cx="84" cy="120" rx="4" ry="6" fill="#fff" opacity=".5" /><ellipse cx="140" cy="120" rx="4" ry="6" fill="#fff" opacity=".5" /></g>;
      case 'pearlband': return <g><path d="M60 82c22-38 98-38 120 0" stroke="#E9E3EE" strokeWidth="6" fill="none" strokeLinecap="round" />{[200, 218, 236, 254, 270, 286, 304, 322, 340].map((a) => { const r = (a * Math.PI) / 180; return <circle key={a} cx={120 + 60 * Math.cos(r)} cy={84 + 30 * Math.sin(r)} r="5.5" fill="#FBF6F2" stroke="#D8CFE0" strokeWidth="1.5" />; })}</g>;
      case 'papercrown': return <g transform="translate(120 40)"><path d="M-34 14l-4-28 14 12 10-20 14 18 14-18 10 20 14-12-4 28z" fill="#F2D57E" /><path d="M-34 12h68" stroke="#E9B949" strokeWidth="5" />{[[-24, 2, '#F27B8E'], [0, -6, '#9FC3DD'], [24, 2, '#9CD3BE']].map(([x, y, c]) => <circle key={String(x)} cx={x as number} cy={y as number} r="4" fill={c as string} />)}</g>;
      case 'snorkel': return <g><path d="M56 118c-4-2-8 2-8 8M184 118c4-2 8 2 8 8" stroke="#3E9AA0" strokeWidth="5" fill="none" /><rect x="66" y="104" width="108" height="44" rx="20" fill="#C9EDF0" opacity=".5" stroke="#3E9AA0" strokeWidth="5" /><path d="M78 112l10 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" /><path d="M186 150V72c0-8 6-12 12-12" stroke="#F2C14B" strokeWidth="8" fill="none" strokeLinecap="round" /></g>;
      case 'flagband': return <g><path d="M56 88c22-32 106-32 128 0" stroke="#D9473E" strokeWidth="11" fill="none" strokeLinecap="round" /><path d={star(120, 65, 9)} fill="#FFDD00" /></g>;
      case 'bunnymask': return <g transform="translate(166 54) rotate(22)"><ellipse cx="-10" cy="-30" rx="7" ry="20" fill="#FBF6F2" /><ellipse cx="10" cy="-30" rx="7" ry="20" fill="#FBF6F2" /><ellipse cx="-10" cy="-30" rx="3" ry="13" fill="#F4B7C0" /><ellipse cx="10" cy="-30" rx="3" ry="13" fill="#F4B7C0" /><ellipse rx="24" ry="20" fill="#FBF6F2" stroke="#E2D8D2" strokeWidth="2" /><circle cx="-8" cy="-3" r="3" fill="#D9473E" /><circle cx="8" cy="-3" r="3" fill="#D9473E" /><ellipse cx="-14" cy="6" rx="5" ry="3" fill="#F4B7C0" /><ellipse cx="14" cy="6" rx="5" ry="3" fill="#F4B7C0" /><path d="M-4 6c2 3 6 3 8 0" stroke="#B5473F" strokeWidth="2" fill="none" /></g>;
      case 'batclip': return <g transform="translate(164 62) rotate(14) scale(1.6)"><path d="M0 2c-6-8-14-10-22-8 4 4 4 9 2 13 6-2 11 0 13 4 2-4 4-6 7-9 3 3 5 5 7 9 2-4 7-6 13-4-2-4-2-9 2-13-8-2-16 0-22 8z" fill="#4E4566" /><circle cx="-3" cy="4" r="1.8" fill="#F2C14B" /><circle cx="3" cy="4" r="1.8" fill="#F2C14B" /></g>;
      case 'bow': return <g transform="translate(162 46) rotate(18)"><path d="M0 0l-20-12v24zM0 0l20-12v24z" fill="#E0605A" /><circle r="6" fill="#C9473F" /></g>;
      case 'flower': return <g transform="translate(166 70)">{[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-9" rx="6" ry="9" fill="#F4B7C0" transform={`rotate(${r})`} />)}<circle r="5" fill="#F8CF1F" /></g>;
      case 'glasses': return <g fill="none" stroke="#5E4A4C" strokeWidth="3.5"><circle cx="92" cy="126" r="20" /><circle cx="148" cy="126" r="20" /><path d="M112 124c4-4 12-4 16 0" /></g>;
      case 'nonla': return <g><path d="M30 64L120 -6l90 70c-40 12-140 12-180 0z" fill="#F2DFB0" /><path d="M30 64c40 12 140 12 180 0" stroke="#D9BE7F" strokeWidth="4" fill="none" /><path d="M60 40l60-44M90 50l30-52M150 50l-30-52M180 40l-60-44" stroke="#E2CB92" strokeWidth="2" /></g>;
      case 'crown': return <g transform="translate(120 34)"><path d="M-30 12l-6-30 18 12 18-24 18 24 18-12-6 30z" fill="#F8CF1F" /><rect x="-30" y="8" width="60" height="9" rx="3" fill="#F2B21B" /><circle cy="-2" r="4.5" fill="#E86A4A" /></g>;
      case 'headband': return <g><path d="M54 84c14-40 118-40 132 0" stroke="#F27B8E" strokeWidth="9" fill="none" strokeLinecap="round" /><g transform="translate(150 44) rotate(25)"><ellipse cx="-9" rx="10" ry="7" fill="#F27B8E" /><ellipse cx="9" rx="10" ry="7" fill="#F27B8E" /><circle r="5" fill="#E0605A" /></g></g>;
      case 'beret': return <g transform="rotate(-12 120 40)"><ellipse cx="120" cy="40" rx="62" ry="22" fill="#D9473E" /><ellipse cx="120" cy="36" rx="52" ry="14" fill="#E86A4A" /><rect x="116" y="12" width="8" height="12" rx="3" fill="#B5473F" /></g>;
      case 'cap': return <g><path d="M58 70c0-36 26-50 62-50s62 14 62 50z" fill="#7FA6C9" /><path d="M58 68c40-8 98-4 144 10-4 6-50 0-144 0z" fill="#5E8AC9" /><circle cx="120" cy="22" r="6" fill="#5E8AC9" /><path d="M120 22v48" stroke="#A9C8DE" strokeWidth="3" /></g>;
      case 'wreath': return <g>{[[64, 74], [80, 56], [102, 44], [126, 40], [150, 46], [170, 58], [182, 76]].map(([x, y], k) => <g key={k} transform={`translate(${x} ${y})`}><ellipse cx="-6" cy="4" rx="7" ry="4" fill="#9DB88A" />{[0, 90, 180, 270].map((r) => <ellipse key={r} cy="-5" rx="4" ry="6" fill={['#F4B7C0', '#F8E08A', '#FFFFFF', '#C9A8D8'][k % 4]} transform={`rotate(${r})`} />)}<circle r="3" fill="#F2C14B" /></g>)}</g>;
      case 'headphones': return <g><path d="M48 118c-6-70 150-70 144 0" stroke="#7B6668" strokeWidth="10" fill="none" /><rect x="34" y="104" width="26" height="40" rx="12" fill="#C2A9D6" /><rect x="180" y="104" width="26" height="40" rx="12" fill="#C2A9D6" /></g>;
      case 'partyhat': return <g transform="translate(-6 18) rotate(16 150 30)"><path d="M150 -24l26 64h-52z" fill="#9FC3DD" /><path d="M144 -9l14 6M134 14l28 10M128 30l32 8" stroke="#F4CB0A" strokeWidth="5" /><circle cx="150" cy="-26" r="8" fill="#F27B8E" /></g>;
      case 'tiara': return <g transform="translate(120 46)"><path d="M-36 12l6-18 11 10 19-20 19 20 11-10 6 18z" fill="#E6E3F0" stroke="#C9C2DC" strokeWidth="2" strokeLinejoin="round" /><circle cy="-10" r="5" fill="#F27B8E" /><circle cx="-24" cy="2" r="3" fill="#9FC3DD" /><circle cx="24" cy="2" r="3" fill="#9FC3DD" /></g>;
      case 'heartclip': return <path d={heart(164, 64, 10)} fill="#F27B8E" stroke="#E0605A" strokeWidth="2" />;
      case 'maiclip': return <Blossom x={164} y={66} r={8} c="#F8CF1F" center="#E9806A" />;
      case 'snowclip': return <g transform="translate(164 66)" stroke="#9FC3DD" strokeWidth="3.5" strokeLinecap="round"><path d="M0 -11v22M-9.5 -5.5l19 11M-9.5 5.5l19 -11" /><circle r="3" fill="#fff" stroke="none" /></g>;
      case 'sunglasses': return <g><path d="M68 116h46c0 18-8 26-23 26s-23-8-23-26zM126 116h46c0 18-8 26-23 26s-23-8-23-26z" fill="#3B3432" /><path d="M114 120h12" stroke="#3B3432" strokeWidth="4" /><path d="M76 122h10M134 122h10" stroke="#fff" strokeWidth="3" opacity=".5" strokeLinecap="round" /></g>;
      case 'sunhat': return <g><ellipse cx="120" cy="64" rx="98" ry="20" fill="#F2DFB0" /><path d="M70 62c0-30 22-46 50-46s50 16 50 46z" fill="#EBD39A" /><path d="M70 56c30 8 70 8 100 0v10c-30 8-70 8-100 0z" fill="#F27B8E" /><Blossom x={160} y={58} r={7} c="#FBF6F2" center="#F2C14B" /></g>;
      case 'gradcap': return <g><path d="M78 56v18c22 10 62 10 84 0V56l-42 14z" fill="#4A4248" /><path d="M36 48l84-28 84 28-84 28z" fill="#3B3432" /><path d="M120 48l44 12v26" stroke="#F2C14B" strokeWidth="3" fill="none" /><circle cx="164" cy="88" r="5" fill="#F2C14B" /></g>;
      case 'chefhat': return <g><rect x="78" y="40" width="84" height="28" rx="8" fill="#FBF6F2" stroke="#E6DED8" strokeWidth="2" /><circle cx="94" cy="32" r="22" fill="#FBF6F2" /><circle cx="146" cy="32" r="22" fill="#FBF6F2" /><circle cx="120" cy="22" r="26" fill="#FBF6F2" /><path d="M96 48v16M120 48v16M144 48v16" stroke="#E6DED8" strokeWidth="2" /></g>;
      case 'firehelmet': return <g><path d="M56 72c0-34 28-54 64-54s64 20 64 54z" fill="#D9473E" /><path d="M36 72c24 10 144 10 168 0l-4 10c-30 8-130 8-160 0z" fill="#B5382F" /><path d="M120 18v54" stroke="#B5382F" strokeWidth="5" /><path d="M104 32h32v24l-16 9-16-9z" fill="#F2C14B" /><path d={star(120, 46, 7)} fill="#D9473E" /></g>;
      case 'pilotcap': return <g><path d="M60 64c0-28 26-42 60-42s60 14 60 42z" fill="#3E4F7A" /><rect x="56" y="58" width="128" height="10" rx="5" fill="#2E3B5E" /><path d="M72 68c20 12 76 12 96 0l-4 9c-20 6-68 6-88 0z" fill="#2B2B33" /><path d="M104 42c6-4 12-4 16 0 4-4 10-4 16 0-6 4-26 4-32 0z" fill="#F2C14B" /><circle cx="120" cy="42" r="4" fill="#F2C14B" /></g>;
      case 'wizardhat': return <g><path d="M62 64L114 -2c4-4 8-2 10 2l56 64z" fill="#5E6EB0" /><ellipse cx="120" cy="64" rx="74" ry="13" fill="#4A5896" /><path d={star(106, 32, 6)} fill="#F8CF1F" /><path d={star(134, 48, 5)} fill="#F8CF1F" /><path d="M118 14a6 6 0 1 0 7 8a4.5 4.5 0 1 1 -7 -8z" fill="#FFF4C4" /></g>;
      case 'halo': return <ellipse cx="120" cy="22" rx="42" ry="10" fill="none" stroke="#F8CF1F" strokeWidth="6" opacity=".95" />;
      case 'piratehat': return <g><path d="M40 66c18-34 50-46 80-46s62 12 80 46c-20-8-38-6-48 2-10-10-54-10-64 0-10-8-28-10-48-2z" fill="#3B3432" /><path d="M40 66c20-8 38-6 48 2 10-10 54-10 64 0 10-8 28-10 48-2" stroke="#F2C14B" strokeWidth="3" fill="none" /><circle cx="120" cy="40" r="9" fill="#FBF6F2" /><circle cx="116" cy="39" r="2" fill="#3B3432" /><circle cx="124" cy="39" r="2" fill="#3B3432" /><path d="M108 56l24-6M108 50l24 6" stroke="#FBF6F2" strokeWidth="3" strokeLinecap="round" /></g>;
      case 'mask': return <path fillRule="evenodd" d="M60 120c8-16 40-20 60-8 20-12 52-8 60 8-2 18-18 28-36 24-10-2-16-8-24-8s-14 6-24 8c-18 4-34-6-36-24zM78 127a14 17 0 1 0 28 0a14 17 0 1 0 -28 0zM134 127a14 17 0 1 0 28 0a14 17 0 1 0 -28 0z" fill="#D9473E" />;
      case 'ninjaband': return <g><path d="M52 86c22-14 114-14 136 0l-2 12c-22-12-110-12-132 0z" fill="#D9473E" /><path d="M184 90l26 6-22 8M184 94l18 18" stroke="#D9473E" strokeWidth="6" strokeLinecap="round" fill="none" /><rect x="110" y="76" width="20" height="12" rx="2" fill="#C9CED6" /></g>;
      case 'antenna': return <g><path d="M100 54c-6-20-14-30-24-36M140 54c6-20 14-30 24-36" stroke="#3B3432" strokeWidth="4" fill="none" strokeLinecap="round" /><circle cx="76" cy="18" r="8" fill="#3B3432" /><circle cx="164" cy="18" r="8" fill="#3B3432" /></g>;
      case 'earmuffs': return <g><path d="M52 104c-2-74 138-74 136 0" stroke="#D9473E" strokeWidth="8" fill="none" /><circle cx="52" cy="114" r="20" fill="#FBF6F2" /><circle cx="188" cy="114" r="20" fill="#FBF6F2" /><circle cx="52" cy="114" r="11" fill="#F4B7C0" /><circle cx="188" cy="114" r="11" fill="#F4B7C0" /></g>;
      case 'khandong': return <g><path d="M52 80c0-34 30-52 68-52s68 18 68 52c-22-10-114-10-136 0z" fill="#C9473F" /><path d="M58 66c40-14 84-14 124 0M62 54c38-14 78-14 116 0M72 42c34-12 64-12 96 0" stroke="#F2C14B" strokeWidth="3" fill="none" /></g>;
      case 'lionhead': return <g transform="translate(120 36)"><path d="M-62 26c0-40 26-60 62-60s62 20 62 60c-18-8-106-8-124 0z" fill="#E9B949" /><path d="M-62 26c18-8 106-8 124 0" stroke="#D9473E" strokeWidth="7" fill="none" /><circle cx="-24" cy="-6" r="11" fill="#fff" /><circle cx="24" cy="-6" r="11" fill="#fff" /><circle cx="-22" cy="-5" r="5.5" fill="#3B3432" /><circle cx="26" cy="-5" r="5.5" fill="#3B3432" /><path d="M-32 -20c6-6 14-6 20 0M12 -20c6-6 14-6 20 0" stroke="#3B3432" strokeWidth="3" fill="none" /><path d="M-8 -34l8-14 8 14z" fill="#D9473E" /><ellipse cy="10" rx="10" ry="6" fill="#D9473E" /><g fill="#FBF6F2">{[-54, -40, 40, 54].map((x) => <circle key={x} cx={x} cy="16" r="6" />)}</g></g>;
      case 'witchhat': return <g transform="rotate(-8 120 50)"><ellipse cx="120" cy="58" rx="80" ry="14" fill="#4A3A5E" /><path d="M84 56C92 28 106 8 138 0C128 20 140 40 154 56z" fill="#5A4A70" /><path d="M86 48c18 6 50 6 66 0l2 9c-20 6-50 6-70 0z" fill="#EE8A3C" /><rect x="112" y="47" width="12" height="11" rx="2" fill="none" stroke="#F2C14B" strokeWidth="2.5" /></g>;
      case 'santahat': return <g><path d="M58 70C62 32 90 16 122 16s56 20 64 44l12 28-24-12C140 66 92 66 58 70z" fill="#D9473E" /><rect x="50" y="60" width="140" height="18" rx="9" fill="#FBF6F2" /><circle cx="198" cy="90" r="11" fill="#FBF6F2" /></g>;
      case 'elfhat': return <g><path d="M60 70C70 32 96 10 150 6c-16 20-20 40-12 64z" fill="#4FA37A" /><path d="M56 64c30 10 100 10 130 0l2 14c-30 10-104 10-134 0z" fill="#D9473E" /><circle cx="150" cy="8" r="7" fill="#F2C14B" /></g>;
      case 'starclip': return <g transform="translate(164 64) rotate(12)"><path d="M0 -16l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#F8CF1F" stroke="#E9A912" strokeWidth="2" strokeLinejoin="round" /></g>;
      default: return null;
    }
  })();

  // ---------- giày ----------
  const shoes = (() => {
    const pair = (f: (x: number) => ReactElement) => <>{f(106)}{f(134)}</>;
    switch (look.shoes) {
      // ---- giày mới ----
      case 'hightops': return pair((x) => <g key={x}><rect x={x - 11} y="260" width="22" height="20" rx="7" fill="#D9473E" /><ellipse cx={x} cy="281" rx="15" ry="8" fill="#F1ECE8" /><circle cx={x} cy="266" r="5" fill="#FBF6F2" /><path d={`M${x - 6} 272h12`} stroke="#FBF6F2" strokeWidth="2" /><rect x={x - 15} y="284" width="30" height="5" rx="2.5" fill="#B9A6A5" /></g>);
      case 'loafers': return pair((x) => <g key={x}><ellipse cx={x} cy="281" rx="15" ry="8" fill="#6B4A3A" /><path d={`M${x - 8} 276h14`} stroke="#4A3328" strokeWidth="3" strokeLinecap="round" /><ellipse cx={x - 5} cy="277" rx="5" ry="2.5" fill="#fff" opacity=".25" /></g>);
      case 'cleats': return pair((x) => <g key={x}><ellipse cx={x} cy="280" rx="15" ry="8.5" fill="#3B3432" /><path d={`M${x - 10} 276c6-4 14-4 20 0`} stroke="#F2C14B" strokeWidth="3" fill="none" />{[-9, -3, 3, 9].map((d) => <rect key={d} x={x + d - 1.5} y="286" width="3" height="4" rx="1" fill="#9AA2AE" />)}</g>);
      case 'sneakers': return pair((x) => <g key={x}><ellipse cx={x} cy="280" rx="15" ry="8.5" fill="#F1ECE8" /><ellipse cx={x + 6} cy="281" rx="8" ry="6" fill="#8FB3C9" /><rect x={x - 15} y="284" width="30" height="5" rx="2.5" fill="#B9A6A5" /><path d={`M${x - 8} 275l6 3M${x - 4} 273l6 3`} stroke="#E2804F" strokeWidth="2.5" strokeLinecap="round" /></g>);
      case 'boots': return pair((x) => <g key={x}><rect x={x - 10} y="258" width="20" height="22" rx="6" fill="#9C6440" /><ellipse cx={x} cy="281" rx="15" ry="7" fill="#8A5636" /></g>);
      case 'rainboots': return pair((x) => <g key={x}><rect x={x - 10} y="254" width="20" height="26" rx="7" fill="#F2C14B" /><ellipse cx={x} cy="281" rx="15" ry="7" fill="#E0A92A" /><rect x={x - 10} y="256" width="20" height="5" rx="2" fill="#fff" opacity=".4" /></g>);
      case 'sandals': return pair((x) => <g key={x}><ellipse cx={x} cy="282" rx="14" ry="6" fill={`url(#${id('skin')})`} /><ellipse cx={x} cy="285" rx="15" ry="4" fill="#C88A60" /><path d={`M${x - 10} 280c6-6 14-6 20 0`} stroke="#C88A60" strokeWidth="4" fill="none" /></g>);
      case 'slippers': return pair((x) => <g key={x}><ellipse cx={x} cy="281" rx="16" ry="9" fill="#F4B7C0" /><circle cx={x - 4} cy="274" r="4" fill="#fff" /><circle cx={x + 4} cy="274" r="4" fill="#fff" /></g>);
      case 'ballet': return pair((x) => <g key={x}><path d={`M${x - 6} 274l12-22M${x + 6} 274l-12-22`} stroke="#F4B7C0" strokeWidth="2.5" /><ellipse cx={x} cy="280" rx="13" ry="7.5" fill="#F4B7C0" /><ellipse cx={x - 3} cy="277" rx="5" ry="2.5" fill="#fff" opacity=".5" /></g>);
      case 'skates': return pair((x) => <g key={x}><rect x={x - 11} y="260" width="22" height="20" rx="7" fill="#F1ECE8" /><rect x={x - 15} y="277" width="30" height="7" rx="3" fill="#F27B8E" /><circle cx={x - 8} cy="288" r="4.5" fill="#7B6668" /><circle cx={x + 8} cy="288" r="4.5" fill="#7B6668" /><path d={`M${x - 6} 266h10M${x - 6} 271h10`} stroke="#F27B8E" strokeWidth="2" /></g>);
      case 'flippers': return pair((x) => <g key={x}><path d={`M${x - 10} 272h20l8 18c-10 4-26 4-36 0z`} fill="#4FB3C9" /><path d={`M${x - 4} 280v8M${x + 4} 280v8`} stroke="#3A93A8" strokeWidth="2" /></g>);
      case 'furboots': return pair((x) => <g key={x}><rect x={x - 11} y="256" width="22" height="24" rx="7" fill="#C88A60" /><ellipse cx={x} cy="258" rx="13" ry="6" fill="#FBF6F2" /><ellipse cx={x} cy="281" rx="15" ry="7" fill="#B07A52" /></g>);
      case 'elfshoes': return pair((x) => <g key={x}><path d={`M${x - 13} 284c0-10 8-14 14-14s12 3 15 9c5-1 7-6 6-10 6 4 5 14-3 17z`} fill="#4FA37A" /><circle cx={x + 21} cy="268" r="3" fill="#F2C14B" /></g>);
      case 'glass': return pair((x) => <g key={x}><ellipse cx={x} cy="280" rx="14" ry="8" fill="#CFE6F2" opacity=".9" /><path d={`M${x + 8} 284l3 6`} stroke="#B5D6E8" strokeWidth="3" /><ellipse cx={x - 4} cy="277" rx="5" ry="2.5" fill="#fff" /><path d={star(x + 6, 277, 3)} fill="#fff" /></g>);
      case 'clogs': return pair((x) => <g key={x}><rect x={x - 15} y="280" width="30" height="8" rx="3" fill="#B07A52" /><ellipse cx={x} cy="279" rx="12" ry="5" fill={`url(#${id('skin')})`} /><path d={`M${x - 10} 281c4-9 16-9 20 0`} stroke="#D9473E" strokeWidth="5" fill="none" /></g>);
      case 'armor': return pair((x) => <g key={x}><rect x={x - 10} y="256" width="20" height="24" rx="5" fill="#C9CED6" /><path d={`M${x - 10} 264h20M${x - 10} 272h20`} stroke="#9AA2AE" strokeWidth="2" /><ellipse cx={x} cy="281" rx="15" ry="7" fill="#9AA2AE" /></g>);
      default: return pair((x) => <g key={x}><ellipse cx={x} cy="280" rx="14" ry="8" fill="#B5473F" /><ellipse cx={x - 4} cy="277" rx="5" ry="2.5" fill="#fff" opacity=".35" /></g>);
    }
  })();

  // ---------- đồ cầm tay (bên tay phải) ----------
  const hold = (() => {
    switch (look.hold) {
      // ---- đồ cầm tay mới ----
      case 'skateboard': return <g transform="rotate(-14 186 210)"><rect x="176" y="160" width="20" height="96" rx="10" fill="#F2C14B" /><rect x="180" y="166" width="12" height="84" rx="6" fill="#E86A4A" opacity=".7" />{[176, 240].map((y) => <g key={y}><circle cx="174" cy={y} r="5" fill="#7B6668" /><circle cx="198" cy={y} r="5" fill="#7B6668" /></g>)}</g>;
      case 'basketball': return <g><circle cx="186" cy="212" r="18" fill="#EE8A3C" /><path d="M168 212h36M186 194v36M173 199c8 8 8 18 0 26M199 199c-8 8-8 18 0 26" stroke="#8C4A2A" strokeWidth="2" fill="none" /></g>;
      case 'robotoy': return <g><rect x="174" y="178" width="26" height="20" rx="5" fill="#B8C0CA" /><circle cx="182" cy="188" r="3" fill="#4A5463" /><circle cx="192" cy="188" r="3" fill="#4A5463" /><path d="M187 178v-8" stroke="#8E97A3" strokeWidth="2" /><circle cx="187" cy="168" r="3" fill="#F27B8E" /><rect x="170" y="200" width="34" height="28" rx="6" fill="#9FC3DD" /><rect x="180" y="206" width="14" height="10" rx="2" fill="#F2C14B" /><rect x="174" y="228" width="8" height="10" rx="3" fill="#8E97A3" /><rect x="192" y="228" width="8" height="10" rx="3" fill="#8E97A3" /></g>;
      case 'kite': return <g><path d="M172 228C182 190 190 160 196 130" stroke="#7B6668" strokeWidth="1.5" fill="none" /><path d="M196 80l26 30-26 40-26-40z" fill="#F27B8E" /><path d="M196 80v70M170 110h52" stroke="#FBF6F2" strokeWidth="2" /><path d="M196 150c-4 10 4 14 0 24-4 10 4 14 0 24" stroke="#F2C14B" strokeWidth="2" fill="none" />{[162, 182].map((y) => <path key={y} d={`M196 ${y}l-6-4v8zM196 ${y}l6-4v8z`} fill="#9FC3DD" />)}</g>;
      case 'dinotoy': return <g><path d="M166 236c0-16 10-26 24-26 6-14 14-18 22-14 4 4 2 10-6 12 2 10 0 22-6 28z" fill="#9DB88A" /><circle cx="206" cy="200" r="2" fill="#3B3432" />{[[178, 210], [188, 206], [198, 206]].map(([x, y]) => <path key={x} d={`M${x - 4} ${y + 2}l4-8 4 8z`} fill="#F2C14B" />)}<rect x="172" y="234" width="7" height="8" rx="3" fill="#7FA06C" /><rect x="190" y="234" width="7" height="8" rx="3" fill="#7FA06C" /></g>;
      case 'cartoy': return <g><path d="M164 222l6-14h28l8 14z" fill="#9FC3DD" /><rect x="160" y="220" width="52" height="16" rx="6" fill="#E86A4A" /><circle cx="172" cy="238" r="6" fill="#3B3432" /><circle cx="200" cy="238" r="6" fill="#3B3432" /><circle cx="172" cy="238" r="2.5" fill="#B9A6A5" /><circle cx="200" cy="238" r="2.5" fill="#B9A6A5" /><rect x="206" y="224" width="5" height="4" rx="1" fill="#F2D57E" /></g>;
      // ---- đồ ngày lễ giới hạn ----
      case 'banhchung': return <g transform="rotate(-8 182 214)"><rect x="162" y="194" width="40" height="40" rx="5" fill="#5E8A48" /><rect x="166" y="198" width="32" height="32" rx="3" fill="#8DB86B" /><path d="M175 194v40M189 194v40M162 207h40M162 221h40" stroke="#E9DDB8" strokeWidth="2.5" /></g>;
      case 'chocobox': return <g><path d={heart(184, 208, 21)} fill="#B5473F" /><path d={heart(184, 208, 15)} fill="#7A3A30" /><path d="M164 196l40 26M204 196l-40 26" stroke="#F2C14B" strokeWidth="3" /><circle cx="184" cy="209" r="4" fill="#F2C14B" /></g>;
      case 'sunflower': return <g><path d="M172 230c4-20 6-36 4-52" stroke="#6E9A55" strokeWidth="4" fill="none" /><ellipse cx="186" cy="208" rx="10" ry="5" fill="#6E9A55" transform="rotate(-40 186 208)" /><g transform="translate(176 166)">{Array.from({ length: 12 }, (_, k) => <ellipse key={k} cy="-13" rx="5" ry="10" fill="#F6C343" transform={`rotate(${k * 30})`} />)}<circle r="9" fill="#8E5A3C" /><circle r="5" fill="#6B4A3A" /></g></g>;
      case 'bubblewand': return <g><path d="M172 230L188 178" stroke="#9FC3DD" strokeWidth="4" strokeLinecap="round" /><circle cx="191" cy="167" r="11" fill="#fff" fillOpacity=".3" stroke="#F27B8E" strokeWidth="4" />{[[210, 142, 10], [196, 124, 7], [220, 112, 6], [206, 98, 4]].map(([x, y, r]) => <g key={y}><circle cx={x} cy={y} r={r} fill="#fff" fillOpacity=".25" stroke="#9FC3DD" strokeWidth="2" /><circle cx={x - r / 3} cy={y - r / 3} r={r / 4} fill="#fff" /></g>)}</g>;
      case 'watermelon': return <g transform="rotate(-20 184 210)"><path d="M158 200a26 26 0 0 0 52 0z" fill="#5E8A48" /><path d="M162 200a22 22 0 0 0 44 0z" fill="#FBF6F2" /><path d="M165 200a19 19 0 0 0 38 0z" fill="#F0606E" />{[[175, 206], [184, 212], [193, 206]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx="1.8" ry="3" fill="#3B3432" />)}</g>;
      case 'globe': return <g><rect x="172" y="236" width="26" height="6" rx="3" fill="#9C6B4E" /><path d="M185 236v-10" stroke="#9C6B4E" strokeWidth="4" /><circle cx="185" cy="204" r="19" fill="#9FC3DD" /><path d="M174 194c6 2 8 8 4 12s2 10 6 10M190 190c4 4 10 4 12 10M190 214c4-2 8 0 8 4" stroke="#6E9A55" strokeWidth="5" fill="none" strokeLinecap="round" /><path d="M163 196a24 24 0 0 0 38 26" stroke="#C9A34A" strokeWidth="3" fill="none" /><ellipse cx="178" cy="196" rx="4" ry="6" fill="#fff" opacity=".35" /></g>;
      case 'lotus': return <g><path d="M172 230c4-20 6-36 4-50" stroke="#6E9A55" strokeWidth="4" fill="none" /><ellipse cx="188" cy="210" rx="12" ry="6" fill="#7FAE6A" transform="rotate(-30 188 210)" /><g transform="translate(176 176)"><path d="M0 6c-12-3-19-13-17-25 9 2 16 11 17 20z" fill="#F4B7C0" /><path d="M0 6c12-3 19-13 17-25-9 2-16 11-17 20z" fill="#F4B7C0" /><path d="M0 8c-6-9-6-22 0-31 6 9 6 22 0 31z" fill="#E98AA0" /></g></g>;
      case 'drum': return <g><path d="M172 232L184 196" stroke="#9C6B4E" strokeWidth="4" strokeLinecap="round" /><g transform="translate(190 182) rotate(-20)"><rect x="-17" y="-11" width="34" height="22" rx="4" fill="#D9473E" /><path d="M-9 -11v22M0 -11v22M9 -11v22" stroke="#F2C14B" strokeWidth="2" /><ellipse cx="-17" rx="4" ry="11" fill="#F2D57E" /><ellipse cx="17" rx="4" ry="11" fill="#F2D57E" /><path d="M-17 0c-6-8-10-10-14-10M17 0c6 8 10 10 14 10" stroke="#7B6668" strokeWidth="1.5" fill="none" /><circle cx="-31" cy="-10" r="3.2" fill="#F2C14B" /><circle cx="31" cy="10" r="3.2" fill="#F2C14B" /></g></g>;
      case 'candybucket': return <g><circle cx="174" cy="203" r="5" fill="#F27B8E" /><circle cx="186" cy="200" r="5" fill="#9CD3BE" /><circle cx="196" cy="204" r="4" fill="#F2D57E" /><path d="M166 204c0-24 36-24 36 0" stroke="#3B3432" strokeWidth="3" fill="none" /><path d="M164 206h40l-4 28c0 4-4 6-8 6h-16c-4 0-8-2-8-6z" fill="#EE8A3C" /><path d="M175 216l4-5 4 5zM185 216l4-5 4 5z" fill="#5A3A2E" /><path d="M175 224c4 4 14 4 18 0" stroke="#5A3A2E" strokeWidth="2.5" fill="none" /></g>;
      case 'card': return <g transform="rotate(-10 182 214)"><rect x="160" y="190" width="44" height="34" rx="4" fill="#FBF6F2" stroke="#E2D8D2" strokeWidth="2" /><path d={heart(182, 204, 7)} fill="#F27B8E" /><path d="M167 218h30" stroke="#C2A9D6" strokeWidth="2.5" strokeLinecap="round" /></g>;
      case 'snowglobe': return <g><path d="M167 232h36l-4-11h-28z" fill="#9C6B4E" /><circle cx="185" cy="203" r="19" fill="#DDEEF7" stroke="#fff" strokeWidth="2" /><path d="M175 214l10-17 10 17z" fill="#4F8F6A" /><path d={star(185, 196, 3)} fill="#F2C14B" />{[[176, 194], [194, 192], [180, 206], [196, 208], [186, 188]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="#fff" />)}<ellipse cx="178" cy="194" rx="4" ry="7" fill="#fff" opacity=".5" /></g>;
      case 'tulip': return <g><path d="M172 226c4-20 8-34 6-48" stroke="#6E9A55" strokeWidth="4" fill="none" /><ellipse cx="186" cy="206" rx="10" ry="5" fill="#6E9A55" transform="rotate(-40 186 206)" /><path d="M166 170c4 2 6 2 7 6l4-8 4 8c1-4 3-4 7-6 1 12-3 18-11 18s-12-6-11-18z" fill="#E86A4A" /></g>;
      case 'balloon': return <g><path d="M172 226c6-30 14-50 22-70" stroke="#7B6668" strokeWidth="2" fill="none" /><ellipse cx="198" cy="132" rx="24" ry="28" fill="#F27B8E" /><ellipse cx="190" cy="120" rx="6" ry="9" fill="#fff" opacity=".4" /><path d="M194 160l4 6 4-6z" fill="#F27B8E" /></g>;
      case 'book': return <g transform="rotate(-10 176 214)"><rect x="160" y="196" width="34" height="42" rx="4" fill="#9FC3DD" /><rect x="164" y="196" width="4" height="42" fill="#7FA6C9" /><rect x="172" y="206" width="16" height="4" rx="2" fill="#fff" /></g>;
      case 'pencil': return <g transform="rotate(-35 172 226)"><rect x="166" y="170" width="12" height="56" rx="2" fill="#F4CB0A" /><path d="M166 170l6-14 6 14z" fill="#F1D9B5" /><path d="M170 160l2-4 2 4z" fill="#4B3B3D" /><rect x="166" y="222" width="12" height="8" rx="2" fill="#F27B8E" /></g>;
      case 'wand': return <g><path d="M170 228l18-56" stroke="#C2A9D6" strokeWidth="5" strokeLinecap="round" /><path d="M190 152l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#F8CF1F" stroke="#E9A912" strokeWidth="2" strokeLinejoin="round" /></g>;
      case 'lollipop': return <g><path d="M172 226l8-40" stroke="#FBF6F2" strokeWidth="5" strokeLinecap="round" /><circle cx="184" cy="172" r="18" fill="#F4B7C0" /><path d="M184 172m-12 0a12 12 0 1 1 24 0a8 8 0 1 1 -16 0a4 4 0 1 1 8 0" stroke="#E86A4A" strokeWidth="3" fill="none" /></g>;
      case 'backpack': return <g><rect x="166" y="196" width="34" height="40" rx="10" fill="#E86A4A" /><rect x="172" y="214" width="22" height="16" rx="5" fill="#F09A86" /><path d="M172 198c0-12 22-12 22 0" stroke="#C9473F" strokeWidth="4" fill="none" /><rect x="180" y="211" width="6" height="5" rx="1" fill="#F2C14B" /></g>;
      case 'pinwheel': return <g><path d="M172 228l16-70" stroke="#C88A60" strokeWidth="4" strokeLinecap="round" /><g transform="translate(188 156)">{['#F27B8E', '#F2C14B', '#9FC3DD', '#9DB88A'].map((c, k) => <path key={c} d="M0 0L0 -22L16 -10z" fill={c} transform={`rotate(${k * 90})`} />)}<circle r="3.5" fill="#fff" /></g></g>;
      case 'umbrella': return <g><path d="M172 230l22-156" stroke="#7B6668" strokeWidth="3" /><path d="M172 230c0 8-10 8-10 2" stroke="#7B6668" strokeWidth="3" fill="none" /><path d="M152 76c0-40 84-40 84 0-7-6-14-6-21 0-7-6-14-6-21 0-7-6-14-6-21 0-7-6-14-6-21 0z" fill="#9FC3DD" /><path d="M173 76c0-26 10-38 21-40M215 76c0-26-10-38-21-40" stroke="#FBF6F2" strokeWidth="3" fill="none" opacity=".7" /></g>;
      case 'sword': return <g><path d="M174 222l22-70" stroke="#E2C9A8" strokeWidth="8" strokeLinecap="round" /><path d="M164 212l22 8" stroke="#8A5636" strokeWidth="6" strokeLinecap="round" /><path d="M172 228l3-8" stroke="#8A5636" strokeWidth="7" strokeLinecap="round" /></g>;
      case 'trident': return <g><path d="M172 232l24-96" stroke="#F2C14B" strokeWidth="4" strokeLinecap="round" /><path d="M182 130c-2 8 2 14 10 16 8 2 14-2 16-10M196 136l4-16" stroke="#F2C14B" strokeWidth="4" fill="none" strokeLinecap="round" /></g>;
      case 'icecream': return <g><path d="M178 238L166 204h24z" fill="#E2B57A" /><path d="M170 214h14M172 222h10" stroke="#C9965A" strokeWidth="2" /><circle cx="172" cy="200" r="10" fill="#F4B7C0" /><circle cx="186" cy="198" r="10" fill="#9CD3BE" /><circle cx="179" cy="187" r="10" fill="#8E5A3C" /><circle cx="181" cy="177" r="3" fill="#E0403A" /></g>;
      case 'ball': return <g><circle cx="190" cy="242" r="17" fill="#FBF6F2" stroke="#D6CFCB" strokeWidth="2" /><path d="M190 234l7 5-3 8h-8l-3-8z" fill="#3B3432" /><path d="M190 234v-9M197 239l8-3M194 247l5 7M186 247l-5 7M183 239l-8-3" stroke="#3B3432" strokeWidth="2" /></g>;
      case 'brush': return <g><path d="M172 228l18-52" stroke="#C88A60" strokeWidth="5" strokeLinecap="round" /><path d="M188 180l6-16 5 2-5 16z" fill="#9AA2AE" /><path d="M194 164c2-8 8-12 10-8 0 6-4 10-10 8z" fill="#5E8AC9" /></g>;
      case 'rocket': return <g transform="rotate(20 186 200)"><path d="M186 160c12 10 14 30 10 50h-20c-4-20-2-40 10-50z" fill="#F1EEEC" /><circle cx="186" cy="186" r="6" fill="#9FC3DD" stroke="#5E8AC9" strokeWidth="2" /><path d="M176 196l-10 16h10zM196 196l10 16h-10z" fill="#E86A4A" /><path d="M180 210l6 14 6-14z" fill="#F2C14B" /><path d="M180 166c4-4 8-4 12 0" stroke="#E86A4A" strokeWidth="4" fill="none" /></g>;
      case 'flag': return <g><path d="M172 234V136" stroke="#9C8468" strokeWidth="4" strokeLinecap="round" /><path d="M174 138h44v30h-44z" fill="#DA251D" /><path d={star(196, 153, 10)} fill="#FFDD00" /></g>;
      case 'lixi': return <g transform="rotate(-12 180 214)"><rect x="166" y="194" width="28" height="40" rx="3" fill="#D9473E" /><path d="M166 204h28" stroke="#F2C14B" strokeWidth="2" /><circle cx="180" cy="218" r="8" fill="#F2C14B" /><path d={star(180, 218, 5)} fill="#D9473E" /></g>;
      case 'maibranch': return <g><path d="M170 230c6-24 10-44 24-62M186 186c8-4 16-4 22 0M180 206c-8-6-16-6-20-2" stroke="#7A5440" strokeWidth="4" fill="none" strokeLinecap="round" />{[[194, 166], [208, 184], [160, 202], [186, 186], [200, 152], [176, 176]].map(([x, y]) => <Blossom key={`${x}-${y}`} x={x} y={y} r={6} c="#F8CF1F" center="#E9806A" />)}</g>;
      case 'heart': return <g><path d="M172 226c6-30 14-50 22-70" stroke="#7B6668" strokeWidth="2" fill="none" /><path d={heart(198, 136, 22)} fill="#F27B8E" /><ellipse cx="188" cy="128" rx="5" ry="8" fill="#fff" opacity=".4" /></g>;
      case 'roses': case 'bouquet': {
        const roses = look.hold === 'roses';
        const spots: [number, number, string][] = roses ? [[166, 192, '#D9473E'], [180, 184, '#E0605A'], [194, 192, '#D9473E'], [172, 200, '#E0605A'], [188, 200, '#C9473F']] : [[166, 192, '#F4B7C0'], [180, 184, '#F8E08A'], [194, 192, '#C2A9D6'], [172, 200, '#FBF6F2'], [188, 200, '#F09A86']];
        return <g>
          <ellipse cx="162" cy="200" rx="8" ry="4" fill="#6E9A55" transform="rotate(-30 162 200)" /><ellipse cx="198" cy="200" rx="8" ry="4" fill="#6E9A55" transform="rotate(30 198 200)" />
          {spots.map(([x, y, c]) => roses
            ? <g key={`${x}-${y}`}><circle cx={x} cy={y} r="8" fill={c} /><path d={`M${x - 3} ${y}a3 3 0 1 1 6 0`} stroke="#9C2F3A" strokeWidth="2" fill="none" /></g>
            : <Blossom key={`${x}-${y}`} x={x} y={y} r={6} c={c} center="#F2C14B" />)}
          <path d="M174 240L160 200h36z" fill={roses ? '#F3E6D2' : '#C9DCE8'} />
          <path d="M170 216l8 4 8-4v6l-8-2-8 2z" fill="#F27B8E" />
        </g>;
      }
      case 'starlantern': return <g><path d="M170 230l22-74" stroke="#9C6B4E" strokeWidth="4" strokeLinecap="round" /><path d={star(198, 140, 24, 11)} fill="#E0403A" stroke="#B5382F" strokeWidth="2" strokeLinejoin="round" /><path d={star(198, 140, 10, 4.5)} fill="#F8CF1F" /><path d="M190 162l-4 14M198 164v14M206 162l4 14" stroke="#F2C14B" strokeWidth="2.5" strokeLinecap="round" /></g>;
      case 'carplantern': return <g><path d="M170 230l20-52" stroke="#9C6B4E" strokeWidth="4" strokeLinecap="round" /><path d="M190 178v14" stroke="#7B6668" strokeWidth="2" /><g transform="translate(196 202)"><path d="M-22 0c6-14 30-16 40 0-10 16-34 14-40 0z" fill="#F08A3C" /><path d="M16 0l12-10v20z" fill="#E86A4A" /><circle cx="-14" cy="-2" r="2.5" fill="#3B3432" /><path d="M-4 -6c3 4 3 8 0 12M4 -6c3 4 3 8 0 12" stroke="#F8CF1F" strokeWidth="2" fill="none" /><path d="M-6 8l-4 8M6 8l4 8" stroke="#F2C14B" strokeWidth="2" /></g></g>;
      case 'mooncake': return <g><rect x="166" y="198" width="36" height="32" rx="9" fill="#D9A55B" /><rect x="172" y="204" width="24" height="20" rx="6" fill="none" stroke="#B9823B" strokeWidth="2" /><Blossom x={184} y={214} r={4} c="#C8924A" center="#B9823B" /></g>;
      case 'pumpkin': return <g><path d="M172 228c4 4 8 8 14 10" stroke="#7B6668" strokeWidth="2.5" fill="none" /><ellipse cx="188" cy="252" rx="19" ry="16" fill="#EE8A3C" /><path d="M188 237v30M178 240c-5 8-5 18 0 24M198 240c5 8 5 18 0 24" stroke="#D2702A" strokeWidth="2" fill="none" /><path d="M180 248l4-5 4 5zM190 248l4-5 4 5z" fill="#5A3A2E" /><path d="M180 256c4 4 12 4 16 0" stroke="#5A3A2E" strokeWidth="2.5" fill="none" /><rect x="186" y="232" width="4" height="7" rx="1" fill="#6E9A55" /></g>;
      case 'broom': return <g><path d="M150 268L196 150" stroke="#9C6B4E" strokeWidth="5" strokeLinecap="round" /><path d="M150 262c-14 4-24 14-26 26 10 2 22-2 32-10 4-6 2-12-6-16z" fill="#E2B85A" /><path d="M146 266l8 6" stroke="#B5382F" strokeWidth="4" /></g>;
      case 'candycane': return <g><path d="M172 238V176c0-16 24-16 24 0v6" stroke="#FBF6F2" strokeWidth="8" fill="none" strokeLinecap="round" /><path d="M172 238V176c0-16 24-16 24 0v6" stroke="#E0403A" strokeWidth="8" fill="none" strokeDasharray="6 7" /></g>;
      case 'gift': return <g><rect x="164" y="204" width="36" height="32" rx="4" fill="#9FC3DD" /><rect x="179" y="204" width="6" height="32" fill="#E0605A" /><rect x="164" y="216" width="36" height="6" fill="#E0605A" /><ellipse cx="175" cy="199" rx="7" ry="5" fill="#E0605A" transform="rotate(-20 175 199)" /><ellipse cx="189" cy="199" rx="7" ry="5" fill="#E0605A" transform="rotate(20 189 199)" /></g>;
      case 'teddy': return <g transform="translate(184 210)"><circle cx="-12" cy="-26" r="7" fill="#B57A52" /><circle cx="12" cy="-26" r="7" fill="#B57A52" /><circle cy="-16" r="15" fill="#C88A60" /><ellipse cy="8" rx="15" ry="16" fill="#C88A60" /><ellipse cy="-12" rx="6" ry="4" fill="#E9C9A8" /><circle cx="-5" cy="-19" r="2" fill="#3B3432" /><circle cx="5" cy="-19" r="2" fill="#3B3432" /></g>;
      default: return null;
    }
  })();

  const eye = (cx: number) => (
    <g className="ch-eye">
      {eyesClosed ? (
        <path d={`M${cx - 13} 128c6 7 20 7 26 0`} stroke="#5E3A34" strokeWidth="4" fill="none" strokeLinecap="round" />
      ) : (<>
        <ellipse cx={cx} cy="127" rx="15" ry="18" fill={`url(#${id('eye')})`} />
        <ellipse cx={cx} cy="133" rx="9" ry="7" fill="#E9806A" opacity=".55" />
        <circle cx={cx - 5} cy="119" r="5.5" fill="#fff" />
        <circle cx={cx + 6} cy="133" r="2.6" fill="#fff" opacity=".9" />
        <path d={`M${cx - 16} 110c8-5 24-5 32 0`} stroke="#5E3A34" strokeWidth={boy ? 2.6 : 3.4} fill="none" strokeLinecap="round" />
        {!boy && <path d={cx < 120 ? `M${cx - 15} 112l-5-4` : `M${cx + 15} 112l5-4`} stroke="#5E3A34" strokeWidth="3" strokeLinecap="round" />}
      </>)}
      {boy && <path d={`M${cx - 13} ${eyesClosed ? 106 : 99}c6-3 20-3 26 0`} stroke={hairD} strokeWidth="5" fill="none" strokeLinecap="round" />}
    </g>
  );

  return (
    <svg viewBox="0 0 240 300" width={size} height={size * 1.25} className={`chibi mood-${mood} ${flip ? 'flip' : ''} ${className}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <radialGradient id={id('skin')} cx=".38" cy=".32" r=".75"><stop offset="0" stopColor={shade(skin, 0.35)} /><stop offset=".7" stopColor={skin} /><stop offset="1" stopColor={skinD} /></radialGradient>
        <linearGradient id={id('hair')} x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stopColor={hairL} /><stop offset=".45" stopColor={hair} /><stop offset="1" stopColor={hairD} /></linearGradient>
        <linearGradient id={id('cloth')} x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stopColor={clothL} /><stop offset=".5" stopColor={cloth} /><stop offset="1" stopColor={clothD} /></linearGradient>
        <radialGradient id={id('eye')} cx=".5" cy=".35" r=".7"><stop offset="0" stopColor="#B4553F" /><stop offset=".6" stopColor="#6E2E26" /><stop offset="1" stopColor="#3E1C18" /></radialGradient>
      </defs>
      <ellipse cx="120" cy="290" rx="62" ry="9" fill="#3A2A2A" opacity=".16" className="ch-shadow" />
      <g className="ch-body">
        {outfitBack}
        {/* tóc sau lưng: vẽ trước thân để nằm phía sau; cùng lớp ch-head nên vẫn lắc theo đầu */}
        <g className="ch-head ch-head-back">{backHair}</g>
        {/* chân */}
        {!noLegs && <g className="ch-legs">
          <rect x="99" y="246" width="17" height="30" rx="8" fill={legFill} /><rect x="124" y="246" width="17" height="30" rx="8" fill={legFill} />
          {shoes}
        </g>}
        {/* tay sau */}
        <g className="ch-arm-l"><rect x="62" y="182" width="24" height="44" rx="12" fill={sleeve} transform="rotate(14 74 186)" /><circle cx="70" cy="228" r="10" fill={`url(#${id('skin')})`} /></g>
        <g className="ch-arm-r"><rect x="154" y="182" width="24" height="44" rx="12" fill={sleeve} transform="rotate(-14 166 186)" /><circle cx="170" cy="228" r="10" fill={`url(#${id('skin')})`} /></g>
        {outfit}
        {/* cổ */}
        <rect x="110" y="160" width="20" height="16" rx="6" fill={skinD} />
        <g className="ch-head">
          {ears}
          <ellipse cx="120" cy="112" rx="70" ry="64" fill={`url(#${id('skin')})`} />
          <ellipse cx="88" cy="146" rx="13" ry="8" fill="#F29A92" opacity={boy ? 0.28 : 0.45} />
          <ellipse cx="152" cy="146" rx="13" ry="8" fill="#F29A92" opacity={boy ? 0.28 : 0.45} />
          <g className="ch-eyes">{eye(92)}{eye(148)}</g>
          <ellipse cx="120" cy="141" rx="2.2" ry="1.6" fill="#D98C80" />
          {mouth}
          {bangs}
          <path d="M70 70c10-14 26-22 40-24" stroke="#fff" strokeOpacity=".35" strokeWidth="6" fill="none" strokeLinecap="round" />
          {acc}
        </g>
        {hold && <g className="ch-arm-r ch-hold">{hold}<circle cx="170" cy="228" r="10" fill={`url(#${id('skin')})`} /></g>}
      </g>
      {!noPet && look.pet && look.pet !== 'none' && <g className="ch-pet" transform="translate(44 258) scale(1.45)">{petBody(look.pet, petStage(look.petXp))}</g>}
      {mood === 'sleep' && <g className="ch-zzz" fill="#7B6668" fontFamily="Baloo 2, sans-serif" fontWeight="800"><text x="190" y="50" fontSize="22">z</text><text x="206" y="30" fontSize="16">z</text></g>}
      {mood === 'think' && <g className="ch-think" fill="#fff"><circle cx="196" cy="54" r="5" /><circle cx="208" cy="38" r="8" /><circle cx="222" cy="18" r="12" /></g>}
    </svg>
  );
}
