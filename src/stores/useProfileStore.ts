import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChildProfile, Grade, AgeTheme, AvatarConfig } from '@/types';

export const defaultAvatar: AvatarConfig = {
  skin: 'light',
  face: 'cheerful',
  hair: 'spiky',
  hairColor: '#4A2A0C',
  outfit: 'tshirt-blue',
  hat: 'cap-red',
  glasses: undefined,
  pet: undefined,
  frame: undefined,
};

export function gradeToAgeTheme(grade: Grade): AgeTheme {
  if (grade <= 2) return 'sprout';
  if (grade <= 5) return 'bud';
  return 'wing';
}

interface ProfileState {
  profiles: ChildProfile[];
  activeProfileId: string;
  createProfile: (profile: Omit<ChildProfile, 'id' | 'createdAt'>) => string;
  updateProfile: (id: string, updates: Partial<ChildProfile>) => void;
  deleteProfile: (id: string) => boolean;
  setActiveProfileId: (id: string) => void;
  getActiveProfile: () => ChildProfile | undefined;
}

const defaultProfiles: ChildProfile[] = [
  {
    id: 'default-profile-1',
    nickname: 'Bé Bi',
    grade: 3,
    ageTheme: 'bud',
    avatar: defaultAvatar,
    favoriteSubjects: ['math', 'english'],
    createdAt: new Date().toISOString(),
  },
];

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: defaultProfiles,
      activeProfileId: 'default-profile-1',

      createProfile: (data) => {
        const id = `profile-${Date.now()}`;
        const newProfile: ChildProfile = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          profiles: [...state.profiles, newProfile],
          activeProfileId: id,
        }));
        // Update html attribute
        document.documentElement.setAttribute('data-age', newProfile.ageTheme);
        return id;
      },

      updateProfile: (id, updates) => {
        set((state) => {
          const profiles = state.profiles.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          );
          if (id === state.activeProfileId && updates.ageTheme) {
            document.documentElement.setAttribute('data-age', updates.ageTheme);
          }
          return { profiles };
        });
      },

      deleteProfile: (id) => {
        const { profiles, activeProfileId } = get();
        if (profiles.length <= 1) {
          return false;
        }
        const updated = profiles.filter((p) => p.id !== id);
        let nextActive = activeProfileId;
        if (activeProfileId === id) {
          nextActive = updated[0].id;
        }
        set({
          profiles: updated,
          activeProfileId: nextActive,
        });
        const active = updated.find((p) => p.id === nextActive);
        if (active) {
          document.documentElement.setAttribute('data-age', active.ageTheme);
        }
        return true;
      },

      setActiveProfileId: (id) => {
        const profile = get().profiles.find((p) => p.id === id);
        if (profile) {
          set({ activeProfileId: id });
          document.documentElement.setAttribute('data-age', profile.ageTheme);
        }
      },

      getActiveProfile: () => {
        const { profiles, activeProfileId } = get();
        return profiles.find((p) => p.id === activeProfileId) || profiles[0];
      },
    }),
    {
      name: 'kidquest_profiles',
    }
  )
);
