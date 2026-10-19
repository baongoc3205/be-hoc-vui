import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Topic, Lesson } from '@/types';
import { mockApiClient } from '@/services/api';
import { useProfileStore } from '@/stores/useProfileStore';
import { useProgressStore } from '@/stores/useProgressStore';

export const MapScreen: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { t } = useTranslation(['subjects', 'common']);
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.getActiveProfile());
  const progress = useProgressStore((s) => s.getProfileProgress(profile?.id || 'default-profile-1'));

  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (subjectId && profile) {
      mockApiClient.getTopicsBySubjectAndGrade(subjectId as any, profile.grade).then(async (topList) => {
        setTopics(topList);
        if (topList.length > 0) {
          const lPromises = topList[0].lessonIds.map((id) => mockApiClient.getLesson(id));
          const loaded = await Promise.all(lPromises);
          setLessons(loaded.filter((l): l is Lesson => Boolean(l)));
        }
      });
    }
  }, [subjectId, profile]);

  const handleStartLesson = (lesson: Lesson) => {
    navigate(`/play/${lesson.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-top via-sky-bottom to-grass p-4 flex flex-col items-center">
      {/* Top Bar */}
      <header className="w-full max-w-md flex items-center justify-between py-2">
        <button
          onClick={() => navigate('/worlds')}
          className="px-3 py-1.5 rounded-full bg-white/80 border-2 border-stone-600 font-bold text-xs"
        >
          ← {t('common:action.back')}
        </button>
        <div className="flex flex-col items-center">
          <span className="font-display font-extrabold text-white drop-shadow text-lg">
            {subjectId ? t(`subjects:worlds.${subjectId}`) : 'Bản đồ'}
          </span>
          {topics[0] && (
            <span className="text-[11px] font-bold text-white/90 drop-shadow">
              {topics[0].title.vi}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-hud-pill px-2.5 py-1 rounded-full text-white text-xs font-bold border border-white/30">
          ⭐ {Object.values(progress.lessons).reduce((acc, l) => acc + l.stars, 0)}
        </div>
      </header>

      {/* Map Nodes winding list */}
      <main className="w-full max-w-md flex-1 flex flex-col items-center py-8 gap-8 overflow-y-auto">
        {lessons.map((lesson, index) => {
          const completion = progress.lessons[lesson.id];
          const isUnlocked = index === 0 || Boolean(progress.lessons[lessons[index - 1]?.id]?.stars > 0);
          const stars = completion?.stars || 0;

          // Alternate left and right winding position
          const offsetX = (index % 3 === 0 ? 'translate-x-0' : index % 3 === 1 ? '-translate-x-12' : 'translate-x-12');

          return (
            <div
              key={lesson.id}
              onClick={() => isUnlocked && setSelectedLesson(lesson)}
              className={`flex flex-col items-center cursor-pointer transition-all ${offsetX}`}
            >
              <div
                className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-display font-extrabold text-xl shadow-lg relative ${
                  !isUnlocked
                    ? 'bg-stone-300 border-stone-500 text-stone-500 cursor-not-allowed opacity-80'
                    : lesson.kind === 'boss'
                    ? 'bg-gradient-to-b from-red-400 to-red-600 border-red-800 text-white animate-pulse'
                    : lesson.kind === 'chest'
                    ? 'bg-gradient-to-b from-amber-300 to-amber-500 border-amber-700 text-white'
                    : stars > 0
                    ? 'bg-gradient-to-b from-btn-green-top to-btn-green-bottom border-btn-green-edge text-white'
                    : 'bg-gradient-to-b from-btn-blue-top to-btn-blue-bottom border-btn-blue-edge text-white'
                }`}
              >
                {lesson.kind === 'chest' ? '🎁' : lesson.kind === 'boss' ? '👑' : index + 1}

                {/* Stars below button */}
                {isUnlocked && lesson.kind === 'normal' && (
                  <div className="absolute -bottom-3 flex gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <span key={s} className="text-xs">
                        {s <= stars ? '⭐' : '⚪'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="mt-4 text-xs font-bold text-ink bg-white/80 px-2 py-0.5 rounded-full border border-stone-300 max-w-[120px] truncate text-center">
                {lesson.title.vi}
              </span>
            </div>
          );
        })}
      </main>

      {/* Start Lesson Modal Popup */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-panel-bg rounded-3xl border-4 border-panel-edge p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedLesson(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-red-500 border-2 border-white text-white font-extrabold flex items-center justify-center shadow-md"
            >
              ✕
            </button>
            <h3 className="text-lg font-display font-extrabold text-ink text-center mb-1">
              {selectedLesson.title.vi}
            </h3>
            <p className="text-xs text-ink-soft text-center mb-4">
              {t('subjects:lessonModal.goal', {
                correct: selectedLesson.goal.minCorrect,
                total: selectedLesson.questionCount,
              })}
            </p>

            <div className="bg-white/60 p-3 rounded-2xl border-2 border-stone-200 mb-6 text-xs space-y-1.5 font-bold text-ink">
              <div className="flex justify-between">
                <span>{t('subjects:lessonModal.gameType')}:</span>
                <span className="text-btn-blue-bottom font-display">{selectedLesson.gameType}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('subjects:lessonModal.energyCost')}</span>
                <span>⚡ -1</span>
              </div>
            </div>

            <button
              onClick={() => handleStartLesson(selectedLesson)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-btn-green-top via-btn-green-base to-btn-green-bottom border-3 border-btn-green-edge text-white font-display font-extrabold shadow-md active:translate-y-0.5 cursor-pointer"
            >
              {t('subjects:lessonModal.startPlay')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapScreen;
