import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { manufacturingApi, MANUFACTURING_KEY, MANUFACTURING_SELECT_OPTIONS_KEY } from '../../services/manufacturingService';
import type { 
  ManufacturingFormData, 
  ManufacturingSelectOptionsResponse,
  BranchOption,
  ManufacturingProduct,
  ManufacturingProductRecipe,
  ManufacturingMaterial,
  ManufacturingRecipePayload
} from '../../types';
import { 
  MdArrowForward, 
  MdPrecisionManufacturing, 
  MdCheckCircle, 
  MdErrorOutline, 
  MdRefresh,
  MdLayers,
  MdInfoOutline
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { renderName } from '../../utils/helpers';
import ConsumedMaterialsCards from '../../components/manufacturing/ConsumedMaterialsCards';

interface BaseRecipeItem {
  material_id: number | null;
  product_recipe_id: number | null;
  baseCount: number;
}

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
  const [specStatus, setSpecStatus] = useState<{ found: boolean; message: string } | null>(null);
  const [baseRecipes, setBaseRecipes] = useState<BaseRecipeItem[]>([]);

  // ── Fetch Select Options (scoped to selected branch for accurate stock) ───────────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery<ManufacturingSelectOptionsResponse>({
    queryKey: [MANUFACTURING_SELECT_OPTIONS_KEY, formData.branch_id],
    queryFn: () => manufacturingApi.getSelectOptions(formData.branch_id || undefined),
    enabled: true,
  });

  const branches = useMemo<BranchOption[]>(() => optionsData?.data?.branches ?? [], [optionsData?.data?.branches]);
  const products = useMemo<ManufacturingProduct[]>(() => optionsData?.data?.products ?? [], [optionsData?.data?.products]);
  const productRecipes = useMemo<ManufacturingProductRecipe[]>(() => optionsData?.data?.product_recipes ?? [], [optionsData?.data?.product_recipes]);
  const materials = useMemo<ManufacturingMaterial[]>(() => optionsData?.data?.materials ?? [], [optionsData?.data?.materials]);

  // Auto-select first branch on initial load
  useEffect(() => {
    if (!formData.branch_id && branches.length > 0) {
      setFormData(prev => ({ ...prev, branch_id: branches[0].id }));
    }
  }, [branches, formData.branch_id]);

  // ── Fetch recipe specifications when target product/recipe or branch changes ──
  const fetchSpecs = async (
    type: 'product' | 'recipe',
    targetId: number,
    branchId: number,
    countMultiplier: number = 1
  ) => {
    if (!targetId || !branchId) return;

    try {
      setIsLoadingSpecs(true);
      setSpecStatus(null);

      const params = type === 'product'
        ? { product_id: targetId, branch_id: branchId }
        : { product_recipe_id: targetId, branch_id: branchId };

      const res = await manufacturingApi.getSpecifications(params);

      if (res?.data?.recipes && Array.isArray(res.data.recipes) && res.data.recipes.length > 0) {
        const mappedBase: BaseRecipeItem[] = res.data.recipes.map((r: any) => ({
          material_id: r.material_id || null,
          product_recipe_id: r.product_recipe_id || null,
          baseCount: Number(r.count) || 1,
        }));

        setBaseRecipes(mappedBase);

        // Calculate initial required count based on produced count multiplier
        const initialRecipes: ManufacturingRecipePayload[] = mappedBase.map(b => ({
          material_id: b.material_id,
          product_recipe_id: b.product_recipe_id,
          count: Math.max(1, Math.round(b.baseCount * (countMultiplier || 1))),
        }));

        setFormData(prev => ({
          ...prev,
          recipes: initialRecipes,
        }));

        setSpecStatus({
          found: true,
          message: `تم تحميل الوصفة القياسية بنجاح (${mappedBase.length} خامة ومكون). يمكنك تعديل أو تقليل الكميات في الكروت أدناه بحرية كاملة.`,
        });
      } else {
        setBaseRecipes([]);
        setSpecStatus({
          found: false,
          message: 'لا توجد خامات مسجلة في المواصفة القياسية لهذا الصنف. يمكنك اختيار وتحديد المكونات المستهلكة يدوياً من الكروت أدناه.',
        });
      }
    } catch (err: any) {
      console.warn('Could not auto-fetch specifications:', err);
      setBaseRecipes([]);
      setSpecStatus({
        found: false,
        message: 'لا توجد تركيبة قياسية محفوظة مسبقاً لهذا الصنف في معايير التصنيع (BOM). يمكنك اختيار وتحديد المكونات المستهلكة يدوياً من الكروت أدناه.',
      });
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  // ── Create Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: manufacturingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MANUFACTURING_KEY] });
      queryClient.invalidateQueries({ queryKey: [MANUFACTURING_SELECT_OPTIONS_KEY] });
      navigate('/dashboard/manufacturing');
    },
  });

  // ── Handlers ───────────────────────────
  const handleBranchChange = (newBranchId: number) => {
    setFormData(prev => ({
      ...prev,
      branch_id: newBranchId,
    }));

    // If an item is already selected, re-fetch specs with the new branch stock
    const activeTargetId = targetType === 'product' ? formData.product_id : formData.product_recipe_id;
    if (activeTargetId && newBranchId) {
      fetchSpecs(targetType, activeTargetId, newBranchId, formData.count);
    }
  };

  const handleTargetTypeChange = (type: 'product' | 'recipe') => {
    setTargetType(type);
    setBaseRecipes([]);
    setSpecStatus(null);
    setFormData(prev => ({
      ...prev,
      product_id: 0,
      product_recipe_id: 0,
      recipes: [],
    }));
  };

  const handleProductSelect = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      product_id: productId,
      recipes: [],
    }));

    if (productId && formData.branch_id) {
      fetchSpecs('product', productId, formData.branch_id, formData.count);
    }
  };

  const handleRecipeSelect = (recipeId: number) => {
    setFormData(prev => ({
      ...prev,
      product_recipe_id: recipeId,
      recipes: [],
    }));

    if (recipeId && formData.branch_id) {
      fetchSpecs('recipe', recipeId, formData.branch_id, formData.count);
    }
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = Math.max(1, parseInt(e.target.value, 10) || 1);
    setFormData(prev => ({
      ...prev,
      count: newCount,
    }));
  };

  // Reset current recipes back to standard BOM scaled by produced count
  const handleResetToStandardBOM = () => {
    if (baseRecipes.length === 0) return;
    setFormData(prev => ({
      ...prev,
      recipes: baseRecipes.map(b => ({
        material_id: b.material_id,
        product_recipe_id: b.product_recipe_id,
        count: Math.max(1, Math.round(b.baseCount * prev.count)),
      })),
    }));
  };

  // ── Real-time Stock Analysis & Verification ───────────────────────────
  const stockAnalysis = useMemo(() => {
    let readyCount = 0;
    let deficitCount = 0;

    formData.recipes.forEach(r => {
      let stock = 0;
      if (r.material_id) {
        const mat = materials.find(m => m.id === r.material_id);
        stock = Number(mat?.stock ?? 0);
      } else if (r.product_recipe_id) {
        const rec = productRecipes.find(p => p.id === r.product_recipe_id);
        stock = Number(rec?.stock ?? 0);
      }

      if (r.count > 0 && r.count <= stock) {
        readyCount++;
      } else {
        deficitCount++;
      }
    });

    const total = formData.recipes.length;
    const hasDeficit = deficitCount > 0;
    const isAllReady = total > 0 && deficitCount === 0;

    return { total, readyCount, deficitCount, hasDeficit, isAllReady };
  }, [formData.recipes, materials, productRecipes]);

  // Determine if Manufacture Button is Mute (Disabled)
  const isMuted = 
    mutation.isPending || 
    !formData.branch_id ||
    formData.count <= 0 ||
    (targetType === 'product' && !formData.product_id) ||
    (targetType === 'recipe' && !formData.product_recipe_id) ||
    formData.recipes.length === 0 ||
    stockAnalysis.hasDeficit;

  // ── Submit ─────────────────────────────
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
    if (formData.recipes.length === 0) {
      alert('يجب تحديد المواد المستهلكة (الخامات) للتصنيع من الكروت أدناه');
      return;
    }
    if (stockAnalysis.hasDeficit) {
      alert('توجد مواد مستهلكة بها عجز بالمخزون (الكروت الحمراء). يرجى تقليل الكميات المطلوبة لتتحول للأخضر قبل الحفظ.');
      return;
    }
    
    // Clean up payloads
    const payload: ManufacturingFormData = {
      branch_id: formData.branch_id,
      product_id: targetType === 'product' ? (formData.product_id || null) : null,
      product_recipe_id: targetType === 'recipe' ? (formData.product_recipe_id || null) : null,
      count: formData.count,
      recipes: formData.recipes.map(r => ({
        material_id: r.material_id || null,
        product_recipe_id: r.product_recipe_id || null,
        count: r.count
      })).filter(r => (r.material_id || r.product_recipe_id) && r.count > 0)
    };

    mutation.mutate(payload);
  };

  const selectedTargetName = targetType === 'product'
    ? renderName(products.find(p => p.id === formData.product_id)?.name)
    : renderName(productRecipes.find(r => r.id === formData.product_recipe_id)?.name);

  return (
    <div className="w-full space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/manufacturing"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdPrecisionManufacturing size={26} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">إضافة وتشغيل أمر تصنيع جديد</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              تصنيع منتج تام أو تحضير وصفة نصف مصنعة مع فحص المخزون وتخصيص الخامات المستهلكة
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Target Item and Branch */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center justify-between">
            <span>بيانات أمر التصنيع والصنف المستهدف</span>
            <span className="text-xs text-primary font-normal bg-primary/10 px-2.5 py-1 rounded-lg">
              الخطوة 1: تحديد الفرع والصنف
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branch Selection (Required) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الفرع القائم بالتصنيع والتشغيل <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                id="branch_id"
                name="branch_id"
                value={formData.branch_id || ''}
                onChange={(val) => handleBranchChange(Number(val))}
                options={branches}
                labelExtractor={(b) => renderName(b.name) || (b.id ? `فرع #${b.id}` : '')}
                placeholder="-- اختر الفرع القائم بعملية التصنيع --"
                searchPlaceholder="ابحث عن الفرع..."
                disabled={isLoadingOptions}
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                يتم فحص وخصم أرصدة الخامات المستهلكة من مخزن هذا الفرع المحدد
              </p>
            </div>

            {/* Target Type Selector */}
            <div className="md:col-span-2 flex gap-4">
              <button
                type="button"
                onClick={() => handleTargetTypeChange('product')}
                className={`px-4 py-3 rounded-xl font-bold text-sm transition-all flex-1 border flex items-center justify-center gap-2 ${
                  targetType === 'product' 
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/25' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <MdPrecisionManufacturing size={18} />
                <span>تصنيع منتج تام الصنع (Product)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTargetTypeChange('recipe')}
                className={`px-4 py-3 rounded-xl font-bold text-sm transition-all flex-1 border flex items-center justify-center gap-2 ${
                  targetType === 'recipe' 
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/25' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <MdLayers size={18} />
                <span>تحضير وصفة نصف مصنعة (Product Recipe)</span>
              </button>
            </div>

            {/* Product / Recipe Selector */}
            {targetType === 'product' ? (
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  اختر المنتج التام <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  id="product_id"
                  name="product_id"
                  value={formData.product_id || ''}
                  onChange={(val) => handleProductSelect(Number(val))}
                  options={products}
                  labelExtractor={(p) => renderName(p.name) || (p.id ? `منتج #${p.id}` : '')}
                  placeholder="-- اختر المنتج المراد تصنيعه --"
                  searchPlaceholder="ابحث عن المنتج بالاسم..."
                  disabled={isLoadingOptions}
                  required
                />
              </div>
            ) : (
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  اختر الوصفة نصف المصنعة <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  id="product_recipe_id"
                  name="product_recipe_id"
                  value={formData.product_recipe_id || ''}
                  onChange={(val) => handleRecipeSelect(Number(val))}
                  options={productRecipes}
                  labelExtractor={(r) => renderName(r.name) || (r.id ? `وصفة #${r.id}` : '')}
                  placeholder="-- اختر الوصفة المراد تحضيرها --"
                  searchPlaceholder="ابحث عن الوصفة بالاسم..."
                  disabled={isLoadingOptions}
                  required
                />
              </div>
            )}

            {/* Produced Quantity */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الكمية المطلوب تصنيعها (عدد الوحدات) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="count"
                  required
                  min="1"
                  step="1"
                  value={formData.count}
                  onChange={handleCountChange}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
                {baseRecipes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetToStandardBOM}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 shrink-0"
                    title="إعادة ضبط كميات الخامات القياسية بناءً على عدد الوحدات"
                  >
                    <MdRefresh size={16} />
                    <span>مزامنة الوصفة القياسية (×{formData.count})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Specification loading / feedback status */}
          {isLoadingSpecs && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-primary text-xs flex items-center gap-2 font-semibold">
              <AiOutlineLoading3Quarters className="animate-spin text-sm" />
              <span>جاري استدعاء الوصفة القياسية للمنتج وفحص أرصدة مخزن الفرع المحدد...</span>
            </div>
          )}

          {!isLoadingSpecs && specStatus && (
            <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 font-semibold border ${
              specStatus.found
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
            }`}>
              {specStatus.found ? (
                <MdCheckCircle size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <MdInfoOutline size={18} className="text-amber-600 shrink-0" />
              )}
              <span>{specStatus.message}</span>
            </div>
          )}
        </div>

        {/* Section 2: Consumed Materials Cards (Displayed for BOTH product & recipe) */}
        {(formData.product_id > 0 || formData.product_recipe_id > 0 || formData.recipes.length > 0) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-5">
            {/* Section Header with live analysis badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span>المواد والخامات المستهلكة في التصنيع</span>
                  {selectedTargetName && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary">
                      {selectedTargetName}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  تظهر المكونات المتوفرة بالمخزن <span className="text-emerald-600 font-bold">باللون الأخضر 🟢</span>، 
                  والمكونات التي بها عجز <span className="text-rose-600 font-bold">باللون الأحمر 🔴</span>. 
                  يمكنك تعديل الكميات مباشرة في الكروت حتى تصبح جميعها خضراء لتفعيل زر التصنيع.
                </p>
              </div>

              {/* Status Counters */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                  الإجمالي: {stockAnalysis.total}
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                  <MdCheckCircle size={14} className="text-emerald-600" />
                  <span>متوفر: {stockAnalysis.readyCount}</span>
                </span>
                {stockAnalysis.deficitCount > 0 && (
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 flex items-center gap-1 animate-pulse">
                    <MdErrorOutline size={14} className="text-rose-600" />
                    <span>عجز: {stockAnalysis.deficitCount}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Live Deficit Notice Banner */}
            {stockAnalysis.hasDeficit ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-400 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 font-bold">
                  <MdErrorOutline size={22} className="text-rose-600 shrink-0" />
                  <span>
                    زر التصنيع معطل (Mute): يوجد عجز في أرصدة ({stockAnalysis.deficitCount}) خامات بالمخزن. 
                    يرجى تعديل أو تقليل الكمية المطلوبة في الكروت الحمراء لتناسب رصيد المخزن المتاح حتى تتحول إلى اللون الأخضر.
                  </span>
                </div>
              </div>
            ) : stockAnalysis.isAllReady ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 font-bold shadow-2xs">
                <MdCheckCircle size={22} className="text-emerald-600 shrink-0" />
                <span>
                  مكتمل وجاهز! جميع الخامات والمكونات متوفرة برصيد كافٍ في مخزن الفرع (كافة الكروت باللون الأخضر). زر التصنيع مفعل الآن.
                </span>
              </div>
            ) : null}

            {/* Consumed Materials Cards Component */}
            <ConsumedMaterialsCards
              materials={materials}
              productRecipes={productRecipes}
              recipes={formData.recipes}
              onChange={(newRecipes) => setFormData(prev => ({ ...prev, recipes: newRecipes }))}
              isTargetRecipe={targetType === 'recipe'}
              isStandardBOM={false}
            />
          </div>
        )}

        {/* Error message from API */}
        {mutation.isError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {(mutation.error as any)?.response?.data?.message || 'حدث خطأ أثناء تنفيذ عملية التصنيع. تأكد من صحة البيانات ورصيد المخزن بالفرع.'}
          </div>
        )}

        {/* Sticky Footer Bar with Action Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 z-30 lg:pr-64">
          <div className="text-xs">
            {stockAnalysis.hasDeficit ? (
              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <MdErrorOutline size={16} />
                زر التصنيع معطل: يوجد عجز في أرصدة {stockAnalysis.deficitCount} خامات بالمخزن. قلل الكميات حتى تتحول للأخضر.
              </span>
            ) : stockAnalysis.isAllReady ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <MdCheckCircle size={16} />
                جميع المكونات متوفرة برصيد كافٍ — جاهز للتصنيع والتشغيل الفوري.
              </span>
            ) : (
              <span className="text-slate-500">
                حدد الفرع والصنف ثم تأكد من كفاية أرصدة الخامات لتنفيذ أمر التصنيع
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/dashboard/manufacturing"
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
              إلغاء
            </Link>

            <button
              type="submit"
              disabled={isMuted}
              className={`flex items-center gap-2 px-7 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                isMuted
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-slate-700 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:shadow-lg hover:shadow-emerald-600/40 cursor-pointer active:scale-95'
              }`}
              title={isMuted ? 'زر التصنيع معطل: يرجى استيفاء الشروط وتحويل جميع الكروت إلى الأخضر' : 'تأكيد وحفظ أمر التصنيع'}
            >
              {mutation.isPending ? (
                <>
                  <AiOutlineLoading3Quarters size={18} className="animate-spin" />
                  <span>جاري تنفيذ التصنيع...</span>
                </>
              ) : (
                <>
                  <MdPrecisionManufacturing size={20} />
                  <span>حفظ وتأكيد أمر التصنيع</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ManufacturingAdd;
