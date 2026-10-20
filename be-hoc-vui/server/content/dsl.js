// Cú pháp rút gọn để soạn câu hỏi (dùng chung cho bank2-*.js). Xem giải thích ở đầu bank.js.
//   I(câu hỏi, đáp án, ...cách viết khác)          → tự điền đáp án (không phân biệt hoa thường, quên dấu được 0,6 điểm)
//   R(đoạn văn, [câu hỏi, đúng, ...nhiễu], ...)     → đọc hiểu: mỗi câu hỏi là một câu trắc nghiệm kèm đoạn văn
export const S = (s) => { const [vi, en] = String(s).split('|'); return { vi, en: en ?? vi }; };
export const M = (q, ...opts) => ({ kind: 'mc', prompt: S(q), options: opts.map(S) });
export const B = (q, ...opts) => ({ kind: 'mc', blank: true, prompt: S(q), options: opts.map(S) });
export const H = (say, lang, ...opts) => ({ kind: 'mc', listen: true, say: { text: say, lang }, prompt: S('Nghe và chọn đáp án đúng|Listen and choose'), options: opts.map(S) });
export const T = (q, a) => ({ kind: 'tf', prompt: S(q), answer: a });
export const P = (q, pairs) => ({ kind: 'pairs', prompt: S(q), pairs: pairs.map(([a, b]) => [S(a), S(b)]) });
export const O = (q, items) => ({ kind: 'order', prompt: S(q), items: items.map(S) });
export const W = (answer, q) => ({ kind: 'word', prompt: S(q), answer });
export const C = (q, ok, bad) => ({ kind: 'classify', prompt: S(q), items: [...ok.map((t) => ({ t: S(t), ok: true })), ...bad.map((t) => ({ t: S(t), ok: false }))] });
export const I = (q, answer, ...accept) => ({ kind: 'input', prompt: S(q), answer, accept });
export const R = (passage, ...qs) => qs.map(([q, ...opts]) => ({ kind: 'mc', passage: S(passage), prompt: S(q), options: opts.map(S) }));
/** Bộ game mặc định cho chủ đề có đọc hiểu + dạng đề mới. */
export const NEW_GAMES = ['reading', 'quiz', 'type-answer', 'multi-pick', 'drag-match', 'boss'];
