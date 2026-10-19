import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProfileStore, gradeToAgeTheme, defaultAvatar } from '@/stores/useProfileStore';
import { Grade, SubjectId } from '@/types';

export const OnboardingScreen: React.FC = () => {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();
  const createProfile = useProfileStore((s) => s.createProfile);

  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState<Grade>(3);
  const [favoriteSubjects, setFavoriteSubjects] = useState<SubjectId[]>(['math']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNickname = nickname.trim() || 'Bạn Nhỏ';
    createProfile({
      nickname: finalNickname.slice(0, 12),
      grade,
      ageTheme: gradeToAgeTheme(grade),
      avatar: defaultAvatar,
      favoriteSubjects,
    });
    navigate('/home');
  };

  const toggleSubject = (sub: SubjectId) => {
    if (favoriteSubjects.includes(sub)) {
      if (favoriteSubjects.length > 1) {
        setFavoriteSubjects(favoriteSubjects.filter((s) => s !== sub));
      }
    } else {
      setFavoriteSubjects([...favoriteSubjects, sub]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-top to-sky-bottom p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-panel-bg rounded-3xl border-4 border-panel-edge p-6 shadow-2xl">
        <h1 className="text-2xl font-display font-extrabold text-center text-ink mb-2">
          {t('home:onboarding.title')}
        </h1>
        <p className="text-xs text-center text-ink-soft mb-6">
          {t('home:onboarding.mimiGreeting')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1: Nickname */}
          <div>
            <label className="block text-sm font-bold font-display text-ink mb-1">
              {t('home:onboarding.stepNickname')}
            </label>
            <input
              type="text"
              maxLength={12}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('home:onboarding.nicknamePlaceholder')}
              className="w-full px-4 py-3 rounded-2xl border-3 border-stone-300 focus:border-btn-blue-base outline-none font-bold text-ink bg-white"
            />
          </div>

          {/* Step 2: Grade (1 to 9) */}
          <div>
            <label className="block text-sm font-bold font-display text-ink mb-1">
              {t('home:onboarding.stepGrade')}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {([1, 2, 3, 4, 5, 6, 7, 8, 9] as Grade[]).map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`py-2 rounded-xl font-display font-extrabold text-sm border-2 transition-all ${
                    grade === g
                      ? 'bg-btn-orange-base text-white border-btn-orange-edge shadow-md scale-105'
                      : 'bg-white text-ink border-stone-300 hover:border-btn-orange-base'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Favorite Subject */}
          <div>
            <label className="block text-sm font-bold font-display text-ink mb-1">
              {t('home:onboarding.stepFavorites')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'math', label: 'Toán học 🔢' },
                  { id: 'vietnamese', label: 'Tiếng Việt 📖' },
                  { id: 'english', label: 'Tiếng Anh 🌍' },
                  { id: 'science', label: 'Khoa học 🔬' },
                ] as const
              ).map((sub) => (
                <button
                  type="button"
                  key={sub.id}
                  onClick={() => toggleSubject(sub.id)}
                  className={`p-2.5 rounded-xl font-display font-bold text-xs border-2 text-center transition-all ${
                    favoriteSubjects.includes(sub.id)
                      ? 'bg-btn-green-base text-white border-btn-green-edge shadow-sm'
                      : 'bg-white text-ink border-stone-300'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 mt-4 rounded-3xl bg-gradient-to-b from-btn-green-top via-btn-green-base to-btn-green-bottom border-4 border-btn-green-edge text-white font-display text-xl font-extrabold shadow-[0_5px_0_var(--btn-green-edge)] active:translate-y-1 active:shadow-[0_2px_0_var(--btn-green-edge)] transition-all cursor-pointer"
          >
            {t('home:onboarding.finish')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingScreen;
