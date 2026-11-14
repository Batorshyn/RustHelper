/**
 * Пакет Control — Калькулятори та Аналізатор надійності бази
 */

import {
  SEED_RECYCLE_ITEMS,
  SEED_STRUCTURES,
  SEED_EXPLOSIVE_RECIPES,
} from '../entities/seedData.js';
import { BaseCalculator } from './InputValidator.js';

export class RecycleCalculator extends BaseCalculator {
  constructor(items = SEED_RECYCLE_ITEMS, validator) {
    super(validator);
    this.items = items;
  }

  getRules(itemId) {
    return this.items.find((i) => i.id === itemId);
  }

  calculate(entries, recyclerZone = 'radtown') {
    const startTime = performance.now();

    if (!entries || entries.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Додайте хоча б один предмет до черги переробника.',
        executionTimeMs: 0,
        recyclerZone,
        efficiencyLabel: recyclerZone === 'radtown' ? '60% (Радтаун)' : '40% (Мирна зона)',
        inputItems: [],
        totalResources: [],
        totalRecycleTimeSec: 0,
        reportText: '',
      };
    }

    const validatedEntries = [];

    for (const entry of entries) {
      const check = this.checkInput(entry.quantity, 1, 10000);
      if (!check.isValid || check.normalizedNumber === undefined) {
        return {
          isValid: false,
          errorMessage: check.errorMessage || 'Некоректна кількість предметів.',
          executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
          recyclerZone,
          efficiencyLabel: recyclerZone === 'radtown' ? '60% (Радтаун)' : '40% (Мирна зона)',
          inputItems: [],
          totalResources: [],
          totalRecycleTimeSec: 0,
          reportText: '',
        };
      }

      const rule = this.getRules(entry.itemId);
      if (!rule) {
        return {
          isValid: false,
          errorMessage: `Предмет із ID ${entry.itemId} не знайдено у локальній базі правил переробки.`,
          executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
          recyclerZone,
          efficiencyLabel: recyclerZone === 'radtown' ? '60% (Радтаун)' : '40% (Мирна зона)',
          inputItems: [],
          totalResources: [],
          totalRecycleTimeSec: 0,
          reportText: '',
        };
      }

      validatedEntries.push({ item: rule, quantity: check.normalizedNumber });
    }

    const zoneMultiplier = recyclerZone === 'radtown' ? 1.0 : 40 / 60;
    const cycleSecPerItem = recyclerZone === 'radtown' ? 5 : 8;

    const resourceMap = new Map();
    let totalRecycleTimeSec = 0;

    for (const { item, quantity } of validatedEntries) {
      const stacks = Math.ceil(quantity / item.maxStack);
      totalRecycleTimeSec += stacks * cycleSecPerItem;

      for (const y of item.yields) {
        const rawYield = y.amountPerUnit * quantity * zoneMultiplier;
        const roundedYield = Math.max(1, Math.floor(rawYield + 0.0001));

        const existing = resourceMap.get(y.resourceId);
        if (existing) {
          existing.totalAmount += roundedYield;
        } else {
          resourceMap.set(y.resourceId, {
            resourceId: y.resourceId,
            resourceName: y.resourceName,
            totalAmount: roundedYield,
            unit: y.unit,
          });
        }
      }
    }

    const totalResources = Array.from(resourceMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    const elapsedMs = Math.max(0.05, Number((performance.now() - startTime).toFixed(2)));
    const efficiencyLabel =
      recyclerZone === 'radtown'
        ? 'Радтаун / Монумент (60% вихід · 5с/слот)'
        : 'Мирна зона Outpost / Bandit (40% вихід · 8с/слот)';

    const reportText = totalResources
      .map((r) => `${r.resourceName}: ${r.totalAmount} ${r.unit}`)
      .join(' · ');

    return {
      isValid: true,
      executionTimeMs: elapsedMs,
      recyclerZone,
      efficiencyLabel,
      inputItems: validatedEntries,
      totalResources,
      totalRecycleTimeSec,
      reportText,
    };
  }
}

export class RaidCalculator extends BaseCalculator {
  constructor(structures = SEED_STRUCTURES, recipes = SEED_EXPLOSIVE_RECIPES, validator) {
    super(validator);
    this.structures = structures;
    this.recipes = recipes;
  }

  getExplosivesPerBlock(structureId) {
    return this.structures.find((s) => s.id === structureId);
  }

  getRecipe(explosiveId) {
    return this.recipes[explosiveId];
  }

  computeRawResources(explosiveCounts) {
    const totals = {
      sulfur: 0,
      gunpowder: 0,
      charcoal: 0,
      metalFragments: 0,
      lowGradeFuel: 0,
      techTrash: 0,
      rope: 0,
      metalPipes: 0,
      cloth: 0,
    };

    for (const item of explosiveCounts) {
      const recipe = this.getRecipe(item.explosiveId);
      if (!recipe) continue;
      totals.sulfur += recipe.sulfur * item.count;
      totals.gunpowder += recipe.gunpowder * item.count;
      totals.charcoal += recipe.charcoal * item.count;
      totals.metalFragments += recipe.metalFragments * item.count;
      totals.lowGradeFuel += recipe.lowGradeFuel * item.count;
      totals.techTrash += recipe.techTrash * item.count;
      totals.rope += recipe.rope * item.count;
      totals.metalPipes += recipe.metalPipes * item.count;
      totals.cloth += recipe.cloth * item.count;
    }

    return totals;
  }

  calculate(targetsInput) {
    const startTime = performance.now();

    if (!targetsInput || targetsInput.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Оберіть хоча б одну ціль (двері, стіну або турель) для розрахунку рейду.',
        executionTimeMs: 0,
        sessionState: 'InputtingParameters',
        targets: [],
        totalHp: 0,
        methods: [],
        recommendedMethod: null,
        reportText: '',
      };
    }

    const validatedTargets = [];
    let totalHp = 0;

    for (const t of targetsInput) {
      const check = this.checkInput(t.blocks, 1, 500);
      if (!check.isValid || check.normalizedNumber === undefined) {
        return {
          isValid: false,
          errorMessage: check.errorMessage || 'Некоректна кількість будівельних блоків.',
          executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
          sessionState: 'ValidatingData',
          targets: [],
          totalHp: 0,
          methods: [],
          recommendedMethod: null,
          reportText: '',
        };
      }

      const structure = this.getExplosivesPerBlock(t.structureId);
      if (!structure) {
        return {
          isValid: false,
          errorMessage: `Споруду з ID "${t.structureId}" не знайдено у локальній БД.`,
          executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
          sessionState: 'ValidatingData',
          targets: [],
          totalHp: 0,
          methods: [],
          recommendedMethod: null,
          reportText: '',
        };
      }

      validatedTargets.push({ structure, quantity: check.normalizedNumber });
      totalHp += structure.hp * check.normalizedNumber;
    }

    let totalC4 = 0;
    let totalRockets = 0;
    let totalSatchels = 0;
    let totalExplosiveAmmo = 0;

    const optimalAccumulator = new Map();

    for (const { structure, quantity } of validatedTargets) {
      totalC4 += structure.explosivesRequired.c4 * quantity;
      totalRockets += structure.explosivesRequired.rockets * quantity;
      totalSatchels += structure.explosivesRequired.satchels * quantity;
      totalExplosiveAmmo += structure.explosivesRequired.explosiveAmmo * quantity;

      for (const opt of structure.optimalCombo.items) {
        optimalAccumulator.set(
          opt.explosiveId,
          (optimalAccumulator.get(opt.explosiveId) || 0) + opt.count * quantity
        );
      }
    }

    const optimalList = Array.from(optimalAccumulator.entries()).map(([explosiveId, count]) => ({
      explosiveId,
      count,
      name: this.getRecipe(explosiveId)?.name || explosiveId,
    }));

    const methods = [
      {
        methodId: 'optimal',
        methodName: 'Оптимальне комбо',
        workbenchLevel: 3,
        explosiveCounts: optimalList.map((i) => ({ name: i.name, count: i.count })),
        rawResources: this.computeRawResources(
          optimalList.map((i) => ({ explosiveId: i.explosiveId, count: i.count }))
        ),
      },
      {
        methodId: 'c4',
        methodName: 'Тільки C4',
        workbenchLevel: 3,
        explosiveCounts: [{ name: this.recipes.c4.name, count: totalC4 }],
        rawResources: this.computeRawResources([{ explosiveId: 'c4', count: totalC4 }]),
      },
      {
        methodId: 'rockets',
        methodName: 'Бойові ракети',
        workbenchLevel: 3,
        explosiveCounts: [{ name: this.recipes.rockets.name, count: totalRockets }],
        rawResources: this.computeRawResources([{ explosiveId: 'rockets', count: totalRockets }]),
      },
      {
        methodId: 'explosiveAmmo',
        methodName: 'Вибухові 5.56',
        workbenchLevel: 3,
        explosiveCounts: [{ name: this.recipes.explosiveAmmo.name, count: totalExplosiveAmmo }],
        rawResources: this.computeRawResources([
          { explosiveId: 'explosiveAmmo', count: totalExplosiveAmmo },
        ]),
      },
      {
        methodId: 'satchels',
        methodName: 'Сатчели (Верстак 1)',
        workbenchLevel: 1,
        explosiveCounts: [{ name: this.recipes.satchels.name, count: totalSatchels }],
        rawResources: this.computeRawResources([{ explosiveId: 'satchels', count: totalSatchels }]),
      },
    ];

    const recommendedMethod = [...methods].sort(
      (a, b) => a.rawResources.sulfur - b.rawResources.sulfur
    )[0];

    const elapsedMs = Math.max(0.05, Number((performance.now() - startTime).toFixed(2)));

    return {
      isValid: true,
      executionTimeMs: elapsedMs,
      sessionState: 'ReportReady',
      targets: validatedTargets,
      totalHp,
      methods,
      recommendedMethod,
      reportText: `Мінімальна потреба: ${recommendedMethod.rawResources.sulfur.toLocaleString('uk-UA')} сірки (${recommendedMethod.methodName})`,
    };
  }
}

export class BaseReliabilityAnalyzer {
  constructor(raidCalc = new RaidCalculator()) {
    this.raidCalc = raidCalc;
  }

  auditBaseConfiguration(params) {
    const doorRes = this.raidCalc.calculate(
      params.doorSegments
        .filter((d) => d.count > 0)
        .map((d) => ({ structureId: d.structureId, blocks: d.count }))
    );

    const wallRes = this.raidCalc.calculate(
      params.wallSegments
        .filter((w) => w.count > 0)
        .map((w) => ({ structureId: w.structureId, blocks: w.count }))
    );

    let doorPathSulfur = doorRes.isValid ? doorRes.recommendedMethod.rawResources.sulfur : 0;
    const wallPathSulfur = wallRes.isValid ? wallRes.recommendedMethod.rawResources.sulfur : 0;

    if (params.hasBunker) {
      doorPathSulfur += 8250;
    }

    const effectiveMinSulfur =
      doorPathSulfur > 0 && wallPathSulfur > 0
        ? Math.min(doorPathSulfur, wallPathSulfur)
        : Math.max(doorPathSulfur, wallPathSulfur);

    let weakestVector = 'Збалансовано';
    const delta = Math.abs(doorPathSulfur - wallPathSulfur);

    if (delta > 1500) {
      weakestVector =
        doorPathSulfur < wallPathSulfur ? 'Коридор дверей' : 'Стіни / Соти (Honeycomb)';
    }

    let score = Math.min(65, Math.round(effectiveMinSulfur / 350));
    if (params.hasBunker) score += 12;
    if (params.hasExternalTc) score += 10;
    score += Math.min(13, params.autoTurretsCount * 3);
    score = Math.min(100, Math.max(5, score));

    let securityGrade = 'Низька (Стартова)';
    if (score >= 85) securityGrade = 'Фортеця (Клан)';
    else if (score >= 60) securityGrade = 'Висока (Укріплена)';
    else if (score >= 35) securityGrade = 'Середня (Соло/Дуо)';

    const recommendations = [];

    if (doorPathSulfur < wallPathSulfur - 1500) {
      recommendations.push(
        `Дверний шлях слабший за стіни на ${(wallPathSulfur - doorPathSulfur).toLocaleString('uk-UA')} сірки. Додайте гаражні або броньовані двері у внутрішній шлюз.`
      );
    } else if (wallPathSulfur < doorPathSulfur - 1500) {
      recommendations.push(
        `Стіни пробиваються дешевше за двері на ${(doorPathSulfur - wallPathSulfur).toLocaleString('uk-UA')} сірки. Додайте шар трикутних сотів (Honeycomb) або покращте ядро до Металу/МВК.`
      );
    } else {
      recommendations.push(
        'Вартість рейду через двері та через стіни чудово збалансована — рейдерам не буде очевидного дешевого шляху.'
      );
    }

    if (!params.hasBunker) {
      recommendations.push(
        'Рекомендується додати бункер стабільності (Stability Bunker) на вході в ядро, щоб захиститися від дешевого рейду вибуховими патронами по дверях.'
      );
    }

    if (!params.hasExternalTc) {
      recommendations.push(
        'Встановіть хоча б 2 зовнішні трикутні шафи (External TCs), щоб рейдери не змогли запечатати вашу базу після знищення головної шафи.'
      );
    }

    if (params.autoTurretsCount === 0) {
      recommendations.push(
        'Встановіть автотурель (Auto Turret) у коридорі перед головним лут-румом для ускладнення онлайн та офлайн просування.'
      );
    }

    return {
      doorPathSulfur,
      wallPathSulfur,
      effectiveMinSulfur,
      weakestVector,
      ratingScore: score,
      securityGrade,
      recommendations,
    };
  }
}
