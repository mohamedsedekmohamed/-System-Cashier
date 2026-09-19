import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { manufacturingApi, MANUFACTURING_KEY, MANUFACTURING_SELECT_OPTIONS_KEY } from '../../services/manufacturingService';
import type { ManufacturingFormData, ManufacturingRecipePayload } from '../../types';
import { MdArrowForward, MdSave, MdPrecisionManufacturing, MdAdd, MdDelete } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const ManufacturingAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<ManufacturingFormData>({
    product_id: 0,
    product_recipe_id: 0,
    count: 1,
    recipes: [
      { material_id: 0, product_recipe_id: 0, count: 1 }
    ],
  });

  const [targetType, setTargetType] = useState<'product' | 'recipe'>('product');

  // ── Fetch Select Options ───────────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [MANUFACTURING_SELECT_OPTIONS_KEY],
    queryFn: manufacturingApi.getSelectOptions,
  });

  const products = optionsData?.data?.products ?? [];
  const productRecipes = optionsData?.data?.product_recipes ?? [];
  const materials = optionsData?.data?.materials ?? [];

  // ── Create Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: manufacturingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MANUFACTURING_KEY] });
      navigate('/dashboard/manufacturing');
    },
  });

  // ── Handlers ───────────────────────────
  const handleMainChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleTargetTypeChange = (type: 'product' | 'recipe') => {
    setTargetType(type);
    setFormData(prev => ({
      ...prev,
      product_id: type === 'product' ? prev.product_id : 0,
      product_recipe_id: type === 'recipe' ? prev.product_recipe_id : 0,
    }));
  };

  const handleAddRecipeItem = () => {
    setFormData(prev => ({
      ...prev,
      recipes: [...prev.recipes, { material_id: 0, product_recipe_id: 0, count: 1 }]
    }));
  };

  const handleRemoveRecipeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipes: prev.recipes.filter((_, i) => i !== index)
    }));
  };

  const handleRecipeChange = (index: number, field: keyof ManufacturingRecipePayload, value: string) => {
    const val = Number(value);
    setFormData(prev => {
      const newRecipes = [...prev.recipes];
      
      // If setting material, clear product_recipe and vice versa
      if (field === 'material_id') {
        newRecipes[index] = { ...newRecipes[index], material_id: val, product_recipe_id: 0 };
      } else if (field === 'product_recipe_id') {
        newRecipes[index] = { ...newRecipes[index], product_recipe_id: val, material_id: 0 };
      } else {
        newRecipes[index] = { ...newRecipes[index], [field]: val };
      }
      
      return { ...prev, recipes: newRecipes };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!formData.product_id && !formData.product_recipe_id) || formData.count <= 0) return;
    
    // Clean up payloads
    const payload: ManufacturingFormData = {
      ...formData,
      product_id: formData.product_id || null,
      product_recipe_id: formData.product_recipe_id || null,
      recipes: formData.recipes.map(r => ({
        material_id: r.material_id || null,
        product_recipe_id: r.product_recipe_id || null,
        count: r.count
      })).filter(r => (r.material_id || r.product_recipe_id) && r.count > 0)
    };

    mutation.mutate(payload);
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/manufacturing"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdPrecisionManufacturing size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">إضافة قائمة تصنيع جديدة</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">تسجيل عملية تصنيع لمنتج أو وصفة مع تحديد المواد المستهلكة</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Target Item */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
            المُنتَج المستهدف
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Type Selector */}
            <div className="md:col-span-2 flex gap-4">
              <button
                type="button"
                onClick={() => handleTargetTypeChange('product')}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex-1 border ${
                  targetType === 'product' 
                    ? 'bg-primary/10 border-primary/40 text-primary shadow-2xs' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                تصنيع منتج جاهز
              </button>
              <button
                type="button"
                onClick={() => handleTargetTypeChange('recipe')}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex-1 border ${
                  targetType === 'recipe' 
                    ? 'bg-primary/10 border-primary/40 text-primary shadow-2xs' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                تحضير وصفة (شبه مصنع)
              </button>
            </div>

            {/* Selector */}
            {targetType === 'product' ? (
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  اختر المنتج <span className="text-red-500">*</span>
                </label>
                <select name="product_id" required
                  value={formData.product_id || ''} onChange={handleMainChange}
                  disabled={isLoadingOptions}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                  <option value="" disabled>-- اختر المنتج --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name?.ar}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  اختر الوصفة <span className="text-red-500">*</span>
                </label>
                <select name="product_recipe_id" required
                  value={formData.product_recipe_id || ''} onChange={handleMainChange}
                  disabled={isLoadingOptions}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                  <option value="" disabled>-- اختر الوصفة --</option>
                  {productRecipes.map(p => (
                    <option key={p.id} value={p.id}>{p.name?.ar}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Count */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الكمية المنتجة <span className="text-red-500">*</span>
              </label>
              <input type="number" name="count" required min="1"
                value={formData.count} onChange={handleMainChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Consumed Materials */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              المواد المستهلكة (الخامات)
            </h2>
            <button type="button" onClick={handleAddRecipeItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold">
              <MdAdd size={18} />
              إضافة مادة
            </button>
          </div>

          <div className="space-y-4">
            {formData.recipes.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row items-end gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs relative group">
                
                {/* Material Selection */}
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    اختر مادة خام أو وصفة *
                  </label>
                  <select
                    value={item.material_id ? `m_${item.material_id}` : item.product_recipe_id ? `r_${item.product_recipe_id}` : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith('m_')) {
                        handleRecipeChange(index, 'material_id', val.replace('m_', ''));
                      } else if (val.startsWith('r_')) {
                        handleRecipeChange(index, 'product_recipe_id', val.replace('r_', ''));
                      }
                    }}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm shadow-2xs transition-all"
                  >
                    <option value="" disabled className="text-slate-400">-- اختر المادة --</option>
                    <optgroup label="المواد الخام" className="font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {materials.map(m => (
                        <option key={`m_${m.id}`} value={`m_${m.id}`} className="font-normal text-slate-800 dark:text-slate-100">{m.name?.ar}</option>
                      ))}
                    </optgroup>
                    <optgroup label="وصفات شبه مصنعة" className="font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {productRecipes.map(r => (
                        <option key={`r_${r.id}`} value={`r_${r.id}`} className="font-normal text-slate-800 dark:text-slate-100">{r.name?.ar}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Amount */}
                <div className="w-full md:w-36">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    الكمية *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={item.count}
                    onChange={(e) => handleRecipeChange(index, 'count', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm text-center font-bold shadow-2xs transition-all"
                  />
                </div>

                {/* Delete Button */}
                {formData.recipes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipeItem(index)}
                    className="p-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                    title="حذف المادة"
                  >
                    <MdDelete size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error message */}
        {mutation.isError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            حدث خطأ أثناء حفظ قائمة التصنيع. تأكد من إدخال جميع البيانات المطلوبة.
          </div>
        )}

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 z-20 lg:pr-64">
          <Link to="/dashboard/manufacturing"
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
            إلغاء
          </Link>
          <button type="submit" disabled={mutation.isPending || (!formData.product_id && !formData.product_recipe_id) || formData.recipes.length === 0}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {mutation.isPending ? (
              <><AiOutlineLoading3Quarters size={18} className="animate-spin" /> جاري الحفظ...</>
            ) : (
              <><MdSave size={18} /> حفظ وتأكيد</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManufacturingAdd;
