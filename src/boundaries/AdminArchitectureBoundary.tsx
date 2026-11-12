import React, { useState } from 'react';
import {
  FilePlus,
  CheckCircle2,
  AlertCircle,
  Code2,
  Database,
  Server,
  Edit3,
  Copy,
  Check,
} from 'lucide-react';
import {
  ICategory,
  IArticle,
  PackageState,
  UserRole,
} from '../entities/models';
import { CSHARP_BACKEND_FILES } from '../entities/csharpReference';
import { ContentManager } from '../control/Controllers';

interface AdminArchitectureBoundaryProps {
  categories: ICategory[];
  articles: IArticle[];
  contentManager: ContentManager;
  packageState: PackageState;
  packageMeta: {
    version: number;
    patchName: string;
    lastSyncedAt: string;
    offlineCount: number;
    totalCount: number;
    sizeMb: number;
  };
  userRole: UserRole;
  onSwitchToAdmin: () => void;
  onArticleSaved: () => void;
}

export const AdminArchitectureBoundary: React.FC<AdminArchitectureBoundaryProps> = ({
  categories,
  articles,
  contentManager,
  packageState,
  packageMeta,
  userRole,
  onSwitchToAdmin,
  onArticleSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'admin_uc7' | 'csharp_backend' | 'uml_architecture'>(
    'admin_uc7'
  );

  // Стан форми редактора довідника (UC7 AdminPanel -> ContentManager -> InputValidator -> ServerApiClient)
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [patchVersion, setPatchVersion] = useState<string>('2026.11');

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [selectedCsFileId, setSelectedCsFileId] = useState<string>(CSHARP_BACKEND_FILES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSelectArticleToEdit = (art: IArticle) => {
    setEditingId(art.id);
    setTitle(art.title);
    setSummary(art.summary);
    setContent(art.content);
    setCategoryId(art.categoryId);
    setPatchVersion(art.patchVersion);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleResetForm = () => {
    setEditingId(undefined);
    setTitle('');
    setSummary('');
    setContent('');
    setCategoryId(categories[0]?.id || 1);
    setPatchVersion('2026.11');
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  // UC7 «Оновити довідкові дані на сервері»
  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const res = await contentManager.updateArticle({
      id: editingId,
      title,
      summary,
      content,
      categoryId,
      patchVersion,
      isOffline: true,
    });

    if (!res.isValid) {
      setSubmitError(res.errorMessage || 'Некоректні дані статті (UC6 InputValidator).');
      return;
    }

    setSubmitSuccess(
      `Статтю «${res.savedArticle?.title}» перевірено InputValidator, відправлено через ServerApiClient.put("/articles/${res.savedArticle?.id}") та синхронізовано з локальною БД!`
    );
    onArticleSaved();
    if (!editingId) {
      setTitle('');
      setSummary('');
      setContent('');
    }
  };

  const activeCsFile =
    CSHARP_BACKEND_FILES.find((f) => f.id === selectedCsFileId) || CSHARP_BACKEND_FILES[0];

  const handleCopyCode = (code: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Панель Адміністратора та C#/.NET Архітектура
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Керування серверною базою довідника, перегляд C# (.NET 10) реалізації та UML-моделі
            пакетів Boundaries / Control / Entities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab('admin_uc7')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] flex items-center gap-1.5 ${
              activeTab === 'admin_uc7'
                ? 'bg-orange-600 text-white'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Редактор довідника (UC7)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('csharp_backend')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] flex items-center gap-1.5 ${
              activeTab === 'csharp_backend'
                ? 'bg-orange-600 text-white'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Вихідний код C# (.NET 10)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('uml_architecture')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] flex items-center gap-1.5 ${
              activeTab === 'uml_architecture'
                ? 'bg-orange-600 text-white'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            UML Архітектура системи
          </button>
        </div>
      </div>

      {activeTab === 'admin_uc7' && (
        <div className="space-y-6">
          {userRole !== 'admin' && (
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-zinc-300 space-y-1">
                <div className="font-semibold text-orange-400">
                  Контроль доступу: Редагування довідника закріплено за роллю «Адміністратор»
                </div>
                <p className="text-zinc-400">
                  Перемкніть поточну роль на «Адміністратор», щоб випробувати сценарій UC7
                  «Оновити довідкові дані на сервері» або перевірити блокування некоректного вмісту.
                </p>
              </div>
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-500 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                Увімкнути роль «Адміністратор»
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Ліва колонка: Форма створення/редагування статті (AdminPanel <<Boundary>>) */}
            <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h2 className="text-lg font-bold text-zinc-100">
                  {editingId
                    ? `Редагування статті #${editingId} (UC7)`
                    : 'Додати нову статтю в довідник (UC7)'}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-orange-400 hover:underline"
                  >
                    + Створити нову статтю
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmitArticle} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8">
                    <label
                      htmlFor="admin-article-title"
                      className="block text-xs font-medium text-zinc-300 mb-1.5"
                    >
                      Заголовок статті (5–140 символів)
                    </label>
                    <input
                      id="admin-article-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Напр.: Таблиця витрат палива для Мінікоптера та Attack Helicopter"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-orange-500 min-h-[44px]"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label
                      htmlFor="admin-article-patch"
                      className="block text-xs font-medium text-zinc-300 mb-1.5"
                    >
                      Версія патчу
                    </label>
                    <input
                      id="admin-article-patch"
                      type="text"
                      value={patchVersion}
                      onChange={(e) => setPatchVersion(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm font-mono tabular-nums text-zinc-100 focus:outline-none focus:border-orange-500 min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-article-category"
                    className="block text-xs font-medium text-zinc-300 mb-1.5"
                  >
                    Категорія довідника
                  </label>
                  <select
                    id="admin-article-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-orange-500 min-h-[44px]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="admin-article-summary"
                    className="block text-xs font-medium text-zinc-300 mb-1.5"
                  >
                    Короткий опис для локального індексу (мінімум 10 символів)
                  </label>
                  <input
                    id="admin-article-summary"
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Коротка анотація, за якою працює миттєвий офлайн-пошук UC2..."
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-orange-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-article-content"
                    className="block text-xs font-medium text-zinc-300 mb-1.5"
                  >
                    Повний текст статті (мінімум 30 символів, перевіряється на XSS)
                  </label>
                  <textarea
                    id="admin-article-content"
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Введіть детальний посібник, пропорції ресурсів або поради для гравців..."
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/70 flex items-center gap-2.5 text-xs text-red-300"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{submitError}</span>
                  </div>
                )}

                {submitSuccess && (
                  <div
                    role="status"
                    className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/70 flex items-center gap-2.5 text-xs text-emerald-300"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{submitSuccess}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors flex items-center gap-2 min-h-[44px]"
                  >
                    <FilePlus className="w-4 h-4" />
                    {editingId
                      ? 'Оновити статтю на сервері (PUT /articles)'
                      : 'Опублікувати статтю (UC7)'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTitle('Мінікоптер та Повітряний Транспорт: Норми витрати палива');
                      setSummary(
                        'Скільки палива низької якості (LGF) споживає Мінікоптер, Транспортний гелікоптер та Повітряна куля за хвилину польоту.'
                      );
                      setContent(
                        'Мінікоптер (Minicopter) коштує 750 скрапу у Повітряному таборі (Air Wolf) і споживає рівно 30 одиниць Палива низької якості (Low Grade Fuel) за хвилину польоту. Транспортний гелікоптер (Scrap Transport Helicopter) коштує 1250 скрапу та споживає 50 палива за хвилину.'
                      );
                      setCategoryId(1);
                    }}
                    className="px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors min-h-[44px]"
                  >
                    Заповнити демо-статтю про Мінікоптер
                  </button>
                </div>
              </form>
            </div>

            {/* Права колонка: Наявні статті у серверній/локальній БД для редагування */}
            <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-zinc-100">
                  Реєстр статей у БД ({articles.length})
                </h3>
                <span className="text-xs font-mono tabular-nums text-zinc-400">
                  Пакет v{packageMeta.version}
                </span>
              </div>

              <div className="divide-y divide-zinc-800/80 max-h-[420px] overflow-y-auto">
                {articles.map((art) => (
                  <div
                    key={art.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-zinc-400">
                        ID #{art.id} · Патч {art.patchVersion} ·{' '}
                        {art.isOffline ? 'У локальному кеші' : 'Серверна'}
                      </div>
                      <div className="text-sm font-medium text-zinc-100 truncate">
                        {art.title}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectArticleToEdit(art)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 shrink-0 min-h-[36px]"
                    >
                      Редагувати
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'csharp_backend' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold text-zinc-100">
              Модулі C# (.NET 10)
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Вихідний код бекенду та бізнес-логіки калькуляторів, поділений за пакетами Entities,
              Control та Boundaries.
            </p>

            <div className="space-y-2">
              {CSHARP_BACKEND_FILES.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setSelectedCsFileId(file.id)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-colors ${
                    selectedCsFileId === file.id
                      ? 'bg-orange-950/30 border-orange-500 text-zinc-100'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="text-xs text-orange-400 font-mono">
                    Пакет {file.packageLayer} · {file.umlStereotype}
                  </div>
                  <div className="text-sm font-semibold text-zinc-100 mt-1 font-mono truncate">
                    {file.fileName}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{file.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-zinc-400">{activeCsFile.description}</div>
                <div className="text-sm font-mono font-semibold text-zinc-100 mt-0.5">
                  {activeCsFile.fileName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(activeCsFile.code, activeCsFile.id)}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 shrink-0 min-h-[38px]"
              >
                {copiedId === activeCsFile.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Скопійовано
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Копіювати код C#
                  </>
                )}
              </button>
            </div>
            <pre className="p-5 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed max-h-[540px]">
              <code>{activeCsFile.code}</code>
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'uml_architecture' && (
        <div className="space-y-6">
          {/* Картки пакетів Boundaries -> Control -> Entities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="text-xs text-orange-400 font-mono">
                Пакет 1 · Стереотип &laquo;Boundary&raquo;
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Пакет Boundaries</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Містить усі граничні класи на пристрої гравця та інтерфейс із сервером. Залежності
                спрямовані виключно до пакета Control.
              </p>
              <ul className="space-y-1.5 text-xs font-mono text-zinc-300 pt-2 border-t border-zinc-800">
                <li>+ MainScreen (showMenu, navigate, showSyncStatus)</li>
                <li>+ CatalogScreen (showArticles, showArticle, showSaved)</li>
                <li>+ SearchScreen (enterQuery, showResults)</li>
                <li>+ RecycleScreen (selectItem, enterQuantity, showReport)</li>
                <li>+ RaidScreen (selectStructure, enterBlocks, showReport)</li>
                <li>+ AdminPanel (editContent, showConfirmation)</li>
                <li>+ ServerApiClient (get, put)</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="text-xs text-emerald-400 font-mono">
                Пакет 2 · Стереотип &laquo;Control&raquo;
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Пакет Control</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Керуючі класи, що координують виконання варіантів використання UC1–UC8. Калькулятори
                успадковують спільного предка BaseCalculator.
              </p>
              <ul className="space-y-1.5 text-xs font-mono text-zinc-300 pt-2 border-t border-zinc-800">
                <li>+ BaseCalculator (#checkInput)</li>
                <li>+ RaidCalculator (calculate, computeExplosives, computeRawResources)</li>
                <li>+ RecycleCalculator (calculate)</li>
                <li>+ InputValidator (validate, checkRange)</li>
                <li>+ CatalogController (openCategory, openArticle, saveForOffline)</li>
                <li>+ SearchController (search, normalizeQuery)</li>
                <li>+ SyncManager (sync, download, checkConnection)</li>
                <li>+ CacheManager (getArticles, saveArticle, findInLocalIndex, replaceData)</li>
                <li>+ ContentManager (loadContent, updateArticle)</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="text-xs text-sky-400 font-mono">
                Пакет 3 · Стереотип &laquo;Entity&raquo;
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Пакет Entities</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Класи-сутності предметної області зі закритими атрибутами (-) та відкритими
                операціями (+). DataPackage агрегує список Article.
              </p>
              <ul className="space-y-1.5 text-xs font-mono text-zinc-300 pt-2 border-t border-zinc-800">
                <li>+ Category (-id, -name, +getName)</li>
                <li>+ Article (-id, -title, -content, -categoryId, -isOffline, +persist)</li>
                <li>+ DataPackage (-version, -sizeMb, +getVersion, +setVersion)</li>
                <li>+ Item (-id, -name) &amp; RecycleRule (-itemId, -resource, -yieldCoefficient)</li>
                <li>+ StructureType (-name, -material, -explosivesPerBlock)</li>
                <li>+ ExplosiveRecipe (-name, -craftProportions)</li>
                <li>+ CalculationResult (-resources, -explosives, +toReport)</li>
              </ul>
            </div>
          </div>

          {/* Об'єднана діаграма компонентів і розміщення */}
          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-500" />
                Архітектура компонентів і розміщення вузлів системи
              </h3>
              <span className="text-xs font-mono text-zinc-400">
                Поточний стан локального пакета: {packageState} (v{packageMeta.version} ·{' '}
                {packageMeta.sizeMb} МБ)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-100">
                  Вузол 1: Мобільний пристрій / ПК гравця (RustHelper.apk / Web)
                </div>
                <p className="text-zinc-400">
                  Містить UI (React / JS), Модуль довідника (C#), Модуль калькуляторів (C#), Модуль
                  синхронізації (C#) та Локальну БД (офлайн-дані).
                </p>
              </div>
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-100">
                  Вузол 2: Сервер даних (RustHelperAPI.dll)
                </div>
                <p className="text-zinc-400">
                  Містить API довідкових даних (.NET), Серверну БД (повний довідник) та Сховище схем
                  і зображень баз. Обмін по HTTPS.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-100">
                  Вузол 3: ПК адміністратора (AdminPanel)
                </div>
                <p className="text-zinc-400">
                  Містить Панель адміністратора для виконання UC7 (перевірка та публікація нових
                  статей і оновлення коефіцієнтів після патчів гри Rust).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
