import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SEED_BASE_BLUEPRINTS } from '../entities/seedData.js';

export const BaseBuilderBoundary = ({ analyzer }) => {
  const [sheetDoorsCount, setSheetDoorsCount] = useState(2);
  const [garageDoorsCount, setGarageDoorsCount] = useState(3);
  const [armoredDoorsCount, setArmoredDoorsCount] = useState(0);

  const [stoneWallsCount, setStoneWallsCount] = useState(1);
  const [metalWallsCount, setMetalWallsCount] = useState(1);
  const [armoredWallsCount, setArmoredWallsCount] = useState(0);

  const [hasBunker, setHasBunker] = useState(false);
  const [hasExternalTc, setHasExternalTc] = useState(true);
  const [autoTurretsCount, setAutoTurretsCount] = useState(2);

  const [selectedBlueprint, setSelectedBlueprint] = useState(SEED_BASE_BLUEPRINTS[0]);

  const audit = analyzer.auditBaseConfiguration({
    doorSegments: [
      { structureId: 'sheet_metal_door', count: sheetDoorsCount },
      { structureId: 'garage_door', count: garageDoorsCount },
      { structureId: 'armored_door', count: armoredDoorsCount },
    ],
    wallSegments: [
      { structureId: 'stone_wall', count: stoneWallsCount },
      { structureId: 'metal_wall', count: metalWallsCount },
      { structureId: 'armored_wall', count: armoredWallsCount },
    ],
    hasBunker,
    hasExternalTc,
    autoTurretsCount,
  });

  const handleLoadBlueprintPreset = (bp) => {
    setSelectedBlueprint(bp);
    if (bp.id === 'solo_duo_2x1_honeycomb') {
      setSheetDoorsCount(2);
      setGarageDoorsCount(3);
      setArmoredDoorsCount(0);
      setStoneWallsCount(1);
      setMetalWallsCount(1);
      setArmoredWallsCount(0);
      setHasBunker(false);
      setHasExternalTc(false);
      setAutoTurretsCount(1);
    } else if (bp.id === 'bunker_2x2_stability') {
      setSheetDoorsCount(1);
      setGarageDoorsCount(3);
      setArmoredDoorsCount(1);
      setStoneWallsCount(1);
      setMetalWallsCount(0);
      setArmoredWallsCount(1);
      setHasBunker(true);
      setHasExternalTc(true);
      setAutoTurretsCount(4);
    } else {
      setSheetDoorsCount(0);
      setGarageDoorsCount(4);
      setArmoredDoorsCount(3);
      setStoneWallsCount(1);
      setMetalWallsCount(2);
      setArmoredWallsCount(1);
      setHasBunker(true);
      setHasExternalTc(true);
      setAutoTurretsCount(9);
    }
  };

  const maxVectorSulfur = Math.max(audit.doorPathSulfur, audit.wallPathSulfur, 1);
  const doorPct = Math.round((audit.doorPathSulfur / maxVectorSulfur) * 100);
  const wallPct = Math.round((audit.wallPathSulfur / maxVectorSulfur) * 100);

  return (
    <div className="flex flex-col min-h-full">
      {/* Верхня панель вибору еталонного креслення */}
      <div className="px-5 sm:px-7 py-4 border-b border-[#262b33] bg-[#111316] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#f1f3f5] font-display">
              Аудит надійності бази
            </h1>
            <p className="text-xs text-[#8c94a0]">
              Перевірка балансу між коридором дверей та стінами (Honeycomb) і пошук дешевого шляху до TC
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border border-[#262b33] divide-y md:divide-y-0 md:divide-x divide-[#262b33] rounded-[3px] bg-[#15181c]">
          {SEED_BASE_BLUEPRINTS.map((bp) => {
            const isSelected = selectedBlueprint.id === bp.id;
            return (
              <button
                key={bp.id}
                type="button"
                onClick={() => handleLoadBlueprintPreset(bp)}
                className={`text-left px-4 py-3 transition-colors ${
                  isSelected ? 'bg-[#1c2026]' : 'hover:bg-[#181c21]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-[#8c94a0]">
                  <span>{bp.groupSize}</span>
                  <span className="font-mono text-[#e6e8eb]">{bp.footprint}</span>
                </div>
                <div
                  className={`text-sm font-semibold mt-1 ${
                    isSelected ? 'text-[#cd412b]' : 'text-[#e6e8eb]'
                  }`}
                >
                  {bp.name}
                </div>
                <div className="text-[11px] font-mono tabular-nums text-[#7b8391] mt-1">
                  Upkeep/24г: {bp.upkeep24h.stone} Кам. · {bp.upkeep24h.metalFragments} Мет. ·{' '}
                  {bp.upkeep24h.highQualityMetal} МВК
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Розділена сітка параметрів і висновку */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* Конфігуратор перешкод */}
        <div className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-[#262b33] p-5 sm:p-7 space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#e6e8eb]">
              Коридор дверей до головної шафи (TC)
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="audit-sheet-doors" className="block text-xs text-[#8c94a0] mb-1">
                  Металеві (250 HP)
                </label>
                <input
                  id="audit-sheet-doors"
                  type="number"
                  min={0}
                  max={20}
                  value={sheetDoorsCount}
                  onChange={(e) => setSheetDoorsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[#15181c] border border-[#2a303a] rounded-[3px] text-sm font-mono tabular-nums text-[#f1f3f5]"
                />
              </div>
              <div>
                <label htmlFor="audit-garage-doors" className="block text-xs text-[#8c94a0] mb-1">
                  Гаражні (600 HP)
                </label>
                <input
                  id="audit-garage-doors"
                  type="number"
                  min={0}
                  max={25}
                  value={garageDoorsCount}
                  onChange={(e) => setGarageDoorsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[#15181c] border border-[#2a303a] rounded-[3px] text-sm font-mono tabular-nums text-[#f1f3f5]"
                />
              </div>
              <div>
                <label htmlFor="audit-armored-doors" className="block text-xs text-[#8c94a0] mb-1">
                  Броньовані (1000 HP)
                </label>
                <input
                  id="audit-armored-doors"
                  type="number"
                  min={0}
                  max={20}
                  value={armoredDoorsCount}
                  onChange={(e) => setArmoredDoorsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[#15181c] border border-[#2a303a] rounded-[3px] text-sm font-mono tabular-nums text-[#f1f3f5]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-5 border-t border-[#20242b]">
            <h2 className="text-sm font-semibold text-[#e6e8eb]">
              Шари стін та сотів (найкоротший шлях у ядро)
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="audit-stone-walls" className="block text-xs text-[#8c94a0] mb-1">
                  Кам’яні (500 HP)
                </label>
                <input
                  id="audit-stone-walls"
                  type="number"
                  min={0}
                  max={10}
                  value={stoneWallsCount}
                  onChange={(e) => setStoneWallsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[#15181c] border border-[#2a303a] rounded-[3px] text-sm font-mono tabular-nums text-[#f1f3f5]"
                />
              </div>
              <div>
                <label htmlFor="audit-metal-walls" className="block text-xs text-[#8c94a0] mb-1">
                  Металеві (1000 HP)
                </label>
                <input
                  id="audit-metal-walls"
                  type="number"
                  min={0}
                  max={10}
                  value={metalWallsCount}
                  onChange={(e) => setMetalWallsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[#15181c] border border-[#2a303a] rounded-[3px] text-sm font-mono tabular-nums text-[#f1f3f5]"
                />
              </div>
              <div>
                <label htmlFor="audit-armored-walls" className="block text-xs text-[#8c94a0] mb-1">
                  МВК (2000 HP)
                </label>
                <input
                  id="audit-armored-walls"
                  type="number"
                  min={0}
                  max={10}
                  value={armoredWallsCount}
                  onChange={(e) => setArmoredWallsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[#15181c] border border-[#2a303a] rounded-[3px] text-sm font-mono tabular-nums text-[#f1f3f5]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-5 border-t border-[#20242b]">
            <h2 className="text-sm font-semibold text-[#e6e8eb]">Додаткові заходи оборони</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setHasBunker((v) => !v)}
                className={`px-3.5 py-2.5 rounded-[3px] border text-left transition-colors ${
                  hasBunker
                    ? 'bg-[#15221a] border-emerald-700/70 text-emerald-200'
                    : 'bg-[#15181c] border-[#2a303a] text-[#8c94a0]'
                }`}
              >
                <div className="text-xs font-semibold">Бункер стабільності</div>
                <div className="text-[11px] mt-0.5 font-mono">
                  {hasBunker ? 'Активно (+8 250)' : 'Вимкнено'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setHasExternalTc((v) => !v)}
                className={`px-3.5 py-2.5 rounded-[3px] border text-left transition-colors ${
                  hasExternalTc
                    ? 'bg-[#15221a] border-emerald-700/70 text-emerald-200'
                    : 'bg-[#15181c] border-[#2a303a] text-[#8c94a0]'
                }`}
              >
                <div className="text-xs font-semibold">Зовнішні шафи</div>
                <div className="text-[11px] mt-0.5 font-mono">
                  {hasExternalTc ? 'Встановлено' : 'Відсутні'}
                </div>
              </button>

              <div className="px-3.5 py-2 bg-[#15181c] border border-[#2a303a] rounded-[3px]">
                <label htmlFor="audit-turrets-count" className="block text-[11px] text-[#8c94a0]">
                  Автотурелі (шт.)
                </label>
                <input
                  id="audit-turrets-count"
                  type="number"
                  min={0}
                  max={24}
                  value={autoTurretsCount}
                  onChange={(e) => setAutoTurretsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full mt-0.5 bg-transparent text-sm font-mono tabular-nums text-[#f1f3f5] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Візуальний баланс векторів і рекомендації */}
        <div className="lg:col-span-6 p-5 sm:p-7 space-y-6 bg-[#0e1012]">
          <div className="flex items-center justify-between pb-4 border-b border-[#262b33]">
            <div>
              <div className="text-xs text-[#8c94a0]">Клас стійкості</div>
              <h2 className="text-2xl font-bold text-[#f1f3f5] font-display mt-0.5">
                {audit.securityGrade}
              </h2>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#8c94a0]">Мін. поріг до TC</div>
              <div className="text-2xl font-bold text-[#eab308] font-mono tabular-nums">
                {audit.effectiveMinSulfur.toLocaleString('uk-UA')} сірки
              </div>
            </div>
          </div>

          {/* Візуальна шкала порівняння: Двері vs Стіни */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#cfd4dc]">Шлях через двері</span>
                <span className="font-mono tabular-nums text-[#f1f3f5]">
                  {audit.doorPathSulfur.toLocaleString('uk-UA')} сірки
                </span>
              </div>
              <div className="h-2.5 bg-[#1a1e24] rounded-[2px] overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    audit.weakestVector === 'Коридор дверей' ? 'bg-[#cd412b]' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${doorPct}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#cfd4dc]">Шлях через стіни (Honeycomb)</span>
                <span className="font-mono tabular-nums text-[#f1f3f5]">
                  {audit.wallPathSulfur.toLocaleString('uk-UA')} сірки
                </span>
              </div>
              <div className="h-2.5 bg-[#1a1e24] rounded-[2px] overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    audit.weakestVector === 'Стіни / Соти (Honeycomb)'
                      ? 'bg-[#cd412b]'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${wallPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Діагноз вразливості */}
          <div className="px-4 py-3 bg-[#15181c] border border-[#262b33] rounded-[3px] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {audit.weakestVector === 'Збалансовано' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-[#cd412b] shrink-0" />
              )}
              <div>
                <div className="text-[11px] text-[#8c94a0]">Слабке місце конструкції</div>
                <div className="text-sm font-semibold text-[#f1f3f5]">{audit.weakestVector}</div>
              </div>
            </div>
            <div className="text-right font-mono tabular-nums">
              <span className="text-xs text-[#8c94a0] block">Оцінка</span>
              <span className="text-sm font-bold text-[#e6e8eb]">{audit.ratingScore}/100</span>
            </div>
          </div>

          {/* Список рекомендацій */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-medium text-[#8c94a0] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#8c94a0]" />
              Як посилити базу
            </h3>
            <ul className="divide-y divide-[#1e2229] border border-[#262b33] bg-[#13161a] rounded-[3px]">
              {audit.recommendations.map((rec, idx) => (
                <li key={idx} className="px-4 py-3 text-xs text-[#cfd4dc] leading-relaxed">
                  {idx + 1}. {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
