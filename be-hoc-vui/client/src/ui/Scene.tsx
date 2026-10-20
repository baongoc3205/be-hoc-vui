// Cảnh nền mờ kiểu "chụp ảnh xoá phông" như mẫu: bầu trời, biển, đồi, hoa, hàng rào, mặt đất.
// Toàn bộ vẽ bằng SVG, làm mờ bằng CSS để tạo chiều sâu.
import { memo } from 'react';

export type SceneName = 'meadow' | 'beach' | 'village' | 'night' | 'sakura' | 'snow' | 'ocean' | 'castle' | 'space' | 'tet' | 'lantern' | 'halloween' | 'christmas' | 'math' | 'vietnamese' | 'english' | 'science';

const PAL: Record<SceneName, { sky: [string, string, string]; far: string; mid: string; ground: [string, string]; flower: string[]; sea?: string }> = {
  meadow: { sky: ['#E9E2D6', '#F2E7D8', '#F6EADC'], far: '#C9D3C0', mid: '#B7C98A', ground: ['#E4D3CB', '#CDB8AE'], flower: ['#F2B83A', '#F4C64E', '#E9A62B', '#F6D27A'], sea: '#A9C8D6' },
  beach: { sky: ['#D9E6EC', '#EAEDE8', '#F6EADC'], far: '#C3D6DA', mid: '#E8D9BE', ground: ['#EEDFCC', '#D9C3A9'], flower: ['#F3A6A0', '#F7C9B5', '#E98B83'], sea: '#8FBCCD' },
  village: { sky: ['#E3E6D6', '#EEEBD8', '#F4EAD6'], far: '#B9C9A3', mid: '#A9C27A', ground: ['#DCCDB2', '#C2AE8E'], flower: ['#C9D86A', '#B4C957', '#DCE38A'] },
  night: { sky: ['#4B4566', '#6E6283', '#9A8293'], far: '#5F5A78', mid: '#6F7A6A', ground: ['#7A6B73', '#5E5260'], flower: ['#F6E7A8', '#F2D27A', '#FFF2C4'] },
  sakura: { sky: ['#F1E2E4', '#F5E8E6', '#F8EEE6'], far: '#E6C9D2', mid: '#D9B8C6', ground: ['#EAD9D6', '#D6C1BD'], flower: ['#F4B7C0', '#F8CDD5', '#EFA2B0', '#FFFFFF'], sea: '#B9CCD9' },
  snow: { sky: ['#DDE5EE', '#E8EDF2', '#F2F4F6'], far: '#D3DCE6', mid: '#E4EAF0', ground: ['#F4F6F8', '#DDE3EA'], flower: ['#FFFFFF', '#E6EEF5', '#F4B7C0'] },
  ocean: { sky: ['#8FBFD6', '#ABD0DE', '#CFE3E6'], far: '#7FAFC4', mid: '#9CC7C2', ground: ['#EEDFCC', '#D9C3A9'], flower: ['#F09A86', '#F4B7C0', '#F2D27A', '#9CD3BE'] },
  castle: { sky: ['#E6DCEC', '#F0E4EC', '#F8ECE6'], far: '#D9C6DE', mid: '#C9D3A9', ground: ['#E8DAD6', '#D2C0BC'], flower: ['#F4B7C0', '#C2A9D6', '#FFFFFF', '#F8E08A'] },
  space: { sky: ['#1F2440', '#34365E', '#544F80'], far: '#3E3E66', mid: '#5A5880', ground: ['#9A96AE', '#7C7892'], flower: ['#F6E7A8', '#C9DCE8', '#F4B7C0'] },
  tet: { sky: ['#F6E3C8', '#F8EAD2', '#FAF0DE'], far: '#E9C9A0', mid: '#D9B87A', ground: ['#EAD4C0', '#D2B79E'], flower: ['#F8CF1F', '#F2B83A', '#F4B7C0', '#E86A4A'] },
  lantern: { sky: ['#37345A', '#584A70', '#8A6A7E'], far: '#545070', mid: '#6E6A62', ground: ['#7A6B73', '#5E5260'], flower: ['#F6E7A8', '#F2D27A', '#E86A4A'] },
  halloween: { sky: ['#33284A', '#5A3A5C', '#A8625A'], far: '#4A3854', mid: '#5A464C', ground: ['#6E5560', '#4E3E4A'], flower: ['#EE8A3C', '#F2B83A', '#9C7CC0'] },
  christmas: { sky: ['#2C3858', '#465A7A', '#7E8EA8'], far: '#C9D3DE', mid: '#E4EAF0', ground: ['#F4F6F8', '#DDE3EA'], flower: ['#E0403A', '#FFFFFF', '#4F8F6A'] },
  math: { sky: ['#DCE5EA', '#E8ECEA', '#F3EDE4'], far: '#B9CCD6', mid: '#A7BFCB', ground: ['#DCD6D6', '#C2BABC'], flower: ['#9FC3DD', '#C9DCE8', '#F2D27A'], sea: '#9DBFD1' },
  vietnamese: { sky: ['#EDE3D3', '#F2E8D6', '#F6EBDA'], far: '#C7CFA9', mid: '#B9C77F', ground: ['#E4D3C2', '#CFB9A2'], flower: ['#F0B48E', '#F2C96E', '#E8A07A'] },
  english: { sky: ['#E4DDE8', '#EDE6EA', '#F5ECE6'], far: '#CBBFD6', mid: '#B9B0C9', ground: ['#E2D5D6', '#C9B8BE'], flower: ['#C2A9D6', '#F4B7C0', '#E8C9E0'] },
  science: { sky: ['#DFE6D8', '#E9ECDD', '#F2EEDF'], far: '#B4C7A6', mid: '#9DB88A', ground: ['#D9D2C0', '#BFB49C'], flower: ['#F2D27A', '#E9A9A0', '#B8C98A'] },
};

const DARK = new Set<string>(['night', 'space', 'lantern', 'halloween', 'christmas']);
const MOON: Record<string, { x: number; y: number; r: number; c: string }> = { lantern: { x: 1200, y: 190, r: 110, c: '#FBE7A8' }, halloween: { x: 1220, y: 180, r: 92, c: '#F6E2B0' }, space: { x: 1250, y: 190, r: 80, c: '#E9C9A8' } };
const tri = (x: number, y: number, w: number, h: number) => `M${x} ${y - h}l${w / 2} ${h}h${-w}z`;
const pstar = (cx: number, cy: number, R: number) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const k = i % 2 ? R * 0.45 : R; d += `${i ? 'L' : 'M'}${(cx + k * Math.cos(a)).toFixed(1)} ${(cy + k * Math.sin(a)).toFixed(1)}`; } return `${d}z`; };
function Lantern({ x, y, c }: { x: number; y: number; c: string }) {
  return <g transform={`translate(${x} ${y})`}><path d="M0 -26v8" stroke="#7B5A4A" strokeWidth="3" /><rect x="-10" y="-20" width="20" height="6" rx="2" fill="#E9B949" /><ellipse cy="6" rx="26" ry="22" fill={c} /><path d="M-12 -12c-6 12-6 24 0 36M12 -12c6 12 6 24 0 36" stroke="#00000022" strokeWidth="3" fill="none" /><rect x="-10" y="26" width="20" height="6" rx="2" fill="#E9B949" /><path d="M-4 32v14M4 32v14M0 32v18" stroke="#F2C14B" strokeWidth="2" /></g>;
}

function rng(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

function SceneImpl({ name = 'meadow', blur = true }: { name?: SceneName; blur?: boolean }) {
  const p = PAL[name] ?? PAL.meadow;
  const r = rng(name.length * 977 + 13);
  const flowers = Array.from({ length: 34 }, () => ({ x: r() * 640 - 40, y: 520 + r() * 260, s: 14 + r() * 26, c: p.flower[Math.floor(r() * p.flower.length)] }));
  const flowersR = Array.from({ length: 16 }, () => ({ x: 1240 + r() * 400, y: 540 + r() * 240, s: 12 + r() * 20, c: p.flower[Math.floor(r() * p.flower.length)] }));
  const bokeh = Array.from({ length: 18 }, () => ({ x: r() * 1600, y: r() * 520, s: 10 + r() * 34, o: 0.08 + r() * 0.18 }));
  const isNight = DARK.has(name);
  const moon = MOON[name] ?? { x: 1260, y: 160, r: 70, c: '#F6EFD6' };
  const fence = name !== 'ocean' && name !== 'space';

  return (
    <div className={`scene ${blur ? 'blurred' : ''}`} aria-hidden>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`sky-${name}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.sky[0]} /><stop offset=".5" stopColor={p.sky[1]} /><stop offset="1" stopColor={p.sky[2]} /></linearGradient>
          <linearGradient id={`gr-${name}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.ground[0]} /><stop offset="1" stopColor={p.ground[1]} /></linearGradient>
          <radialGradient id={`sun-${name}`}><stop offset="0" stopColor="#FFF8E6" stopOpacity=".95" /><stop offset="1" stopColor="#FFF8E6" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="1600" height="900" fill={`url(#sky-${name})`} />
        <circle cx={isNight ? moon.x : 980} cy={isNight ? moon.y : 260} r={isNight ? moon.r : 260} fill={isNight ? moon.c : `url(#sun-${name})`} opacity={isNight ? 0.92 : 1} />
        {isNight && Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 397) % 1600} cy={(i * 131) % 420} r={1.5 + (i % 3)} fill="#FFF6D8" opacity=".7" />)}
        {/* biển / đồi xa */}
        {p.sea && <rect x="0" y="430" width="1600" height="90" fill={p.sea} opacity=".9" />}
        <path d="M0 470c160-50 320-60 520-20s360 30 520-10 360-30 560 10v90H0z" fill={p.far} opacity=".85" />
        {name === 'math' && <g fill="#C9D9E2" opacity=".9"><ellipse cx="420" cy="380" rx="110" ry="26" /><rect x="380" y="320" width="50" height="50" rx="10" fill="#E6EEF2" /><rect x="440" y="300" width="40" height="70" rx="10" fill="#DCE7EE" /><ellipse cx="1240" cy="340" rx="90" ry="22" /><rect x="1210" y="290" width="46" height="46" rx="10" fill="#E6EEF2" /></g>}
        {name === 'vietnamese' && <g opacity=".85"><path d="M260 470l90-70 90 70z" fill="#B86F55" /><rect x="285" y="470" width="130" height="60" fill="#E9D7C0" /><path d="M1180 470l70-56 70 56z" fill="#A86650" /><rect x="1200" y="470" width="100" height="50" fill="#E6D2BA" />{[120, 160, 1420, 1460, 1500].map((x) => <path key={x} d={`M${x} 540c-4-80 0-160 10-220`} stroke="#8FA868" strokeWidth="9" fill="none" />)}</g>}
        {name === 'english' && <g opacity=".8">{[[220, 300, 90], [330, 250, 80], [1180, 280, 100], [1300, 230, 70], [1390, 300, 90]].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height={540 - y} rx="16" fill={i % 2 ? '#D7CCE0' : '#E5DCE8'} />)}<g transform="translate(760 170)"><ellipse rx="56" ry="66" fill="#F4B7C0" /><path d="M-24 60h48l-8 34h-32z" fill="#C9A88A" /></g></g>}
        {name === 'science' && <g opacity=".85">{[140, 280, 1260, 1400, 1520].map((x, i) => <g key={x}><rect x={x - 10} y={340 + (i % 2) * 40} width="20" height="200" fill="#9C8468" /><circle cx={x} cy={320 + (i % 2) * 40} r={80 - (i % 3) * 10} fill={i % 2 ? '#9DB88A' : '#B4C79E'} /></g>)}<g transform="translate(420 500)"><rect x="-8" y="-40" width="16" height="40" fill="#F3E6D8" /><ellipse cy="-44" rx="40" ry="22" fill="#E9806A" /><circle cx="-14" cy="-50" r="6" fill="#fff" /></g></g>}
        {name === 'sakura' && <g opacity=".9">{[180, 1340, 1480].map((x, i) => <g key={x}><path d={`M${x} 560c-6-90 0-170 20-230`} stroke="#9C7468" strokeWidth="16" fill="none" />{[[0, 0, 110], [-70, 40, 80], [70, 30, 90]].map(([dx, dy, r], k) => <circle key={k} cx={x + 20 + dx} cy={300 + dy - i * 10} r={r} fill={k % 2 ? '#F4C6CF' : '#F8D6DC'} />)}</g>)}{Array.from({ length: 40 }, (_, i) => <ellipse key={i} cx={(i * 211) % 1600} cy={(i * 97) % 800} rx="6" ry="4" fill="#F4B7C0" opacity=".8" transform={`rotate(${i * 37} ${(i * 211) % 1600} ${(i * 97) % 800})`} />)}</g>}
        {name === 'snow' && <g>{[240, 1300, 1450].map((x) => <g key={x}><path d={`M${x} 280l-90 260h180z`} fill="#A9C2B4" /><path d={`M${x} 280l-40 116h80z`} fill="#fff" opacity=".85" /><rect x={x - 12} y="540" width="24" height="40" fill="#9C8468" /></g>)}<g transform="translate(700 560)"><circle r="46" fill="#fff" /><circle cy="-66" r="32" fill="#fff" /><path d="M-4 -66l26 6-26 6z" fill="#E2804F" /><circle cx="-10" cy="-74" r="4" fill="#4B3B3D" /><circle cx="8" cy="-74" r="4" fill="#4B3B3D" /></g>{Array.from({ length: 70 }, (_, i) => <circle key={i} cx={(i * 173) % 1600} cy={(i * 71) % 860} r={2 + (i % 4)} fill="#fff" opacity=".9" />)}</g>}
        {name === 'ocean' && <g>
          {[[120, 0.9], [260, 1.1], [1340, 1], [1480, 0.8]].map(([x, k]) => <path key={x} d={`M${x} 640c-30-60 30-110 0-170s30-110 0-160`} stroke="#6FA77F" strokeWidth={18 * k} fill="none" strokeLinecap="round" opacity=".85" />)}
          {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={(i * 263) % 1600} cy={80 + ((i * 149) % 480)} r={6 + (i % 5) * 4} fill="none" stroke="#fff" strokeWidth="3" opacity=".45" />)}
          {[[420, 300, '#F2B36B'], [1120, 220, '#F27B8E'], [760, 380, '#9FC3DD']].map(([x, y, c]) => <g key={String(x)} transform={`translate(${x} ${y})`}><ellipse rx="44" ry="24" fill={c as string} /><path d="M40 0l30-22v44z" fill={c as string} /><circle cx="-22" cy="-4" r="6" fill="#fff" /><circle cx="-22" cy="-4" r="3" fill="#3B3432" /></g>)}
        </g>}
        {name === 'castle' && <g opacity=".9">
          <rect x="560" y="300" width="480" height="240" fill="#F1E2EA" />
          {[560, 680, 800, 920, 1040].map((x, i) => <g key={x}><rect x={x - 40} y={i % 2 ? 250 : 200} width="80" height={i % 2 ? 290 : 340} fill={i % 2 ? '#EAD6E2' : '#F4E6EE'} /><path d={tri(x, i % 2 ? 250 : 200, 110, i % 2 ? 90 : 130)} fill={i % 2 ? '#C2A9D6' : '#E9A6BC'} /><path d={`M${x} ${(i % 2 ? 160 : 70)}v-30l26 10-26 10`} fill="#F27B8E" stroke="#B9A6A5" strokeWidth="3" />{[0, 1].map((r) => <rect key={r} x={x - 12} y={(i % 2 ? 290 : 250) + r * 80} width="24" height="34" rx="12" fill="#B9A3D6" />)}</g>)}
          <path d="M760 540v-90c0-30 80-30 80 0v90z" fill="#B9A3D6" />
        </g>}
        {name === 'space' && <g>
          {Array.from({ length: 90 }, (_, i) => <circle key={i} cx={(i * 397) % 1600} cy={(i * 131) % 520} r={1 + (i % 3)} fill="#FFF6D8" opacity={0.5 + (i % 4) * 0.12} />)}
          <g transform="translate(360 220)"><circle r="70" fill="#E9A6BC" /><ellipse rx="120" ry="22" fill="none" stroke="#F8E08A" strokeWidth="10" transform="rotate(-16)" /><circle cx="-20" cy="-18" r="12" fill="#F4C6CF" /></g>
          <circle cx="760" cy="140" r="30" fill="#9FC3DD" /><circle cx="560" cy="420" r="18" fill="#B8C98A" />
          {[[980, 330], [200, 420]].map(([x, y]) => <path key={x} d={pstar(x, y, 18)} fill="#F8E08A" />)}
        </g>}
        {name === 'tet' && <g>
          {[[200, '#F8CF1F', '#9C6B4E'], [1400, '#F4B7C0', '#8A5A4E']].map(([x, c, b]) => <g key={String(x)}><path d={`M${x} 560c-10-80 0-160 30-220M${x as number + 10} 420c40-30 90-40 130-30M${x as number + 20} 380c-40-40-90-50-130-40`} stroke={b as string} strokeWidth="14" fill="none" strokeLinecap="round" />{Array.from({ length: 34 }, (_, i) => <circle key={i} cx={(x as number) - 120 + ((i * 53) % 280)} cy={260 + ((i * 37) % 180)} r={12 + (i % 3) * 4} fill={c as string} opacity=".9" />)}</g>)}
          <path d="M0 60c400 60 1200 60 1600 0" stroke="#7B5A4A" strokeWidth="3" fill="none" />
          {[180, 420, 660, 940, 1180, 1420].map((x, i) => <Lantern key={x} x={x} y={110 + (i % 2) * 14} c={i % 2 ? '#E86A4A' : '#D9473E'} />)}
        </g>}
        {name === 'lantern' && <g>
          {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 397) % 1600} cy={(i * 131) % 420} r={1.5 + (i % 3)} fill="#FFF6D8" opacity=".6" />)}
          <path d="M0 90c400 70 1200 70 1600 0" stroke="#3E3048" strokeWidth="3" fill="none" />
          {[140, 360, 600, 860, 1080, 1460].map((x, i) => <Lantern key={x} x={x} y={140 + (i % 2) * 16} c={['#E86A4A', '#F2C14B', '#E0403A'][i % 3]} />)}
          {[[300, 420], [1340, 400]].map(([x, y]) => <g key={x}><path d={pstar(x, y, 46)} fill="#E0403A" stroke="#F2C14B" strokeWidth="4" /><path d={pstar(x, y, 18)} fill="#F8E08A" /></g>)}
        </g>}
        {name === 'halloween' && <g>
          {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 397) % 1600} cy={(i * 131) % 380} r={1.5 + (i % 3)} fill="#FFF6D8" opacity=".55" />)}
          {[[980, 140], [1080, 210], [1380, 120], [300, 180]].map(([x, y]) => <path key={x} d={`M${x} ${y}c-14-14-30-14-42-4 10 0 16 6 18 12 6-6 14-8 24-8 10 0 18 2 24 8 2-6 8-12 18-12-12-10-28-10-42 4z`} fill="#2B2236" />)}
          <path d="M220 560c-10-90 0-170 20-240M232 380l-60-50M236 340l70-60M228 440l-50-20" stroke="#3A2E3E" strokeWidth="16" fill="none" strokeLinecap="round" />
          {[[420, 610, 1], [1240, 600, 1.3], [1420, 640, 0.9]].map(([x, y, k]) => <g key={x} transform={`translate(${x} ${y}) scale(${k})`}><ellipse rx="56" ry="44" fill="#EE8A3C" /><path d="M0 -44v88M-26 -40c-14 24-14 56 0 80M26 -40c14 24 14 56 0 80" stroke="#D2702A" strokeWidth="4" fill="none" /><path d="M-26 -8l10-12 10 12zM6 -8l10-12 10 12z" fill="#FFD27A" /><path d="M-24 12c12 14 36 14 48 0-12 4-36 4-48 0z" fill="#FFD27A" /><rect x="-5" y="-58" width="10" height="16" rx="3" fill="#6E9A55" /></g>)}
        </g>}
        {name === 'christmas' && <g>
          <g transform="translate(1260 560)"><path d={tri(0, -120, 260, 140)} fill="#3F7F5A" /><path d={tri(0, -40, 300, 150)} fill="#4F8F6A" /><path d={tri(0, 40, 340, 150)} fill="#3F7F5A" /><rect x="-18" y="40" width="36" height="40" fill="#8A5636" />{[[-60, -60, '#E0403A'], [50, -90, '#F2C14B'], [-90, 10, '#9FC3DD'], [80, 0, '#E0403A'], [0, -20, '#F27B8E'], [-30, -150, '#9FC3DD'], [30, 20, '#F2C14B']].map(([x, y, c]) => <circle key={`${x}-${y}`} cx={x as number} cy={y as number} r="12" fill={c as string} />)}<path d={pstar(0, -270, 30)} fill="#F8CF1F" /></g>
          {[[1050, 600, '#E0605A'], [1110, 610, '#9FC3DD'], [1420, 606, '#F2C14B']].map(([x, y, c]) => <g key={String(x)}><rect x={x as number} y={y as number} width="54" height="44" rx="4" fill={c as string} /><rect x={(x as number) + 23} y={y as number} width="8" height="44" fill="#fff" /><rect x={x as number} y={(y as number) + 18} width="54" height="8" fill="#fff" /></g>)}
          {Array.from({ length: 70 }, (_, i) => <circle key={i} cx={(i * 173) % 1600} cy={(i * 71) % 860} r={2 + (i % 4)} fill="#fff" opacity=".9" />)}
        </g>}
        {name === 'beach' && <g opacity=".85"><path d="M1320 540c0-120 30-220 60-290" stroke="#9C8468" strokeWidth="14" fill="none" /><g fill="#8FB074">{[-60, -20, 20, 60, 100].map((a) => <ellipse key={a} cx="1380" cy="250" rx="90" ry="20" transform={`rotate(${a} 1380 250)`} />)}</g></g>}
        <path d="M0 530c200-40 420-50 640-20s420 20 620-10 260-10 340 10v60H0z" fill={p.mid} opacity=".9" />
        {/* hàng rào trắng */}
        {fence && <g opacity=".95">
          <rect x="0" y="560" width="900" height="12" rx="4" fill="#F3EEEA" />
          <rect x="0" y="600" width="900" height="12" rx="4" fill="#ECE6E1" />
          {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${i * 42 + 6} 650v-110l12-14 12 14v110z`} fill={i % 2 ? '#F6F2EE' : '#EFE9E4'} />)}
        </g>}
        {/* mặt đất */}
        <path d="M0 640c300-30 700-40 1000-20s450 20 600 0v300H0z" fill={`url(#gr-${name})`} />
        <g opacity=".25" stroke="#fff" strokeWidth="3" fill="none">{Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${(i * 173) % 1600} ${700 + (i * 53) % 180}l40 -8 30 14`} />)}</g>
        {/* hoa tiền cảnh trái */}
        <g>{flowers.map((f, i) => <g key={i} transform={`translate(${f.x} ${f.y})`}><path d={`M0 0v${f.s * 3}`} stroke="#6E9A55" strokeWidth={f.s / 6} /><ellipse cx="0" cy="0" rx={f.s * 0.55} ry={f.s * 0.7} fill={f.c} /></g>)}</g>
        <g>{flowersR.map((f, i) => <g key={i} transform={`translate(${f.x} ${f.y})`}><path d={`M0 0v${f.s * 3}`} stroke="#6E9A55" strokeWidth={f.s / 6} /><ellipse cx="0" cy="0" rx={f.s * 0.55} ry={f.s * 0.7} fill={f.c} /></g>)}</g>
        {/* bokeh */}
        <g>{bokeh.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={b.s} fill="#fff" opacity={b.o} />)}</g>
      </svg>
      <div className="scene-vignette" />
    </div>
  );
}
export const Scene = memo(SceneImpl);
