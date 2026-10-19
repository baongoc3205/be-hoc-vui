import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '@/stores/useProfileStore';
import { useProgressStore } from '@/stores/useProgressStore';

export const LobbyScreen: React.FC = () => {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.getActiveProfile());
  const progress = useProgressStore((s) => s.getProfileProgress(profile?.id || 'default-profile-1'));

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-top via-sky-bottom to-grass p-4 flex flex-col items-center">
      {/* Top HUD */}
      <header className="w-full max-w-md flex items-center justify-between gap-2 py-2">
        {/* Profile pill */}
        <div
          onClick={() => navigate('/me')}
          className="flex items-center gap-2 bg-hud-pill backdrop-blur-md px-3 py-1.5 rounded-full border-2 border-white/30 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-amber-300 border-2 border-white flex items-center justify-center font-bold text-sm">
            {profile?.nickname?.[0] || 'B'}
          </div>
          <span className="text-white text-xs font-bold font-display">
            {t('common:resources.level')} {progress.level}
          </span>
        </div>

        {/* Resources */}
        <div className="flex items-center gap-2">
          {/* Energy */}
          <div className="flex items-center gap-1 bg-hud-pill backdrop-blur-md px-2.5 py-1 rounded-full border-2 border-white/30 text-white font-bold text-xs">
            <span>⚡</span>
            <span>{progress.energy.value}/10</span>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-1 bg-hud-pill backdrop-blur-md px-2.5 py-1 rounded-full border-2 border-white/30 text-white font-bold text-xs">
            <span>🪙</span>
            <span>{progress.coins}</span>
          </div>

          {/* Gems */}
          <div className="flex items-center gap-1 bg-hud-pill backdrop-blur-md px-2.5 py-1 rounded-full border-2 border-white/30 text-white font-bold text-xs">
            <span>💎</span>
            <span>{progress.gems}</span>
          </div>
        </div>
      </header>

      {/* Main Island Center */}
      <main className="flex-1 w-full max-w-md flex flex-col items-center justify-center text-center my-6">
        <div className="w-64 h-64 relative flex items-center justify-center bg-white/10 rounded-full border-4 border-white/30 backdrop-blur-sm shadow-2xl">
          <div className="text-8xl select-none animate-bounce">🐱</div>
          <div className="absolute -bottom-4 px-4 py-1.5 bg-panel-bg rounded-2xl border-4 border-panel-edge shadow-md">
            <span className="text-ink font-bold text-sm font-display">
              {profile?.nickname} (Lớp {profile?.grade})
            </span>
          </div>
        </div>

        {/* Play Next Button */}
        <div className="mt-8 w-full px-6">
          <button
            onClick={() => navigate('/worlds')}
            className="w-full py-4 rounded-3xl bg-gradient-to-b from-btn-green-top via-btn-green-base to-btn-green-bottom border-4 border-btn-green-edge text-white font-display text-2xl font-extrabold shadow-[0_6px_0_var(--btn-green-edge)] active:translate-y-1 active:shadow-[0_2px_0_var(--btn-green-edge)] transition-all cursor-pointer"
          >
            {t('home:lobby.playNext')}
          </button>
        </div>
      </main>

      {/* Bottom Nav Dock */}
      <nav className="w-full max-w-md bg-panel-bg/95 backdrop-blur-md rounded-t-3xl border-t-4 border-x-4 border-panel-edge px-4 py-2 flex items-center justify-around shadow-2xl">
        <button onClick={() => navigate('/rewards')} className="flex flex-col items-center text-xs font-bold font-display text-ink-soft hover:text-ink">
          <span className="text-xl">🏆</span>
          <span>{t('common:nav.rewards')}</span>
        </button>
        <button onClick={() => navigate('/shop')} className="flex flex-col items-center text-xs font-bold font-display text-ink-soft hover:text-ink">
          <span className="text-xl">🛍️</span>
          <span>{t('common:nav.shop')}</span>
        </button>
        <button onClick={() => navigate('/home')} className="flex flex-col items-center text-xs font-extrabold font-display text-btn-green-bottom -translate-y-2">
          <div className="w-12 h-12 rounded-full bg-btn-green-base border-3 border-btn-green-edge flex items-center justify-center text-white text-2xl shadow-md">
            🏠
          </div>
          <span>{t('common:nav.lobby')}</span>
        </button>
        <button onClick={() => navigate('/worlds')} className="flex flex-col items-center text-xs font-bold font-display text-ink-soft hover:text-ink">
          <span className="text-xl">🗺️</span>
          <span>{t('common:nav.worlds')}</span>
        </button>
        <button onClick={() => navigate('/me')} className="flex flex-col items-center text-xs font-bold font-display text-ink-soft hover:text-ink">
          <span className="text-xl">👤</span>
          <span>{t('common:nav.me')}</span>
        </button>
      </nav>
    </div>
  );
};

export default LobbyScreen;
