import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Crosshair,
  RefreshCw,
  Flame,
  ShieldCheck,
  Search,
  Wifi,
  WifiOff,
  CloudDownload,
  Code2,
} from 'lucide-react';
import { SEED_STRUCTURES, SEED_WEAPONS_TRAINING } from './entities/seedData.js';
import {
  CacheManager,
  ServerApiClient,
  SyncManager,
  CatalogController,
  SearchController,
  ContentManager,
} from './control/Controllers.js';
import {
  RecycleCalculator,
  RaidCalculator,
  BaseReliabilityAnalyzer,
} from './control/Calculators.js';
import { CatalogBoundary } from './boundaries/CatalogBoundary.jsx';
import { WeaponTrainerBoundary } from './boundaries/WeaponTrainerBoundary.jsx';
import { RecycleBoundary } from './boundaries/RecycleBoundary.jsx';
import { RaidBoundary } from './boundaries/RaidBoundary.jsx';
import { BaseBuilderBoundary } from './boundaries/BaseBuilderBoundary.jsx';
import { AdminArchitectureBoundary } from './boundaries/AdminArchitectureBoundary.jsx';
import { CommandPalette } from './boundaries/CommandPalette.jsx';

export default function App() {
  const services = useMemo(() => {
    const cacheManager = new CacheManager();
    const apiClient = new ServerApiClient();
    const syncManager = new SyncManager(cacheManager, apiClient);
    const catalogController = new CatalogController(cacheManager, syncManager);
    const searchController = new SearchController(cacheManager);
    const contentManager = new ContentManager(cacheManager, apiClient);
    const recycleCalculator = new RecycleCalculator(cacheManager.getRecycleItems());
    const raidCalculator = new RaidCalculator(SEED_STRUCTURES);
    const baseAnalyzer = new BaseReliabilityAnalyzer(raidCalculator);

    return {
      cacheManager,
      apiClient,
      syncManager,
      catalogController,
      searchController,
      contentManager,
      recycleCalculator,
      raidCalculator,
      baseAnalyzer,
    };
  }, []);

  const [activeSection, setActiveSection] = useState('catalog');
  const [userRole, setUserRole] = useState('experienced');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [packageState, setPackageState] = useState('OfflineAvailable');
  const [syncNotice, setSyncNotice] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const [jumpArticleId, setJumpArticleId] = useState(null);
  const [jumpRecycleId, setJumpRecycleId] = useState(null);
  const [jumpStructureId, setJumpStructureId] = useState(null);
  const [jumpWeaponId, setJumpWeaponId] = useState(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const categories = services.cacheManager.getCategories();
  const articles = useMemo(
    () => services.cacheManager.getAllArticles(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshTick]
  );
  const recycleItems = useMemo(
    () => services.cacheManager.getRecycleItems(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshTick]
  );
  const activeRecycleCalculator = useMemo(
    () => new RecycleCalculator(recycleItems),
    [recycleItems]
  );
  const packageMeta = useMemo(
    () => services.cacheManager.getPackageSummary(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshTick]
  );

  const handleSyncWithServer = async () => {
    setPackageState('Downloading');
    const res = await services.syncManager.sync();
    setPackageState(res.packageState);
    setSyncNotice(res.message);
    setRefreshTick((t) => t + 1);
  };

  const handleToggleOfflineMode = () => {
    const nextOffline = !isOfflineMode;
    setIsOfflineMode(nextOffline);
    services.apiClient.setSimulatedOffline(nextOffline);
    setSyncNotice(
      nextOffline
        ? 'Автономний режим увімкнено — відкриваються лише збережені офлайн-статті та калькулятори.'
        : 'Мережеве з’єднання відновлено.'
    );
  };

  const playerNavItems = [
    { id: 'catalog', label: 'Довідник', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'weapons', label: 'Арсенал і спреї', icon: <Crosshair className="w-4 h-4" /> },
    { id: 'recycle', label: 'Переробник', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'raid', label: 'Калькулятор рейду', icon: <Flame className="w-4 h-4" /> },
    { id: 'base_audit', label: 'Аудит бази', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const activeTitle =
    [...playerNavItems, { id: 'admin', label: 'Редактор та C#' }].find(
      (n) => n.id === activeSection
    )?.label || 'RustHelper';

  return (
    <div className="min-h-screen bg-[#0e1012] text-[#e6e8eb] flex flex-col md:flex-row pb-14 md:pb-0">
      {/* Лівий фіксований сайдбар для десктопу (236px) */}
      <aside className="hidden md:flex md:w-[236px] md:shrink-0 flex-col bg-[#121417] border-r border-[#242932] sticky top-0 h-screen">
        {/* Назва програми */}
        <div className="h-12 px-5 border-b border-[#242932] flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-[#cd412b] rounded-[1px] shrink-0" aria-hidden="true" />
          <span className="text-lg font-bold tracking-wider text-[#f1f3f5] font-display">
            RUSTHELPER
          </span>
        </div>

        {/* Кнопка швидкого пошуку (Command Bar) */}
        <div className="p-3 border-b border-[#20242b]">
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="w-full px-3 py-2 bg-[#171a1f] hover:bg-[#1d2128] border border-[#2a303a] rounded-[3px] text-xs text-[#8c94a0] flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              Швидкий пошук
            </span>
            <kbd className="font-mono text-[10px] text-[#6b7280] border border-[#2c323c] px-1.5 py-0.5 rounded-[2px]">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Основна навігація гравця */}
        <nav aria-label="Інструменти" className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {playerNavItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full px-3 py-2.5 rounded-[3px] text-xs font-medium flex items-center gap-2.5 transition-colors text-left ${
                  isActive
                    ? 'bg-[#1c2026] text-[#f1f3f5] font-semibold'
                    : 'text-[#9ca3af] hover:text-[#e6e8eb] hover:bg-[#16191e]'
                }`}
              >
                <span className={isActive ? 'text-[#cd412b]' : 'text-[#7b8391]'}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-[#20242b]">
            <button
              type="button"
              onClick={() => setActiveSection('admin')}
              className={`w-full px-3 py-2 rounded-[3px] text-xs font-medium flex items-center gap-2.5 transition-colors text-left ${
                activeSection === 'admin'
                  ? 'bg-[#1c2026] text-[#f1f3f5] font-semibold'
                  : 'text-[#7b8391] hover:text-[#d0d5dd] hover:bg-[#16191e]'
              }`}
            >
              <Code2 className="w-4 h-4 shrink-0" />
              <span className="truncate">Редактор та код C#</span>
            </button>
          </div>
        </nav>

        {/* Компактний системний блок внизу сайдбару (Progressive Disclosure) */}
        <div className="p-3 border-t border-[#242932] bg-[#101215] space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#7b8391] font-mono tabular-nums">
              База v{packageMeta.version}
            </span>
            <button
              type="button"
              onClick={handleSyncWithServer}
              className="text-[11px] text-[#cfd4dc] hover:text-[#cd412b] flex items-center gap-1 transition-colors"
            >
              <CloudDownload className="w-3.5 h-3.5" />
              Оновити
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleToggleOfflineMode}
              className={`flex-1 px-2.5 py-1.5 rounded-[3px] border text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                isOfflineMode
                  ? 'bg-red-950/40 border-red-800/70 text-red-300'
                  : 'bg-[#16191e] border-[#282e37] text-[#b9c0cb] hover:text-[#f1f3f5]'
              }`}
            >
              {isOfflineMode ? (
                <>
                  <WifiOff className="w-3 h-3" />
                  Офлайн
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  Онлайн
                </>
              )}
            </button>

            <label htmlFor="sidebar-role-select" className="sr-only">
              Профіль доступу
            </label>
            <select
              id="sidebar-role-select"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="px-2 py-1.5 bg-[#16191e] border border-[#282e37] rounded-[3px] text-[11px] text-[#b9c0cb] focus:outline-none"
            >
              <option value="novice">Новачок</option>
              <option value="experienced">Гравець</option>
              <option value="admin">Адмін</option>
            </select>
          </div>
        </div>
      </aside>

      {/* Мобільна верхня смуга */}
      <header className="md:hidden sticky top-0 z-30 bg-[#121417] border-b border-[#242932] px-4 h-12 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#cd412b] rounded-[1px]" aria-hidden="true" />
          <span className="text-base font-bold tracking-wider text-[#f1f3f5] font-display">
            RUSTHELPER
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            aria-label="Пошук"
            className="p-2 bg-[#171a1f] border border-[#2a303a] rounded-[3px] text-[#cfd4dc]"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleToggleOfflineMode}
            className={`px-2.5 py-1.5 rounded-[3px] border text-[11px] font-medium flex items-center gap-1 ${
              isOfflineMode
                ? 'bg-red-950/40 border-red-800/70 text-red-300'
                : 'bg-[#16191e] border-[#282e37] text-[#cfd4dc]'
            }`}
          >
            {isOfflineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isOfflineMode ? 'Офлайн' : 'Онлайн'}</span>
          </button>
        </div>
      </header>

      {/* Основна робоча область */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Тонкий верхній рядок контексту на десктопі */}
        <div className="hidden md:flex h-12 px-7 border-b border-[#242932] bg-[#0e1012] items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#8c94a0]">
            <span>RustHelper</span>
            <span aria-hidden="true">/</span>
            <span className="text-[#e6e8eb] font-medium">{activeTitle}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#8c94a0]">
            {syncNotice && (
              <div className="flex items-center gap-2 text-emerald-400">
                <span>{syncNotice}</span>
                <button
                  type="button"
                  onClick={() => setSyncNotice(null)}
                  className="text-[#7b8391] hover:text-[#e6e8eb]"
                >
                  ×
                </button>
              </div>
            )}
            <span className="font-mono tabular-nums text-[11px] text-[#7b8391]">
              Патч 2026.11 · Офлайн-статей: {packageMeta.offlineCount}/{packageMeta.totalCount}
            </span>
          </div>
        </div>

        <main className="flex-1 min-h-0">
          {activeSection === 'catalog' && (
            <CatalogBoundary
              categories={categories}
              articles={articles}
              catalogController={services.catalogController}
              searchController={services.searchController}
              isOfflineMode={isOfflineMode}
              initialArticleId={jumpArticleId}
              onArticlesUpdated={() => setRefreshTick((t) => t + 1)}
              onGoOnline={() => {
                setIsOfflineMode(false);
                services.apiClient.setSimulatedOffline(false);
                setSyncNotice('Мережеве з’єднання відновлено.');
              }}
            />
          )}

          {activeSection === 'weapons' && (
            <WeaponTrainerBoundary initialWeaponId={jumpWeaponId} />
          )}

          {activeSection === 'recycle' && (
            <RecycleBoundary
              items={recycleItems}
              calculator={activeRecycleCalculator}
              initialItemId={jumpRecycleId}
            />
          )}

          {activeSection === 'raid' && (
            <RaidBoundary
              structures={SEED_STRUCTURES}
              calculator={services.raidCalculator}
              initialStructureId={jumpStructureId}
            />
          )}

          {activeSection === 'base_audit' && (
            <BaseBuilderBoundary analyzer={services.baseAnalyzer} />
          )}

          {activeSection === 'admin' && (
            <AdminArchitectureBoundary
              categories={categories}
              articles={articles}
              recycleItems={recycleItems}
              contentManager={services.contentManager}
              packageState={packageState}
              packageMeta={packageMeta}
              userRole={userRole}
              onSwitchToAdmin={() => setUserRole('admin')}
              onArticleSaved={() => {
                setPackageState('OfflineAvailable');
                setRefreshTick((t) => t + 1);
              }}
            />
          )}
        </main>
      </div>

      {/* Мобільна нижня панель навігації */}
      <nav
        aria-label="Мобільна навігація"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121417] border-t border-[#242932] grid grid-cols-5 h-14"
      >
        {playerNavItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-[#cd412b] font-semibold' : 'text-[#8c94a0]'
              }`}
            >
              {item.icon}
              <span className="text-[10px] truncate max-w-[66px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* Глобальна командна палітра швидкого доступу */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        articles={articles}
        recycleItems={recycleItems}
        structures={SEED_STRUCTURES}
        weapons={SEED_WEAPONS_TRAINING}
        onJumpToArticle={(id) => {
          setJumpArticleId(id);
          setActiveSection('catalog');
        }}
        onJumpToRecycleItem={(id) => {
          setJumpRecycleId(id);
          setActiveSection('recycle');
        }}
        onJumpToRaidStructure={(id) => {
          setJumpStructureId(id);
          setActiveSection('raid');
        }}
        onJumpToWeapon={(id) => {
          setJumpWeaponId(id);
          setActiveSection('weapons');
        }}
      />
    </div>
  );
}
