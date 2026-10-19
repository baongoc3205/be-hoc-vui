import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BadgeItem } from '@/types';
import { mockApiClient } from '@/services/api';
import { useProfileStore } from '@/stores/useProfileStore';
import { useProgressStore } from '@/stores/useProgressStore';

export const RewardsScreen: React.FC = () => {
  const { t } = useTranslation(['rewards', 'common']);
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.getActiveProfile());
  const progress = useProgressStore((s) => s.getProfileProgress(profile?.id || 'default-profile-1'));
  const [badges, setBadges] = useState<BadgeItem[]>([]);

  useEffect(() => {
    mockApiClient.getBadges().then(setBadges);
  }, []);

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
          {t('rewards:badges.title')}
        </h1>
        <div className="w-12" />
      </header>

      {/* Badges Grid */}
      <main className="w-full max-w-md flex-1 bg-panel-bg rounded-3xl border-4 border-panel-edge p-4 shadow-xl overflow-y-auto">
        <p className="text-xs text-ink-soft text-center mb-4 font-bold">
          {t('rewards:badges.earned', {
            count: progress.badges.length,
            total: badges.length,
          })}
        </p>

        <div className="grid grid-cols-3 gap-3">
          {badges.map((b) => {
            const isUnlocked = progress.badges.includes(b.id);
            return (
              <div
                key={b.id}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                  isUnlocked
                    ? 'bg-amber-100/60 border-amber-500 shadow-sm'
                    : 'bg-stone-200/50 border-stone-300 opacity-50 grayscale'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center text-2xl shadow-inner mb-1">
                  {isUnlocked ? '🏅' : '🔒'}
                </div>
                <span className="font-display font-extrabold text-xs text-ink line-clamp-1">
                  {b.name.vi}
                </span>
                <span className="text-[10px] text-ink-soft line-clamp-2 mt-0.5">
                  {b.description.vi}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default RewardsScreen;
