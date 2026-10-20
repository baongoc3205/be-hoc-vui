// Tiếng Việt / Ngữ văn — bảng dữ liệu để sinh đề theo mẫu, lớp 1–9.
import { L, mc, tf, input, sample, optCount, tierOf } from './engine.js';
import { shuffle } from '../../../shared/logic.js';

const pick = (rnd, a) => a[Math.floor(rnd() * a.length)];
export const list = (s) => s.split(';').map((x) => x.trim()).filter(Boolean);
const fill = (tpl, t, a) => L(tpl.replace(/\{t\}/g, L(t).vi).replace(/\{a\}/g, a ? L(a).vi : '').split('|')[0], tpl.split('|')[1] ? tpl.split('|')[1].replace(/\{t\}/g, L(t).en).replace(/\{a\}/g, a ? L(a).en : '') : undefined);

/**
 * Khái niệm phân nhóm: mỗi nhóm có nhãn, câu hỏi "…nào?", lệnh hứng và câu nhận định.
 * spec.cats = { khoá: [nhãn, câu hỏi nào, lệnh hứng, mẫu nhận định với {t}] }, spec.data = { khoá: 'a; b; c' }
 */
export function CAT(id, grade, title, spec) {
  const cats = {};
  for (const [k, [label, which, cat, stmt]] of Object.entries(spec.cats)) cats[k] = { label: L(label), which: L(which), catch: L(cat), stmt: (t) => fill(stmt, t) };
  const items = Object.entries(spec.data).flatMap(([k, s]) => list(s).map((t) => ({ t: L(t), a: k })));
  return { id, grade, title: L(title), cats, items, q: { fwd: (it) => fill(spec.fwd, it.t), title: spec.title ? L(spec.title) : undefined, pairs: spec.pairs ? L(spec.pairs) : undefined } };
}

/** Khái niệm đối chiếu một–một: 'trái=phải; …' */
export function MATCH(id, grade, title, data, q) {
  const items = list(data).map((s) => { const [t, a, ...acc] = s.split('=').map((x) => x.trim()); return { t: L(t), a: L(a), acc }; });
  return {
    id, grade, title: L(title), items,
    q: {
      fwd: (it) => fill(q.fwd, it.t), back: q.back ? (it) => fill(q.back, it.t, it.a) : undefined,
      tf: (it, a) => fill(q.tf, it.t, a), pairs: L(q.pairs),
      input: q.input ? (it) => (L(it.a).vi.length <= 22 ? { prompt: fill(q.input, it.t), answer: L(it.a).vi, accept: it.acc } : null) : undefined,
      blank: q.blank ? (it) => ({ prompt: fill(q.blank, it.t) }) : undefined,
    },
  };
}

// ---------------- Dấu thanh ----------------
const MARKS = { '̀': 'huyen', '́': 'sac', '̉': 'hoi', '̃': 'nga', '̣': 'nang' };
const MARK_OF = Object.fromEntries(Object.entries(MARKS).map(([m, k]) => [k, m]));
const toneOf = (w) => { for (const ch of w.normalize('NFD')) if (MARKS[ch]) return MARKS[ch]; return 'ngang'; };
function retone(w, tone) {
  const d = w.normalize('NFD');
  const i = [...d].findIndex((ch) => MARKS[ch]);
  if (i < 0) return null;
  const a = [...d]; a.splice(i, 1, ...(tone === 'ngang' ? [] : [MARK_OF[tone]]));
  return a.join('').normalize('NFC');
}
const SYLL = list('bà; cá; mẹ; lá; gà; nhà; cỏ; vở; bé; cũ; mũ; đỏ; chó; mèo; bò; hổ; vẽ; ngủ; sữa; quả; thỏ; múa; cửa; rổ; củ; bể; lửa; ngõ; giỏ; mắt; mặt; rễ; đũa; ghế; lọ; kẹo; nấm; bút; hạt; cờ; võng; cổ; dế; nụ; lúa; bưởi; chuối; trống');
const TONE_CATS = {
  ngang: ['Không dấu (thanh ngang)|No mark (level tone)', 'Tiếng nào KHÔNG có dấu thanh?|Which word has NO tone mark?', 'Hứng các tiếng KHÔNG có dấu!|Catch the words with NO tone mark!', '"{t}" không có dấu thanh.|"{t}" has no tone mark.'],
  huyen: ['Dấu huyền ( ` )|Grave mark (huyền)', 'Tiếng nào có dấu huyền?|Which word has the grave mark (huyền)?', 'Hứng các tiếng có DẤU HUYỀN!|Catch the words with the GRAVE mark!', '"{t}" có dấu huyền.|"{t}" has the grave mark (huyền).'],
  sac: ['Dấu sắc ( ´ )|Acute mark (sắc)', 'Tiếng nào có dấu sắc?|Which word has the acute mark (sắc)?', 'Hứng các tiếng có DẤU SẮC!|Catch the words with the ACUTE mark!', '"{t}" có dấu sắc.|"{t}" has the acute mark (sắc).'],
  hoi: ['Dấu hỏi ( ̉ )|Hook mark (hỏi)', 'Tiếng nào có dấu hỏi?|Which word has the hook mark (hỏi)?', 'Hứng các tiếng có DẤU HỎI!|Catch the words with the HOOK mark!', '"{t}" có dấu hỏi.|"{t}" has the hook mark (hỏi).'],
  nga: ['Dấu ngã ( ~ )|Tilde (ngã)', 'Tiếng nào có dấu ngã?|Which word has the tilde (ngã)?', 'Hứng các tiếng có DẤU NGÃ!|Catch the words with the TILDE!', '"{t}" có dấu ngã.|"{t}" has the tilde (ngã).'],
  nang: ['Dấu nặng ( . )|Dot below (nặng)', 'Tiếng nào có dấu nặng?|Which word has the dot below (nặng)?', 'Hứng các tiếng có DẤU NẶNG!|Catch the words with the DOT below!', '"{t}" có dấu nặng.|"{t}" has the dot below (nặng).'],
};
const tones = (() => {
  const c = CAT('tones', 1, 'Dấu thanh|Tone marks', { cats: TONE_CATS, data: {}, fwd: 'Tiếng "{t}" có dấu thanh gì?|Which tone mark is in "{t}"?' });
  c.items = SYLL.map((t) => ({ t: L(t), a: toneOf(t) }));
  c.q.say = 'vi';
  c.sayAlt = (it, rnd) => shuffle(rnd, Object.keys(TONE_CATS).filter((k) => k !== it.a).map((k) => retone(it.t.vi, k)).filter(Boolean));
  return c;
})();

// ---------------- Âm đầu, vần ----------------
const PICS = list('mèo=🐱; chó=🐶; gà=🐔; vịt=🦆; cá=🐟; bò=🐄; lợn=🐷; thỏ=🐰; ếch=🐸; khỉ=🐒; voi=🐘; hổ=🐯; ong=🐝; nhà=🏠; hoa=🌸; cây=🌳; xe=🚗; sao=⭐; mưa=🌧️; trăng=🌙; táo=🍎; chuối=🍌; nho=🍇; cam=🍊; bút=✏️; sách=📖; ghế=🪑; bóng=⚽; diều=🪁; mũ=👒; áo=👕; giày=👟; kem=🍦; bánh=🍰; sữa=🥛; trứng=🥚; cơm=🍚; thuyền=⛵; nấm=🍄; ngựa=🐴; rùa=🐢; cua=🦀; tôm=🦐; chim=🐦; lá=🍃; nến=🕯️; đèn=💡; ô=☂️').map((s) => s.split('='));
const ONSETS = ['ngh', 'ng', 'nh', 'gh', 'ch', 'tr', 'th', 'ph', 'kh', 'gi', 'b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n', 'r', 's', 't', 'v', 'x'];
const onsetOf = (w) => ONSETS.find((o) => w.normalize('NFC').toLowerCase().startsWith(o)) ?? '';
const pictures = {
  id: 'pictures', grade: 1, title: L('Ghép chữ theo hình', 'Words & pictures'),
  items: PICS.map(([w, e]) => ({ t: L(w), a: L(e), e })),
  q: {
    fwd: (it) => L(`Hình nào là "${it.t.vi}"?`, `Which picture is "${it.t.vi}"?`),
    back: (it) => L(`${it.e} là chữ gì?`, `${it.e} Which word is this?`),
    tf: (it, a) => L(`${a.vi} là "${it.t.vi}".`, `${a.vi} is "${it.t.vi}".`),
    pairs: L('Nối chữ với hình|Match word and picture'),
    say: 'vi',
    word: (it) => ({ prompt: L(`Ghép chữ: ${it.e}`, `Spell the Vietnamese word: ${it.e}`), answer: it.t.vi }),
    input: (it) => ({ prompt: L(`Viết tên: ${it.e}`, `Type the Vietnamese word: ${it.e}`), answer: it.t.vi }),
  },
};
const onsetData = {};
for (const [w] of PICS) { const o = onsetOf(w); if (o) (onsetData[o] ??= []).push(w); }
const onsetCats = {};
for (const o of Object.keys(onsetData)) onsetCats[o] = [`Âm "${o}"|The sound "${o}"`, `Tiếng nào bắt đầu bằng âm "${o}"?|Which word starts with "${o}"?`, `Hứng các tiếng bắt đầu bằng "${o}"!|Catch the words starting with "${o}"!`, `"{t}" bắt đầu bằng âm "${o}".|"{t}" starts with "${o}".`];
const onsets = CAT('onsets', 1, 'Âm đầu|First sounds', { cats: onsetCats, data: Object.fromEntries(Object.entries(onsetData).map(([k, v]) => [k, v.join('; ')])), fwd: 'Tiếng "{t}" bắt đầu bằng âm gì?|Which sound does "{t}" start with?' });

const rhymeSpec = { an: 'bàn; lan; tán; gan; đàn; hạn; cạn', ong: 'bóng; cong; dòng; mong; sóng; võng; trong', at: 'hát; mát; bát; cát; nhạt; khát', ăn: 'khăn; chăn; săn; lăn; cắn; ngắn', em: 'kem; tem; xem; nem; hẻm; kém', ôi: 'tôi; môi; đôi; gối; chổi; nồi', ua: 'cua; rùa; mua; vua; đùa; chua', ưa: 'mưa; dưa; cửa; sữa; ngựa; lửa' };
const rhymes = CAT('rhymes', 1, 'Vần|Rhymes', {
  cats: Object.fromEntries(Object.keys(rhymeSpec).map((r) => [r, [`Vần "${r}"|Rhyme "${r}"`, `Tiếng nào có vần "${r}"?|Which word has the rhyme "${r}"?`, `Hứng các tiếng có vần "${r}"!|Catch the words with the rhyme "${r}"!`, `"{t}" có vần "${r}".|"{t}" has the rhyme "${r}".`]])),
  data: rhymeSpec, fwd: 'Tiếng "{t}" có vần gì?|Which rhyme is in "{t}"?',
});

// ---------------- Chính tả ----------------
const SPELL = (id, grade, title, pairs) => CAT(id, grade, title, {
  cats: { ok: ['Viết đúng|Correct', 'Từ nào viết ĐÚNG chính tả?|Which word is spelled correctly?', 'Hứng các từ viết ĐÚNG chính tả!|Catch the correctly spelled words!', '"{t}" viết đúng chính tả.|"{t}" is spelled correctly.'], bad: ['Viết sai|Wrong', 'Từ nào viết SAI chính tả?|Which word is spelled wrongly?', 'Hứng các từ viết SAI chính tả!|Catch the misspelled words!', '"{t}" viết sai chính tả.|"{t}" is misspelled.'] },
  data: { ok: list(pairs).map((p) => p.split('/')[0]).join(';'), bad: list(pairs).map((p) => p.split('/')[1]).join(';') },
  fwd: 'Từ "{t}" viết đúng hay sai chính tả?|Is "{t}" spelled correctly?',
});
const spell1 = SPELL('spell-ckg', 1, 'Chính tả c/k, g/gh, ng/ngh|Spelling c/k, g/gh, ng/ngh', 'kẹo/cẹo; kim/cim; cá/ká; cô giáo/kô giáo; con kiến/con ciến; ghế/gế; gà/ghà; gỗ/ghỗ; ghép/gép; gạo/ghạo; nghỉ/ngỉ; nghé/ngé; nghe/nge; ngủ/nghủ; ngà voi/nghà voi; ngõ/nghõ; nghề/ngề; cái kéo/cái céo');
const spell2 = SPELL('spell-sx', 2, 'Chính tả s/x, tr/ch|Spelling s/x, tr/ch', 'xe đạp/se đạp; sân trường/xân trường; xinh đẹp/sinh đẹp; sáng sớm/xáng xớm; xôi gấc/sôi gấc; hoa sen/hoa xen; quả chuối/quả truối; ông trăng/ông chăng; cái trống/cái chống; chăm chỉ/trăm chỉ; trường học/chường học; cây tre/cây che; sương sớm/xương sớm; chân trời/trân chời');
const spell3 = SPELL('spell-ln', 3, 'Chính tả l/n, r/d/gi|Spelling l/n, r/d/gi', 'lá cây/ná cây; núi cao/lúi cao; lo lắng/no nắng; nồi cơm/lồi cơm; nước mắt/lước mắt; con dao/con rao; cá rô/cá dô; giữ gìn/dữ dìn; rau xanh/dau xanh; gió thổi/dó thổi; dòng sông/ròng sông; rổ rá/dổ dá; năm học/lăm học; lấp lánh/nấp nánh');

// ---------------- Từ loại ----------------
const W_THING = 'cái bàn; quyển vở; cây bút; bông hoa; con mèo; dòng sông; ngôi nhà; cánh đồng; bầu trời; chiếc xe; quả cam; cái cặp; con đường; ngọn núi; cơn mưa; cái ghế; con chim';
const W_PERSON = 'bác sĩ; cô giáo; học sinh; ông nội; bà ngoại; chú bộ đội; em bé; nông dân; công nhân; thầy giáo; chị gái';
const W_ACT = 'chạy; nhảy; đọc; viết; hát; múa; bơi; vẽ; nấu cơm; quét nhà; tưới cây; đá bóng; học bài; rửa bát; leo núi; trồng cây';
const W_FEAT = 'đỏ thắm; xanh biếc; cao lớn; xinh xắn; hiền lành; chăm chỉ; nhanh nhẹn; thơm ngát; ngọt lịm; mềm mại; rộng rãi; vui vẻ; dũng cảm; trắng tinh';
const classes2 = CAT('classes', 2, 'Từ chỉ sự vật, hoạt động, đặc điểm|Things, actions & features', {
  cats: {
    thing: ['Từ chỉ sự vật|A thing', 'Từ nào chỉ sự vật?|Which word names a thing?', 'Hứng các TỪ CHỈ SỰ VẬT!|Catch the THING words!', '"{t}" là từ chỉ sự vật.|"{t}" names a thing.'],
    person: ['Từ chỉ người|A person', 'Từ nào chỉ người?|Which word names a person?', 'Hứng các TỪ CHỈ NGƯỜI!|Catch the PEOPLE words!', '"{t}" là từ chỉ người.|"{t}" names a person.'],
    act: ['Từ chỉ hoạt động|An action', 'Từ nào chỉ hoạt động?|Which word is an action?', 'Hứng các TỪ CHỈ HOẠT ĐỘNG!|Catch the ACTION words!', '"{t}" là từ chỉ hoạt động.|"{t}" is an action word.'],
    feat: ['Từ chỉ đặc điểm|A feature', 'Từ nào chỉ đặc điểm?|Which word describes a feature?', 'Hứng các TỪ CHỈ ĐẶC ĐIỂM!|Catch the DESCRIBING words!', '"{t}" là từ chỉ đặc điểm.|"{t}" describes a feature.'],
  },
  data: { thing: W_THING, person: W_PERSON, act: W_ACT, feat: W_FEAT }, fwd: '"{t}" là từ chỉ gì?|What kind of word is "{t}"?', pairs: 'Nối từ với loại từ|Match word and word type',
});
const classes4 = CAT('wordclass', 4, 'Danh từ, động từ, tính từ|Nouns, verbs & adjectives', {
  cats: {
    n: ['Danh từ|Noun', 'Từ nào là danh từ?|Which word is a noun?', 'Hứng các DANH TỪ!|Catch the NOUNS!', '"{t}" là danh từ.|"{t}" is a noun.'],
    v: ['Động từ|Verb', 'Từ nào là động từ?|Which word is a verb?', 'Hứng các ĐỘNG TỪ!|Catch the VERBS!', '"{t}" là động từ.|"{t}" is a verb.'],
    a: ['Tính từ|Adjective', 'Từ nào là tính từ?|Which word is an adjective?', 'Hứng các TÍNH TỪ!|Catch the ADJECTIVES!', '"{t}" là tính từ.|"{t}" is an adjective.'],
  },
  data: { n: W_THING + ';' + W_PERSON, v: W_ACT + '; suy nghĩ; lắng nghe; chạy nhảy', a: W_FEAT + '; thông minh; xanh thẳm' }, fwd: '"{t}" thuộc từ loại nào?|Which word class is "{t}"?', pairs: 'Nối từ với từ loại|Match word and word class',
});
const sentences2 = CAT('sentences2', 2, 'Câu giới thiệu, câu nêu hoạt động, câu nêu đặc điểm|Kinds of sentences', {
  cats: {
    intro: ['Câu giới thiệu|Introducing', 'Câu nào là câu giới thiệu?|Which sentence introduces someone or something?', 'Hứng các CÂU GIỚI THIỆU!|Catch the INTRODUCING sentences!', '"{t}" là câu giới thiệu.|"{t}" is an introducing sentence.'],
    act: ['Câu nêu hoạt động|Action', 'Câu nào là câu nêu hoạt động?|Which sentence tells an action?', 'Hứng các CÂU NÊU HOẠT ĐỘNG!|Catch the ACTION sentences!', '"{t}" là câu nêu hoạt động.|"{t}" tells an action.'],
    feat: ['Câu nêu đặc điểm|Describing', 'Câu nào là câu nêu đặc điểm?|Which sentence describes a feature?', 'Hứng các CÂU NÊU ĐẶC ĐIỂM!|Catch the DESCRIBING sentences!', '"{t}" là câu nêu đặc điểm.|"{t}" describes a feature.'],
  },
  data: {
    intro: 'Đây là bạn Lan.; Mẹ em là bác sĩ.; Bố em là công nhân.; Con mèo là bạn của em.; Hà Nội là thủ đô.; Đây là lớp học của em.',
    act: 'Em đang học bài.; Bà tưới rau.; Các bạn đá cầu.; Chú mèo bắt chuột.; Bố đọc báo.; Mẹ nấu cơm.',
    feat: 'Bông hoa rất thơm.; Bầu trời xanh ngắt.; Bé Na rất ngoan.; Con đường nhỏ và dài.; Nước suối mát lạnh.; Quả cam chín vàng.',
  },
  fwd: '"{t}" là kiểu câu gì?|What kind of sentence is "{t}"?',
});

// ---------------- Trái nghĩa, đồng nghĩa ----------------
const ANT_Q = { fwd: 'Từ trái nghĩa với "{t}" là?|The opposite of "{t}" is?', back: 'Từ nào trái nghĩa với "{a}"?|Which word is the opposite of "{a}"?', tf: '"{t}" trái nghĩa với "{a}".|"{t}" is the opposite of "{a}".', pairs: 'Nối các cặp từ trái nghĩa|Match the opposites', input: 'Viết từ trái nghĩa với "{t}":|Type the opposite of "{t}":', blank: 'Trái nghĩa với "{t}" là ___.|The opposite of "{t}" is ___.' };
const ant1 = MATCH('antonyms1', 1, 'Từ trái nghĩa|Opposites', 'to=nhỏ=bé; cao=thấp; dài=ngắn; nóng=lạnh; ngày=đêm; vui=buồn; sáng=tối; trên=dưới; trước=sau; mở=đóng; đen=trắng; khóc=cười', ANT_Q);
const ant2 = MATCH('antonyms2', 2, 'Từ trái nghĩa|Opposites', 'nhanh=chậm; khỏe=yếu; mới=cũ; xa=gần; đúng=sai; dễ=khó; sạch=bẩn; nặng=nhẹ; già=trẻ; cứng=mềm; ướt=khô; đắt=rẻ; thắng=thua; vào=ra; lên=xuống; rộng=hẹp; yêu=ghét', ANT_Q);
const ant3 = MATCH('antonyms3', 3, 'Từ trái nghĩa (nâng cao)|Opposites (advanced)', 'siêng năng=lười biếng=lười nhác; thật thà=gian dối; dũng cảm=hèn nhát; giàu=nghèo; hiền lành=độc ác=hung dữ; khiêm tốn=kiêu căng=kiêu ngạo; đoàn kết=chia rẽ; hòa bình=chiến tranh; vui vẻ=buồn bã; rộng rãi=chật hẹp; ngăn nắp=bừa bộn; nhanh nhẹn=chậm chạp', ANT_Q);

const SYN = [['siêng năng', 'chăm chỉ', 'cần cù'], ['dũng cảm', 'can đảm', 'gan dạ'], ['xinh đẹp', 'xinh xắn', 'đẹp đẽ'], ['to lớn', 'khổng lồ', 'to tướng'], ['nhỏ bé', 'bé nhỏ', 'nhỏ xíu'], ['vui vẻ', 'vui tươi', 'hân hoan'], ['buồn bã', 'buồn rầu', 'ủ rũ'], ['Tổ quốc', 'đất nước', 'non sông'], ['thông minh', 'sáng dạ', 'lanh lợi'], ['hiền lành', 'hiền hậu', 'nhân hậu'], ['nhìn', 'ngắm', 'trông'], ['bao la', 'mênh mông', 'bát ngát'], ['yên tĩnh', 'tĩnh lặng', 'yên ắng'], ['lo lắng', 'lo âu', 'băn khoăn']];
const synonyms = {
  id: 'synonyms', grade: 3, title: L('Từ đồng nghĩa', 'Synonyms'),
  gen(rnd, kind, ctx = {}) {
    const g = pick(rnd, SYN); const [w, x] = sample(rnd, g, 2);
    const others = SYN.filter((y) => y !== g).flat();
    if (kind === 'mc') return mc(`Từ nào đồng nghĩa với "${w}"?|Which word is a synonym of "${w}"?`, x, shuffle(rnd, others), optCount(ctx));
    if (kind === 'tf') { const ok = rnd() < 0.5; const y = ok ? x : pick(rnd, others); return tf(`"${w}" và "${y}" là hai từ đồng nghĩa.|"${w}" and "${y}" are synonyms.`, ok); }
    if (kind === 'pairs') { const gs = sample(rnd, SYN, 3 + Math.min(2, tierOf(ctx))); return { kind: 'pairs', prompt: L('Nối các từ đồng nghĩa|Match the synonyms'), pairs: gs.map((y) => sample(rnd, y, 2).map((z) => L(z))) }; }
    if (kind === 'input') return input(`Viết một từ đồng nghĩa với "${w}":|Type a synonym of "${w}":`, x, g.filter((y) => y !== w && y !== x));
    return null;
  },
};

// ---------------- Dấu câu, so sánh, tên riêng, trạng ngữ ----------------
const punct = CAT('punct', 3, 'Dấu câu cuối câu|End punctuation', {
  cats: {
    q: ['Dấu chấm hỏi (?)|Question mark (?)', 'Câu nào cần đặt dấu chấm hỏi ở cuối?|Which sentence needs a question mark?', 'Hứng các câu cần DẤU CHẤM HỎI!|Catch the sentences that need "?"!', 'Cuối câu "{t}" đặt dấu chấm hỏi.|"{t}" ends with a question mark.'],
    d: ['Dấu chấm (.)|Full stop (.)', 'Câu nào cần đặt dấu chấm ở cuối?|Which sentence needs a full stop?', 'Hứng các câu cần DẤU CHẤM!|Catch the sentences that need "."!', 'Cuối câu "{t}" đặt dấu chấm.|"{t}" ends with a full stop.'],
    e: ['Dấu chấm than (!)|Exclamation mark (!)', 'Câu nào cần đặt dấu chấm than ở cuối?|Which sentence needs an exclamation mark?', 'Hứng các câu cần DẤU CHẤM THAN!|Catch the sentences that need "!"!', 'Cuối câu "{t}" đặt dấu chấm than.|"{t}" ends with an exclamation mark.'],
  },
  data: { q: 'Bạn tên là gì; Mấy giờ rồi; Ai đang hát thế; Bao giờ bạn về quê; Cậu có khỏe không', d: 'Em đi học lúc bảy giờ; Hôm nay trời nắng; Bố em là kĩ sư; Lớp em có ba mươi bạn; Cây bàng ra lá non', e: 'Ôi, đẹp quá; Chao ôi, vui thật; Hãy giữ trật tự; Đừng chạy ngoài hành lang; Trời ơi, mưa to quá' },
  fwd: 'Cuối câu "{t}" cần đặt dấu gì?|Which mark ends "{t}"?',
});
const similes = MATCH('similes', 3, 'Hình ảnh so sánh|Similes', 'Trắng như=tuyết; Đen như=than; Đỏ như=son; Nhanh như=chớp; Chậm như=rùa; Khỏe như=voi; Hiền như=Bụt; Nhát như=thỏ; Tròn như=quả bóng; Ngọt như=mía lùi; Cao như=núi; Sáng như=sao', { fwd: 'Điền tiếp hình ảnh so sánh: "{t} …"|Complete the simile: "{t} …"', tf: '"{t} {a}" là một hình ảnh so sánh quen thuộc.|"{t} {a}" is a common simile.', pairs: 'Ghép vế so sánh|Complete the similes', input: 'Điền tiếp: "{t} …"|Complete: "{t} …"', blank: '{t} ___.|{t} ___.' });
const properNames = SPELL('proper', 4, 'Viết hoa tên riêng|Capitalising proper names', 'Hà Nội/hà Nội; Việt Nam/việt nam; Nguyễn Trãi/Nguyễn trãi; Đà Nẵng/đà Nẵng; Phú Quốc/phú quốc; Lê Lợi/lê Lợi; Trần Hưng Đạo/Trần hưng Đạo; Cần Thơ/cần thơ; Hồ Chí Minh/Hồ chí Minh; sông Hồng/sông hồng; Hải Phòng/Hải phòng; Võ Thị Sáu/võ Thị Sáu');
properNames.title = L('Viết hoa tên riêng', 'Capitalising proper names');
const adverbials = CAT('adverbials', 4, 'Trạng ngữ|Adverbials', {
  cats: {
    time: ['Chỉ thời gian|Time', 'Trạng ngữ nào chỉ thời gian?|Which adverbial shows time?', 'Hứng các TRẠNG NGỮ CHỈ THỜI GIAN!|Catch the TIME adverbials!', '"{t}" là trạng ngữ chỉ thời gian.|"{t}" shows time.'],
    place: ['Chỉ nơi chốn|Place', 'Trạng ngữ nào chỉ nơi chốn?|Which adverbial shows place?', 'Hứng các TRẠNG NGỮ CHỈ NƠI CHỐN!|Catch the PLACE adverbials!', '"{t}" là trạng ngữ chỉ nơi chốn.|"{t}" shows place.'],
    cause: ['Chỉ nguyên nhân|Reason', 'Trạng ngữ nào chỉ nguyên nhân?|Which adverbial shows a reason?', 'Hứng các TRẠNG NGỮ CHỈ NGUYÊN NHÂN!|Catch the REASON adverbials!', '"{t}" là trạng ngữ chỉ nguyên nhân.|"{t}" shows a reason.'],
    goal: ['Chỉ mục đích|Purpose', 'Trạng ngữ nào chỉ mục đích?|Which adverbial shows a purpose?', 'Hứng các TRẠNG NGỮ CHỈ MỤC ĐÍCH!|Catch the PURPOSE adverbials!', '"{t}" là trạng ngữ chỉ mục đích.|"{t}" shows a purpose.'],
  },
  data: { time: 'Sáng nay,; Hè năm ngoái,; Lúc hoàng hôn,; Ngày mai,; Đêm qua,; Chiều chủ nhật,', place: 'Trên sân trường,; Ngoài vườn,; Dưới gốc cây,; Trong lớp học,; Bên bờ sông,', cause: 'Vì trời mưa,; Nhờ chăm chỉ,; Do bị ốm,; Tại mải chơi,; Vì cơn bão,', goal: 'Để học giỏi,; Để có sức khỏe,; Để kịp giờ học,; Nhằm bảo vệ môi trường,' },
  fwd: 'Trạng ngữ "{t}" chỉ điều gì?|What does the adverbial "{t}" show?', pairs: 'Nối trạng ngữ với ý nghĩa|Match adverbial and meaning',
});

// ---------------- Lớp 5: đại từ, kết từ, quan hệ từ, thành ngữ ----------------
const pronounsVi = CAT('pronouns-vi', 5, 'Đại từ|Pronouns', {
  cats: { y: ['Đại từ|Pronoun', 'Từ nào là đại từ?|Which word is a pronoun?', 'Hứng các ĐẠI TỪ!|Catch the PRONOUNS!', '"{t}" là đại từ.|"{t}" is a pronoun.'], n: ['Không phải đại từ|Not a pronoun', 'Từ nào KHÔNG phải đại từ?|Which word is NOT a pronoun?', 'Hứng các từ KHÔNG phải đại từ!|Catch words that are NOT pronouns!', '"{t}" không phải là đại từ.|"{t}" is not a pronoun.'] },
  data: { y: 'tôi; chúng tôi; chúng ta; nó; họ; mình; ta; chúng nó', n: 'công nhân; cái bàn; chăm chỉ; đục đẽo; trường học; xinh đẹp; dòng sông; học tập' },
  fwd: '"{t}" có phải là đại từ không?|Is "{t}" a pronoun?',
});
const connectors = CAT('connectors', 5, 'Cặp quan hệ từ|Connector pairs', {
  cats: {
    cause: ['Nguyên nhân – kết quả|Cause – effect', 'Cặp quan hệ từ nào chỉ nguyên nhân – kết quả?|Which pair shows cause – effect?', 'Hứng các cặp chỉ NGUYÊN NHÂN – KẾT QUẢ!|Catch CAUSE – EFFECT pairs!', '"{t}" chỉ quan hệ nguyên nhân – kết quả.|"{t}" shows cause – effect.'],
    contrast: ['Tương phản|Contrast', 'Cặp quan hệ từ nào chỉ tương phản?|Which pair shows contrast?', 'Hứng các cặp chỉ TƯƠNG PHẢN!|Catch CONTRAST pairs!', '"{t}" chỉ quan hệ tương phản.|"{t}" shows contrast.'],
    cond: ['Điều kiện – kết quả|Condition – result', 'Cặp quan hệ từ nào chỉ điều kiện – kết quả?|Which pair shows condition – result?', 'Hứng các cặp chỉ ĐIỀU KIỆN – KẾT QUẢ!|Catch CONDITION pairs!', '"{t}" chỉ quan hệ điều kiện – kết quả.|"{t}" shows condition – result.'],
    add: ['Tăng tiến|Addition', 'Cặp quan hệ từ nào chỉ tăng tiến?|Which pair shows addition?', 'Hứng các cặp chỉ TĂNG TIẾN!|Catch ADDITION pairs!', '"{t}" chỉ quan hệ tăng tiến.|"{t}" shows addition.'],
  },
  data: { cause: 'Vì … nên …; Do … nên …; Nhờ … mà …; Tại … nên …', contrast: 'Tuy … nhưng …; Mặc dù … nhưng …; Dù … nhưng …', cond: 'Nếu … thì …; Hễ … thì …; Giá … thì …', add: 'Không những … mà còn …; Chẳng những … mà còn …; Không chỉ … mà còn …' },
  fwd: 'Cặp "{t}" biểu thị quan hệ gì?|What does "{t}" show?', pairs: 'Nối cặp quan hệ từ với ý nghĩa|Match connector pair and meaning',
});
const idiomMeanings = MATCH('idioms', 5, 'Thành ngữ|Idioms', 'Ếch ngồi đáy giếng=hiểu biết hạn hẹp; Đầu voi đuôi chuột=đầu to cuối nhỏ, không đến nơi đến chốn; Chân cứng đá mềm=vượt qua mọi khó khăn; Nước đổ đầu vịt=nói mãi mà không tiếp thu; Mẹ tròn con vuông=sinh nở bình an; Ăn cháo đá bát=vô ơn, phụ lòng người giúp mình; Nước chảy đá mòn=kiên trì ắt thành công; Một nắng hai sương=làm lụng vất vả; Ba chìm bảy nổi=cuộc đời long đong, vất vả; Lên thác xuống ghềnh=trải qua nhiều gian nan; Mưa thuận gió hòa=thời tiết thuận lợi; Cầu được ước thấy=mong gì được nấy',
  { fwd: 'Thành ngữ "{t}" nghĩa là gì?|What does the idiom "{t}" mean?', back: 'Thành ngữ nào có nghĩa "{a}"?|Which idiom means "{a}"?', tf: '"{t}" nghĩa là {a}.|"{t}" means: {a}.', pairs: 'Nối thành ngữ với nghĩa|Match idiom and meaning' });

// ---------------- Lớp 6–9 ----------------
const laygh = CAT('laygh', 6, 'Từ láy và từ ghép|Reduplicative & compound words', {
  cats: { lay: ['Từ láy|Reduplicative', 'Từ nào là từ láy?|Which is a reduplicative word?', 'Hứng các TỪ LÁY!|Catch the REDUPLICATIVE words!', '"{t}" là từ láy.|"{t}" is a reduplicative word.'], ghep: ['Từ ghép|Compound', 'Từ nào là từ ghép?|Which is a compound word?', 'Hứng các TỪ GHÉP!|Catch the COMPOUND words!', '"{t}" là từ ghép.|"{t}" is a compound word.'] },
  data: { lay: 'lấp lánh; long lanh; xào xạc; rì rào; thướt tha; lom khom; mênh mông; chập chờn; lung linh; thăm thẳm; xinh xắn; nhỏ nhắn; lách tách; ríu rít; róc rách; khúc khích; bập bềnh; lững lờ', ghep: 'nhà cửa; xe đạp; hoa hồng; bàn ghế; sông núi; học sinh; quần áo; xe máy; sách vở; ông bà; cha mẹ; bánh mì; đường phố; máy bay; ăn uống; tàu hỏa' },
  fwd: '"{t}" là từ láy hay từ ghép?|Is "{t}" reduplicative or compound?',
});
const genres = CAT('genres', 6, 'Thể loại truyện dân gian|Folk-tale genres', {
  cats: {
    tt: ['Truyền thuyết|Legend', 'Tác phẩm nào là truyền thuyết?|Which work is a legend?', 'Hứng các TRUYỀN THUYẾT!|Catch the LEGENDS!', '"{t}" là truyền thuyết.|"{t}" is a legend.'],
    ct: ['Cổ tích|Fairy tale', 'Tác phẩm nào là truyện cổ tích?|Which work is a fairy tale?', 'Hứng các TRUYỆN CỔ TÍCH!|Catch the FAIRY TALES!', '"{t}" là truyện cổ tích.|"{t}" is a fairy tale.'],
    nn: ['Ngụ ngôn|Fable', 'Tác phẩm nào là truyện ngụ ngôn?|Which work is a fable?', 'Hứng các TRUYỆN NGỤ NGÔN!|Catch the FABLES!', '"{t}" là truyện ngụ ngôn.|"{t}" is a fable.'],
    tc: ['Truyện cười|Comic tale', 'Tác phẩm nào là truyện cười?|Which work is a comic tale?', 'Hứng các TRUYỆN CƯỜI!|Catch the COMIC TALES!', '"{t}" là truyện cười.|"{t}" is a comic tale.'],
  },
  data: { tt: 'Thánh Gióng; Sơn Tinh, Thủy Tinh; Con Rồng cháu Tiên; Sự tích Hồ Gươm; Bánh chưng, bánh giầy', ct: 'Tấm Cám; Thạch Sanh; Sọ Dừa; Cây khế; Cây tre trăm đốt', nn: 'Ếch ngồi đáy giếng; Thầy bói xem voi; Đẽo cày giữa đường; Chân, Tay, Tai, Mắt, Miệng', tc: 'Treo biển; Lợn cưới, áo mới; Mất rồi' },
  fwd: '"{t}" thuộc thể loại nào?|Which genre is "{t}"?', pairs: 'Nối tác phẩm với thể loại|Match work and genre',
});
const devices = CAT('devices', 6, 'Biện pháp tu từ|Figures of speech', {
  cats: {
    ss: ['So sánh|Simile', 'Câu nào dùng biện pháp so sánh?|Which line uses a simile?', 'Hứng các câu dùng SO SÁNH!|Catch the SIMILES!', '"{t}" dùng biện pháp so sánh.|"{t}" uses a simile.'],
    nh: ['Nhân hóa|Personification', 'Câu nào dùng biện pháp nhân hóa?|Which line uses personification?', 'Hứng các câu dùng NHÂN HÓA!|Catch the PERSONIFICATION!', '"{t}" dùng biện pháp nhân hóa.|"{t}" uses personification.'],
    hd: ['Hoán dụ|Metonymy', 'Câu nào dùng biện pháp hoán dụ?|Which line uses metonymy?', 'Hứng các câu dùng HOÁN DỤ!|Catch the METONYMY!', '"{t}" dùng biện pháp hoán dụ.|"{t}" uses metonymy.'],
    nq: ['Nói quá|Hyperbole', 'Câu nào dùng biện pháp nói quá?|Which line uses hyperbole?', 'Hứng các câu dùng NÓI QUÁ!|Catch the HYPERBOLE!', '"{t}" dùng biện pháp nói quá.|"{t}" uses hyperbole.'],
  },
  data: {
    ss: 'Trẻ em như búp trên cành; Mặt trời như quả cầu lửa; Mắt bé tròn như hạt nhãn; Trăng tròn như cái đĩa; Tiếng suối trong như tiếng hát xa',
    nh: 'Ông trời mặc áo giáp đen; Chị mây vừa kéo đến; Cây dừa dang tay đón gió; Bác gà trống gọi mặt trời; Lũ kiến rủ nhau đi tha mồi',
    hd: 'Bàn tay ta làm nên tất cả; Cả lớp cười ồ lên; Cả làng đi xem hội; Áo chàm đưa buổi phân li',
    nq: 'Cười vỡ bụng; Đẹp nghiêng nước nghiêng thành; Nghĩ nát óc; Lỗ mũi mười tám gánh lông',
  },
  fwd: '"{t}" dùng biện pháp tu từ nào?|Which device does "{t}" use?', pairs: 'Nối câu với biện pháp tu từ|Match line and device',
});
const hanviet = MATCH('hanviet', 6, 'Yếu tố Hán Việt|Sino-Vietnamese elements', 'thiên=trời; địa=đất; sơn=núi; thủy=nước; hỏa=lửa; nhân=người; gia=nhà; hải=biển; giang=sông; nguyệt=trăng; phụ=cha=bố; mẫu=mẹ; huynh=anh; đệ=em; mộc=cây; thạch=đá; vũ=mưa; phong=gió; điểu=chim; ngư=cá; mã=ngựa; thư=sách; quốc=đất nước=nước; tiểu=nhỏ=bé; đại=lớn=to; bạch=trắng; lão=già; ái=yêu; tâm=lòng=tim',
  { fwd: 'Yếu tố Hán Việt "{t}" nghĩa là gì?|What does the Sino-Vietnamese element "{t}" mean?', back: 'Yếu tố Hán Việt nào nghĩa là "{a}"?|Which element means "{a}"?', tf: '"{t}" nghĩa là "{a}".|"{t}" means "{a}".', pairs: 'Nối yếu tố Hán Việt với nghĩa|Match element and meaning', input: '"{t}" (Hán Việt) nghĩa là gì? Viết một từ.|What does "{t}" mean? Type one Vietnamese word.' });
const PROVERBS = 'Uống nước=nhớ nguồn; Ăn quả=nhớ kẻ trồng cây; Có công mài sắt=có ngày nên kim; Gần mực thì đen=gần đèn thì rạng; Lá lành=đùm lá rách; Tốt gỗ=hơn tốt nước sơn; Học thầy=không tày học bạn; Đói cho sạch=rách cho thơm; Thương người=như thể thương thân; Có chí=thì nên; Chuồn chuồn bay thấp=thì mưa; Tấc đất=tấc vàng; Không thầy=đố mày làm nên; Một con ngựa đau=cả tàu bỏ cỏ; Ăn trông nồi=ngồi trông hướng; Mưa tháng ba hoa đất=mưa tháng tư hư đất; Uốn cây từ thuở còn non=dạy con từ thuở con còn bi bô';
const proverbs = (() => {
  const c = MATCH('proverbs', 7, 'Tục ngữ|Proverbs', PROVERBS, { fwd: 'Điền vế còn lại: "{t}, …"|Complete the proverb: "{t}, …"', back: 'Vế nào đứng trước "{a}"?|Which half comes before "{a}"?', tf: '"{t}, {a}" là một câu tục ngữ.|"{t}, {a}" is a proverb.', pairs: 'Ghép hai vế câu tục ngữ|Match the halves of each proverb' });
  const last = (s) => s.split(' ').pop();
  c.q.blank = (it) => ({ prompt: L(`${it.t.vi}, ${it.a.vi.split(' ').slice(0, -1).join(' ')} ___.`), answer: L(last(it.a.vi)), wrong: c.items.filter((x) => last(x.a.vi) !== last(it.a.vi)).map((x) => L(last(x.a.vi))) });
  c.q.input = (it) => ({ prompt: L(`Điền từ cuối câu tục ngữ: "${it.t.vi}, ${it.a.vi.split(' ').slice(0, -1).join(' ')} …"`, `Type the last word: "${it.t.vi}, ${it.a.vi.split(' ').slice(0, -1).join(' ')} …"`), answer: last(it.a.vi) });
  return c;
})();
const adverbs7 = CAT('wordtypes7', 7, 'Phó từ, số từ, lượng từ|Adverbs, numerals & quantifiers', {
  cats: {
    pt: ['Phó từ|Adverb (phó từ)', 'Từ nào là phó từ?|Which is an adverb (phó từ)?', 'Hứng các PHÓ TỪ!|Catch the ADVERBS (phó từ)!', '"{t}" là phó từ.|"{t}" is an adverb (phó từ).'],
    st: ['Số từ|Numeral', 'Từ nào là số từ?|Which is a numeral?', 'Hứng các SỐ TỪ!|Catch the NUMERALS!', '"{t}" là số từ.|"{t}" is a numeral.'],
    lt: ['Lượng từ|Quantifier', 'Từ nào là lượng từ?|Which is a quantifier?', 'Hứng các LƯỢNG TỪ!|Catch the QUANTIFIERS!', '"{t}" là lượng từ.|"{t}" is a quantifier.'],
  },
  data: { pt: 'đã; đang; sẽ; rất; vẫn; chưa; cũng; lắm; quá', st: 'một; hai; ba; mười; trăm; thứ nhất; vài', lt: 'những; các; mọi; mỗi; từng' },
  fwd: '"{t}" thuộc từ loại nào?|Which word class is "{t}"?', pairs: 'Nối từ với từ loại|Match word and class',
});
const onomato = CAT('onomato', 8, 'Từ tượng thanh, từ tượng hình|Sound & image words', {
  cats: { th: ['Từ tượng thanh|Sound word', 'Từ nào là từ tượng thanh?|Which word imitates a sound?', 'Hứng các TỪ TƯỢNG THANH!|Catch the SOUND words!', '"{t}" là từ tượng thanh.|"{t}" imitates a sound.'], hi: ['Từ tượng hình|Image word', 'Từ nào là từ tượng hình?|Which word paints an image?', 'Hứng các TỪ TƯỢNG HÌNH!|Catch the IMAGE words!', '"{t}" là từ tượng hình.|"{t}" paints an image.'] },
  data: { th: 'róc rách; ầm ầm; lộp độp; ríu rít; khúc khích; oang oang; tích tắc; leng keng; lách cách; ào ào', hi: 'lom khom; lênh khênh; chót vót; ngoằn ngoèo; lấp ló; khấp khểnh; lò dò; thướt tha; nhấp nhô; lừ đừ' },
  fwd: '"{t}" là từ tượng thanh hay tượng hình?|Is "{t}" a sound word or an image word?',
});
const sentences8 = CAT('sentences8', 8, 'Câu nghi vấn, cầu khiến, cảm thán, trần thuật|Sentence types', {
  cats: {
    nv: ['Câu nghi vấn|Question', 'Câu nào là câu nghi vấn?|Which is a question?', 'Hứng các CÂU NGHI VẤN!|Catch the QUESTIONS!', '"{t}" là câu nghi vấn.|"{t}" is a question.'],
    ck: ['Câu cầu khiến|Command', 'Câu nào là câu cầu khiến?|Which is a command?', 'Hứng các CÂU CẦU KHIẾN!|Catch the COMMANDS!', '"{t}" là câu cầu khiến.|"{t}" is a command.'],
    ct: ['Câu cảm thán|Exclamation', 'Câu nào là câu cảm thán?|Which is an exclamation?', 'Hứng các CÂU CẢM THÁN!|Catch the EXCLAMATIONS!', '"{t}" là câu cảm thán.|"{t}" is an exclamation.'],
    tt: ['Câu trần thuật|Statement', 'Câu nào là câu trần thuật?|Which is a statement?', 'Hứng các CÂU TRẦN THUẬT!|Catch the STATEMENTS!', '"{t}" là câu trần thuật.|"{t}" is a statement.'],
  },
  data: { nv: 'Bạn đã ăn cơm chưa?; Ai đang hát thế?; Sao trời tối thế?; Mai cậu có đi học không?; Quyển sách này của ai?', ck: 'Hãy đóng cửa lại!; Đừng chạy ngoài hành lang!; Mời bạn ngồi.; Các em giữ trật tự nhé!; Chớ vứt rác bừa bãi!', ct: 'Ôi, đẹp quá!; Chao ôi, buồn thay!; Trời ơi, mưa to quá!; Biển rộng mênh mông quá!', tt: 'Hôm nay trời nắng.; Em đi học lúc bảy giờ.; Bố em là kĩ sư.; Lớp em có ba mươi bạn.; Cây bàng đã ra lá non.' },
  fwd: '"{t}" thuộc kiểu câu nào?|Which sentence type is "{t}"?', pairs: 'Nối câu với kiểu câu|Match sentence and type',
});
const particles = CAT('particles', 8, 'Trợ từ và thán từ|Particles & interjections', {
  cats: { tr: ['Trợ từ|Particle', 'Từ nào là trợ từ?|Which is a particle?', 'Hứng các TRỢ TỪ!|Catch the PARTICLES!', '"{t}" là trợ từ.|"{t}" is a particle.'], th: ['Thán từ|Interjection', 'Từ nào là thán từ?|Which is an interjection?', 'Hứng các THÁN TỪ!|Catch the INTERJECTIONS!', '"{t}" là thán từ.|"{t}" is an interjection.'] },
  data: { tr: 'chính; đích; ngay; cả; đến; chỉ', th: 'ôi; chao ôi; than ôi; ối; này; vâng; dạ' },
  fwd: '"{t}" là trợ từ hay thán từ?|Is "{t}" a particle or an interjection?',
});
const WORKS = 'Truyện Kiều=Nguyễn Du; Bình Ngô đại cáo=Nguyễn Trãi; Làng=Kim Lân; Lão Hạc=Nam Cao; Chiếc lược ngà=Nguyễn Quang Sáng; Bếp lửa=Bằng Việt; Đồng chí=Chính Hữu; Ánh trăng=Nguyễn Duy; Sang thu=Hữu Thỉnh; Mùa xuân nho nhỏ=Thanh Hải; Lặng lẽ Sa Pa=Nguyễn Thành Long; Đoàn thuyền đánh cá=Huy Cận; Tắt đèn=Ngô Tất Tố; Quê hương (thơ)=Tế Hanh; Nhớ rừng=Thế Lữ; Bánh trôi nước=Hồ Xuân Hương; Qua Đèo Ngang=Bà Huyện Thanh Quan; Cảnh khuya=Hồ Chí Minh; Lượm=Tố Hữu; Đêm nay Bác không ngủ=Minh Huệ; Dế Mèn phiêu lưu kí=Tô Hoài';
const works = MATCH('works', 8, 'Tác giả và tác phẩm|Authors & works', WORKS, { fwd: 'Tác phẩm "{t}" là của ai?|Who wrote "{t}"?', tf: '"{t}" là tác phẩm của {a}.|"{t}" was written by {a}.', pairs: 'Nối tác phẩm với tác giả|Match work and author', input: 'Ai là tác giả của "{t}"?|Who wrote "{t}"? Type the name.' });
const independent = CAT('independent', 9, 'Thành phần biệt lập|Independent elements', {
  cats: {
    tt: ['Tình thái|Modal', 'Từ ngữ nào là thành phần tình thái?|Which is a modal element?', 'Hứng các THÀNH PHẦN TÌNH THÁI!|Catch the MODAL elements!', '"{t}" là thành phần tình thái.|"{t}" is a modal element.'],
    ct: ['Cảm thán|Exclamatory', 'Từ ngữ nào là thành phần cảm thán?|Which is an exclamatory element?', 'Hứng các THÀNH PHẦN CẢM THÁN!|Catch the EXCLAMATORY elements!', '"{t}" là thành phần cảm thán.|"{t}" is an exclamatory element.'],
    gd: ['Gọi – đáp|Vocative', 'Từ ngữ nào là thành phần gọi – đáp?|Which is a vocative element?', 'Hứng các THÀNH PHẦN GỌI – ĐÁP!|Catch the VOCATIVE elements!', '"{t}" là thành phần gọi – đáp.|"{t}" is a vocative element.'],
  },
  data: { tt: 'có lẽ; chắc chắn; hình như; dường như; chắc hẳn; có vẻ như', ct: 'chao ôi; trời ơi; than ôi; ôi chao', gd: 'này; bác ơi; thưa ông; vâng; dạ; mẹ ơi' },
  fwd: '"{t}" thuộc thành phần biệt lập nào?|Which independent element is "{t}"?', pairs: 'Nối từ ngữ với thành phần biệt lập|Match phrase and element',
});

export const VI_CONCEPTS = {
  1: [tones, pictures, onsets, rhymes, spell1, ant1],
  2: [classes2, sentences2, spell2, ant2, pictures, tones],
  3: [synonyms, ant3, punct, similes, spell3, classes2],
  4: [classes4, adverbials, properNames, synonyms, ant3, spell3],
  5: [pronounsVi, connectors, idiomMeanings, synonyms, ant3, classes4],
  6: [laygh, genres, devices, hanviet, idiomMeanings, proverbs],
  7: [proverbs, adverbs7, devices, idiomMeanings, hanviet, synonyms],
  8: [onomato, sentences8, particles, works, hanviet, devices],
  9: [independent, works, devices, proverbs, connectors, onomato],
};
