// Sự kiện ngày lễ + cách tính giá cửa hàng (dùng chung cho server và client để giá luôn khớp nhau).
// Ngày tính theo giờ Việt Nam, dạng 'YYYY-MM-DD'.

/** Đồ thuộc chủ đề của ngày lễ đang diễn ra được giảm giá. */
export const EVENT_DISCOUNT = 0.3;
/** Mua cả combo (từ 2 món chưa có trở lên) rẻ hơn mua lẻ. */
export const COMBO_DISCOUNT = 0.2;
/** Quà xu khi bé đã có sẵn món quà của sự kiện. */
export const GIFT_COINS = 40;

// Ngày âm lịch đổi sang dương lịch
const TET = { 2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03', 2031: '01-23', 2032: '02-11', 2033: '01-31', 2034: '02-19', 2035: '02-08' };
const MOON = { 2025: '10-06', 2026: '09-25', 2027: '09-15', 2028: '10-03', 2029: '09-22', 2030: '09-12', 2031: '10-01', 2032: '09-19', 2033: '09-08', 2034: '09-27', 2035: '09-16' };

const shift = (day, n) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const fixed = (from, to) => (y) => [`${y}-${from}`, `${y}-${to}`];
const lunar = (table, before, after) => (y) => (table[y] ? [shift(`${y}-${table[y]}`, -before), shift(`${y}-${table[y]}`, after)] : null);

/** tag: chủ đề (bộ sưu tập) được giảm giá; gift: món quà tặng một lần mỗi mùa lễ. */
export const EVENTS = [
  { id: 'tet', tag: 'tet', icon: '🧧', gift: 'hold:lixi', when: lunar(TET, 14, 7), name: { vi: 'Tết Nguyên Đán', en: 'Lunar New Year' }, desc: { vi: 'Mặc áo mới, nhận lì xì đầu năm!', en: 'New clothes and lucky money!' } },
  { id: 'love', tag: 'love', icon: '💝', gift: 'acc:heartclip', when: fixed('02-07', '02-15'), name: { vi: 'Ngày yêu thương 14/2', en: 'Valentine’s Day' }, desc: { vi: 'Gửi trái tim cho người bé thương', en: 'Share a heart with someone you love' } },
  { id: 'women-3', tag: 'women', icon: '🌷', gift: 'hold:roses', when: fixed('03-01', '03-09'), name: { vi: 'Quốc tế Phụ nữ 8/3', en: 'Women’s Day (8 March)' }, desc: { vi: 'Diện đồ đẹp tặng hoa cho mẹ và bà', en: 'Dress up and give flowers to mum and grandma' } },
  { id: 'children', tag: 'party', icon: '🎈', gift: 'hold:pinwheel', when: fixed('05-25', '06-03'), name: { vi: 'Quốc tế Thiếu nhi 1/6', en: 'Children’s Day' }, desc: { vi: 'Ngày hội của các bé — tiệc tùng thôi!', en: 'A party just for kids!' } },
  { id: 'summer', tag: 'summer', icon: '🏖️', gift: 'hold:icecream', when: fixed('06-10', '08-15'), name: { vi: 'Hè rực rỡ', en: 'Sunny summer' }, desc: { vi: 'Đồ bơi, kính râm và kem mát lạnh', en: 'Swimsuits, sunglasses and ice cream' } },
  { id: 'school', tag: 'school', icon: '🎒', gift: 'hold:backpack', when: fixed('08-25', '09-08'), name: { vi: 'Ngày khai trường', en: 'Back to school' }, desc: { vi: 'Chuẩn bị đồ đẹp đón năm học mới', en: 'Get ready for the new school year' } },
  { id: 'national', tag: 'vietnam', icon: '🇻🇳', gift: 'hold:flag', when: fixed('08-28', '09-03'), name: { vi: 'Quốc khánh 2/9', en: 'National Day (2 Sept)' }, desc: { vi: 'Tự hào cờ đỏ sao vàng', en: 'Proud of the red flag with the yellow star' } },
  { id: 'moon', tag: 'moon', icon: '🏮', gift: 'hold:starlantern', when: lunar(MOON, 10, 3), name: { vi: 'Tết Trung thu', en: 'Mid-Autumn Festival' }, desc: { vi: 'Rước đèn ông sao, phá cỗ trông trăng', en: 'Star lanterns and mooncakes under the full moon' } },
  { id: 'women-10', tag: 'women', icon: '🌷', gift: 'hold:roses', when: fixed('10-13', '10-21'), name: { vi: 'Phụ nữ Việt Nam 20/10', en: 'Vietnamese Women’s Day' }, desc: { vi: 'Diện đồ đẹp tặng hoa cho mẹ và cô', en: 'Dress up and give flowers to mum and teachers' } },
  { id: 'halloween', tag: 'halloween', icon: '🎃', gift: 'hold:pumpkin', when: fixed('10-18', '11-01'), name: { vi: 'Lễ hội bí ngô', en: 'Halloween' }, desc: { vi: 'Hoá trang phù thuỷ, bí ngô, ma cà rồng', en: 'Dress up as a witch, a pumpkin or a vampire' } },
  { id: 'teacher', tag: 'teacher', icon: '💐', gift: 'hold:bouquet', when: fixed('11-13', '11-21'), name: { vi: 'Ngày Nhà giáo 20/11', en: 'Teachers’ Day' }, desc: { vi: 'Bó hoa tri ân thầy cô', en: 'Flowers to thank our teachers' } },
  { id: 'noel', tag: 'noel', icon: '🎄', gift: 'hold:candycane', when: fixed('12-10', '12-31'), name: { vi: 'Giáng sinh an lành', en: 'Merry Christmas' }, desc: { vi: 'Ông già Noel, chú lùn và người tuyết', en: 'Santa, elves and snowmen' } },
];

/** Các sự kiện đang diễn ra trong ngày `day` (kèm ngày bắt đầu/kết thúc). */
export function activeEvents(day) {
  const y = Number(day.slice(0, 4));
  const out = [];
  for (const e of EVENTS) {
    for (const yy of [y - 1, y]) {
      const w = e.when(yy);
      if (w && day >= w[0] && day <= w[1]) { const { when, ...rest } = e; out.push({ ...rest, start: w[0], end: w[1] }); break; }
    }
  }
  return out;
}
/** Sự kiện sắp tới gần nhất (để báo trước cho bé). */
export function nextEvent(day) {
  const y = Number(day.slice(0, 4));
  let best = null;
  for (const e of EVENTS) for (const yy of [y, y + 1]) {
    const w = e.when(yy);
    if (w && w[0] > day && (!best || w[0] < best.start)) { const { when, ...rest } = e; best = { ...rest, start: w[0], end: w[1] }; }
  }
  return best;
}
/** Mã đánh dấu bé đã nhận quà của một mùa lễ (lưu chung trong danh sách đồ đã có). */
export const giftKey = (ev) => `gift:${ev.id}@${ev.start}`;

const round10 = (p) => Math.max(10, Math.round(p / 10) * 10);
export const onSale = (tag, events) => !!tag && events.some((e) => e.tag === tag);

/** Giá một món (đã trừ giảm giá ngày lễ nếu có). Đồ miễn phí = 0. */
export function itemPrice(item, events = []) {
  if (!item || !item.price) return 0;
  return onSale(item.tag, events) ? round10(item.price * (1 - EVENT_DISCOUNT)) : item.price;
}

/**
 * Giá combo theo những món bé CHƯA có.
 * items: các món trong combo (đối tượng ShopItem). Trả về { price, full, missing }.
 * Còn 1 món thì tính như mua lẻ; từ 2 món trở lên giảm COMBO_DISCOUNT, đúng mùa lễ giảm thêm EVENT_DISCOUNT.
 */
export function comboPrice(combo, items, owned = [], events = []) {
  const missing = items.filter((i) => i.price > 0 && !owned.includes(i.id));
  const full = missing.reduce((a, i) => a + itemPrice(i, events), 0);
  if (!missing.length) return { price: 0, full: 0, missing: [] };
  if (missing.length === 1) return { price: full, full, missing: missing.map((i) => i.id) };
  const raw = missing.reduce((a, i) => a + i.price, 0);
  const off = COMBO_DISCOUNT + (onSale(combo.tag, events) ? EVENT_DISCOUNT : 0);
  return { price: Math.min(full, round10(raw * (1 - off))), full, missing: missing.map((i) => i.id) };
}

// ---------------- Hàng giới hạn theo mùa lễ ----------------
// Món/combo có `limited: true` luôn hiện trong cửa hàng nhưng chỉ mua được khi đang có sự kiện cùng `tag`.
// Hết đợt thì khoá lại (ai đã mua vẫn giữ), năm sau đúng dịp lại mở bán.
/** Món/combo này đang mua được không. */
export const forSale = (entry, events) => !entry || !entry.limited || onSale(entry.tag, events);
/**
 * Đợt bán của một chủ đề tính từ ngày `day`:
 * { open: true, start, end } nếu đang mở bán, hoặc { open: false, start, end } là đợt gần nhất sắp tới; null nếu chủ đề không có dịp lễ.
 */
export function saleWindow(tag, day) {
  const now = activeEvents(day).filter((e) => e.tag === tag).sort((a, b) => (a.end < b.end ? 1 : -1))[0];
  if (now) return { open: true, start: now.start, end: now.end, event: now.id };
  const y = Number(day.slice(0, 4));
  let best = null;
  for (const e of EVENTS) if (e.tag === tag) for (const yy of [y, y + 1]) {
    const w = e.when(yy);
    if (w && w[0] > day && (!best || w[0] < best.start)) best = { open: false, start: w[0], end: w[1], event: e.id };
  }
  return best;
}
/** Số ngày từ `day` tới `to` (cả hai dạng YYYY-MM-DD). */
export const daysBetween = (day, to) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${day}T12:00:00Z`)) / 864e5);
