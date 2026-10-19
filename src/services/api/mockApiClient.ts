import { ApiClient } from './types';
import { Subject, SubjectId, Grade, Topic, Lesson, Question, BadgeItem, ShopItem, Progress } from '@/types';
import { mockSubjects } from '@/mocks/data/subjects';
import { mockTopics } from '@/mocks/data/topics';
import { mockLessons } from '@/mocks/data/lessons';
import { mockQuestions } from '@/mocks/data/questions';
import { mockBadges } from '@/mocks/data/badges';
import { mockShopItems } from '@/mocks/data/shop';

function delay<T>(data: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export class MockApiClient implements ApiClient {
  async getSubjects(): Promise<Subject[]> {
    return delay([...mockSubjects]);
  }

  async getSubject(id: SubjectId): Promise<Subject | null> {
    const s = mockSubjects.find((sub) => sub.id === id) || null;
    return delay(s);
  }

  async getTopicsBySubjectAndGrade(subjectId: SubjectId, grade: Grade): Promise<Topic[]> {
    const list = mockTopics.filter((t) => t.subjectId === subjectId && t.grade === grade);
    // If no specific topic for this exact grade yet, fallback to nearest grade topic for demo
    if (list.length === 0) {
      const fallbackList = mockTopics.filter((t) => t.subjectId === subjectId);
      return delay(fallbackList.slice(0, 2));
    }
    return delay(list);
  }

  async getLesson(lessonId: string): Promise<Lesson | null> {
    const lesson = mockLessons.find((l) => l.id === lessonId) || null;
    return delay(lesson);
  }

  async getQuestionsByLesson(lessonId: string): Promise<Question[]> {
    const lesson = mockLessons.find((l) => l.id === lessonId);
    if (!lesson || !lesson.source.questionIds) {
      return delay([]);
    }
    const questions = lesson.source.questionIds
      .map((qId) => mockQuestions[qId])
      .filter((q): q is Question => Boolean(q));
    return delay(questions);
  }

  async getBadges(): Promise<BadgeItem[]> {
    return delay([...mockBadges]);
  }

  async getShopItems(): Promise<ShopItem[]> {
    return delay([...mockShopItems]);
  }

  async saveProgress(progress: Progress): Promise<boolean> {
    try {
      localStorage.setItem(`kidquest_progress_${progress.profileId}`, JSON.stringify(progress));
      return delay(true, 100);
    } catch {
      return delay(false, 100);
    }
  }

  async loadProgress(profileId: string): Promise<Progress | null> {
    try {
      const raw = localStorage.getItem(`kidquest_progress_${profileId}`);
      if (raw) {
        return delay(JSON.parse(raw), 150);
      }
      return delay(null, 150);
    } catch {
      return delay(null, 150);
    }
  }
}

export const mockApiClient = new MockApiClient();
