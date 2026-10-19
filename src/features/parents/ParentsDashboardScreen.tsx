import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useProfileStore } from '@/stores/useProfileStore';

export const ParentsDashboardScreen: React.FC = () => {
  const { t } = useTranslation(['parents', 'common']);
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const { profiles, deleteProfile } = useProfileStore();

  const [activeTab, setActiveTab] = useState<'report' | 'limits' | 'profiles'>('report');
  const [screenLimit, setScreenLimit] = useState(settings.dailyScreenTimeLimit);
  const [limitEnabled, setLimitEnabled] = useState(settings.screenTimeEnabled);
  const [breakReminder, setBreakReminder] = useState(settings.breakReminder);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveLimits = () => {
    settings.setScreenTimeSettings({
      screenTimeEnabled: limitEnabled,
      dailyScreenTimeLimit: screenLimit,
      breakReminder,
      naturalEnergyEnabled: settings.naturalEnergyEnabled,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDeleteProfile = (id: string) => {
    if (confirm(t('parents:dashboard.profiles.deleteConfirm'))) {
      const ok = deleteProfile(id);
      if (!ok) {
        alert(t('parents:dashboard.profiles.cannotDeleteLast'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200 p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div>
            <h1 className="text-xl font-display font-extrabold text-stone-800">
              {t('parents:dashboard.title')}
            </h1>
            <p className="text-xs text-stone-500">
              {t('parents:dashboard.subtitle')}
            </p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="px-3 py-1.5 rounded-full border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50"
          >
            ← {t('common:action.back')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2 mb-6">
          {(['report', 'limits', 'profiles'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-display transition-all ${
                activeTab === tab
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t(`parents:dashboard.tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* Tab 1: Weekly Report */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-xs text-stone-500">{t('parents:dashboard.weeklyReport.totalMinutes')}</span>
                <p className="text-2xl font-bold font-display text-stone-800 mt-1">45 phút</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-xs text-stone-500">{t('parents:dashboard.weeklyReport.lessonsDone')}</span>
                <p className="text-2xl font-bold font-display text-stone-800 mt-1">12 bài</p>
              </div>
            </div>
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-xs text-stone-500">{t('parents:dashboard.weeklyReport.averageAccuracy')}</span>
              <p className="text-xl font-bold font-display text-green-600 mt-1">88% (Rất tốt)</p>
            </div>
          </div>
        )}

        {/* Tab 2: Screen Time Limits */}
        {activeTab === 'limits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold text-stone-700">{t('parents:dashboard.timeLimits.status')}</span>
              <input
                type="checkbox"
                checked={limitEnabled}
                onChange={(e) => setLimitEnabled(e.target.checked)}
                className="w-5 h-5 accent-stone-800"
              />
            </div>

            {limitEnabled && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('parents:dashboard.timeLimits.dailyCap')}: {screenLimit} phút
                </label>
                <input
                  type="range"
                  min={15}
                  max={120}
                  step={5}
                  value={screenLimit}
                  onChange={(e) => setScreenLimit(Number(e.target.value))}
                  className="w-full accent-stone-800"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold text-stone-700">{t('parents:dashboard.timeLimits.breakReminder')}</span>
              <input
                type="checkbox"
                checked={breakReminder}
                onChange={(e) => setBreakReminder(e.target.checked)}
                className="w-5 h-5 accent-stone-800"
              />
            </div>

            <button
              onClick={handleSaveLimits}
              className="w-full py-3 rounded-2xl bg-stone-800 text-white font-bold text-xs hover:bg-stone-900 cursor-pointer"
            >
              {savedSuccess ? t('parents:dashboard.timeLimits.saved') : t('common:action.save')}
            </button>
          </div>
        )}

        {/* Tab 3: Profiles Management */}
        {activeTab === 'profiles' && (
          <div className="space-y-3">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-display font-bold text-sm text-stone-800">{p.nickname}</p>
                  <span className="text-xs text-stone-500">Lớp {p.grade} · Theme {p.ageTheme}</span>
                </div>
                <button
                  onClick={() => handleDeleteProfile(p.id)}
                  className="px-3 py-1 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100"
                >
                  {t('parents:dashboard.profiles.delete')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentsDashboardScreen;
