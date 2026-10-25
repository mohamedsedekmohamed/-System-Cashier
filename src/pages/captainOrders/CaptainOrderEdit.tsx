import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  captainOrderApi,
  CAPTAIN_ORDERS_KEY,
} from '../../services/captainOrderService';
import type { CaptainOrderFormData } from '../../types';
import ImageUploadPreview from '../../components/ui/ImageUploadPreview';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { renderName } from '../../utils/helpers';
import {
  MdArrowForward,
  MdSave,
  MdSportsMotorsports,
  MdVisibility,
  MdVisibilityOff,
  MdInfo,
  MdPerson,
  MdUndo,
  MdLock,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface ExistingImageItem {
  url: string;
  raw?: string;
}

const CaptainOrderEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form State
  const [formData, setFormData] = useState<CaptainOrderFormData>({
    name: '',
    user_name: '',
    password: '',
    status: 1,
    new_images: [],
  });

  const [existingImagesList, setExistingImagesList] = useState<ExistingImageItem[]>([]);
  const [deletedImagesList, setDeletedImagesList] = useState<ExistingImageItem[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Fetch Current Captain Data ───────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [CAPTAIN_ORDERS_KEY, id],
    queryFn: () => captainOrderApi.get(id as string),
    enabled: Boolean(id),
  });

  const captain = data?.data;

  // Populate form on load
  useEffect(() => {
    if (captain) {
      setFormData({
        name: renderName(captain.name),
        user_name: captain.user_name || '',
        password: '', // Kept empty unless user wants to change it
        status: captain.status ? 1 : 0,
        new_images: [],
      });

      const images = captain.images || [];
      const rawImages = captain.raw_images || [];
      const combined: ExistingImageItem[] = images.map((url, idx) => ({
        url,
        raw: rawImages[idx] || url,
      }));

      setExistingImagesList(combined);
      setDeletedImagesList([]);
    }
  }, [captain]);

  // ── Update Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: (payload: CaptainOrderFormData) =>
      captainOrderApi.update(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CAPTAIN_ORDERS_KEY] });
      navigate('/dashboard/captain-orders');
    },
    onError: (err: any) => {
      const responseData = err?.response?.data;
      if (responseData?.errors) {
        const messages = Object.values(responseData.errors).flat().join(' - ');
        setErrorMessage(messages || responseData.message || 'فشل التحقق من البيانات.');
      } else {
        setErrorMessage(
          responseData?.message || 'حدث خطأ أثناء تعديل الكابتن. يُرجى المحاولة مرة أخرى.'
        );
      }
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setErrorMessage(null);

    if (name === 'user_name') {
      const cleanUser = value.toLowerCase().replace(/\s+/g, '_');
      setFormData((prev) => ({ ...prev, user_name: cleanUser }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleStatus = () => {
    setFormData((prev) => ({
      ...prev,
      status: prev.status ? 0 : 1,
    }));
  };

  // Remove one saved image
  const handleRemoveExisting = (indexToRemove: number) => {
    const target = existingImagesList[indexToRemove];
    if (!target) return;
    setExistingImagesList((prev) => prev.filter((_, i) => i !== indexToRemove));
    setDeletedImagesList((prev) => [...prev, target]);
  };

  // Clear all saved images
  const handleClearAllExisting = () => {
    setDeletedImagesList((prev) => [...prev, ...existingImagesList]);
    setExistingImagesList([]);
  };

  // Restore deleted images
  const handleRestoreDeleted = () => {
    const images = captain?.images || [];
    const rawImages = captain?.raw_images || [];
    const originalList: ExistingImageItem[] = images.map((url, idx) => ({
      url,
      raw: rawImages[idx] || url,
    }));
    setExistingImagesList(originalList);
    setDeletedImagesList([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage('يرجى إدخال اسم الكابتن.');
      return;
    }

    if (!formData.user_name.trim()) {
      setErrorMessage('يرجى إدخال اسم المستخدم.');
      return;
    }

    if (formData.password && formData.password.length > 0 && formData.password.length < 6) {
      setErrorMessage('كلمة المرور الجديدة يجب أن تتكون من 6 أحرف على الأقل.');
      return;
    }

    // Extract identifiers for deleted images (raw path preferred, fallback to url)
    const deletedImagePaths = deletedImagesList.map((item) => item.raw || item.url);

    mutation.mutate({
      ...formData,
      deleted_images: deletedImagePaths,
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="جاري تحميل بيانات الكابتن..." />;
  }

  if (isError) {
    return <ErrorFallback error={error} onRetry={refetch} />;
  }

  const existingImageUrls = existingImagesList.map((item) => item.url);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/captain-orders"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
            title="رجوع للقائمة"
          >
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <MdSportsMotorsports size={22} />
              </div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                تعديل كابتن الطلبات: {renderName(captain?.name)}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              تعديل بيانات الحساب، تغيير كلمة المرور، أو إضافة وحذف المستندات والصور
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <MdPerson className="text-primary" size={20} />
              البيانات الشخصية وبيانات الدخول
            </h2>
            <span className="text-xs text-slate-400">ID #{captain?.id}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم الكابتن بالكامل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="اسم الكابتن..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم المستخدم للدخول <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm pointer-events-none">
                  @
                </span>
                <input
                  type="text"
                  name="user_name"
                  required
                  value={formData.user_name}
                  onChange={handleChange}
                  placeholder="ahmed_captain"
                  dir="ltr"
                  className="w-full px-4 pl-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-sm text-left"
                />
              </div>
            </div>

            {/* Password (Optional for updates) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                كلمة المرور الجديدة{' '}
                <span className="text-slate-400 font-normal text-xs mr-1">
                  (اختياري - اتركها فارغة إذا لم ترغب بتغييرها)
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  placeholder="اترك الحقل فارغاً للحفاظ على الحالية"
                  dir="ltr"
                  className="w-full px-4 pl-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-mono text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
              {formData.password && formData.password.length > 0 && formData.password.length < 6 && (
                <p className="text-xs text-amber-500 mt-1 font-medium">
                  كلمة المرور قصيرة (يجب أن تكون 6 أحرف على الأقل)
                </p>
              )}
            </div>

            {/* Status Switch */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                حالة الحساب
              </label>
              <div
                onClick={handleToggleStatus}
                className="flex items-center justify-between p-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      formData.status ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {formData.status ? 'حساب نشط ومفعل' : 'حساب معطل وغير مفعل'}
                  </span>
                </div>

                <div
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                    formData.status ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      formData.status ? 'translate-x-0' : '-translate-x-5'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Deleted Images Notice & Undo */}
          {deletedImagesList.length > 0 && (
            <div className="p-3 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
              <span>
                تم تحديد {deletedImagesList.length} صورة للحذف النهائي من السيرفر عند الضغط على
                حفظ التعديلات.
              </span>
              <button
                type="button"
                onClick={handleRestoreDeleted}
                className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-200 hover:underline cursor-pointer"
              >
                <MdUndo size={16} /> تراجع واستعادة
              </button>
            </div>
          )}

          {/* Images Upload & Existing Management */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <ImageUploadPreview
              files={formData.new_images ?? []}
              onChange={(files) => setFormData((prev) => ({ ...prev, new_images: files }))}
              existingImages={existingImageUrls}
              onRemoveExisting={handleRemoveExisting}
              onClearAllExisting={handleClearAllExisting}
              label="صور ومستندات الكابتن (الرخص، البطاقات)"
              hint="يمكنك حذف أي صورة محفوظة أو رفع صور جديدة ليتم دمجها"
              disabled={mutation.isPending}
            />
          </div>
        </div>

        {/* Error message Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <MdInfo size={20} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center justify-end gap-3 shadow-sm">
          <Link
            to="/dashboard/captain-orders"
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending || !formData.name || !formData.user_name}
            className="btn-primary flex items-center gap-2 px-7 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {mutation.isPending ? (
              <>
                <AiOutlineLoading3Quarters size={18} className="animate-spin" />
                جاري حفظ التعديلات...
              </>
            ) : (
              <>
                <MdSave size={18} />
                حفظ التعديلات
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaptainOrderEdit;
