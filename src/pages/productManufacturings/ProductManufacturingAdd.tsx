import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  productManufacturingApi, 
  PRODUCT_MANUFACTURING_KEY, 
  PRODUCT_MANUFACTURING_SELECT_OPTIONS_KEY 
} from '../../services/productManufacturingService';
import type { 
  ProductManufacturingFormData, 
  ProductManufacturingSelectOptionsResponse,
  ManufacturingProduct,
  ManufacturingProductRecipe,
  ManufacturingMaterial,
  ManufacturingRecipePayload
} from '../../types';
import { 
  MdArrowForward, 
  MdSave, 
  MdSchema, 
  MdFastfood, 
  MdLayers,
  MdInfoOutline
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { renderName } from '../../utils/helpers';
import ConsumedMaterialsCards from '../../components/manufacturing/ConsumedMaterialsCards';

const ProductManufacturingAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<ProductManufacturingFormData>({
    product_id: 0,
    product_recipe_id: 0,
    recipes: [],
  });

  const [targetType, setTargetType] = useState<'product' | 'recipe'>('product');

  // ── Fetch Select Options ───────────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery<ProductManufacturingSelectOptionsResponse>({
    queryKey: [PRODUCT_MANUFACTURING_SELECT_OPTIONS_KEY],
    queryFn: () => productManufacturingApi.getSelectOptions(),
  });

  const products: ManufacturingProduct[] = optionsData?.data?.products ?? [];
  const productRecipes: ManufacturingProductRecipe[] = optionsData?.data?.product_recipes ?? [];
  const materials: ManufacturingMaterial[] = optionsData?.data?.materials ?? [];

  // ── Create Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: productManufacturingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_MANUFACTURING_KEY] });
      navigate('/dashboard/product-manufacturings');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'حدث خطأ أثناء حفظ معيار التصنيع.';
      alert(msg);
    }
  });

  // ── Handlers ───────────────────────────
  const handleTargetTypeChange = (type: 'product' | 'recipe') => {
    setTargetType(type);
    setFormData(prev => ({
      ...prev,
      product_id: 0,
      product_recipe_id: 0,
    }));
  };

  const handleRecipesChange = (newRecipes: ManufacturingRecipePayload[]) => {
    setFormData(prev => ({
      ...prev,
      recipes: newRecipes
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === 'product' && !formData.product_id) {
      alert('يرجى تحديد المنتج الجاهز المراد وضع معيار تصنيع له');
      return;
    }

    if (targetType === 'recipe' && !formData.product_recipe_id) {
      alert('يرجى تحديد المنتج غير منتهي التصنيع المراد وضع معيار له');
      return;
    }

    if (!formData.recipes || formData.recipes.length === 0) {
      alert('يجب إضافة مادة خام أو مكون واحد على الأقل لتحديد تركيبة المنتج');
      return;
    }

    const payload: ProductManufacturingFormData = {
      product_id: targetType === 'product' ? (formData.product_id || null) : null,
      product_recipe_id: targetType === 'recipe' ? (formData.product_recipe_id || null) : null,
      recipes: formData.recipes.map(r => ({
        material_id: r.material_id ? Number(r.material_id) : null,
        product_recipe_id: r.product_recipe_id ? Number(r.product_recipe_id) : null,
        count: Number(r.count) || 1,
      }))
    };

    mutation.mutate(payload);
  };

  const productOptions = products.map(p => ({
    value: p.id,
    label: renderName(p.name) || `منتج #${p.id}`
  }));

  const recipeOptions = productRecipes.map(r => ({
    value: r.id,
    label: renderName(r.name) || `صنف #${r.id}`
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <MdSchema size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              إضافة معيار تصنيع لمنتج (BOM)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              تحديد المكونات والخامات القياسية اللازمة لتصنيع وحدة واحدة من المنتج
            </p>
          </div>
        </div>

        <Link
          to="/dashboard/product-manufacturings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700"
        >
          <MdArrowForward size={18} />
          العودة للقائمة
        </Link>
      </div>

      {/* Info Alert */}
      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl flex items-start gap-3">
        <MdInfoOutline className="text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" size={20} />
        <div className="text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
          <strong>ملاحظة:</strong> هنا تقوم بتعريف <strong>المعيار القياسي العام</strong> للمنتج (المكونات والنسب الثابتة). 
          هذا الحفظ لا يؤثر على المخزون الفعلي، وعندما يقوم أي فرع ببدء أمر تصنيع وتشغيل، سيقوم النظام تلقائياً باقتراح هذه المكونات التي تسجلها هنا.
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
            1. تحديد الصنف المستهدف
          </h2>

          {/* Type Toggle Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              نوع الصنف المراد ضبط معيار تصنيعه
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => handleTargetTypeChange('product')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold border transition-all ${
                  targetType === 'product'
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <MdFastfood size={18} />
                منتج نهائي جاهز
              </button>

              <button
                type="button"
                onClick={() => handleTargetTypeChange('recipe')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold border transition-all ${
                  targetType === 'recipe'
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <MdLayers size={18} />
                منتج غير منتهي التصنيع
              </button>
            </div>
          </div>

          {/* Target Select Dropdown */}
          <div className="max-w-md">
            {targetType === 'product' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  اختر المنتج الجاهز <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={productOptions}
                  value={formData.product_id || ''}
                  onChange={(val) => setFormData(prev => ({ ...prev, product_id: Number(val) }))}
                  placeholder="ابحث واختر المنتج..."
                  disabled={isLoadingOptions}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  اختر الصنف التحضيري (غير منتهي التصنيع) <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={recipeOptions}
                  value={formData.product_recipe_id || ''}
                  onChange={(val) => setFormData(prev => ({ ...prev, product_recipe_id: Number(val) }))}
                  placeholder="ابحث واختر الصنف..."
                  disabled={isLoadingOptions}
                />
              </div>
            )}
          </div>
        </div>

        {/* Consumed Materials Component */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 px-1">
            2. تحديد المكونات والخامات المستخدمة (لكل 1 قطعة / وحدة)
          </h2>
          
          <ConsumedMaterialsCards
            materials={materials}
            productRecipes={productRecipes}
            recipes={formData.recipes}
            onChange={handleRecipesChange}
            isTargetRecipe={targetType === 'recipe'}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            to="/dashboard/product-manufacturings"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/95 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin" size={18} />
                جاري الحفظ...
              </>
            ) : (
              <>
                <MdSave size={18} />
                حفظ معيار التصنيع
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductManufacturingAdd;
