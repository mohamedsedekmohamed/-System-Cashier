import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  captainOrderApi,
  CAPTAIN_ORDERS_KEY,
} from '../../services/captainOrderService';
import type { CaptainOrderFormData } from '../../types';
import ImageUploadPreview from '../../components/ui/ImageUploadPreview';
import {
  MdArrowForward,
  MdSave,
  MdSportsMotorsports,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
  MdInfo,
  MdLock,
  MdPerson,
  MdAlternateEmail,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const CaptainOrderAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form State
  const [formData, setFormData] = useState<CaptainOrderFormData>({
    name: '',
    user_name: '',
    password: '',
    status: 1,
    images: [],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mutation
  const mutation = useMutation({
    mutationFn: captainOrderApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CAPTAIN_ORDERS_KEY] });
      navigate('/dashboard/captain-orders');
    },
    onError: (err: any) => {
      const responseData = err?.response?.data;
      if (responseData?.errors) {
        // Collect validation messages
        const messages = Object.values(responseData.errors).flat().join(' - ');
        setErrorMessage(messages || responseData.message || 'فشل التحقق من البيانات.');
      } else {
        setErrorMessage(
          responseData?.message || 'حدث خطأ أثناء إضافة الكابتن. يُرجى المحاولة مرة أخرى.'
        );
      }
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setErrorMessage(null);

    if (name === 'user_name') {
      // Disallow spaces and force lowercase alphanumeric / underscore
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

    if (!formData.password || formData.password.length < 6) {
      setErrorMessage('كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل.');
      return;
    }

    mutation.mutate(formData);
  };

  const isFormValid =
    Boolean(formData.name.trim()) &&
    Boolean(formData.user_name.trim()) &&
    Boolean(formData.password && formData.password.length >= 6);

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
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <MdSportsMotorsports size={22} />
              </div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                إضافة كابتن طلبات جديد
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              أدخل بيانات الكابتن وبيانات تسجيل الدخول وارفع صور الرخص والمستندات
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
            <span className="text-xs text-slate-400">الحقول المميزة بـ (*) إلزامية</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم الكابتن بالكامل <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثال: أحمد محمود علي"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم المستخدم للدخول <span className="text-red-500">*</span>
                <span className="text-slate-400 font-normal text-xs mr-1">
                  (فريد، بالإنجليزية بدون مسافات)
                </span>
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

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                كلمة المرور <span className="text-red-500">*</span>
                <span className="text-slate-400 font-normal text-xs mr-1">
                  (6 أحرف على الأقل)
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password || ''}
                  onChange={handleChange}
                  placeholder="••••••••"
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
              {formData.password && formData.password.length < 6 && (
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

          {/* Images / Documents Upload */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <ImageUploadPreview
              files={formData.images ?? []}
              onChange={(files) => setFormData((prev) => ({ ...prev, images: files }))}
              label="صور ومستندات الكابتن (رخصة القيادة، بطاقة الهوية، إلخ)"
              hint="يمكنك اختيار صور متعددة (JPG, PNG, WEBP) بحد أقصى 4MB لكل صورة"
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
            disabled={mutation.isPending || !isFormValid}
            className="btn-primary flex items-center gap-2 px-7 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {mutation.isPending ? (
              <>
                <AiOutlineLoading3Quarters size={18} className="animate-spin" />
                جاري حفظ الكابتن...
              </>
            ) : (
              <>
                <MdSave size={18} />
                حفظ الكابتن
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaptainOrderAdd;
