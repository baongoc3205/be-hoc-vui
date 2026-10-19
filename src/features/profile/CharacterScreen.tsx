import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '@/stores/useProfileStore';
import { useProgressStore } from '@/stores/useProgressStore';

export const CharacterScreen: React.FC = () => {
  const { t } = useTranslation(['rewards', 'common']);
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.getActiveProfile());
  const progress = useProgressStore((s) => s.getProfileProgress(profile?.id || 'default-profile-1'));

  const totalStars = Object.values(progress.lessons).reduce((acc, l) => acc + l.stars, 0);
  const lessonsCleared = Object.values(progress.lessons).filter((l) => l.stars > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-top via-sky-bottom to-grass p-4 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between py-2">
        <button
          onClick={() => navigate('/home')}
          className="px-3 py-1.5 rounded-full bg-white/80 border-2 border-stone-600 font-bold text-xs"
        >
          ← {t('common:action.back')}
        </button>
        <h1 className="text-xl font-display font-extrabold text-white drop-shadow">
          {t('rewards:me.title')}
        </h1>
        <button
          onClick={() => navigate('/settings')}
          className="w-8 h-8 rounded-full bg-white/80 border-2 border-stone-600 flex items-center justify-center text-sm"
        >
          ⚙️
        </button>
      </header>

      {/* Main Avatar Showcase */}
      <main className="w-full max-w-md flex-1 flex flex-col items-center py-4">
        <div className="w-48 h-48 rounded-full bg-white/30 border-4 border-white/60 flex items-center justify-center backdrop-blur-sm shadow-xl relative mb-4">
          <div className="text-8xl">🧒</div>
          <div className="absolute -bottom-2 px-3 py-1 bg-amber-400 border-2 border-amber-700 rounded-full text-stone-900 font-display font-bold text-xs shadow-md">
            {t('rewards:me.levelBadge', { level: progress.level })}
          </div>
        </div>

        <h2 className="text-xl font-display font-extrabold text-white drop-shadow">
          {profile?.nickname}
        </h2>
        <span className="text-xs text-white/90 font-bold drop-shadow mb-6">
          Lớp {profile?.grade} · Nhóm {profile?.ageTheme}
        </span>

        {/* Fun Stats Panel */}
        <div className="w-full bg-panel-bg rounded-3xl border-4 border-panel-edge p-5 shadow-xl space-y-4">
          <h3 className="font-display font-extrabold text-ink text-sm">
            {t('rewards:me.stats')}
          </h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-white rounded-2xl border-2 border-stone-200">
              <span className="text-2xl">⭐</span>
              <p className="font-display font-extrabold text-lg text-ink mt-1">{totalStars}</p>
              <span className="text-[10px] text-ink-soft">{t('rewards:me.totalStars')}</span>
            </div>

            <div className="p-3 bg-white rounded-2xl border-2 border-stone-200">
              <span className="text-2xl">🚩</span>
              <p className="font-display font-extrabold text-lg text-ink mt-1">{lessonsCleared}</p>
              <span className="text-[10px] text-ink-soft">{t('rewards:me.lessonsCompleted')}</span>
            </div>

            <div className="p-3 bg-white rounded-2xl border-2 border-stone-200">
              <span className="text-2xl">🔥</span>
              <p className="font-display font-extrabold text-lg text-ink mt-1">{progress.streak.days}</p>
              <span className="text-[10px] text-ink-soft">{t('rewards:me.streakDays')}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => navigate('/profiles')}
              className="flex-1 py-3 rounded-2xl bg-white border-2 border-stone-300 font-display font-bold text-xs text-ink hover:border-btn-blue-edge"
            >
              Đổi hồ sơ
            </button>
            <button
              onClick={() => navigate('/parents/gate')}
              className="flex-1 py-3 rounded-2xl bg-stone-100 border-2 border-stone-300 font-display font-bold text-xs text-ink hover:border-stone-500"
            >
              🔒 {t('common:nav.parents')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CharacterScreen;
