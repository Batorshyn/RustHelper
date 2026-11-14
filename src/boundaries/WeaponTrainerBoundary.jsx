import React, { useState, useEffect } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { SEED_WEAPONS_TRAINING } from '../entities/seedData.js';

export const WeaponTrainerBoundary = ({ initialWeaponId }) => {
  const [selectedWeapon, setSelectedWeapon] = useState(
    () => SEED_WEAPONS_TRAINING.find((w) => w.id === initialWeaponId) || SEED_WEAPONS_TRAINING[0]
  );
  const [isCrouching, setIsCrouching] = useState(true);
  const [activeShotIndex, setActiveShotIndex] = useState(
    () =>
      (SEED_WEAPONS_TRAINING.find((w) => w.id === initialWeaponId) || SEED_WEAPONS_TRAINING[0])
        .recoilPoints.length
  );

  useEffect(() => {
    if (initialWeaponId) {
      const found = SEED_WEAPONS_TRAINING.find((w) => w.id === initialWeaponId);
      if (found) {
        setSelectedWeapon(found);
        setActiveShotIndex(found.recoilPoints.length);
      }
    }
  }, [initialWeaponId]);

  const handleRunRecoilSim = () => {
    setActiveShotIndex(1);
    let current = 1;
    const total = selectedWeapon.recoilPoints.length;
    const timer = setInterval(() => {
      current += 1;
      if (current >= total) {
        setActiveShotIndex(total);
        clearInterval(timer);
      } else {
        setActiveShotIndex(current);
      }
    }, 85);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-full">
      {/* Список зброї */}
      <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#262b33] divide-y divide-[#1e2229] bg-[#111316]">
        <div className="px-5 py-4 border-b border-[#262b33]">
          <h2 className="text-lg font-bold text-[#f1f3f5] font-display">
            Арсенал і патерни віддачі
          </h2>
          <p className="text-xs text-[#8c94a0] mt-0.5">
            Траєкторія ствола при затисканні черги та порівняння стійки
          </p>
        </div>

        {SEED_WEAPONS_TRAINING.map((w) => {
          const isSelected = selectedWeapon.id === w.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                setSelectedWeapon(w);
                setActiveShotIndex(w.recoilPoints.length);
              }}
              className={`w-full text-left px-5 py-4 transition-colors flex items-center justify-between gap-3 ${
                isSelected ? 'bg-[#191d23]' : 'hover:bg-[#15181c]'
              }`}
            >
              <div>
                <div className="text-[11px] text-[#7b8391] font-mono tabular-nums">
                  {w.tier} · {w.fireRateRpm} RPM · Маг. {w.magazineSize}
                </div>
                <div className="text-sm font-semibold text-[#e6e8eb] mt-0.5">{w.name}</div>
              </div>
              <span
                className={`text-xs font-mono tabular-nums ${
                  isSelected ? 'text-[#cd412b] font-semibold' : 'text-[#8c94a0]'
                }`}
              >
                {w.reloadTimeSec}с
              </span>
            </button>
          );
        })}
      </div>

      {/* Деталі зброї та балістичний тренажер */}
      <div className="lg:col-span-8 p-5 sm:p-8 space-y-6 bg-[#0e1012]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262b33]">
          <div>
            <div className="text-xs text-[#8c94a0] font-mono">
              {selectedWeapon.tier} · Крафт: {selectedWeapon.craftCost}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#f1f3f5] mt-1 font-display">
              {selectedWeapon.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#15181c] border border-[#2a303a] rounded-[3px] p-0.5">
              <button
                type="button"
                onClick={() => setIsCrouching(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors ${
                  isCrouching
                    ? 'bg-[#252a32] text-[#f1f3f5]'
                    : 'text-[#8c94a0] hover:text-[#d0d5dd]'
                }`}
              >
                Сидячи (-50%)
              </button>
              <button
                type="button"
                onClick={() => setIsCrouching(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors ${
                  !isCrouching
                    ? 'bg-[#252a32] text-[#f1f3f5]'
                    : 'text-[#8c94a0] hover:text-[#d0d5dd]'
                }`}
              >
                Стоячи (100%)
              </button>
            </div>

            <button
              type="button"
              onClick={handleRunRecoilSim}
              className="px-4 py-2 rounded-[3px] text-xs font-semibold bg-[#cd412b] hover:bg-[#de4b34] text-white transition-colors flex items-center gap-1.5 min-h-[38px]"
            >
              <Play className="w-3.5 h-3.5" />
              Відтворити чергу
            </button>

            <button
              type="button"
              onClick={() => setActiveShotIndex(selectedWeapon.recoilPoints.length)}
              aria-label="Скинути патерн"
              className="p-2 rounded-[3px] bg-[#15181c] border border-[#2a303a] text-[#cfd4dc] hover:bg-[#1e2228] transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ТТХ у вигляді табличної лінійки */}
        <dl className="grid grid-cols-2 sm:grid-cols-4 border border-[#262b33] divide-y sm:divide-y-0 sm:divide-x divide-[#262b33] bg-[#13161a] rounded-[3px]">
          <div className="px-4 py-3">
            <dt className="text-[11px] text-[#8c94a0]">Голова</dt>
            <dd className="text-lg font-bold text-[#e6e8eb] font-mono tabular-nums mt-0.5">
              {selectedWeapon.damageHead} HP
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-[11px] text-[#8c94a0]">Груди</dt>
            <dd className="text-lg font-bold text-[#e6e8eb] font-mono tabular-nums mt-0.5">
              {selectedWeapon.damageChest} HP
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-[11px] text-[#8c94a0]">Темп вогню</dt>
            <dd className="text-lg font-bold text-[#e6e8eb] font-mono tabular-nums mt-0.5">
              {selectedWeapon.fireRateRpm} RPM
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-[11px] text-[#8c94a0]">Перезарядка</dt>
            <dd className="text-lg font-bold text-[#e6e8eb] font-mono tabular-nums mt-0.5">
              {selectedWeapon.reloadTimeSec} с
            </dd>
          </div>
        </dl>

        {/* Графік патерну та рекомендації */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-6 bg-[#13161a] border border-[#262b33] rounded-[3px] p-4">
            <div className="flex items-center justify-between text-xs text-[#8c94a0] mb-3">
              <span>Розкид куль (схема прицілу)</span>
              <span className="font-mono tabular-nums text-[#cd412b]">
                {activeShotIndex} / {selectedWeapon.recoilPoints.length}
              </span>
            </div>
            <svg
              viewBox="0 0 100 100"
              className="w-full h-[260px] bg-[#0e1012] border border-[#22262e] rounded-[2px]"
              aria-label={`Схема віддачі ${selectedWeapon.name}`}
            >
              <line x1="50" y1="0" x2="50" y2="100" stroke="#232730" strokeDasharray="2 2" />
              <line x1="0" y1="85" x2="100" y2="85" stroke="#232730" strokeDasharray="2 2" />
              {selectedWeapon.recoilPoints.slice(0, activeShotIndex).map((pt, idx, arr) => {
                const adjX = isCrouching ? 50 + (pt.x - 50) * 0.55 : pt.x;
                const adjY = isCrouching ? 85 - (85 - pt.y) * 0.55 : pt.y;
                const prevPt = idx > 0 ? arr[idx - 1] : null;
                const prevX = prevPt
                  ? isCrouching
                    ? 50 + (prevPt.x - 50) * 0.55
                    : prevPt.x
                  : adjX;
                const prevY = prevPt
                  ? isCrouching
                    ? 85 - (85 - prevPt.y) * 0.55
                    : prevPt.y
                  : adjY;

                return (
                  <g key={idx}>
                    {prevPt && (
                      <line
                        x1={prevX}
                        y1={prevY}
                        x2={adjX}
                        y2={adjY}
                        stroke="#3a414d"
                        strokeWidth="0.6"
                      />
                    )}
                    <circle
                      cx={adjX}
                      cy={adjY}
                      r={idx === 0 ? 2.6 : 1.9}
                      fill={idx === 0 ? '#22c55e' : '#cd412b'}
                    />
                    <text
                      x={adjX + 3.2}
                      y={adjY + 1.2}
                      fontSize="3.6"
                      fill="#8c94a0"
                      fontFamily="monospace"
                    >
                      {idx + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="md:col-span-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#e6e8eb] font-display">
                Як компенсувати мишею
              </h3>
              <p className="text-sm text-[#b9c0cb] leading-relaxed">
                {selectedWeapon.recoilPatternDesc}
              </p>
            </div>

            <div className="border-t border-[#262b33] pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-[#8c94a0]">Ефект присідання:</span>
                <span className="text-emerald-400 font-medium text-right">
                  {selectedWeapon.crouchModifier}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#8c94a0]">Рекомендований обвіс:</span>
                <span className="text-[#e6e8eb] font-medium text-right">
                  {selectedWeapon.bestAttachments.join(' · ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
