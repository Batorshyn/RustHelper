import React, { useState } from 'react';
import {
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import {
  IRecycleItem,
  IRecycleCalculationResult,
  UserRole,
} from '../entities/models';
import { RecycleCalculator } from '../control/Calculators';

interface RecycleBoundaryProps {
  items: IRecycleItem[];
  calculator: RecycleCalculator;
  userRole: UserRole;
  onUpgradeRole: () => void;
}

export const RecycleBoundary: React.FC<RecycleBoundaryProps> = ({
  items,
  calculator,
  userRole,
  onUpgradeRole,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<number>(items[0]?.id || 1);
  const [quantityInput, setQuantityInput] = useState<string>('10');
  const [recyclerZone, setRecyclerZone] = useState<'radtown' | 'safezone'>('radtown');

  const [queue, setQueue] = useState<{ itemId: number; quantity: number }[]>([
    { itemId: 1, quantity: 10 }, // 10 Шестерень
    { itemId: 6, quantity: 5 },  // 5 Tech Trash
    { itemId: 3, quantity: 3 },  // 3 Rifle Body
  ]);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<IRecycleCalculationResult>(() =>
    calculator.calculate(
      [
        { itemId: 1, quantity: 10 },
        { itemId: 6, quantity: 5 },
        { itemId: 3, quantity: 3 },
      ],
      'radtown'
    )
  );

  // UC6 «Перевірити введені дані» + UC4 «Розрахувати переробку ресурсів»
  const handleAddAndCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const check = calculator.checkInput(quantityInput, 1, 10000);
    if (!check.isValid || check.normalizedNumber === undefined) {
      setValidationError(check.errorMessage || 'Некоректне значення кількості.');
      return;
    }

    const updatedQueue = [...queue];
    const existingIdx = updatedQueue.findIndex((q) => q.itemId === selectedItemId);
    if (existingIdx >= 0) {
      updatedQueue[existingIdx] = {
        ...updatedQueue[existingIdx],
        quantity: updatedQueue[existingIdx].quantity + check.normalizedNumber,
      };
    } else {
      updatedQueue.push({ itemId: selectedItemId, quantity: check.normalizedNumber });
    }

    setQueue(updatedQueue);
    const calcRes = calculator.calculate(updatedQueue, recyclerZone);
    if (!calcRes.isValid) {
      setValidationError(calcRes.errorMessage || 'Помилка розрахунку');
    } else {
      setResult(calcRes);
    }
  };

  const handleZoneChange = (newZone: 'radtown' | 'safezone') => {
    setRecyclerZone(newZone);
    setValidationError(null);
    if (queue.length > 0) {
      setResult(calculator.calculate(queue, newZone));
    }
  };

  const handleRemoveQueueItem = (itemId: number) => {
    const next = queue.filter((q) => q.itemId !== itemId);
    setQueue(next);
    if (next.length > 0) {
      setResult(calculator.calculate(next, recyclerZone));
    }
  };

  const handleQuickQuantityChange = (itemId: number, rawValue: string) => {
    setValidationError(null);
    const check = calculator.checkInput(rawValue, 1, 10000);
    if (!check.isValid || check.normalizedNumber === undefined) {
      setValidationError(check.errorMessage || 'Некоректне значення кількості (UC6).');
      return;
    }

    const next = queue.map((q) =>
      q.itemId === itemId ? { ...q, quantity: check.normalizedNumber! } : q
    );
    setQueue(next);
    setResult(calculator.calculate(next, recyclerZone));
  };

  const getItemName = (id: number) => items.find((i) => i.id === id)?.name || `Предмет #${id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Калькулятор Переробника Ресурсів (Recycler)
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Варіанти використання UC4 «Розрахувати переробку ресурсів» та UC6 «Перевірити введені
            дані» · Працює офлайн
          </p>
        </div>

        {/* Перемикач зони переробника: Радтаун 60% проти Мирної зони 40% */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg self-start">
          <button
            type="button"
            onClick={() => handleZoneChange('radtown')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
              recyclerZone === 'radtown'
                ? 'bg-orange-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Радтаун / Монумент (60% вихід)
          </button>
          <button
            type="button"
            onClick={() => handleZoneChange('safezone')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
              recyclerZone === 'safezone'
                ? 'bg-orange-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Мирна зона Outpost (40% вихід)
          </button>
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
                За діаграмою варіантів використання розрахункові калькулятори закріплені за роллю
                «Досвідчений гравець». Ви можете переключитися на роль «Досвідчений гравець» одним
                натисканням або протестувати розрахунок нижче.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUpgradeRole}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
          >
            Увімкнути роль «Досвідчений гравець»
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ліва колонка: Введення предмета та черга переробника (RecycleScreen <<Boundary>>) */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-zinc-100">
            1. Додати компоненти до переробника
          </h2>

          <form onSubmit={handleAddAndCalculate} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <label
                  htmlFor="recycle-item-select"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  Компонент або предмет
                </label>
                <select
                  id="recycle-item-select"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-orange-500 min-h-[44px]"
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label
                  htmlFor="recycle-quantity-input"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  Кількість (1–10 000)
                </label>
                <input
                  id="recycle-quantity-input"
                  type="number"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  placeholder="Напр. 10"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-orange-500 min-h-[44px]"
                />
              </div>
            </div>

            {validationError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/70 flex items-center gap-2.5 text-xs text-red-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>Помилка валідації (UC6 InputValidator): {validationError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors flex items-center gap-2 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                Додати та розрахувати (UC4)
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuantityInput('-5');
                  const check = calculator.checkInput('-5');
                  setValidationError(check.errorMessage || null);
                }}
                className="px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors min-h-[44px]"
              >
                Перевірити захист UC6 (Ввести -5)
              </button>
            </div>
          </form>

          {/* Черга предметів у переробнику */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Слоти переробника ({queue.length} позицій)</span>
              {queue.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQueue([])}
                  className="text-zinc-400 hover:text-red-400 transition-colors"
                >
                  Очистити всі слоти
                </button>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="p-6 text-center rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400">
                Слоти переробника порожні. Додайте компоненти вище для автоматичного підрахунку
                скрапу та металу.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800 bg-zinc-950/60">
                {queue.map((entry) => (
                  <div
                    key={entry.itemId}
                    className="p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-100 truncate">
                        {getItemName(entry.itemId)}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {items
                          .find((i) => i.id === entry.itemId)
                          ?.yields.map((y) => `${y.resourceName}: ${y.amountPerUnit}`)
                          .join(' · ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label htmlFor={`qty-slot-${entry.itemId}`} className="sr-only">
                        Кількість для {getItemName(entry.itemId)}
                      </label>
                      <input
                        id={`qty-slot-${entry.itemId}`}
                        type="number"
                        min={1}
                        max={10000}
                        value={entry.quantity}
                        onChange={(e) =>
                          handleQuickQuantityChange(entry.itemId, e.target.value)
                        }
                        className="w-20 px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-md text-xs text-right font-mono tabular-nums text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveQueueItem(entry.itemId)}
                        aria-label={`Видалити ${getItemName(entry.itemId)} зі списку`}
                        className="p-2 text-zinc-400 hover:text-red-400 rounded-md hover:bg-zinc-900 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Права колонка: Звіт про отримані ресурси (CalculationResult <<Entity>>) */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-zinc-100">
                2. Звіт про отримані ресурси (CalculationResult)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">{result.efficiencyLabel}</p>
            </div>
            <div className="text-right font-mono tabular-nums text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>{result.executionTimeMs} мс (&le; 50 мс)</span>
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-400">
              Додайте предмети ліворуч, щоб сформувати підсумковий звіт виходу ресурсів.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.totalResources.map((res) => (
                  <div
                    key={res.resourceId}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs text-zinc-400">{res.resourceName}</div>
                      <div className="text-2xl font-bold text-zinc-100 font-mono tabular-nums mt-1">
                        {res.totalAmount.toLocaleString('uk-UA')}{' '}
                        <span className="text-xs font-normal text-zinc-400">{res.unit}</span>
                      </div>
                    </div>
                    <RefreshCw className="w-5 h-5 text-orange-500/70 shrink-0" />
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Загальний час роботи переробника:</span>
                </div>
                <div className="font-mono tabular-nums font-semibold text-zinc-100">
                  {result.totalRecycleTimeSec} сек (~
                  {Math.ceil(result.totalRecycleTimeSec / 60)} хв)
                </div>
              </div>

              {/* Таблиця коефіцієнтів виходу (RecycleRule <<Entity>>) */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold text-zinc-300">
                  Деталізація по слотах (RecycleRule &rarr; CalculationResult)
                </h3>
                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                        <th className="py-2.5 px-3 font-medium">Предмет</th>
                        <th className="py-2.5 px-3 font-medium text-right">Кількість</th>
                        <th className="py-2.5 px-3 font-medium text-right">Вихід ресурсів</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70">
                      {result.inputItems.map(({ item, quantity }) => {
                        const mult = recyclerZone === 'radtown' ? 1.0 : 40 / 60;
                        return (
                          <tr key={item.id} className="hover:bg-zinc-800/30">
                            <td className="py-2.5 px-3 text-zinc-200 font-medium">{item.name}</td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-zinc-300">
                              {quantity} шт.
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-orange-300">
                              {item.yields
                                .map(
                                  (y) =>
                                    `${Math.max(1, Math.floor(y.amountPerUnit * quantity * mult))} ${y.resourceName.split(' ')[0]}`
                                )
                                .join(' + ')}
                            </td>
                          </tr>
                        );
                      })}
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
