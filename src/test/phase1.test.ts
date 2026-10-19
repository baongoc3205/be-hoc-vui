import { describe, it, expect, beforeEach } from 'vitest';
import { useProfileStore, gradeToAgeTheme } from '@/stores/useProfileStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useProgressStore, calculateLevel } from '@/stores/useProgressStore';
import { mockApiClient } from '@/services/api';

describe('Phase 1: Foundation, Stores, API & Theme Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('determines correct age theme from grade', () => {
    expect(gradeToAgeTheme(1)).toBe('sprout');
    expect(gradeToAgeTheme(2)).toBe('sprout');
    expect(gradeToAgeTheme(3)).toBe('bud');
    expect(gradeToAgeTheme(5)).toBe('bud');
    expect(gradeToAgeTheme(6)).toBe('wing');
    expect(gradeToAgeTheme(9)).toBe('wing');
  });

  it('allows creating profiles and switches age theme', () => {
    const store = useProfileStore.getState();
    const newId = store.createProfile({
      nickname: 'Bé Na',
      grade: 1,
      ageTheme: 'sprout',
      avatar: {
        skin: 'light',
        face: 'cheerful',
        hair: 'ponytail',
        hairColor: '#000',
        outfit: 'tshirt-blue',
      },
      favoriteSubjects: ['vietnamese'],
    });

    expect(newId).toBeDefined();
    expect(useProfileStore.getState().activeProfileId).toBe(newId);
    expect(document.documentElement.getAttribute('data-age')).toBe('sprout');
  });

  it('computes XP levels according to xpForLevel(n) = round(50 * n^1.5)', () => {
    // Level 1: < 50 XP
    expect(calculateLevel(0).level).toBe(1);
    expect(calculateLevel(49).level).toBe(1);

    // Level 2: 50 * 2^1.5 = round(141.42) = 141 XP
    expect(calculateLevel(50).level).toBe(2);
    expect(calculateLevel(140).level).toBe(2);

    // Level 3: 50 * 3^1.5 = round(259.8) = 260 XP
    expect(calculateLevel(141).level).toBe(3);
  });

  it('manages coins, energy and badges in useProgressStore', () => {
    const store = useProgressStore.getState();
    const progress = store.getProfileProgress('test-child-1');
    expect(progress.coins).toBe(100);
    expect(progress.energy.value).toBe(10);

    store.earnCoins('test-child-1', 50);
    expect(useProgressStore.getState().getProfileProgress('test-child-1').coins).toBe(150);

    const spent = store.spendCoins('test-child-1', 30);
    expect(spent).toBe(true);
    expect(useProgressStore.getState().getProfileProgress('test-child-1').coins).toBe(120);

    const usedEnergy = store.useEnergy('test-child-1', 1);
    expect(usedEnergy).toBe(true);
    expect(useProgressStore.getState().getProfileProgress('test-child-1').energy.value).toBe(9);
  });

  it('switches language and dark theme via useSettingsStore', () => {
    const settings = useSettingsStore.getState();

    settings.setLocale('en');
    expect(useSettingsStore.getState().locale).toBe('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');

    settings.setLocale('vi');
    expect(useSettingsStore.getState().locale).toBe('vi');
    expect(document.documentElement.getAttribute('lang')).toBe('vi');

    settings.toggleDarkTheme();
    expect(useSettingsStore.getState().darkTheme).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('provides mock API data with delay and persistence', async () => {
    const subjects = await mockApiClient.getSubjects();
    expect(subjects.length).toBe(4);
    expect(subjects.map((s) => s.id)).toEqual(['math', 'vietnamese', 'english', 'science']);

    const badges = await mockApiClient.getBadges();
    expect(badges.length).toBeGreaterThanOrEqual(20);

    const questions = await mockApiClient.getQuestionsByLesson('l-m1-01');
    expect(questions.length).toBe(5);
    expect(questions[0].prompt.vi).toContain('quả táo');
  });
});
