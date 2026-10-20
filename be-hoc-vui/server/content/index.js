// Danh mục nội dung: môn học, chủ đề, bài học (màn chơi), cửa hàng, huy hiệu, nhiệm vụ.
import { mathTopics } from './math.js';
import { mathTopics2 } from './math2.js';
import { bankTopics } from './bank.js';
import { viTopics2 } from './bank2-vi.js';
import { viTopics2b } from './bank2-vi2.js';
import { enTopics2 } from './bank2-en.js';
import { enTopics2b } from './bank2-en2.js';
import { sciTopics2 } from './bank2-sci.js';
import { sciTopics2b } from './bank2-sci2.js';

const L = (vi, en) => ({ vi, en: en ?? vi });

export const SUBJECTS = [
  { id: 'math', name: L('Toán', 'Maths'), world: L('Đảo Con Số', 'Number Island'), mascot: 'bo', color: '#8FB3C9' },
  { id: 'vietnamese', name: L('Tiếng Việt', 'Vietnamese'), world: L('Làng Chữ', 'Letter Village'), mascot: 'mochi', color: '#D9A07A' },
  { id: 'english', name: L('Tiếng Anh', 'English'), world: L('Thành Phố ABC', 'ABC Town'), mascot: 'foxy', color: '#B49BC4' },
  { id: 'science', name: L('Khoa học', 'Science'), world: L('Rừng Khám Phá', 'Discovery Woods'), mascot: 'kiwi', color: '#9DB88A' },
];

export const GAME_INFO = {
  quiz: { name: L('Đố vui', 'Quiz'), icon: 'quiz' },
  'true-false': { name: L('Đúng hay sai', 'True or false'), icon: 'tf' },
  'balloon-pop': { name: L('Bắn bóng bay', 'Balloon pop'), icon: 'balloon' },
  'math-race': { name: L('Đua xe Toán', 'Math race'), icon: 'race' },
  'fill-blank': { name: L('Điền chỗ trống', 'Fill the gap'), icon: 'blank' },
  'listen-pick': { name: L('Nghe và chọn', 'Listen & pick'), icon: 'listen' },
  'drag-match': { name: L('Nối cặp', 'Match pairs'), icon: 'match' },
  memory: { name: L('Lật thẻ trí nhớ', 'Memory cards'), icon: 'memory' },
  'sort-order': { name: L('Sắp xếp', 'Sort it'), icon: 'sort' },
  'word-builder': { name: L('Ghép chữ', 'Word builder'), icon: 'word' },
  clock: { name: L('Xem đồng hồ', 'Clock'), icon: 'clock' },
  'catch-fall': { name: L('Hứng đồ', 'Catch it'), icon: 'catch' },
  'fruit-slice': { name: L('Chém trái cây', 'Fruit slice'), icon: 'slice' },
  'candy-match': { name: L('Xếp kẹo', 'Candy match'), icon: 'candy' },
  slingshot: { name: L('Bắn ná', 'Slingshot'), icon: 'sling' },
  'draw-trace': { name: L('Bé tập vẽ', 'Trace & draw'), icon: 'draw' },
  'type-answer': { name: L('Tự điền đáp án', 'Type the answer'), icon: 'type' },
  'multi-pick': { name: L('Chọn nhiều đáp án', 'Pick them all'), icon: 'multi' },
  reading: { name: L('Đọc hiểu', 'Reading'), icon: 'read' },
  boss: { name: L('Thử thách trùm', 'Boss challenge'), icon: 'boss' },
  chest: { name: L('Rương báu', 'Treasure chest'), icon: 'chest' },
};

const MATH = [...mathTopics, ...mathTopics2].map((t) => ({ ...t, subject: 'math' }));

/** Chủ đề "Ôn tập tổng hợp" mỗi lớp: trộn đề từ mọi bộ sinh đề Toán của lớp đó, có thêm dạng tự điền và chọn nhiều đáp án. */
const mathReview = Array.from({ length: 9 }, (_, i) => {
  const grade = i + 1;
  const src = MATH.filter((t) => t.grade === grade);
  return {
    id: `m${grade}r`, subject: 'math', grade, title: L(`Ôn tập tổng hợp lớp ${grade}`, `Grade ${grade} mixed review`),
    games: ['type-answer', 'multi-pick', 'quiz', 'type-answer', 'true-false', 'boss'],
    gen(rnd, kind) {
      const start = Math.floor(rnd() * src.length);
      for (let k = 0; k < src.length; k++) { const it = src[(start + k) % src.length].gen(rnd, kind); if (it) return it; }
      return null;
    },
  };
});

export const TOPICS = [...MATH, ...mathReview, ...bankTopics, ...viTopics2, ...viTopics2b, ...enTopics2, ...enTopics2b, ...sciTopics2, ...sciTopics2b];
export const topicById = new Map(TOPICS.map((t) => [t.id, t]));

/** Sinh danh sách bài học (màn) cho từng chủ đề. Sau màn thứ 3 có một rương báu. */
function buildLessons() {
  const lessons = [];
  for (const subject of SUBJECTS) {
    for (let grade = 1; grade <= 9; grade++) {
      const topics = TOPICS.filter((t) => t.subject === subject.id && t.grade === grade);
      let order = 0;
      for (const topic of topics) {
        topic.games.forEach((game, i) => {
          const boss = game === 'boss';
          lessons.push({
            id: `${topic.id}-${i + 1}`, topicId: topic.id, subject: subject.id, grade, order: order++,
            game, kind: boss ? 'boss' : 'normal',
            coins: boss ? 30 : 15 + Math.min(grade, 5), xp: boss ? 120 : 50 + grade * 5,
            hearts: boss ? 3 : null,
          });
          if (i === 2) lessons.push({ id: `${topic.id}-chest`, topicId: topic.id, subject: subject.id, grade, order: order++, game: 'chest', kind: 'chest', coins: 25, xp: 0, hearts: null });
        });
      }
    }
  }
  return lessons;
}
export const LESSONS = buildLessons();
export const lessonById = new Map(LESSONS.map((l) => [l.id, l]));
export const lessonsFor = (subject, grade) => LESSONS.filter((l) => l.subject === subject && l.grade === grade);

// ---------------- Cửa hàng (xu ảo, không có tiền thật) ----------------
export const SHOP = [
  // kiểu tóc
  { id: 'hair:bob', slot: 'hair', value: 'bob', price: 0, name: L('Tóc ngắn', 'Bob cut') },
  { id: 'hair:twin', slot: 'hair', value: 'twin', price: 0, name: L('Tóc buộc hai bên', 'Twin tails') },
  { id: 'hair:spiky', slot: 'hair', value: 'spiky', price: 60, name: L('Tóc dựng', 'Spiky') },
  { id: 'hair:long', slot: 'hair', value: 'long', price: 80, name: L('Tóc dài', 'Long hair') },
  { id: 'hair:bun', slot: 'hair', value: 'bun', price: 90, name: L('Búi tóc', 'Bun') },
  { id: 'hair:ponytail', slot: 'hair', value: 'ponytail', price: 70, name: L('Tóc đuôi ngựa', 'Ponytail') },
  { id: 'hair:curly', slot: 'hair', value: 'curly', price: 100, name: L('Tóc xoăn bồng', 'Curly cloud') },
  { id: 'hair:braids', slot: 'hair', value: 'braids', price: 110, name: L('Tóc tết hai bên', 'Braids') },
  { id: 'hair:pixie', slot: 'hair', value: 'pixie', price: 60, name: L('Tóc tém', 'Pixie cut') },
  // màu tóc
  { id: 'hairColor:cocoa', slot: 'hairColor', value: '#6B4A3A', price: 0, name: L('Nâu ca cao', 'Cocoa') },
  { id: 'hairColor:black', slot: 'hairColor', value: '#2F2A2E', price: 0, name: L('Đen', 'Black') },
  { id: 'hairColor:cream', slot: 'hairColor', value: '#F3E6D8', price: 50, name: L('Kem sữa', 'Cream') },
  { id: 'hairColor:honey', slot: 'hairColor', value: '#D9A55B', price: 50, name: L('Mật ong', 'Honey') },
  { id: 'hairColor:rose', slot: 'hairColor', value: '#D99A9A', price: 70, name: L('Hồng phấn', 'Rose') },
  { id: 'hairColor:mint', slot: 'hairColor', value: '#9CC9B4', price: 70, name: L('Bạc hà', 'Mint') },
  { id: 'hairColor:lavender', slot: 'hairColor', value: '#B9A3D6', price: 80, name: L('Tím oải hương', 'Lavender') },
  { id: 'hairColor:sky', slot: 'hairColor', value: '#9CC3E0', price: 80, name: L('Xanh da trời', 'Sky blue') },
  { id: 'hairColor:cherry', slot: 'hairColor', value: '#C9565E', price: 90, name: L('Đỏ anh đào', 'Cherry') },
  { id: 'hairColor:ash', slot: 'hairColor', value: '#A8A2A6', price: 60, name: L('Xám tro', 'Ash grey') },
  { id: 'hairColor:chestnut', slot: 'hairColor', value: '#8E5A3C', price: 40, name: L('Nâu hạt dẻ', 'Chestnut') },
  // tai thú
  { id: 'ears:none', slot: 'ears', value: 'none', price: 0, name: L('Không tai thú', 'No ears') },
  { id: 'ears:cat', slot: 'ears', value: 'cat', price: 0, name: L('Tai mèo', 'Cat ears') },
  { id: 'ears:bunny', slot: 'ears', value: 'bunny', price: 80, name: L('Tai thỏ', 'Bunny ears') },
  { id: 'ears:bear', slot: 'ears', value: 'bear', price: 80, name: L('Tai gấu', 'Bear ears') },
  { id: 'ears:fox', slot: 'ears', value: 'fox', price: 100, name: L('Tai cáo', 'Fox ears') },
  { id: 'ears:panda', slot: 'ears', value: 'panda', price: 90, name: L('Tai gấu trúc', 'Panda ears') },
  { id: 'ears:mouse', slot: 'ears', value: 'mouse', price: 80, name: L('Tai chuột', 'Mouse ears') },
  { id: 'ears:puppy', slot: 'ears', value: 'puppy', price: 90, name: L('Tai cún cụp', 'Puppy ears') },
  { id: 'ears:deer', slot: 'ears', value: 'deer', price: 140, name: L('Sừng nai', 'Deer antlers') },
  // trang phục
  { id: 'outfit:dress', slot: 'outfit', value: 'dress', price: 0, name: L('Váy yếm', 'Pinafore') },
  { id: 'outfit:overall', slot: 'outfit', value: 'overall', price: 0, name: L('Quần yếm', 'Overalls') },
  { id: 'outfit:hoodie', slot: 'outfit', value: 'hoodie', price: 90, name: L('Áo hoodie', 'Hoodie') },
  { id: 'outfit:aodai', slot: 'outfit', value: 'aodai', price: 150, name: L('Áo dài', 'Áo dài') },
  { id: 'outfit:raincoat', slot: 'outfit', value: 'raincoat', price: 120, name: L('Áo mưa', 'Raincoat') },
  { id: 'outfit:school', slot: 'outfit', value: 'school', price: 0, name: L('Đồng phục khăn quàng đỏ', 'School uniform') },
  { id: 'outfit:sailor', slot: 'outfit', value: 'sailor', price: 120, name: L('Áo thuỷ thủ', 'Sailor suit') },
  { id: 'outfit:tracksuit', slot: 'outfit', value: 'tracksuit', price: 100, name: L('Đồ thể thao', 'Tracksuit') },
  { id: 'outfit:tutu', slot: 'outfit', value: 'tutu', price: 130, name: L('Váy múa ba lê', 'Ballet tutu') },
  { id: 'outfit:chef', slot: 'outfit', value: 'chef', price: 140, name: L('Áo đầu bếp', 'Chef coat') },
  { id: 'outfit:labcoat', slot: 'outfit', value: 'labcoat', price: 150, name: L('Áo nhà khoa học', 'Lab coat') },
  { id: 'outfit:astronaut', slot: 'outfit', value: 'astronaut', price: 220, name: L('Đồ phi hành gia', 'Astronaut suit') },
  { id: 'outfit:princess', slot: 'outfit', value: 'princess', price: 250, name: L('Váy công chúa', 'Princess gown') },
  // màu trang phục
  { id: 'outfitColor:sage', slot: 'outfitColor', value: '#B8C98A', price: 0, name: L('Xanh lá mạ', 'Sage') },
  { id: 'outfitColor:peach', slot: 'outfitColor', value: '#F0B48E', price: 0, name: L('Đào', 'Peach') },
  { id: 'outfitColor:sky', slot: 'outfitColor', value: '#9FC3DD', price: 40, name: L('Xanh trời', 'Sky') },
  { id: 'outfitColor:lilac', slot: 'outfitColor', value: '#C2A9D6', price: 40, name: L('Tím oải hương', 'Lilac') },
  { id: 'outfitColor:butter', slot: 'outfitColor', value: '#F2D57E', price: 40, name: L('Vàng bơ', 'Butter') },
  { id: 'outfitColor:berry', slot: 'outfitColor', value: '#D97B8A', price: 60, name: L('Dâu', 'Berry') },
  { id: 'outfitColor:mint', slot: 'outfitColor', value: '#9CD3BE', price: 40, name: L('Xanh bạc hà', 'Mint') },
  { id: 'outfitColor:coral', slot: 'outfitColor', value: '#F09A86', price: 40, name: L('San hô', 'Coral') },
  { id: 'outfitColor:navy', slot: 'outfitColor', value: '#5D6E9A', price: 50, name: L('Xanh than', 'Navy') },
  { id: 'outfitColor:cream', slot: 'outfitColor', value: '#F3E6D2', price: 30, name: L('Kem sữa', 'Cream') },
  { id: 'outfitColor:rose', slot: 'outfitColor', value: '#E9A6BC', price: 50, name: L('Hồng phấn', 'Rose') },
  // phụ kiện
  { id: 'acc:none', slot: 'acc', value: 'none', price: 0, name: L('Không phụ kiện', 'None') },
  { id: 'acc:bow', slot: 'acc', value: 'bow', price: 50, name: L('Nơ xinh', 'Bow') },
  { id: 'acc:flower', slot: 'acc', value: 'flower', price: 60, name: L('Kẹp hoa', 'Flower clip') },
  { id: 'acc:glasses', slot: 'acc', value: 'glasses', price: 70, name: L('Kính tròn', 'Round glasses') },
  { id: 'acc:nonla', slot: 'acc', value: 'nonla', price: 120, name: L('Nón lá', 'Conical hat') },
  { id: 'acc:crown', slot: 'acc', value: 'crown', price: 200, name: L('Vương miện', 'Crown') },
  { id: 'acc:headband', slot: 'acc', value: 'headband', price: 40, name: L('Băng đô nơ', 'Bow headband') },
  { id: 'acc:starclip', slot: 'acc', value: 'starclip', price: 40, name: L('Kẹp ngôi sao', 'Star clip') },
  { id: 'acc:beret', slot: 'acc', value: 'beret', price: 90, name: L('Mũ nồi', 'Beret') },
  { id: 'acc:cap', slot: 'acc', value: 'cap', price: 80, name: L('Mũ lưỡi trai', 'Cap') },
  { id: 'acc:wreath', slot: 'acc', value: 'wreath', price: 110, name: L('Vòng hoa', 'Flower crown') },
  { id: 'acc:headphones', slot: 'acc', value: 'headphones', price: 100, name: L('Tai nghe', 'Headphones') },
  { id: 'acc:partyhat', slot: 'acc', value: 'partyhat', price: 60, name: L('Mũ sinh nhật', 'Party hat') },
  // giày
  { id: 'shoes:maryjane', slot: 'shoes', value: 'maryjane', price: 0, name: L('Giày búp bê đỏ', 'Red Mary Janes') },
  { id: 'shoes:sneakers', slot: 'shoes', value: 'sneakers', price: 0, name: L('Giày thể thao', 'Sneakers') },
  { id: 'shoes:slippers', slot: 'shoes', value: 'slippers', price: 50, name: L('Dép bông thỏ', 'Bunny slippers') },
  { id: 'shoes:sandals', slot: 'shoes', value: 'sandals', price: 50, name: L('Dép quai hậu', 'Sandals') },
  { id: 'shoes:boots', slot: 'shoes', value: 'boots', price: 90, name: L('Bốt da', 'Boots') },
  { id: 'shoes:rainboots', slot: 'shoes', value: 'rainboots', price: 80, name: L('Ủng đi mưa', 'Rain boots') },
  // đồ cầm tay
  { id: 'hold:none', slot: 'hold', value: 'none', price: 0, name: L('Không cầm gì', 'Nothing') },
  { id: 'hold:pencil', slot: 'hold', value: 'pencil', price: 0, name: L('Bút chì', 'Pencil') },
  { id: 'hold:book', slot: 'hold', value: 'book', price: 40, name: L('Quyển sách', 'Book') },
  { id: 'hold:tulip', slot: 'hold', value: 'tulip', price: 60, name: L('Hoa tulip', 'Tulip') },
  { id: 'hold:balloon', slot: 'hold', value: 'balloon', price: 60, name: L('Bóng bay', 'Balloon') },
  { id: 'hold:lollipop', slot: 'hold', value: 'lollipop', price: 50, name: L('Kẹo mút', 'Lollipop') },
  { id: 'hold:teddy', slot: 'hold', value: 'teddy', price: 120, name: L('Gấu bông', 'Teddy bear') },
  { id: 'hold:wand', slot: 'hold', value: 'wand', price: 150, name: L('Đũa phép ngôi sao', 'Star wand') },
  // cảnh nền sảnh
  { id: 'scene:meadow', slot: 'scene', value: 'meadow', price: 0, name: L('Đồng hoa', 'Flower meadow') },
  { id: 'scene:beach', slot: 'scene', value: 'beach', price: 150, name: L('Bờ biển', 'Seaside') },
  { id: 'scene:village', slot: 'scene', value: 'village', price: 150, name: L('Làng quê', 'Countryside') },
  { id: 'scene:night', slot: 'scene', value: 'night', price: 180, name: L('Đêm sao', 'Starry night') },
  { id: 'scene:sakura', slot: 'scene', value: 'sakura', price: 200, name: L('Mùa hoa anh đào', 'Cherry blossoms') },
  { id: 'scene:snow', slot: 'scene', value: 'snow', price: 200, name: L('Mùa đông tuyết', 'Snowy winter') },
];
export const shopById = new Map(SHOP.map((s) => [s.id, s]));
export const DEFAULT_LOOK = { skin: '#F7D9C4', hair: 'bob', hairColor: '#6B4A3A', ears: 'cat', outfit: 'dress', outfitColor: '#B8C98A', acc: 'none', shoes: 'maryjane', hold: 'none', scene: 'meadow' };
export const FREE_ITEMS = SHOP.filter((s) => s.price === 0).map((s) => s.id);

// ---------------- Huy hiệu ----------------
// cond(s): s = thống kê của bé (xem server/game.js → statsFor)
export const BADGES = [
  { id: 'first-step', icon: 'sprout', name: L('Bước đầu tiên', 'First step'), desc: L('Hoàn thành màn đầu tiên', 'Finish your first level'), cond: (s) => s.lessonsDone >= 1 },
  { id: 'ten-levels', icon: 'flag', name: L('Nhà thám hiểm', 'Explorer'), desc: L('Hoàn thành 10 màn', 'Finish 10 levels'), cond: (s) => s.lessonsDone >= 10 },
  { id: 'fifty-levels', icon: 'mountain', name: L('Leo núi tri thức', 'Knowledge climber'), desc: L('Hoàn thành 50 màn', 'Finish 50 levels'), cond: (s) => s.lessonsDone >= 50 },
  { id: 'three-stars', icon: 'star', name: L('Ngôi sao nhỏ', 'Little star'), desc: L('Đạt 3 sao ở 1 màn', 'Get 3 stars on a level'), cond: (s) => s.threeStars >= 1 },
  { id: 'star-collector', icon: 'stars', name: L('Nhà sưu tầm sao', 'Star collector'), desc: L('Đạt 3 sao ở 15 màn', 'Get 3 stars on 15 levels'), cond: (s) => s.threeStars >= 15 },
  { id: 'streak-3', icon: 'flame', name: L('Chuỗi 3 ngày', '3-day streak'), desc: L('Học 3 ngày liên tiếp', 'Learn 3 days in a row'), cond: (s) => s.streak >= 3 },
  { id: 'streak-7', icon: 'flame2', name: L('Chuỗi 7 ngày', '7-day streak'), desc: L('Học 7 ngày liên tiếp', 'Learn 7 days in a row'), cond: (s) => s.streak >= 7 },
  { id: 'math-10', icon: 'math', name: L('Thần đồng con số', 'Number whiz'), desc: L('Hoàn thành 10 màn Toán', 'Finish 10 Maths levels'), cond: (s) => s.bySubject.math >= 10 },
  { id: 'viet-10', icon: 'viet', name: L('Bạn của chữ', 'Word friend'), desc: L('Hoàn thành 10 màn Tiếng Việt', 'Finish 10 Vietnamese levels'), cond: (s) => s.bySubject.vietnamese >= 10 },
  { id: 'eng-10', icon: 'eng', name: L('Nói tiếng Anh', 'English speaker'), desc: L('Hoàn thành 10 màn Tiếng Anh', 'Finish 10 English levels'), cond: (s) => s.bySubject.english >= 10 },
  { id: 'sci-10', icon: 'sci', name: L('Nhà khoa học nhí', 'Little scientist'), desc: L('Hoàn thành 10 màn Khoa học', 'Finish 10 Science levels'), cond: (s) => s.bySubject.science >= 10 },
  { id: 'all-worlds', icon: 'globe', name: L('Du hành bốn phương', 'World traveller'), desc: L('Chơi đủ 4 môn học', 'Play all 4 subjects'), cond: (s) => Object.values(s.bySubject).every((n) => n >= 1) },
  { id: 'boss-1', icon: 'shield', name: L('Hạ gục trùm', 'Boss beater'), desc: L('Vượt qua 1 màn trùm', 'Beat a boss level'), cond: (s) => s.bossDone >= 1 },
  { id: 'boss-5', icon: 'crown', name: L('Dũng sĩ', 'Champion'), desc: L('Vượt qua 5 màn trùm', 'Beat 5 boss levels'), cond: (s) => s.bossDone >= 5 },
  { id: 'answers-100', icon: 'check', name: L('100 câu đúng', '100 correct'), desc: L('Trả lời đúng 100 câu', 'Answer 100 questions right'), cond: (s) => s.correctTotal >= 100 },
  { id: 'answers-500', icon: 'check2', name: L('500 câu đúng', '500 correct'), desc: L('Trả lời đúng 500 câu', 'Answer 500 questions right'), cond: (s) => s.correctTotal >= 500 },
  { id: 'level-5', icon: 'up', name: L('Cấp độ 5', 'Level 5'), desc: L('Đạt cấp 5', 'Reach level 5'), cond: (s) => s.level >= 5 },
  { id: 'level-10', icon: 'up2', name: L('Cấp độ 10', 'Level 10'), desc: L('Đạt cấp 10', 'Reach level 10'), cond: (s) => s.level >= 10 },
  { id: 'saver', icon: 'coin', name: L('Heo đất', 'Piggy bank'), desc: L('Có 300 xu', 'Hold 300 coins'), cond: (s) => s.coins >= 300 },
  { id: 'stylist', icon: 'shirt', name: L('Nhà tạo mẫu', 'Stylist'), desc: L('Mua 3 món đồ', 'Buy 3 items'), cond: (s) => s.bought >= 3 },
  { id: 'early-bird', icon: 'sun', name: L('Chăm chỉ buổi sáng', 'Early bird'), desc: L('Học xong 1 màn trước 9 giờ sáng', 'Finish a level before 9 am'), cond: (s) => s.morning >= 1 },
  { id: 'checkin-7', icon: 'calendar', name: L('Chăm điểm danh', 'Daily visitor'), desc: L('Điểm danh 7 ngày', 'Check in on 7 days'), cond: (s) => s.checkins >= 7 },
  { id: 'checkin-30', icon: 'calendar2', name: L('Bạn thân của Bé Học Vui', 'Best friend'), desc: L('Điểm danh 30 ngày', 'Check in on 30 days'), cond: (s) => s.checkins >= 30 },
  { id: 'perfect-boss', icon: 'gem', name: L('Hoàn hảo', 'Flawless'), desc: L('Đạt 3 sao ở màn trùm', '3 stars on a boss level'), cond: (s) => s.perfectBoss >= 1 },
];

// ---------------- Điểm danh 7 ngày ----------------
// Mỗi ngày bé vào học và bấm "Điểm danh" nhận quà; điểm danh liền mạch thì quà tăng dần,
// ngày thứ 7 nhận một món đồ thời trang ngẫu nhiên. Bỏ lỡ một ngày → bắt đầu lại từ ngày 1.
export const CHECKIN_REWARDS = [
  { day: 1, coins: 10, energy: 1 },
  { day: 2, coins: 15, energy: 1 },
  { day: 3, coins: 20, energy: 2 },
  { day: 4, coins: 25, energy: 2 },
  { day: 5, coins: 30, energy: 2 },
  { day: 6, coins: 40, energy: 3 },
  { day: 7, coins: 60, energy: 3, gift: true },
];

// ---------------- Nhiệm vụ hằng ngày ----------------
export const QUEST_POOL = [
  { id: 'correct-15', type: 'correct', target: 15, coins: 25, name: L('Trả lời đúng 15 câu', 'Answer 15 questions right') },
  { id: 'correct-30', type: 'correct', target: 30, coins: 40, name: L('Trả lời đúng 30 câu', 'Answer 30 questions right') },
  { id: 'lessons-2', type: 'lessons', target: 2, coins: 25, name: L('Hoàn thành 2 màn', 'Finish 2 levels') },
  { id: 'lessons-4', type: 'lessons', target: 4, coins: 40, name: L('Hoàn thành 4 màn', 'Finish 4 levels') },
  { id: 'stars-1', type: 'threeStars', target: 1, coins: 30, name: L('Đạt 3 sao ở 1 màn', 'Get 3 stars once') },
  { id: 'minutes-10', type: 'minutes', target: 10, coins: 30, name: L('Học 10 phút', 'Learn for 10 minutes') },
  { id: 'math-1', type: 'subject:math', target: 1, coins: 20, name: L('Chơi 1 màn Toán', 'Play a Maths level') },
  { id: 'viet-1', type: 'subject:vietnamese', target: 1, coins: 20, name: L('Chơi 1 màn Tiếng Việt', 'Play a Vietnamese level') },
  { id: 'eng-1', type: 'subject:english', target: 1, coins: 20, name: L('Chơi 1 màn Tiếng Anh', 'Play an English level') },
  { id: 'sci-1', type: 'subject:science', target: 1, coins: 20, name: L('Chơi 1 màn Khoa học', 'Play a Science level') },
];
