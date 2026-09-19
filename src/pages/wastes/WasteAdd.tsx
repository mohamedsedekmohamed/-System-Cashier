import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wasteApi, WASTES_KEY, WASTES_SELECT_OPTIONS_KEY } from '../../services/wasteService';
import type { WasteFormData } from '../../types';
import { MdArrowForward, MdSave, MdDeleteOutline, MdLayers, MdFastfood } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

type WasteType = 'material' | 'recipe';

const WasteAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form State ─────────────────────────
  const [wasteType, setWasteType] = useState<WasteType>('material');
  const [selectedMaterialId, setSelectedMaterialId] = useState<number>(0);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number>(0);
  const [count, setCount] = useState<number>(1);

  // ── Fetch Select Options ───────────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [WASTES_SELECT_OPTIONS_KEY],
    queryFn: wasteApi.getSelectOptions,
  });

  const materials = optionsData?.data?.materials ?? [];
  const recipes = optionsData?.data?.product_recipes ?? [];

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);

  // ── Create Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: wasteApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WASTES_KEY] });
      navigate('/dashboard/wastes');
    },
  });

  const isFormValid =
    (wasteType === 'material' ? selectedMaterialId > 0 : selectedRecipeId > 0) &&
    count >= 1;

  // ── Handlers ───────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const payload: WasteFormData =
      wasteType === 'material'
        ? { material_id: selectedMaterialId, count }
        : { product_recipe_id: selectedRecipeId, count };

    mutation.mutate(payload);
  };

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/wastes"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdDeleteOutline size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">تسجيل هالك جديد</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">اختر المادة المهدرة أو الوصفة / المنتج وحدد الكمية</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Info Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
            بيانات الهالك
          </h2>

          {/* Waste Type Choice */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              نوع العنصر المهدر <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <button
                type="button"
                onClick={() => setWasteType('material')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                  wasteType === 'material'
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${wasteType === 'material' ? 'bg-primary text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
                  <MdLayers size={22} />
                </div>
                <div>
                  <p className="font-bold text-sm">مادة خام</p>
                  <p className="text-xs text-slate-400 mt-0.5">إهدار من مخزون المواد الخام</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setWasteType('recipe')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                  wasteType === 'recipe'
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${wasteType === 'recipe' ? 'bg-primary text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
                  <MdFastfood size={22} />
                </div>
                <div>
                  <p className="font-bold text-sm">وصفة / منتج</p>
                  <p className="text-xs text-slate-400 mt-0.5">إهدار من مخزون الوصفات والمنتجات</p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-700">
            
            {/* Material selector */}
            {wasteType === 'material' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  المادة المهدرة <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  disabled={isLoadingOptions}
                  value={selectedMaterialId || ''}
                  onChange={(e) => setSelectedMaterialId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="" disabled>-- اختر المادة الخام --</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name?.ar || m.name?.en || `مادة #${m.id}`} (المخزون: {m.stock ?? 0})
                    </option>
                  ))}
                </select>
                {selectedMaterial && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    المخزون المتوفر حالياً: <span className="font-semibold text-primary">{selectedMaterial.stock ?? 0}</span>
                  </p>
                )}
              </div>
            )}

            {/* Recipe selector */}
            {wasteType === 'recipe' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  الوصفة / المنتج المهدر <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  disabled={isLoadingOptions}
                  value={selectedRecipeId || ''}
                  onChange={(e) => setSelectedRecipeId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="" disabled>-- اختر الوصفة / المنتج --</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name?.ar || r.name?.en || `وصفة #${r.id}`} (المخزون: {r.stock ?? 0})
                    </option>
                  ))}
                </select>
                {selectedRecipe && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    المخزون المتوفر حالياً: <span className="font-semibold text-primary">{selectedRecipe.stock ?? 0}</span>
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الكمية المهدرة <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="أدخل الكمية المهدرة"
              />
            </div>

          </div>
        </div>

        {/* Error message */}
        {mutation.isError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            حدث خطأ أثناء إضافة الهالك. يرجى التأكد من صحة البيانات والمحاولة مرة أخرى.
          </div>
        )}

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 z-20 lg:pr-64">
          <Link to="/dashboard/wastes"
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending || !isFormValid}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {mutation.isPending ? (
              <><AiOutlineLoading3Quarters size={18} className="animate-spin" /> جاري الحفظ...</>
            ) : (
              <><MdSave size={18} /> حفظ الهالك</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WasteAdd;
