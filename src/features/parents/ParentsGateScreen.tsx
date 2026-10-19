import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const ParentsGateScreen: React.FC = () => {
  const { t } = useTranslation(['parents', 'common']);
  const navigate = useNavigate();

  // Generate 2 random numbers for parental gate verification
  const [numA] = useState(() => Math.floor(Math.random() * 40) + 35);
  const [numB] = useState(() => Math.floor(Math.random() * 40) + 25);
  const [answerInput, setAnswerInput] = useState('');
  const [error, setError] = useState(false);

  const expectedSum = numA + numB;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(answerInput.trim(), 10) === expectedSum) {
      sessionStorage.setItem('kidquest_parent_auth', 'true');
      navigate('/parents');
    } else {
      setError(true);
      setAnswerInput('');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl border-3 border-stone-300 p-6 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-2xl mx-auto mb-3">
          🔒
        </div>
        <h1 className="text-xl font-display font-extrabold text-stone-800 text-center mb-1">
          {t('parents:gate.title')}
        </h1>
        <p className="text-xs text-stone-500 text-center mb-6">
          {t('parents:gate.prompt')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-stone-50 rounded-2xl border-2 border-stone-200 text-center">
            <span className="font-display font-bold text-2xl text-stone-800 tracking-wide">
              {numA} + {numB} = ?
            </span>
          </div>

          <div>
            <input
              type="number"
              value={answerInput}
              onChange={(e) => {
                setAnswerInput(e.target.value);
                setError(false);
              }}
              placeholder={t('parents:gate.placeholder')}
              className="w-full px-4 py-3 rounded-2xl border-2 border-stone-300 focus:border-stone-600 outline-none font-bold text-center text-lg bg-white"
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500 text-center mt-1 font-semibold">
                {t('parents:gate.error')}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white font-display font-bold text-sm shadow transition-all cursor-pointer"
          >
            {t('parents:gate.submit')}
          </button>

          <button
            type="button"
            onClick={() => navigate('/home')}
            className="w-full py-2.5 rounded-2xl border border-stone-300 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer"
          >
            {t('parents:gate.back')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ParentsGateScreen;
