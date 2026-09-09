import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { manufacturingApi, MANUFACTURING_KEY, MANUFACTURING_SELECT_OPTIONS_KEY } from '../../services/manufacturingService';
import type { ManufacturingFormData, ManufacturingRecipePayload } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { MdArrowForward, MdSave, MdEdit, MdAdd, MdDelete } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const ManufacturingEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<ManufacturingFormData>({
    product_id: 0,
    product_recipe_id: 0,
    count: 1,
    recipes: [],
  });

  const [targetType, setTargetType] = useState<'product' | 'recipe'>('product');

  // ── Fetch Data ─────────────────────────
  const { data: itemData, isLoading: isLoadingItem, isError: isErrorItem, error: errorItem, refetch: refetchItem } = useQuery({
    queryKey: [MANUFACTURING_KEY, id],
    queryFn: () => manufacturingApi.get(id as string),
    enabled: !!id,
  });

  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [MANUFACTURING_SELECT_OPTIONS_KEY],
    queryFn: manufacturingApi.getSelectOptions,
  });

  const item = itemData?.data;
  const products = optionsData?.data?.products ?? [];
  const productRecipes = optionsData?.data?.product_recipes ?? [];
  const materials = optionsData?.data?.materials ?? [];

  // Populate form
  useEffect(() => {
    if (item) {
      const type = item.product_id ? 'product' : 'recipe';
      setTargetType(type);
      setFormData({
        product_id: item.product_id || 0,
        product_recipe_id: item.product_recipe_id || 0,
        count: item.count || 1,
        recipes: (item.recipes || []).map(r => ({
          material_id: r.material_id || 0,
          product_recipe_id: r.product_recipe_id || 0,
          count: r.count || 1,
        })),
      });
    }
  }, [item]);

  // ── Update Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: (payload: ManufacturingFormData) => manufacturingApi.update(id as string, payload),
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

  if (isLoadingItem) return <LoadingSpinner text="جاري تحميل بيانات القائمة..." />;
  if (isErrorItem) return <ErrorFallback error={errorItem} onRetry={refetchItem} />;

  return (
    <div className="w-full space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/manufacturing"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdEdit size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">تعديل قائمة تصنيع</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">تعديل مكونات وكمية التصنيع</p>
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
            <div className="md:col-span-2 flex gap-4">
              <button type="button" onClick={() => handleTargetTypeChange('product')}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex-1 border ${
                  targetType === 'product' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}>
                تصنيع منتج جاهز
              </button>
              <button type="button" onClick={() => handleTargetTypeChange('recipe')}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex-1 border ${
                  targetType === 'recipe' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}>
                تحضير وصفة (شبه مصنع)
              </button>
            </div>

            {targetType === 'product' ? (
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">اختر المنتج *</label>
                <select name="product_id" required value={formData.product_id || ''} onChange={handleMainChange} disabled={isLoadingOptions}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-primary">
                  <option value="" disabled>-- اختر المنتج --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name?.ar}</option>)}
                </select>
              </div>
            ) : (
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">اختر الوصفة *</label>
                <select name="product_recipe_id" required value={formData.product_recipe_id || ''} onChange={handleMainChange} disabled={isLoadingOptions}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-primary">
                  <option value="" disabled>-- اختر الوصفة --</option>
                  {productRecipes.map(p => <option key={p.id} value={p.id}>{p.name?.ar}</option>)}
                </select>
              </div>
            )}

            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">الكمية المنتجة *</label>
              <input type="number" name="count" required min="1" value={formData.count} onChange={handleMainChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* Section 2: Consumed Materials */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">المواد المستهلكة (الخامات)</h2>
            <button type="button" onClick={handleAddRecipeItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
              <MdAdd size={18} /> إضافة مادة
            </button>
          </div>

          <div className="space-y-4">
            {formData.recipes.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row items-end gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold mb-1.5">اختر مادة خام أو وصفة</label>
                  <select
                    value={item.material_id ? `m_${item.material_id}` : item.product_recipe_id ? `r_${item.product_recipe_id}` : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith('m_')) handleRecipeChange(index, 'material_id', val.replace('m_', ''));
                      else if (val.startsWith('r_')) handleRecipeChange(index, 'product_recipe_id', val.replace('r_', ''));
                    }}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-primary text-sm"
                  >
                    <option value="" disabled>-- اختر المادة --</option>
                    <optgroup label="المواد الخام">
                      {materials.map(m => <option key={`m_${m.id}`} value={`m_${m.id}`}>{m.name?.ar}</option>)}
                    </optgroup>
                    <optgroup label="وصفات شبه مصنعة">
                      {productRecipes.map(r => <option key={`r_${r.id}`} value={`r_${r.id}`}>{r.name?.ar}</option>)}
                    </optgroup>
                  </select>
                </div>

                <div className="w-full md:w-32">
                  <label className="block text-xs font-semibold mb-1.5">الكمية</label>
                  <input type="number" min="1" step="0.01" required value={item.count}
                    onChange={(e) => handleRecipeChange(index, 'count', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-center text-sm" />
                </div>

                {formData.recipes.length > 1 && (
                  <button type="button" onClick={() => handleRemoveRecipeItem(index)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <MdDelete size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {mutation.isError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border-red-200 text-red-600 text-sm">
            حدث خطأ أثناء حفظ التعديلات.
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t flex justify-end gap-3 z-20 lg:pr-64">
          <Link to="/dashboard/manufacturing"
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 text-sm">
            إلغاء
          </Link>
          <button type="submit" disabled={mutation.isPending || (!formData.product_id && !formData.product_recipe_id) || formData.recipes.length === 0}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg disabled:opacity-60">
            {mutation.isPending ? <><AiOutlineLoading3Quarters size={18} className="animate-spin" /> جاري الحفظ...</> : <><MdSave size={18} /> حفظ التعديلات</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManufacturingEdit;
