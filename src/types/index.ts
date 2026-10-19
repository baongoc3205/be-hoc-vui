// Data Models for KidQuest (Bé Học Vui) - Casual Mobile Game Web

export type Locale = 'vi' | 'en';
export type LText = Record<Locale, string>;
export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type SubjectId = 'math' | 'vietnamese' | 'english' | 'science';
export type AgeTheme = 'sprout' | 'bud' | 'wing';

export type GameType =
  | 'quiz'
  | 'drag-match'
  | 'fill-blank'
  | 'memory-cards'
  | 'word-builder'
  | 'math-race'
  | 'sort-order'
  | 'true-false-swipe'
  | 'listen-pick'
  | 'clock-reader'
  | 'balloon-pop'
  | 'catch-fall';

export type MascotName = 'mimi' | 'bo' | 'mochi' | 'foxy' | 'kiwi';

export type MascotMood =
  | 'idle'
  | 'happy'
  | 'cheer'
  | 'think'
  | 'wow'
  | 'sad-soft'
  | 'sleep'
  | 'wave'
  | 'point';

export type IllustrationKey =
  | 'apple'
  | 'orange'
  | 'banana'
  | 'cat'
  | 'dog'
  | 'rabbit'
  | 'bird'
  | 'tree'
  | 'flower'
  | 'sun'
  | 'star'
  | 'book'
  | 'pencil'
  | 'clock'
  | 'car'
  | 'bus'
  | 'flask'
  | 'atom'
  | 'leaf'
  | 'magnifier';

export interface AvatarConfig {
  skin: string;
  face: string;
  hair: string;
  hairColor: string;
  outfit: string;
  hat?: string;
  glasses?: string;
  pet?: string;
  frame?: string;
}

export interface Subject {
  id: SubjectId;
  name: LText;
  world: 'numbers' | 'letters' | 'abc' | 'discovery';
  mascot: MascotName;
  description: LText;
  color: string;
}

export interface Topic {
  id: string;
  subjectId: SubjectId;
  grade: Grade;
  title: LText;
  order: number;
  lessonIds: string[];
}

export interface Lesson {
  id: string;
  topicId: string;
  order: number;
  title: LText;
  gameType: GameType;
  kind: 'normal' | 'chest' | 'boss';
  source: {
    questionIds?: string[];
    generator?: { id: string; params: Record<string, number | string> };
  };
  questionCount: number;
  timeLimitSec?: number;
  hearts?: number;
  goal: { minCorrect: number };
  rewards: { coins: number; xp: number; badgeId?: string };
}

export interface QuestionOption {
  id: string;
  text?: LText;
  image?: IllustrationKey;
}

export interface QuestionPair {
  left: LText;
  right: LText;
}

export interface Question {
  id: string;
  type: GameType;
  prompt: LText;
  promptAudio?: LText;
  image?: IllustrationKey;
  options?: QuestionOption[];
  answer: string | string[];
  pairs?: QuestionPair[];
  hint?: LText;
  explanation?: LText;
  difficulty: 1 | 2 | 3;
}

export interface ChildProfile {
  id: string;
  nickname: string;
  grade: Grade;
  avatar: AvatarConfig;
  ageTheme: AgeTheme;
  favoriteSubjects: SubjectId[];
  createdAt: string;
}

export interface QuestState {
  id: string;
  title: LText;
  target: number;
  current: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
}

export interface Progress {
  profileId: string;
  lessons: Record<
    string,
    {
      stars: 0 | 1 | 2 | 3;
      bestScore: number;
      attempts: number;
      completedAt?: string;
    }
  >;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  energy: {
    value: number; // 0..10
    updatedAt: string;
  };
  streak: {
    days: number;
    lastDate?: string;
    shieldAvailable: boolean;
  };
  badges: string[];
  stickers: string[];
  ownedItems: string[];
  dailyQuests: {
    date: string;
    quests: QuestState[];
  };
  dailyMinutes: Record<string, number>;
}

export interface BadgeItem {
  id: string;
  name: LText;
  description: LText;
  icon: string;
  category: 'progress' | 'streak' | 'math' | 'words' | 'special';
  unlockedAt?: string;
}

export interface ShopItem {
  id: string;
  name: LText;
  category: 'hair' | 'outfit' | 'hat' | 'glasses' | 'pet' | 'frame';
  price: number;
  isNew?: boolean;
  levelRequired?: number;
}

export interface AnswerRecord {
  questionId: string;
  givenAnswer: string | string[];
  correct: boolean;
  durationMs: number;
  hintUsed: boolean;
  scoreGained: number;
}

export type SessionPhase =
  | 'intro'
  | 'asking'
  | 'answered'
  | 'feedback'
  | 'paused'
  | 'finished';

export interface SessionState {
  phase: SessionPhase;
  index: number;
  questions: Question[];
  answers: AnswerRecord[];
  hearts: number | null;
  combo: number;
  maxCombo: number;
  hintsUsed: number;
  startedAt: number;
  elapsedMs: number;
  seed: number;
  lessonId: string;
}

export type SessionAction =
  | { type: 'START' }
  | { type: 'SUBMIT'; answer: string | string[]; at: number }
  | { type: 'NEXT' }
  | { type: 'HINT' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'TICK'; dt: number }
  | { type: 'FINISH' };
