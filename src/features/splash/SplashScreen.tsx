import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/useSettingsStore';

export const SplashScreen: React.FC = () => {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();
  const { locale, setLocale } = useSettingsStore();

  const handleStart = () => {
    navigate('/home');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between p-6 bg-gradient-to-b from-sky-top to-sky-bottom select-none">
      {/* Language Switch at top right */}
      <div className="w-full max-w-md flex justify-end">
        <div className="inline-flex p-1 bg-black/20 rounded-full border-2 border-white/40">
          <button
            onClick={() => setLocale('vi')}
            className={`px-3 py-1 rounded-full text-xs font-bold font-display transition-all ${
              locale === 'vi' ? 'bg-amber-400 text-stone-900 shadow-md scale-105' : 'text-white/80'
            }`}
          >
            🇻🇳 VI
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`px-3 py-1 rounded-full text-xs font-bold font-display transition-all ${
              locale === 'en' ? 'bg-amber-400 text-stone-900 shadow-md scale-105' : 'text-white/80'
            }`}
          >
            🇬🇧 EN
          </button>
        </div>
      </div>

      {/* Center Game Logo & Mascot placeholder */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="text-game-display text-title-gold tracking-wide mb-2 animate-bounce">
          {t('common:app.name')}
        </div>
        <p className="text-white font-bold text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {t('common:app.subtitle')}
        </p>

        {/* Mascot placeholder icon / container */}
        <div className="w-44 h-44 my-6 bg-white/20 rounded-full border-4 border-white/60 flex items-center justify-center shadow-xl backdrop-blur-sm">
          <span className="text-7xl">🐱</span>
        </div>

        {/* Tip */}
        <div className="max-w-xs px-4 py-2 bg-black/30 rounded-2xl border border-white/20 text-white text-sm text-center">
          💡 {t('home:splash.tip')}
        </div>
      </div>

      {/* Start Button */}
      <div className="w-full max-w-sm pb-8">
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-3xl bg-gradient-to-b from-btn-green-top via-btn-green-base to-btn-green-bottom border-4 border-btn-green-edge text-white font-display text-2xl font-extrabold shadow-[0_6px_0_var(--btn-green-edge)] active:translate-y-1 active:shadow-[0_2px_0_var(--btn-green-edge)] transition-all cursor-pointer"
        >
          {t('home:splash.tapToStart')}
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
