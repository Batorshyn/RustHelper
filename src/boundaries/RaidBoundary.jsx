import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, Minus, Flame } from 'lucide-react';

const RAID_PRESETS = [
  {
    id: 'starter_2x1',
    label: 'Стартова 2x1',
    targets: [
      { structureId: 'sheet_metal_door', blocks: 2 },
      { structureId: 'stone_wall', blocks: 1 },
    ],
  },
  {
    id: 'garage_corridor',
    label: 'Гаражний коридор',
    targets: [
      { structureId: 'sheet_metal_door', blocks: 2 },
      { structureId: 'garage_door', blocks: 3 },
      { structureId: 'armored_door', blocks: 1 },
    ],
  },
  {
    id: 'clan_compound',
    label: 'Клановий компаунд',
    targets: [
      { structureId: 'high_external_stone_wall', blocks: 1 },
      { structureId: 'metal_wall', blocks: 2 },
      { structureId: 'auto_turret', blocks: 2 },
    ],
  },
];

export const RaidBoundary = ({ structures, calculator, initialStructureId }) => {
  const [selectedStructureId, setSelectedStructureId] = useState(
    initialStructureId || structures[1]?.id || 'sheet_metal_door'
  );
  const [blocksInput, setBlocksInput] = useState('2');
  const [activeMethodTab, setActiveMethodTab] = useState('optimal');

  const [raidTargets, setRaidTargets] = useState([
    { structureId: 'sheet_metal_door', blocks: 2 },
    { structureId: 'garage_door', blocks: 2 },
    { structureId: 'stone_wall', blocks: 1 },
  ]);

  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (initialStructureId) {
      setSelectedStructureId(initialStructureId);
    }
  }, [initialStructureId]);

  const result = raidTargets.length > 0 ? calculator.calculate(raidTargets) : null;

  const handleAddTarget = (e) => {
    e.preventDefault();
    setValidationError(null);

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
  };

  const handleStepBlocks = (structureId, delta) => {
    setValidationError(null);
    const updated = raidTargets
      .map((t) => (t.structureId === structureId ? { ...t, blocks: t.blocks + delta } : t))
      .filter((t) => t.blocks > 0);
    setRaidTargets(updated);
  };

  const handleUpdateTargetCount = (structureId, rawVal) => {
    setValidationError(null);
    const check = calculator.checkInput(rawVal, 1, 500);
    if (!check.isValid || check.normalizedNumber === undefined) {
      setValidationError(check.errorMessage || 'Введіть ціле число від 1 до 500.');
      return;
    }
    setRaidTargets(
      raidTargets.map((t) =>
        t.structureId === structureId ? { ...t, blocks: check.normalizedNumber } : t
      )
    );
  };

  const selectedMethodSummary =
    result?.methods?.find((m) => m.methodId === activeMethodTab) || result?.recommendedMethod;

  const minSulfur = result?.recommendedMethod?.rawResources.sulfur || 0;

  return (
    <div className="flex flex-col min-h-full">
      {/* Паттерн "Structured Templates + Cloze Target Formula" */}
      <div className="px-5 sm:px-7 py-4 border-b border-[#262b33] bg-[#111316] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#f1f3f5] font-display">
              Калькулятор вибухівки та сірки
            </h1>
            <p className="text-xs text-[#8c94a0]">
              Порівняння варіантів пробиття та точний розрахунок сировини для крафту
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-[#7b8391] mr-1">Типові рейди:</span>
            {RAID_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setRaidTargets(preset.targets);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-[#181c22] hover:bg-[#21262e] border border-[#2a303a] text-[#d0d5dd] rounded-[3px] transition-colors whitespace-nowrap"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleAddTarget}
          noValidate
          className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[#1e2229]"
        >
          <span className="text-xs text-[#8c94a0]">Зруйнувати</span>

          <label htmlFor="raid-blocks-input" className="sr-only">
            Кількість блоків
          </label>
          <input
            id="raid-blocks-input"
            type="number"
            value={blocksInput}
            onChange={(e) => setBlocksInput(e.target.value)}
            className="w-20 px-2.5 py-1.5 bg-[#16191e] border border-[#2e3440] rounded-[3px] text-sm font-mono tabular-nums text-[#f1f3f5] focus:outline-none focus:border-[#cd412b] min-h-[38px]"
          />

          <span className="text-xs text-[#8c94a0]">×</span>

          <label htmlFor="raid-structure-select" className="sr-only">
            Тип перешкоди
          </label>
          <select
            id="raid-structure-select"
            value={selectedStructureId}
            onChange={(e) => setSelectedStructureId(e.target.value)}
            className="min-w-[240px] flex-1 sm:flex-initial px-3 py-1.5 bg-[#16191e] border border-[#2e3440] rounded-[3px] text-sm text-[#f1f3f5] focus:outline-none focus:border-[#cd412b] min-h-[38px]"
          >
            {structures.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} · {st.hp} HP
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-1.5 bg-[#cd412b] hover:bg-[#de4b34] text-white text-xs font-semibold rounded-[3px] transition-colors flex items-center gap-1.5 min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            Додати ціль
          </button>
        </form>

        {validationError && (
          <div
            role="alert"
            className="px-3.5 py-2 bg-red-950/40 border border-red-800/70 rounded-[3px] flex items-center gap-2 text-xs text-red-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Робоча область: Зліва перешкоди, Справа матриця способів та сировина */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* Список обраних цілей */}
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#262b33] flex flex-col">
          <div className="px-5 py-3 border-b border-[#20242b] flex items-center justify-between text-xs text-[#8c94a0]">
            <span>Перешкоди на шляху ({raidTargets.length})</span>
            <span className="font-mono tabular-nums text-[#d0d5dd]">
              {(result?.totalHp || 0).toLocaleString('uk-UA')} HP
            </span>
          </div>

          {raidTargets.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#7b8391]">
              Оберіть двері, стіни чи турелі зверху або скористайтеся шаблоном рейду.
            </div>
          ) : (
            <div className="divide-y divide-[#1e2229]">
              {raidTargets.map((item) => {
                const st = structures.find((s) => s.id === item.structureId);
                if (!st) return null;
                return (
                  <div
                    key={item.structureId}
                    className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:bg-[#13161a]"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#e6e8eb] leading-snug">{st.name}</div>
                      <div className="text-[11px] text-[#7b8391] mt-0.5 leading-relaxed">
                        {st.material} · {st.hp} HP · {st.optimalCombo.description}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStepBlocks(st.id, -1)}
                        aria-label={`Зменшити кількість ${st.name}`}
                        className="w-7 h-7 flex items-center justify-center bg-[#16191e] border border-[#2a303a] rounded-[2px] text-[#8c94a0] hover:text-[#e6e8eb]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={item.blocks}
                        onChange={(e) => handleUpdateTargetCount(st.id, e.target.value)}
                        aria-label={`Кількість ${st.name}`}
                        className="w-14 px-2 py-1 bg-[#16191e] border border-[#2a303a] rounded-[2px] text-xs text-right font-mono tabular-nums text-[#f1f3f5]"
                      />
                      <button
                        type="button"
                        onClick={() => handleStepBlocks(st.id, 1)}
                        aria-label={`Збільшити кількість ${st.name}`}
                        className="w-7 h-7 flex items-center justify-center bg-[#16191e] border border-[#2a303a] rounded-[2px] text-[#8c94a0] hover:text-[#e6e8eb]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setRaidTargets(raidTargets.filter((t) => t.structureId !== st.id))
                        }
                        aria-label={`Видалити ${st.name}`}
                        className="ml-1 p-1.5 text-[#7b8391] hover:text-red-400 transition-colors"
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

        {/* Матриця порівняння способів (Result Variations) + Сировина */}
        <div className="lg:col-span-7 p-5 sm:p-7 space-y-6 bg-[#0e1012]">
          {!result || !result.isValid || !selectedMethodSummary ? (
            <div className="py-12 text-center text-sm text-[#7b8391]">
              Додайте хоча б одну ціль ліворуч для розрахунку вибухівки.
            </div>
          ) : (
            <>
              {/* Головна таблиця порівняння способів */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
                  <h2 className="text-lg font-bold text-[#f1f3f5] font-display flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#cd412b]" />
                    Порівняння варіантів рейду
                  </h2>
                  <span className="text-xs text-[#8c94a0]">
                    Оберіть рядок для перегляду сировини
                  </span>
                </div>

                <div className="overflow-x-auto border border-[#262b33] rounded-[3px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#15181c] text-[#8c94a0] border-b border-[#262b33]">
                        <th className="py-2.5 px-3 font-medium">Спосіб</th>
                        <th className="py-2.5 px-3 font-medium">Комплект вибухівки</th>
                        <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">Верстак</th>
                        <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">Сірка</th>
                        <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">Переплата</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2229]">
                      {result.methods.map((m) => {
                        const isSelected = selectedMethodSummary.methodId === m.methodId;
                        const delta = m.rawResources.sulfur - minSulfur;
                        return (
                          <tr
                            key={m.methodId}
                            onClick={() => setActiveMethodTab(m.methodId)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-[#1c2026]' : 'hover:bg-[#14171b]'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-medium text-[#e6e8eb] whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setActiveMethodTab(m.methodId)}
                                className="text-left inline-flex items-center focus:outline-none"
                              >
                                <span
                                  className={`inline-block w-1.5 h-3.5 mr-2 rounded-[1px] ${
                                    isSelected ? 'bg-[#cd412b]' : 'bg-transparent'
                                  }`}
                                />
                                {m.methodName}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-[#cfd4dc] font-mono tabular-nums">
                              {m.explosiveCounts
                                .map((e) => `${e.count}× ${e.name.split(' (')[0]}`)
                                .join(' + ')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#8c94a0]">
                              Lv.{m.workbenchLevel}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#eab308]">
                              {m.rawResources.sulfur.toLocaleString('uk-UA')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8c94a0]">
                              {delta === 0 ? 'Мінімум' : `+${delta.toLocaleString('uk-UA')}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Детальна відомість ресурсів для обраного способу */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#e6e8eb] font-display">
                    Необхідна сировина: {selectedMethodSummary.methodName}
                  </h3>
                  <span className="text-xs font-mono tabular-nums text-[#eab308]">
                    {selectedMethodSummary.explosiveCounts
                      .map((e) => `${e.count}× ${e.name.split(' (')[0]}`)
                      .join(' + ')}
                  </span>
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-3 border border-[#262b33] divide-y sm:divide-y-0 sm:divide-x divide-[#262b33] bg-[#13161a] rounded-[3px]">
                  <div className="px-4 py-3">
                    <dt className="text-[11px] text-[#8c94a0]">Сірка (Sulfur)</dt>
                    <dd className="text-xl font-bold text-[#eab308] font-mono tabular-nums mt-0.5">
                      {selectedMethodSummary.rawResources.sulfur.toLocaleString('uk-UA')}
                    </dd>
                  </div>
                  <div className="px-4 py-3">
                    <dt className="text-[11px] text-[#8c94a0]">Порох (Gunpowder)</dt>
                    <dd className="text-xl font-bold text-[#f1f3f5] font-mono tabular-nums mt-0.5">
                      {selectedMethodSummary.rawResources.gunpowder.toLocaleString('uk-UA')}
                    </dd>
                  </div>
                  <div className="px-4 py-3">
                    <dt className="text-[11px] text-[#8c94a0]">Вугілля (Charcoal)</dt>
                    <dd className="text-xl font-bold text-[#f1f3f5] font-mono tabular-nums mt-0.5">
                      {selectedMethodSummary.rawResources.charcoal.toLocaleString('uk-UA')}
                    </dd>
                  </div>
                </dl>

                <dl className="grid grid-cols-2 sm:grid-cols-4 border border-[#262b33] divide-y sm:divide-y-0 sm:divide-x divide-[#262b33] bg-[#13161a] rounded-[3px]">
                  <div className="px-3.5 py-2.5">
                    <dt className="text-[11px] text-[#8c94a0]">Фрагменти металу</dt>
                    <dd className="text-sm font-semibold text-[#e6e8eb] font-mono tabular-nums mt-0.5">
                      {selectedMethodSummary.rawResources.metalFragments.toLocaleString('uk-UA')}
                    </dd>
                  </div>
                  <div className="px-3.5 py-2.5">
                    <dt className="text-[11px] text-[#8c94a0]">Паливо (LGF)</dt>
                    <dd className="text-sm font-semibold text-[#e6e8eb] font-mono tabular-nums mt-0.5">
                      {selectedMethodSummary.rawResources.lowGradeFuel.toLocaleString('uk-UA')}
                    </dd>
                  </div>
                  <div className="px-3.5 py-2.5">
                    <dt className="text-[11px] text-[#8c94a0]">Tech Trash / Труби</dt>
                    <dd className="text-sm font-semibold text-[#e6e8eb] font-mono tabular-nums mt-0.5">
                      {selectedMethodSummary.rawResources.techTrash} TT ·{' '}
                      {selectedMethodSummary.rawResources.metalPipes} тр.
                    </dd>
                  </div>
                  <div className="px-3.5 py-2.5">
                    <dt className="text-[11px] text-[#8c94a0]">Тканина / Мотузка</dt>
                    <dd className="text-sm font-semibold text-[#e6e8eb] font-mono tabular-nums mt-0.5">
                      {selectedMethodSummary.rawResources.cloth} тк. ·{' '}
                      {selectedMethodSummary.rawResources.rope} мот.
                    </dd>
                  </div>
                </dl>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
