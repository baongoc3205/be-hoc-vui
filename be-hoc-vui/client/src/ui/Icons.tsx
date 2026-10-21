// Bộ icon tự vẽ bằng SVG theo phong cách mẫu: icon tài nguyên mềm có khối, glyph đơn sắc màu mauve,
// ô kỹ năng nền trầm có tia nắng + hình trắng.
import type { CSSProperties, ReactNode } from 'react';

type P = { size?: number; className?: string; style?: CSSProperties; title?: string };
const svgProps = (size: number, vb = '0 0 48 48', p: P = {}) => ({ width: size, height: size, viewBox: vb, className: p.className, style: p.style, 'aria-hidden': p.title ? undefined : true, role: p.title ? 'img' : undefined, 'aria-label': p.title });

// ---------------- Icon tài nguyên (có khối) ----------------
export function EnergyIcon({ size = 32, ...p }: P) {
  return (
    <svg {...svgProps(size, '0 0 48 48', p)}>
      <defs>
        <linearGradient id="en-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9EDB7E" /><stop offset="1" stopColor="#4FA35A" /></linearGradient>
        <linearGradient id="en-s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C9F0A8" /><stop offset=".55" stopColor="#7CC77A" /><stop offset="1" stopColor="#D9A3C6" /></linearGradient>
      </defs>
      <path d="M24 4.5c1.4 0 2.3.9 2.9 2.2l4.1 8.6 9.3 1.4c3 .5 3.6 3.3 1.6 5.2l-6.8 6.6 1.6 9.5c.5 2.9-1.9 4.5-4.4 3.2L24 36.8l-8.3 4.4c-2.5 1.3-4.9-.3-4.4-3.2l1.6-9.5-6.8-6.6c-2-1.9-1.4-4.7 1.6-5.2l9.3-1.4 4.1-8.6c.6-1.3 1.5-2.2 2.9-2.2z" fill="#3E8A4B" transform="translate(0 2)" />
      <path d="M24 4.5c1.4 0 2.3.9 2.9 2.2l4.1 8.6 9.3 1.4c3 .5 3.6 3.3 1.6 5.2l-6.8 6.6 1.6 9.5c.5 2.9-1.9 4.5-4.4 3.2L24 36.8l-8.3 4.4c-2.5 1.3-4.9-.3-4.4-3.2l1.6-9.5-6.8-6.6c-2-1.9-1.4-4.7 1.6-5.2l9.3-1.4 4.1-8.6c.6-1.3 1.5-2.2 2.9-2.2z" fill="url(#en-s)" />
      <path d="M17 17l7 3 7-3" stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M26.5 12.5l-7.5 11h5.5l-3 10 8.5-12.5h-5.7z" fill="#F7E58A" stroke="#C99B2A" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
export function CoinIcon({ size = 32, ...p }: P) {
  return (
    <svg {...svgProps(size, '0 0 48 48', p)}>
      <defs>
        <radialGradient id="co-g" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#FFE27A" /><stop offset=".6" stopColor="#F7B728" /><stop offset="1" stopColor="#E58A1A" /></radialGradient>
      </defs>
      <circle cx="24" cy="26" r="20" fill="#D9741A" />
      <circle cx="24" cy="23" r="20" fill="url(#co-g)" />
      <circle cx="24" cy="23" r="15" fill="none" stroke="#FFF1B8" strokeOpacity=".7" strokeWidth="1.6" />
      <g fill="#F08A1E"><circle cx="24" cy="16.5" r="4.6" /><circle cx="30.5" cy="23" r="4.6" /><circle cx="24" cy="29.5" r="4.6" /><circle cx="17.5" cy="23" r="4.6" /></g>
      <circle cx="24" cy="23" r="3.6" fill="#FFE68A" />
      <ellipse cx="17" cy="12" rx="5" ry="2.6" fill="#fff" opacity=".45" transform="rotate(-30 17 12)" />
    </svg>
  );
}
export function BronzeIcon({ size = 32, ...p }: P) {
  return (
    <svg {...svgProps(size, '0 0 48 48', p)}>
      <defs><radialGradient id="br-g" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#D8C2BB" /><stop offset=".7" stopColor="#A88C85" /><stop offset="1" stopColor="#8A6E68" /></radialGradient></defs>
      <circle cx="24" cy="26" r="20" fill="#7A5F59" />
      <circle cx="24" cy="23" r="20" fill="url(#br-g)" />
      <g fill="none" stroke="#8A6E68" strokeWidth="2.4"><circle cx="24" cy="16.5" r="4.6" /><circle cx="30.5" cy="23" r="4.6" /><circle cx="24" cy="29.5" r="4.6" /><circle cx="17.5" cy="23" r="4.6" /></g>
    </svg>
  );
}
export function StarIcon({ size = 32, filled = true, ...p }: P & { filled?: boolean }) {
  const d = 'M24 5l5.6 11.6 12.7 1.8-9.2 8.9 2.2 12.6L24 34l-11.3 5.9 2.2-12.6-9.2-8.9 12.7-1.8z';
  return (
    <svg {...svgProps(size, '0 0 48 48', p)}>
      {filled ? (
        <>
          <path d={d} fill="#D99A00" transform="translate(0 2)" strokeLinejoin="round" stroke="#D99A00" strokeWidth="3" />
          <path d={d} fill="#F8CF1F" stroke="#F8CF1F" strokeWidth="3" strokeLinejoin="round" />
          <path d="M18 17.5l4.5-1" stroke="#FFF6C4" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <path d={d} fill="#D9CBC6" stroke="#CDBDB7" strokeWidth="3" strokeLinejoin="round" />
      )}
    </svg>
  );
}
export function HeartIcon({ size = 32, filled = true, ...p }: P & { filled?: boolean }) {
  const d = 'M24 41s-15-8.6-15-20.2C9 14.6 13.4 10 18.8 10c2.4 0 4.2 1 5.2 2.6C25 11 26.8 10 29.2 10 34.6 10 39 14.6 39 20.8 39 32.4 24 41 24 41z';
  return (
    <svg {...svgProps(size, '0 0 48 48', p)}>
      {filled ? (<>
        <path d={d} fill="#C9566A" transform="translate(0 2)" />
        <path d={d} fill="#F27B8E" />
        <ellipse cx="17" cy="17" rx="3.5" ry="2.4" fill="#fff" opacity=".55" transform="rotate(-35 17 17)" />
      </>) : <path d={d} fill="#D9CBC6" />}
    </svg>
  );
}
export function TulipIcon({ size = 32, ...p }: P) {
  return (
    <svg {...svgProps(size, '0 0 48 48', p)}>
      <ellipse cx="15" cy="37" rx="8" ry="4.5" fill="#5E9A43" transform="rotate(-25 15 37)" />
      <ellipse cx="33" cy="37" rx="8" ry="4.5" fill="#4E8A3A" transform="rotate(25 33 37)" />
      <path d="M24 33V26" stroke="#4E8A3A" strokeWidth="3" />
      <path d="M12 12c4 2 7 2 8.5 6L24 12l3.5 6c1.5-4 4.5-4 8.5-6 1 10-3 17-12 17S11 22 12 12z" fill="#D9473E" />
      <path d="M24 12l3.5 6c1.5-4 4.5-4 8.5-6 1 10-3 17-12 17z" fill="#E86A4A" />
      <path d="M16 17c.5 3 1.8 5.4 3.8 7" stroke="#fff" strokeOpacity=".4" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
export function ChestIcon({ size = 48, open = false, ...p }: P & { open?: boolean }) {
  return (
    <svg {...svgProps(size, '0 0 64 64', p)}>
      <ellipse cx="32" cy="57" rx="22" ry="4" fill="#000" opacity=".12" />
      <rect x="9" y="28" width="46" height="26" rx="6" fill="#B57A52" />
      <rect x="9" y="28" width="46" height="8" fill="#9C6440" />
      {open ? (<>
        <path d="M9 28c0-12 46-12 46 0z" fill="#C88A60" transform="translate(0 -12) rotate(-12 10 28)" />
        <circle cx="32" cy="26" r="7" fill="#FFE27A" opacity=".9" />
        <path d="M20 22l-4-8M32 18v-9M44 22l4-8" stroke="#F8CF1F" strokeWidth="3" strokeLinecap="round" />
      </>) : (
        <path d="M9 28c0-12 46-12 46 0z" fill="#C88A60" />
      )}
      <rect x="27" y="24" width="10" height="16" rx="3" fill="#F2C14B" stroke="#C9932A" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="2" fill="#8A5A20" />
      <path d="M13 40h38" stroke="#fff" strokeOpacity=".2" strokeWidth="2" />
    </svg>
  );
}
export function LockIcon({ size = 24, ...p }: P) {
  return (
    <svg {...svgProps(size, '0 0 24 24', p)}>
      <path d="M7.5 10V8a4.5 4.5 0 019 0v2" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="4.5" y="10" width="15" height="11" rx="3.5" fill="currentColor" />
      <circle cx="12" cy="15.5" r="1.8" fill="#F8F0EA" />
    </svg>
  );
}
export function CrownIcon({ size = 24, ...p }: P) {
  return (
    <svg {...svgProps(size, '0 0 48 48', p)}>
      <path d="M8 36l-3-20 11 8 8-14 8 14 11-8-3 20z" fill="#E9A912" transform="translate(0 2)" />
      <path d="M8 36l-3-20 11 8 8-14 8 14 11-8-3 20z" fill="#F8CF1F" />
      <rect x="8" y="34" width="32" height="6" rx="2" fill="#F2B21B" />
      <circle cx="24" cy="27" r="3" fill="#E86A4A" />
    </svg>
  );
}

// ---------------- Glyph đơn sắc (dùng currentColor) ----------------
const GLYPHS: Record<string, ReactNode> = {
  calendar: <g fill="currentColor"><rect x="3" y="5" width="18" height="16" rx="4" opacity=".9" /><rect x="7" y="2.5" width="2.6" height="5" rx="1.3" /><rect x="14.4" y="2.5" width="2.6" height="5" rx="1.3" /><path d="M8 14.2l2.6 2.6L16.4 11" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></g>,
  back: <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />,
  plus: <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />,
  ring: <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="3.2" />,
  check: <path d="M5.5 12.5l4.5 4.5 8.5-10" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />,
  alert: <><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="M12 6.5v7" stroke="#7B6668" strokeWidth="3" strokeLinecap="round" /><circle cx="12" cy="17.3" r="1.7" fill="#7B6668" /></>,
  gear: <path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm8.3 5.2l1.7 1.3-2 3.5-2-.8a7.6 7.6 0 01-2.3 1.3l-.3 2.1h-4l-.3-2.1a7.6 7.6 0 01-2.3-1.3l-2 .8-2-3.5 1.7-1.3a7.8 7.8 0 010-2.6L2.8 9.8l2-3.5 2 .8a7.6 7.6 0 012.3-1.3L9.4 3.7h4l.3 2.1a7.6 7.6 0 012.3 1.3l2-.8 2 3.5-1.7 1.3a7.8 7.8 0 010 2.6z" fill="currentColor" fillRule="evenodd" />,
  home: <path d="M3.5 11.5L12 4l8.5 7.5V20a1 1 0 01-1 1H15v-6H9v6H4.5a1 1 0 01-1-1z" fill="currentColor" />,
  map: <path d="M3 6l6-2.5 6 2.5 6-2.5V18l-6 2.5L9 18l-6 2.5zM9 3.5V18M15 6v14.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />,
  bag: <><path d="M5 8h14l-1.2 12.2a1.5 1.5 0 01-1.5 1.3H7.7a1.5 1.5 0 01-1.5-1.3z" fill="currentColor" /><path d="M8.5 9V7a3.5 3.5 0 017 0v2" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></>,
  trophy: <path d="M7 3h10v2h3v2.5A4.5 4.5 0 0116.3 12 5.5 5.5 0 0113 14.6V17h3v4H8v-4h3v-2.4A5.5 5.5 0 017.7 12 4.5 4.5 0 014 7.5V5h3zm0 4H6v.5a2.5 2.5 0 001.2 2.1zM17 7v2.6A2.5 2.5 0 0018 7.5V7z" fill="currentColor" />,
  scroll: <path d="M6 3h11a3 3 0 013 3v1h-3v12a3 3 0 01-3 3H6a3 3 0 01-3-3v-1h3zm3 5h6M9 12h6M9 16h4" fill="currentColor" stroke="#F8F0EA" strokeWidth="1.6" strokeLinecap="round" />,
  user: <><circle cx="12" cy="8" r="4.5" fill="currentColor" /><path d="M3.5 21c.8-4.6 4.2-7 8.5-7s7.7 2.4 8.5 7z" fill="currentColor" /></>,
  speaker: <><path d="M4 9h4l5-4.5v15L8 15H4z" fill="currentColor" /><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></>,
  music: <path d="M9 17.5V5.5l11-2v12M9 17.5a3 3 0 11-3-3 3 3 0 013 3zm11-2a3 3 0 11-3-3 3 3 0 013 3z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />,
  flower: <g fill="currentColor"><circle cx="12" cy="7" r="3.6" /><circle cx="17" cy="12" r="3.6" /><circle cx="12" cy="17" r="3.6" /><circle cx="7" cy="12" r="3.6" /><circle cx="12" cy="12" r="2.5" fill="#F8F0EA" /></g>,
  pause: <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />,
  up: <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />,
  down: <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />,
  refresh: <path d="M19 12a7 7 0 11-2-4.9M19 4v4.5h-4.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />,
  chart: <path d="M4 20V10M10 20V5M16 20v-7M21 20H3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />,
  family: <g fill="currentColor"><circle cx="8" cy="7" r="3" /><circle cx="16.5" cy="8.5" r="2.5" /><path d="M2.5 19c.4-4 2.6-6 5.5-6s5.1 2 5.5 6zM12.5 19c.3-3 1.8-4.8 4-4.8s3.7 1.8 4 4.8z" /></g>,
  flame: <path d="M12 2.5c1 3.5 5.5 6 5.5 11a5.5 5.5 0 01-11 0c0-2.5 1.2-4 2.5-5 .1 1.8.8 3 2 3.5C10.5 9 11 5.5 12 2.5z" fill="currentColor" />,
  clock: <><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.6" /><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></>,
  book: <path d="M3 5.5C5.5 4 9 4 12 6c3-2 6.5-2 9-.5V19c-2.5-1.5-6-1.5-9 .5-3-2-6.5-2-9-.5zM12 6v13.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />,
  target: <><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" /><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2.4" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></>,
  medal: <><path d="M8 2.5h3l2 5-3 1.5zM16 2.5h-3l-2 5 3 1.5z" fill="currentColor" opacity=".7" /><circle cx="12" cy="15" r="6.5" fill="currentColor" /><path d="M12 11.5l1.1 2.3 2.4.3-1.8 1.6.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.6 2.4-.3z" fill="#F8F0EA" /></>,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor" />,
  heartWave: <path d="M12 20.5S3 15 3 8.8C3 6 5.1 4 7.7 4c1.8 0 3.3 1 4.3 2.3C13 5 14.5 4 16.3 4 18.9 4 21 6 21 8.8 21 15 12 20.5 12 20.5zM4 11.5c2.2 0 2.8-2 5-2s2.8 3 6 3 3.2-1.5 5-1.5" fill="currentColor" stroke="#F8F0EA" strokeWidth="1.6" strokeLinecap="round" />,
  burst: <path d="M12 2l2 6.5L20 5l-3.6 5.8L22 13l-6.2.9 2 6.6-5.4-4L8 21.5l.4-6.7L2 13.5l6-2.7L4.5 5 10.3 8z" fill="currentColor" />,
  bolt: <path d="M5 18l6-12 2 5 6-6-6 13-2-5z" fill="currentColor" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.2" />,
  shield: <path d="M12 2.5l8 3v6c0 5-3.5 8.7-8 10-4.5-1.3-8-5-8-10v-6zm0 4l-4.5 1.6v3.6c0 3 2 5.4 4.5 6.4 2.5-1 4.5-3.4 4.5-6.4V8.1z" fill="currentColor" fillRule="evenodd" />,
  boot: <path d="M8 3h6v7.5c3.5.5 6 2 6.5 5.5H11L8 13zM4 18h16.5v2.5H4z" fill="currentColor" />,
  sword: <path d="M12 2l3 4.5v8h-6v-8zM6.5 15h11v2.5h-11zM10.5 17.5h3V22h-3z" fill="currentColor" />,
  coin: <><circle cx="12" cy="12" r="9" fill="currentColor" /><g fill="#F8F0EA"><circle cx="12" cy="8.6" r="2.2" /><circle cx="15.4" cy="12" r="2.2" /><circle cx="12" cy="15.4" r="2.2" /><circle cx="8.6" cy="12" r="2.2" /></g></>,
  sparkle: <path d="M12 2c.8 5 2 6.2 7 7-5 .8-6.2 2-7 7-.8-5-2-6.2-7-7 5-.8 6.2-2 7-7zM19 15c.4 2.4 1 3 3 3.4-2 .4-2.6 1-3 3.4-.4-2.4-1-3-3-3.4 2-.4 2.6-1 3-3.4z" fill="currentColor" />,
  shirt: <path d="M8.5 3l3.5 2 3.5-2 5.5 3-2.5 4.5-2-1V21H7.5V9.5l-2 1L3 6z" fill="currentColor" />,
  globe: <><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" fill="none" stroke="currentColor" strokeWidth="2" /></>,
  sun: <><circle cx="12" cy="12" r="4.5" fill="currentColor" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></>,
  mountain: <path d="M2 20l7-12 4 6 3-4 6 10z" fill="currentColor" />,
  flag: <path d="M5 21V3.5M5 4h11l-2 4 2 4H5" fill="currentColor" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />,
  sprout: <path d="M12 21v-8M12 13C12 8 8 6 4 6c0 4 3 7 8 7zM12 11c0-4 3-7 8-7 0 5-3 7-8 7z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
  logout: <path d="M14 4H6v16h8M10 12h11M17 8l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />,
  trash: <path d="M5 7h14M10 3.5h4M7 7l1 13h8l1-13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />,
  edit: <path d="M4 20l1-4.5L15.5 5l3.5 3.5L8.5 19zM13.5 7l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />,
  ear: <path d="M8 9a5 5 0 0110 0c0 3-3 4-3 7a3 3 0 01-5 2M11 10a2 2 0 014 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />,
  hand: <path d="M7 12V6.5a1.5 1.5 0 013 0V11V4.5a1.5 1.5 0 013 0V11V5.5a1.5 1.5 0 013 0V12v-2.5a1.5 1.5 0 013 0V15a7 7 0 01-7 7c-3 0-4.5-1.5-6-4l-2.5-4a1.5 1.5 0 012.5-1.6z" fill="currentColor" />,
};
export function Glyph({ name, size = 22, ...p }: P & { name: keyof typeof GLYPHS | string }) {
  return <svg {...svgProps(size, '0 0 24 24', p)}>{GLYPHS[name] ?? GLYPHS.flower}</svg>;
}

// ---------------- Ô kỹ năng / thế giới (nền trầm + tia nắng + hình trắng) ----------------
const TILE_BG: Record<string, [string, string]> = {
  math: ['#8E9BA8', '#7A8794'], vietnamese: ['#B5A28F', '#A08D7A'], english: ['#A898AE', '#91829A'], science: ['#93A391', '#7E8F7C'],
  gold: ['#C9AE7A', '#B39866'], rose: ['#B99A9C', '#A38587'],
};
const TILE_ART: Record<string, ReactNode> = {
  math: (<g fill="#fff"><rect x="16" y="20" width="26" height="26" rx="6" /><rect x="50" y="20" width="26" height="26" rx="6" opacity=".85" /><rect x="33" y="54" width="26" height="26" rx="6" /><path d="M29 29v8M25 33h8" stroke="#8E9BA8" strokeWidth="3.4" strokeLinecap="round" /><path d="M59 33h8" stroke="#91A0AC" strokeWidth="3.4" strokeLinecap="round" /><path d="M40 63l12 8M52 63l-12 8" stroke="#8E9BA8" strokeWidth="3.4" strokeLinecap="round" /></g>),
  vietnamese: (<g fill="#fff"><path d="M20 70c8-2 14-8 18-16l26-30c3-3 8 1 5 5L45 59c-6 7-14 12-25 11z" /><circle cx="22" cy="70" r="4" /><text x="58" y="78" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="26">Ă</text></g>),
  english: (<g fill="#fff"><path d="M14 22h64a6 6 0 016 6v30a6 6 0 01-6 6H44l-14 12V64H14a6 6 0 01-6-6V28a6 6 0 016-6z" /><text x="46" y="52" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="22" fill="#A898AE">ABC</text></g>),
  science: (<g fill="#fff"><path d="M36 16h18v6h-3v16l16 26c3 5-1 12-7 12H30c-6 0-10-7-7-12l16-26V22h-3z" /><path d="M30 60h30" stroke="#93A391" strokeWidth="3" /><circle cx="40" cy="67" r="3" fill="#93A391" /><circle cx="50" cy="62" r="2" fill="#93A391" /><path d="M66 20c10 0 14 8 12 16-8 0-13-6-12-16z" /></g>),
};
export function SkillTile({ kind, size = 72, round = true, children }: { kind: string; size?: number; round?: boolean; children?: ReactNode }) {
  const [a, b] = TILE_BG[kind] ?? TILE_BG.rose;
  const id = `tile-${kind}`;
  const rays = Array.from({ length: 10 }, (_, i) => i * 36);
  return (
    <svg width={size} height={size} viewBox="0 0 92 92" aria-hidden className={round ? 'skill-tile round' : 'skill-tile'}>
      <defs>
        <radialGradient id={id} cx=".5" cy=".4" r=".8"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></radialGradient>
        <clipPath id={`${id}-c`}>{round ? <circle cx="46" cy="46" r="44" /> : <rect x="2" y="2" width="88" height="88" rx="16" />}</clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <rect width="92" height="92" fill={`url(#${id})`} />
        {rays.map((r) => <path key={r} d="M46 46L40 -20h12z" fill="#fff" opacity=".09" transform={`rotate(${r} 46 46)`} />)}
        <g filter="drop-shadow(0 2px 2px rgba(0,0,0,.18))">{children ?? TILE_ART[kind]}</g>
      </g>
      {round && <circle cx="46" cy="46" r="44" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="3" />}
    </svg>
  );
}

/** Icon game hiển thị trong ô (dùng glyph trắng lớn). */
const GAME_GLYPH: Record<string, ReactNode> = {
  'number-line': <g fill="#fff"><rect x="10" y="52" width="72" height="6" rx="3" />{[18, 34, 50, 66].map((x) => <rect key={x} x={x - 2} y="44" width="4" height="22" rx="2" />)}<path d="M50 40l-9-16h18z" /></g>,
  balance: <g fill="#fff"><rect x="43" y="22" width="6" height="50" rx="3" /><rect x="14" y="26" width="64" height="6" rx="3" /><path d="M8 52l12-20 12 20zM60 52l12-20 12 20z" opacity=".9" /><rect x="30" y="70" width="32" height="6" rx="3" /></g>,
  pizza: <g><circle cx="46" cy="46" r="30" fill="#fff" /><path d="M46 46V16a30 30 0 0 1 26 15z" fill="#F27B6E" /><path d="M46 46L72 31a30 30 0 0 1 0 30z" fill="#F27B6E" opacity=".75" /><circle cx="36" cy="56" r="4" fill="#E2B57A" /><circle cx="54" cy="62" r="3" fill="#E2B57A" /></g>,
  market: <g fill="#fff"><path d="M14 30h64l-6 32H22z" /><circle cx="28" cy="72" r="5" /><circle cx="64" cy="72" r="5" /><path d="M8 22h10l4 8" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" /><text x="46" y="54" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="20" fill="#B49BC4">đ</text></g>,
  'spot-mistake': <g><circle cx="40" cy="40" r="20" fill="none" stroke="#fff" strokeWidth="7" /><path d="M54 54l18 18" stroke="#fff" strokeWidth="9" strokeLinecap="round" /><path d="M33 33l14 14M47 33L33 47" stroke="#fff" strokeWidth="5" strokeLinecap="round" /></g>,
  sentence: <g fill="#fff"><rect x="10" y="26" width="30" height="16" rx="5" /><rect x="46" y="26" width="36" height="16" rx="5" opacity=".8" /><rect x="18" y="50" width="40" height="16" rx="5" opacity=".9" /><rect x="62" y="50" width="20" height="16" rx="5" /></g>,
  fishing: <g><path d="M24 14v28c0 8 12 8 12 0" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" /><path d="M74 58c0-10-12-16-24-16s-22 6-22 16 10 16 22 16 24-6 24-16z" fill="#fff" /><path d="M72 58l14-12v24z" fill="#fff" /><circle cx="40" cy="54" r="3.5" fill="#9FC3DD" /></g>,
  quiz: <text x="46" y="62" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="48" fill="#fff">?</text>,
  'true-false': <g stroke="#fff" strokeWidth="8" strokeLinecap="round" fill="none"><path d="M18 46l9 9 15-18" /><path d="M54 34l20 20M74 34L54 54" /></g>,
  'balloon-pop': <g fill="#fff"><ellipse cx="38" cy="38" rx="14" ry="17" /><ellipse cx="58" cy="44" rx="12" ry="15" opacity=".8" /><path d="M38 55l-2 20M58 59l2 16" stroke="#fff" strokeWidth="2" /></g>,
  'math-race': <g fill="#fff"><path d="M14 56l6-14c1-3 4-5 7-5h30c3 0 6 2 8 4l9 9c3 0 6 3 6 6v6H14z" /><circle cx="30" cy="64" r="7" stroke="#0002" strokeWidth="2" /><circle cx="64" cy="64" r="7" stroke="#0002" strokeWidth="2" /></g>,
  'fill-blank': <g fill="#fff"><rect x="12" y="34" width="20" height="8" rx="4" /><rect x="60" y="34" width="20" height="8" rx="4" /><rect x="36" y="28" width="20" height="20" rx="5" fill="none" stroke="#fff" strokeWidth="4" strokeDasharray="5 4" /><rect x="12" y="54" width="68" height="8" rx="4" opacity=".7" /></g>,
  'listen-pick': <g fill="#fff"><path d="M18 38h12l14-12v40L30 54H18z" /><path d="M54 34a14 14 0 010 24M62 26a24 24 0 010 40" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" /></g>,
  'drag-match': <g fill="#fff"><rect x="10" y="22" width="26" height="18" rx="5" /><rect x="10" y="52" width="26" height="18" rx="5" /><rect x="56" y="22" width="26" height="18" rx="5" /><rect x="56" y="52" width="26" height="18" rx="5" /><path d="M36 31c10 0 10 30 20 30M36 61c10 0 10-30 20-30" stroke="#fff" strokeWidth="4" fill="none" /></g>,
  memory: <g fill="#fff"><rect x="16" y="20" width="26" height="34" rx="5" transform="rotate(-8 29 37)" /><rect x="48" y="22" width="26" height="34" rx="5" transform="rotate(8 61 39)" opacity=".85" /><text x="30" y="46" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0003" transform="rotate(-8 29 37)">?</text></g>,
  'sort-order': <g fill="#fff"><rect x="18" y="56" width="14" height="16" rx="3" /><rect x="38" y="42" width="14" height="30" rx="3" /><rect x="58" y="26" width="14" height="46" rx="3" /></g>,
  'word-builder': <g fill="#fff"><rect x="10" y="32" width="22" height="26" rx="5" /><rect x="35" y="32" width="22" height="26" rx="5" /><rect x="60" y="32" width="22" height="26" rx="5" opacity=".75" /><text x="21" y="52" textAnchor="middle" fontWeight="800" fontSize="18" fill="#0004">A</text><text x="46" y="52" textAnchor="middle" fontWeight="800" fontSize="18" fill="#0004">B</text></g>,
  clock: <g><circle cx="46" cy="46" r="28" fill="#fff" /><path d="M46 28v18l12 8" stroke="#0004" strokeWidth="5" strokeLinecap="round" fill="none" /></g>,
  'catch-fall': <g fill="#fff"><path d="M16 50h60l-6 22H22z" /><circle cx="34" cy="26" r="7" /><circle cx="56" cy="18" r="6" opacity=".8" /><circle cx="48" cy="38" r="5" /></g>,
  'fruit-slice': <g><circle cx="40" cy="50" r="22" fill="#fff" /><path d="M40 28a22 22 0 0122 22H40z" fill="#fff" opacity=".6" /><path d="M14 74L78 16" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".9" /></g>,
  'candy-match': <g fill="#fff"><circle cx="24" cy="46" r="11" /><circle cx="46" cy="46" r="11" /><circle cx="68" cy="46" r="11" /><path d="M10 46l-6-6v12zM82 46l6-6v12z" opacity=".8" /><rect x="14" y="64" width="64" height="6" rx="3" opacity=".7" /></g>,
  slingshot: <g fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round"><path d="M30 76V48M30 48l-12-22M30 48l12-22" /><circle cx="66" cy="32" r="9" fill="#fff" stroke="none" /><path d="M46 30q10 -18 30 -6" strokeDasharray="3 7" strokeWidth="4" /></g>,
  'draw-trace': <g><path d="M16 66c10-26 22-30 30-16s22 10 30-14" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 9" /><path d="M58 22l14 14-30 30H28V52z" fill="#fff" /></g>,
  'type-answer': <g fill="#fff"><rect x="10" y="30" width="72" height="30" rx="8" /><rect x="20" y="38" width="5" height="14" rx="2" fill="#0004" /><rect x="14" y="66" width="12" height="10" rx="3" opacity=".8" /><rect x="30" y="66" width="12" height="10" rx="3" opacity=".8" /><rect x="46" y="66" width="12" height="10" rx="3" opacity=".8" /><rect x="62" y="66" width="16" height="10" rx="3" opacity=".8" /></g>,
  'multi-pick': <g><rect x="14" y="16" width="26" height="26" rx="7" fill="#fff" /><rect x="52" y="16" width="26" height="26" rx="7" fill="#fff" opacity=".7" /><rect x="14" y="50" width="26" height="26" rx="7" fill="#fff" opacity=".7" /><rect x="52" y="50" width="26" height="26" rx="7" fill="#fff" /><path d="M20 29l5 5 9-10M58 63l5 5 9-10" stroke="#0005" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>,
  reading: <g fill="#fff"><path d="M10 26c11-6 23-6 34 2v46c-11-8-23-8-34-2z" /><path d="M82 26c-11-6-23-6-34 2v46c11-8 23-8 34-2z" opacity=".85" /><path d="M17 38h20M17 47h20M17 56h14M55 38h20M55 47h20M55 56h14" stroke="#0003" strokeWidth="3" strokeLinecap="round" /></g>,
  boss: <g><path d="M18 64l-4-32 16 12 16-22 16 22 16-12-4 32z" fill="#fff" /><circle cx="46" cy="52" r="5" fill="#0003" /></g>,
  // trò chơi cùng bot / chơi chung — cùng kiểu glyph trắng trên ô tròn
  cards: <g><rect x="18" y="22" width="32" height="46" rx="6" fill="#fff" opacity=".75" transform="rotate(-14 34 45)" /><rect x="40" y="20" width="32" height="46" rx="6" fill="#fff" transform="rotate(10 56 43)" /><text x="56" y="52" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="22" fill="#0004" transform="rotate(10 56 43)">+2</text></g>,
  ludo: <g fill="#fff"><path d="M26 74c0-14 3-22 8-28-3-5-2-12 4-15l4 5c8 1 13 7 13 15l-7 3-4-4c0 10 3 17 8 24z" /><rect x="54" y="46" width="24" height="24" rx="6" opacity=".9" /><circle cx="60" cy="52" r="2.6" fill="#0004" /><circle cx="72" cy="64" r="2.6" fill="#0004" /><circle cx="66" cy="58" r="2.6" fill="#0004" /></g>,
  werewolf: <g fill="#fff"><circle cx="64" cy="26" r="11" opacity=".85" /><path d="M20 74l6-30 8 10 6-20 8 18 8-8 4 30z" /><circle cx="36" cy="58" r="3" fill="#0004" /><circle cx="50" cy="58" r="3" fill="#0004" /></g>,
  'quiz-duel': <g fill="#fff"><circle cx="30" cy="40" r="13" /><path d="M12 72c2-12 9-18 18-18s16 6 18 18z" /><circle cx="64" cy="40" r="13" opacity=".8" /><path d="M46 72c2-12 9-18 18-18s16 6 18 18z" opacity=".8" /><text x="47" y="30" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="20" fill="#fff">?</text></g>,
  chest: <g fill="#fff"><rect x="16" y="40" width="60" height="32" rx="6" /><path d="M16 40c0-16 60-16 60 0z" opacity=".85" /><rect x="40" y="36" width="12" height="18" rx="3" fill="#0003" /></g>,
};
export function GameTile({ game, size = 72, tone = 'rose' }: { game: string; size?: number; tone?: string }) {
  return <SkillTile kind={tone} size={size}>{GAME_GLYPH[game] ?? GAME_GLYPH.quiz}</SkillTile>;
}

/** Huy hiệu tròn (huy chương) với glyph. */
export function BadgeMedal({ icon, size = 64, earned = true }: { icon: string; size?: number; earned?: boolean }) {
  const map: Record<string, string> = { stars: 'star', flame2: 'flame', math: 'target', viet: 'book', eng: 'globe', sci: 'sprout', check: 'check', check2: 'check', up: 'up', up2: 'up', gem: 'sparkle', crown: 'trophy', calendar2: 'calendar' };
  return (
    <div className={`badge-medal ${earned ? '' : 'off'}`} style={{ width: size, height: size }}>
      <Glyph name={map[icon] ?? icon} size={size * 0.48} />
    </div>
  );
}
