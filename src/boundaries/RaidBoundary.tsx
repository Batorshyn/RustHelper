import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import {
  IStructureType,
  IRaidCalculationResult,
  RaidSessionState,
  UserRole,
} from '../entities/models';
import { RaidCalculator } from '../control/Calculators';

interface RaidBoundaryProps {
  structures: IStructureType[];
  calculator: RaidCalculator;
  userRole: UserRole;
  onUpgradeRole: () => void;
}

const SESSION_STATE_STEPS: { id: RaidSessionState; label: string }[] = [
  { id: 'InputtingParameters', label: '1. Введення параметрів' },
  { id: 'ValidatingData', label: '2. Перевірка даних (UC6)' },
  { id: 'CalculatingExplosives', label: '3. Комплекс вибухівки' },
  { id: 'CalculatingRawResources', label: '4. Потреба сировини' },
  { id: 'ReportReady', label: '5. Звіт сформовано' },
];

export const RaidBoundary: React.FC<RaidBoundaryProps> = ({
  structures,
  calculator,
  userRole,
  onUpgradeRole,
}) => {
  const [selectedStructureId, setSelectedStructureId] = useState<string>(
    structures[1]?.id || 'sheet_metal_door'
  );
  const [blocksInput, setBlocksInput] = useState<string>('2');
  const [activeMethodTab, setActiveMethodTab] = useState<string>('optimal');

  const [raidTargets, setRaidTargets] = useState<{ structureId: string; blocks: number }[]>([
    { structureId: 'sheet_metal_door', blocks: 2 },
    { structureId: 'garage_door', blocks: 2 },
    { structureId: 'stone_wall', blocks: 1 },
  ]);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<RaidSessionState>('ReportReady');
  const [result, setResult] = useState<IRaidCalculationResult>(() =>
    calculator.calculate([
      { structureId: 'sheet_metal_door', blocks: 2 },
      { structureId: 'garage_door', blocks: 2 },
      { structureId: 'stone_wall', blocks: 1 },
    ])
  );

  // UC5 «Розрахувати вибухівку та ресурси для рейду» + UC6 «Перевірити введені дані»
  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSessionState('ValidatingData');

    const check = calculator.checkInput(blocksInput, 1, 500);
    if (!check.isValid || check.normalizedNumber === undefined) {
      setValidationError(check.errorMessage || 'Некоректна кількість блоків.');
      return;
    }

    const updated = [...raidTargets];
    const existingIdx = updated.findIndex((t) => t.structureId === selectedStructureId);
    if (existingIdx >= 0) {
      updated[existingIdx] = {
        ...updated[existingIdx],
        blocks: updated[existingIdx].blocks + check.normalizedNumber,
      };
    } else {
      updated.push({ structureId: selectedStructureId, blocks: check.normalizedNumber });
    }

    setRaidTargets(updated);
    const calcRes = calculator.calculate(updated);
    if (!calcRes.isValid) {
      setValidationError(calcRes.errorMessage || 'Помилка обчислення');
    } else {
      setSessionState('ReportReady');
      setResult(calcRes);
    }
  };

  const handleUpdateTargetCount = (structureId: string, rawVal: string) => {
    setValidationError(null);
    setSessionState('ValidatingData');
    const check = calculator.checkInput(rawVal, 1, 500);
    if (!check.isValid || check.normalizedNumber === undefined) {
      setValidationError(check.errorMessage || 'Некоректне значення кількості блоків (UC6).');
      return;
    }

    const updated = raidTargets.map((t) =>
      t.structureId === structureId ? { ...t, blocks: check.normalizedNumber! } : t
    );
    setRaidTargets(updated);
    const calcRes = calculator.calculate(updated);
    setSessionState('ReportReady');
    setResult(calcRes);
  };

  const handleRemoveTarget = (structureId: string) => {
    const updated = raidTargets.filter((t) => t.structureId !== structureId);
    setRaidTargets(updated);
    if (updated.length > 0) {
      const calcRes = calculator.calculate(updated);
      setSessionState('ReportReady');
      setResult(calcRes);
    } else {
      setSessionState('InputtingParameters');
    }
  };

  const selectedMethodSummary =
    result.methods?.find((m) => m.methodId === activeMethodTab) || result.recommendedMethod;

  return (
    <div className="space-y-6">
      {/* Заголовок та етапи сесії розрахунку рейду */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Калькулятор Вибухівки та Сировини для Рейду
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Варіант використання UC5: Спочатку визначається комплекс вибухівки, потім базова
            сировина (сірка, порох, вугілля, метал, паливо)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono tabular-nums">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Час обчислення C#/.NET алгоритму: {result.executionTimeMs || 0.12} мс</span>
        </div>
      </div>

      {/* Індикатор поточного стану об'єкта «Сесія розрахунку рейду» */}
      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-orange-500" />
          Стан сесії розрахунку:
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {SESSION_STATE_STEPS.map((st, idx) => {
            const isCurrent = sessionState === st.id;
            const isPassed =
              sessionState === 'ReportReady' ||
              (sessionState === 'ValidatingData' && idx <= 1);
            return (
              <React.Fragment key={st.id}>
                <span
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    isCurrent
                      ? 'bg-orange-600 text-white'
                      : isPassed
                        ? 'bg-zinc-800 text-emerald-400'
                        : 'text-zinc-500'
                  }`}
                >
                  {st.label}
                </span>
                {idx < SESSION_STATE_STEPS.length - 1 && (
                  <span className="text-zinc-600" aria-hidden="true">
                    &rarr;
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {userRole === 'novice' && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-300 space-y-1">
              <div className="font-semibold text-amber-300">
                Активна роль: «Гравець-початківець»
              </div>
              <p className="text-zinc-400">
                Калькулятор рейду (UC5) у діаграмі варіантів використання призначений для ролі
                «Досвідчений гравець». Перемкніть роль для повного досвіду або скористайтеся
                розрахунком нижче.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUpgradeRole}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
          >
            Перемкнути на «Досвідчений гравець»
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ліва колонка: RaidScreen <<Boundary>> — вибір споруд, матеріалу та кількості блоків */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-zinc-100">
            1. Цілі рейду (Споруди та Двері)
          </h2>

          <form onSubmit={handleAddTarget} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="raid-structure-select"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Тип споруди та матеріал (StructureType)
              </label>
              <select
                id="raid-structure-select"
                value={selectedStructureId}
                onChange={(e) => {
                  setSelectedStructureId(e.target.value);
                  setSessionState('InputtingParameters');
                }}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-orange-500 min-h-[44px]"
              >
                {structures.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} [{st.material} · {st.hp} HP]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="raid-blocks-input"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Кількість об’єктів / стін (1–500)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="raid-blocks-input"
                  type="number"
                  value={blocksInput}
                  onChange={(e) => {
                    setBlocksInput(e.target.value);
                    setSessionState('InputtingParameters');
                  }}
                  className="w-32 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-orange-500 min-h-[44px]"
                />
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  Додати до розрахунку (UC5)
                </button>
              </div>
            </div>

            {validationError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/70 flex items-center gap-2.5 text-xs text-red-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>Помилка валідації (UC6): {validationError}</span>
              </div>
            )}
          </form>

          {/* Список обраних цілей */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Обрані перешкоди ({raidTargets.length})</span>
              <span className="font-mono tabular-nums text-zinc-300">
                Сумарний запас міцності: {(result.totalHp || 0).toLocaleString('uk-UA')} HP
              </span>
            </div>

            {raidTargets.length === 0 ? (
              <div className="p-6 text-center rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400">
                Список перешкод порожній. Додайте двері або стіни вище для розрахунку вибухівки.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800 bg-zinc-950/60">
                {raidTargets.map((item) => {
                  const st = structures.find((s) => s.id === item.structureId);
                  if (!st) return null;
                  return (
                    <div
                      key={item.structureId}
                      className="p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-100">{st.name}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {st.material} · {st.hp} HP/од. · Рекомендовано: {st.optimalCombo.description}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label htmlFor={`raid-qty-${st.id}`} className="sr-only">
                          Кількість для {st.name}
                        </label>
                        <input
                          id={`raid-qty-${st.id}`}
                          type="number"
                          min={1}
                          max={500}
                          value={item.blocks}
                          onChange={(e) => handleUpdateTargetCount(st.id, e.target.value)}
                          className="w-16 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-md text-xs text-right font-mono tabular-nums text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTarget(st.id)}
                          aria-label={`Видалити ${st.name} з рейду`}
                          className="p-2 text-zinc-400 hover:text-red-400 rounded-md hover:bg-zinc-900 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Права колонка: Підсумковий звіт рейду (Комплекс вибухівки + Базова сировина) */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          {raidTargets.length === 0 || !selectedMethodSummary ? (
            <div className="p-8 text-center text-sm text-zinc-400">
              Оберіть хоча б одну споруду або двері ліворуч, щоб побачити необхідну кількість
              вибухівки та сірки.
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-lg font-bold text-zinc-100">
                    2. Підсумковий план рейду (CalculationResult)
                  </h2>
                  <p className="text-xs text-emerald-400 mt-0.5">{result.reportText}</p>
                </div>
                <Flame className="w-6 h-6 text-orange-500 shrink-0" />
              </div>

              {/* Перемикач методу рейду */}
              <div className="flex flex-wrap gap-1.5">
                {result.methods.map((m) => (
                  <button
                    key={m.methodId}
                    type="button"
                    onClick={() => setActiveMethodTab(m.methodId)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                      activeMethodTab === m.methodId
                        ? 'bg-orange-600 text-white font-semibold'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {m.methodName} ({m.rawResources.sulfur.toLocaleString('uk-UA')} сірки)
                  </button>
                ))}
              </div>

              {/* Етап 1: Комплекс вибухівки (computeExplosives) */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-300">
                  Етап 1 (computeExplosives): Необхідний комплекс вибухівки для обраного способу
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedMethodSummary.explosiveCounts.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between"
                    >
                      <span className="text-xs text-zinc-300 font-medium">{exp.name}</span>
                      <span className="text-xl font-bold text-orange-400 font-mono tabular-nums">
                        {exp.count.toLocaleString('uk-UA')} шт.
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Етап 2: Базова сировина для крафту вибухівки (computeRawResources) */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold text-zinc-300">
                  Етап 2 (computeRawResources): Потреба базової сировини для крафту
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-xs text-zinc-400">Сірка (Sulfur)</div>
                    <div className="text-lg font-bold text-amber-400 font-mono tabular-nums mt-1">
                      {selectedMethodSummary.rawResources.sulfur.toLocaleString('uk-UA')}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-xs text-zinc-400">Порох (Gunpowder)</div>
                    <div className="text-lg font-bold text-zinc-100 font-mono tabular-nums mt-1">
                      {selectedMethodSummary.rawResources.gunpowder.toLocaleString('uk-UA')}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-xs text-zinc-400">Деревне вугілля (Charcoal)</div>
                    <div className="text-lg font-bold text-zinc-100 font-mono tabular-nums mt-1">
                      {selectedMethodSummary.rawResources.charcoal.toLocaleString('uk-UA')}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-xs text-zinc-400">Фрагменти металу</div>
                    <div className="text-lg font-bold text-zinc-100 font-mono tabular-nums mt-1">
                      {selectedMethodSummary.rawResources.metalFragments.toLocaleString('uk-UA')}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-xs text-zinc-400">Паливо (Low Grade Fuel)</div>
                    <div className="text-lg font-bold text-zinc-100 font-mono tabular-nums mt-1">
                      {selectedMethodSummary.rawResources.lowGradeFuel.toLocaleString('uk-UA')}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-xs text-zinc-400">Додаткові компоненти</div>
                    <div className="text-xs font-semibold text-zinc-200 font-mono tabular-nums mt-1.5">
                      {selectedMethodSummary.rawResources.techTrash > 0 &&
                        `${selectedMethodSummary.rawResources.techTrash} Tech Trash `}
                      {selectedMethodSummary.rawResources.metalPipes > 0 &&
                        `${selectedMethodSummary.rawResources.metalPipes} Труб `}
                      {selectedMethodSummary.rawResources.rope > 0 &&
                        `${selectedMethodSummary.rawResources.rope} Мотузок `}
                      {selectedMethodSummary.rawResources.techTrash === 0 &&
                        selectedMethodSummary.rawResources.metalPipes === 0 &&
                        selectedMethodSummary.rawResources.rope === 0 &&
                        'Без рідкісних комп.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Порівняльна таблиця всіх методів рейду */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold text-zinc-300">
                  Порівняльна таблиця всіх способів пробиття
                </h3>
                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                        <th className="py-2.5 px-3 font-medium">Спосіб рейду</th>
                        <th className="py-2.5 px-3 font-medium">Вибухівка</th>
                        <th className="py-2.5 px-3 font-medium text-right">Сірка</th>
                        <th className="py-2.5 px-3 font-medium text-right">Вугілля</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70">
                      {result.methods.map((m) => (
                        <tr
                          key={m.methodId}
                          onClick={() => setActiveMethodTab(m.methodId)}
                          className={`cursor-pointer transition-colors ${
                            activeMethodTab === m.methodId
                              ? 'bg-orange-950/25'
                              : 'hover:bg-zinc-800/40'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-medium text-zinc-100">
                            {m.methodName}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300 font-mono tabular-nums">
                            {m.explosiveCounts.map((e) => `${e.count}x ${e.name.split(' ')[0]}`).join(' + ')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-amber-400">
                            {m.rawResources.sulfur.toLocaleString('uk-UA')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-zinc-300">
                            {m.rawResources.charcoal.toLocaleString('uk-UA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
