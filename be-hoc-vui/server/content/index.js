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
import { buildPracticeTopics } from './practice/campaign.js';

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

// Chặng luyện tập sinh theo mẫu: luôn đặt SAU các chủ đề cũ để mã màn và tiến độ cũ không đổi.
export const PRACTICE_TOPICS = buildPracticeTopics();
export const TOPICS = [...MATH, ...mathReview, ...bankTopics, ...viTopics2, ...viTopics2b, ...enTopics2, ...enTopics2b, ...sciTopics2, ...sciTopics2b, ...PRACTICE_TOPICS];
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
            game, kind: boss ? 'boss' : 'normal', tier: topic.tiers?.[i] ?? null,
            coins: (boss ? 30 : 15 + Math.min(grade, 5)) + (topic.tiers ? (topic.tiers[i] - 1) * 2 : 0), xp: boss ? 120 : 50 + grade * 5,
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

// ---------------- Cửa hàng (xu ảo, không có tiền thật) → ./shop.js ----------------
export { SHOP, shopById, DEFAULT_LOOK, FREE_ITEMS, COLLECTIONS, COMBOS, comboById } from './shop.js';

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
  { id: 'combo-1', icon: 'shirt', name: L('Cả bộ cánh', 'Full outfit'), desc: L('Sưu tầm đủ 1 combo trang phục', 'Collect a whole outfit combo'), cond: (s) => s.combos >= 1 },
  { id: 'combo-5', icon: 'crown', name: L('Nhà thiết kế nhí', 'Little designer'), desc: L('Sưu tầm đủ 5 combo trang phục', 'Collect 5 outfit combos'), cond: (s) => s.combos >= 5 },
  { id: 'wardrobe-30', icon: 'shirt', name: L('Tủ đồ khổng lồ', 'Giant wardrobe'), desc: L('Có 30 món đồ đã mua', 'Own 30 bought items'), cond: (s) => s.bought >= 30 },
  { id: 'festive', icon: 'gem', name: L('Vui ngày lễ', 'Festive fun'), desc: L('Nhận quà trong một dịp lễ', 'Claim a holiday gift'), cond: (s) => s.gifts >= 1 },
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
