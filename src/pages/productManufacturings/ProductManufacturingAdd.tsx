import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  productManufacturingApi, 
  PRODUCT_MANUFACTURING_KEY, 
  PRODUCT_MANUFACTURING_SELECT_OPTIONS_KEY 
} from '../../services/productManufacturingService';
import { unitApi, ALL_UNITS_KEY } from '../../services/unitService';
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
  MdLayers
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { renderName } from '../../utils/helpers';
import ConsumedMaterialsCards from '../../components/manufacturing/ConsumedMaterialsCards';

const ProductManufacturingAdd: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const urlType = searchParams.get('type');
  const initialTargetType = (urlType === 'unfinished' || urlType === 'recipe') ? 'recipe' : 'product';

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<ProductManufacturingFormData>({
    product_id: 0,
    product_recipe_id: 0,
    recipes: [],
  });

  const [targetType, setTargetType] = useState<'product' | 'recipe'>(initialTargetType);

  // ── Fetch Select Options ───────────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery<ProductManufacturingSelectOptionsResponse>({
    queryKey: [PRODUCT_MANUFACTURING_SELECT_OPTIONS_KEY, targetType],
    queryFn: () => productManufacturingApi.getSelectOptions(targetType === 'product' ? 'finished' : 'unfinished'),
  });

  // ── Fetch Units ─────────────────────────
  const { data: units = [] } = useQuery({
    queryKey: [ALL_UNITS_KEY],
    queryFn: () => unitApi.getAll(),
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
    setFormData({
      product_id: 0,
      product_recipe_id: 0,
      recipes: [],
    });
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
      alert(
        targetType === 'product'
          ? 'يجب إضافة وصفة تحضيرية واحدة على الأقل لتركيبة المنتج'
          : 'يجب إضافة مادة خام واحدة على الأقل لتركيبة المنتج غير المنتهي'
      );
      return;
    }

    // Validate that unit_id is set for every recipe/material
    const missingUnit = formData.recipes.some(r => !r.unit_id);
    if (missingUnit) {
      alert('⚠️ حقل وحدة القياس (unit_id) إلزامي لكل مادة خام أو وصفة تدخل في تكوين المنتج. يرجى اختيار الوحدة لكل العناصر المحددة.');
      return;
    }

    const materialsPayload = formData.recipes
      .filter(r => r.material_id)
      .map(r => ({
        material_id: Number(r.material_id),
        count: Number(r.count) || 1,
        unit_id: Number(r.unit_id),
      }));

    const productRecipesPayload = formData.recipes
      .filter(r => r.product_recipe_id)
      .map(r => ({
        product_recipe_id: Number(r.product_recipe_id),
        count: Number(r.count) || 1,
        unit_id: Number(r.unit_id),
      }));

    const payload: any = {
      ...(targetType === 'product'
        ? { product_id: Number(formData.product_id) }
        : { product_recipe_id: Number(formData.product_recipe_id) }),
      materials: materialsPayload,
      product_recipes: productRecipesPayload,
      recipes: formData.recipes.map(r => ({
        material_id: r.material_id ? Number(r.material_id) : null,
        product_recipe_id: r.product_recipe_id ? Number(r.product_recipe_id) : null,
        count: Number(r.count) || 1,
        unit_id: Number(r.unit_id),
      })),
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
              تحديد المكونات والخامات القياسية ووحداتها اللازمة لتصنيع وحدة واحدة من المنتج
            </p>
          </div>
        </div>

        <Link
          to="/dashboard/product-manufacturings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700"
        >
          <MdArrowForward size={18} />
          <span>العودة للقائمة</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Type Selection & Target Selection */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          {/* Target Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span>نوع الصنف المراد تحديد معيار تصنيعه:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <button
                type="button"
                onClick={() => handleTargetTypeChange('product')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-start transition-all ${
                  targetType === 'product'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${targetType === 'product' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <MdFastfood size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">منتج جاهز للبيع (Finished Product)</p>
                  <p className="text-xs opacity-75">يتكون من وصفات تصنيع شبه مصنعة</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTargetTypeChange('recipe')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-start transition-all ${
                  targetType === 'recipe'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${targetType === 'recipe' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <MdLayers size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">منتج غير منتهي (Recipe / Semi-finished)</p>
                  <p className="text-xs opacity-75">يتكون من مواد خام أساسية</p>
                </div>
              </button>
            </div>
          </div>

          {/* Select Target (Product or Recipe) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            {targetType === 'product' ? (
              <div className="max-w-xl space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
              <div className="max-w-xl space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  اختر المنتج غير المنتهي / الوصفة <span className="text-rose-500">*</span>
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
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {targetType === 'product'
                ? '2. تحديد الوصفات التحضيرية الداخلة في التصنيع ووحداتها (لكل 1 قطعة / وحدة)'
                : '2. تحديد المواد الخام الداخلة في التصنيع ووحداتها (لكل 1 قطعة / وحدة)'}
            </h2>
            <span className="text-xs text-rose-500 font-semibold">
              * اختيار وحدة القياس إلزامي لجميع العناصر
            </span>
          </div>
          
          <ConsumedMaterialsCards
            materials={targetType === 'recipe' ? materials : []}
            productRecipes={targetType === 'product' ? productRecipes : []}
            units={units}
            recipes={formData.recipes}
            onChange={handleRecipesChange}
            isStandardBOM={true}
            allowedType={targetType === 'product' ? 'recipes_only' : 'materials_only'}
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
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/95 transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
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
