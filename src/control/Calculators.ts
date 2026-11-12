/**
 * Пакет Control — Калькулятори та Перевірка надійності бази
 * Реалізує:
 * - UC4 «Розрахувати переробку ресурсів» (RecycleCalculator <<Control>>)
 * - UC5 «Розрахувати вибухівку та ресурси для рейду» (RaidCalculator <<Control>>)
 * - Перевірка надійності побудови баз (BaseReliabilityAnalyzer <<Control>>)
 */

import {
  IRecycleItem,
  IRecycleCalculationResult,
  IStructureType,
  IExplosiveRecipe,
  IRaidCalculationResult,
  IRaidTargetEntry,
  IRaidMethodSummary,
} from '../entities/models';
import {
  SEED_RECYCLE_ITEMS,
  SEED_STRUCTURES,
  SEED_EXPLOSIVE_RECIPES,
} from '../entities/seedData';
import { BaseCalculator, InputValidator } from './InputValidator';

/**
 * Клас RecycleCalculator <<Control>> (наслідує BaseCalculator)
 * Виконує UC4: перевіряє кількість через InputValidator, бере коефіцієнти виходу з RecycleRule
 * та враховує тип переробника (Radtown 60% / Safezone 40%)
 */
export class RecycleCalculator extends BaseCalculator {
  private items: IRecycleItem[];

  constructor(items: IRecycleItem[] = SEED_RECYCLE_ITEMS, validator?: InputValidator) {
    super(validator);
    this.items = items;
  }

  public getRules(itemId: number): IRecycleItem | undefined {
    return this.items.find((i) => i.id === itemId);
  }

  /**
   * Розрахунок переробки одного або декількох предметів (UC4)
   */
  public calculate(
    entries: { itemId: number; quantity: number | string }[],
    recyclerZone: 'radtown' | 'safezone' = 'radtown'
  ): IRecycleCalculationResult {
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

    const validatedEntries: { item: IRecycleItem; quantity: number }[] = [];

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

    // Коефіцієнт зони: у seedData вказано точний вихід для Радтауна (60%).
    // Для Safezone (40%) вихід становить 40 / 60 = 2/3 від Радтауна.
    const zoneMultiplier = recyclerZone === 'radtown' ? 1.0 : 40 / 60;
    const cycleSecPerItem = recyclerZone === 'radtown' ? 5 : 8;

    const resourceMap = new Map<
      string,
      { resourceId: string; resourceName: string; totalAmount: number; unit: string }
    >();

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
        ? 'Радтаун / Монумент (Ефективність 60%, 5с цикл)'
        : 'Мирна зона Outpost / Bandit (Ефективність 40%, 8с цикл)';

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

/**
 * Клас RaidCalculator <<Control>> (наслідує BaseCalculator)
 * Виконує розрахунок вибухівки та ресурсів для рейду:
 * 1) validate(blocks)
 * 2) computeExplosives(blocks) — Визначення комплексу вибухівки
 * 3) computeRawResources() — Розрахунок потреби базової сировини (сірка, порох, вугілля, метал, паливо)
 */
export class RaidCalculator extends BaseCalculator {
  private structures: IStructureType[];
  private recipes: Record<string, IExplosiveRecipe>;

  constructor(
    structures: IStructureType[] = SEED_STRUCTURES,
    recipes: Record<string, IExplosiveRecipe> = SEED_EXPLOSIVE_RECIPES,
    validator?: InputValidator
  ) {
    super(validator);
    this.structures = structures;
    this.recipes = recipes;
  }

  public getExplosivesPerBlock(structureId: string): IStructureType | undefined {
    return this.structures.find((s) => s.id === structureId);
  }

  public getRecipe(explosiveId: string): IExplosiveRecipe | undefined {
    return this.recipes[explosiveId];
  }

  public computeRawResources(explosiveCounts: { explosiveId: string; count: number }[]) {
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

  public calculate(
    targetsInput: { structureId: string; blocks: number | string }[]
  ): IRaidCalculationResult {
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
        recommendedMethod: null as unknown as IRaidMethodSummary,
        reportText: '',
      };
    }

    const validatedTargets: IRaidTargetEntry[] = [];
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
          recommendedMethod: null as unknown as IRaidMethodSummary,
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
          recommendedMethod: null as unknown as IRaidMethodSummary,
          reportText: '',
        };
      }

      validatedTargets.push({ structure, quantity: check.normalizedNumber });
      totalHp += structure.hp * check.normalizedNumber;
    }

    // Етап 1 стану «Обчислення»: Визначення комплексу вибухівки
    let totalC4 = 0;
    let totalRockets = 0;
    let totalSatchels = 0;
    let totalExplosiveAmmo = 0;

    const optimalAccumulator = new Map<string, number>();

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

    // Етап 2 стану «Обчислення»: Розрахунок потреби базової сировини
    const methods: IRaidMethodSummary[] = [
      {
        methodId: 'optimal',
        methodName: 'Оптимальне комбо (Мінімум сірки)',
        explosiveCounts: optimalList.map((i) => ({ name: i.name, count: i.count })),
        rawResources: this.computeRawResources(
          optimalList.map((i) => ({ explosiveId: i.explosiveId, count: i.count }))
        ),
      },
      {
        methodId: 'c4',
        methodName: 'Чистий рейд через C4',
        explosiveCounts: [{ name: this.recipes.c4.name, count: totalC4 }],
        rawResources: this.computeRawResources([{ explosiveId: 'c4', count: totalC4 }]),
      },
      {
        methodId: 'rockets',
        methodName: 'Рейд Бойовими Ракетами',
        explosiveCounts: [{ name: this.recipes.rockets.name, count: totalRockets }],
        rawResources: this.computeRawResources([{ explosiveId: 'rockets', count: totalRockets }]),
      },
      {
        methodId: 'explosiveAmmo',
        methodName: 'Вибухові патрони 5.56',
        explosiveCounts: [{ name: this.recipes.explosiveAmmo.name, count: totalExplosiveAmmo }],
        rawResources: this.computeRawResources([
          { explosiveId: 'explosiveAmmo', count: totalExplosiveAmmo },
        ]),
      },
      {
        methodId: 'satchels',
        methodName: 'Сумки з вибухівкою (Satchel)',
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

/**
 * Аналізатор надійності побудови баз (BaseReliabilityAnalyzer)
 * Перевіряє баланс захисту між рейдом через двері та рейдом через стіни/стелю,
 * оцінює стійкість до офлайн-рейду та виявляє слабкі місця конструкції
 */
export interface IBaseReliabilityAudit {
  doorPathSulfur: number;
  wallPathSulfur: number;
  effectiveMinSulfur: number;
  weakestVector: 'Коридор дверей' | 'Стіни / Соти (Honeycomb)' | 'Збалансовано';
  ratingScore: number; // 0..100
  securityGrade: 'Низька (Стартова)' | 'Середня (Соло/Дуо)' | 'Висока (Укріплена)' | 'Фортеця (Клан)';
  recommendations: string[];
}

export class BaseReliabilityAnalyzer {
  private raidCalc: RaidCalculator;

  constructor(raidCalc: RaidCalculator = new RaidCalculator()) {
    this.raidCalc = raidCalc;
  }

  public auditBaseConfiguration(params: {
    doorSegments: { structureId: string; count: number }[];
    wallSegments: { structureId: string; count: number }[];
    hasBunker: boolean;
    hasExternalTc: boolean;
    autoTurretsCount: number;
  }): IBaseReliabilityAudit {
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

    // Якщо активовано бункер стабільності з МВК/Металу, вхід у ядро додатково закритий дахом
    if (params.hasBunker) {
      doorPathSulfur += 8250; // Додаткова металева стеля бункера
    }

    const effectiveMinSulfur =
      doorPathSulfur > 0 && wallPathSulfur > 0
        ? Math.min(doorPathSulfur, wallPathSulfur)
        : Math.max(doorPathSulfur, wallPathSulfur);

    let weakestVector: 'Коридор дверей' | 'Стіни / Соти (Honeycomb)' | 'Збалансовано' =
      'Збалансовано';
    const delta = Math.abs(doorPathSulfur - wallPathSulfur);

    if (delta > 1500) {
      weakestVector =
        doorPathSulfur < wallPathSulfur ? 'Коридор дверей' : 'Стіни / Соти (Honeycomb)';
    }

    // Розрахунок рейтингу надійності
    let score = Math.min(65, Math.round(effectiveMinSulfur / 350));
    if (params.hasBunker) score += 12;
    if (params.hasExternalTc) score += 10;
    score += Math.min(13, params.autoTurretsCount * 3);
    score = Math.min(100, Math.max(5, score));

    let securityGrade: IBaseReliabilityAudit['securityGrade'] = 'Низька (Стартова)';
    if (score >= 85) securityGrade = 'Фортеця (Клан)';
    else if (score >= 60) securityGrade = 'Висока (Укріплена)';
    else if (score >= 35) securityGrade = 'Середня (Соло/Дуо)';

    const recommendations: string[] = [];

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
