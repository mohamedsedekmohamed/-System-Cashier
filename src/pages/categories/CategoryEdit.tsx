import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  categoryApi,
  CATEGORIES_KEY,
  CATEGORIES_SELECT_OPTIONS_KEY,
} from '../../services/categoryService';
import type { CategoryFormData, CategoryType } from '../../types';
import SingleImageUpload from '../../components/ui/SingleImageUpload';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { MdArrowForward, MdSave, MdCategory, MdInfoOutline } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const CategoryEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<CategoryFormData>({
    name: { ar: '', en: '' },
    description: { ar: '', en: '' },
    image: null,
    category_id: null,
    type: 'product',
    status: true,
  });

  // ── Fetch Existing Category ─────────────
  const {
    data: categoryData,
    isLoading: isLoadingCategory,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [CATEGORIES_KEY, id],
    queryFn: () => categoryApi.get(id as string),
    enabled: !!id,
  });

  // ── Fetch Select Options (Parent categories) ────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [CATEGORIES_SELECT_OPTIONS_KEY],
    queryFn: categoryApi.getSelectOptions,
  });

  const category = categoryData?.data;
  // Exclude current category from parent options to prevent circular dependency
  const parentOptions = (optionsData?.data?.categories ?? []).filter(
    (opt) => opt.id !== Number(id)
  );

  // Populate form when data arrives
  useEffect(() => {
    if (category) {
      setFormData({
        name: {
          ar: category.name?.ar || '',
          en: category.name?.en || '',
        },
        description: {
          ar: category.description?.ar || '',
          en: category.description?.en || '',
        },
        image: category.image || null,
        category_id: category.category_id || null,
        type: category.type || 'product',
        status: category.status,
      });
    }
  }, [category]);

  // ── Update Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: (payload: CategoryFormData) =>
      categoryApi.update(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_SELECT_OPTIONS_KEY] });
      navigate('/dashboard/categories');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' - ')
          : 'حدث خطأ أثناء تحديث بيانات القسم');
      setFormError(msg);
    },
  });

  // ── Handlers ───────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name.startsWith('name.')) {
      const lang = name.split('.')[1] as 'ar' | 'en';
      setFormData((prev) => ({
        ...prev,
        name: { ...prev.name, [lang]: value },
      }));
    } else if (name.startsWith('description.')) {
      const lang = name.split('.')[1] as 'ar' | 'en';
      setFormData((prev) => ({
        ...prev,
        description: { ...prev.description, [lang]: value },
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
      setFormError('يرجى إدخال اسم القسم بالعربية');
      return;
    }
    if (!formData.name.en.trim()) {
      setFormError('يرجى إدخال اسم القسم بالإنجليزية');
      return;
    }

    mutation.mutate(formData);
  };

  if (isLoadingCategory) return <LoadingSpinner />;
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/categories"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdCategory size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                تعديل بيانات القسم #{id}
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              تحديث الاسم، التصنيف، الصورة، أو الحالة للقسم
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
          {/* Basic Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name AR */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم القسم (عربي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name.ar"
                required
                maxLength={255}
                value={formData.name.ar}
                onChange={handleChange}
                placeholder="مثال: المقبلات والسلطات"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              />
            </div>

            {/* Name EN */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم القسم (إنجليزي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name.en"
                required
                maxLength={255}
                value={formData.name.en}
                onChange={handleChange}
                placeholder="e.g. Appetizers & Salads"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              />
            </div>
          </div>

          {/* Type & Parent Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                نوع القسم
              </label>
              <select
                name="type"
                value={formData.type || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: (e.target.value as CategoryType) || null,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              >
                <option value="product">منتجات وجبات (Product)</option>
                <option value="material">مواد خام ومكونات (Material)</option>
                <option value="recipe">وصفات تصنيع وتحضير (Recipe)</option>
              </select>
            </div>

            {/* Parent Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                القسم الرئيسي (اختياري)
              </label>
              <SearchableSelect
                value={formData.category_id}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    category_id: val ? Number(val) : null,
                  }))
                }
                options={parentOptions}
                placeholder="اختر القسم الرئيسي (إن وجد)..."
                isClearable
                disabled={isLoadingOptions}
              />
              <p className="text-xs text-slate-400 mt-1">
                اتركه فارغاً إذا كان هذا القسم قسماً رئيسياً وليس فرعياً
              </p>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <SingleImageUpload
              value={formData.image}
              onChange={(file) => setFormData((prev) => ({ ...prev, image: file }))}
              label="صورة القسم"
              hint="يمكنك الإبقاء على الصورة الحالية أو اختيار صورة جديدة (بحد أقصى 4MB)"
              maxSizeMB={4}
            />
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Description AR */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الوصف (عربي)
              </label>
              <textarea
                name="description.ar"
                rows={3}
                value={formData.description.ar}
                onChange={handleChange}
                placeholder="أدخل وصفاً توضيحياً للأصناف التابعة لهذا القسم..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm resize-none"
              />
            </div>

            {/* Description EN */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الوصف (إنجليزي)
              </label>
              <textarea
                name="description.en"
                rows={3}
                value={formData.description.en}
                onChange={handleChange}
                placeholder="Enter description in English..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm resize-none"
              />
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
                تفعيل القسم (نشط)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Link
              to="/dashboard/categories"
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
                  <span>تحديث البيانات</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CategoryEdit;
