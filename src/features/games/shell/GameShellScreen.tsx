import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lesson, Question } from '@/types';
import { mockApiClient } from '@/services/api';
import { useProfileStore } from '@/stores/useProfileStore';
import { useProgressStore } from '@/stores/useProgressStore';

export const GameShellScreen: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { t } = useTranslation(['games', 'common']);
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.getActiveProfile());
  const recordLessonCompletion = useProgressStore((s) => s.recordLessonCompletion);
  const earnCoins = useProgressStore((s) => s.earnCoins);
  const addXp = useProgressStore((s) => s.addXp);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (lessonId) {
      mockApiClient.getLesson(lessonId).then(setLesson);
      mockApiClient.getQuestionsByLesson(lessonId).then(setQuestions);
    }
  }, [lessonId]);

  if (!lesson || questions.length === 0) {
    return (
      <div className="min-h-screen bg-sky-top flex items-center justify-center p-4">
        <div className="text-white font-display font-bold text-lg animate-pulse">
          {t('common:action.start')}...
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const handleSelectOption = (optId: string) => {
    if (showFeedback) return;
    setSelectedAnswer(optId);
  };

  const handleCheck = () => {
    if (!selectedAnswer) return;
    const correct = selectedAnswer === currentQ.answer;
    setIsCorrect(correct);
    if (correct) {
      setCorrectCount((c) => c + 1);
    }
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Finished lesson
      const total = questions.length;
      const finalCorrect = correctCount + (isCorrect ? 0 : 0);
      const ratio = finalCorrect / total;
      const stars = ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0;

      if (profile) {
        recordLessonCompletion(profile.id, lesson.id, stars as any, finalCorrect * 100);
        earnCoins(profile.id, lesson.rewards.coins);
        addXp(profile.id, lesson.rewards.xp);
      }
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-top via-sky-bottom to-grass p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm bg-panel-bg rounded-3xl border-4 border-panel-edge p-6 shadow-2xl text-center relative">
          <div className="text-6xl mb-3">🎉</div>
          <h2 className="text-2xl font-display font-extrabold text-title-gold mb-1">
            {t('games:result.titleWin')}
          </h2>
          <p className="text-sm font-bold text-ink mb-4">
            {t('games:result.correctCount', {
              correct: correctCount,
              total: questions.length,
            })}
          </p>

          <div className="flex justify-center gap-2 text-3xl mb-4">
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
          </div>

          <div className="p-3 bg-white/70 rounded-2xl border-2 border-stone-200 mb-6 text-xs font-bold text-ink flex justify-around">
            <span>🪙 +{lesson.rewards.coins} xu</span>
            <span>⚡ +{lesson.rewards.xp} XP</span>
          </div>

          <button
            onClick={() => navigate('/home')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-btn-green-top via-btn-green-base to-btn-green-bottom border-3 border-btn-green-edge text-white font-display font-extrabold text-lg shadow active:translate-y-0.5 cursor-pointer"
          >
            {t('games:result.continue')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-top via-sky-bottom to-grass p-4 flex flex-col items-center justify-between">
      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/home')}
          className="w-9 h-9 rounded-full bg-white/80 border-2 border-stone-600 font-bold text-sm flex items-center justify-center"
        >
          ✕
        </button>
        {/* Progress bar */}
        <div className="flex-1 h-4 bg-black/20 rounded-full border-2 border-white/60 overflow-hidden">
          <div
            className="h-full bg-btn-green-top transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-display font-extrabold text-white drop-shadow">
          {currentIndex + 1}/{questions.length}
        </span>
      </header>

      {/* Main Question Area */}
      <main className="w-full max-w-md flex-1 flex flex-col justify-center my-4">
        <div className="bg-panel-bg rounded-3xl border-4 border-panel-edge p-5 shadow-2xl mb-4">
          <h2 className="text-lg font-display font-bold text-ink text-center mb-4 leading-relaxed">
            {currentQ.prompt.vi}
          </h2>

          {/* Options */}
          {currentQ.options && (
            <div className="space-y-3">
              {currentQ.options.map((opt) => {
                const isSelected = selectedAnswer === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full p-4 rounded-2xl border-3 font-display font-bold text-sm text-left transition-all ${
                      isSelected
                        ? 'border-btn-blue-edge bg-blue-50 text-btn-blue-bottom shadow-md scale-102'
                        : 'border-stone-300 bg-white text-ink hover:border-btn-blue-top'
                    }`}
                  >
                    {opt.text?.vi || opt.id}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Action / Feedback Panel */}
      <footer className="w-full max-w-md pb-4">
        {!showFeedback ? (
          <button
            disabled={!selectedAnswer}
            onClick={handleCheck}
            className={`w-full py-4 rounded-3xl font-display font-extrabold text-xl transition-all ${
              selectedAnswer
                ? 'bg-gradient-to-b from-btn-green-top via-btn-green-base to-btn-green-bottom border-4 border-btn-green-edge text-white shadow-[0_5px_0_var(--btn-green-edge)] active:translate-y-1 active:shadow-[0_2px_0_var(--btn-green-edge)] cursor-pointer'
                : 'bg-stone-300 text-stone-500 border-4 border-stone-400 cursor-not-allowed'
            }`}
          >
            {t('games:shell.checkAnswer')}
          </button>
        ) : (
          <div
            className={`w-full p-4 rounded-3xl border-4 shadow-xl transition-all ${
              isCorrect
                ? 'bg-green-100 border-btn-green-edge text-green-900'
                : 'bg-rose-100 border-rose-600 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 mb-2 font-display font-extrabold text-lg">
              <span>{isCorrect ? '🎉' : '💡'}</span>
              <span>
                {isCorrect ? t('common:feedback.correct') : t('common:feedback.wrong')}
              </span>
            </div>
            {currentQ.explanation && (
              <p className="text-xs mb-3 font-semibold">
                {currentQ.explanation.vi}
              </p>
            )}
            <button
              onClick={handleNext}
              className={`w-full py-3 rounded-2xl font-display font-extrabold text-white text-sm shadow cursor-pointer ${
                isCorrect
                  ? 'bg-btn-green-base border-2 border-btn-green-edge'
                  : 'bg-rose-500 border-2 border-rose-700'
              }`}
            >
              {t('games:shell.nextQuestion')}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};

export default GameShellScreen;
