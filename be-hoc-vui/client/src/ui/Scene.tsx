// Cảnh nền mờ kiểu "chụp ảnh xoá phông" như mẫu: bầu trời, biển, đồi, hoa, hàng rào, mặt đất.
// Toàn bộ vẽ bằng SVG, làm mờ bằng CSS để tạo chiều sâu.
import { memo } from 'react';

export type SceneName = 'meadow' | 'beach' | 'village' | 'night' | 'math' | 'vietnamese' | 'english' | 'science';

const PAL: Record<SceneName, { sky: [string, string, string]; far: string; mid: string; ground: [string, string]; flower: string[]; sea?: string }> = {
  meadow: { sky: ['#E9E2D6', '#F2E7D8', '#F6EADC'], far: '#C9D3C0', mid: '#B7C98A', ground: ['#E4D3CB', '#CDB8AE'], flower: ['#F2B83A', '#F4C64E', '#E9A62B', '#F6D27A'], sea: '#A9C8D6' },
  beach: { sky: ['#D9E6EC', '#EAEDE8', '#F6EADC'], far: '#C3D6DA', mid: '#E8D9BE', ground: ['#EEDFCC', '#D9C3A9'], flower: ['#F3A6A0', '#F7C9B5', '#E98B83'], sea: '#8FBCCD' },
  village: { sky: ['#E3E6D6', '#EEEBD8', '#F4EAD6'], far: '#B9C9A3', mid: '#A9C27A', ground: ['#DCCDB2', '#C2AE8E'], flower: ['#C9D86A', '#B4C957', '#DCE38A'] },
  night: { sky: ['#4B4566', '#6E6283', '#9A8293'], far: '#5F5A78', mid: '#6F7A6A', ground: ['#7A6B73', '#5E5260'], flower: ['#F6E7A8', '#F2D27A', '#FFF2C4'] },
  math: { sky: ['#DCE5EA', '#E8ECEA', '#F3EDE4'], far: '#B9CCD6', mid: '#A7BFCB', ground: ['#DCD6D6', '#C2BABC'], flower: ['#9FC3DD', '#C9DCE8', '#F2D27A'], sea: '#9DBFD1' },
  vietnamese: { sky: ['#EDE3D3', '#F2E8D6', '#F6EBDA'], far: '#C7CFA9', mid: '#B9C77F', ground: ['#E4D3C2', '#CFB9A2'], flower: ['#F0B48E', '#F2C96E', '#E8A07A'] },
  english: { sky: ['#E4DDE8', '#EDE6EA', '#F5ECE6'], far: '#CBBFD6', mid: '#B9B0C9', ground: ['#E2D5D6', '#C9B8BE'], flower: ['#C2A9D6', '#F4B7C0', '#E8C9E0'] },
  science: { sky: ['#DFE6D8', '#E9ECDD', '#F2EEDF'], far: '#B4C7A6', mid: '#9DB88A', ground: ['#D9D2C0', '#BFB49C'], flower: ['#F2D27A', '#E9A9A0', '#B8C98A'] },
};

function rng(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

function SceneImpl({ name = 'meadow', blur = true }: { name?: SceneName; blur?: boolean }) {
  const p = PAL[name] ?? PAL.meadow;
  const r = rng(name.length * 977 + 13);
  const flowers = Array.from({ length: 34 }, () => ({ x: r() * 640 - 40, y: 520 + r() * 260, s: 14 + r() * 26, c: p.flower[Math.floor(r() * p.flower.length)] }));
  const flowersR = Array.from({ length: 16 }, () => ({ x: 1240 + r() * 400, y: 540 + r() * 240, s: 12 + r() * 20, c: p.flower[Math.floor(r() * p.flower.length)] }));
  const bokeh = Array.from({ length: 18 }, () => ({ x: r() * 1600, y: r() * 520, s: 10 + r() * 34, o: 0.08 + r() * 0.18 }));
  const isNight = name === 'night';

  return (
    <div className={`scene ${blur ? 'blurred' : ''}`} aria-hidden>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`sky-${name}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.sky[0]} /><stop offset=".5" stopColor={p.sky[1]} /><stop offset="1" stopColor={p.sky[2]} /></linearGradient>
          <linearGradient id={`gr-${name}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.ground[0]} /><stop offset="1" stopColor={p.ground[1]} /></linearGradient>
          <radialGradient id={`sun-${name}`}><stop offset="0" stopColor="#FFF8E6" stopOpacity=".95" /><stop offset="1" stopColor="#FFF8E6" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="1600" height="900" fill={`url(#sky-${name})`} />
        <circle cx={isNight ? 1260 : 980} cy={isNight ? 160 : 260} r={isNight ? 70 : 260} fill={isNight ? '#F6EFD6' : `url(#sun-${name})`} opacity={isNight ? 0.9 : 1} />
        {isNight && Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 397) % 1600} cy={(i * 131) % 420} r={1.5 + (i % 3)} fill="#FFF6D8" opacity=".7" />)}
        {/* biển / đồi xa */}
        {p.sea && <rect x="0" y="430" width="1600" height="90" fill={p.sea} opacity=".9" />}
        <path d="M0 470c160-50 320-60 520-20s360 30 520-10 360-30 560 10v90H0z" fill={p.far} opacity=".85" />
        {name === 'math' && <g fill="#C9D9E2" opacity=".9"><ellipse cx="420" cy="380" rx="110" ry="26" /><rect x="380" y="320" width="50" height="50" rx="10" fill="#E6EEF2" /><rect x="440" y="300" width="40" height="70" rx="10" fill="#DCE7EE" /><ellipse cx="1240" cy="340" rx="90" ry="22" /><rect x="1210" y="290" width="46" height="46" rx="10" fill="#E6EEF2" /></g>}
        {name === 'vietnamese' && <g opacity=".85"><path d="M260 470l90-70 90 70z" fill="#B86F55" /><rect x="285" y="470" width="130" height="60" fill="#E9D7C0" /><path d="M1180 470l70-56 70 56z" fill="#A86650" /><rect x="1200" y="470" width="100" height="50" fill="#E6D2BA" />{[120, 160, 1420, 1460, 1500].map((x) => <path key={x} d={`M${x} 540c-4-80 0-160 10-220`} stroke="#8FA868" strokeWidth="9" fill="none" />)}</g>}
        {name === 'english' && <g opacity=".8">{[[220, 300, 90], [330, 250, 80], [1180, 280, 100], [1300, 230, 70], [1390, 300, 90]].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height={540 - y} rx="16" fill={i % 2 ? '#D7CCE0' : '#E5DCE8'} />)}<g transform="translate(760 170)"><ellipse rx="56" ry="66" fill="#F4B7C0" /><path d="M-24 60h48l-8 34h-32z" fill="#C9A88A" /></g></g>}
        {name === 'science' && <g opacity=".85">{[140, 280, 1260, 1400, 1520].map((x, i) => <g key={x}><rect x={x - 10} y={340 + (i % 2) * 40} width="20" height="200" fill="#9C8468" /><circle cx={x} cy={320 + (i % 2) * 40} r={80 - (i % 3) * 10} fill={i % 2 ? '#9DB88A' : '#B4C79E'} /></g>)}<g transform="translate(420 500)"><rect x="-8" y="-40" width="16" height="40" fill="#F3E6D8" /><ellipse cy="-44" rx="40" ry="22" fill="#E9806A" /><circle cx="-14" cy="-50" r="6" fill="#fff" /></g></g>}
        {name === 'beach' && <g opacity=".85"><path d="M1320 540c0-120 30-220 60-290" stroke="#9C8468" strokeWidth="14" fill="none" /><g fill="#8FB074">{[-60, -20, 20, 60, 100].map((a) => <ellipse key={a} cx="1380" cy="250" rx="90" ry="20" transform={`rotate(${a} 1380 250)`} />)}</g></g>}
        <path d="M0 530c200-40 420-50 640-20s420 20 620-10 260-10 340 10v60H0z" fill={p.mid} opacity=".9" />
        {/* hàng rào trắng */}
        <g opacity=".95">
          <rect x="0" y="560" width="900" height="12" rx="4" fill="#F3EEEA" />
          <rect x="0" y="600" width="900" height="12" rx="4" fill="#ECE6E1" />
          {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${i * 42 + 6} 650v-110l12-14 12 14v110z`} fill={i % 2 ? '#F6F2EE' : '#EFE9E4'} />)}
        </g>
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
