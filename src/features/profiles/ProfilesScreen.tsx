import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '@/stores/useProfileStore';

export const ProfilesScreen: React.FC = () => {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();
  const { profiles, activeProfileId, setActiveProfileId } = useProfileStore();

  const handleSelect = (id: string) => {
    setActiveProfileId(id);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-top to-sky-bottom p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-panel-bg rounded-3xl border-4 border-panel-edge p-6 shadow-2xl">
        <h1 className="text-2xl font-display font-extrabold text-center text-ink mb-2">
          {t('home:profiles.title')}
        </h1>
        <p className="text-sm text-center text-ink-soft mb-6">
          {t('home:profiles.subtitle')}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {profiles.map((p) => (
            <div
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className={`p-4 rounded-2xl border-3 flex flex-col items-center cursor-pointer transition-all ${
                p.id === activeProfileId
                  ? 'border-btn-green-edge bg-green-50 shadow-md scale-105'
                  : 'border-stone-300 bg-white hover:border-btn-blue-edge'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-amber-200 border-2 border-stone-600 flex items-center justify-center text-3xl mb-2">
                🧒
              </div>
              <span className="font-display font-bold text-ink">{p.nickname}</span>
              <span className="text-xs text-ink-soft">{t('home:profiles.grade', { grade: p.grade })}</span>
            </div>
          ))}

          {profiles.length < 4 && (
            <div
              onClick={() => navigate('/onboarding')}
              className="p-4 rounded-2xl border-3 border-dashed border-stone-400 bg-white/50 flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-2xl text-stone-600 mb-2">
                +
              </div>
              <span className="font-display font-bold text-xs text-stone-600">
                {t('home:profiles.newProfile')}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/home')}
          className="w-full py-3 rounded-2xl bg-gradient-to-b from-btn-blue-top to-btn-blue-bottom border-3 border-btn-blue-edge text-white font-display font-bold shadow-md active:translate-y-0.5 cursor-pointer"
        >
          {t('common:action.back')}
        </button>
      </div>
    </div>
  );
};

export default ProfilesScreen;
