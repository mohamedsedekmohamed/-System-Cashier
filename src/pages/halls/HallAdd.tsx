import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hallApi, HALLS_KEY, HALLS_SELECT_OPTIONS_KEY } from '../../services/hallService';
import type { HallFormData } from '../../types';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { MdArrowForward, MdSave, MdMeetingRoom, MdInfoOutline } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const HallAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<HallFormData>({
    name: { ar: '', en: '' },
    branch_id: null,
    status: true,
  });

  // ── Fetch Select Options (Branches) ────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [HALLS_SELECT_OPTIONS_KEY],
    queryFn: hallApi.getSelectOptions,
  });

  const branchOptions = optionsData?.data?.branches ?? [];

  // ── Create Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: hallApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HALLS_KEY] });
      navigate('/dashboard/halls');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' - ')
          : 'حدث خطأ أثناء حفظ الصالة');
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
      setFormError('يرجى إدخال اسم الصالة بالعربية');
      return;
    }
    if (!formData.name.en.trim()) {
      setFormError('يرجى إدخال اسم الصالة بالإنجليزية');
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/halls"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdMeetingRoom size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                إضافة صالة جديدة
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              أدخل اسم الصالة وحدد الفرع التابعة له لتنظيم طاولات الجلوس
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          <MdInfoOutline size={18} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name AR */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم الصالة (عربي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name.ar"
                required
                maxLength={255}
                value={formData.name.ar}
                onChange={handleChange}
                placeholder="مثال: صالة علوي، الصالة العائلية..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              />
            </div>

            {/* Name EN */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم الصالة (إنجليزي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name.en"
                required
                maxLength={255}
                value={formData.name.en}
                onChange={handleChange}
                placeholder="e.g. Upper Hall, Family Section..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              />
            </div>
          </div>

          {/* Branch Select */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الفرع التابع له
              </label>
              <SearchableSelect
                value={formData.branch_id}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    branch_id: val ? Number(val) : null,
                  }))
                }
                options={branchOptions}
                placeholder="اختر الفرع..."
                isClearable
                disabled={isLoadingOptions}
              />
            </div>

            {/* Status toggle */}
            <div className="flex items-center pt-8">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/50"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  تفعيل الصالة (نشطة ومتاحة للاستخدام)
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Link
              to="/dashboard/halls"
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
                  <span>حفظ الصالة</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default HallAdd;
