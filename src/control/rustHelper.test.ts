/**
 * Модульні тести (Unit Tests) для перевірки бізнес-логіки RustHelper
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { InputValidator } from './InputValidator';
import {
  RecycleCalculator,
  RaidCalculator,
  BaseReliabilityAnalyzer,
} from './Calculators';
import {
  CacheManager,
  ServerApiClient,
  SyncManager,
  CatalogController,
  SearchController,
  ContentManager,
} from './Controllers';

test('UC6: InputValidator перевіряє коректні числа та блокує порожні, дробові й негативні значення', () => {
  const validator = new InputValidator();

  assert.equal(validator.checkRange(10, 1, 1000).isValid, true);
  assert.equal(validator.checkRange('25', 1, 1000).normalizedNumber, 25);

  const emptyCheck = validator.checkRange('', 1, 1000);
  assert.equal(emptyCheck.isValid, false);

  const negativeCheck = validator.checkRange(-5, 1, 1000);
  assert.equal(negativeCheck.isValid, false);

  const zeroCheck = validator.checkRange(0, 1, 1000);
  assert.equal(zeroCheck.isValid, false);

  const floatCheck = validator.checkRange('3.5', 1, 1000);
  assert.equal(floatCheck.isValid, false);

  const overMaxCheck = validator.checkRange(50000, 1, 10000);
  assert.equal(overMaxCheck.isValid, false);
});

test('UC4: RecycleCalculator правильно рахує вихід ресурсів у Радтауні (60%) та Мирній зоні (40%) швидше ніж за 50 мс', () => {
  const calc = new RecycleCalculator();

  // Переробка 10 Шестерень (Gears, ID = 1) у Радтауні (60%): 12 скрапу та 15 металу за 1 шт.
  const radResult = calc.calculate([{ itemId: 1, quantity: 10 }], 'radtown');
  assert.equal(radResult.isValid, true);
  assert.ok(radResult.executionTimeMs <= 50, 'Час розрахунку не повинен перевищувати 50 мс');

  const radScrap = radResult.totalResources.find((r) => r.resourceId === 'scrap');
  const radMetal = radResult.totalResources.find((r) => r.resourceId === 'metal_frags');
  assert.equal(radScrap?.totalAmount, 120);
  assert.equal(radMetal?.totalAmount, 150);

  // Переробка 10 Шестерень у Мирній зоні Outpost (40%): 8 скрапу та 10 металу за 1 шт.
  const safeResult = calc.calculate([{ itemId: 1, quantity: 10 }], 'safezone');
  assert.equal(safeResult.isValid, true);
  const safeScrap = safeResult.totalResources.find((r) => r.resourceId === 'scrap');
  const safeMetal = safeResult.totalResources.find((r) => r.resourceId === 'metal_frags');
  assert.equal(safeScrap?.totalAmount, 80);
  assert.equal(safeMetal?.totalAmount, 100);

  // Некоректний ввід повертає помилку UC6
  const invalidRes = calc.calculate([{ itemId: 1, quantity: -3 }], 'radtown');
  assert.equal(invalidRes.isValid, false);
  assert.ok(invalidRes.errorMessage);
});

test('UC5: RaidCalculator визначає комплекс вибухівки та потребу сировини (сірка, порох, вугілля)', () => {
  const raidCalc = new RaidCalculator();

  // 2 Кам'яні стіни (stone_wall): 2 C4 на 1 стіну -> 4 C4 (8800 сірки) або 8 ракет (11200 сірки)
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

test('BaseReliabilityAnalyzer оцінює надійність бази та знаходить вразливі місця (двері проти стін)', () => {
  const analyzer = new BaseReliabilityAnalyzer();

  // Слабкі двері (2 металеві двері = 3200 сірки) при міцних стінах (2 металеві стіни = 16500 сірки)
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

test('UC1, UC2, UC3, UC7, UC8: Довідник, Пошук, Офлайн-збереження, Адмін-редагування та Синхронізація', async () => {
  const cache = new CacheManager();
  const api = new ServerApiClient();
  const sync = new SyncManager(cache, api);
  const catalog = new CatalogController(cache, sync);
  const search = new SearchController(cache);
  const admin = new ContentManager(cache, api);

  // UC2: Пошук за локальним індексом
  const found = search.search('шафа');
  assert.ok(found.length >= 1);

  // UC1 & UC3: Стаття 401 спочатку не збережена офлайн (isOffline: false)
  api.setSimulatedOffline(true);
  const blockedOpen = await catalog.openArticle(401);
  assert.equal(blockedOpen.success, false);
  assert.equal(blockedOpen.source, 'offline-blocked');

  // Зберігаємо статтю 401 для офлайн-доступу (UC3)
  catalog.saveForOffline(401, true);
  const offlineOpen = await catalog.openArticle(401);
  assert.equal(offlineOpen.success, true);
  assert.equal(offlineOpen.source, 'local-cache');

  // UC8: Синхронізація при увімкненому з'єднанні та новій версії на сервері
  api.setSimulatedOffline(false);
  const targetVer = sync.markServerNewVersionAvailable();
  assert.equal(sync.getPackageState(), 'Outdated');

  const syncRes = await sync.sync();
  assert.equal(syncRes.status, 'updated');
  assert.equal(syncRes.packageState, 'OfflineAvailable');
  assert.equal(cache.getVersion(), targetVer);

  // UC7: Адміністратор додає нову статтю та отримує перевірку безпеки
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
    content: 'Детальна інструкція з підключення Industrial Conveyor, електричних фільтрів та адаптерів сховищ для автоматичної переплавки руди на базі.',
    categoryId: 6,
    patchVersion: '2026.11',
  });
  assert.equal(validUpdate.isValid, true);
  assert.ok(validUpdate.savedArticle);
});
