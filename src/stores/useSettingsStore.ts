import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import { Locale } from '@/types';

interface SettingsState {
  // Audio
  soundEffects: boolean;
  soundVolume: number;
  bgMusic: boolean;
  musicVolume: number;
  ttsVoice: boolean;
  speechRate: number;
  haptics: boolean;

  // Visual & Accessibility
  reducedMotion: boolean;
  highLegibility: boolean;
  darkTheme: boolean;

  // Language & Localization
  locale: Locale;

  // Parental Safety Controls
  screenTimeEnabled: boolean;
  dailyScreenTimeLimit: number; // in minutes
  breakReminder: boolean;
  naturalEnergyEnabled: boolean;

  // Actions
  toggleSoundEffects: () => void;
  setSoundVolume: (vol: number) => void;
  toggleBgMusic: () => void;
  setMusicVolume: (vol: number) => void;
  toggleTtsVoice: () => void;
  setSpeechRate: (rate: number) => void;
  toggleHaptics: () => void;
  toggleReducedMotion: () => void;
  toggleHighLegibility: () => void;
  toggleDarkTheme: () => void;
  setLocale: (lng: Locale) => void;
  setScreenTimeSettings: (settings: {
    screenTimeEnabled: boolean;
    dailyScreenTimeLimit: number;
    breakReminder: boolean;
    naturalEnergyEnabled: boolean;
  }) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      soundEffects: true,
      soundVolume: 0.8,
      bgMusic: true,
      musicVolume: 0.3,
      ttsVoice: true,
      speechRate: 1.0,
      haptics: true,

      reducedMotion: false,
      highLegibility: false,
      darkTheme: false,

      locale: 'vi',

      screenTimeEnabled: false,
      dailyScreenTimeLimit: 45,
      breakReminder: true,
      naturalEnergyEnabled: true,

      toggleSoundEffects: () => set((s) => ({ soundEffects: !s.soundEffects })),
      setSoundVolume: (vol) => set({ soundVolume: Math.max(0, Math.min(1, vol)) }),
      toggleBgMusic: () => set((s) => ({ bgMusic: !s.bgMusic })),
      setMusicVolume: (vol) => set({ musicVolume: Math.max(0, Math.min(1, vol)) }),
      toggleTtsVoice: () => set((s) => ({ ttsVoice: !s.ttsVoice })),
      setSpeechRate: (rate) => set({ speechRate: Math.max(0.7, Math.min(1.4, rate)) }),
      toggleHaptics: () => set((s) => ({ haptics: !s.haptics })),

      toggleReducedMotion: () => {
        const next = !get().reducedMotion;
        set({ reducedMotion: next });
        if (next) {
          document.documentElement.classList.add('reduce-motion');
        } else {
          document.documentElement.classList.remove('reduce-motion');
        }
      },

      toggleHighLegibility: () => {
        const next = !get().highLegibility;
        set({ highLegibility: next });
        if (next) {
          document.documentElement.classList.add('high-legibility');
        } else {
          document.documentElement.classList.remove('high-legibility');
        }
      },

      toggleDarkTheme: () => {
        const next = !get().darkTheme;
        set({ darkTheme: next });
        if (next) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      },

      setLocale: (lng: Locale) => {
        set({ locale: lng });
        i18n.changeLanguage(lng);
        document.documentElement.setAttribute('lang', lng);
        localStorage.setItem('kidquest_lng', lng);
      },

      setScreenTimeSettings: (settings) => {
        set(settings);
      },
    }),
    {
      name: 'kidquest_settings',
    }
  )
);
