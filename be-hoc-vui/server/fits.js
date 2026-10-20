// Bộ lọc câu hỏi theo loại game (dùng chung cho rounds.js và bộ dựng chặng luyện tập).
import { GAME_KIND } from '../shared/logic.js';

/** Chọn bộ lọc item phù hợp từng loại game. */
export function fits(game, item) {
  const kind = GAME_KIND[game];
  // câu đọc hiểu (có đoạn văn) dùng trong game Đọc hiểu và Đố vui (kèm đoạn văn)
  if (game === 'reading') return item.kind === 'mc' && !!item.passage;
  if (item.passage) return game === 'quiz';
  if (game === 'type-answer') return item.kind === 'input' || item.kind === 'word';
  if (game === 'multi-pick') return item.kind === 'classify';
  if (item.kind === 'input') return false;
  if (game === 'boss') return (item.kind === 'mc' && !item.listen) || item.kind === 'tf';
  if (item.kind !== kind) return false;
  if (game === 'listen-pick') return !!item.listen;
  if (game === 'fill-blank') return !!item.blank;
  if (kind === 'mc' && item.listen) return false;
  // mini game hành động: chữ trên trái cây / kẹo / bia phải ngắn
  if (['fruit-slice', 'candy-match', 'slingshot'].includes(game)) return item.options.every((o) => (typeof o === 'string' ? o : o.vi).length <= 26);
  return true;
}

export const T = (x) => (typeof x === 'string' ? { vi: x, en: x } : x);
export const NUMERIC = /^-?[\d.,/]+$/;
const UNIT = /^(-?[\d.,]+(?:\/\d+)?)\s?(cm|cm²|cm³|dm|dm²|m|m²|m³|km|km²|kg|g|l|ml|giờ|phút|giây|km\/giờ|°|°C|%)$/;

/** Đổi câu trắc nghiệm Toán (đáp án là số) thành câu tự điền. Trả về null nếu đề cần nhìn các lựa chọn mới làm được. */
export function mcToInput(it) {
  if (!it || it.kind !== 'mc' || it.listen || it.passage) return null;
  const right = T(it.options[0]);
  const vi = it.prompt.vi;
  if (/(^|\s)nào(\s|\?|$)/.test(vi) && !/là số nào\?$/.test(vi) && !/ hay /.test(vi)) return null;
  let answer = right.vi.replace(/−/g, '-'), unit = null;
  const m = answer.match(UNIT);
  if (m) { answer = m[1]; unit = m[2]; }
  if (!NUMERIC.test(answer)) return null;
  const unitEn = unit && T(right).en.match(UNIT)?.[2];
  return { kind: 'input', prompt: it.prompt, title: it.title ?? null, answer, unit: unit ? { vi: unit, en: unitEn ?? unit } : null };
}

