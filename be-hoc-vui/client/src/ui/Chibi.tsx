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

export const MASCOTS: Record<string, Look> = {
  mimi: { skin: '#F7D9C4', hair: 'bob', hairColor: '#F1E4D6', ears: 'cat', outfit: 'dress', outfitColor: '#B8C98A', acc: 'flower', scene: 'meadow', shoes: 'maryjane', hold: 'tulip' },
  bo: { skin: '#F4D3BC', hair: 'spiky', hairColor: '#7A6A60', ears: 'bear', outfit: 'overall', outfitColor: '#9FC3DD', acc: 'glasses', scene: 'meadow', shoes: 'sneakers', hold: 'pencil' },
  mochi: { skin: '#F8DCCB', hair: 'twin', hairColor: '#F3E6D8', ears: 'bunny', outfit: 'aodai', outfitColor: '#F0B48E', acc: 'none', scene: 'meadow', shoes: 'maryjane', hold: 'book' },
  foxy: { skin: '#F4D3BC', hair: 'spiky', hairColor: '#D9864F', ears: 'fox', outfit: 'hoodie', outfitColor: '#C2A9D6', acc: 'none', scene: 'meadow', shoes: 'sneakers', hold: 'none' },
  kiwi: { skin: '#F7D9C4', hair: 'bob', hairColor: '#5E4A3A', ears: 'frog', outfit: 'raincoat', outfitColor: '#B8C98A', acc: 'none', scene: 'meadow', shoes: 'rainboots', hold: 'none' },
};

interface Props { look: Look; mood?: Mood; size?: number; className?: string; flip?: boolean; title?: string }

export function Chibi({ look, mood = 'idle', size = 240, className = '', flip = false, title }: Props) {
  const uid = useId().replace(/[:]/g, '');
  const id = (s: string) => `${uid}-${s}`;
  const hair = look.hairColor, hairD = shade(hair, -0.22), hairL = shade(hair, 0.35);
  const skin = look.skin, skinD = shade(skin, -0.12);
  const cloth = look.outfitColor, clothD = shade(cloth, -0.2), clothL = shade(cloth, 0.35);
  const eyesClosed = mood === 'sleep';
  // tay áo: áo trắng thì tay áo trắng
  const sleeve = ['school', 'chef', 'labcoat', 'astronaut', 'sailor'].includes(look.outfit) ? (look.outfit === 'astronaut' ? '#F1EEEC' : '#FBF6F2') : `url(#${id('cloth')})`;
  const hatCovers = ['nonla', 'cap', 'beret'].includes(look.acc);

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
      case 'spiky': return <path d="M52 100c2-40 30-66 68-66s66 26 68 66c-10-6-16-18-18-26-6 10-18 16-28 16 2-6 2-12 0-16-8 10-22 14-34 12 2-4 2-10 0-14-8 10-20 18-34 18-4 4-12 8-22 10z" fill={`url(#${id('hair')})`} />;
      case 'curly': return <g fill={`url(#${id('hair')})`}>{[[66, 76, 18], [90, 60, 20], [120, 54, 21], [150, 60, 20], [174, 76, 18]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} />)}</g>;
      case 'pixie': return <path d="M50 104c0-44 30-72 70-72s70 26 70 70c-30 0-70-6-100-36-6 18-20 30-40 38z" fill={`url(#${id('hair')})`} />;
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
      case 'starclip': return <g transform="translate(164 64) rotate(12)"><path d="M0 -16l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#F8CF1F" stroke="#E9A912" strokeWidth="2" strokeLinejoin="round" /></g>;
      default: return null;
    }
  })();

  // ---------- giày ----------
  const shoes = (() => {
    const pair = (f: (x: number) => ReactElement) => <>{f(106)}{f(134)}</>;
    switch (look.shoes) {
      case 'sneakers': return pair((x) => <g key={x}><ellipse cx={x} cy="280" rx="15" ry="8.5" fill="#F1ECE8" /><ellipse cx={x + 6} cy="281" rx="8" ry="6" fill="#8FB3C9" /><rect x={x - 15} y="284" width="30" height="5" rx="2.5" fill="#B9A6A5" /><path d={`M${x - 8} 275l6 3M${x - 4} 273l6 3`} stroke="#E2804F" strokeWidth="2.5" strokeLinecap="round" /></g>);
      case 'boots': return pair((x) => <g key={x}><rect x={x - 10} y="258" width="20" height="22" rx="6" fill="#9C6440" /><ellipse cx={x} cy="281" rx="15" ry="7" fill="#8A5636" /></g>);
      case 'rainboots': return pair((x) => <g key={x}><rect x={x - 10} y="254" width="20" height="26" rx="7" fill="#F2C14B" /><ellipse cx={x} cy="281" rx="15" ry="7" fill="#E0A92A" /><rect x={x - 10} y="256" width="20" height="5" rx="2" fill="#fff" opacity=".4" /></g>);
      case 'sandals': return pair((x) => <g key={x}><ellipse cx={x} cy="282" rx="14" ry="6" fill={`url(#${id('skin')})`} /><ellipse cx={x} cy="285" rx="15" ry="4" fill="#C88A60" /><path d={`M${x - 10} 280c6-6 14-6 20 0`} stroke="#C88A60" strokeWidth="4" fill="none" /></g>);
      case 'slippers': return pair((x) => <g key={x}><ellipse cx={x} cy="281" rx="16" ry="9" fill="#F4B7C0" /><circle cx={x - 4} cy="274" r="4" fill="#fff" /><circle cx={x + 4} cy="274" r="4" fill="#fff" /></g>);
      default: return pair((x) => <g key={x}><ellipse cx={x} cy="280" rx="14" ry="8" fill="#B5473F" /><ellipse cx={x - 4} cy="277" rx="5" ry="2.5" fill="#fff" opacity=".35" /></g>);
    }
  })();

  // ---------- đồ cầm tay (bên tay phải) ----------
  const hold = (() => {
    switch (look.hold) {
      case 'tulip': return <g><path d="M172 226c4-20 8-34 6-48" stroke="#6E9A55" strokeWidth="4" fill="none" /><ellipse cx="186" cy="206" rx="10" ry="5" fill="#6E9A55" transform="rotate(-40 186 206)" /><path d="M166 170c4 2 6 2 7 6l4-8 4 8c1-4 3-4 7-6 1 12-3 18-11 18s-12-6-11-18z" fill="#E86A4A" /></g>;
      case 'balloon': return <g><path d="M172 226c6-30 14-50 22-70" stroke="#7B6668" strokeWidth="2" fill="none" /><ellipse cx="198" cy="132" rx="24" ry="28" fill="#F27B8E" /><ellipse cx="190" cy="120" rx="6" ry="9" fill="#fff" opacity=".4" /><path d="M194 160l4 6 4-6z" fill="#F27B8E" /></g>;
      case 'book': return <g transform="rotate(-10 176 214)"><rect x="160" y="196" width="34" height="42" rx="4" fill="#9FC3DD" /><rect x="164" y="196" width="4" height="42" fill="#7FA6C9" /><rect x="172" y="206" width="16" height="4" rx="2" fill="#fff" /></g>;
      case 'pencil': return <g transform="rotate(-35 172 226)"><rect x="166" y="170" width="12" height="56" rx="2" fill="#F4CB0A" /><path d="M166 170l6-14 6 14z" fill="#F1D9B5" /><path d="M170 160l2-4 2 4z" fill="#4B3B3D" /><rect x="166" y="222" width="12" height="8" rx="2" fill="#F27B8E" /></g>;
      case 'wand': return <g><path d="M170 228l18-56" stroke="#C2A9D6" strokeWidth="5" strokeLinecap="round" /><path d="M190 152l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#F8CF1F" stroke="#E9A912" strokeWidth="2" strokeLinejoin="round" /></g>;
      case 'lollipop': return <g><path d="M172 226l8-40" stroke="#FBF6F2" strokeWidth="5" strokeLinecap="round" /><circle cx="184" cy="172" r="18" fill="#F4B7C0" /><path d="M184 172m-12 0a12 12 0 1 1 24 0a8 8 0 1 1 -16 0a4 4 0 1 1 8 0" stroke="#E86A4A" strokeWidth="3" fill="none" /></g>;
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
          {shoes}
        </g>
        {/* tay sau */}
        <g className="ch-arm-l"><rect x="62" y="182" width="24" height="44" rx="12" fill={sleeve} transform="rotate(14 74 186)" /><circle cx="70" cy="228" r="10" fill={`url(#${id('skin')})`} /></g>
        <g className="ch-arm-r"><rect x="154" y="182" width="24" height="44" rx="12" fill={sleeve} transform="rotate(-14 166 186)" /><circle cx="170" cy="228" r="10" fill={`url(#${id('skin')})`} /></g>
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
        {hold && <g className="ch-arm-r ch-hold">{hold}<circle cx="170" cy="228" r="10" fill={`url(#${id('skin')})`} /></g>}
      </g>
      {mood === 'sleep' && <g className="ch-zzz" fill="#7B6668" fontFamily="Baloo 2, sans-serif" fontWeight="800"><text x="190" y="50" fontSize="22">z</text><text x="206" y="30" fontSize="16">z</text></g>}
      {mood === 'think' && <g className="ch-think" fill="#fff"><circle cx="196" cy="54" r="5" /><circle cx="208" cy="38" r="8" /><circle cx="222" cy="18" r="12" /></g>}
    </svg>
  );
}
