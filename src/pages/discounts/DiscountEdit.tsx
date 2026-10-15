import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { discountApi, DISCOUNTS_KEY } from '../../services/discountService';
import type { DiscountFormData, DiscountType } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { MdArrowForward, MdSave, MdDiscount, MdInfoOutline } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const DiscountEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<DiscountFormData>({
    name: { ar: '', en: '' },
    type: 'percentage',
    amount: 0,
    status: true,
  });

  // ── Fetch Existing Discount ────────────
  const {
    data: discountData,
    isLoading: isLoadingDiscount,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [DISCOUNTS_KEY, id],
    queryFn: () => discountApi.get(id as string),
    enabled: !!id,
  });

  const discount = discountData?.data;

  // Populate form
  useEffect(() => {
    if (discount) {
      setFormData({
        name: {
          ar: discount.name?.ar || '',
          en: discount.name?.en || '',
        },
        type: discount.type || 'percentage',
        amount: Number(discount.amount || 0),
        status: discount.status,
      });
    }
  }, [discount]);

  // ── Update Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: (payload: DiscountFormData) =>
      discountApi.update(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DISCOUNTS_KEY] });
      navigate('/dashboard/discounts');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' - ')
          : 'حدث خطأ أثناء تعديل بيانات الخصم');
      setFormError(msg);
    },
  });

  // ── Handlers ───────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name.startsWith('name.')) {
      const lang = name.split('.')[1] as 'ar' | 'en';
      setFormData((prev) => ({
        ...prev,
        name: { ...prev.name, [lang]: value },
      }));
    } else if (name === 'amount') {
      const num = parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        amount: isNaN(num) ? 0 : Math.max(0, num),
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.ar.trim()) {
      setFormError('يرجى إدخال اسم الخصم بالعربية');
      return;
    }
    if (!formData.name.en.trim()) {
      setFormError('يرجى إدخال اسم الخصم بالإنجليزية');
      return;
    }
    if (formData.amount < 0) {
      setFormError('قيمة الخصم يجب أن تكون صفر أو أكثر');
      return;
    }
    if (formData.type === 'percentage' && formData.amount > 100) {
      setFormError('النسبة المئوية لا يمكن أن تتجاوز 100%');
      return;
    }

    mutation.mutate(formData);
  };

  if (isLoadingDiscount) return <LoadingSpinner />;
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/discounts"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdDiscount size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                تعديل الخصم #{id}
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              تحديث بيانات ونسبة أو قيمة الخصم وحالة تفعيله
            </p>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          <MdInfoOutline size={18} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name AR */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم الخصم (عربي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name.ar"
                required
                maxLength={255}
                value={formData.name.ar}
                onChange={handleChange}
                placeholder="مثال: خصم الافتتاح 10%"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              />
            </div>

            {/* Name EN */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم الخصم (إنجليزي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name.en"
                required
                maxLength={255}
                value={formData.name.en}
                onChange={handleChange}
                placeholder="e.g. Grand Opening 10% Discount"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                نوع الخصم <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as DiscountType,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              >
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="value">مبلغ مالي ثابت (ج.م)</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                مقدار الخصم ({formData.type === 'percentage' ? '%' : 'ج.م'}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="amount"
                  min="0"
                  max={formData.type === 'percentage' ? 100 : undefined}
                  step="any"
                  required
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-mono"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  {formData.type === 'percentage' ? '%' : 'ج.م'}
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="status"
                checked={formData.status}
                onChange={handleChange}
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/50"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                تفعيل الخصم (نشط ومتاح للتطبيق)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Link
              to="/dashboard/discounts"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 text-sm"
            >
              {mutation.isPending ? (
                <>
                  <AiOutlineLoading3Quarters className="animate-spin" size={16} />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <MdSave size={18} />
                  <span>تحديث الخصم</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DiscountEdit;
