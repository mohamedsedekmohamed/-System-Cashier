import React, { useState } from 'react';
import type { ProductVariation } from '../../types';
import { 
  MdTune, 
  MdAdd, 
  MdDelete, 
  MdExpandMore, 
  MdExpandLess, 
  MdContentCopy,
  MdLayers,
  MdStar,
  MdAttachMoney,
  MdLocalFireDepartment
} from 'react-icons/md';

interface ProductVariationsSectionProps {
  variations: ProductVariation[];
  onChange: (variations: ProductVariation[]) => void;
}

export const ProductVariationsSection: React.FC<ProductVariationsSectionProps> = ({
  variations,
  onChange,
}) => {
  // Track collapsed/expanded state for each variation group (default all expanded)
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});

  const toggleExpand = (index: number) => {
    setExpandedIndices(prev => ({
      ...prev,
      [index]: prev[index] !== undefined ? !prev[index] : false
    }));
  };

  const isExpanded = (index: number) => {
    return expandedIndices[index] === undefined ? true : expandedIndices[index];
  };

  // ── Group Operations ───────────────────────
  const addEmptyVariation = () => {
    const newVariations: ProductVariation[] = [
      ...variations,
      {
        name: { ar: '', en: '' },
        status: true,
        required: true,
        options: [
          { name: { ar: '', en: '' }, price: 0, status: true }
        ]
      }
    ];
    onChange(newVariations);
    setExpandedIndices(prev => ({ ...prev, [newVariations.length - 1]: true }));
  };

  const addPresetVariation = (presetType: 'sizes' | 'extras' | 'spiciness') => {
    let preset: ProductVariation;

    if (presetType === 'sizes') {
      preset = {
        name: { ar: 'الحجم', en: 'Size' },
        required: true,
        status: true,
        options: [
          { name: { ar: 'صغير', en: 'Small' }, price: 0, status: true },
          { name: { ar: 'وسط', en: 'Medium' }, price: 15, status: true },
          { name: { ar: 'كبير', en: 'Large' }, price: 30, status: true },
        ]
      };
    } else if (presetType === 'extras') {
      preset = {
        name: { ar: 'الإضافات الاختيارية', en: 'Optional Extras' },
        required: false,
        status: true,
        options: [
          { name: { ar: 'جبنة إضافية', en: 'Extra Cheese' }, price: 15, status: true },
          { name: { ar: 'صوص خاص', en: 'Special Sauce' }, price: 10, status: true },
          { name: { ar: 'مخلل إضافي', en: 'Extra Pickles' }, price: 5, status: true },
        ]
      };
    } else {
      preset = {
        name: { ar: 'درجة الشطة', en: 'Spiciness' },
        required: true,
        status: true,
        options: [
          { name: { ar: 'عادي (غير حار)', en: 'Regular' }, price: 0, status: true },
          { name: { ar: 'حار (سبايسي)', en: 'Spicy' }, price: 0, status: true },
        ]
      };
    }

    const newVariations = [...variations, preset];
    onChange(newVariations);
    setExpandedIndices(prev => ({ ...prev, [newVariations.length - 1]: true }));
  };

  const duplicateVariation = (index: number) => {
    const target = variations[index];
    const duplicated: ProductVariation = {
      name: {
        ar: target.name.ar ? `${target.name.ar} (نسخة)` : '',
        en: target.name.en ? `${target.name.en} (Copy)` : '',
      },
      required: target.required,
      status: target.status,
      options: target.options.map(opt => ({
        name: { ...opt.name },
        price: opt.price,
        status: opt.status,
      }))
    };

    const newVars = [...variations];
    newVars.splice(index + 1, 0, duplicated);
    onChange(newVars);
    setExpandedIndices(prev => ({ ...prev, [index + 1]: true }));
  };

  const removeVariation = (index: number) => {
    onChange(variations.filter((_, i) => i !== index));
  };

  const updateVariationField = (vIndex: number, field: string, value: any) => {
    const updated = variations.map((v, i) => {
      if (i !== vIndex) return v;
      if (field.startsWith('name.')) {
        const lang = field.split('.')[1] as 'ar' | 'en';
        return {
          ...v,
          name: { ...v.name, [lang]: value }
        };
      }
      return { ...v, [field]: value };
    });
    onChange(updated);
  };

  // ── Option Operations ──────────────────────
  const addOption = (vIndex: number) => {
    const updated = variations.map((v, i) => {
      if (i !== vIndex) return v;
      return {
        ...v,
        options: [
          ...v.options,
          { name: { ar: '', en: '' }, price: 0, status: true }
        ]
      };
    });
    onChange(updated);
  };

  const updateOptionField = (vIndex: number, oIndex: number, field: string, value: any) => {
    const updated = variations.map((v, i) => {
      if (i !== vIndex) return v;
      const nextOptions = v.options.map((opt, j) => {
        if (j !== oIndex) return opt;
        if (field.startsWith('name.')) {
          const lang = field.split('.')[1] as 'ar' | 'en';
          return {
            ...opt,
            name: { ...opt.name, [lang]: value }
          };
        }
        return { ...opt, [field]: value };
      });
      return { ...v, options: nextOptions };
    });
    onChange(updated);
  };

  const removeOption = (vIndex: number, oIndex: number) => {
    const updated = variations.map((v, i) => {
      if (i !== vIndex) return v;
      return {
        ...v,
        options: v.options.filter((_, j) => j !== oIndex)
      };
    });
    onChange(updated);
  };

  return (
    <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-6 space-y-6">
      
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-primary/20 text-primary dark:text-primary-light flex items-center justify-center">
            <MdTune size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                الإضافات والمتغيرات (Variations & Addons)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {variations.length} {variations.length === 1 ? 'مجموعة' : 'مجموعات'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تحديد أحجام الوجبة، النكهات، الإضافات الاختيارية أو درجات التحضير مع تسعير كل خيار
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addEmptyVariation}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition-all text-xs font-bold shadow-sm shadow-primary/20"
          >
            <MdAdd size={16} />
            إضافة مجموعة جديدة
          </button>
        </div>
      </div>

      {/* ── Quick Templates Bar ── */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <MdLayers size={14} className="text-primary" /> قوالب جاهزة سريعة:
        </span>
        <button
          type="button"
          onClick={() => addPresetVariation('sizes')}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-primary/5 hover:text-primary dark:hover:text-primary border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-2xs flex items-center gap-1"
        >
          <MdStar size={13} className="text-amber-500" />
          قالب الأحجام (صغير / وسط / كبير)
        </button>
        <button
          type="button"
          onClick={() => addPresetVariation('extras')}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-primary/5 hover:text-primary dark:hover:text-primary border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-2xs flex items-center gap-1"
        >
          <MdAttachMoney size={13} className="text-emerald-500" />
          قالب إضافات إضافية (جبنة، صوص)
        </button>
        <button
          type="button"
          onClick={() => addPresetVariation('spiciness')}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-primary/5 hover:text-primary dark:hover:text-primary border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-2xs flex items-center gap-1"
        >
          <MdLocalFireDepartment size={13} className="text-rose-500" />
          قالب الشطة (عادي / حار)
        </button>
      </div>

      {/* ── Empty State ── */}
      {variations.length === 0 && (
        <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-primary flex items-center justify-center shadow-inner">
            <MdTune size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              لا توجد أي متغيرات مضافة لهذا المنتج
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              إذا كان المنتج يقدم بأحجام مختلفة (Single / Double)، أو يتيح للعميل اختيار إضافات (مثل بطاطس، صوص)، يمكنك إضافة مجموعة متغيرات بسهولة.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={addEmptyVariation}
              className="btn-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <MdAdd size={16} /> إضافة أول مجموعة
            </button>
            <button
              type="button"
              onClick={() => addPresetVariation('sizes')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              استخدام قالب الأحجام
            </button>
          </div>
        </div>
      )}

      {/* ── Variations List ── */}
      <div className="space-y-5">
        {variations.map((variation, vIndex) => {
          const expanded = isExpanded(vIndex);
          const hasTitle = variation.name.ar || variation.name.en;

          return (
            <div
              key={vIndex}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-600"
            >
              {/* Card Header Bar */}
              <div 
                className="px-5 py-3.5 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-3 cursor-pointer select-none"
                onClick={() => toggleExpand(vIndex)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center font-mono">
                    #{vIndex + 1}
                  </span>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-white text-sm">
                        {hasTitle ? (
                          <>
                            {variation.name.ar || 'بدون اسم عربي'}
                            {variation.name.en && (
                              <span className="text-xs text-slate-400 font-normal mr-1.5" dir="ltr">
                                ({variation.name.en})
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 italic">مجموعة خيارات جديدة (غير مسمّاة)</span>
                        )}
                      </span>

                      {/* Required Badge */}
                      {variation.required ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                          إجباري (Required)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          اختياري (Optional)
                        </span>
                      )}

                      {/* Active Status Badge */}
                      {variation.status ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          نشط
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-900/30 text-rose-500">
                          معطل
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      يحتوي على {variation.options.length} {variation.options.length === 1 ? 'خيار' : 'خيارات'}
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => duplicateVariation(vIndex)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                    title="تكرار المجموعة"
                  >
                    <MdContentCopy size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVariation(vIndex)}
                    className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="حذف المجموعة بالكامل"
                  >
                    <MdDelete size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExpand(vIndex)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    {expanded ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                  </button>
                </div>
              </div>

              {/* Card Body (Collapsible) */}
              {expanded && (
                <div className="p-5 space-y-6">
                  
                  {/* Group Settings Grid */}
                  <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                          <span>اسم المجموعة (باللغة العربية) <span className="text-red-500">*</span></span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded font-mono">AR</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={variation.name.ar}
                          onChange={(e) => updateVariationField(vIndex, 'name.ar', e.target.value)}
                          placeholder="مثال: الحجم، النكهة، الصوص..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                          <span>اسم المجموعة (باللغة الإنجليزية) <span className="text-red-500">*</span></span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded font-mono">EN</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={variation.name.en}
                          onChange={(e) => updateVariationField(vIndex, 'name.en', e.target.value)}
                          placeholder="Example: Size, Flavor, Sauce..."
                          dir="ltr"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-left"
                        />
                      </div>
                    </div>

                    {/* Group Toggles (Switches) */}
                    <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      
                      {/* Required Toggle */}
                      <label className="flex items-center gap-3 cursor-pointer group select-none">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={variation.required}
                            onChange={(e) => updateVariationField(vIndex, 'required', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">
                            إجباري على العميل (Required)
                          </span>
                          <p className="text-[11px] text-slate-400">
                            {variation.required ? 'العميل ملزم باختيار خيار واحد' : 'اختياري، يمكن تجاوز المجموعة'}
                          </p>
                        </div>
                      </label>

                      {/* Active Status Toggle */}
                      <label className="flex items-center gap-3 cursor-pointer group select-none">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={variation.status}
                            onChange={(e) => updateVariationField(vIndex, 'status', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">
                            مفعّل بالقائمة (Active)
                          </span>
                          <p className="text-[11px] text-slate-400">
                            {variation.status ? 'يظهر للعملاء في الكاشير والتطبيق' : 'مخفي مؤقتاً'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* ── Options Sub-Section ── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                          الخيارات والأسعار التابعة للمجموعة
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-mono">
                          {variation.options.length}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        السعر = المبلغ الإضافي المضاف على سعر المنتج الأساسي
                      </span>
                    </div>

                    {/* Options Table Header (Desktop) */}
                    <div className="hidden md:grid md:grid-cols-12 gap-3 px-3 py-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                      <div className="col-span-1 text-center">#</div>
                      <div className="col-span-4">اسم الخيار (عربي)</div>
                      <div className="col-span-4">اسم الخيار (إنجليزي)</div>
                      <div className="col-span-2">السعر الإضافي</div>
                      <div className="col-span-1 text-center">إجراء</div>
                    </div>

                    {/* Options Rows */}
                    <div className="space-y-2.5">
                      {variation.options.map((option, oIndex) => (
                        <div
                          key={oIndex}
                          className="bg-white dark:bg-slate-800 p-3 md:p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col md:grid md:grid-cols-12 gap-3 items-center shadow-2xs hover:border-primary/40 dark:hover:border-primary/40 transition-colors"
                        >
                          {/* Row Index */}
                          <div className="hidden md:flex col-span-1 items-center justify-center">
                            <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 text-[10px] font-bold font-mono flex items-center justify-center">
                              {oIndex + 1}
                            </span>
                          </div>

                          {/* Arabic Name */}
                          <div className="w-full md:col-span-4 space-y-1">
                            <label className="block md:hidden text-[11px] font-semibold text-slate-500">
                              اسم الخيار (عربي) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={option.name.ar}
                              onChange={(e) => updateOptionField(vIndex, oIndex, 'name.ar', e.target.value)}
                              placeholder="مثال: وسط، شيدر، حار..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                            />
                          </div>

                          {/* English Name */}
                          <div className="w-full md:col-span-4 space-y-1">
                            <label className="block md:hidden text-[11px] font-semibold text-slate-500">
                              اسم الخيار (إنجليزي) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={option.name.en}
                              onChange={(e) => updateOptionField(vIndex, oIndex, 'name.en', e.target.value)}
                              placeholder="e.g. Medium, Cheddar, Spicy..."
                              dir="ltr"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-left"
                            />
                          </div>

                          {/* Additional Price */}
                          <div className="w-full md:col-span-2 space-y-1">
                            <label className="block md:hidden text-[11px] font-semibold text-slate-500">
                              السعر الإضافي
                            </label>
                            <div className="relative">
                              <span className="absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                +
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={option.price}
                                onChange={(e) => updateOptionField(vIndex, oIndex, 'price', Number(e.target.value))}
                                className="w-full ps-6 pe-9 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-mono font-bold focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-start"
                              />
                              <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                                ج.م
                              </span>
                            </div>
                          </div>

                          {/* Delete Option */}
                          <div className="w-full md:col-span-1 flex items-center justify-end md:justify-center pt-2 md:pt-0">
                            <button
                              type="button"
                              onClick={() => removeOption(vIndex, oIndex)}
                              disabled={variation.options.length <= 1}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={variation.options.length <= 1 ? 'يجب أن تحتوي المجموعة على خيار واحد على الأقل' : 'حذف هذا الخيار'}
                            >
                              <MdDelete size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Option Button */}
                    <button
                      type="button"
                      onClick={() => addOption(vIndex)}
                      className="w-full py-2.5 rounded-xl border border-dashed border-primary/40 dark:border-primary/30 text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <MdAdd size={16} />
                      إضافة خيار جديد لهذه المجموعة
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductVariationsSection;
