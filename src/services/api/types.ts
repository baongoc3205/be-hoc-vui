import {
  Subject,
  SubjectId,
  Grade,
  Topic,
  Lesson,
  Question,
  BadgeItem,
  ShopItem,
  Progress,
} from '@/types';

export interface ApiClient {
  getSubjects(): Promise<Subject[]>;
  getSubject(id: SubjectId): Promise<Subject | null>;
  getTopicsBySubjectAndGrade(subjectId: SubjectId, grade: Grade): Promise<Topic[]>;
  getLesson(lessonId: string): Promise<Lesson | null>;
  getQuestionsByLesson(lessonId: string): Promise<Question[]>;
  getBadges(): Promise<BadgeItem[]>;
  getShopItems(): Promise<ShopItem[]>;
  saveProgress(progress: Progress): Promise<boolean>;
  loadProgress(profileId: string): Promise<Progress | null>;
}
