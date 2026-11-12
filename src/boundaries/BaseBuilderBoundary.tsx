import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Home,
  Lock,
  Layers,
} from 'lucide-react';
import { IBaseDesignBlueprint } from '../entities/models';
import { SEED_BASE_BLUEPRINTS } from '../entities/seedData';
import { BaseReliabilityAnalyzer } from '../control/Calculators';

interface BaseBuilderBoundaryProps {
  analyzer: BaseReliabilityAnalyzer;
}

export const BaseBuilderBoundary: React.FC<BaseBuilderBoundaryProps> = ({ analyzer }) => {
  // Налаштування конструкції бази для аудиту надійності
  const [sheetDoorsCount, setSheetDoorsCount] = useState<number>(2);
  const [garageDoorsCount, setGarageDoorsCount] = useState<number>(3);
  const [armoredDoorsCount, setArmoredDoorsCount] = useState<number>(0);

  const [stoneWallsCount, setStoneWallsCount] = useState<number>(1);
  const [metalWallsCount, setMetalWallsCount] = useState<number>(1);
  const [armoredWallsCount, setArmoredWallsCount] = useState<number>(0);

  const [hasBunker, setHasBunker] = useState<boolean>(false);
  const [hasExternalTc, setHasExternalTc] = useState<boolean>(true);
  const [autoTurretsCount, setAutoTurretsCount] = useState<number>(2);

  const [selectedBlueprint, setSelectedBlueprint] = useState<IBaseDesignBlueprint>(
    SEED_BASE_BLUEPRINTS[0]
  );

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

  const handleLoadBlueprintPreset = (bp: IBaseDesignBlueprint) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Перевірка Надійності Побудови Баз та Схеми Конструкцій
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Аудит балансу між коридором дверей і стінами (Honeycomb), розрахунок мінімального
            порогу сірки до Шафи (TC) та готові схеми баз
          </p>
        </div>
      </div>

      {/* Верхній блок: Готові конструкції баз зі сховища схем */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <Home className="w-4 h-4 text-orange-500" />
          Еталонні конструкції баз (Натисніть, щоб завантажити параметри в аналізатор)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SEED_BASE_BLUEPRINTS.map((bp) => {
            const isSelected = selectedBlueprint.id === bp.id;
            return (
              <button
                key={bp.id}
                type="button"
                onClick={() => handleLoadBlueprintPreset(bp)}
                className={`text-left p-5 rounded-xl border transition-colors flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'bg-orange-950/25 border-orange-500/80'
                    : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="text-xs text-zinc-400">
                    {bp.groupSize} · Формат: {bp.footprint}
                  </div>
                  <h3 className="text-base font-bold text-zinc-100">{bp.name}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{bp.description}</p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
                  <div>
                    <span className="text-zinc-500 block">Будівництво:</span>
                    <span className="text-zinc-200">
                      {(bp.buildCost.stone / 1000).toFixed(1)}k Каменю ·{' '}
                      {(bp.buildCost.metalFragments / 1000).toFixed(1)}k Мет.
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Податок (24г):</span>
                    <span className="text-orange-400">
                      {bp.upkeep24h.stone} Кам. · {bp.upkeep24h.metalFragments} Мет.
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Основний інтерактивний аналізатор надійності побудови бази */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ліва частина: Конфігуратор шарів захисту бази */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-zinc-100">
            1. Налаштування шарів захисту вашої бази
          </h2>

          {/* Вектор A: Коридор дверей до TC */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-400" />
              Вектор А: Кількість дверей від входу до головної Шафи (TC)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <label
                  htmlFor="audit-sheet-doors"
                  className="block text-xs text-zinc-400 mb-1.5"
                >
                  Металеві двері (250 HP)
                </label>
                <input
                  id="audit-sheet-doors"
                  type="number"
                  min={0}
                  max={20}
                  value={sheetDoorsCount}
                  onChange={(e) => setSheetDoorsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm font-mono tabular-nums text-zinc-100"
                />
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <label
                  htmlFor="audit-garage-doors"
                  className="block text-xs text-zinc-400 mb-1.5"
                >
                  Гаражні двері (600 HP)
                </label>
                <input
                  id="audit-garage-doors"
                  type="number"
                  min={0}
                  max={25}
                  value={garageDoorsCount}
                  onChange={(e) => setGarageDoorsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm font-mono tabular-nums text-zinc-100"
                />
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <label
                  htmlFor="audit-armored-doors"
                  className="block text-xs text-zinc-400 mb-1.5"
                >
                  Броньовані двері (1000 HP)
                </label>
                <input
                  id="audit-armored-doors"
                  type="number"
                  min={0}
                  max={20}
                  value={armoredDoorsCount}
                  onChange={(e) => setArmoredDoorsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm font-mono tabular-nums text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Вектор Б: Стіни та соти (Honeycomb) */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              Вектор Б: Кількість стін / сотів по найкоротшій прямій до Ядра (Core)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <label htmlFor="audit-stone-walls" className="block text-xs text-zinc-400 mb-1.5">
                  Кам’яні стіни (500 HP)
                </label>
                <input
                  id="audit-stone-walls"
                  type="number"
                  min={0}
                  max={10}
                  value={stoneWallsCount}
                  onChange={(e) => setStoneWallsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm font-mono tabular-nums text-zinc-100"
                />
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <label htmlFor="audit-metal-walls" className="block text-xs text-zinc-400 mb-1.5">
                  Металеві стіни (1000 HP)
                </label>
                <input
                  id="audit-metal-walls"
                  type="number"
                  min={0}
                  max={10}
                  value={metalWallsCount}
                  onChange={(e) => setMetalWallsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm font-mono tabular-nums text-zinc-100"
                />
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <label
                  htmlFor="audit-armored-walls"
                  className="block text-xs text-zinc-400 mb-1.5"
                >
                  МВК стіни (2000 HP)
                </label>
                <input
                  id="audit-armored-walls"
                  type="number"
                  min={0}
                  max={10}
                  value={armoredWallsCount}
                  onChange={(e) => setArmoredWallsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm font-mono tabular-nums text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Додаткові інженерні механізми захисту */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-300">
              Інженерні механізми захисту бази
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setHasBunker((v) => !v)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  hasBunker
                    ? 'bg-emerald-950/40 border-emerald-600 text-emerald-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="text-xs font-semibold">Бункер стабільності</div>
                <div className="text-[11px] mt-1">
                  {hasBunker ? 'Увімкнено (+8 250 сірки до дверей)' : 'Вимкнено'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setHasExternalTc((v) => !v)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  hasExternalTc
                    ? 'bg-emerald-950/40 border-emerald-600 text-emerald-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="text-xs font-semibold">Зовнішні шафи (Ext. TC)</div>
                <div className="text-[11px] mt-1">
                  {hasExternalTc ? 'Захист від запечатування' : 'Немає зовнішніх TC'}
                </div>
              </button>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <label htmlFor="audit-turrets-count" className="block text-xs text-zinc-400 mb-1">
                  Автотурелі (шт.)
                </label>
                <input
                  id="audit-turrets-count"
                  type="number"
                  min={0}
                  max={24}
                  value={autoTurretsCount}
                  onChange={(e) => setAutoTurretsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-md text-xs font-mono tabular-nums text-zinc-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Права частина: Результат перевірки надійності та рекомендації */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-zinc-100">
                2. Висновок аудиту надійності бази
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Клас захисту: <span className="text-zinc-200 font-medium">{audit.securityGrade}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400">Індекс надійності</div>
              <div className="text-2xl font-bold text-orange-400 font-mono tabular-nums">
                {audit.ratingScore} / 100
              </div>
            </div>
          </div>

          {/* Порівняння вартості пробиття через двері та через стіни */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400">Рейд по дверях</div>
              <div className="text-lg font-bold text-zinc-100 font-mono tabular-nums mt-1">
                {audit.doorPathSulfur.toLocaleString('uk-UA')}{' '}
                <span className="text-xs font-normal text-zinc-400">сірки</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400">Рейд через стіни</div>
              <div className="text-lg font-bold text-zinc-100 font-mono tabular-nums mt-1">
                {audit.wallPathSulfur.toLocaleString('uk-UA')}{' '}
                <span className="text-xs font-normal text-zinc-400">сірки</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-orange-950/30 border border-orange-500/60">
              <div className="text-xs text-orange-300">Мін. поріг рейду</div>
              <div className="text-lg font-bold text-orange-400 font-mono tabular-nums mt-1">
                {audit.effectiveMinSulfur.toLocaleString('uk-UA')}{' '}
                <span className="text-xs font-normal text-orange-300">сірки</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {audit.weakestVector === 'Збалансовано' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <div className="text-xs text-zinc-400">Найбільш вразливе місце конструкції:</div>
                <div className="text-sm font-semibold text-zinc-100 mt-0.5">
                  {audit.weakestVector}
                </div>
              </div>
            </div>
            <ShieldCheck className="w-6 h-6 text-zinc-600 shrink-0" />
          </div>

          {/* Інженерні рекомендації щодо усунення вразливостей */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-zinc-300">
              Інженерні рекомендації для підвищення стійкості до рейду:
            </h3>
            <ul className="space-y-2">
              {audit.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/90 text-xs text-zinc-300 leading-relaxed"
                >
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
