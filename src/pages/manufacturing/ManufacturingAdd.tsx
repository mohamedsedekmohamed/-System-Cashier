import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { manufacturingApi, MANUFACTURING_KEY, MANUFACTURING_SELECT_OPTIONS_KEY } from '../../services/manufacturingService';
import type { 
  ManufacturingFormData, 
  ManufacturingSelectOptionsResponse,
  BranchOption,
  ManufacturingProduct,
  ManufacturingProductRecipe,
  ManufacturingMaterial
} from '../../types';
import { MdArrowForward, MdSave, MdPrecisionManufacturing } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { renderName } from '../../utils/helpers';
import ConsumedMaterialsCards from '../../components/manufacturing/ConsumedMaterialsCards';

const ManufacturingAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<ManufacturingFormData>({
    branch_id: 0,
    product_id: 0,
    product_recipe_id: 0,
    count: 1,
    recipes: [],
  });

  const [targetType, setTargetType] = useState<'product' | 'recipe'>('product');
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);

  // ── Fetch Select Options ───────────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery<ManufacturingSelectOptionsResponse>({
    queryKey: [MANUFACTURING_SELECT_OPTIONS_KEY],
    queryFn: () => manufacturingApi.getSelectOptions(),
  });

  const branches: BranchOption[] = optionsData?.data?.branches ?? [];
  const products: ManufacturingProduct[] = optionsData?.data?.products ?? [];
  const productRecipes: ManufacturingProductRecipe[] = optionsData?.data?.product_recipes ?? [];
  const materials: ManufacturingMaterial[] = optionsData?.data?.materials ?? [];

  // Auto-select first branch
  React.useEffect(() => {
    if (!formData.branch_id && branches.length > 0) {
      setFormData(prev => ({ ...prev, branch_id: branches[0].id }));
    }
  }, [branches, formData.branch_id]);

  // Fetch recipe specifications when target recipe and branch change
  const fetchSpecs = async (recipeId?: number, branchId?: number) => {
    const targetBranch = branchId || formData.branch_id;
    if (!recipeId || !targetBranch) return;
    try {
      setIsLoadingSpecs(true);
      const res = await manufacturingApi.getSpecifications({
        product_recipe_id: recipeId || undefined,
        branch_id: targetBranch,
      });
      if (res?.data?.recipes && Array.isArray(res.data.recipes) && res.data.recipes.length > 0) {
        setFormData(prev => ({
          ...prev,
          recipes: res.data.recipes.map((r: any) => ({
            material_id: r.material_id || 0,
            product_recipe_id: r.product_recipe_id || 0,
            count: r.count || 1,
          }))
        }));
      }
    } catch (err) {
      console.warn('Could not auto-fetch specifications:', err);
    } finally {
      setIsLoadingSpecs(false);
    }
  };

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
    const val = Number(value);
    setFormData(prev => ({
      ...prev,
      [name]: val,
    }));

    if (name === 'product_recipe_id' && targetType === 'recipe') {
      fetchSpecs(val, formData.branch_id);
    } else if (name === 'branch_id' && targetType === 'recipe') {
      fetchSpecs(formData.product_recipe_id || undefined, val);
    }
  };

  const handleTargetTypeChange = (type: 'product' | 'recipe') => {
    setTargetType(type);
    setFormData(prev => ({
      ...prev,
      product_id: type === 'product' ? prev.product_id : 0,
      product_recipe_id: type === 'recipe' ? prev.product_recipe_id : 0,
      recipes: [],
    }));
  };

  const hasStockExceeded = React.useMemo(() => {
    return formData.recipes.some(r => {
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
  }, [formData.recipes, materials, productRecipes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branch_id) {
      alert('يرجى تحديد الفرع القائم بالتصنيع');
      return;
    }
    if (targetType === 'product' && (!formData.product_id || formData.count <= 0)) {
      alert('يرجى تحديد المنتج المستهدف والكمية المنتجة');
      return;
    }
    if (targetType === 'recipe' && (!formData.product_recipe_id || formData.count <= 0)) {
      alert('يرجى تحديد الوصفة المستهدفة والكمية المنتجة');
      return;
    }
    if (targetType === 'recipe' && formData.recipes.length === 0) {
      alert('لتحضير الوصفة، يجب اختيار المواد المستهلكة (الخامات) من الكروت أدناه');
      return;
    }
    if (hasStockExceeded) {
      alert('توجد مواد مستهلكة تتجاوز رصيد المخزن المتاح! يرجى تعديل الكميات قبل الحفظ.');
      return;
    }
    
    // Clean up payloads
    const payload: ManufacturingFormData = {
      ...formData,
      branch_id: formData.branch_id,
      product_id: targetType === 'product' ? (formData.product_id || null) : null,
      product_recipe_id: targetType === 'recipe' ? (formData.product_recipe_id || null) : null,
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
            {/* Branch Selection (Required) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الفرع القائم بالتصنيع <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                id="branch_id"
                name="branch_id"
                value={formData.branch_id || ''}
                onChange={(val) => {
                  const bId = Number(val);
                  setFormData(prev => ({ ...prev, branch_id: bId, product_id: 0, product_recipe_id: 0, recipes: [] }));
                }}
                options={branches}
                labelExtractor={(b) => renderName(b.name) || (b.id ? `فرع #${b.id}` : '')}
                placeholder="-- اختر الفرع القائم بعملية التصنيع --"
                searchPlaceholder="ابحث عن الفرع..."
                disabled={isLoadingOptions}
                required
              />
            </div>

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
                <SearchableSelect
                  id="product_id"
                  name="product_id"
                  value={formData.product_id || ''}
                  onChange={(val) => handleMainChange({ target: { name: 'product_id', value: val } } as any)}
                  options={products}
                  labelExtractor={(p) => renderName(p.name) || (p.id ? `منتج #${p.id}` : '')}
                  placeholder="-- اختر المنتج --"
                  searchPlaceholder="ابحث عن المنتج..."
                  disabled={isLoadingOptions}
                  required
                />
              </div>
            ) : (
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  اختر الوصفة <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  id="product_recipe_id"
                  name="product_recipe_id"
                  value={formData.product_recipe_id || ''}
                  onChange={(val) => handleMainChange({ target: { name: 'product_recipe_id', value: val } } as any)}
                  options={productRecipes}
                  labelExtractor={(r) => renderName(r.name) || (r.id ? `وصفة #${r.id}` : '')}
                  placeholder="-- اختر الوصفة --"
                  searchPlaceholder="ابحث عن الوصفة..."
                  disabled={isLoadingOptions}
                  required
                />
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

        {/* Section 2: Consumed Materials (Raw ingredients) - ONLY for Recipe Preparation */}
        {targetType === 'recipe' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span>المواد المستهلكة (الخامات)</span>
                  <span className="text-xs text-red-500 font-semibold">* مطلوبة لتحضير الوصفة</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  اختر المواد الخام أو الوصفات شبه المصنعة المستهلكة في إعداد الوصفة من الكروت أدناه (يجب توفر كمية بالمخزن)
                </p>
              </div>
              {isLoadingSpecs && (
                <span className="text-xs text-primary flex items-center gap-1 font-normal shrink-0">
                  <AiOutlineLoading3Quarters className="animate-spin text-xs" /> جاري تحميل المكونات...
                </span>
              )}
            </div>

            <ConsumedMaterialsCards
              materials={materials}
              productRecipes={productRecipes}
              recipes={formData.recipes}
              onChange={(newRecipes) => setFormData(prev => ({ ...prev, recipes: newRecipes }))}
              isTargetRecipe={true}
            />
          </div>
        )}

        {/* Error message */}
        {mutation.isError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            حدث خطأ أثناء حفظ قائمة التصنيع. تأكد من إدخال جميع البيانات المطلوبة وصحة رصيد المخزن.
          </div>
        )}

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 z-20 lg:pr-64">
          <Link to="/dashboard/manufacturing"
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={
              mutation.isPending || 
              !formData.branch_id ||
              formData.count <= 0 ||
              (targetType === 'product' && !formData.product_id) ||
              (targetType === 'recipe' && (!formData.product_recipe_id || formData.recipes.length === 0 || hasStockExceeded))
            }
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
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
