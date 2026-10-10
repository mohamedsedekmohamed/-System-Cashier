import React, { useState, useMemo } from 'react';
import type { 
  ManufacturingMaterial, 
  ManufacturingProductRecipe, 
  ManufacturingRecipePayload 
} from '../../types';
import { renderName } from '../../utils/helpers';
import { 
  MdSearch, 
  MdAdd, 
  MdRemove, 
  MdDeleteOutline, 
  MdCheckCircle, 
  MdWarning, 
  MdErrorOutline, 
  MdInventory, 
  MdLayers,
  MdClose
} from 'react-icons/md';

export interface ConsumedMaterialsCardsProps {
  materials: ManufacturingMaterial[];
  productRecipes: ManufacturingProductRecipe[];
  recipes: ManufacturingRecipePayload[];
  onChange: (recipes: ManufacturingRecipePayload[]) => void;
  disabled?: boolean;
  isTargetRecipe?: boolean;
}

type TabType = 'all' | 'materials' | 'recipes' | 'selected';

export const ConsumedMaterialsCards: React.FC<ConsumedMaterialsCardsProps> = ({
  materials = [],
  productRecipes = [],
  recipes = [],
  onChange,
  disabled = false,
  isTargetRecipe = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Unified items list with type identifier
  const allItems = useMemo(() => {
    const matItems = (materials || []).map(m => ({
      ...m,
      itemType: 'material' as const,
      uniqueKey: `m_${m.id}`,
      stockNumber: Number(m.stock ?? 0),
    }));

    const recItems = (productRecipes || []).map(r => ({
      ...r,
      itemType: 'recipe' as const,
      uniqueKey: `r_${r.id}`,
      stockNumber: Number(r.stock ?? 0),
    }));

    return [...matItems, ...recItems];
  }, [materials, productRecipes]);

  // Selected items map for quick lookup
  const selectedMap = useMemo(() => {
    const map = new Map<string, number>();
    recipes.forEach(r => {
      if (r.material_id) {
        map.set(`m_${r.material_id}`, r.count);
      } else if (r.product_recipe_id) {
        map.set(`r_${r.product_recipe_id}`, r.count);
      }
    });
    return map;
  }, [recipes]);

  // Check if any selected item exceeds stock
  const hasExceededItems = useMemo(() => {
    return recipes.some(r => {
      if (r.material_id) {
        const mat = materials.find(m => m.id === r.material_id);
        const stock = Number(mat?.stock ?? 0);
        return r.count > stock;
      }
      if (r.product_recipe_id) {
        const rec = productRecipes.find(p => p.id === r.product_recipe_id);
        const stock = Number(rec?.stock ?? 0);
        return r.count > stock;
      }
      return false;
    });
  }, [recipes, materials, productRecipes]);

  // Filter items based on tab, search, and availability
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Tab filter
      if (activeTab === 'materials' && item.itemType !== 'material') return false;
      if (activeTab === 'recipes' && item.itemType !== 'recipe') return false;
      if (activeTab === 'selected' && !selectedMap.has(item.uniqueKey)) return false;

      // Only available toggle
      if (onlyAvailable && item.stockNumber <= 0) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const nameAr = renderName(item.name, 'ar').toLowerCase();
        const nameEn = renderName(item.name, 'en').toLowerCase();
        const idMatch = String(item.id).includes(q);
        if (!nameAr.includes(q) && !nameEn.includes(q) && !idMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allItems, activeTab, onlyAvailable, search, selectedMap]);

  // ── Actions ───────────────────────────
  const handleToggleSelect = (item: typeof allItems[0]) => {
    if (disabled) return;
    if (item.stockNumber <= 0) return; // Cannot select items with 0 stock!

    if (selectedMap.has(item.uniqueKey)) {
      // Remove
      const updated = recipes.filter(r => {
        if (item.itemType === 'material') return r.material_id !== item.id;
        return r.product_recipe_id !== item.id;
      });
      onChange(updated);
    } else {
      // Add with default count 1 (or max stock if stock < 1)
      const initialCount = Math.min(1, item.stockNumber > 0 ? item.stockNumber : 1);
      const newItem: ManufacturingRecipePayload = {
        material_id: item.itemType === 'material' ? item.id : null,
        product_recipe_id: item.itemType === 'recipe' ? item.id : null,
        count: initialCount,
      };
      onChange([...recipes, newItem]);
    }
  };

  const handleUpdateCount = (uniqueKey: string, newCount: number) => {
    if (disabled) return;
    const countVal = isNaN(newCount) ? 0 : Math.max(0, Number(newCount));
    const updated = recipes.map(r => {
      const matchKey = r.material_id ? `m_${r.material_id}` : `r_${r.product_recipe_id}`;
      if (matchKey === uniqueKey) {
        return { ...r, count: countVal };
      }
      return r;
    });
    onChange(updated);
  };

  const handleRemove = (uniqueKey: string) => {
    if (disabled) return;
    const updated = recipes.filter(r => {
      const matchKey = r.material_id ? `m_${r.material_id}` : `r_${r.product_recipe_id}`;
      return matchKey !== uniqueKey;
    });
    onChange(updated);
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className="space-y-5">
      {/* ── Status Alerts ─────────────────────── */}
      {isTargetRecipe && recipes.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
          <MdWarning size={20} className="text-amber-500 shrink-0" />
          <p className="font-semibold leading-relaxed">
            تنبيه: لتحضير الوصفة، يجب اختيار الخامات والمواد المستهلكة من الكروت أدناه وتحديد الكمية المستهلكة.
          </p>
        </div>
      )}

      {hasExceededItems && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-3 animate-pulse">
          <MdErrorOutline size={20} className="text-rose-500 shrink-0" />
          <p className="font-semibold leading-relaxed">
            تنبيه هام: توجد خامات مستهلكة كميتها المطلوبة تتجاوز رصيد المخزن المتاح! يرجى تعديل الكميات لتتوافق مع رصيد المخزن.
          </p>
        </div>
      )}

      {/* ── Selected Items Summary Chips Bar ──── */}
      {recipes.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                الخامات المختارة للاستهلاك:
              </span>
              <span className="px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary">
                {recipes.length} صنف
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={disabled}
              className="text-slate-400 hover:text-rose-500 transition-colors font-medium text-xs flex items-center gap-1 disabled:opacity-50"
            >
              <MdDeleteOutline size={14} /> تفريغ المحدد
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {recipes.map(r => {
              const uniqueKey = r.material_id ? `m_${r.material_id}` : `r_${r.product_recipe_id}`;
              const item = allItems.find(i => i.uniqueKey === uniqueKey);
              if (!item) return null;
              const isOver = r.count > item.stockNumber;

              return (
                <div
                  key={uniqueKey}
                  className={`inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isOver
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs'
                  }`}
                >
                  <span className="truncate max-w-[140px]">{renderName(item.name)}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-mono text-[11px]">
                    × {r.count}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(uniqueKey)}
                    disabled={disabled}
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <MdClose size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Search & Filter Controls ─────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <MdSearch size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن مادة خام أو وصفة بالاسم..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <MdClose size={16} />
            </button>
          )}
        </div>

        {/* Filter Toggle: Only available in stock */}
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300 select-none bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors shrink-0">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
          />
          <span>المتوفر بالمخزن فقط (رصيد &gt; 0)</span>
        </label>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-2xs'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          الكل ({allItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
            activeTab === 'materials'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-2xs'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          المواد الخام ({materials.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('recipes')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
            activeTab === 'recipes'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-2xs'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          الوصفات شبه المصنعة ({productRecipes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('selected')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'selected'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-2xs'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          المختارة ({recipes.length})
          {hasExceededItems && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>
      </div>

      {/* ── Cards Grid ───────────────────────── */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
          <p className="text-sm font-semibold text-slate-500">لا توجد عناصر مطابقة للبحث أو التصفية.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const isSelected = selectedMap.has(item.uniqueKey);
            const currentCount = selectedMap.get(item.uniqueKey) || 1;
            const hasStock = item.stockNumber > 0;
            const isExceeded = isSelected && currentCount > item.stockNumber;
            const remaining = Math.max(0, item.stockNumber - currentCount);

            return (
              <div
                key={item.uniqueKey}
                onClick={() => {
                  if (!isSelected && hasStock && !disabled) {
                    handleToggleSelect(item);
                  }
                }}
                className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all duration-200 shadow-2xs group ${
                  isSelected
                    ? isExceeded
                      ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 ring-2 ring-rose-400/20'
                      : 'border-primary/60 bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/20 shadow-md'
                    : hasStock
                    ? 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-primary/60 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                    : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-70 cursor-not-allowed'
                }`}
              >
                {/* Card Top: Type & Selection Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${
                      item.itemType === 'material'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    <MdLayers size={13} />
                    {item.itemType === 'material' ? 'مادة خام' : 'وصفة شبه مصنعة'}
                  </span>

                  {isSelected && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      isExceeded
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                    }`}>
                      <MdCheckCircle size={13} />
                      {isExceeded ? 'تجاوز المخزون' : 'محدد للاستهلاك'}
                    </span>
                  )}
                </div>

                {/* Card Body: Title & Stock */}
                <div className="space-y-2 mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {renderName(item.name)}
                    </h3>
                    {item.name?.en && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {item.name.en}
                      </p>
                    )}
                  </div>

                  {/* Stock Info Badge */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {hasStock ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50">
                        <MdInventory size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span>رصيد المخزن: <strong className="font-mono">{item.stockNumber}</strong></span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/50">
                        <MdWarning size={14} className="text-rose-600 dark:text-rose-400" />
                        <span>نفذ من المخزن (0)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Action / Stepper */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 mt-auto">
                  {!isSelected ? (
                    <button
                      type="button"
                      disabled={disabled || !hasStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(item);
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                        hasStock
                          ? 'btn-card-add group-hover-card-btn'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {hasStock ? (
                        <>
                          <MdAdd size={16} />
                          <span>إضافة للاستهلاك</span>
                        </>
                      ) : (
                        <span>غير متوفر بالمخزن</span>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>الكمية المستهلكة:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(item.uniqueKey);
                          }}
                          disabled={disabled}
                          className="text-rose-500 hover:text-rose-700 text-xs font-medium flex items-center gap-0.5 px-2 py-0.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="إلغاء المادة"
                        >
                          <MdDeleteOutline size={14} /> إلغاء
                        </button>
                      </div>

                      {/* Stepper Input */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={disabled || currentCount <= 0.1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateCount(item.uniqueKey, Math.max(0.1, Number((currentCount - 1).toFixed(2))));
                          }}
                          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold transition-colors disabled:opacity-40"
                        >
                          <MdRemove size={15} />
                        </button>

                        <input
                          type="number"
                          min="0.01"
                          max={item.stockNumber}
                          step="any"
                          disabled={disabled}
                          value={currentCount === 0 ? '' : currentCount}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateCount(item.uniqueKey, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                          className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-mono font-bold text-sm bg-white dark:bg-slate-900 focus:outline-none transition-all ${
                            isExceeded
                              ? 'border-rose-500 text-rose-600 focus:ring-2 focus:ring-rose-400/30'
                              : 'border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary/30'
                          }`}
                        />

                        <button
                          type="button"
                          disabled={disabled || currentCount >= item.stockNumber}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateCount(item.uniqueKey, Math.min(item.stockNumber, Number((currentCount + 1).toFixed(2))));
                          }}
                          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold transition-colors disabled:opacity-40"
                        >
                          <MdAdd size={15} />
                        </button>
                      </div>

                      {/* Stock Remaining / Exceeded feedback */}
                      <div className="text-[11px] font-semibold text-center pt-0.5">
                        {isExceeded ? (
                          <span className="text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1">
                            <MdErrorOutline size={13} />
                            تجاوزت المخزون المتاح ({item.stockNumber})!
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 font-mono">
                            المتبقي بالمخزن: {remaining.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConsumedMaterialsCards;
