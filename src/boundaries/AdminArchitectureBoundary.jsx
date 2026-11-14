import React, { useState } from 'react';
import {
  FilePlus,
  CheckCircle2,
  AlertCircle,
  Code2,
  Server,
  Edit3,
  Copy,
  Check,
} from 'lucide-react';
import { CSHARP_BACKEND_FILES } from '../entities/csharpReference.js';

export const AdminArchitectureBoundary = ({
  categories,
  articles,
  contentManager,
  packageState,
  packageMeta,
  userRole,
  onSwitchToAdmin,
  onArticleSaved,
}) => {
  const [activeTab, setActiveTab] = useState('editor');
  const [editingId, setEditingId] = useState(undefined);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 1);
  const [patchVersion, setPatchVersion] = useState('2026.11');

  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const [selectedCsFileId, setSelectedCsFileId] = useState(CSHARP_BACKEND_FILES[0].id);
  const [copiedId, setCopiedId] = useState(null);

  const handleSelectArticleToEdit = (art) => {
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

  const handleSubmitArticle = async (e) => {
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
      setSubmitError(res.errorMessage || 'Некоректні дані статті.');
      return;
    }

    setSubmitSuccess(
      `Статтю «${res.savedArticle?.title}» збережено та оновлено в базі даних.`
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

  const handleCopyCode = (code, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 sm:px-7 py-4 border-b border-[#262b33] bg-[#111316] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f3f5] font-display">
            Редактор бази та інженерна архітектура
          </h1>
          <p className="text-xs text-[#8c94a0]">
            Управління статтями довідника, вихідний код C# (.NET 10) та структура модулів системи
          </p>
        </div>

        <div className="flex items-center bg-[#16191e] border border-[#2a303a] rounded-[3px] p-0.5 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 ${
              activeTab === 'editor'
                ? 'bg-[#cd412b] text-white'
                : 'text-[#8c94a0] hover:text-[#e6e8eb]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Редактор довідника
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('csharp')}
            className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 ${
              activeTab === 'csharp'
                ? 'bg-[#cd412b] text-white'
                : 'text-[#8c94a0] hover:text-[#e6e8eb]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Код C# (.NET 10)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('uml')}
            className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 ${
              activeTab === 'uml'
                ? 'bg-[#cd412b] text-white'
                : 'text-[#8c94a0] hover:text-[#e6e8eb]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Архітектура модулів
          </button>
        </div>
      </div>

      {activeTab === 'editor' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-[#262b33] p-5 sm:p-7 space-y-5">
            {userRole !== 'admin' && (
              <div className="px-4 py-3 bg-[#15181c] border border-[#2a303a] rounded-[3px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-[#b9c0cb]">
                  Для демонстрації прав адміністратора ви можете активувати роль редактора.
                </div>
                <button
                  type="button"
                  onClick={onSwitchToAdmin}
                  className="px-3.5 py-1.5 bg-[#252a32] hover:bg-[#2f3540] text-[#f1f3f5] text-xs font-medium rounded-[3px] whitespace-nowrap"
                >
                  Увімкнути права адміністратора
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pb-3 border-b border-[#20242b]">
              <h2 className="text-lg font-bold text-[#f1f3f5] font-display">
                {editingId ? `Редагування статті #${editingId}` : 'Нова стаття довідника'}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs text-[#cd412b] hover:underline"
                >
                  + Створити нову
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitArticle} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label htmlFor="admin-article-title" className="block text-xs text-[#8c94a0] mb-1">
                    Заголовок (5–140 символів)
                  </label>
                  <input
                    id="admin-article-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Напр.: Таблиця витрат палива для Мінікоптера"
                    className="w-full px-3 py-2 bg-[#15181c] border border-[#2a303a] rounded-[3px] text-sm text-[#f1f3f5] focus:outline-none focus:border-[#cd412b] min-h-[40px]"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label htmlFor="admin-article-patch" className="block text-xs text-[#8c94a0] mb-1">
                    Версія патчу
                  </label>
                  <input
                    id="admin-article-patch"
                    type="text"
                    value={patchVersion}
                    onChange={(e) => setPatchVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-[#15181c] border border-[#2a303a] rounded-[3px] text-sm font-mono tabular-nums text-[#f1f3f5] focus:outline-none focus:border-[#cd412b] min-h-[40px]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-article-category" className="block text-xs text-[#8c94a0] mb-1">
                  Розділ довідника
                </label>
                <select
                  id="admin-article-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#15181c] border border-[#2a303a] rounded-[3px] text-sm text-[#f1f3f5] focus:outline-none focus:border-[#cd412b] min-h-[40px]"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="admin-article-summary" className="block text-xs text-[#8c94a0] mb-1">
                  Короткий опис (мін. 10 символів)
                </label>
                <input
                  id="admin-article-summary"
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Анотація для пошукового індексу..."
                  className="w-full px-3 py-2 bg-[#15181c] border border-[#2a303a] rounded-[3px] text-sm text-[#f1f3f5] focus:outline-none focus:border-[#cd412b] min-h-[40px]"
                />
              </div>

              <div>
                <label htmlFor="admin-article-content" className="block text-xs text-[#8c94a0] mb-1">
                  Повний текст матеріалу (мін. 30 символів)
                </label>
                <textarea
                  id="admin-article-content"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Детальний посібник, формули або інструкція..."
                  className="w-full px-3 py-2 bg-[#15181c] border border-[#2a303a] rounded-[3px] text-sm text-[#f1f3f5] focus:outline-none focus:border-[#cd412b]"
                />
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="px-3.5 py-2.5 bg-red-950/40 border border-red-800/70 rounded-[3px] flex items-center gap-2 text-xs text-red-300"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div
                  role="status"
                  className="px-3.5 py-2.5 bg-[#15221a] border border-emerald-800/70 rounded-[3px] flex items-center gap-2 text-xs text-emerald-300"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#cd412b] hover:bg-[#de4b34] text-white text-xs font-semibold rounded-[3px] transition-colors flex items-center gap-1.5 min-h-[40px]"
                >
                  <FilePlus className="w-4 h-4" />
                  {editingId ? 'Оновити статтю' : 'Опублікувати статтю'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitle('Мінікоптер та Повітряний Транспорт: Норми витрати палива');
                    setSummary(
                      'Скільки палива низької якості (LGF) споживає Мінікоптер, Транспортний гелікоптер та Повітряна куля за хвилину польоту.'
                    );
                    setContent(
                      'Мінікоптер (Minicopter) коштує 750 скрапу у Повітряному таборі (Air Wolf) і споживає рівно 30 одиниць Палива низької якості (Low Grade Fuel) за хвилину польоту. Транспортний гелікоптер коштує 1250 скрапу та споживає 50 палива за хвилину.'
                    );
                    setCategoryId(1);
                  }}
                  className="px-3.5 py-2 bg-[#181c22] hover:bg-[#222730] border border-[#2a303a] text-[#d0d5dd] text-xs font-medium rounded-[3px] min-h-[40px]"
                >
                  Заповнити приклад
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 p-5 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#20242b]">
              <h3 className="text-base font-bold text-[#f1f3f5] font-display">
                Реєстр статей ({articles.length})
              </h3>
              <span className="text-xs font-mono tabular-nums text-[#8c94a0]">
                Пакет v{packageMeta.version}
              </span>
            </div>

            <div className="divide-y divide-[#1e2229] border border-[#262b33] rounded-[3px] max-h-[460px] overflow-y-auto">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#13161a]"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#7b8391] font-mono">
                      #{art.id} · Патч {art.patchVersion} · {art.isOffline ? 'Офлайн' : 'Онлайн'}
                    </div>
                    <div className="text-sm font-medium text-[#e6e8eb] truncate">{art.title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectArticleToEdit(art)}
                    className="px-3 py-1.5 bg-[#181c22] hover:bg-[#222730] border border-[#2a303a] rounded-[2px] text-xs text-[#e6e8eb] shrink-0"
                  >
                    Редагувати
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'csharp' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#262b33] divide-y divide-[#1e2229] bg-[#111316]">
            {CSHARP_BACKEND_FILES.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => setSelectedCsFileId(file.id)}
                className={`w-full text-left px-5 py-4 transition-colors ${
                  selectedCsFileId === file.id ? 'bg-[#191d23]' : 'hover:bg-[#15181c]'
                }`}
              >
                <div className="text-[11px] font-mono text-[#cd412b]">
                  {file.packageLayer} · {file.umlStereotype}
                </div>
                <div className="text-sm font-mono font-semibold text-[#e6e8eb] mt-1 truncate">
                  {file.fileName}
                </div>
                <p className="text-xs text-[#8c94a0] mt-1 line-clamp-2">{file.description}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 flex flex-col min-w-0">
            <div className="px-5 py-3.5 bg-[#13161a] border-b border-[#262b33] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs text-[#8c94a0] truncate">{activeCsFile.description}</div>
                <div className="text-sm font-mono font-semibold text-[#f1f3f5] mt-0.5">
                  {activeCsFile.fileName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(activeCsFile.code, activeCsFile.id)}
                className="px-3 py-1.5 bg-[#1c2026] hover:bg-[#252a32] border border-[#2e3440] rounded-[3px] text-xs font-medium text-[#e6e8eb] flex items-center gap-1.5 shrink-0"
              >
                {copiedId === activeCsFile.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Скопійовано
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Копіювати
                  </>
                )}
              </button>
            </div>
            <pre className="p-5 text-xs font-mono text-[#cfd4dc] overflow-auto leading-relaxed flex-1 bg-[#0e1012]">
              <code>{activeCsFile.code}</code>
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'uml' && (
        <div className="p-5 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 border border-[#262b33] divide-y md:divide-y-0 md:divide-x divide-[#262b33] bg-[#13161a] rounded-[3px]">
            <div className="p-5 space-y-2.5">
              <div className="text-[11px] font-mono text-[#cd412b]">Пакет Boundaries</div>
              <h3 className="text-lg font-bold text-[#f1f3f5] font-display">Граничний шар (UI)</h3>
              <ul className="space-y-1 text-xs font-mono text-[#b9c0cb] pt-2 border-t border-[#20242b]">
                <li>CatalogBoundary (довідник і офлайн)</li>
                <li>WeaponTrainerBoundary (спреї зброї)</li>
                <li>RecycleBoundary (переробка)</li>
                <li>RaidBoundary (вибухівка та сірка)</li>
                <li>BaseBuilderBoundary (аудит баз)</li>
                <li>ServerApiClient (REST API клієнт)</li>
              </ul>
            </div>

            <div className="p-5 space-y-2.5">
              <div className="text-[11px] font-mono text-emerald-400">Пакет Control</div>
              <h3 className="text-lg font-bold text-[#f1f3f5] font-display">Керуючий шар</h3>
              <ul className="space-y-1 text-xs font-mono text-[#b9c0cb] pt-2 border-t border-[#20242b]">
                <li>InputValidator / BaseCalculator</li>
                <li>RaidCalculator / RecycleCalculator</li>
                <li>BaseReliabilityAnalyzer</li>
                <li>CatalogController / SearchController</li>
                <li>SyncManager / CacheManager</li>
                <li>ContentManager</li>
              </ul>
            </div>

            <div className="p-5 space-y-2.5">
              <div className="text-[11px] font-mono text-sky-400">Пакет Entities</div>
              <h3 className="text-lg font-bold text-[#f1f3f5] font-display">Моделі даних</h3>
              <ul className="space-y-1 text-xs font-mono text-[#b9c0cb] pt-2 border-t border-[#20242b]">
                <li>Category · Article · DataPackage</li>
                <li>RecycleItem · RecycleRule</li>
                <li>StructureType · ExplosiveRecipe</li>
                <li>BaseDesignBlueprint · WeaponData</li>
              </ul>
            </div>
          </div>

          <div className="p-5 bg-[#13161a] border border-[#262b33] rounded-[3px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-[#cfd4dc]">
              <span className="font-semibold text-[#f1f3f5]">Стек системи:</span> React / JavaScript
              (UI) · Node.js / Electron (.exe) · C# / .NET 10 (Модель серверного API)
            </div>
            <div className="font-mono text-[#8c94a0]">
              Стан кешу: {packageState} · v{packageMeta.version} ({packageMeta.sizeMb} МБ)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
