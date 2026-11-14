/**
 * Модульні тести (Unit Tests) для перевірки бізнес-логіки RustHelper
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { InputValidator } from './InputValidator.js';
import {
  RecycleCalculator,
  RaidCalculator,
  BaseReliabilityAnalyzer,
} from './Calculators.js';
import {
  CacheManager,
  ServerApiClient,
  SyncManager,
  CatalogController,
  SearchController,
  ContentManager,
} from './Controllers.js';

test('InputValidator перевіряє коректні числа та блокує порожні, дробові й негативні значення', () => {
  const validator = new InputValidator();

  assert.equal(validator.checkRange(10, 1, 1000).isValid, true);
  assert.equal(validator.checkRange('25', 1, 1000).normalizedNumber, 25);

  assert.equal(validator.checkRange('', 1, 1000).isValid, false);
  assert.equal(validator.checkRange(-5, 1, 1000).isValid, false);
  assert.equal(validator.checkRange(0, 1, 1000).isValid, false);
  assert.equal(validator.checkRange('3.5', 1, 1000).isValid, false);
  assert.equal(validator.checkRange(50000, 1, 10000).isValid, false);
});

test('RecycleCalculator правильно рахує вихід ресурсів у Радтауні (60%) та Мирній зоні (40%) швидше ніж за 50 мс', () => {
  const calc = new RecycleCalculator();

  const radResult = calc.calculate([{ itemId: 1, quantity: 10 }], 'radtown');
  assert.equal(radResult.isValid, true);
  assert.ok(radResult.executionTimeMs <= 50);

  const radScrap = radResult.totalResources.find((r) => r.resourceId === 'scrap');
  const radMetal = radResult.totalResources.find((r) => r.resourceId === 'metal_frags');
  assert.equal(radScrap?.totalAmount, 120);
  assert.equal(radMetal?.totalAmount, 150);

  const safeResult = calc.calculate([{ itemId: 1, quantity: 10 }], 'safezone');
  assert.equal(safeResult.isValid, true);
  const safeScrap = safeResult.totalResources.find((r) => r.resourceId === 'scrap');
  const safeMetal = safeResult.totalResources.find((r) => r.resourceId === 'metal_frags');
  assert.equal(safeScrap?.totalAmount, 80);
  assert.equal(safeMetal?.totalAmount, 100);

  const invalidRes = calc.calculate([{ itemId: 1, quantity: -3 }], 'radtown');
  assert.equal(invalidRes.isValid, false);
  assert.ok(invalidRes.errorMessage);
});

test('RaidCalculator визначає комплекс вибухівки та потребу сировини (сірка, порох, вугілля)', () => {
  const raidCalc = new RaidCalculator();

  const result = raidCalc.calculate([{ structureId: 'stone_wall', blocks: 2 }]);
  assert.equal(result.isValid, true);
  assert.equal(result.sessionState, 'ReportReady');
  assert.equal(result.totalHp, 1000);
  assert.ok(result.executionTimeMs <= 50);

  const c4Method = result.methods.find((m) => m.methodId === 'c4');
  const rocketMethod = result.methods.find((m) => m.methodId === 'rockets');

  assert.equal(c4Method?.explosiveCounts[0].count, 4);
  assert.equal(c4Method?.rawResources.sulfur, 8800);
  assert.equal(c4Method?.rawResources.charcoal, 12000);

  assert.equal(rocketMethod?.explosiveCounts[0].count, 8);
  assert.equal(rocketMethod?.rawResources.sulfur, 11200);
});

test('BaseReliabilityAnalyzer оцінює надійність бази та знаходить вразливі місця', () => {
  const analyzer = new BaseReliabilityAnalyzer();

  const audit = analyzer.auditBaseConfiguration({
    doorSegments: [{ structureId: 'sheet_metal_door', count: 2 }],
    wallSegments: [{ structureId: 'metal_wall', count: 2 }],
    hasBunker: false,
    hasExternalTc: false,
    autoTurretsCount: 0,
  });

  assert.equal(audit.weakestVector, 'Коридор дверей');
  assert.equal(audit.doorPathSulfur, 3150);
  assert.ok(audit.wallPathSulfur > audit.doorPathSulfur);
  assert.ok(audit.recommendations.length >= 2);
});

test('Довідник, Пошук, Офлайн-збереження, Редагування та Синхронізація працюють узгоджено', async () => {
  const cache = new CacheManager();
  const api = new ServerApiClient();
  const sync = new SyncManager(cache, api);
  const catalog = new CatalogController(cache, sync);
  const search = new SearchController(cache);
  const admin = new ContentManager(cache, api);

  const found = search.search('шафа');
  assert.ok(found.length >= 1);

  api.setSimulatedOffline(true);
  const blockedOpen = await catalog.openArticle(401);
  assert.equal(blockedOpen.success, false);
  assert.equal(blockedOpen.source, 'offline-blocked');

  catalog.saveForOffline(401, true);
  const offlineOpen = await catalog.openArticle(401);
  assert.equal(offlineOpen.success, true);
  assert.equal(offlineOpen.source, 'local-cache');

  api.setSimulatedOffline(false);
  const targetVer = sync.markServerNewVersionAvailable();
  assert.equal(sync.getPackageState(), 'Outdated');

  const syncRes = await sync.sync();
  assert.equal(syncRes.status, 'updated');
  assert.equal(syncRes.packageState, 'OfflineAvailable');
  assert.equal(cache.getVersion(), targetVer);

  const xssAttempt = await admin.updateArticle({
    title: 'Небезпечна стаття',
    summary: 'Короткий опис для тестування безпеки',
    content: '<script>alert("xss")</script> Довгий текст статті про Rust для перевірки валідатора.',
    categoryId: 1,
    patchVersion: '2026.11',
  });
  assert.equal(xssAttempt.isValid, false);

  const validUpdate = await admin.updateArticle({
    title: 'Новий гайд по індустріальних конвеєрах',
    summary: 'Автоматичне сортування луту у ящиках та завантаження печей.',
    content:
      'Детальна інструкція з підключення Industrial Conveyor, електричних фільтрів та адаптерів сховищ для автоматичної переплавки руди на базі.',
    categoryId: 6,
    patchVersion: '2026.11',
  });
  assert.equal(validUpdate.isValid, true);
  assert.ok(validUpdate.savedArticle);
});
