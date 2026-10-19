import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import Vietnamese namespaces
import viCommon from './locales/vi/common.json';
import viHome from './locales/vi/home.json';
import viGames from './locales/vi/games.json';
import viSubjects from './locales/vi/subjects.json';
import viRewards from './locales/vi/rewards.json';
import viParents from './locales/vi/parents.json';
import viSettings from './locales/vi/settings.json';
import viErrors from './locales/vi/errors.json';

// Import English namespaces
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enGames from './locales/en/games.json';
import enSubjects from './locales/en/subjects.json';
import enRewards from './locales/en/rewards.json';
import enParents from './locales/en/parents.json';
import enSettings from './locales/en/settings.json';
import enErrors from './locales/en/errors.json';

export const defaultNS = 'common';

export const resources = {
  vi: {
    common: viCommon,
    home: viHome,
    games: viGames,
    subjects: viSubjects,
    rewards: viRewards,
    parents: viParents,
    settings: viSettings,
    errors: viErrors,
  },
  en: {
    common: enCommon,
    home: enHome,
    games: enGames,
    subjects: enSubjects,
    rewards: enRewards,
    parents: enParents,
    settings: enSettings,
    errors: enErrors,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    defaultNS,
    ns: ['common', 'home', 'games', 'subjects', 'rewards', 'parents', 'settings', 'errors'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'kidquest_lng',
      caches: ['localStorage'],
    },
  });

export default i18n;
