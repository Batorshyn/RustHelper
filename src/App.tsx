/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  RefreshCw,
  Flame,
  ShieldCheck,
  Settings,
  Wifi,
  WifiOff,
  Database,
  UserCheck,
  CloudDownload,
} from 'lucide-react';
import { UserRole, PackageState } from './entities/models';
import { SEED_STRUCTURES } from './entities/seedData';
import {
  CacheManager,
  ServerApiClient,
  SyncManager,
  CatalogController,
  SearchController,
  ContentManager,
} from './control/Controllers';
import {
  RecycleCalculator,
  RaidCalculator,
  BaseReliabilityAnalyzer,
} from './control/Calculators';
import { CatalogBoundary } from './boundaries/CatalogBoundary';
import { RecycleBoundary } from './boundaries/RecycleBoundary';
import { RaidBoundary } from './boundaries/RaidBoundary';
import { BaseBuilderBoundary } from './boundaries/BaseBuilderBoundary';
import { AdminArchitectureBoundary } from './boundaries/AdminArchitectureBoundary';

type ActiveSection = 'catalog' | 'recycle' | 'raid' | 'base_audit' | 'admin';

export default function App() {
  // Ініціалізація керуючих класів (Пакет Control) та клієнта API (Пакет Boundaries)
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

  const [activeSection, setActiveSection] = useState<ActiveSection>('catalog');
  const [userRole, setUserRole] = useState<UserRole>('experienced');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [packageState, setPackageState] = useState<PackageState>('OfflineAvailable');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

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
  const packageMeta = useMemo(
    () => services.cacheManager.getPackageSummary(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshTick]
  );

  // Синхронізація даних з сервером
  const handleSyncWithServer = async () => {
    setPackageState('Downloading');
    const res = await services.syncManager.sync();
    setPackageState(res.packageState);
    setSyncMessage(res.message);
    setRefreshTick((t) => t + 1);
  };

  // Симуляція виходу нової версії на сервері (Перехід у стан «Застарілий»)
  const handleSimulateNewServerPatch = () => {
    const nextVer = services.syncManager.markServerNewVersionAvailable();
    setPackageState('Outdated');
    setSyncMessage(
      `На сервері RustHelperAPI з’явився новий пакет даних v${nextVer}. Статус локального пакета: «Застарілий». Натисніть «Оновити дані» (UC8).`
    );
  };

  const handleToggleOfflineMode = () => {
    const nextOffline = !isOfflineMode;
    setIsOfflineMode(nextOffline);
    services.apiClient.setSimulatedOffline(nextOffline);
    setSyncMessage(
      nextOffline
        ? 'Увімкнено автономний режим (Офлайн): працюють локальний індекс пошуку (UC2), збережені статті (UC3) та калькулятори (UC4, UC5).'
        : 'З’єднання з сервером RustHelperAPI відновлено (HTTPS Онлайн).'
    );
  };

  const navItems: { id: ActiveSection; label: string; shortLabel: string; icon: React.ReactNode }[] =
    [
      {
        id: 'catalog',
        label: 'Довідник та Навички',
        shortLabel: 'Довідник',
        icon: <BookOpen className="w-4 h-4" />,
      },
      {
        id: 'recycle',
        label: 'Переробка Ресурсів',
        shortLabel: 'Переробник',
        icon: <RefreshCw className="w-4 h-4" />,
      },
      {
        id: 'raid',
        label: 'Калькулятор Рейдів',
        shortLabel: 'Рейди',
        icon: <Flame className="w-4 h-4" />,
      },
      {
        id: 'base_audit',
        label: 'Надійність Баз',
        shortLabel: 'Бази',
        icon: <ShieldCheck className="w-4 h-4" />,
      },
      {
        id: 'admin',
        label: 'Адмін та Архітектура',
        shortLabel: 'Адмін / C#',
        icon: <Settings className="w-4 h-4" />,
      },
    ];

  return (
    <div className="min-h-screen bg-[#0b0d10] text-zinc-100 flex flex-col pb-20 md:pb-8">
      {/* Top Navigation Bar — суворий 3-зонний контракт (Zone 1: Brand, Zone 2: 5 Nav links, Zone 3: 1 Primary CTA) */}
      <header className="sticky top-0 z-30 bg-[#0b0d10]/95 backdrop-blur-md border-b border-zinc-800/90 px-4 sm:px-8 h-13 sm:h-15 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand Title */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('catalog');
          }}
          className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-100 whitespace-nowrap shrink-0 font-display"
        >
          RustHelper
        </a>

        {/* Zone 2: 5 Single-Line Navigation Links */}
        <nav
          aria-label="Головна навігація"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeSection === item.id
                  ? 'text-zinc-100 border-orange-500 font-semibold'
                  : 'border-transparent hover:text-zinc-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action (UC8 «Синхронізувати дані з сервером») */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSyncWithServer}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-500 transition-colors whitespace-nowrap shrink-0 min-h-[38px] sm:min-h-[40px] flex items-center gap-1.5"
          >
            <CloudDownload className="w-4 h-4" />
            <span>Оновити дані (UC8)</span>
          </button>
        </div>
      </header>

      {/* Панель управління середовищем гравця (Вибір ролі, Офлайн-режим, Стан локального пакета даних) */}
      <section
        aria-label="Панель ролі користувача та стану локальної бази даних"
        className="bg-zinc-900/70 border-b border-zinc-800/80 px-4 sm:px-8 py-3"
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Вибір ролі користувача */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5 mr-1">
              <UserCheck className="w-3.5 h-3.5 text-orange-400" />
              Роль користувача:
            </span>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-lg">
              <button
                type="button"
                onClick={() => setUserRole('novice')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  userRole === 'novice'
                    ? 'bg-zinc-200 text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Гравець-початківець
              </button>
              <button
                type="button"
                onClick={() => setUserRole('experienced')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  userRole === 'experienced'
                    ? 'bg-orange-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Досвідчений гравець
              </button>
              <button
                type="button"
                onClick={() => setUserRole('admin')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  userRole === 'admin'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Адміністратор
              </button>
            </div>
          </div>

          {/* Індикатор локальної БД та перемикач Офлайн/Онлайн */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-mono tabular-nums">
              <Database className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>
                Локальна БД: v{packageMeta.version} ({packageMeta.offlineCount}/
                {packageMeta.totalCount} офлайн · {packageMeta.sizeMb} МБ)
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  packageState === 'OfflineAvailable'
                    ? 'text-emerald-400'
                    : packageState === 'Outdated'
                      ? 'text-amber-400'
                      : 'text-sky-400'
                }
              >
                Стан пакета:{' '}
                {packageState === 'OfflineAvailable'
                  ? 'Доступний офлайн'
                  : packageState === 'Outdated'
                    ? 'Застарілий (є нова версія)'
                    : 'Завантажується'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSimulateNewServerPatch}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors whitespace-nowrap shrink-0"
            >
              Симулювати новий патч на сервері
            </button>

            <button
              type="button"
              onClick={handleToggleOfflineMode}
              className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                isOfflineMode
                  ? 'bg-red-950/70 border border-red-700 text-red-200'
                  : 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
              }`}
            >
              {isOfflineMode ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  Режим: Офлайн (Без мережі)
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  Режим: Онлайн (HTTPS)
                </>
              )}
            </button>
          </div>
        </div>

        {syncMessage && (
          <div
            role="status"
            className="max-w-7xl mx-auto mt-2.5 px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 flex items-center justify-between gap-4"
          >
            <span>{syncMessage}</span>
            <button
              type="button"
              onClick={() => setSyncMessage(null)}
              className="text-zinc-400 hover:text-zinc-200 text-xs shrink-0"
            >
              Закрити
            </button>
          </div>
        )}
      </section>

      {/* Головна робоча область (MainScreen <<Boundary>> делегує до відповідного граничного екрана) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {activeSection === 'catalog' && (
          <CatalogBoundary
            categories={categories}
            articles={articles}
            catalogController={services.catalogController}
            searchController={services.searchController}
            userRole={userRole}
            isOfflineMode={isOfflineMode}
            onArticlesUpdated={() => setRefreshTick((t) => t + 1)}
          />
        )}

        {activeSection === 'recycle' && (
          <RecycleBoundary
            items={recycleItems}
            calculator={services.recycleCalculator}
            userRole={userRole}
            onUpgradeRole={() => setUserRole('experienced')}
          />
        )}

        {activeSection === 'raid' && (
          <RaidBoundary
            structures={SEED_STRUCTURES}
            calculator={services.raidCalculator}
            userRole={userRole}
            onUpgradeRole={() => setUserRole('experienced')}
          />
        )}

        {activeSection === 'base_audit' && (
          <BaseBuilderBoundary analyzer={services.baseAnalyzer} />
        )}

        {activeSection === 'admin' && (
          <AdminArchitectureBoundary
            categories={categories}
            articles={articles}
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

      {/* Нижній колонтитул для десктопу */}
      <footer className="hidden md:block border-t border-zinc-900 px-8 py-4 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span>
            RustHelper — Довідково-розрахункова система для гравців у Rust (C# / .NET 10 + React /
            JS)
          </span>
          <span>
            Розробники: Баторшин Данило, Магденко Ярослав (ІПЗ25-1), Гоманов Назар (ЦМ25-2)
          </span>
        </div>
      </footer>

      {/* Мобільна нижня навігаційна панель (Thumb-Zone Pattern 1 для смартфонів) */}
      <nav
        aria-label="Мобільна нижня навігація"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b0d10]/95 backdrop-blur-md border-t border-zinc-800 grid grid-cols-5 items-center h-13 px-1"
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                isActive ? 'text-orange-500 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {item.icon}
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-[68px]">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
