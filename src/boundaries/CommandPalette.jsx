import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, RefreshCw, Flame, Crosshair, X } from 'lucide-react';

export const CommandPalette = ({
  isOpen,
  onClose,
  articles,
  recycleItems,
  structures,
  weapons,
  onJumpToArticle,
  onJumpToRecycleItem,
  onJumpToRaidStructure,
  onJumpToWeapon,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedArticles = articles
    .filter((a) => !q || `${a.title} ${a.summary}`.toLowerCase().includes(q))
    .slice(0, 4);

  const matchedRecycle = recycleItems
    .filter((r) => !q || r.name.toLowerCase().includes(q))
    .slice(0, 4);

  const matchedStructures = structures
    .filter((s) => !q || `${s.name} ${s.material}`.toLowerCase().includes(q))
    .slice(0, 4);

  const matchedWeapons = weapons
    .filter((w) => !q || `${w.name} ${w.tier}`.toLowerCase().includes(q))
    .slice(0, 3);

  const hasAny =
    matchedArticles.length > 0 ||
    matchedRecycle.length > 0 ||
    matchedStructures.length > 0 ||
    matchedWeapons.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Швидкий пошук RustHelper"
    >
      <div
        className="w-full max-w-2xl bg-[#15181c] border border-[#2a303a] rounded-[3px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 h-12 border-b border-[#262b33]">
          <Search className="w-4 h-4 text-[#8c94a0] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Шукати статтю, предмет, двері, стіну або зброю..."
            className="flex-1 bg-transparent text-sm text-[#e6e8eb] placeholder:text-[#636b78] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити пошук"
            className="p-1.5 text-[#8c94a0] hover:text-[#e6e8eb] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-[#20242b]">
          {!hasAny ? (
            <div className="py-10 text-center text-sm text-[#8c94a0]">
              Нічого не знайдено за запитом «{query}»
            </div>
          ) : (
            <>
              {matchedStructures.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-[11px] font-medium text-[#7b8391]">
                    Цілі для рейду
                  </div>
                  {matchedStructures.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        onJumpToRaidStructure(st.id);
                        onClose();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[#1d2127] flex items-center justify-between gap-4 transition-colors"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-[#e6e8eb] min-w-0">
                        <Flame className="w-3.5 h-3.5 text-[#cd412b] shrink-0" />
                        <span className="truncate">{st.name}</span>
                      </span>
                      <span className="text-xs font-mono tabular-nums text-[#eab308] shrink-0">
                        {st.optimalCombo.totalSulfur.toLocaleString('uk-UA')} сірки · {st.hp} HP
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchedRecycle.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-[11px] font-medium text-[#7b8391]">
                    Переробка компонентів
                  </div>
                  {matchedRecycle.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onJumpToRecycleItem(item.id);
                        onClose();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[#1d2127] flex items-center justify-between gap-4 transition-colors"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-[#e6e8eb] min-w-0">
                        <RefreshCw className="w-3.5 h-3.5 text-[#8c94a0] shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="text-xs font-mono tabular-nums text-[#9ca3af] shrink-0">
                        {item.yields
                          .map((y) => `${y.amountPerUnit} ${y.resourceName.split(' ')[0]}`)
                          .join(' + ')}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchedArticles.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-[11px] font-medium text-[#7b8391]">
                    Статті довідника
                  </div>
                  {matchedArticles.map((art) => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => {
                        onJumpToArticle(art.id);
                        onClose();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[#1d2127] flex items-center justify-between gap-4 transition-colors"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-[#e6e8eb] min-w-0">
                        <BookOpen className="w-3.5 h-3.5 text-[#8c94a0] shrink-0" />
                        <span className="truncate">{art.title}</span>
                      </span>
                      <span className="text-xs font-mono text-[#7b8391] shrink-0">
                        {art.readTimeMinutes} хв
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchedWeapons.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-[11px] font-medium text-[#7b8391]">
                    Арсенал і віддача
                  </div>
                  {matchedWeapons.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        onJumpToWeapon(w.id);
                        onClose();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[#1d2127] flex items-center justify-between gap-4 transition-colors"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-[#e6e8eb] min-w-0">
                        <Crosshair className="w-3.5 h-3.5 text-[#8c94a0] shrink-0" />
                        <span className="truncate">{w.name}</span>
                      </span>
                      <span className="text-xs font-mono tabular-nums text-[#7b8391] shrink-0">
                        {w.fireRateRpm} RPM
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-2 bg-[#111316] border-t border-[#262b33] flex items-center justify-between text-[11px] text-[#7b8391]">
          <span>Оберіть пункт для миттєвого переходу</span>
          <span className="font-mono">ESC — закрити</span>
        </div>
      </div>
    </div>
  );
};
