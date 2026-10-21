// Chủ đề giao diện (theme): mỗi chủ đề có bảng màu riêng và một bản nhạc nền hợp không khí.
// Nhạc lấy từ Pixabay (Pixabay Content License — dùng miễn phí, không bắt buộc ghi nguồn; vẫn ghi để tôn trọng tác giả).
// File nhạc đặt ở client/public/music/<file>. Thiếu file thì app tự dùng nhạc tổng hợp nhẹ thay thế.
import type { LText } from './types';

export type ThemeId = 'fairy' | 'castle' | 'halloween' | 'paradise' | 'forest';

export interface Theme {
  id: ThemeId;
  name: LText;
  desc: LText;
  /** đường dẫn file nhạc */
  music: string;
  /** âm lượng riêng cho bản nhạc (0..1), bản nào to thì giảm bớt */
  volume: number;
  /** màu minh hoạ trong ô chọn chủ đề */
  swatch: [string, string, string];
  credit: string;
  source: string;
}

export const THEMES: Theme[] = [
  { id: 'fairy', name: { vi: 'Xứ cổ tích', en: 'Fairy tale' }, desc: { vi: 'Hồng kem dịu mắt, nhạc hộp nhạc vui tươi', en: 'Soft rose and cream with a music-box tune' }, music: '/music/fairy-tale-loop.mp3', volume: 0.75, swatch: ['#7b6668', '#f8f0ea', '#b2c739'], credit: 'Fairy Tale Loop — SergeQuadrado', source: 'https://pixabay.com/sound-effects/musical-fairy-tale-loop-275534/' },
  { id: 'castle', name: { vi: 'Lâu đài đêm', en: 'Night castle' }, desc: { vi: 'Tím than huyền bí, nhạc lâu đài về đêm', en: 'Mysterious indigo with a moonlit castle tune' }, music: '/music/forgotten-keep-night.mp3', volume: 0.7, swatch: ['#46406b', '#e9e4f4', '#9fb2ea'], credit: 'The Forgotten Keep (Night Version) — kaazoom', source: 'https://pixabay.com/sound-effects/musical-the-forgotten-keep-night-version-15-sec-stinger-572745/' },
  { id: 'halloween', name: { vi: 'Đêm bí ngô', en: 'Pumpkin night' }, desc: { vi: 'Cam bí ngô và tím đêm, nhạc rờn rợn vui vui', en: 'Pumpkin orange and night purple, a spooky-fun mood' }, music: '/music/halloween-atmosphere.mp3', volume: 0.5, swatch: ['#5a3a5e', '#fbeee0', '#f08a3c'], credit: 'Halloween Horror Atmosphere — AlesiaDavina', source: 'https://pixabay.com/sound-effects/horror-halloween-horror-atmosphere-193645/' },
  { id: 'paradise', name: { vi: 'Đảo thiên đường', en: 'Paradise island' }, desc: { vi: 'Biển xanh ngọc, cát vàng, nhạc nghỉ hè', en: 'Turquoise sea and golden sand with a holiday tune' }, music: '/music/welcome-to-paradise.mp3', volume: 0.7, swatch: ['#2f7f86', '#eef8f4', '#f6b84b'], credit: 'Welcome To Paradise — SergeQuadrado', source: 'https://pixabay.com/sound-effects/musical-welcome-to-paradise-251854/' },
  { id: 'forest', name: { vi: 'Suối rừng xanh', en: 'Forest stream' }, desc: { vi: 'Xanh rêu yên bình, tiếng suối chảy róc rách', en: 'Calm moss green with a babbling stream' }, music: '/music/water-streaming.mp3', volume: 0.85, swatch: ['#4f6b4a', '#eff3e6', '#c9b458'], credit: 'Water Streaming — Liecio', source: 'https://pixabay.com/sound-effects/nature-water-streaming-257590/' },
];

export const themeById = (id: string | undefined): Theme => THEMES.find((t) => t.id === id) ?? THEMES[0];
