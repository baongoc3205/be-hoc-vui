import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShopItem } from '@/types';
import { mockApiClient } from '@/services/api';
import { useProfileStore } from '@/stores/useProfileStore';
import { useProgressStore } from '@/stores/useProgressStore';

export const ShopScreen: React.FC = () => {
  const { t } = useTranslation(['rewards', 'common']);
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.getActiveProfile());
  const progress = useProgressStore((s) => s.getProfileProgress(profile?.id || 'default-profile-1'));
  const spendCoins = useProgressStore((s) => s.spendCoins);
  const unlockShopItem = useProgressStore((s) => s.unlockShopItem);

  const [items, setItems] = useState<ShopItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'hair' | 'outfit' | 'hat' | 'glasses' | 'pet'>('outfit');

  useEffect(() => {
    mockApiClient.getShopItems().then(setItems);
  }, []);

  const handleBuy = (item: ShopItem) => {
    if (!profile) return;
    if (progress.coins < item.price) {
      alert(t('rewards:shop.notEnoughCoins'));
      return;
    }
    const success = spendCoins(profile.id, item.price);
    if (success) {
      unlockShopItem(profile.id, item.id);
    }
  };

  const filteredItems = items.filter((it) => it.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-top via-sky-bottom to-grass p-4 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between py-2">
        <button
          onClick={() => navigate('/home')}
          className="px-3 py-1.5 rounded-full bg-white/80 border-2 border-stone-600 font-bold text-xs"
        >
          ← {t('common:action.back')}
        </button>
        <h1 className="text-xl font-display font-extrabold text-white drop-shadow">
          {t('rewards:shop.title')}
        </h1>
        <div className="flex items-center gap-1 bg-hud-pill px-3 py-1 rounded-full text-white font-bold text-xs border border-white/30">
          🪙 {progress.coins}
        </div>
      </header>

      {/* Categories Tabs */}
      <div className="w-full max-w-md flex gap-2 my-2 overflow-x-auto pb-1">
        {(['outfit', 'hat', 'hair', 'glasses', 'pet'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs border-2 whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-btn-orange-base text-white border-btn-orange-edge shadow-sm'
                : 'bg-white text-ink border-stone-300'
            }`}
          >
            {t(`rewards:shop.categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <main className="w-full max-w-md flex-1 bg-panel-bg rounded-3xl border-4 border-panel-edge p-4 shadow-xl overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => {
            const isOwned = progress.ownedItems.includes(item.id);
            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-white border-3 border-stone-300 flex flex-col items-center text-center shadow-sm"
              >
                <div className="w-16 h-16 rounded-xl bg-sky-50 border-2 border-stone-200 flex items-center justify-center text-3xl mb-2">
                  {item.category === 'hat'
                    ? '🧢'
                    : item.category === 'outfit'
                    ? '👕'
                    : item.category === 'glasses'
                    ? '👓'
                    : item.category === 'hair'
                    ? '💇'
                    : '🐣'}
                </div>
                <span className="font-display font-extrabold text-xs text-ink line-clamp-1 mb-2">
                  {item.name.vi}
                </span>

                {isOwned ? (
                  <button
                    disabled
                    className="w-full py-1.5 rounded-xl bg-stone-200 text-stone-600 font-bold text-xs"
                  >
                    {t('rewards:shop.owned')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    className="w-full py-1.5 rounded-xl bg-gradient-to-b from-btn-green-top to-btn-green-bottom border-2 border-btn-green-edge text-white font-display font-bold text-xs shadow active:translate-y-0.5 cursor-pointer"
                  >
                    {item.price} 🪙
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default ShopScreen;
