// Danh mục nội dung: môn học, chủ đề, bài học (màn chơi), cửa hàng, huy hiệu, nhiệm vụ.
import { mathTopics } from './math.js';
import { bankTopics } from './bank.js';

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
  boss: { name: L('Thử thách trùm', 'Boss challenge'), icon: 'boss' },
  chest: { name: L('Rương báu', 'Treasure chest'), icon: 'chest' },
};

export const TOPICS = [
  ...mathTopics.map((t) => ({ ...t, subject: 'math' })),
  ...bankTopics,
];
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
  // màu tóc
  { id: 'hairColor:cocoa', slot: 'hairColor', value: '#6B4A3A', price: 0, name: L('Nâu ca cao', 'Cocoa') },
  { id: 'hairColor:black', slot: 'hairColor', value: '#2F2A2E', price: 0, name: L('Đen', 'Black') },
  { id: 'hairColor:cream', slot: 'hairColor', value: '#F3E6D8', price: 50, name: L('Kem sữa', 'Cream') },
  { id: 'hairColor:honey', slot: 'hairColor', value: '#D9A55B', price: 50, name: L('Mật ong', 'Honey') },
  { id: 'hairColor:rose', slot: 'hairColor', value: '#D99A9A', price: 70, name: L('Hồng phấn', 'Rose') },
  { id: 'hairColor:mint', slot: 'hairColor', value: '#9CC9B4', price: 70, name: L('Bạc hà', 'Mint') },
  // tai thú
  { id: 'ears:none', slot: 'ears', value: 'none', price: 0, name: L('Không tai thú', 'No ears') },
  { id: 'ears:cat', slot: 'ears', value: 'cat', price: 0, name: L('Tai mèo', 'Cat ears') },
  { id: 'ears:bunny', slot: 'ears', value: 'bunny', price: 80, name: L('Tai thỏ', 'Bunny ears') },
  { id: 'ears:bear', slot: 'ears', value: 'bear', price: 80, name: L('Tai gấu', 'Bear ears') },
  { id: 'ears:fox', slot: 'ears', value: 'fox', price: 100, name: L('Tai cáo', 'Fox ears') },
  // trang phục
  { id: 'outfit:dress', slot: 'outfit', value: 'dress', price: 0, name: L('Váy yếm', 'Pinafore') },
  { id: 'outfit:overall', slot: 'outfit', value: 'overall', price: 0, name: L('Quần yếm', 'Overalls') },
  { id: 'outfit:hoodie', slot: 'outfit', value: 'hoodie', price: 90, name: L('Áo hoodie', 'Hoodie') },
  { id: 'outfit:aodai', slot: 'outfit', value: 'aodai', price: 150, name: L('Áo dài', 'Áo dài') },
  { id: 'outfit:raincoat', slot: 'outfit', value: 'raincoat', price: 120, name: L('Áo mưa', 'Raincoat') },
  // màu trang phục
  { id: 'outfitColor:sage', slot: 'outfitColor', value: '#B8C98A', price: 0, name: L('Xanh lá mạ', 'Sage') },
  { id: 'outfitColor:peach', slot: 'outfitColor', value: '#F0B48E', price: 0, name: L('Đào', 'Peach') },
  { id: 'outfitColor:sky', slot: 'outfitColor', value: '#9FC3DD', price: 40, name: L('Xanh trời', 'Sky') },
  { id: 'outfitColor:lilac', slot: 'outfitColor', value: '#C2A9D6', price: 40, name: L('Tím oải hương', 'Lilac') },
  { id: 'outfitColor:butter', slot: 'outfitColor', value: '#F2D57E', price: 40, name: L('Vàng bơ', 'Butter') },
  { id: 'outfitColor:berry', slot: 'outfitColor', value: '#D97B8A', price: 60, name: L('Dâu', 'Berry') },
  // phụ kiện
  { id: 'acc:none', slot: 'acc', value: 'none', price: 0, name: L('Không phụ kiện', 'None') },
  { id: 'acc:bow', slot: 'acc', value: 'bow', price: 50, name: L('Nơ xinh', 'Bow') },
  { id: 'acc:flower', slot: 'acc', value: 'flower', price: 60, name: L('Kẹp hoa', 'Flower clip') },
  { id: 'acc:glasses', slot: 'acc', value: 'glasses', price: 70, name: L('Kính tròn', 'Round glasses') },
  { id: 'acc:nonla', slot: 'acc', value: 'nonla', price: 120, name: L('Nón lá', 'Conical hat') },
  { id: 'acc:crown', slot: 'acc', value: 'crown', price: 200, name: L('Vương miện', 'Crown') },
  // cảnh nền sảnh
  { id: 'scene:meadow', slot: 'scene', value: 'meadow', price: 0, name: L('Đồng hoa', 'Flower meadow') },
  { id: 'scene:beach', slot: 'scene', value: 'beach', price: 150, name: L('Bờ biển', 'Seaside') },
  { id: 'scene:village', slot: 'scene', value: 'village', price: 150, name: L('Làng quê', 'Countryside') },
  { id: 'scene:night', slot: 'scene', value: 'night', price: 180, name: L('Đêm sao', 'Starry night') },
];
export const shopById = new Map(SHOP.map((s) => [s.id, s]));
export const DEFAULT_LOOK = { skin: '#F7D9C4', hair: 'bob', hairColor: '#6B4A3A', ears: 'cat', outfit: 'dress', outfitColor: '#B8C98A', acc: 'none', scene: 'meadow' };
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
  { id: 'perfect-boss', icon: 'gem', name: L('Hoàn hảo', 'Flawless'), desc: L('Đạt 3 sao ở màn trùm', '3 stars on a boss level'), cond: (s) => s.perfectBoss >= 1 },
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
