import React from 'react';
import { useNavigate } from 'react-router-dom';

export const DevArtScreen: React.FC = () => {
  const navigate = useNavigate();

  const mascots = [
    { name: 'Mimi (Mèo)', world: 'Linh vật chính', emoji: '🐱', color: 'bg-amber-400' },
    { name: 'Bơ (Cú)', world: 'Đảo Con Số (Toán)', emoji: '🦉', color: 'bg-sky-400' },
    { name: 'Mochi (Thỏ)', world: 'Làng Chữ (Tiếng Việt)', emoji: '🐰', color: 'bg-pink-300' },
    { name: 'Foxy (Cáo)', world: 'Thành Phố ABC (Tiếng Anh)', emoji: '🦊', color: 'bg-purple-400' },
    { name: 'Kiwi (Ếch)', world: 'Rừng Khám Phá (Khoa học)', emoji: '🐸', color: 'bg-green-400' },
  ];

  const moods = ['idle', 'happy', 'cheer', 'think', 'wow', 'sad-soft', 'sleep', 'wave', 'point'];

  return (
    <div className="min-h-screen bg-stone-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl border-3 border-stone-300 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-display font-extrabold text-stone-800">
              🎨 Mascot & Art Gallery (/dev/art)
            </h1>
            <p className="text-xs text-stone-500">
              Phòng trưng bày 5 linh vật chibi, 9 biểu cảm mood, icon game SVG và background worlds.
            </p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="px-3 py-1.5 rounded-full border border-stone-400 font-bold text-xs"
          >
            ← Về Sảnh
          </button>
        </div>

        {/* 5 Mascots Overview */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            1. Năm Linh Vật Đại Diện
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {mascots.map((m) => (
              <div
                key={m.name}
                className="p-3 rounded-2xl border-2 border-stone-200 flex flex-col items-center text-center bg-stone-50"
              >
                <div className={`w-14 h-14 rounded-full ${m.color} flex items-center justify-center text-3xl mb-2 shadow`}>
                  {m.emoji}
                </div>
                <span className="font-display font-bold text-xs text-stone-800">{m.name}</span>
                <span className="text-[10px] text-stone-500 mt-0.5">{m.world}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 9 Moods Matrix */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            2. Trạng Thái Cảm Xúc (9 Moods)
          </h2>
          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => (
              <span
                key={mood}
                className="px-3 py-1 bg-stone-100 rounded-full border border-stone-300 font-display font-bold text-xs text-stone-700"
              >
                #{mood}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DevArtScreen;
