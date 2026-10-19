import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useProfileStore } from '@/stores/useProfileStore';

export const DevUiScreen: React.FC = () => {
  const navigate = useNavigate();
  const { darkTheme, toggleDarkTheme, locale, setLocale } = useSettingsStore();
  const { profiles, activeProfileId, updateProfile } = useProfileStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const colors = [
    { name: 'green', top: 'var(--btn-green-top)', base: 'var(--btn-green-base)', edge: 'var(--btn-green-edge)' },
    { name: 'orange', top: 'var(--btn-orange-top)', base: 'var(--btn-orange-base)', edge: 'var(--btn-orange-edge)' },
    { name: 'blue', top: 'var(--btn-blue-top)', base: 'var(--btn-blue-base)', edge: 'var(--btn-blue-edge)' },
    { name: 'purple', top: 'var(--btn-purple-top)', base: 'var(--btn-purple-base)', edge: 'var(--btn-purple-edge)' },
    { name: 'pink', top: 'var(--btn-pink-top)', base: 'var(--btn-pink-base)', edge: 'var(--btn-pink-edge)' },
    { name: 'gray (disabled)', top: 'var(--btn-gray-top)', base: 'var(--btn-gray-base)', edge: 'var(--btn-gray-edge)' },
  ];

  const setAgeTheme = (theme: 'sprout' | 'bud' | 'wing') => {
    if (activeProfile) {
      updateProfile(activeProfile.id, { ageTheme: theme });
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl border-3 border-stone-300 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-display font-extrabold text-stone-800">
              🛠️ KidQuest Design System (/dev/ui)
            </h1>
            <p className="text-xs text-stone-500">
              Bảng kiểm thử token màu, button 5 lớp, ribbon, panel, typography tiếng Việt và themes.
            </p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="px-3 py-1.5 rounded-full border border-stone-400 font-bold text-xs"
          >
            ← Về Sảnh
          </button>
        </div>

        {/* Global Controls */}
        <div className="p-4 bg-stone-50 rounded-2xl border flex flex-wrap items-center gap-3">
          <button
            onClick={toggleDarkTheme}
            className="px-3 py-1.5 rounded-xl bg-stone-800 text-white font-bold text-xs"
          >
            🌙 Dark Mode: {darkTheme ? 'BẬT' : 'TẮT'}
          </button>
          <button
            onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            🌐 Ngôn ngữ: {locale.toUpperCase()}
          </button>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-stone-600">Theme tuổi:</span>
            {(['sprout', 'bud', 'wing'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAgeTheme(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  activeProfile?.ageTheme === t ? 'bg-amber-500 text-white' : 'bg-stone-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Typography & Vietnamese Diacritics with Text Stroke */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            1. Typography & Text-Stroke Tiếng Việt
          </h2>
          <div className="p-4 bg-sky-200 rounded-2xl border space-y-2">
            <div className="text-title-gold text-game-display">
              BÉ HỌC VUI - 123
            </div>
            <div className="text-game text-game-green text-2xl">
              HOÀN THÀNH XUẤT SẮC! (Thử thách tiếng Việt: ắ, ế, ổ, ử, ỹ)
            </div>
            <div className="text-game text-game-orange text-lg">
              Dấu tiếng Việt không bị bết nét: "Chào mừng các bạn nhỏ đến với Đảo Con Số!"
            </div>
          </div>
        </section>

        {/* Buttons Palette */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            2. Candy Buttons (5 Lớp 3D)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {colors.map((c) => (
              <button
                key={c.name}
                style={{
                  background: `linear-gradient(180deg, ${c.top} 0%, ${c.base} 100%)`,
                  borderColor: c.edge,
                  boxShadow: `0 5px 0 ${c.edge}`,
                }}
                className="py-3 px-4 rounded-2xl border-3 text-white font-display font-extrabold text-sm active:translate-y-1 active:shadow-[0_1px_0_transparent] transition-all cursor-pointer text-center"
              >
                NÚT {c.name.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* Panel & Ribbon Preview */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            3. Panel & Ribbon Popup
          </h2>
          <div className="p-6 bg-panel-bg rounded-3xl border-4 border-panel-edge relative shadow-xl">
            {/* Corner Close Button */}
            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500 border-2 border-white text-white font-extrabold flex items-center justify-center shadow-md">
              ✕
            </div>
            <div className="text-center font-display font-extrabold text-lg text-ink">
              Khung Panel Game với nền màu kem và viền dày đặc trưng
            </div>
            <p className="text-xs text-ink-soft text-center mt-2">
              Mọi thành phần tuân thủ nghiêm ngặt tokens.css, hỗ trợ đầy đủ chế độ Mầm Xanh, Chồi Non, Cánh Bay.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DevUiScreen;
