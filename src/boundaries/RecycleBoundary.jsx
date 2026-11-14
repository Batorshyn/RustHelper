import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, Clock, Minus } from 'lucide-react';

const RECYCLE_PRESETS = [
  {
    id: 'road_farm',
    label: 'Фарм вздовж дороги',
    items: [
      { itemId: 1, quantity: 10 }, // Шестерні
      { itemId: 2, quantity: 12 }, // Труби
      { itemId: 7, quantity: 6 },  // Пружини
      { itemId: 9, quantity: 8 },  // Дорожні знаки
    ],
  },
  {
    id: 'oil_rig',
    label: 'Нафтовишка / Елітні ящики',
    items: [
      { itemId: 6, quantity: 8 },  // Tech Trash
      { itemId: 13, quantity: 3 }, // Камери
      { itemId: 14, quantity: 2 }, // Комп'ютери
      { itemId: 3, quantity: 2 },  // Rifle Body
    ],
  },
  {
    id: 'cloth_rope',
    label: 'Тканина з компонентів',
    items: [
      { itemId: 10, quantity: 8 }, // Швацький набір
      { itemId: 11, quantity: 15 }, // Мотузка
      { itemId: 12, quantity: 4 }, // Брезент
    ],
  },
];

export const RecycleBoundary = ({ items, calculator, initialItemId }) => {
  const [selectedItemId, setSelectedItemId] = useState(initialItemId || items[0]?.id || 1);
  const [quantityInput, setQuantityInput] = useState('10');
  const [recyclerZone, setRecyclerZone] = useState('radtown');
  const [queue, setQueue] = useState([
    { itemId: 1, quantity: 10 },
    { itemId: 6, quantity: 5 },
    { itemId: 3, quantity: 3 },
  ]);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (initialItemId) {
      setSelectedItemId(initialItemId);
    }
  }, [initialItemId]);

  const result = queue.length > 0 ? calculator.calculate(queue, recyclerZone) : null;
  const compareZone = recyclerZone === 'radtown' ? 'safezone' : 'radtown';
  const compareResult = queue.length > 0 ? calculator.calculate(queue, compareZone) : null;

  const handleAddAndCalculate = (e) => {
    e.preventDefault();
    setValidationError(null);

    const check = calculator.checkInput(quantityInput, 1, 10000);
    if (!check.isValid || check.normalizedNumber === undefined) {
      setValidationError(check.errorMessage || 'Некоректна кількість.');
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
  };

  const handleStepQuantity = (itemId, delta) => {
    setValidationError(null);
    const updated = queue
      .map((q) => (q.itemId === itemId ? { ...q, quantity: q.quantity + delta } : q))
      .filter((q) => q.quantity > 0);
    setQueue(updated);
  };

  const handleQuickQuantityChange = (itemId, rawValue) => {
    setValidationError(null);
    const check = calculator.checkInput(rawValue, 1, 10000);
    if (!check.isValid || check.normalizedNumber === undefined) {
      setValidationError(check.errorMessage || 'Введіть ціле число від 1 до 10 000.');
      return;
    }
    setQueue(
      queue.map((q) => (q.itemId === itemId ? { ...q, quantity: check.normalizedNumber } : q))
    );
  };

  const getItemName = (id) => items.find((i) => i.id === id)?.name || `Предмет #${id}`;

  const scrapMain =
    result?.totalResources.find((r) => r.resourceId === 'scrap')?.totalAmount || 0;
  const scrapCompare =
    compareResult?.totalResources.find((r) => r.resourceId === 'scrap')?.totalAmount || 0;
  const scrapDelta = scrapMain - scrapCompare;

  return (
    <div className="flex flex-col min-h-full">
      {/* Паттерн "Structured Templates + Cloze Inline Builder" */}
      <div className="px-5 sm:px-7 py-4 border-b border-[#262b33] bg-[#111316] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#f1f3f5] font-display">
              Калькулятор переробки
            </h1>
            <p className="text-xs text-[#8c94a0]">
              Порівняння виходу скрапу та металу в небезпечних монументах і мирних зонах
            </p>
          </div>

          {/* Швидкі пресети сценаріїв (Templates) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-[#7b8391] mr-1">Шаблони:</span>
            {RECYCLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setQueue(preset.items);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-[#181c22] hover:bg-[#21262e] border border-[#2a303a] text-[#d0d5dd] rounded-[3px] transition-colors whitespace-nowrap"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cloze-рядок додавання слота */}
        <form
          onSubmit={handleAddAndCalculate}
          noValidate
          className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[#1e2229]"
        >
          <span className="text-xs text-[#8c94a0]">Розібрати</span>

          <label htmlFor="recycle-quantity-input" className="sr-only">
            Кількість
          </label>
          <input
            id="recycle-quantity-input"
            type="number"
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            className="w-20 px-2.5 py-1.5 bg-[#16191e] border border-[#2e3440] rounded-[3px] text-sm font-mono tabular-nums text-[#f1f3f5] focus:outline-none focus:border-[#cd412b] min-h-[38px]"
          />

          <span className="text-xs text-[#8c94a0]">×</span>

          <label htmlFor="recycle-item-select" className="sr-only">
            Предмет
          </label>
          <select
            id="recycle-item-select"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(Number(e.target.value))}
            className="min-w-[220px] flex-1 sm:flex-initial px-3 py-1.5 bg-[#16191e] border border-[#2e3440] rounded-[3px] text-sm text-[#f1f3f5] focus:outline-none focus:border-[#cd412b] min-h-[38px]"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-[#16191e] border border-[#2e3440] rounded-[3px] p-0.5 min-h-[38px]">
            <button
              type="button"
              onClick={() => setRecyclerZone('radtown')}
              className={`px-3 py-1 text-xs font-medium rounded-[2px] transition-colors whitespace-nowrap ${
                recyclerZone === 'radtown'
                  ? 'bg-[#cd412b] text-white'
                  : 'text-[#8c94a0] hover:text-[#e6e8eb]'
              }`}
            >
              Радтаун (60%)
            </button>
            <button
              type="button"
              onClick={() => setRecyclerZone('safezone')}
              className={`px-3 py-1 text-xs font-medium rounded-[2px] transition-colors whitespace-nowrap ${
                recyclerZone === 'safezone'
                  ? 'bg-[#cd412b] text-white'
                  : 'text-[#8c94a0] hover:text-[#e6e8eb]'
              }`}
            >
              Outpost (40%)
            </button>
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-[#cd412b] hover:bg-[#de4b34] text-white text-xs font-semibold rounded-[3px] transition-colors flex items-center gap-1.5 min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            Додати в слоти
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

      {/* Основний розділений екран */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* Черга слотів */}
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#262b33] flex flex-col">
          <div className="px-5 py-3 border-b border-[#20242b] flex items-center justify-between text-xs text-[#8c94a0]">
            <span>Слоти переробника ({queue.length})</span>
            {queue.length > 0 && (
              <button
                type="button"
                onClick={() => setQueue([])}
                className="text-[#8c94a0] hover:text-red-400 transition-colors"
              >
                Очистити все
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#7b8391]">
              Додайте компоненти зверху або оберіть один із готових шаблонів фарму.
            </div>
          ) : (
            <div className="divide-y divide-[#1e2229]">
              {queue.map((entry) => (
                <div
                  key={entry.itemId}
                  className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:bg-[#13161a]"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#e6e8eb] leading-snug">
                      {getItemName(entry.itemId)}
                    </div>
                    <div className="text-[11px] text-[#7b8391] font-mono tabular-nums mt-0.5">
                      {items
                        .find((i) => i.id === entry.itemId)
                        ?.yields.map((y) => `${y.amountPerUnit} ${y.resourceName.split(' ')[0]}`)
                        .join(' · ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStepQuantity(entry.itemId, -1)}
                      aria-label={`Зменшити кількість ${getItemName(entry.itemId)}`}
                      className="w-7 h-7 flex items-center justify-center bg-[#16191e] border border-[#2a303a] rounded-[2px] text-[#8c94a0] hover:text-[#e6e8eb]"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={entry.quantity}
                      onChange={(e) => handleQuickQuantityChange(entry.itemId, e.target.value)}
                      aria-label={`Кількість ${getItemName(entry.itemId)}`}
                      className="w-16 px-2 py-1 bg-[#16191e] border border-[#2a303a] rounded-[2px] text-xs text-right font-mono tabular-nums text-[#f1f3f5]"
                    />
                    <button
                      type="button"
                      onClick={() => handleStepQuantity(entry.itemId, 1)}
                      aria-label={`Збільшити кількість ${getItemName(entry.itemId)}`}
                      className="w-7 h-7 flex items-center justify-center bg-[#16191e] border border-[#2a303a] rounded-[2px] text-[#8c94a0] hover:text-[#e6e8eb]"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueue(queue.filter((q) => q.itemId !== entry.itemId))}
                      aria-label={`Видалити ${getItemName(entry.itemId)}`}
                      className="ml-1 p-1.5 text-[#7b8391] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Результат та порівняння Радтаун vs Мирна зона */}
        <div className="lg:col-span-7 p-5 sm:p-7 space-y-6 bg-[#0e1012]">
          {!result || !result.isValid ? (
            <div className="py-12 text-center text-sm text-[#7b8391]">
              Додайте предмети ліворуч для розрахунку виходу ресурсів.
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#262b33]">
                <div>
                  <h2 className="text-xl font-bold text-[#f1f3f5] font-display">
                    Підсумковий вихід ресурсів
                  </h2>
                  <p className="text-xs text-[#8c94a0] mt-0.5">{result.efficiencyLabel}</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                  <span className="flex items-center gap-1.5 text-[#d0d5dd]">
                    <Clock className="w-3.5 h-3.5 text-[#8c94a0]" />
                    {result.totalRecycleTimeSec}с (~{Math.ceil(result.totalRecycleTimeSec / 60)} хв)
                  </span>
                </div>
              </div>

              {/* Сітка підсумкових ресурсів (без nested card clutter) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#262b33] divide-y sm:divide-y-0 sm:divide-x divide-[#262b33] bg-[#13161a] rounded-[3px]">
                {result.totalResources.map((res) => (
                  <div key={res.resourceId} className="px-4 py-3.5">
                    <div className="text-[11px] text-[#8c94a0] leading-snug">
                      {res.resourceId === 'hqm' ? 'МВК (HQM)' : res.resourceName}
                    </div>
                    <div
                      className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                        res.resourceId === 'scrap'
                          ? 'text-[#f1f3f5]'
                          : res.resourceId === 'hqm'
                            ? 'text-sky-400'
                            : 'text-[#d0d5dd]'
                      }`}
                    >
                      {res.totalAmount.toLocaleString('uk-UA')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Живе порівняння втрат / вигоди між Радтауном і Мирною зоною */}
              {scrapMain > 0 && (
                <div className="px-4 py-3 bg-[#15181c] border border-[#262b33] rounded-[3px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-[#b9c0cb]">
                    {recyclerZone === 'radtown'
                      ? 'У мирній зоні Outpost ця ж партія дала б менше металобрухту:'
                      : 'У переробнику монумента (Радтаун 60%) ви отримали б більше:'}
                  </span>
                  <span
                    className={`font-mono tabular-nums font-semibold ${
                      recyclerZone === 'radtown' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {scrapDelta > 0
                      ? `+${scrapDelta} скрапу вигоди`
                      : `${scrapDelta} скрапу (втрата в Outpost)`}
                  </span>
                </div>
              )}

              {/* Деталізація по кожному слоту */}
              <div>
                <h3 className="text-xs font-medium text-[#8c94a0] mb-2">
                  Розподіл по компонентах
                </h3>
                <div className="overflow-x-auto border border-[#262b33] rounded-[3px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#15181c] text-[#8c94a0] border-b border-[#262b33]">
                        <th className="py-2.5 px-3 font-medium">Компонент</th>
                        <th className="py-2.5 px-3 font-medium text-right">Кількість</th>
                        <th className="py-2.5 px-3 font-medium text-right">Вихід</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2229]">
                      {result.inputItems.map(({ item, quantity }) => {
                        const mult = recyclerZone === 'radtown' ? 1.0 : 40 / 60;
                        return (
                          <tr key={item.id} className="hover:bg-[#13161a]">
                            <td className="py-2.5 px-3 text-[#e6e8eb] font-medium">{item.name}</td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#b9c0cb]">
                              {quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#e6e8eb]">
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
