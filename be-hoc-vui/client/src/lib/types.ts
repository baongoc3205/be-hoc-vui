import type { LText, Round } from '../../../shared/logic.js';
export type { LText, Round };

export type Lang = 'vi' | 'en';
export type SubjectId = 'math' | 'vietnamese' | 'english' | 'science';
export type GameType =
  | 'quiz' | 'true-false' | 'balloon-pop' | 'math-race' | 'fill-blank' | 'listen-pick'
  | 'drag-match' | 'memory' | 'sort-order' | 'word-builder' | 'clock' | 'catch-fall' | 'boss' | 'chest'
  | 'fruit-slice' | 'candy-match' | 'slingshot' | 'draw-trace';

export interface Look {
  skin: string; hair: string; hairColor: string; ears: string; outfit: string; outfitColor: string; acc: string; shoes: string; hold: string; scene: string;
}
export interface Parent { id: number; name: string; email: string | null; isGuest: boolean; hasRecovery?: boolean }
export interface ChildSettings { dailyLimitMin: number; energy: boolean; leaderboard: boolean }
export interface Child { id: number; nickname: string; grade: number; ageTheme: 'sprout' | 'bud' | 'wing'; look: Look; settings: ChildSettings }
export interface Quest { id: string; name: LText; target: number; coins: number; progress: number; done: boolean; claimed: boolean }
export interface Checkin {
  today: boolean; claimed: number; nextSeq: number | null; total: number;
  last: { coins: number; energy: number; item: string | null } | null;
  rewards: { day: number; coins: number; energy: number; gift: boolean }[];
}
export interface ChildState {
  child: Child; coins: number; xp: number; level: { level: number; current: number; needed: number }; stars: number;
  energy: { value: number; max: number; nextInMs: number; enabled: boolean };
  streak: number; chestAvailable: boolean; checkin: Checkin; quests: Quest[]; badges: string[]; owned: string[];
  today: { minutes: number; limit: number };
  next?: { subject: SubjectId; done: number; total: number; lesson: { id: string; index: number; game: GameType; kind: string; name: LText } | null; topic: LText | null } | null;
}
export interface Subject { id: SubjectId; name: LText; world: LText; mascot: string; color: string }
export interface ShopItem { id: string; slot: keyof Look; value: string; price: number; name: LText }
export interface Badge { id: string; icon: string; name: LText; desc: LText }
export interface Catalog { subjects: Subject[]; topics: { id: string; subject: SubjectId; grade: number; title: LText }[]; games: Record<GameType, { name: LText; icon: string }>; shop: ShopItem[]; badges: Badge[]; lessonCount: number }
export interface MapNode { id: string; index: number; topicId: string; game: GameType; kind: 'normal' | 'boss' | 'chest'; name: LText; stars: number; done: boolean; unlocked: boolean; coins: number }
export interface MapData { subject: SubjectId; grade: number; topics: { id: string; title: LText }[]; nodes: MapNode[]; current: string | null }
export interface SessionStart {
  sessionId: string; game: GameType; rounds: Round[];
  lesson: { id: string; index: number; subject: SubjectId; grade: number; kind: string; hearts: number | null; name: LText; topic: LText; coins: number; prevStars: number };
}
export interface FinishResult {
  accuracy: number; stars: number; coins: number; xp: number; correct: number; total: number; prevStars: number; maxCombo: number;
  levelUp: number | null; newBadges: Badge[]; next: { id: string; kind: string } | null; state: ChildState;
}
