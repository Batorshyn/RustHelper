/**
 * Пакет Entities (Моделі даних предметної області)
 * Реалізує UML-класи зі стереотипами <<Entity>>
 */

export type UserRole = 'novice' | 'experienced' | 'admin';

export type PackageState = 'Absent' | 'Downloading' | 'OfflineAvailable' | 'Outdated';

export type RaidSessionState =
  | 'InputtingParameters'
  | 'ValidatingData'
  | 'CalculatingExplosives'
  | 'CalculatingRawResources'
  | 'ReportReady';

/**
 * Клас-сутність Category <<Entity>>
 */
export interface ICategory {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export class Category implements ICategory {
  private _id: number;
  private _name: string;
  private _slug: string;
  private _description: string;

  constructor(id: number, name: string, slug: string, description: string) {
    this._id = id;
    this._name = name;
    this._slug = slug;
    this._description = description;
  }

  public get id(): number { return this._id; }
  public get name(): string { return this._name; }
  public get slug(): string { return this._slug; }
  public get description(): string { return this._description; }

  public getName(): string {
    return this._name;
  }
}

/**
 * Клас-сутність Article <<Entity>>
 * Містить заголовок, категорію, текст, версію патчу та прапорець локального збереження
 */
export interface IArticle {
  id: number;
  title: string;
  content: string;
  summary: string;
  categoryId: number;
  patchVersion: string;
  isOffline: boolean;
  readTimeMinutes: number;
  keyStats?: { label: string; value: string }[];
  author?: string;
  status?: 'published' | 'pending';
}

export class Article implements IArticle {
  private _id: number;
  private _title: string;
  private _content: string;
  private _summary: string;
  private _categoryId: number;
  private _patchVersion: string;
  private _isOffline: boolean;
  private _readTimeMinutes: number;
  private _keyStats?: { label: string; value: string }[];
  private _author?: string;
  private _status: 'published' | 'pending';

  constructor(data: IArticle) {
    this._id = data.id;
    this._title = data.title;
    this._content = data.content;
    this._summary = data.summary;
    this._categoryId = data.categoryId;
    this._patchVersion = data.patchVersion;
    this._isOffline = data.isOffline;
    this._readTimeMinutes = data.readTimeMinutes;
    this._keyStats = data.keyStats;
    this._author = data.author || 'RustHelper Team';
    this._status = data.status || 'published';
  }

  public get id(): number { return this._id; }
  public get title(): string { return this._title; }
  public get content(): string { return this._content; }
  public get summary(): string { return this._summary; }
  public get categoryId(): number { return this._categoryId; }
  public get patchVersion(): string { return this._patchVersion; }
  public get isOffline(): boolean { return this._isOffline; }
  public set isOffline(val: boolean) { this._isOffline = val; }
  public get readTimeMinutes(): number { return this._readTimeMinutes; }
  public get keyStats() { return this._keyStats; }
  public get author() { return this._author; }
  public get status() { return this._status; }

  public getContent(): string {
    return this._content;
  }

  public persist(): boolean {
    this._isOffline = true;
    return true;
  }

  public toJSON(): IArticle {
    return {
      id: this._id,
      title: this._title,
      content: this._content,
      summary: this._summary,
      categoryId: this._categoryId,
      patchVersion: this._patchVersion,
      isOffline: this._isOffline,
      readTimeMinutes: this._readTimeMinutes,
      keyStats: this._keyStats,
      author: this._author,
      status: this._status,
    };
  }
}

/**
 * Клас-сутність DataPackage <<Entity>>
 * Зберігає версію набору даних і зв'язаний зі статтями агрегацією
 */
export interface IDataPackage {
  version: number;
  patchName: string;
  sizeMb: number;
  lastSyncedAt: string;
  articles: IArticle[];
}

export class DataPackage {
  private _version: number;
  private _patchName: string;
  private _sizeMb: number;
  private _lastSyncedAt: string;
  private _articles: IArticle[];

  constructor(version: number, patchName: string, sizeMb: number, lastSyncedAt: string, articles: IArticle[] = []) {
    this._version = version;
    this._patchName = patchName;
    this._sizeMb = sizeMb;
    this._lastSyncedAt = lastSyncedAt;
    this._articles = articles;
  }

  public getVersion(): number {
    return this._version;
  }

  public setVersion(v: number): void {
    this._version = v;
  }

  public get sizeMb(): number { return this._sizeMb; }
  public get patchName(): string { return this._patchName; }
  public get lastSyncedAt(): string { return this._lastSyncedAt; }
  public get articles(): IArticle[] { return this._articles; }
}

/**
 * Клас-сутність Item <<Entity>> та RecycleRule <<Entity>>
 * Для калькулятора переробки ресурсів (UC4)
 */
export interface IRecycleYield {
  resourceId: string;
  resourceName: string;
  amountPerUnit: number; // Скільки виходить при 100% базовому розборі або стандартному переробнику
  unit: string;
}

export interface IRecycleItem {
  id: number;
  name: string;
  category: 'Components' | 'Electrical' | 'Tools & Weapons' | 'Misc';
  maxStack: number;
  recycleTimeSec: number;
  yields: IRecycleYield[]; // При стандартному переробнику (Outpost/Monument)
}

/**
 * Клас-сутність StructureType <<Entity>>
 * Для калькулятора рейдів (UC5) та перевірки надійності баз
 */
export interface IStructureType {
  id: string;
  name: string;
  category: 'Walls & Floors' | 'Doors & Hatches' | 'Defenses & Deployables';
  material: 'Дерево' | 'Камінь' | 'Метал' | 'МВК (Броньований)' | 'Скло / Техніка';
  hp: number;
  upkeepPerDay: string;
  /** Кількість одиниць вибухівки на 1 об'єкт для кожного способу рейду */
  explosivesRequired: {
    c4: number;
    rockets: number;
    satchels: number;
    explosiveAmmo: number;
  };
  /** Найоптимальніша комбінація по сірці */
  optimalCombo: {
    description: string;
    items: { explosiveId: string; count: number }[];
    totalSulfur: number;
  };
}

/**
 * Клас-сутність ExplosiveRecipe <<Entity>>
 * Пропорції крафту вибухівки з базової сировини
 */
export interface IExplosiveRecipe {
  id: 'c4' | 'rockets' | 'satchels' | 'explosiveAmmo' | 'beancan';
  name: string;
  workbenchLevel: number;
  damageNote: string;
  /** Ресурси на 1 одиницю вибухівки */
  sulfur: number;
  gunpowder: number;
  charcoal: number;
  metalFragments: number;
  lowGradeFuel: number;
  techTrash: number;
  rope: number;
  metalPipes: number;
  cloth: number;
}

/**
 * Клас-сутність CalculationResult <<Entity>>
 */
export interface IRecycleCalculationResult {
  isValid: boolean;
  errorMessage?: string;
  executionTimeMs: number;
  recyclerZone: 'radtown' | 'safezone';
  efficiencyLabel: string;
  inputItems: { item: IRecycleItem; quantity: number }[];
  totalResources: {
    resourceId: string;
    resourceName: string;
    totalAmount: number;
    unit: string;
  }[];
  totalRecycleTimeSec: number;
  reportText: string;
}

export interface IRaidTargetEntry {
  structure: IStructureType;
  quantity: number;
}

export interface IRaidMethodSummary {
  methodId: 'c4' | 'rockets' | 'satchels' | 'explosiveAmmo' | 'optimal';
  methodName: string;
  explosiveCounts: { name: string; count: number }[];
  rawResources: {
    sulfur: number;
    gunpowder: number;
    charcoal: number;
    metalFragments: number;
    lowGradeFuel: number;
    techTrash: number;
    rope: number;
    metalPipes: number;
    cloth: number;
  };
}

export interface IRaidCalculationResult {
  isValid: boolean;
  errorMessage?: string;
  executionTimeMs: number;
  sessionState: RaidSessionState;
  targets: IRaidTargetEntry[];
  totalHp: number;
  methods: IRaidMethodSummary[];
  recommendedMethod: IRaidMethodSummary;
  reportText: string;
}

/**
 * Конструкція бази для модуля перевірки надійності побудови баз
 */
export interface IBaseDesignBlueprint {
  id: string;
  name: string;
  footprint: string;
  groupSize: string;
  buildCost: {
    wood: number;
    stone: number;
    metalFragments: number;
    highQualityMetal: number;
  };
  upkeep24h: {
    stone: number;
    metalFragments: number;
    highQualityMetal: number;
  };
  minRaidPath: {
    targetId: string;
    quantity: number;
  }[];
  honeycombLayers: number;
  hasBunker: boolean;
  hasRoofAccessControl: boolean;
  turretCount: number;
  description: string;
  strengths: string[];
  weaknesses: string[];
}

/**
 * Тренувальні матеріали для гравців-початківців та досвідчених (Спреї зброї, таймінги, монументи)
 */
export interface IWeaponTrainingData {
  id: string;
  name: string;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Military';
  damageHead: number;
  damageChest: number;
  fireRateRpm: number;
  magazineSize: number;
  reloadTimeSec: number;
  recoilPatternDesc: string;
  recoilPoints: { x: number; y: number }[]; // Координати віддачі для інтерактивного тренажера
  crouchModifier: string;
  bestAttachments: string[];
  craftCost: string;
}
