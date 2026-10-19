// Nhân vật chibi kiểu "búp bê vinyl" vẽ bằng SVG: đổ bóng mềm bằng gradient, không viền.
// Dựng từ bộ phận tách rời (tóc sau, tai, đầu, mặt, tóc mái, thân, tay, chân) để tuỳ biến & tạo chuyển động.
import { useId } from 'react';
import type { Look } from '../lib/types';

export type Mood = 'idle' | 'happy' | 'cheer' | 'sad' | 'think' | 'wave' | 'sleep' | 'wow';

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  r = f(r); g = f(g); b = f(b);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export const MASCOTS: Record<string, Look> = {
  mimi: { skin: '#F7D9C4', hair: 'bob', hairColor: '#F1E4D6', ears: 'cat', outfit: 'dress', outfitColor: '#B8C98A', acc: 'flower', scene: 'meadow' },
  bo: { skin: '#F4D3BC', hair: 'spiky', hairColor: '#7A6A60', ears: 'bear', outfit: 'overall', outfitColor: '#9FC3DD', acc: 'glasses', scene: 'meadow' },
  mochi: { skin: '#F8DCCB', hair: 'twin', hairColor: '#F3E6D8', ears: 'bunny', outfit: 'aodai', outfitColor: '#F0B48E', acc: 'none', scene: 'meadow' },
  foxy: { skin: '#F4D3BC', hair: 'spiky', hairColor: '#D9864F', ears: 'fox', outfit: 'hoodie', outfitColor: '#C2A9D6', acc: 'none', scene: 'meadow' },
  kiwi: { skin: '#F7D9C4', hair: 'bob', hairColor: '#5E4A3A', ears: 'frog', outfit: 'raincoat', outfitColor: '#B8C98A', acc: 'none', scene: 'meadow' },
};

interface Props { look: Look; mood?: Mood; size?: number; className?: string; flip?: boolean; title?: string }

export function Chibi({ look, mood = 'idle', size = 240, className = '', flip = false, title }: Props) {
  const uid = useId().replace(/[:]/g, '');
  const id = (s: string) => `${uid}-${s}`;
  const hair = look.hairColor, hairD = shade(hair, -0.22), hairL = shade(hair, 0.35);
  const skin = look.skin, skinD = shade(skin, -0.12);
  const cloth = look.outfitColor, clothD = shade(cloth, -0.2), clothL = shade(cloth, 0.35);
  const eyesClosed = mood === 'sleep';
  const hatCovers = look.acc === 'nonla';

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
      case 'owl': return (<g className="ch-ears">
        <path d="M66 58c-4-14 2-26 8-30 2 10 10 18 18 22z" fill={`url(#${id('hair')})`} />
        <path d="M174 58c4-14-2-26-8-30-2 10-10 18-18 22z" fill={`url(#${id('hair')})`} /></g>);
      case 'frog': return (<g className="ch-ears">
        <circle cx="80" cy="44" r="22" fill="#9DB88A" /><circle cx="160" cy="44" r="22" fill="#9DB88A" />
        <circle cx="80" cy="42" r="12" fill="#fff" /><circle cx="160" cy="42" r="12" fill="#fff" />
        <circle cx="82" cy="44" r="6" fill="#3B3432" /><circle cx="158" cy="44" r="6" fill="#3B3432" />
        <path d="M58 70c10-22 114-22 124 0" fill="#9DB88A" /></g>);
      default: return null;
    }
  })();

  // ---------- tóc sau ----------
  const backHair = (() => {
    switch (look.hair) {
      case 'long': return <path d="M44 110c-4-56 34-86 76-86s80 30 76 86l4 104c0 14-18 18-30 10-6 8-26 10-50 10s-44-2-50-10c-12 8-30 4-30-10z" fill={`url(#${id('hair')})`} />;
      case 'twin': return (<g>
        <path d="M46 112c-4-54 32-84 74-84s78 30 74 84l-2 40c-10 10-134 10-144 0z" fill={`url(#${id('hair')})`} />
        <g className="ch-tail-l"><ellipse cx="38" cy="160" rx="22" ry="38" fill={`url(#${id('hair')})`} transform="rotate(12 38 130)" /></g>
        <g className="ch-tail-r"><ellipse cx="202" cy="160" rx="22" ry="38" fill={`url(#${id('hair')})`} transform="rotate(-12 202 130)" /></g>
        <circle cx="50" cy="128" r="7" fill="#E86A4A" /><circle cx="190" cy="128" r="7" fill="#E86A4A" /></g>);
      case 'bun': return (<g><circle cx="120" cy="30" r="24" fill={`url(#${id('hair')})`} /><path d="M46 112c-4-54 32-84 74-84s78 30 74 84l-2 30c-10 8-134 8-144 0z" fill={`url(#${id('hair')})`} /></g>);
      case 'spiky': return <path d="M50 112c-4-50 30-80 70-80s74 30 70 80l-4 18c-10 6-122 6-132 0z" fill={`url(#${id('hair')})`} />;
      default: return <path d="M44 112c-4-56 34-86 76-86s80 30 76 86l-4 56c-2 10-14 12-22 6-8 6-34 8-50 8s-42-2-50-8c-8 6-20 4-22-6z" fill={`url(#${id('hair')})`} />;
    }
  })();

  // ---------- tóc mái ----------
  const bangs = (() => {
    switch (look.hair) {
      case 'spiky': return <path d="M52 100c2-40 30-66 68-66s66 26 68 66c-10-6-16-18-18-26-6 10-18 16-28 16 2-6 2-12 0-16-8 10-22 14-34 12 2-4 2-10 0-14-8 10-20 18-34 18-4 4-12 8-22 10z" fill={`url(#${id('hair')})`} />;
      case 'long': return <path d="M48 108c0-48 32-76 72-76s72 28 72 76c-6-4-12-14-14-24-14 12-36 16-58 14-20 0-40-4-56-14-2 10-8 20-16 24z" fill={`url(#${id('hair')})`} />;
      default: return <path d="M46 112c0-50 32-80 74-80s74 30 74 80c-8-2-14-12-16-22-6 8-16 12-24 10 0-6-2-10-4-14-8 8-20 12-30 10-10 2-22-2-30-10-2 4-4 8-4 14-8 2-18-2-24-10-2 10-8 20-16 22z" fill={`url(#${id('hair')})`} />;
    }
  })();

  // ---------- trang phục ----------
  const outfit = (() => {
    switch (look.outfit) {
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
      case 'bow': return <g transform="translate(162 46) rotate(18)"><path d="M0 0l-20-12v24zM0 0l20-12v24z" fill="#E0605A" /><circle r="6" fill="#C9473F" /></g>;
      case 'flower': return <g transform="translate(166 70)">{[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-9" rx="6" ry="9" fill="#F4B7C0" transform={`rotate(${r})`} />)}<circle r="5" fill="#F8CF1F" /></g>;
      case 'glasses': return <g fill="none" stroke="#5E4A4C" strokeWidth="3.5"><circle cx="92" cy="126" r="20" /><circle cx="148" cy="126" r="20" /><path d="M112 124c4-4 12-4 16 0" /></g>;
      case 'nonla': return <g><path d="M30 64L120 -6l90 70c-40 12-140 12-180 0z" fill="#F2DFB0" /><path d="M30 64c40 12 140 12 180 0" stroke="#D9BE7F" strokeWidth="4" fill="none" /><path d="M60 40l60-44M90 50l30-52M150 50l-30-52M180 40l-60-44" stroke="#E2CB92" strokeWidth="2" /></g>;
      case 'crown': return <g transform="translate(120 34)"><path d="M-30 12l-6-30 18 12 18-24 18 24 18-12-6 30z" fill="#F8CF1F" /><rect x="-30" y="8" width="60" height="9" rx="3" fill="#F2B21B" /><circle cy="-2" r="4.5" fill="#E86A4A" /></g>;
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
        <path d={`M${cx - 16} 110c8-5 24-5 32 0`} stroke="#5E3A34" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      </>)}
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
        {/* chân */}
        <g className="ch-legs">
          <rect x="99" y="246" width="17" height="30" rx="8" fill="#ECE3DE" /><rect x="124" y="246" width="17" height="30" rx="8" fill="#ECE3DE" />
          <ellipse cx="106" cy="280" rx="14" ry="8" fill="#B5473F" /><ellipse cx="134" cy="280" rx="14" ry="8" fill="#B5473F" />
          <ellipse cx="102" cy="277" rx="5" ry="2.5" fill="#fff" opacity=".35" /><ellipse cx="130" cy="277" rx="5" ry="2.5" fill="#fff" opacity=".35" />
        </g>
        {/* tay sau */}
        <g className="ch-arm-l"><rect x="62" y="182" width="24" height="44" rx="12" fill={`url(#${id('cloth')})`} transform="rotate(14 74 186)" /><circle cx="70" cy="228" r="10" fill={`url(#${id('skin')})`} /></g>
        <g className="ch-arm-r"><rect x="154" y="182" width="24" height="44" rx="12" fill={`url(#${id('cloth')})`} transform="rotate(-14 166 186)" /><circle cx="170" cy="228" r="10" fill={`url(#${id('skin')})`} /></g>
        {outfit}
        {/* cổ */}
        <rect x="110" y="160" width="20" height="16" rx="6" fill={skinD} />
        <g className="ch-head">
          {backHair}
          {ears}
          <ellipse cx="120" cy="112" rx="70" ry="64" fill={`url(#${id('skin')})`} />
          <ellipse cx="88" cy="146" rx="13" ry="8" fill="#F29A92" opacity=".45" />
          <ellipse cx="152" cy="146" rx="13" ry="8" fill="#F29A92" opacity=".45" />
          <g className="ch-eyes">{eye(92)}{eye(148)}</g>
          <ellipse cx="120" cy="141" rx="2.2" ry="1.6" fill="#D98C80" />
          {mouth}
          {bangs}
          <path d="M70 70c10-14 26-22 40-24" stroke="#fff" strokeOpacity=".35" strokeWidth="6" fill="none" strokeLinecap="round" />
          {acc}
        </g>
      </g>
      {mood === 'sleep' && <g className="ch-zzz" fill="#7B6668" fontFamily="Baloo 2, sans-serif" fontWeight="800"><text x="190" y="50" fontSize="22">z</text><text x="206" y="30" fontSize="16">z</text></g>}
      {mood === 'think' && <g className="ch-think" fill="#fff"><circle cx="196" cy="54" r="5" /><circle cx="208" cy="38" r="8" /><circle cx="222" cy="18" r="12" /></g>}
    </svg>
  );
}
