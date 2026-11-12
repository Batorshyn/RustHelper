import React, { useState } from 'react';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  WifiOff,
  Clock,
  ChevronRight,
  Crosshair,
  Play,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import {
  ICategory,
  IArticle,
  UserRole,
  IWeaponTrainingData,
} from '../entities/models';
import { SEED_WEAPONS_TRAINING } from '../entities/seedData';
import { CatalogController, SearchController } from '../control/Controllers';

interface CatalogBoundaryProps {
  categories: ICategory[];
  articles: IArticle[];
  catalogController: CatalogController;
  searchController: SearchController;
  userRole: UserRole;
  isOfflineMode: boolean;
  onArticlesUpdated: () => void;
}

export const CatalogBoundary: React.FC<CatalogBoundaryProps> = ({
  categories,
  articles,
  catalogController,
  searchController,
  userRole,
  isOfflineMode,
  onArticlesUpdated,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubView, setActiveSubView] = useState<'articles' | 'training'>('articles');

  // Стан відкритої статті (UC1)
  const [selectedArticle, setSelectedArticle] = useState<IArticle | null>(articles[0] || null);
  const [articleSourceLabel, setArticleSourceLabel] = useState<string>('Локальний кеш (Offline)');
  const [offlineErrorMsg, setOfflineErrorMsg] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Стан тренажера спреїв зброї
  const [selectedWeapon, setSelectedWeapon] = useState<IWeaponTrainingData>(
    SEED_WEAPONS_TRAINING[0]
  );
  const [isCrouching, setIsCrouching] = useState<boolean>(true);
  const [activeShotIndex, setActiveShotIndex] = useState<number>(
    SEED_WEAPONS_TRAINING[0].recoilPoints.length
  );

  // UC2: Пошук виконується по локальному індексу через SearchController
  const filteredArticles = searchController.search(searchQuery, selectedCategoryId);

  const handleOpenArticle = async (articleId: number) => {
    setOfflineErrorMsg(null);
    setSaveFeedback(null);
    const res = await catalogController.openArticle(articleId);

    if (res.success && res.article) {
      setSelectedArticle(res.article);
      setArticleSourceLabel(
        res.source === 'local-cache'
          ? 'Локальна БД пристрою (Офлайн-пакет)'
          : 'Завантажено з сервера RustHelperAPI (HTTPS)'
      );
    } else {
      setSelectedArticle(null);
      setOfflineErrorMsg(
        res.errorMessage ||
          'Потрібне підключення до інтернету: стаття відсутня в локальному кеші.'
      );
    }
  };

  // UC3: Зберегти статтю для офлайн-доступу
  const handleToggleOfflineSave = (article: IArticle) => {
    const nextState = !article.isOffline;
    const updated = catalogController.saveForOffline(article.id, nextState);
    if (updated) {
      setSelectedArticle(updated);
      setSaveFeedback(
        updated.isOffline
          ? 'Збережено у локальну БД пристрою — стаття тепер доступна без інтернету (UC3).'
          : 'Статтю видалено з локального офлайн-сховища.'
      );
      onArticlesUpdated();
    }
  };

  const handleRunRecoilSim = () => {
    setActiveShotIndex(1);
    let current = 1;
    const total = selectedWeapon.recoilPoints.length;
    const timer = setInterval(() => {
      current += 1;
      if (current >= total) {
        setActiveShotIndex(total);
        clearInterval(timer);
      } else {
        setActiveShotIndex(current);
      }
    }, 90);
  };

  const getCategoryName = (catId: number) => {
    return categories.find((c) => c.id === catId)?.name || 'Загальне';
  };

  return (
    <div className="space-y-6">
      {/* Перемикач підрозділів: Довідник знань (UC1–UC3) та Тренування навичок / Спреї */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 text-balance">
            Довідник та База Знань Rust
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Локальний індекс працює без інтернету (UC1, UC2, UC3) · Активна роль:{' '}
            <span className="text-zinc-200 font-medium">
              {userRole === 'novice'
                ? 'Гравець-початківець'
                : userRole === 'experienced'
                  ? 'Досвідчений гравець'
                  : 'Адміністратор'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveSubView('articles')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] flex items-center gap-2 ${
              activeSubView === 'articles'
                ? 'bg-orange-600 text-white'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Статті довідника ({articles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('training')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] flex items-center gap-2 ${
              activeSubView === 'training'
                ? 'bg-orange-600 text-white'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            Тренування навичок (Спреї та Таймінги)
          </button>
        </div>
      </div>

      {activeSubView === 'articles' ? (
        <div className="space-y-6">
          {/* Рядок пошуку (UC2 SearchScreen) та фільтр категорій (UC1 CatalogScreen) */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="relative flex-1 max-w-xl">
              <label htmlFor="catalog-search-input" className="sr-only">
                Пошук матеріалу у локальному індексі довідника
              </label>
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="catalog-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук за локальним індексом (напр.: шафа, бункер, турель, переробник, c4)..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors min-h-[44px]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategoryId(0)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                  selectedCategoryId === 0
                    ? 'bg-zinc-100 text-zinc-950 font-semibold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                Усі категорії
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                    selectedCategoryId === cat.id
                      ? 'bg-zinc-100 text-zinc-950 font-semibold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Двоколонкова структура: Зліва список статей (Індекс), Справа повний перегляд статті */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Ліва колонка: список статей локального індексу */}
            <div className="lg:col-span-5 bg-zinc-900/70 border border-zinc-800 rounded-xl divide-y divide-zinc-800/80 overflow-hidden">
              <div className="px-4 py-3 bg-zinc-900 flex items-center justify-between text-xs text-zinc-400">
                <span>Знайдено у локальному індексі: {filteredArticles.length}</span>
                <span className="font-mono tabular-nums">
                  Офлайн збережено: {articles.filter((a) => a.isOffline).length}/{articles.length}
                </span>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm font-medium text-zinc-200">
                    Нічого не знайдено за запитом «{searchQuery}» (UC2: showEmpty)
                  </p>
                  <p className="text-xs text-zinc-400">
                    Спробуйте змінити пошукове слово або скинути фільтр категорій.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategoryId(0);
                    }}
                    className="px-4 py-2 text-xs font-medium bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Скинути пошук
                  </button>
                </div>
              ) : (
                filteredArticles.map((art) => {
                  const isSelected = selectedArticle?.id === art.id;
                  return (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => handleOpenArticle(art.id)}
                      className={`w-full text-left p-4 transition-colors flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-orange-950/30 text-zinc-100'
                          : 'hover:bg-zinc-800/50 text-zinc-300'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span>{getCategoryName(art.categoryId)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">Патч {art.patchVersion}</span>
                          <span aria-hidden="true">·</span>
                          <span className={art.isOffline ? 'text-emerald-400' : 'text-amber-400'}>
                            {art.isOffline ? 'Доступно офлайн' : 'Тільки з мережею'}
                          </span>
                        </div>
                        <h2 className="text-sm font-semibold text-zinc-100 leading-snug">
                          {art.title}
                        </h2>
                        <p className="text-xs text-zinc-400 line-clamp-2">{art.summary}</p>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 mt-1 transition-transform ${
                          isSelected ? 'text-orange-500 translate-x-0.5' : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>

            {/* Права колонка: Повний текст статті або помилка відсутності з'єднання (UC1 alt) */}
            <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
              {offlineErrorMsg ? (
                <div
                  role="alert"
                  className="p-6 rounded-xl bg-red-950/30 border border-red-800/60 space-y-4"
                >
                  <div className="flex items-center gap-3 text-red-300">
                    <WifiOff className="w-6 h-6 shrink-0" />
                    <h3 className="text-base font-semibold">
                      Потрібне підключення до інтернету (UC1: showOfflineError)
                    </h3>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{offlineErrorMsg}</p>
                  <p className="text-xs text-zinc-400">
                    Порада: вимкніть режим «Імітація Офлайн» у верхній панелі синхронізації, щоб
                    завантажити цю статтю з сервера RustHelperAPI, а потім натисніть «Зберегти
                    офлайн» (UC3).
                  </p>
                </div>
              ) : selectedArticle ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-zinc-800">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        <span>{getCategoryName(selectedArticle.categoryId)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Версія патчу: {selectedArticle.patchVersion}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {selectedArticle.readTimeMinutes} хв читання
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-zinc-300">{articleSourceLabel}</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 text-balance">
                        {selectedArticle.title}
                      </h2>
                    </div>

                    {/* Кнопка UC3 «Зберегти статтю для офлайн-доступу» */}
                    <button
                      type="button"
                      onClick={() => handleToggleOfflineSave(selectedArticle)}
                      className={`px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[44px] ${
                        selectedArticle.isOffline
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/50'
                          : 'bg-orange-600 text-white hover:bg-orange-500'
                      }`}
                    >
                      {selectedArticle.isOffline ? (
                        <>
                          <BookmarkCheck className="w-4 h-4" />
                          Доступно офлайн (Збережено)
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4" />
                          Зберегти офлайн (UC3)
                        </>
                      )}
                    </button>
                  </div>

                  {saveFeedback && (
                    <div
                      role="status"
                      className="px-4 py-2.5 rounded-lg bg-zinc-800/90 border border-zinc-700 text-xs text-emerald-300"
                    >
                      {saveFeedback}
                    </div>
                  )}

                  {/* Ключові цифри та показники статті (tabular-nums) */}
                  {selectedArticle.keyStats && selectedArticle.keyStats.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {selectedArticle.keyStats.map((stat, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/90"
                        >
                          <div className="text-xs text-zinc-400">{stat.label}</div>
                          <div className="text-sm font-semibold text-zinc-100 font-mono tabular-nums mt-1">
                            {stat.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Основний текст статті */}
                  <div className="space-y-4 text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line">
                    {selectedArticle.content}
                  </div>

                  {isOfflineMode && selectedArticle.isOffline && (
                    <div className="pt-4 border-t border-zinc-800 text-xs text-emerald-400">
                      Ви переглядаєте цю статтю в автономному режимі з локальної бази даних вашого
                      пристрою.
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        /* Підрозділ «Матеріали для тренування навичок (Спреї зброї, таймінги перезарядки)» */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-zinc-100">
              Арсенал Rust: Спреї віддачі та Таймінги
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Оберіть зброю для вивчення патерну віддачі (Recoil Pattern), швидкострільності та
              таймінгів перезарядки.
            </p>

            <div className="space-y-2">
              {SEED_WEAPONS_TRAINING.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setSelectedWeapon(w);
                    setActiveShotIndex(w.recoilPoints.length);
                  }}
                  className={`w-full text-left p-3.5 rounded-lg border transition-colors flex items-center justify-between gap-3 ${
                    selectedWeapon.id === w.id
                      ? 'bg-orange-950/30 border-orange-500/70 text-zinc-100'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/50'
                  }`}
                >
                  <div>
                    <div className="text-xs text-zinc-400">
                      {w.tier} · {w.fireRateRpm} постр./хв · Магазин {w.magazineSize}
                    </div>
                    <div className="text-sm font-semibold text-zinc-100 mt-0.5">{w.name}</div>
                  </div>
                  <span className="font-mono tabular-nums text-xs text-orange-400">
                    {w.reloadTimeSec}с
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <div className="text-xs text-zinc-400">
                  {selectedWeapon.tier} · Вартість крафту: {selectedWeapon.craftCost}
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mt-1">{selectedWeapon.name}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCrouching((prev) => !prev)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors min-h-[40px] ${
                    isCrouching
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  Положення: {isCrouching ? 'Сидячи (-50% віддачі)' : 'Стоячи (Повна віддача)'}
                </button>
                <button
                  type="button"
                  onClick={handleRunRecoilSim}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-500 transition-colors flex items-center gap-1.5 min-h-[40px]"
                >
                  <Play className="w-3.5 h-3.5" />
                  Симулювати чергу
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShotIndex(selectedWeapon.recoilPoints.length)}
                  aria-label="Скинути симуляцію спрею"
                  className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-xs text-zinc-400">Ушкодження (Голова)</div>
                <div className="text-base font-bold text-zinc-100 font-mono tabular-nums mt-1">
                  {selectedWeapon.damageHead} HP
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-xs text-zinc-400">Ушкодження (Груди)</div>
                <div className="text-base font-bold text-zinc-100 font-mono tabular-nums mt-1">
                  {selectedWeapon.damageChest} HP
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-xs text-zinc-400">Швидкострільність</div>
                <div className="text-base font-bold text-zinc-100 font-mono tabular-nums mt-1">
                  {selectedWeapon.fireRateRpm} RPM
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-xs text-zinc-400">Час перезарядки</div>
                <div className="text-base font-bold text-zinc-100 font-mono tabular-nums mt-1">
                  {selectedWeapon.reloadTimeSec} сек
                </div>
              </div>
            </div>

            {/* Візуалізатор траєкторії віддачі та компенсації мишею */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center">
                <div className="text-xs text-zinc-400 mb-2 w-full flex justify-between">
                  <span>Куди летять кулі (Віддача ствола)</span>
                  <span className="text-orange-400 font-mono tabular-nums">
                    Пострілів: {activeShotIndex}/{selectedWeapon.recoilPoints.length}
                  </span>
                </div>
                <svg
                  viewBox="0 0 100 100"
                  className="w-full max-w-[240px] h-[220px] bg-zinc-900/90 rounded-lg border border-zinc-800/80"
                  aria-label={`Графік віддачі зброї ${selectedWeapon.name}`}
                >
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#27272a" strokeDasharray="2 2" />
                  <line x1="0" y1="85" x2="100" y2="85" stroke="#27272a" strokeDasharray="2 2" />
                  {selectedWeapon.recoilPoints.slice(0, activeShotIndex).map((pt, idx) => {
                    const adjX = isCrouching ? 50 + (pt.x - 50) * 0.55 : pt.x;
                    const adjY = isCrouching ? 85 - (85 - pt.y) * 0.55 : pt.y;
                    return (
                      <g key={idx}>
                        <circle
                          cx={adjX}
                          cy={adjY}
                          r={idx === 0 ? 3 : 2.2}
                          fill={idx === 0 ? '#10b981' : '#f97316'}
                        />
                        <text
                          x={adjX + 3.5}
                          y={adjY + 1.5}
                          fontSize="4"
                          fill="#a1a1aa"
                          fontFamily="monospace"
                        >
                          {idx + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">
                    Як контролювати спрей ({selectedWeapon.name})
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                    {selectedWeapon.recoilPatternDesc}
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <div className="text-zinc-400">
                    Ефект присідання (Crouch):{' '}
                    <span className="text-emerald-400 font-medium">
                      {selectedWeapon.crouchModifier}
                    </span>
                  </div>
                  <div className="text-zinc-400">
                    Рекомендовані модулі:{' '}
                    <span className="text-zinc-200 font-medium">
                      {selectedWeapon.bestAttachments.join(' · ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
