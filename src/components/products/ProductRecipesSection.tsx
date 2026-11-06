import React, { useState } from 'react';
import type {
  ProductRecipePayloadItem,
  ProductSelectOptionMaterial,
  ProductSelectOptionRecipe,
  ProductSelectOptionUnit,
} from '../../types';
import { SearchableSelect } from '../ui/SearchableSelect';
import { renderName } from '../../utils/helpers';
import {
  MdSchema,
  MdLayers,
  MdRestaurantMenu,
  MdAdd,
  MdDeleteOutline,
  MdStraighten,
  MdOutlineNumbers,
} from 'react-icons/md';

export interface ProductRecipesSectionProps {
  materials?: ProductSelectOptionMaterial[];
  productRecipes?: ProductSelectOptionRecipe[];
  units?: ProductSelectOptionUnit[];
  recipes: ProductRecipePayloadItem[];
  onChange: (recipes: ProductRecipePayloadItem[]) => void;
  disabled?: boolean;
}

export const ProductRecipesSection: React.FC<ProductRecipesSectionProps> = ({
  materials = [],
  productRecipes = [],
  units = [],
  recipes = [],
  onChange,
  disabled = false,
}) => {
  // New item drafting state
  const [componentType, setComponentType] = useState<'material' | 'recipe'>('material');
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [count, setCount] = useState<number>(1);
  const [unitId, setUnitId] = useState<number | ''>(units.length > 0 ? units[0].id : '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper lookups
  const getMaterialName = (id?: number | null) => {
    if (!id) return '';
    const found = materials.find((m) => m.id === id);
    return found ? renderName(found.name) : `خامة #${id}`;
  };

  const getRecipeName = (id?: number | null) => {
    if (!id) return '';
    const found = productRecipes.find((r) => r.id === id);
    return found ? renderName(found.name) : `وصفة #${id}`;
  };

  const getUnitName = (id?: number | null) => {
    if (!id) return '—';
    const found = units.find((u) => u.id === id);
    return found ? renderName(found.name) : `وحدة #${id}`;
  };

  // Add component handler
  const handleAddComponent = () => {
    setErrorMsg(null);

    if (!selectedItemId) {
      setErrorMsg(
        componentType === 'material'
          ? 'يرجى اختيار مادة خام من القائمة'
          : 'يرجى اختيار وصفة تجهيزية من القائمة'
      );
      return;
    }

    if (!count || count < 1) {
      setErrorMsg('الكمية يجب أن تكون 1 على الأقل');
      return;
    }

    if (!unitId) {
      setErrorMsg('يرجى اختيار وحدة القياس');
      return;
    }

    const numericItemId = Number(selectedItemId);
    const numericUnitId = Number(unitId);

    // Check if already added
    const isDuplicate = recipes.some((r) =>
      componentType === 'material'
        ? r.material_id === numericItemId
        : r.product_recipe_id === numericItemId
    );

    if (isDuplicate) {
      setErrorMsg('هذا المكون مضاف بالفعل في قائمة المكونات الحالية');
      return;
    }

    const newItem: ProductRecipePayloadItem = {
      material_id: componentType === 'material' ? numericItemId : null,
      product_recipe_id: componentType === 'recipe' ? numericItemId : null,
      count: Math.max(1, Math.round(count)),
      unit_id: numericUnitId,
    };

    onChange([...recipes, newItem]);

    // Reset drafting input
    setSelectedItemId('');
    setCount(1);
    if (units.length > 0) {
      setUnitId(units[0].id);
    }
  };

  // Remove component handler
  const handleRemoveComponent = (index: number) => {
    const updated = recipes.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Update component count
  const handleUpdateCount = (index: number, newCount: number) => {
    const validCount = Math.max(1, Math.round(newCount));
    const updated = recipes.map((r, i) => (i === index ? { ...r, count: validCount } : r));
    onChange(updated);
  };

  // Update component unit
  const handleUpdateUnit = (index: number, newUnitId: number) => {
    const updated = recipes.map((r, i) => (i === index ? { ...r, unit_id: newUnitId } : r));
    onChange(updated);
  };

  // Count breakdown
  const materialsCount = recipes.filter((r) => !!r.material_id).length;
  const recipesCount = recipes.filter((r) => !!r.product_recipe_id).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs p-5 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <MdSchema size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                مكونات ومعايير تصنيع المنتج (BOM & Ingredients)
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                {recipes.length} مكون
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              حدد المواد الخام والوصفات التجهيزية التي يتكون منها المنتج لضبط التكلفة وحساب المخزون آلياً
            </p>
          </div>
        </div>

        {/* Quick Badges */}
        {recipes.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/40">
              <MdLayers size={14} />
              {materialsCount} خامة
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800/40">
              <MdRestaurantMenu size={14} />
              {recipesCount} وصفة
            </span>
          </div>
        )}
      </div>

      {/* Add New Ingredient Form Bar */}
      {!disabled && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 md:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <MdAdd size={16} className="text-primary" />
              إضافة مكون جديد للمنتج:
            </span>

            {/* Type Toggle Tabs */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setComponentType('material');
                  setSelectedItemId('');
                  setErrorMsg(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  componentType === 'material'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <MdLayers size={15} />
                <span>مادة خام (Material)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setComponentType('recipe');
                  setSelectedItemId('');
                  setErrorMsg(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  componentType === 'recipe'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <MdRestaurantMenu size={15} />
                <span>وصفة نصف مصنعة (Recipe)</span>
              </button>
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {/* 1. Item Dropdown (6 cols) */}
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {componentType === 'material' ? 'اختر المادة الخام *' : 'اختر الوصفة التجهيزية *'}
              </label>
              <SearchableSelect
                value={selectedItemId}
                onChange={(val) => {
                  setSelectedItemId(val ? Number(val) : '');
                  setErrorMsg(null);
                }}
                options={componentType === 'material' ? materials : productRecipes}
                placeholder={
                  componentType === 'material'
                    ? 'ابحث بالاسم أو اختر مادة خام...'
                    : 'ابحث بالاسم أو اختر وصفة تجهيزية...'
                }
                searchPlaceholder="بحث في القائمة..."
                isClearable={true}
              />
            </div>

            {/* 2. Count Input (3 cols) */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                الكمية المطلوبة *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={count}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setCount(isNaN(val) ? 1 : Math.max(1, val));
                    setErrorMsg(null);
                  }}
                  className="w-full px-3.5 py-2.5 pl-8 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 dark:text-slate-100"
                  placeholder="1"
                />
                <MdOutlineNumbers
                  size={16}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* 3. Unit Dropdown (3 cols) */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                وحدة القياس *
              </label>
              <div className="relative">
                <select
                  value={unitId}
                  onChange={(e) => {
                    setUnitId(e.target.value ? Number(e.target.value) : '');
                    setErrorMsg(null);
                  }}
                  className="w-full px-3.5 py-2.5 pl-8 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  <option value="">اختر الوحدة...</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {renderName(u.name)} {u.value > 1 ? `(${u.value})` : ''}
                    </option>
                  ))}
                </select>
                <MdStraighten
                  size={16}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* 4. Add Button (1 col) */}
            <div className="sm:col-span-1">
              <button
                type="button"
                onClick={handleAddComponent}
                className="w-full h-[38px] inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary-dark text-white font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
                title="إضافة المكون"
              >
                <MdAdd size={20} />
              </button>
            </div>
          </div>

          {/* Validation Error Message */}
          {errorMsg && (
            <p className="text-xs text-rose-500 font-semibold flex items-center gap-1 animate-in fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {errorMsg}
            </p>
          )}
        </div>
      )}

      {/* Ingredients List Table */}
      {recipes.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <MdSchema size={26} />
          </div>
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
            لم يتم تحديد مكونات تصنيع لهذا المنتج حتى الآن
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            إضافة المكونات اختيارية، ولكنها تتيح حساب تكلفة الوجبة التلقائية وخصم المخزون بدقة عند بيع المنتج أو تصنيعه.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 font-bold">#</th>
                <th className="py-3 px-4 font-bold">النوع</th>
                <th className="py-3 px-4 font-bold">اسم المكون</th>
                <th className="py-3 px-4 font-bold">الكمية المستخدمة</th>
                <th className="py-3 px-4 font-bold">وحدة القياس</th>
                {!disabled && <th className="py-3 px-4 font-bold text-center">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recipes.map((item, index) => {
                const isMaterial = !!item.material_id;
                const itemName = isMaterial
                  ? getMaterialName(item.material_id)
                  : getRecipeName(item.product_recipe_id);

                return (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4">
                      {isMaterial ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                          <MdLayers size={13} />
                          خامة
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                          <MdRestaurantMenu size={13} />
                          وصفة
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                      {itemName}
                    </td>
                    <td className="py-3 px-4">
                      {disabled ? (
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">
                          {item.count}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={item.count}
                          onChange={(e) => handleUpdateCount(index, parseInt(e.target.value, 10) || 1)}
                          className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {disabled ? (
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {getUnitName(item.unit_id)}
                        </span>
                      ) : (
                        <select
                          value={item.unit_id}
                          onChange={(e) => handleUpdateUnit(index, Number(e.target.value))}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-slate-700 dark:text-slate-200"
                        >
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>
                              {renderName(u.name)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    {!disabled && (
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(index)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="حذف هذا المكون"
                        >
                          <MdDeleteOutline size={17} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductRecipesSection;
