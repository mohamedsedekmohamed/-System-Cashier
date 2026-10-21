import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addonApi, ADDONS_KEY, ADDONS_SELECT_OPTIONS_KEY } from '../../services/addonService';
import type { AddonFormData } from '../../types';
import SingleImageUpload from '../../components/ui/SingleImageUpload';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import {
  MdArrowForward,
  MdSave,
  MdExtension,
  MdMonetizationOn,
  MdDiscount,
  MdSoupKitchen,
  MdErrorOutline,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const AddonAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<AddonFormData>({
    name: { ar: '', en: '' },
    price: 0,
    image: null,
    tax_id: 0,
    discount_id: 0,
    kitchen_id: 0,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // ── Fetch Select Options ───────────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [ADDONS_SELECT_OPTIONS_KEY],
    queryFn: addonApi.getSelectOptions,
  });

  const taxes = optionsData?.data?.taxes ?? [];
  const discounts = optionsData?.data?.discounts ?? [];
  const kitchens = optionsData?.data?.kitchens ?? [];

  // Options mapped for SearchableSelect
  const taxOptions = taxes.map((t) => ({
    id: t.id,
    name: `${t.name?.ar || t.name_ar || ''} (${t.amount} ${t.type === 'percentage' ? '%' : 'ج.م'})`,
  }));

  const discountOptions = discounts.map((d) => ({
    id: d.id,
    name: `${d.name?.ar || d.name_ar || ''} (${d.amount} ${d.type === 'percentage' ? '%' : 'ج.م'})`,
  }));

  const kitchenOptions = kitchens.map((k) => ({
    id: k.id,
    name: k.name?.ar || k.name?.en || `مطبخ #${k.id}`,
  }));

  // ── Create Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: addonApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADDONS_KEY] });
      navigate('/dashboard/addons');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'حدث خطأ أثناء حفظ الإضافة، يرجى مراجعة البيانات والمحاولة مرة أخرى.';
      setFormError(msg);
    },
  });

  // ── Field Change Handlers ──────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('name.')) {
      const lang = name.split('.')[1] as 'ar' | 'en';
      setFormData((prev) => ({
        ...prev,
        name: { ...prev.name, [lang]: value },
      }));
    } else if (name === 'price') {
      setFormData((prev) => ({
        ...prev,
        price: Number(value),
      }));
    }
  };

  // ── Form Submission ────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.ar.trim()) {
      setFormError('يرجى إدخال اسم الإضافة باللغة العربية');
      return;
    }
    if (!formData.name.en.trim()) {
      setFormError('يرجى إدخال اسم الإضافة باللغة الإنجليزية');
      return;
    }
    if (formData.price < 0) {
      setFormError('يجب أن يكون سعر الإضافة 0 أو أكثر');
      return;
    }

    const payload: AddonFormData = {
      ...formData,
      tax_id: formData.tax_id ? Number(formData.tax_id) : 0,
      discount_id: formData.discount_id ? Number(formData.discount_id) : 0,
      kitchen_id: formData.kitchen_id ? Number(formData.kitchen_id) : 0,
    };

    mutation.mutate(payload);
  };

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/addons"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdExtension size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">إضافة إضافة جديدة (Addon)</h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تعريف إضافة أو مكمل للوجبات وتحديد التسعير والضريبة والمطبخ المسؤول
            </p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-850 flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
          <MdErrorOutline size={20} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-5 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            البيانات الأساسية والتسعير
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                اسم الإضافة (عربي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name.ar"
                required
                value={formData.name.ar}
                onChange={handleChange}
                placeholder="مثال: شريحة جبن شيدر إضافية"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                اسم الإضافة (إنجليزي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name.en"
                required
                value={formData.name.en}
                onChange={handleChange}
                placeholder="e.g. Extra Cheddar Cheese Slice"
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent text-left transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                السعر (ج.م) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  name="price"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all font-semibold"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ج.م
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Relations: Tax, Discount, Kitchen */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-5 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            خيارات الربط (الضريبة، الخصم، المطبخ)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Tax */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <MdMonetizationOn size={16} className="text-indigo-500" />
                <span>الضريبة التابعة</span>
              </label>
              <SearchableSelect
                value={formData.tax_id || null}
                onChange={(val) => setFormData((prev) => ({ ...prev, tax_id: val ? Number(val) : 0 }))}
                options={taxOptions}
                placeholder={isLoadingOptions ? 'جاري التحميل...' : 'اختر الضريبة (اختياري)...'}
                searchPlaceholder="ابحث في الضرائب..."
                isClearable={true}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                تطبق على سعر الإضافة عند إضافتها للطلب
              </span>
            </div>

            {/* Discount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <MdDiscount size={16} className="text-amber-500" />
                <span>الخصم المطبق</span>
              </label>
              <SearchableSelect
                value={formData.discount_id || null}
                onChange={(val) => setFormData((prev) => ({ ...prev, discount_id: val ? Number(val) : 0 }))}
                options={discountOptions}
                placeholder={isLoadingOptions ? 'جاري التحميل...' : 'اختر الخصم (اختياري)...'}
                searchPlaceholder="ابحث في الخصومات..."
                isClearable={true}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                خصم ترويجي خاص بهذه الإضافة إن وجد
              </span>
            </div>

            {/* Kitchen */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <MdSoupKitchen size={16} className="text-teal-500" />
                <span>المطبخ المسؤول</span>
              </label>
              <SearchableSelect
                value={formData.kitchen_id || null}
                onChange={(val) => setFormData((prev) => ({ ...prev, kitchen_id: val ? Number(val) : 0 }))}
                options={kitchenOptions}
                placeholder={isLoadingOptions ? 'جاري التحميل...' : 'اختر المطبخ (اختياري)...'}
                searchPlaceholder="ابحث في المطابخ..."
                isClearable={true}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                المطبخ الذي يتلقى تحضير هذه الإضافة في شاشة الكاشير
              </span>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-5 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            صورة الإضافة
          </h2>

          <div className="max-w-md">
            <SingleImageUpload
              value={formData.image ?? null}
              onChange={(img) => setFormData((prev) => ({ ...prev, image: img }))}
              label="صورة توضيحية للإضافة"
              hint="اسحب الصورة هنا أو اختر من جهازك، أو أدخل رابط مباشر للصورة"
              showUrlOption={true}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? (
              <>
                <AiOutlineLoading3Quarters size={18} className="animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <MdSave size={18} />
                <span>حفظ الإضافة</span>
              </>
            )}
          </button>

          <Link
            to="/dashboard/addons"
            className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
};

export default AddonAdd;
