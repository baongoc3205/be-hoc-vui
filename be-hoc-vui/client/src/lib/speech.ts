// Đọc to bằng Web Speech API (giọng có sẵn trên thiết bị).
import { getState } from './store';

let voices: SpeechSynthesisVoice[] = [];
if (typeof speechSynthesis !== 'undefined') {
  const load = () => { voices = speechSynthesis.getVoices(); };
  load();
  speechSynthesis.addEventListener?.('voiceschanged', load);
}
/** 'ok' có giọng; 'missing' máy đã liệt kê giọng nhưng không có giọng của ngôn ngữ này; 'unknown' chưa biết (một số máy không liệt kê). */
export function voiceStatus(lang: 'vi' | 'en'): 'ok' | 'missing' | 'unknown' | 'none' {
  if (typeof speechSynthesis === 'undefined') return 'none';
  if (!voices.length) return 'unknown';
  return hasVoice(lang) ? 'ok' : 'missing';
}
export function hasVoice(lang: 'vi' | 'en') {
  if (typeof speechSynthesis === 'undefined') return false;
  return voices.some((v) => v.lang.toLowerCase().startsWith(lang));
}
export function speak(text: string, lang: 'vi' | 'en', force = false) {
  if (typeof speechSynthesis === 'undefined') return false;
  if (!force && !getState().prefs.voice) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/___/g, '…'));
  u.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
  const v = voices.find((x) => x.lang.toLowerCase().startsWith(lang));
  if (v) u.voice = v;
  u.rate = lang === 'vi' ? 0.95 : 0.9;
  u.pitch = 1.1;
  speechSynthesis.speak(u);
  return true;
}
export const stopSpeak = () => { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); };
