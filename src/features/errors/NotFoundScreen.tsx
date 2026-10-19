import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const NotFoundScreen: React.FC = () => {
  const { t } = useTranslation(['errors', 'common']);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-top to-sky-bottom p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm bg-panel-bg rounded-3xl border-4 border-panel-edge p-6 shadow-2xl text-center">
        <div className="w-24 h-24 mx-auto mb-4 bg-white/40 rounded-full border-3 border-stone-400 flex items-center justify-center text-5xl">
          🗺️
        </div>
        <h1 className="text-xl font-display font-extrabold text-ink mb-2">
          {t('errors:notFound.title')}
        </h1>
        <p className="text-xs text-ink-soft mb-6 leading-relaxed">
          {t('errors:notFound.description')}
        </p>

        <button
          onClick={() => navigate('/home')}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-btn-green-top via-btn-green-base to-btn-green-bottom border-3 border-btn-green-edge text-white font-display font-extrabold text-sm shadow active:translate-y-0.5 cursor-pointer"
        >
          {t('errors:notFound.backHome')}
        </button>
      </div>
    </div>
  );
};

export default NotFoundScreen;
