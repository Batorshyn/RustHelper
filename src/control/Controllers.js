/**
 * Пакет Control & Boundaries — Керування локальним кешем, Довідником, Пошуком та Синхронізацією
 */

import {
  SEED_CATEGORIES,
  SEED_ARTICLES,
  SEED_RECYCLE_ITEMS,
  CURRENT_SERVER_PACKAGE_VERSION,
  CURRENT_PATCH_NAME,
} from '../entities/seedData.js';
import { InputValidator } from './InputValidator.js';

const STORAGE_KEYS = {
  ARTICLES: 'rusthelper_local_articles_v1',
  PACKAGE_META: 'rusthelper_package_meta_v1',
  RECYCLE_RULES: 'rusthelper_recycle_rules_v1',
};

export class CacheManager {
  constructor() {
    this.memoryArticles = this.loadFromStorage(
      STORAGE_KEYS.ARTICLES,
      SEED_ARTICLES.map((a) => ({ ...a }))
    );
    const meta = this.loadFromStorage(STORAGE_KEYS.PACKAGE_META, {
      version: CURRENT_SERVER_PACKAGE_VERSION,
      patchName: CURRENT_PATCH_NAME,
      lastSyncedAt: '2026-11-12 10:00',
    });
    this.memoryVersion = meta.version;
    this.memoryPatchName = meta.patchName;
    this.memoryLastSync = meta.lastSyncedAt;
    this.memoryRecycleItems = this.loadFromStorage(
      STORAGE_KEYS.RECYCLE_RULES,
      SEED_RECYCLE_ITEMS.map((r) => ({ ...r }))
    );
  }

  loadFromStorage(key, fallback) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          return JSON.parse(raw);
        }
        window.localStorage.setItem(key, JSON.stringify(fallback));
      }
    } catch {
      // Fallback to in-memory
    }
    return fallback;
  }

  saveToStorage(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Ignore storage quota errors
    }
  }

  getCategories() {
    return SEED_CATEGORIES;
  }

  getAllArticles() {
    return [...this.memoryArticles];
  }

  getArticles(categoryId) {
    if (!categoryId || categoryId === 0) {
      return [...this.memoryArticles];
    }
    return this.memoryArticles.filter((a) => a.categoryId === categoryId);
  }

  getArticle(articleId) {
    return this.memoryArticles.find((a) => a.id === articleId);
  }

  isAvailableOffline(articleId) {
    const art = this.getArticle(articleId);
    return Boolean(art && art.isOffline);
  }

  saveArticle(article) {
    const idx = this.memoryArticles.findIndex((a) => a.id === article.id);
    const updated = { ...article };
    if (idx >= 0) {
      this.memoryArticles[idx] = updated;
    } else {
      this.memoryArticles.unshift(updated);
    }
    this.saveToStorage(STORAGE_KEYS.ARTICLES, this.memoryArticles);
    return updated;
  }

  toggleOfflineStatus(articleId, forceOffline) {
    const art = this.getArticle(articleId);
    if (!art) return undefined;
    const nextState = forceOffline !== undefined ? forceOffline : !art.isOffline;
    const updated = { ...art, isOffline: nextState };
    return this.saveArticle(updated);
  }

  findInLocalIndex(normalizedQuery) {
    if (!normalizedQuery) return [...this.memoryArticles];
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return this.memoryArticles.filter((article) => {
      const haystack = `${article.title} ${article.summary} ${article.content}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }

  replaceData(pkg) {
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

  getVersion() {
    return this.memoryVersion;
  }

  setVersion(newVersion, patchName = CURRENT_PATCH_NAME) {
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

  getPackageSummary() {
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

  getRecycleItems() {
    return [...this.memoryRecycleItems];
  }

  updateRecycleCoefficient(itemId, resourceId, newAmount) {
    const item = this.memoryRecycleItems.find((i) => i.id === itemId);
    if (!item) return false;
    const yieldRule = item.yields.find((y) => y.resourceId === resourceId);
    if (!yieldRule) return false;
    yieldRule.amountPerUnit = newAmount;
    this.saveToStorage(STORAGE_KEYS.RECYCLE_RULES, this.memoryRecycleItems);
    return true;
  }
}

export class ServerApiClient {
  constructor() {
    this.simulatedOffline = false;
    this.simulatedServerVersion = CURRENT_SERVER_PACKAGE_VERSION;
  }

  setSimulatedOffline(offline) {
    this.simulatedOffline = Boolean(offline);
  }

  isSimulatedOffline() {
    return this.simulatedOffline;
  }

  setSimulatedServerVersion(version) {
    this.simulatedServerVersion = version;
  }

  getSimulatedServerVersion() {
    return this.simulatedServerVersion;
  }

  async get(endpoint) {
    if (this.simulatedOffline) {
      throw new Error('OFFLINE_MODE: Відсутнє підключення до сервера RustHelperAPI.');
    }

    try {
      if (typeof window !== 'undefined' && typeof fetch === 'function') {
        const res = await fetch(`/api${endpoint}`);
        if (res.ok) {
          return await res.json();
        }
      }
    } catch {
      // Fallback to in-process response
    }

    if (endpoint === '/packages/version') {
      return {
        version: this.simulatedServerVersion,
        patchName:
          this.simulatedServerVersion > CURRENT_SERVER_PACKAGE_VERSION
            ? `Rust Patch ${this.simulatedServerVersion} (Hotfix)`
            : CURRENT_PATCH_NAME,
      };
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
      };
    }

    if (endpoint.startsWith('/articles/')) {
      const id = Number(endpoint.replace('/articles/', ''));
      const found = SEED_ARTICLES.find((a) => a.id === id);
      if (!found) throw new Error('Статтю не знайдено на сервері');
      return found;
    }

    if (endpoint === '/articles') {
      return SEED_ARTICLES;
    }

    if (endpoint === '/recycle-rules') {
      return SEED_RECYCLE_ITEMS;
    }

    throw new Error(`Невідомий ендпоінт: ${endpoint}`);
  }

  async put(endpoint, data) {
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
          return await res.json();
        }
      }
    } catch {
      // Fallback in unit tests
    }

    return { success: true, data };
  }
}

export class SyncManager {
  constructor(cacheManager, apiClient) {
    this.cacheManager = cacheManager;
    this.apiClient = apiClient;
    this.currentPackageState = 'OfflineAvailable';
  }

  getPackageState() {
    return this.currentPackageState;
  }

  markServerNewVersionAvailable() {
    const nextVer = this.cacheManager.getVersion() + 1;
    this.apiClient.setSimulatedServerVersion(nextVer);
    this.currentPackageState = 'Outdated';
    return nextVer;
  }

  checkConnection() {
    return !this.apiClient.isSimulatedOffline();
  }

  async download(articleId) {
    const serverArticle = await this.apiClient.get(`/articles/${articleId}`);
    return this.cacheManager.saveArticle(serverArticle);
  }

  async sync() {
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
      const versionInfo = await this.apiClient.get('/packages/version');
      const localVersion = this.cacheManager.getVersion();

      if (versionInfo.version > localVersion) {
        const latestPackage = await this.apiClient.get('/packages/latest');
        const currentArticles = this.cacheManager.getAllArticles();
        const mergedMap = new Map();
        for (const a of latestPackage.articles) mergedMap.set(a.id, a);
        for (const localArt of currentArticles) {
          if (!mergedMap.has(localArt.id)) {
            mergedMap.set(localArt.id, localArt);
          } else if (localArt.isOffline) {
            mergedMap.set(localArt.id, { ...mergedMap.get(localArt.id), isOffline: true });
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
          message: `Базу даних оновлено до версії v${versionInfo.version} (${versionInfo.patchName}).`,
        };
      }

      this.currentPackageState = 'OfflineAvailable';
      return {
        status: 'up-to-date',
        packageState: 'OfflineAvailable',
        localVersion,
        serverVersion: versionInfo.version,
        message: `Локальна база даних актуальна (v${localVersion}).`,
      };
    } catch {
      this.currentPackageState = 'OfflineAvailable';
      return {
        status: 'offline-error',
        packageState: 'OfflineAvailable',
        localVersion: this.cacheManager.getVersion(),
        message: 'Не вдалося з’єднатися із сервером. Доступні збережені матеріали.',
      };
    }
  }
}

export class CatalogController {
  constructor(cacheManager, syncManager) {
    this.cacheManager = cacheManager;
    this.syncManager = syncManager;
  }

  openCategory(categoryId) {
    return this.cacheManager.getArticles(categoryId);
  }

  async openArticle(articleId) {
    const isOfflineSaved = this.cacheManager.isAvailableOffline(articleId);
    const localArticle = this.cacheManager.getArticle(articleId);

    if (isOfflineSaved && localArticle) {
      return {
        success: true,
        source: 'local-cache',
        article: localArticle,
      };
    }

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

    return {
      success: false,
      source: 'offline-blocked',
      errorMessage:
        'Потрібне підключення до інтернету: ця стаття ще не збережена у локальний офлайн-пакет на вашому пристрої.',
    };
  }

  saveForOffline(articleId, makeOffline = true) {
    return this.cacheManager.toggleOfflineStatus(articleId, makeOffline);
  }
}

export class SearchController {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
  }

  normalizeQuery(query) {
    return (query || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  search(query, categoryId = 0) {
    const normalized = this.normalizeQuery(query);
    const found = this.cacheManager.findInLocalIndex(normalized);
    if (categoryId > 0) {
      return found.filter((a) => a.categoryId === categoryId);
    }
    return found;
  }
}

export class ContentManager {
  constructor(cacheManager, apiClient, validator = new InputValidator()) {
    this.cacheManager = cacheManager;
    this.apiClient = apiClient;
    this.validator = validator;
  }

  loadContent() {
    return this.cacheManager.getAllArticles();
  }

  async updateArticle(data) {
    const check = this.validator.validateArticleInput(data);
    if (!check.isValid) {
      return {
        isValid: false,
        errorMessage: check.errorMessage,
      };
    }

    const articleId = data.id || Date.now();
    const readTimeMinutes = Math.max(2, Math.ceil(data.content.trim().split(/\s+/).length / 120));

    const newArticle = {
      id: articleId,
      title: data.title.trim(),
      summary: data.summary.trim(),
      content: data.content.trim(),
      categoryId: Number(data.categoryId) || 1,
      patchVersion: data.patchVersion.trim() || '2026.11',
      isOffline: data.isOffline ?? true,
      readTimeMinutes,
      keyStats:
        data.keyStats && data.keyStats.length > 0
          ? data.keyStats
          : [
              { label: 'Патч', value: data.patchVersion.trim() || '2026.11' },
              { label: 'Статус', value: 'Перевірено редактором' },
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

  async updateCoefficients(itemId, resourceId, newAmount) {
    const check = this.validator.checkRange(newAmount, 1, 10000);
    if (!check.isValid || check.normalizedNumber === undefined) {
      return {
        isValid: false,
        errorMessage: check.errorMessage || 'Некоректний коефіцієнт переробки.',
      };
    }

    await this.apiClient.put(`/recycle-rules/${itemId}`, {
      resourceId,
      amountPerUnit: check.normalizedNumber,
    });

    const updated = this.cacheManager.updateRecycleCoefficient(
      itemId,
      resourceId,
      check.normalizedNumber
    );
    if (!updated) {
      return {
        isValid: false,
        errorMessage: 'Не знайдено предмет або ресурс для оновлення коефіцієнта.',
      };
    }

    const nextVer = this.cacheManager.getVersion() + 1;
    this.cacheManager.setVersion(nextVer);
    this.apiClient.setSimulatedServerVersion(nextVer);

    return {
      isValid: true,
      itemId,
      resourceId,
      amountPerUnit: check.normalizedNumber,
      version: nextVer,
    };
  }
}
