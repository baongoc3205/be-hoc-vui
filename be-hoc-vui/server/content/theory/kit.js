// Bộ dựng nội dung Góc lý thuyết. Mỗi bài: { id, subject, from, to (lớp), icon, title, intro, blocks }.
// Khối nội dung (block):
//   p     đoạn văn               { t:'p', text }
//   list  danh sách gạch đầu dòng { t:'list', items:[text] }
//   rule  khung ghi nhớ           { t:'rule', text }
//   f     công thức (không dịch)  { t:'f', items:[string] , note? }
//   table bảng                    { t:'table', head:[cell], rows:[[cell]] }  — cell là chuỗi hoặc {vi,en}
//   ex    ví dụ có lời giải       { t:'ex', q, a }
//   w     bảng tương tác          { t:'w', name:'times'|'add'|'primes'|'squares'|'periodic' }
//   nl    trục số minh hoạ        { t:'nl', op:'<'|'>'|'<='|'>=', v:number, label }
const L = (vi, en) => ({ vi, en: en ?? vi });
const cell = (c) => (Array.isArray(c) ? L(c[0], c[1]) : c);
export const K = {
  topic: (id, subject, from, to, icon, vi, en, introVi, introEn, blocks) => ({ id, subject, from, to, icon, title: L(vi, en), intro: L(introVi, introEn), blocks }),
  p: (vi, en) => ({ t: 'p', text: L(vi, en) }),
  list: (...items) => ({ t: 'list', items: items.map(([vi, en]) => L(vi, en)) }),
  rule: (vi, en) => ({ t: 'rule', text: L(vi, en) }),
  f: (items, note) => ({ t: 'f', items, note: note ? L(note[0], note[1]) : null }),
  table: (head, rows) => ({ t: 'table', head: head.map(cell), rows: rows.map((r) => r.map(cell)) }),
  ex: (qVi, qEn, aVi, aEn) => ({ t: 'ex', q: L(qVi, qEn), a: L(aVi, aEn) }),
  w: (name) => ({ t: 'w', name }),
  nl: (op, v, vi, en) => ({ t: 'nl', op, v, label: L(vi, en) }),
};
