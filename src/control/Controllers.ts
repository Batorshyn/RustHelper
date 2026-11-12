/**
 * Пакет Control & Boundaries — Керування локальним кешем, Довідником, Пошуком та Синхронізацією
 * Реалізує класи керування та взаємодії з сервером:
 * - CacheManager <<Control>> (локальне збереження даних на пристрої)
 * - ServerApiClient <<Boundary>> (інтерфейс із сервером C# / REST API)
 * - SyncManager <<Control>> (синхронізація даних з сервером та керування станом пакета даних)
 * - CatalogController <<Control>> (перегляд довідника за категоріями та збереження статей для офлайн-доступу)
 * - SearchController <<Control>> (пошук матеріалів у локальному індексі)
 * - ContentManager <<Control>> (оновлення довідкових даних на сервері)
 */

import {
  ICategory,
  IArticle,
  IDataPackage,
  PackageState,
  IRecycleItem,
} from '../entities/models';
import {
  SEED_CATEGORIES,
  SEED_ARTICLES,
  SEED_RECYCLE_ITEMS,
  CURRENT_SERVER_PACKAGE_VERSION,
  CURRENT_PATCH_NAME,
} from '../entities/seedData';
import { InputValidator, IValidationOutcome } from './InputValidator';

const STORAGE_KEYS = {
  ARTICLES: 'rusthelper_local_articles_v1',
  PACKAGE_META: 'rusthelper_package_meta_v1',
  RECYCLE_RULES: 'rusthelper_recycle_rules_v1',
};

/**
 * Клас CacheManager <<Control>>
 * Забезпечує локальне збереження індексу довідника, збережених статей та правил калькуляторів
 * на пристрої користувача (працює і в браузері через localStorage, і в Node.js для unit-тестів)
 */
export class CacheManager {
  private memoryArticles: IArticle[];
  private memoryVersion: number;
  private memoryPatchName: string;
  private memoryLastSync: string;
  private memoryRecycleItems: IRecycleItem[];

  constructor() {
    this.memoryArticles = this.loadFromStorage<IArticle[]>(
      STORAGE_KEYS.ARTICLES,
      SEED_ARTICLES.map((a) => ({ ...a }))
    );
    const meta = this.loadFromStorage<{
      version: number;
      patchName: string;
      lastSyncedAt: string;
    }>(STORAGE_KEYS.PACKAGE_META, {
      version: CURRENT_SERVER_PACKAGE_VERSION,
      patchName: CURRENT_PATCH_NAME,
      lastSyncedAt: '2026-11-12 10:00',
    });
    this.memoryVersion = meta.version;
    this.memoryPatchName = meta.patchName;
    this.memoryLastSync = meta.lastSyncedAt;
    this.memoryRecycleItems = this.loadFromStorage<IRecycleItem[]>(
      STORAGE_KEYS.RECYCLE_RULES,
      SEED_RECYCLE_ITEMS.map((r) => ({ ...r }))
    );
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          return JSON.parse(raw) as T;
        }
        window.localStorage.setItem(key, JSON.stringify(fallback));
      }
    } catch {
      // Fallback to in-memory
    }
    return fallback;
  }

  private saveToStorage<T>(key: string, value: T): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Ignore storage quota errors
    }
  }

  public getCategories(): ICategory[] {
    return SEED_CATEGORIES;
  }

  public getAllArticles(): IArticle[] {
    return [...this.memoryArticles];
  }

  public getArticles(categoryId: number): IArticle[] {
    if (!categoryId || categoryId === 0) {
      return [...this.memoryArticles];
    }
    return this.memoryArticles.filter((a) => a.categoryId === categoryId);
  }

  public getArticle(articleId: number): IArticle | undefined {
    return this.memoryArticles.find((a) => a.id === articleId);
  }

  public isAvailableOffline(articleId: number): boolean {
    const art = this.getArticle(articleId);
    return Boolean(art && art.isOffline);
  }

  public saveArticle(article: IArticle): IArticle {
    const idx = this.memoryArticles.findIndex((a) => a.id === article.id);
    const updated: IArticle = { ...article };
    if (idx >= 0) {
      this.memoryArticles[idx] = updated;
    } else {
      this.memoryArticles.unshift(updated);
    }
    this.saveToStorage(STORAGE_KEYS.ARTICLES, this.memoryArticles);
    return updated;
  }

  public toggleOfflineStatus(articleId: number, forceOffline?: boolean): IArticle | undefined {
    const art = this.getArticle(articleId);
    if (!art) return undefined;
    const nextState = forceOffline !== undefined ? forceOffline : !art.isOffline;
    const updated: IArticle = { ...art, isOffline: nextState };
    return this.saveArticle(updated);
  }

  public findInLocalIndex(normalizedQuery: string): IArticle[] {
    if (!normalizedQuery) return [...this.memoryArticles];
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return this.memoryArticles.filter((article) => {
      const haystack = `${article.title} ${article.summary} ${article.content}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }

  public replaceData(pkg: IDataPackage): void {
    // Зберігаємо локальні офлайн-прапорці користувача при оновленні пакета з сервера
    const offlineIds = new Set(
      this.memoryArticles.filter((a) => a.isOffline).map((a) => a.id)
    );
    this.memoryArticles = pkg.articles.map((a) => ({
      ...a,
      isOffline: offlineIds.has(a.id) ? true : a.isOffline,
    }));
    this.memoryVersion = pkg.version;
    this.memoryPatchName = pkg.patchName;
    this.memoryLastSync = pkg.lastSyncedAt;

    this.saveToStorage(STORAGE_KEYS.ARTICLES, this.memoryArticles);
    this.saveToStorage(STORAGE_KEYS.PACKAGE_META, {
      version: this.memoryVersion,
      patchName: this.memoryPatchName,
      lastSyncedAt: this.memoryLastSync,
    });
  }

  public getVersion(): number {
    return this.memoryVersion;
  }

  public setVersion(newVersion: number, patchName = CURRENT_PATCH_NAME): void {
    this.memoryVersion = newVersion;
    this.memoryPatchName = patchName;
    this.memoryLastSync = new Date().toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    this.saveToStorage(STORAGE_KEYS.PACKAGE_META, {
      version: this.memoryVersion,
      patchName: this.memoryPatchName,
      lastSyncedAt: this.memoryLastSync,
    });
  }

  public getPackageSummary(): {
    version: number;
    patchName: string;
    lastSyncedAt: string;
    offlineCount: number;
    totalCount: number;
    sizeMb: number;
  } {
    const offlineCount = this.memoryArticles.filter((a) => a.isOffline).length;
    return {
      version: this.memoryVersion,
      patchName: this.memoryPatchName,
      lastSyncedAt: this.memoryLastSync,
      offlineCount,
      totalCount: this.memoryArticles.length,
      sizeMb: Number((1.4 + offlineCount * 0.25).toFixed(2)),
    };
  }

  public getRecycleItems(): IRecycleItem[] {
    return [...this.memoryRecycleItems];
  }

  public updateRecycleCoefficient(itemId: number, resourceId: string, newAmount: number): boolean {
    const item = this.memoryRecycleItems.find((i) => i.id === itemId);
    if (!item) return false;
    const yieldRule = item.yields.find((y) => y.resourceId === resourceId);
    if (!yieldRule) return false;
    yieldRule.amountPerUnit = newAmount;
    this.saveToStorage(STORAGE_KEYS.RECYCLE_RULES, this.memoryRecycleItems);
    return true;
  }
}

/**
 * Клас ServerApiClient <<Boundary>>
 * Відповідає за HTTP-обмін із сервером даних (RustHelperAPI) або локальну імітацію при відсутності мережі
 */
export class ServerApiClient {
  private simulatedOffline = false;
  private simulatedServerVersion = CURRENT_SERVER_PACKAGE_VERSION;

  public setSimulatedOffline(offline: boolean): void {
    this.simulatedOffline = offline;
  }

  public isSimulatedOffline(): boolean {
    return this.simulatedOffline;
  }

  public setSimulatedServerVersion(version: number): void {
    this.simulatedServerVersion = version;
  }

  public getSimulatedServerVersion(): number {
    return this.simulatedServerVersion;
  }

  public async get<T>(endpoint: string): Promise<T> {
    if (this.simulatedOffline) {
      throw new Error('OFFLINE_MODE: Відсутнє підключення до сервера RustHelperAPI.');
    }

    try {
      if (typeof window !== 'undefined' && typeof fetch === 'function') {
        const res = await fetch(`/api${endpoint}`);
        if (res.ok) {
          return (await res.json()) as T;
        }
      }
    } catch {
      // Fallback to in-process response if backend is unreachable in unit test
    }

    if (endpoint === '/packages/version') {
      return {
        version: this.simulatedServerVersion,
        patchName:
          this.simulatedServerVersion > CURRENT_SERVER_PACKAGE_VERSION
            ? `Rust Patch ${this.simulatedServerVersion} (Hotfix)`
            : CURRENT_PATCH_NAME,
      } as unknown as T;
    }

    if (endpoint === '/packages/latest') {
      return {
        version: this.simulatedServerVersion,
        patchName:
          this.simulatedServerVersion > CURRENT_SERVER_PACKAGE_VERSION
            ? `Rust Patch ${this.simulatedServerVersion} (Hotfix)`
            : CURRENT_PATCH_NAME,
        sizeMb: 2.85,
        lastSyncedAt: new Date().toLocaleString('uk-UA'),
        articles: SEED_ARTICLES,
      } as unknown as T;
    }

    if (endpoint.startsWith('/articles/')) {
      const id = Number(endpoint.replace('/articles/', ''));
      const found = SEED_ARTICLES.find((a) => a.id === id);
      if (!found) throw new Error('Статтю не знайдено на сервері');
      return found as unknown as T;
    }

    if (endpoint === '/articles') {
      return SEED_ARTICLES as unknown as T;
    }

    throw new Error(`Невідомий ендпоінт: ${endpoint}`);
  }

  public async put<T>(endpoint: string, data: unknown): Promise<T> {
    if (this.simulatedOffline) {
      throw new Error('OFFLINE_MODE: Неможливо оновити серверні дані без інтернету.');
    }

    try {
      if (typeof window !== 'undefined' && typeof fetch === 'function') {
        const res = await fetch(`/api${endpoint}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          return (await res.json()) as T;
        }
      }
    } catch {
      // Fallback in unit tests
    }

    return { success: true, data } as unknown as T;
  }
}

/**
 * Клас SyncManager <<Control>>
 * Відповідає за синхронізацію даних з сервером та керування станом локального пакета даних
 */
export interface ISyncResult {
  status: 'updated' | 'up-to-date' | 'offline-error';
  packageState: PackageState;
  localVersion: number;
  serverVersion?: number;
  message: string;
}

export class SyncManager {
  private cacheManager: CacheManager;
  private apiClient: ServerApiClient;
  private currentPackageState: PackageState = 'OfflineAvailable';

  constructor(cacheManager: CacheManager, apiClient: ServerApiClient) {
    this.cacheManager = cacheManager;
    this.apiClient = apiClient;
  }

  public getPackageState(): PackageState {
    return this.currentPackageState;
  }

  public markServerNewVersionAvailable(): number {
    const nextVer = this.cacheManager.getVersion() + 1;
    this.apiClient.setSimulatedServerVersion(nextVer);
    this.currentPackageState = 'Outdated';
    return nextVer;
  }

  public checkConnection(): boolean {
    return !this.apiClient.isSimulatedOffline();
  }

  public async download(articleId: number): Promise<IArticle> {
    const serverArticle = await this.apiClient.get<IArticle>(`/articles/${articleId}`);
    return this.cacheManager.saveArticle(serverArticle);
  }

  /**
   * UC8: Порівнює версію пакета даних на пристрої й на сервері, за потреби завантажує оновлення
   */
  public async sync(): Promise<ISyncResult> {
    if (!this.checkConnection()) {
      return {
        status: 'offline-error',
        packageState: this.currentPackageState,
        localVersion: this.cacheManager.getVersion(),
        message: 'Помилка з’єднання: працюємо в автономному режимі зі збереженими офлайн-даними.',
      };
    }

    try {
      this.currentPackageState = 'Downloading';
      const versionInfo = await this.apiClient.get<{ version: number; patchName: string }>(
        '/packages/version'
      );
      const localVersion = this.cacheManager.getVersion();

      if (versionInfo.version > localVersion) {
        const latestPackage = await this.apiClient.get<IDataPackage>('/packages/latest');
        const currentArticles = this.cacheManager.getAllArticles();
        // Об'єднуємо серверні статті та локально додані адміністратором статті
        const mergedMap = new Map<number, IArticle>();
        for (const a of latestPackage.articles) mergedMap.set(a.id, a);
        for (const localArt of currentArticles) {
          if (!mergedMap.has(localArt.id)) {
            mergedMap.set(localArt.id, localArt);
          } else if (localArt.isOffline) {
            mergedMap.set(localArt.id, { ...mergedMap.get(localArt.id)!, isOffline: true });
          }
        }

        this.cacheManager.replaceData({
          ...latestPackage,
          version: versionInfo.version,
          patchName: versionInfo.patchName,
          lastSyncedAt: new Date().toLocaleString('uk-UA'),
          articles: Array.from(mergedMap.values()),
        });
        this.cacheManager.setVersion(versionInfo.version, versionInfo.patchName);
        this.currentPackageState = 'OfflineAvailable';

        return {
          status: 'updated',
          packageState: 'OfflineAvailable',
          localVersion: versionInfo.version,
          serverVersion: versionInfo.version,
          message: `Пакет даних успішно оновлено до версії v${versionInfo.version} (${versionInfo.patchName}).`,
        };
      }

      this.currentPackageState = 'OfflineAvailable';
      return {
        status: 'up-to-date',
        packageState: 'OfflineAvailable',
        localVersion,
        serverVersion: versionInfo.version,
        message: `Локальна база даних актуальна (версія v${localVersion}). Оновлення не потрібне.`,
      };
    } catch {
      this.currentPackageState = 'OfflineAvailable';
      return {
        status: 'offline-error',
        packageState: 'OfflineAvailable',
        localVersion: this.cacheManager.getVersion(),
        message: 'Не вдалося з’єднатися із сервером. Доступні локально збережені матеріали.',
      };
    }
  }
}

/**
 * Клас CatalogController <<Control>>
 * Відповідає за перегляд довідника за категоріями та збереження статей для офлайн-доступу
 */
export interface IOpenArticleResult {
  success: boolean;
  source: 'local-cache' | 'server-download' | 'offline-blocked';
  article?: IArticle;
  errorMessage?: string;
}

export class CatalogController {
  private cacheManager: CacheManager;
  private syncManager: SyncManager;

  constructor(cacheManager: CacheManager, syncManager: SyncManager) {
    this.cacheManager = cacheManager;
    this.syncManager = syncManager;
  }

  public openCategory(categoryId: number): IArticle[] {
    return this.cacheManager.getArticles(categoryId);
  }

  /**
   * Перевіряє чи стаття збережена для офлайн-доступу.
   * Якщо гравець онлайн — стаття відкривається завжди (або довантажується з сервера).
   * Якщо гравець офлайн і стаття НЕ збережена в офлайн-кеш — повертає повідомлення «Потрібне підключення до інтернету».
   */
  public async openArticle(articleId: number): Promise<IOpenArticleResult> {
    const isOfflineSaved = this.cacheManager.isAvailableOffline(articleId);
    const localArticle = this.cacheManager.getArticle(articleId);

    if (isOfflineSaved && localArticle) {
      return {
        success: true,
        source: 'local-cache',
        article: localArticle,
      };
    }

    // Стаття не збережена офлайн — перевіряємо з'єднання з сервером
    if (this.syncManager.checkConnection()) {
      if (localArticle) {
        return {
          success: true,
          source: 'server-download',
          article: localArticle,
        };
      }
      try {
        const downloaded = await this.syncManager.download(articleId);
        return {
          success: true,
          source: 'server-download',
          article: downloaded,
        };
      } catch {
        return {
          success: false,
          source: 'offline-blocked',
          errorMessage: 'Потрібне підключення до інтернету для завантаження повного тексту цієї статті.',
        };
      }
    }

    // Гравець у режимі Офлайн, і стаття не була збережена для офлайн-доступу (UC1 alt: немає з'єднання)
    return {
      success: false,
      source: 'offline-blocked',
      errorMessage:
        'Потрібне підключення до інтернету: ця стаття ще не збережена у локальний офлайн-пакет на вашому пристрої.',
    };
  }

  /**
   * UC3: Зберегти статтю для офлайн-доступу (або видалити з офлайн-кешу)
   */
  public saveForOffline(articleId: number, makeOffline = true): IArticle | undefined {
    return this.cacheManager.toggleOfflineStatus(articleId, makeOffline);
  }
}

/**
 * Клас SearchController <<Control>>
 * Виконує пошук матеріалів по локальному індексу без потреби в інтернеті
 */
export class SearchController {
  private cacheManager: CacheManager;

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  public normalizeQuery(query: string): string {
    return (query || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  public search(query: string, categoryId = 0): IArticle[] {
    const normalized = this.normalizeQuery(query);
    const found = this.cacheManager.findInLocalIndex(normalized);
    if (categoryId > 0) {
      return found.filter((a) => a.categoryId === categoryId);
    }
    return found;
  }
}

/**
 * Клас ContentManager <<Control>>
 * Відповідає за оновлення довідкових даних на сервері для ролі Адміністратор
 */
export class ContentManager {
  private cacheManager: CacheManager;
  private apiClient: ServerApiClient;
  private validator: InputValidator;

  constructor(
    cacheManager: CacheManager,
    apiClient: ServerApiClient,
    validator: InputValidator = new InputValidator()
  ) {
    this.cacheManager = cacheManager;
    this.apiClient = apiClient;
    this.validator = validator;
  }

  public loadContent(): IArticle[] {
    return this.cacheManager.getAllArticles();
  }

  public async updateArticle(data: {
    id?: number;
    title: string;
    summary: string;
    content: string;
    categoryId: number;
    patchVersion: string;
    isOffline?: boolean;
    keyStats?: { label: string; value: string }[];
  }): Promise<{
    isValid: boolean;
    errorMessage?: string;
    savedArticle?: IArticle;
  }> {
    const check: IValidationOutcome = this.validator.validateArticleInput(data);
    if (!check.isValid) {
      return {
        isValid: false,
        errorMessage: check.errorMessage,
      };
    }

    const articleId = data.id || Date.now();
    const readTimeMinutes = Math.max(2, Math.ceil(data.content.trim().split(/\s+/).length / 120));

    const newArticle: IArticle = {
      id: articleId,
      title: data.title.trim(),
      summary: data.summary.trim(),
      content: data.content.trim(),
      categoryId: Number(data.categoryId) || 1,
      patchVersion: data.patchVersion.trim() || '2026.11',
      isOffline: data.isOffline ?? true,
      readTimeMinutes,
      keyStats: data.keyStats && data.keyStats.length > 0 ? data.keyStats : [
        { label: 'Патч', value: data.patchVersion.trim() || '2026.11' },
        { label: 'Статус', value: 'Перевірено Адміністратором' },
      ],
      status: 'published',
    };

    await this.apiClient.put(`/articles/${articleId}`, newArticle);
    const saved = this.cacheManager.saveArticle(newArticle);
    const nextVer = this.cacheManager.getVersion() + 1;
    this.cacheManager.setVersion(nextVer);
    this.apiClient.setSimulatedServerVersion(nextVer);

    return {
      isValid: true,
      savedArticle: saved,
    };
  }
}
