import React, { useEffect } from 'react';
import { AppRouter } from './router';
import { useProfileStore } from '@/stores/useProfileStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export const App: React.FC = () => {
  const profile = useProfileStore((s) => s.getActiveProfile());
  const { darkTheme, locale, reducedMotion } = useSettingsStore();

  useEffect(() => {
    // Sync age theme to HTML attribute
    if (profile?.ageTheme) {
      document.documentElement.setAttribute('data-age', profile.ageTheme);
    }
  }, [profile?.ageTheme]);

  useEffect(() => {
    // Sync dark theme
    if (darkTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkTheme]);

  useEffect(() => {
    // Sync language
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  useEffect(() => {
    // Sync reduced motion
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [reducedMotion]);

  return <AppRouter />;
};

export default App;
