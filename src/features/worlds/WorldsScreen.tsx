import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Subject } from '@/types';
import { mockApiClient } from '@/services/api';

export const WorldsScreen: React.FC = () => {
  const { t } = useTranslation(['subjects', 'common']);
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    mockApiClient.getSubjects().then(setSubjects);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-top via-sky-bottom to-grass p-4 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between py-3">
        <button
          onClick={() => navigate('/home')}
          className="px-3 py-1.5 rounded-full bg-white/80 border-2 border-stone-600 font-bold text-xs"
        >
          ← {t('common:action.back')}
        </button>
        <h1 className="text-xl font-display font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {t('common:nav.worlds')}
        </h1>
        <div className="w-12" />
      </header>

      {/* World Cards */}
      <main className="w-full max-w-md flex-1 flex flex-col gap-4 py-4 overflow-y-auto">
        {subjects.map((sub) => (
          <div
            key={sub.id}
            onClick={() => navigate(`/map/${sub.id}`)}
            className="p-5 rounded-3xl border-4 border-panel-edge bg-panel-bg shadow-xl flex items-center justify-between cursor-pointer active:scale-98 transition-all hover:border-btn-blue-edge"
          >
            <div className="flex-1 pr-3">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold text-white mb-1" style={{ backgroundColor: sub.color }}>
                {t(`subjects:list.${sub.id}`)}
              </span>
              <h2 className="text-lg font-display font-extrabold text-ink">
                {t(`subjects:worlds.${sub.id}`)}
              </h2>
              <p className="text-xs text-ink-soft line-clamp-2 mt-1">
                {t(`subjects:worldDescriptions.${sub.id}`)}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl border-3 border-stone-500 bg-white flex items-center justify-center text-3xl shadow-inner">
              {sub.id === 'math' ? '🦉' : sub.id === 'vietnamese' ? '🐰' : sub.id === 'english' ? '🦊' : '🐸'}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default WorldsScreen;
