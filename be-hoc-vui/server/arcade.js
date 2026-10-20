// Khu vui chơi: các mini game chơi tự do, câu hỏi lấy từ chủ đề đúng lớp của bé.
// Không nằm trên bản đồ nên không ảnh hưởng thứ tự mở khoá màn học.
import { makeRng, GAME_KIND } from '../shared/logic.js';
import { SUBJECTS, TOPICS, lessonById } from './content/index.js';
import { fits } from './rounds.js';
import { HttpError } from './http.js';

export const ARCADE_GAMES = ['fruit-slice', 'candy-match', 'slingshot', 'draw-trace', 'balloon-pop', 'catch-fall', 'math-race'];

/** Chủ đề có đủ loại câu cho game này không. */
function supports(topic, game) {
  const kind = GAME_KIND[game];
  if (topic.gen) {
    const rnd = makeRng(12345);
    let ok = 0;
    for (let i = 0; i < 60 && ok < 3; i++) { const it = topic.gen(rnd, kind); if (it && it.kind === kind) ok++; }
    return ok >= 3;
  }
  return topic.items.filter((it) => fits(game, it)).length >= 4;
}

export const ARCADE_LESSONS = [];
for (const topic of TOPICS) {
  for (const game of ARCADE_GAMES) {
    if (!supports(topic, game)) continue;
    const l = { id: `arc:${game}:${topic.id}`, topicId: topic.id, subject: topic.subject, grade: topic.grade, order: 0, game, kind: 'arcade', coins: 8, xp: 30, hearts: null };
    ARCADE_LESSONS.push(l);
    lessonById.set(l.id, l);
  }
}

/** Danh sách game + các môn chơi được ở đúng lớp (hoặc lớp gần nhất). */
export function arcadeMenu(grade) {
  return ARCADE_GAMES.map((game) => ({
    game,
    subjects: SUBJECTS.map((s) => s.id).filter((sid) => ARCADE_LESSONS.some((l) => l.game === game && l.subject === sid)),
    total: ARCADE_LESSONS.filter((l) => l.game === game && l.grade === grade).length,
  }));
}

/** Chọn ngẫu nhiên một bài cho game + môn, ưu tiên đúng lớp, nếu không có thì lớp gần nhất. */
export function pickArcade(grade, game, subject) {
  if (!ARCADE_GAMES.includes(game)) throw new HttpError(400, 'BAD_GAME');
  let pool = ARCADE_LESSONS.filter((l) => l.game === game && (!subject || subject === 'any' || l.subject === subject));
  if (!pool.length) throw new HttpError(404, 'LESSON_NOT_FOUND');
  const best = Math.min(...pool.map((l) => Math.abs(l.grade - grade)));
  pool = pool.filter((l) => Math.abs(l.grade - grade) === best);
  return pool[Math.floor(Math.random() * pool.length)];
}
