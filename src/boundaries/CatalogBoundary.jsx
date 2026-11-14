import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  WifiOff,
  Clock,
  ChevronRight,
} from 'lucide-react';

export const CatalogBoundary = ({
  categories,
  articles,
  catalogController,
  searchController,
  isOfflineMode,
  initialArticleId,
  onArticlesUpdated,
  onGoOnline,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(
    () => articles.find((a) => a.id === initialArticleId) || articles[0] || null
  );
  const [articleSourceLabel, setArticleSourceLabel] = useState('Локальне сховище');
  const [offlineErrorMsg, setOfflineErrorMsg] = useState(null);
  const [saveFeedback, setSaveFeedback] = useState(null);
  const articleReaderRef = useRef(null);

  const handleOpenArticle = async (articleId, shouldScrollOnMobile = true) => {
    setOfflineErrorMsg(null);
    setSaveFeedback(null);
    const res = await catalogController.openArticle(articleId);

    if (res.success && res.article) {
      setSelectedArticle(res.article);
      setArticleSourceLabel(
        res.source === 'local-cache' ? 'Доступно офлайн' : 'Завантажено з мережі'
      );
      if (shouldScrollOnMobile && window.innerWidth < 1024) {
        setTimeout(() => {
          articleReaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 40);
      }
    } else {
      setSelectedArticle(null);
      setOfflineErrorMsg(
        res.errorMessage ||
          'Потрібне підключення до інтернету: стаття ще не збережена на пристрої.'
      );
      if (shouldScrollOnMobile && window.innerWidth < 1024) {
        setTimeout(() => {
          articleReaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 40);
      }
    }
  };

  useEffect(() => {
    if (initialArticleId) {
      handleOpenArticle(initialArticleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialArticleId]);

  const filteredArticles = searchController.search(searchQuery, selectedCategoryId);

  const handleToggleOfflineSave = (article) => {
    const nextState = !article.isOffline;
    const updated = catalogController.saveForOffline(article.id, nextState);
    if (updated) {
      setSelectedArticle(updated);
      setArticleSourceLabel(updated.isOffline ? 'Доступно офлайн' : 'Мережевий доступ');
      setSaveFeedback(
        updated.isOffline
          ? 'Статтю збережено для читання без інтернету.'
          : 'Статтю прибрано з офлайн-кешу.'
      );
      onArticlesUpdated();
    }
  };

  const getCategoryName = (catId) => {
    return categories.find((c) => c.id === catId)?.name || 'Загальне';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Панель пошуку та категорій без перевантажених пілюль */}
      <div className="px-5 sm:px-7 py-4 border-b border-[#262b33] space-y-3 bg-[#111316]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <label htmlFor="catalog-search-input" className="sr-only">
              Пошук у довіднику
            </label>
            <Search className="w-4 h-4 text-[#7b8391] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="catalog-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук за темою: шафа, бункер, переробник, сірка..."
              className="w-full pl-9 pr-3 py-2 bg-[#16191e] border border-[#2a303a] rounded-[3px] text-sm text-[#e6e8eb] placeholder:text-[#636b78] focus:outline-none focus:border-[#cd412b] transition-colors min-h-[40px]"
            />
          </div>

          <div className="text-xs text-[#8c94a0] font-mono tabular-nums">
            У базі: {filteredArticles.length} із {articles.length} · Збережено офлайн:{' '}
            {articles.filter((a) => a.isOffline).length}
          </div>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto border-t border-[#1e2229] pt-2.5">
          <button
            type="button"
            onClick={() => setSelectedCategoryId(0)}
            className={`text-xs font-medium pb-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              selectedCategoryId === 0
                ? 'text-[#e6e8eb] border-[#cd412b]'
                : 'text-[#8c94a0] border-transparent hover:text-[#d0d5dd]'
            }`}
          >
            Усі розділи
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`text-xs font-medium pb-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                selectedCategoryId === cat.id
                  ? 'text-[#e6e8eb] border-[#cd412b]'
                  : 'text-[#8c94a0] border-transparent hover:text-[#d0d5dd]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Двоколонкова книга довідника з тонкою межею */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* Список матеріалів */}
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#262b33] divide-y divide-[#1e2229] overflow-y-auto">
          {filteredArticles.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm font-medium text-[#e6e8eb]">
                За запитом «{searchQuery}» статей не знайдено
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryId(0);
                }}
                className="px-4 py-2 text-xs font-medium bg-[#1d2127] border border-[#2c323c] text-[#e6e8eb] rounded-[3px] hover:bg-[#252a32] transition-colors"
              >
                Показати всі статті
              </button>
            </div>
          ) : (
            filteredArticles.map((art) => {
              const isSelected = selectedArticle?.id === art.id && !offlineErrorMsg;
              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => handleOpenArticle(art.id)}
                  className={`w-full text-left px-5 sm:px-6 py-4 transition-colors flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#191d23]'
                      : 'hover:bg-[#14171b]'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-[#7b8391]">
                      <span>{getCategoryName(art.categoryId)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Патч {art.patchVersion}</span>
                      <span aria-hidden="true">·</span>
                      <span className={art.isOffline ? 'text-emerald-400' : 'text-[#8c94a0]'}>
                        {art.isOffline ? 'Офлайн' : 'Онлайн'}
                      </span>
                    </div>
                    <h2 className="text-sm font-semibold text-[#e6e8eb] leading-snug">
                      {art.title}
                    </h2>
                    <p className="text-xs text-[#8c94a0] line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 mt-1 transition-transform ${
                      isSelected ? 'text-[#cd412b] translate-x-0.5' : 'text-[#4b525e]'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Область читання статті */}
        <div ref={articleReaderRef} className="lg:col-span-7 p-5 sm:p-8 overflow-y-auto bg-[#0e1012] scroll-mt-14">
          {offlineErrorMsg ? (
            <div
              role="alert"
              className="max-w-xl p-6 bg-[#15181c] border border-red-900/60 rounded-[3px] space-y-4"
            >
              <div className="flex items-center gap-3 text-red-400">
                <WifiOff className="w-5 h-5 shrink-0" />
                <h3 className="text-lg font-bold tracking-wide font-display">
                  Немає доступу до статті в офлайні
                </h3>
              </div>
              <p className="text-sm text-[#c6ccd4] leading-relaxed">{offlineErrorMsg}</p>
              {isOfflineMode && (
                <button
                  type="button"
                  onClick={onGoOnline}
                  className="px-4 py-2 bg-[#cd412b] hover:bg-[#de4b34] text-white text-xs font-semibold rounded-[3px] transition-colors"
                >
                  Увімкнути онлайн-режим та відкрити
                </button>
              )}
            </div>
          ) : selectedArticle ? (
            <article className="max-w-[66ch] space-y-6">
              <header className="space-y-3 pb-5 border-b border-[#262b33]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#8c94a0]">
                    <span>{getCategoryName(selectedArticle.categoryId)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Патч {selectedArticle.patchVersion}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedArticle.readTimeMinutes} хв
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#c6ccd4]">{articleSourceLabel}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleOfflineSave(selectedArticle)}
                    className={`px-3.5 py-2 rounded-[3px] text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[38px] border ${
                      selectedArticle.isOffline
                        ? 'bg-[#15221a] text-emerald-300 border-emerald-800/70 hover:bg-[#1a2b20]'
                        : 'bg-[#cd412b] text-white border-[#cd412b] hover:bg-[#de4b34]'
                    }`}
                  >
                    {selectedArticle.isOffline ? (
                      <>
                        <BookmarkCheck className="w-4 h-4" />
                        Збережено офлайн
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" />
                        Зберегти офлайн
                      </>
                    )}
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-[#f1f3f5] leading-tight text-balance font-display">
                  {selectedArticle.title}
                </h1>
              </header>

              {saveFeedback && (
                <div
                  role="status"
                  className="px-4 py-2.5 bg-[#15181c] border border-[#2a303a] rounded-[3px] text-xs text-emerald-400"
                >
                  {saveFeedback}
                </div>
              )}

              {/* Довідкові значення у вигляді рівної табличної стрічки */}
              {selectedArticle.keyStats && selectedArticle.keyStats.length > 0 && (
                <dl className="grid grid-cols-2 sm:grid-cols-4 border border-[#262b33] divide-y sm:divide-y-0 sm:divide-x divide-[#262b33] bg-[#13161a] rounded-[3px]">
                  {selectedArticle.keyStats.map((stat, idx) => (
                    <div key={idx} className="px-3.5 py-2.5">
                      <dt className="text-[11px] text-[#8c94a0]">{stat.label}</dt>
                      <dd className="text-xs sm:text-sm font-semibold text-[#e6e8eb] font-mono tabular-nums mt-0.5">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="text-sm sm:text-[15px] text-[#cfd4dc] leading-[1.7] whitespace-pre-line">
                {selectedArticle.content}
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </div>
  );
};
