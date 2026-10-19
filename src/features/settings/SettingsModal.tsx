import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useProfileStore } from '@/stores/useProfileStore';

export const SettingsModal: React.FC = () => {
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const { profiles, activeProfileId, updateProfile } = useProfileStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  return (
    <div className="min-h-screen bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-panel-bg rounded-3xl border-4 border-panel-edge p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-red-500 border-2 border-white text-white font-extrabold flex items-center justify-center shadow-md cursor-pointer"
        >
          ✕
        </button>

        <h1 className="text-xl font-display font-extrabold text-ink text-center mb-4">
          {t('settings:title')}
        </h1>

        {/* Audio Section */}
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
            {t('settings:audioSection')}
          </h2>

          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border-2 border-stone-200">
            <span className="font-display font-bold text-xs text-ink">{t('settings:soundEffects')}</span>
            <input
              type="checkbox"
              checked={settings.soundEffects}
              onChange={settings.toggleSoundEffects}
              className="w-5 h-5 accent-btn-green-base cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border-2 border-stone-200">
            <span className="font-display font-bold text-xs text-ink">{t('settings:bgMusic')}</span>
            <input
              type="checkbox"
              checked={settings.bgMusic}
              onChange={settings.toggleBgMusic}
              className="w-5 h-5 accent-btn-green-base cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border-2 border-stone-200">
            <span className="font-display font-bold text-xs text-ink">{t('settings:ttsVoice')}</span>
            <input
              type="checkbox"
              checked={settings.ttsVoice}
              onChange={settings.toggleTtsVoice}
              className="w-5 h-5 accent-btn-green-base cursor-pointer"
            />
          </div>
        </div>

        {/* Display & Accessibility */}
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
            {t('settings:displaySection')}
          </h2>

          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border-2 border-stone-200">
            <span className="font-display font-bold text-xs text-ink">{t('settings:reducedMotion')}</span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={settings.toggleReducedMotion}
              className="w-5 h-5 accent-btn-green-base cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border-2 border-stone-200">
            <span className="font-display font-bold text-xs text-ink">{t('settings:darkMode')}</span>
            <input
              type="checkbox"
              checked={settings.darkTheme}
              onChange={settings.toggleDarkTheme}
              className="w-5 h-5 accent-btn-green-base cursor-pointer"
            />
          </div>
        </div>

        {/* Language & Age Theme */}
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
            {t('settings:languageSection')}
          </h2>

          <div className="flex gap-2">
            <button
              onClick={() => settings.setLocale('vi')}
              className={`flex-1 py-2.5 rounded-2xl font-display font-bold text-xs border-2 transition-all ${
                settings.locale === 'vi'
                  ? 'bg-btn-orange-base text-white border-btn-orange-edge shadow-sm'
                  : 'bg-white text-ink border-stone-300'
              }`}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              onClick={() => settings.setLocale('en')}
              className={`flex-1 py-2.5 rounded-2xl font-display font-bold text-xs border-2 transition-all ${
                settings.locale === 'en'
                  ? 'bg-btn-orange-base text-white border-btn-orange-edge shadow-sm'
                  : 'bg-white text-ink border-stone-300'
              }`}
            >
              🇬🇧 English
            </button>
          </div>

          {activeProfile && (
            <div className="flex gap-2 pt-1">
              {(['sprout', 'bud', 'wing'] as const).map((tCode) => (
                <button
                  key={tCode}
                  onClick={() => updateProfile(activeProfile.id, { ageTheme: tCode })}
                  className={`flex-1 py-2 rounded-xl font-display font-bold text-[11px] border-2 transition-all ${
                    activeProfile.ageTheme === tCode
                      ? 'bg-btn-green-base text-white border-btn-green-edge shadow-sm'
                      : 'bg-white text-ink border-stone-300'
                  }`}
                >
                  {tCode === 'sprout' ? 'Mầm Xanh' : tCode === 'bud' ? 'Chồi Non' : 'Cánh Bay'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Developer Links */}
        <div className="border-t pt-4 flex gap-2">
          <button
            onClick={() => navigate('/dev/ui')}
            className="flex-1 py-2 bg-stone-100 rounded-xl text-[11px] font-bold text-stone-600 border border-stone-300 hover:bg-stone-200"
          >
            🎨 UI Gallery
          </button>
          <button
            onClick={() => navigate('/dev/art')}
            className="flex-1 py-2 bg-stone-100 rounded-xl text-[11px] font-bold text-stone-600 border border-stone-300 hover:bg-stone-200"
          >
            🐱 Art Gallery
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
