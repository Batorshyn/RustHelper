/**
 * База даних гри Rust для RustHelper
 * Містить актуальні коефіцієнти переробки, характеристики споруд, рецепти вибухівки,
 * статті довідника та схеми баз (Патч 2026.11)
 */

import {
  ICategory,
  IArticle,
  IRecycleItem,
  IStructureType,
  IExplosiveRecipe,
  IBaseDesignBlueprint,
  IWeaponTrainingData,
} from './models';

export const CURRENT_SERVER_PACKAGE_VERSION = 202611;
export const CURRENT_PATCH_NAME = 'Rust Patch 2026.11 (World & Raid Update)';

export const SEED_CATEGORIES: ICategory[] = [
  {
    id: 1,
    name: 'Основи виживання',
    slug: 'survival-basics',
    description: 'Перші кроки на сервері, система шафи (TC), верстаки та радіаційний захист.',
  },
  {
    id: 2,
    name: 'Будівництво та укріплення баз',
    slug: 'base-building',
    description: 'Механіка стабільності, соти (honeycomb), бункерні системи та захист від офлайн-рейдів.',
  },
  {
    id: 3,
    name: 'Ресурси та переробка',
    slug: 'resources-recycling',
    description: 'Різниця між переробниками у Радтаунах (60%) та мирних зонах Outpost/Bandit (40%), фарм металу й сірки.',
  },
  {
    id: 4,
    name: 'Рейди та вибухівка',
    slug: 'raiding-explosives',
    description: 'Економіка сірки, сплеш-ушкодження ракет, таблиці вартості знищення дверей і стін.',
  },
  {
    id: 5,
    name: 'Монументи та ключ-карти',
    slug: 'monuments-puzzles',
    description: 'Головоломки із зеленими, синіми та червоними картками, запобіжники та таймінги крейтів.',
  },
  {
    id: 6,
    name: 'Електрика та автоматизація',
    slug: 'electricity-automation',
    description: 'Схеми підключення автотурелей, датчиків HBHF, розумних перемикачів Rust+ та індустріальних конвеєрів.',
  },
];

export const SEED_ARTICLES: IArticle[] = [
  {
    id: 101,
    title: 'Повний гайд для новачка: перші 60 хвилин після вайпу',
    categoryId: 1,
    patchVersion: '2026.11',
    isOffline: true,
    readTimeMinutes: 5,
    summary: 'Алгоритм виживання від спавну на пляжі до постановки першої кам’яної бази 2x1 з металевими дверима та шафою.',
    keyStats: [
      { label: 'Спальник', value: '30 Тканини' },
      { label: 'Шафа (TC)', value: '1000 Дерева' },
      { label: 'Кам’яна 2x1', value: '~3800 Каменю' },
      { label: 'Піч', value: '200 Каменю, 50 Палива' },
    ],
    content: `Перша година після вайпу на сервері Rust визначає темп вашого подальшого розвитку. Не витрачайте час на бійки на пляжі з каменем у руках — ваша головна мета полягає в тому, щоб якнайшвидше відійти від зони спавну вглиб карти та зібрати базову тканину.

1. Збір тканини та спальні мішки (Sleeping Bags)
По дорозі від узбережжя збирайте коноплю (Hemp). Перші 30 одиниць тканини одразу витрачайте на спальний мішок і ставте його неподалік від обраного місця забудови. Це ваша точка відродження у разі раптової смерті.

2. Вибір локації для стартової бази
Для гравця-початківця найкраще підходять ділянки біля невеликих монументів: Oxum's Gas Station, Supermarket або Mining Outpost, де є переробник (Recycler), але немає високої концентрації великих кланів.

3. Побудова стартового будиночка 2x1 з тамбуром (Airlock)
Ніколи не будуйте базу з одними дверима. Трикутний фундамент на вході створює шлюз (Airlock): коли одні двері відчинені, другі блокують прохід, тому ворог під дверима (doorcamper) не зможе забігти всередину. Одразу встановлюйте Tool Cupboard (Шафу) з кодовим або звичайним замком, щоб захистити територію від гниття (decay) та чужого будівництва.

4. Перехід від дерева до каменю та металевих дверей
Дерев'яні двері та стіни легко випалюються вогнеметом або ламаються дробовиками (Eoka / Водопровідний дробовик). Зберіть 50 одиниць Палива низької якості (Low Grade Fuel) з червоних бочок або тваринного жиру, скрафтіть піч (Furnace), переплавте 150 металевої руди та встановіть Листові металеві двері (Sheet Metal Door).`,
  },
  {
    id: 102,
    title: 'Механіка Шафи Інструментів (Tool Cupboard) та розрахунок податку Upkeep',
    categoryId: 1,
    patchVersion: '2026.11',
    isOffline: true,
    readTimeMinutes: 4,
    summary: 'Як працює система прогресивного податку на утримання бази (Upkeep) та скільки годин будинок стоїть після знищення TC.',
    keyStats: [
      { label: 'До 15 блоків', value: '10% вартості / доба' },
      { label: '16–50 блоків', value: '15% вартості / доба' },
      { label: '51–175 блоків', value: '20% вартості / доба' },
      { label: '175+ блоків', value: '33% вартості / доба' },
    ],
    content: `Шафа інструментів (Tool Cupboard або TC) — це серце будь-якої бази в Rust. Вона виконує дві критичні функції: надає привілей будівництва (Building Privilege) в радіусі ~16 метрів (6 фундаментів) та утримує споруду від руйнування (Decay).

Прогресивна шкала податку (Upkeep Tax)
Чим більше будівельних блоків (фундаментів, стін, стель, дверних прорізів) має ваша база, тим вищий відсоток від загальної вартості будівництва списується щодоби:
• 1–15 блоків: 10% за 24 години
• 16–50 блоків: 15% за 24 години
• 51–175 блоків: 20% за 24 години
• Понад 175 блоків: 33.3% за 24 години

Час гниття (Decay Time) без ресурсів
Якщо ресурси у шафі закінчилися, зовнішні шари бази починають втрачати HP:
• Солома (Twig): 1 година
• Дерево (Wood): 3 години
• Камінь (Stone): 5 годин
• Метал (Sheet Metal): 8 годин
• Броньований метал (Armored HQM): 12 годин

Лайфхак із зовнішніми шафами (External TCs)
Щоб рейдерам після знищення головної шафи не дістався привілей будувати на вашій базі, встановлюйте 2–4 зовнішні трикутні шафи на мінімальній допустимій дистанції та підводьте їх будівельними рамками впритул до основної споруди.`,
  },
  {
    id: 201,
    title: 'Бункерні бази та стільникове укріплення (Honeycomb): архітектура захисту',
    categoryId: 2,
    patchVersion: '2026.11',
    isOffline: true,
    readTimeMinutes: 6,
    summary: 'Як зрівняти вартість рейду по дверях і стінах за допомогою сотів та бункера стабільності з дахом.',
    keyStats: [
      { label: '1 Кам’яна стіна', value: '4 Ракети / 2 C4' },
      { label: '1 Металева стіна', value: '8 Ракет / 4 C4' },
      { label: '1 МВК стіна', value: '15 Ракет / 8 C4' },
      { label: 'Гаражні двері', value: '3 Ракети / 150 Патронів' },
    ],
    content: `Головна помилка при будівництві бази в Rust — дисбаланс між міцністю стін і міцністю дверей. Одна кам'яна стіна тримає 4 ракети (500 HP), тоді як звичайні металеві двері падають від 1 ракети та 8 вибухових патронів (250 HP).

1. Стільникове укріплення (Honeycomb)
Додавання трикутних фундаментів із глухими стінами навколо ядра бази (Core) перетворює одинарну стіну на подвійну. Якщо ядро виконано з листового металу (8 ракет), а зовнішній шар honeycomb — з каменю (4 ракети), рейдеру знадобиться щонайменше 12 ракет (16 800 сірки) для прямого пробиття в лут-рум.

2. Механіка бункера стабільності (Stability Bunker)
Оскільки гаражні двері коштують лише 3 ракети, а броньовані — 5 ракет, коридор із дверей завжди дешевший за пробиття стін, поки ви не використовуєте бункер.
Принцип роботи: піднятий фундамент оточують стінами, а з низького фундаменту ставлять тимчасову солом'яну (Twig) напівстіну, на яку опирається металевий або броньований дах (Roof), що намертво перекриває вхід у ядро бази. Зсередини гравець ставить спальник, а при виході онлайн ламає солом'яну опору — дах миттєво руйнується через втрату стабільності, відкриваючи прохід.`,
  },
  {
    id: 301,
    title: 'Ефективність Переробника (Recycler): Мирні зони проти Радтаунів',
    categoryId: 3,
    patchVersion: '2026.11',
    isOffline: true,
    readTimeMinutes: 4,
    summary: 'Точні коефіцієнти виходу скрапу, металу та МВК при переробці компонентів після оновлення переробників.',
    keyStats: [
      { label: 'Радтаун (Небезпечна зона)', value: '60% вихід / Швидко (5с)' },
      { label: 'Мирна зона (Safezone)', value: '40% вихід / Повільно (8с)' },
      { label: 'Tech Trash (Радтаун)', value: '24 Скрапу + 1–2 МВК' },
      { label: 'Rifle Body (Радтаун)', value: '30 Скрапу + 2 МВК' },
    ],
    content: `Переробник (Recycler) — головне джерело металобрухту (Scrap), фрагментів металу, тканини та металу високої якості (HQM). Важливо враховувати різницю між переробниками у відкритих монументах та у безпечних зонах.

1. Переробники у небезпечних монументах (Radtowns)
Розташовані на Airfield, Launch Site, Water Treatment, Train Yard, Oxum's, Lighthouse та ін.
• Ефективність переробки становить 60% від базової вартості компонента (дає на 20% більше ресурсів за стандартний розбір!).
• Час циклу: 5 секунд на слот.

2. Переробники у мирних зонах (Outpost, Bandit Camp, Рибальські села)
• Ефективність знижена до 40% від базової вартості.
• Час циклу збільшений до 8 секунд на слот.
• Висновок: переробляти великі партії компонентів (Шестерні, Труби, Tech Trash, C4/Камери) в Outpost невигідно — ви втрачаєте третину металобрухту та МВК.`,
  },
  {
    id: 401,
    title: 'Економіка рейду: коли використовувати Ракети, C4 чи Вибухові патрони',
    categoryId: 4,
    patchVersion: '2026.11',
    isOffline: false,
    readTimeMinutes: 7,
    summary: 'Порівняння витрат сірки та вугілля на кожен тип перешкод і секрети комбінованого рейду зі сплеш-ушкодженням.',
    keyStats: [
      { label: '1 Заряд C4', value: '2 200 Сірки' },
      { label: '1 Бойова Ракета', value: '1 400 Сірки' },
      { label: '1 Сумка (Satchel)', value: '480 Сірки' },
      { label: '63 Вибухових патрони', value: '1 575 Сірки (Двері)' },
    ],
    content: `Успішний рейд у Rust починається з точного підрахунку сірки (Sulfur) та вибору правильного інструменту. Неправильний вибір вибухівки може коштувати вашій групі зайвих 5 000–10 000 сірки.

1. Вибухові патрони 5.56 (Explosive Ammo) + Глушник
Найкращий вибір для точкового вибивання одинарних дверей та комбінацій із ракетами:
• Листові металеві двері: 63 патрони (1 575 сірки) — це значно дешевше, ніж 2 ракети (2 800 сірки), і майже безшумно з глушником.
• Комбо на металеві двері: 1 Ракета + 8 Вибухових патронів = 1 600 сірки за лічені секунди.

2. Заряди з таймером (C4)
Наносять фіксоване точкове ушкодження без широкого сплешу. Ідеальні, коли потрібно пробити одну конкретну стіну або броньовані двері:
• Кам'яна стіна: 2 C4 (4 400 сірки) проти 4 Ракет (5 600 сірки).
• Металева стіна: 4 C4 (8 800 сірки) проти 8 Ракет (11 200 сірки).
• Броньована стіна (МВК): 8 C4 (17 600 сірки) проти 15 Ракет (21 000 сірки).

3. Ракети (Rockets) та сплеш по 4 стінах
Хоча ракети дорожчі на одну стіну (5 600 сірки за камінь), їхній радіус вибуху дозволяє одночасно наносити 100% ушкодження стику чотирьох сусідніх квадратів або стель. Якщо ви стріляєте в перехрестя 4 кам'яних стін за 4 ракети, ви ламаєте всі 4 стіни за ціною однієї!`,
  },
  {
    id: 501,
    title: 'Довідник ключ-карток Монументів: Зелена, Синя та Червона кімнати',
    categoryId: 5,
    patchVersion: '2026.11',
    isOffline: false,
    readTimeMinutes: 5,
    summary: 'Де знайти кожну ключ-картку, скільки електричних запобіжників (Electric Fuse) брати із собою та який рівень радіації очікує всередині.',
    keyStats: [
      { label: 'Зелена картка', value: 'Маяк, Заправка, Супермаркет' },
      { label: 'Синя картка', value: 'Супутник, Гавань, Депо' },
      { label: 'Червона картка', value: 'Аеродром, Водоочисна, Поїзди' },
      { label: 'Елітні ящики', value: 'Launch Site, Нафтовишки, Воєнтунель' },
    ],
    content: `Система головоломок на монументах дозволяє швидко здобути сотні скрапу та зброю високого рівня без тривалого фарму бочок вздовж доріг.

Рівень 1: Зелена картка (Green Keycard)
• Де знайти: на столах у Маяку (Lighthouse), Супермаркеті, Заправці Oxum's або купити в Outpost.
• Де використати (потребує 1 запобіжник): Порт (Harbor), Супутникові тарілки (Satellite Dish), Каналізаційний відвід (Sewer Branch).
• Нагорода: Синя картка + 2–4 ящики та 50–100 скрапу.

Рівень 2: Синя картка (Blue Keycard)
• Де використати: Аеродром (Airfield — 2 запобіжники), Водоочисна станція (Water Treatment — 1 запобіжник), Сортувальна станція (Train Yard — 1 запобіжник).
• Потрібний захист від радіації: від 11% до 25% (одяг або Хазмат).
• Нагорода: Червона картка + військові (Military) ящики.

Рівень 3: Червона картка (Red Keycard)
• Де використати: Космодром (Launch Site — 2 запобіжники + Зелена + Червона картка, радіація 25%+), Військові тунелі (Military Tunnels), Підводні лабораторії та Мала/Велика Нафтовишки (Oil Rig) з викликом важких вчених на гелікоптері Chinook.`,
  },
  {
    id: 601,
    title: 'Електрична схема: Живлення 3 Автотурелей із резервним акумулятором',
    categoryId: 6,
    patchVersion: '2026.11',
    isOffline: false,
    readTimeMinutes: 5,
    summary: 'Надійна схема без втрати енергії з використанням Великого акумулятора, Вітряка та датчика присутності.',
    keyStats: [
      { label: '1 Автотурель', value: '10 rWm споживання' },
      { label: 'Великий акумулятор', value: '100 rWm вихід / 24 000 rWm ємність' },
      { label: 'Сонячна панель', value: 'до 20 rWm вдень' },
      { label: 'Вітряна турбіна', value: '60–150 rWm (залежить від висоти)' },
    ],
    content: `Автоматичні турелі (Auto Turrets) — найефективніший захист бази від онлайн та офлайн рейдів. Кожна турель споживає рівно 10 одиниць енергії (rWm).

Стандартна схема на 3–9 турелей через Large Rechargeable Battery:
1. Джерела генерації: встановіть Вітряк (Wind Turbine) якомога вище на даху (кожен поверх додає потужність вітру) або 4 Сонячні панелі, спрямовані на Північ/Південь під кутом сонця, об'єднані через Root Combiner.
2. Подайте живлення на вхід Power In Великого акумулятора (Large Battery, максимальна віддача — 100 rWm).
3. З виходу акумулятора підключіть кабель до Електричного розгалужувача (Electrical Branch) або Спліттера (Splitter).
4. На кожному Electrical Branch виставте Branch Out = 10 rWm і ведіть кабель напряму до входу Power In автотурелі.
5. У самій турелі встановіть зброю (найкраще Python Revolver з набоями 5.56/Пістолетними або Bolty/AK-47) — один Великий акумулятор здатен живити 9 турелей одночасно!`,
  },
];

export const SEED_RECYCLE_ITEMS: IRecycleItem[] = [
  {
    id: 1,
    name: 'Шестерні (Gears)',
    category: 'Components',
    maxStack: 20,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'scrap', resourceName: 'Металобрухт (Scrap)', amountPerUnit: 12, unit: 'шт.' },
      { resourceId: 'metal_frags', resourceName: 'Фрагменти металу', amountPerUnit: 15, unit: 'шт.' },
    ],
  },
  {
    id: 2,
    name: 'Металева труба (Metal Pipe)',
    category: 'Components',
    maxStack: 20,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'scrap', resourceName: 'Металобрухт (Scrap)', amountPerUnit: 6, unit: 'шт.' },
      { resourceId: 'hqm', resourceName: 'Метал високої якості (МВК)', amountPerUnit: 1.2, unit: 'шт.' },
    ],
  },
  {
    id: 3,
    name: 'Корпус гвинтівки (Rifle Body)',
    category: 'Components',
    maxStack: 10,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'scrap', resourceName: 'Металобрухт (Scrap)', amountPerUnit: 30, unit: 'шт.' },
      { resourceId: 'hqm', resourceName: 'Метал високої якості (МВК)', amountPerUnit: 2.4, unit: 'шт.' },
    ],
  },
  {
    id: 4,
    name: 'Корпус пістолета-кулемета (SMG Body)',
    category: 'Components',
    maxStack: 10,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'scrap', resourceName: 'Металобрухт (Scrap)', amountPerUnit: 18, unit: 'шт.' },
      { resourceId: 'hqm', resourceName: 'Метал високої якості (МВК)', amountPerUnit: 2.4, unit: 'шт.' },
    ],
  },
  {
    id: 5,
    name: 'Напівавтоматичний корпус (Semi Body)',
    category: 'Components',
    maxStack: 10,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'scrap', resourceName: 'Металобрухт (Scrap)', amountPerUnit: 18, unit: 'шт.' },
      { resourceId: 'hqm', resourceName: 'Метал високої якості (МВК)', amountPerUnit: 2.4, unit: 'шт.' },
      { resourceId: 'metal_frags', resourceName: 'Фрагменти металу', amountPerUnit: 90, unit: 'шт.' },
    ],
  },
  {
    id: 6,
    name: 'Технічне сміття (Tech Trash)',
    category: 'Electrical',
    maxStack: 50,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'scrap', resourceName: 'Металобрухт (Scrap)', amountPerUnit: 24, unit: 'шт.' },
      { resourceId: 'hqm', resourceName: 'Метал високої якості (МВК)', amountPerUnit: 1.2, unit: 'шт.' },
    ],
  },
  {
    id: 7,
    name: 'Металева пружина (Metal Spring)',
    category: 'Components',
    maxStack: 20,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'scrap', resourceName: 'Металобрухт (Scrap)', amountPerUnit: 12, unit: 'шт.' },
      { resourceId: 'hqm', resourceName: 'Метал високої якості (МВК)', amountPerUnit: 1.2, unit: 'шт.' },
    ],
  },
  {
    id: 8,
    name: 'Листовий метал (Sheet Metal)',
    category: 'Components',
    maxStack: 20,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'scrap', resourceName: 'Металобрухт (Scrap)', amountPerUnit: 9.6, unit: 'шт.' },
      { resourceId: 'metal_frags', resourceName: 'Фрагменти металу', amountPerUnit: 120, unit: 'шт.' },
      { resourceId: 'hqm', resourceName: 'Метал високої якості (МВК)', amountPerUnit: 1.2, unit: 'шт.' },
    ],
  },
  {
    id: 9,
    name: 'Дорожні знаки (Road Signs)',
    category: 'Components',
    maxStack: 20,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'scrap', resourceName: 'Металобрухт (Scrap)', amountPerUnit: 6, unit: 'шт.' },
      { resourceId: 'hqm', resourceName: 'Метал високої якості (МВК)', amountPerUnit: 1.2, unit: 'шт.' },
    ],
  },
  {
    id: 10,
    name: 'Швацький набір (Sewing Kit)',
    category: 'Components',
    maxStack: 20,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'cloth', resourceName: 'Тканина (Cloth)', amountPerUnit: 12, unit: 'шт.' },
      { resourceId: 'rope', resourceName: 'Мотузка (Rope)', amountPerUnit: 2.4, unit: 'шт.' },
    ],
  },
  {
    id: 11,
    name: 'Мотузка (Rope)',
    category: 'Components',
    maxStack: 50,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'cloth', resourceName: 'Тканина (Cloth)', amountPerUnit: 18, unit: 'шт.' },
    ],
  },
  {
    id: 12,
    name: 'Брезент (Tarp)',
    category: 'Components',
    maxStack: 20,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'cloth', resourceName: 'Тканина (Cloth)', amountPerUnit: 60, unit: 'шт.' },
    ],
  },
  {
    id: 13,
    name: 'Камера відеоспостереження (CCTV Camera)',
    category: 'Electrical',
    maxStack: 64,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'tech_trash', resourceName: 'Технічне сміття (Tech Trash)', amountPerUnit: 2.4, unit: 'шт.' },
      { resourceId: 'hqm', resourceName: 'Метал високої якості (МВК)', amountPerUnit: 2.4, unit: 'шт.' },
    ],
  },
  {
    id: 14,
    name: 'Комп’ютер наведення (Targeting Computer)',
    category: 'Electrical',
    maxStack: 64,
    recycleTimeSec: 5,
    yields: [
      { resourceId: 'tech_trash', resourceName: 'Технічне сміття (Tech Trash)', amountPerUnit: 3.6, unit: 'шт.' },
      { resourceId: 'hqm', resourceName: 'Метал високої якості (МВК)', amountPerUnit: 1.2, unit: 'шт.' },
      { resourceId: 'metal_frags', resourceName: 'Фрагменти металу', amountPerUnit: 60, unit: 'шт.' },
    ],
  },
];

export const SEED_EXPLOSIVE_RECIPES: Record<string, IExplosiveRecipe> = {
  c4: {
    id: 'c4',
    name: 'Заряд з таймером (C4)',
    workbenchLevel: 3,
    damageNote: 'Точковий вибух без широкого сплешу, найвигідніший за сіркою на 1 стіну',
    sulfur: 2200,
    gunpowder: 1000,
    charcoal: 3000,
    metalFragments: 200,
    lowGradeFuel: 60,
    techTrash: 2,
    rope: 0,
    metalPipes: 0,
    cloth: 5,
  },
  rockets: {
    id: 'rockets',
    name: 'Бойова ракета (Rocket)',
    workbenchLevel: 3,
    damageNote: 'Радіус сплешу до 4 сусідніх блоків одночасно',
    sulfur: 1400,
    gunpowder: 650,
    charcoal: 1950,
    metalFragments: 100,
    lowGradeFuel: 30,
    techTrash: 0,
    rope: 0,
    metalPipes: 2,
    cloth: 0,
  },
  satchels: {
    id: 'satchels',
    name: 'Сумка з вибухівкою (Satchel Charge)',
    workbenchLevel: 1,
    damageNote: 'Доступна на 1 верстаку, має випадкову затримку вибуху',
    sulfur: 480,
    gunpowder: 240,
    charcoal: 720,
    metalFragments: 80,
    lowGradeFuel: 0,
    techTrash: 0,
    rope: 1,
    metalPipes: 0,
    cloth: 10,
  },
  explosiveAmmo: {
    id: 'explosiveAmmo',
    name: 'Вибуховий патрон 5.56 (Explosive 5.56)',
    workbenchLevel: 3,
    damageNote: 'Тихий рейд із глушником та добивання після ракет',
    sulfur: 25,
    gunpowder: 10,
    charcoal: 30,
    metalFragments: 5,
    lowGradeFuel: 0,
    techTrash: 0,
    rope: 0,
    metalPipes: 0,
    cloth: 0,
  },
};

export const SEED_STRUCTURES: IStructureType[] = [
  {
    id: 'wood_door',
    name: 'Дерев’яні двері (Wooden Door)',
    category: 'Doors & Hatches',
    material: 'Дерево',
    hp: 200,
    upkeepPerDay: '15 Дерева',
    explosivesRequired: {
      c4: 1,
      rockets: 1,
      satchels: 2,
      explosiveAmmo: 19,
    },
    optimalCombo: {
      description: '19 Вибухових патронів 5.56 (або Коктейль Молотова)',
      items: [{ explosiveId: 'explosiveAmmo', count: 19 }],
      totalSulfur: 475,
    },
  },
  {
    id: 'sheet_metal_door',
    name: 'Листові металеві двері (Sheet Metal Door)',
    category: 'Doors & Hatches',
    material: 'Метал',
    hp: 250,
    upkeepPerDay: '15 Фрагментів металу',
    explosivesRequired: {
      c4: 1,
      rockets: 2,
      satchels: 4,
      explosiveAmmo: 63,
    },
    optimalCombo: {
      description: '1 Ракета + 8 Вибухових патронів (або 63 пат.)',
      items: [
        { explosiveId: 'rockets', count: 1 },
        { explosiveId: 'explosiveAmmo', count: 8 },
      ],
      totalSulfur: 1600,
    },
  },
  {
    id: 'garage_door',
    name: 'Гаражні двері (Garage Door)',
    category: 'Doors & Hatches',
    material: 'Метал',
    hp: 600,
    upkeepPerDay: '30 Фрагментів металу',
    explosivesRequired: {
      c4: 2,
      rockets: 3,
      satchels: 9,
      explosiveAmmo: 150,
    },
    optimalCombo: {
      description: '1 C4 + 41 Вибуховий патрон',
      items: [
        { explosiveId: 'c4', count: 1 },
        { explosiveId: 'explosiveAmmo', count: 41 },
      ],
      totalSulfur: 3225,
    },
  },
  {
    id: 'armored_door',
    name: 'Броньовані двері (Armored Door)',
    category: 'Doors & Hatches',
    material: 'МВК (Броньований)',
    hp: 1000,
    upkeepPerDay: '3 МВК',
    explosivesRequired: {
      c4: 3,
      rockets: 5,
      satchels: 15,
      explosiveAmmo: 250,
    },
    optimalCombo: {
      description: '2 C4 + 30 Вибухових патронів',
      items: [
        { explosiveId: 'c4', count: 2 },
        { explosiveId: 'explosiveAmmo', count: 30 },
      ],
      totalSulfur: 5150,
    },
  },
  {
    id: 'wood_wall',
    name: 'Дерев’яна стіна / стеля (Wood Wall)',
    category: 'Walls & Floors',
    material: 'Дерево',
    hp: 250,
    upkeepPerDay: '20–66 Дерева',
    explosivesRequired: {
      c4: 1,
      rockets: 2,
      satchels: 3,
      explosiveAmmo: 49,
    },
    optimalCombo: {
      description: '49 Вибухових патронів або 3 Сумки (Satchel)',
      items: [{ explosiveId: 'explosiveAmmo', count: 49 }],
      totalSulfur: 1225,
    },
  },
  {
    id: 'stone_wall',
    name: 'Кам’яна стіна / стеля (Stone Wall)',
    category: 'Walls & Floors',
    material: 'Камінь',
    hp: 500,
    upkeepPerDay: '30–100 Каменю',
    explosivesRequired: {
      c4: 2,
      rockets: 4,
      satchels: 10,
      explosiveAmmo: 185,
    },
    optimalCombo: {
      description: '3 Ракети + 30 Вибухових патронів (сплеш) або 2 C4',
      items: [{ explosiveId: 'c4', count: 2 }],
      totalSulfur: 4400,
    },
  },
  {
    id: 'metal_wall',
    name: 'Металева стіна / стеля (Sheet Metal Wall)',
    category: 'Walls & Floors',
    material: 'Метал',
    hp: 1000,
    upkeepPerDay: '20–66 Металу',
    explosivesRequired: {
      c4: 4,
      rockets: 8,
      satchels: 23,
      explosiveAmmo: 400,
    },
    optimalCombo: {
      description: '3 C4 + 66 Вибухових патронів або 4 C4',
      items: [
        { explosiveId: 'c4', count: 3 },
        { explosiveId: 'explosiveAmmo', count: 66 },
      ],
      totalSulfur: 8250,
    },
  },
  {
    id: 'armored_wall',
    name: 'Броньована стіна МВК (Armored Wall)',
    category: 'Walls & Floors',
    material: 'МВК (Броньований)',
    hp: 2000,
    upkeepPerDay: '3–8 МВК',
    explosivesRequired: {
      c4: 8,
      rockets: 15,
      satchels: 46,
      explosiveAmmo: 799,
    },
    optimalCombo: {
      description: '7 C4 + 31 Вибуховий патрон',
      items: [
        { explosiveId: 'c4', count: 7 },
        { explosiveId: 'explosiveAmmo', count: 31 },
      ],
      totalSulfur: 16175,
    },
  },
  {
    id: 'auto_turret',
    name: 'Автоматична турель (Auto Turret)',
    category: 'Defenses & Deployables',
    material: 'Скло / Техніка',
    hp: 1000,
    upkeepPerDay: '10 rWm Енергії',
    explosivesRequired: {
      c4: 1,
      rockets: 4,
      satchels: 2,
      explosiveAmmo: 112,
    },
    optimalCombo: {
      description: '3 Гранати F1 або 2 Сумки (Satchel)',
      items: [{ explosiveId: 'satchels', count: 2 }],
      totalSulfur: 960,
    },
  },
  {
    id: 'high_external_stone_wall',
    name: 'Висока зовнішня кам’яна стіна',
    category: 'Defenses & Deployables',
    material: 'Камінь',
    hp: 500,
    upkeepPerDay: 'У зоні дії TC',
    explosivesRequired: {
      c4: 2,
      rockets: 4,
      satchels: 10,
      explosiveAmmo: 185,
    },
    optimalCombo: {
      description: '2 C4 або 4 Ракети',
      items: [{ explosiveId: 'c4', count: 2 }],
      totalSulfur: 4400,
    },
  },
];

export const SEED_BASE_BLUEPRINTS: IBaseDesignBlueprint[] = [
  {
    id: 'solo_duo_2x1_honeycomb',
    name: 'Укріплений 2x1 Honeycomb + Airlock',
    footprint: '2x1 + Трикутні соти',
    groupSize: 'Соло / Дуо (1–2 гравці)',
    buildCost: {
      wood: 2400,
      stone: 8600,
      metalFragments: 4800,
      highQualityMetal: 45,
    },
    upkeep24h: {
      stone: 1150,
      metalFragments: 680,
      highQualityMetal: 6,
    },
    minRaidPath: [
      { targetId: 'sheet_metal_door', quantity: 2 },
      { targetId: 'garage_door', quantity: 3 },
    ],
    honeycombLayers: 1,
    hasBunker: false,
    hasRoofAccessControl: true,
    turretCount: 1,
    description: 'Класична розширювана база з подвійним тамбуром, 3 гаражними дверима всередині та сотами по периметру.',
    strengths: [
      'Низький податок Upkeep (поміщається в TC на 6 діб)',
      'Збалансований рейд як через двері (12 200 сірки), так і через стіни (12 650 сірки)',
      'Легко будується зі стартового 2x1 без знесення стін',
    ],
    weaknesses: [
      'Без бункера рейдери можуть пройти коридором дверей за 11 ракет',
      'Обмежене місце для великих печей всередині',
    ],
  },
  {
    id: 'bunker_2x2_stability',
    name: '2x2 Stability Bunker + Підстрілок (Shooting Floor)',
    footprint: '2x2 + Бункер даху + Соти',
    groupSize: 'Тріо / Квад (2–4 гравці)',
    buildCost: {
      wood: 4500,
      stone: 16400,
      metalFragments: 11200,
      highQualityMetal: 140,
    },
    upkeep24h: {
      stone: 2600,
      metalFragments: 1850,
      highQualityMetal: 22,
    },
    minRaidPath: [
      { targetId: 'stone_wall', quantity: 1 },
      { targetId: 'armored_wall', quantity: 1 },
      { targetId: 'garage_door', quantity: 1 },
    ],
    honeycombLayers: 2,
    hasBunker: true,
    hasRoofAccessControl: true,
    turretCount: 4,
    description: 'Захищена бункерна база з броньованим ядром (HQM Core) та повноцінним відстрільним поверхом на 360 градусів.',
    strengths: [
      'Броньований бункер піднімає мінімальний поріг рейду до 23 800+ сірки',
      'Внутрішні піки (inner peekdowns) дозволяють захищати онлайн-рейд',
      'Розділені лут-руми на 15 великих ящиків',
    ],
    weaknesses: [
      'Вимагає постійного фарму МВК (22 шт./добу)',
      'При забутті закриття бункера вразлива через верхній шлюз',
    ],
  },
  {
    id: 'clan_multi_tc_compound',
    name: 'Multi-TC Фортеця з зовнішніми шафами та Компаундом',
    footprint: '3x3 Core + 4 External TCs',
    groupSize: 'Група / Клан (5–8 гравців)',
    buildCost: {
      wood: 12000,
      stone: 42000,
      metalFragments: 34000,
      highQualityMetal: 380,
    },
    upkeep24h: {
      stone: 7800,
      metalFragments: 6400,
      highQualityMetal: 65,
    },
    minRaidPath: [
      { targetId: 'high_external_stone_wall', quantity: 1 },
      { targetId: 'metal_wall', quantity: 2 },
      { targetId: 'armored_wall', quantity: 1 },
      { targetId: 'armored_door', quantity: 2 },
    ],
    honeycombLayers: 3,
    hasBunker: true,
    hasRoofAccessControl: true,
    turretCount: 9,
    description: 'Важка база з перехресним перекриттям привілеїв будівництва (disconnectable external TCs) та багатошаровим металевим захистом.',
    strengths: [
      'Навіть після вибивання головного TC рейдери не можуть запечатати пролом',
      'Понад 45 000 сірки до центрального лут-руму',
      '9 автотурелей у внутрішньому дворі та підстрілку',
    ],
    weaknesses: [
      'Висока складність зведення та необхідність контролювати 5 окремих шаф',
    ],
  },
];

export const SEED_WEAPONS_TRAINING: IWeaponTrainingData[] = [
  {
    id: 'ak47',
    name: 'Штурмова гвинтівка (AK-47)',
    tier: 'Tier 3',
    damageHead: 100,
    damageChest: 50,
    fireRateRpm: 450,
    magazineSize: 30,
    reloadTimeSec: 4.4,
    recoilPatternDesc: 'Діагональне зміщення вгору-вправо на перших 5 пострілах із плавною S-подібною дугою. Присідання зменшує віддачу на 50%.',
    crouchModifier: '-50% вертикальної та горизонтальної віддачі',
    bestAttachments: ['Голографічний приціл (Holo)', 'Лазерний цілевказівник'],
    craftCost: '50 МВК, 200 Дерева, 1 Rifle Body, 4 Пружини',
    recoilPoints: [
      { x: 50, y: 85 },
      { x: 46, y: 78 },
      { x: 42, y: 71 },
      { x: 39, y: 64 },
      { x: 38, y: 57 },
      { x: 41, y: 50 },
      { x: 46, y: 44 },
      { x: 52, y: 38 },
      { x: 58, y: 33 },
      { x: 61, y: 28 },
      { x: 57, y: 23 },
      { x: 51, y: 18 },
      { x: 45, y: 14 },
      { x: 42, y: 10 },
    ],
  },
  {
    id: 'mp5',
    name: 'Пістолет-кулемет MP5A4',
    tier: 'Tier 3',
    damageHead: 70,
    damageChest: 35,
    fireRateRpm: 600,
    magazineSize: 30,
    reloadTimeSec: 4.0,
    recoilPatternDesc: 'Вертикальний підйом на перших 6 кулях з подальшим горизонтальним коливанням вліво-вправо.',
    crouchModifier: '-45% розкиду та підкидання ствола',
    bestAttachments: ['Голографічний приціл', 'Тактичний ліхтар'],
    craftCost: '15 МВК, 1 SMG Body, 2 Пружини',
    recoilPoints: [
      { x: 50, y: 85 },
      { x: 50, y: 77 },
      { x: 51, y: 69 },
      { x: 52, y: 61 },
      { x: 55, y: 54 },
      { x: 60, y: 48 },
      { x: 63, y: 43 },
      { x: 58, y: 38 },
      { x: 50, y: 34 },
      { x: 42, y: 30 },
      { x: 39, y: 25 },
      { x: 45, y: 20 },
    ],
  },
  {
    id: 'thompson',
    name: 'Пістолет-кулемет Томпсона (Thompson)',
    tier: 'Tier 2',
    damageHead: 75,
    damageChest: 38,
    fireRateRpm: 462,
    magazineSize: 20,
    reloadTimeSec: 4.0,
    recoilPatternDesc: 'Стабільна пряма вертикальна лінія вгору з мінімальним зміщенням управо. Найкраща зброя Tier 2 для середніх дистанцій.',
    crouchModifier: '-50% вертикального підйому',
    bestAttachments: ['Голографічний приціл', 'Лазер або Ліхтар'],
    craftCost: '10 МВК, 100 Дерева, 1 SMG Body, 1 Пружина',
    recoilPoints: [
      { x: 50, y: 85 },
      { x: 49, y: 76 },
      { x: 48, y: 68 },
      { x: 48, y: 60 },
      { x: 50, y: 52 },
      { x: 52, y: 44 },
      { x: 53, y: 36 },
      { x: 51, y: 28 },
      { x: 49, y: 20 },
      { x: 50, y: 13 },
    ],
  },
  {
    id: 'sar',
    name: 'Напівавтоматична гвинтівка (SAR)',
    tier: 'Tier 2',
    damageHead: 80,
    damageChest: 40,
    fireRateRpm: 343,
    magazineSize: 16,
    reloadTimeSec: 4.4,
    recoilPatternDesc: 'Чисто вертикальна віддача після кожного одиночного натискання. Потребує плавного потягування миші строго вниз.',
    crouchModifier: 'Висока кучність при стрільбі сидячи темпом 5 пострілів/с',
    bestAttachments: ['Саморобний або 8x приціл', 'Глушник для соло-фарму'],
    craftCost: '450 Металу, 4 МВК, 1 Semi Body, 1 Пружина',
    recoilPoints: [
      { x: 50, y: 85 },
      { x: 50, y: 75 },
      { x: 50, y: 65 },
      { x: 51, y: 55 },
      { x: 50, y: 45 },
      { x: 49, y: 35 },
      { x: 50, y: 25 },
      { x: 50, y: 15 },
    ],
  },
];
