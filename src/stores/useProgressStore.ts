import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Progress, QuestState } from '@/types';

export const MAX_ENERGY = 10;
export const ENERGY_RECHARGE_MS = 10 * 60 * 1000; // 10 minutes per point

export function calculateLevel(xp: number): { level: number; currentXp: number; nextLevelXp: number } {
  let level = 1;
  while (true) {
    const xpNeeded = Math.round(50 * Math.pow(level, 1.5));
    if (xp < xpNeeded) {
      const prevXpNeeded = level === 1 ? 0 : Math.round(50 * Math.pow(level - 1, 1.5));
      return {
        level,
        currentXp: xp - prevXpNeeded,
        nextLevelXp: xpNeeded - prevXpNeeded,
      };
    }
    level++;
  }
}

const defaultDailyQuests: QuestState[] = [
  {
    id: 'quest-1',
    title: { vi: 'Đạt 3 sao ở 1 bài học bất kỳ', en: 'Score 3 stars on any lesson' },
    target: 1,
    current: 0,
    rewardCoins: 25,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest-2',
    title: { vi: 'Trả lời đúng 10 câu hỏi', en: 'Answer 10 questions correctly' },
    target: 10,
    current: 0,
    rewardCoins: 30,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest-3',
    title: { vi: 'Học tập 10 phút hôm nay', en: 'Study for 10 minutes today' },
    target: 10,
    current: 0,
    rewardCoins: 40,
    completed: false,
    claimed: false,
  },
];

interface ProgressState {
  progressByProfile: Record<string, Progress>;
  getProfileProgress: (profileId: string) => Progress;
  earnCoins: (profileId: string, amount: number) => void;
  spendCoins: (profileId: string, amount: number) => boolean;
  addXp: (profileId: string, amount: number) => { leveledUp: boolean; newLevel: number };
  useEnergy: (profileId: string, amount?: number) => boolean;
  refillEnergy: (profileId: string) => void;
  syncEnergy: (profileId: string) => void;
  recordLessonCompletion: (
    profileId: string,
    lessonId: string,
    stars: 0 | 1 | 2 | 3,
    score: number
  ) => { isFirstCompletion: boolean; isNewBestStars: boolean };
  unlockBadge: (profileId: string, badgeId: string) => void;
  unlockSticker: (profileId: string, stickerId: string) => void;
  unlockShopItem: (profileId: string, itemId: string) => void;
  addStudyMinutes: (profileId: string, minutes: number) => void;
  updateStreak: (profileId: string) => void;
  claimDailyQuest: (profileId: string, questId: string) => number;
}

function createInitialProgress(profileId: string): Progress {
  return {
    profileId,
    lessons: {},
    coins: 100, // Starting bonus
    gems: 5,
    xp: 0,
    level: 1,
    energy: {
      value: MAX_ENERGY,
      updatedAt: new Date().toISOString(),
    },
    streak: {
      days: 1,
      lastDate: new Date().toISOString().split('T')[0],
      shieldAvailable: true,
    },
    badges: ['badge-first-step'],
    stickers: ['sticker-cat-1'],
    ownedItems: ['tshirt-blue', 'cap-red'],
    dailyQuests: {
      date: new Date().toISOString().split('T')[0],
      quests: defaultDailyQuests,
    },
    dailyMinutes: {},
  };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progressByProfile: {},

      getProfileProgress: (profileId: string) => {
        const state = get();
        let p = state.progressByProfile[profileId];
        if (!p) {
          p = createInitialProgress(profileId);
          set((s) => ({
            progressByProfile: { ...s.progressByProfile, [profileId]: p },
          }));
        } else {
          // Sync natural energy recharge
          const now = Date.now();
          const lastUpdated = new Date(p.energy.updatedAt).getTime();
          const elapsed = now - lastUpdated;
          if (elapsed >= ENERGY_RECHARGE_MS && p.energy.value < MAX_ENERGY) {
            const pointsToRecover = Math.floor(elapsed / ENERGY_RECHARGE_MS);
            const newValue = Math.min(MAX_ENERGY, p.energy.value + pointsToRecover);
            p = {
              ...p,
              energy: {
                value: newValue,
                updatedAt: new Date(lastUpdated + pointsToRecover * ENERGY_RECHARGE_MS).toISOString(),
              },
            };
            set((s) => ({
              progressByProfile: { ...s.progressByProfile, [profileId]: p },
            }));
          }
        }
        return p;
      },

      earnCoins: (profileId, amount) => {
        set((state) => {
          const current = state.progressByProfile[profileId] || createInitialProgress(profileId);
          return {
            progressByProfile: {
              ...state.progressByProfile,
              [profileId]: { ...current, coins: current.coins + amount },
            },
          };
        });
      },

      spendCoins: (profileId, amount) => {
        const current = get().getProfileProgress(profileId);
        if (current.coins < amount) return false;
        set((state) => ({
          progressByProfile: {
            ...state.progressByProfile,
            [profileId]: { ...current, coins: current.coins - amount },
          },
        }));
        return true;
      },

      addXp: (profileId, amount) => {
        const current = get().getProfileProgress(profileId);
        const newTotalXp = current.xp + amount;
        const oldLevelInfo = calculateLevel(current.xp);
        const newLevelInfo = calculateLevel(newTotalXp);
        const leveledUp = newLevelInfo.level > oldLevelInfo.level;

        set((state) => ({
          progressByProfile: {
            ...state.progressByProfile,
            [profileId]: {
              ...current,
              xp: newTotalXp,
              level: newLevelInfo.level,
            },
          },
        }));
        return { leveledUp, newLevel: newLevelInfo.level };
      },

      useEnergy: (profileId, amount = 1) => {
        const current = get().getProfileProgress(profileId);
        if (current.energy.value < amount) return false;
        set((state) => ({
          progressByProfile: {
            ...state.progressByProfile,
            [profileId]: {
              ...current,
              energy: {
                value: current.energy.value - amount,
                updatedAt: new Date().toISOString(),
              },
            },
          },
        }));
        return true;
      },

      refillEnergy: (profileId) => {
        set((state) => {
          const current = state.progressByProfile[profileId] || createInitialProgress(profileId);
          return {
            progressByProfile: {
              ...state.progressByProfile,
              [profileId]: {
                ...current,
                energy: { value: MAX_ENERGY, updatedAt: new Date().toISOString() },
              },
            },
          };
        });
      },

      syncEnergy: (profileId) => {
        get().getProfileProgress(profileId);
      },

      recordLessonCompletion: (profileId, lessonId, stars, score) => {
        const current = get().getProfileProgress(profileId);
        const prev = current.lessons[lessonId];
        const isFirstCompletion = !prev || prev.stars === 0;
        const isNewBestStars = !prev || stars > prev.stars;

        const updatedLesson = {
          stars: (prev ? Math.max(prev.stars, stars) : stars) as 0 | 1 | 2 | 3,
          bestScore: prev ? Math.max(prev.bestScore, score) : score,
          attempts: (prev?.attempts || 0) + 1,
          completedAt: new Date().toISOString(),
        };

        set((state) => ({
          progressByProfile: {
            ...state.progressByProfile,
            [profileId]: {
              ...current,
              lessons: {
                ...current.lessons,
                [lessonId]: updatedLesson,
              },
            },
          },
        }));

        get().updateStreak(profileId);
        return { isFirstCompletion, isNewBestStars };
      },

      unlockBadge: (profileId, badgeId) => {
        set((state) => {
          const current = state.progressByProfile[profileId] || createInitialProgress(profileId);
          if (current.badges.includes(badgeId)) return state;
          return {
            progressByProfile: {
              ...state.progressByProfile,
              [profileId]: { ...current, badges: [...current.badges, badgeId] },
            },
          };
        });
      },

      unlockSticker: (profileId, stickerId) => {
        set((state) => {
          const current = state.progressByProfile[profileId] || createInitialProgress(profileId);
          if (current.stickers.includes(stickerId)) return state;
          return {
            progressByProfile: {
              ...state.progressByProfile,
              [profileId]: { ...current, stickers: [...current.stickers, stickerId] },
            },
          };
        });
      },

      unlockShopItem: (profileId, itemId) => {
        set((state) => {
          const current = state.progressByProfile[profileId] || createInitialProgress(profileId);
          if (current.ownedItems.includes(itemId)) return state;
          return {
            progressByProfile: {
              ...state.progressByProfile,
              [profileId]: { ...current, ownedItems: [...current.ownedItems, itemId] },
            },
          };
        });
      },

      addStudyMinutes: (profileId, minutes) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => {
          const current = state.progressByProfile[profileId] || createInitialProgress(profileId);
          const currentDayMins = current.dailyMinutes[today] || 0;
          return {
            progressByProfile: {
              ...state.progressByProfile,
              [profileId]: {
                ...current,
                dailyMinutes: {
                  ...current.dailyMinutes,
                  [today]: currentDayMins + minutes,
                },
              },
            },
          };
        });
      },

      updateStreak: (profileId) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => {
          const current = state.progressByProfile[profileId] || createInitialProgress(profileId);
          if (current.streak.lastDate === today) return state;

          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          let newDays = current.streak.days;
          let shield = current.streak.shieldAvailable;

          if (current.streak.lastDate === yesterday) {
            newDays += 1;
          } else if (current.streak.lastDate) {
            // Missed a day
            if (shield) {
              // Streak shield saves the streak!
              shield = false;
              newDays += 1;
            } else {
              newDays = 1;
            }
          } else {
            newDays = 1;
          }

          return {
            progressByProfile: {
              ...state.progressByProfile,
              [profileId]: {
                ...current,
                streak: {
                  days: newDays,
                  lastDate: today,
                  shieldAvailable: shield,
                },
              },
            },
          };
        });
      },

      claimDailyQuest: (profileId, questId) => {
        let coinsToAdd = 0;
        set((state) => {
          const current = state.progressByProfile[profileId] || createInitialProgress(profileId);
          const quests = current.dailyQuests.quests.map((q) => {
            if (q.id === questId && q.completed && !q.claimed) {
              coinsToAdd = q.rewardCoins;
              return { ...q, claimed: true };
            }
            return q;
          });
          return {
            progressByProfile: {
              ...state.progressByProfile,
              [profileId]: {
                ...current,
                coins: current.coins + coinsToAdd,
                dailyQuests: { ...current.dailyQuests, quests },
              },
            },
          };
        });
        return coinsToAdd;
      },
    }),
    {
      name: 'kidquest_progress',
    }
  )
);
