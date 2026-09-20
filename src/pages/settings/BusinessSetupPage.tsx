import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessSetupApi, BUSINESS_SETUP_KEY } from '../../services/businessSetupService';
import type { BusinessSetupPayload } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import {
  MdSettings,
  MdSave,
  MdStore,
  MdPhone,
  MdImage,
  MdCheckCircle,
  MdOutlineInfo,
  MdOpenInNew,
  MdRefresh,
  MdLink,
  MdCheck,
} from 'react-icons/md';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const BusinessSetupPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<BusinessSetupPayload>({
    name: '',
    phone: '',
    face: '',
    instagram: '',
    whats: '',
    description: '',
    logo: '',
  });

  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  // ── Fetch Business Setup ───────────────
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [BUSINESS_SETUP_KEY],
    queryFn: businessSetupApi.get,
  });

  const setupData = data?.data;
  const isExisting = Boolean(setupData && (setupData.id !== undefined || setupData.name));

  // Populate form state when data is loaded
  useEffect(() => {
    if (setupData) {
      setFormData({
        name: setupData.name || '',
        phone: setupData.phone || '',
        face: setupData.face || '',
        instagram: setupData.instagram || '',
        whats: setupData.whats || '',
        description: setupData.description || '',
        logo: setupData.logo || setupData.raw_logo || '',
      });
      setImageLoadFailed(false);
    }
  }, [setupData]);

  // Reset image error state when logo field changes
  useEffect(() => {
    setImageLoadFailed(false);
  }, [formData.logo]);

  // ── Save / Update Mutation ─────────────
  const mutation = useMutation({
    mutationFn: (payload: BusinessSetupPayload) => {
      if (isExisting && setupData?.id) {
        return businessSetupApi.update(setupData.id, payload);
      }
      return businessSetupApi.create(payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [BUSINESS_SETUP_KEY] });
      setSuccessMessage(
        res.message || (isExisting ? 'تم تحديث بيانات الإعدادات بنجاح' : 'تمت إضافة إعدادات النشاط التجاري بنجاح')
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    },
  });

  // ── Handlers ───────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.face.trim() ||
      !formData.instagram.trim() ||
      !formData.whats.trim() ||
      !formData.description.trim() ||
      !formData.logo.trim()
    ) {
      return;
    }

    mutation.mutate({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      face: formData.face.trim(),
      instagram: formData.instagram.trim(),
      whats: formData.whats.trim(),
      description: formData.description.trim(),
      logo: formData.logo.trim(),
    });
  };

  const handleReset = () => {
    if (setupData) {
      setFormData({
        name: setupData.name || '',
        phone: setupData.phone || '',
        face: setupData.face || '',
        instagram: setupData.instagram || '',
        whats: setupData.whats || '',
        description: setupData.description || '',
        logo: setupData.logo || setupData.raw_logo || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        face: '',
        instagram: '',
        whats: '',
        description: '',
        logo: '',
      });
    }
  };

  // ── Render Loading & Error States ──────
  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل بيانات إعدادات النشاط التجاري..." />;
  }

  if (isError) {
    return <ErrorFallback error={error} onRetry={refetch} />;
  }

  const isFormValid =
    Boolean(formData.name.trim()) &&
    Boolean(formData.phone.trim()) &&
    Boolean(formData.face.trim()) &&
    Boolean(formData.instagram.trim()) &&
    Boolean(formData.whats.trim()) &&
    Boolean(formData.description.trim()) &&
    Boolean(formData.logo.trim());

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── Page Header ─────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MdSettings size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                إعدادات النشاط التجاري
              </h1>
              {isExisting ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <MdCheckCircle size={14} /> بيانات محفوظة
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <MdOutlineInfo size={14} /> إعداد جديد
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              البيانات الأساسية للمتجر، أرقام التواصل، روابط الحسابات الرسمية، وشعار المنشأة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="تحديث البيانات من الخادم"
          >
            <MdRefresh size={16} className={isFetching ? 'animate-spin' : ''} />
            تحديث
          </button>
        </div>
      </div>

      {/* ── Success Message Banner ────────── */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <MdCheck size={18} />
            </div>
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* ── Error Message Banner ─────────── */}
      {mutation.isError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm shadow-sm space-y-1">
          <p className="font-semibold">
            {(mutation.error as any)?.response?.data?.message ||
              'حدث خطأ أثناء حفظ الإعدادات، يرجى التأكد من ملء جميع الحقول المطلوبة بشكل صحيح.'}
          </p>
          {(() => {
            const errs = (mutation.error as any)?.response?.data?.errors;
            if (errs && typeof errs === 'object') {
              return (
                <ul className="list-disc list-inside text-xs mt-1.5 space-y-0.5 opacity-90">
                  {Object.entries(errs).map(([field, msgs]: [string, any]) => (
                    <li key={field}>
                      <strong>{field}:</strong>{' '}
                      {Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}
                    </li>
                  ))}
                </ul>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* ── Main Form ───────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Main Column: Basic Info & Social (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Basic Information Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white">
                <MdStore size={20} className="text-primary" />
                <h2 className="font-bold text-base">البيانات الأساسية للنشاط التجاري</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Store Name */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      اسم النشاط التجاري / المتجر <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {formData.name.length} / 255
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      required
                      maxLength={255}
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="مثال: مطعم وسوبر ماركت النور"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Main Phone */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      رقم الهاتف الرئيسي <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {formData.phone.length} / 255
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="phone"
                      required
                      maxLength={255}
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="مثال: 01012345678"
                      dir="ltr"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-left"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <MdPhone size={18} />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      الوصف التعريفي <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="اكتب نبذة أو وصفاً تعريفياً مختصراً عن نشاطك التجاري والخدمات التي يقدمها..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all leading-relaxed"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    يظهر هذا الوصف في الفواتير، التطبيقات، أو شاشات العملاء.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Social & Communication Channels */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white">
                <MdLink size={20} className="text-primary" />
                <h2 className="font-bold text-base">قنوات التواصل والحسابات الرسمية</h2>
              </div>

              <div className="space-y-4">
                {/* WhatsApp */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      رقم أو رابط الواتساب (WhatsApp) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {formData.whats.length} / 255
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="whats"
                      required
                      maxLength={255}
                      value={formData.whats}
                      onChange={handleChange}
                      placeholder="مثال: https://wa.me/201012345678 أو 01012345678"
                      dir="ltr"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-left"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
                      <FaWhatsapp size={18} />
                    </div>
                  </div>
                </div>

                {/* Facebook */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      رابط صفحة الفيسبوك (Facebook) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {formData.face.length} / 255
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="face"
                      required
                      maxLength={255}
                      value={formData.face}
                      onChange={handleChange}
                      placeholder="مثال: https://facebook.com/your-page"
                      dir="ltr"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-left"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none">
                      <FaFacebook size={18} />
                    </div>
                  </div>
                </div>

                {/* Instagram */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      حساب أو رابط الانستغرام (Instagram) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {formData.instagram.length} / 255
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="instagram"
                      required
                      maxLength={255}
                      value={formData.instagram}
                      onChange={handleChange}
                      placeholder="مثال: https://instagram.com/your-account"
                      dir="ltr"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-left"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-600 pointer-events-none">
                      <FaInstagram size={18} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Logo & Visual Preview + Audit Card (1 col) */}
          <div className="space-y-6">
            
            {/* Logo Settings Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white">
                <MdImage size={20} className="text-primary" />
                <h2 className="font-bold text-base">شعار النشاط التجاري</h2>
              </div>

              {/* Logo URL Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    رابط الشعار (Logo URL) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {formData.logo.length} / 255
                  </span>
                </div>
                <input
                  type="text"
                  name="logo"
                  required
                  maxLength={255}
                  value={formData.logo}
                  onChange={handleChange}
                  placeholder="https://example.com/images/logo.png"
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-left"
                />
                <p className="text-xs text-slate-400 mt-1">
                  أدخل رابط صورة الشعار المباشر (بحد أقصى 255 حرف)
                </p>
              </div>

              {/* Live Preview Container */}
              <div className="space-y-2 pt-2">
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  معاينة الشعار الحالية:
                </span>
                
                <div className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-4 overflow-hidden group">
                  {formData.logo && !imageLoadFailed ? (
                    <>
                      <img
                        src={formData.logo}
                        alt="Logo Preview"
                        onError={() => setImageLoadFailed(true)}
                        className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                      />
                      <a
                        href={formData.logo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 left-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors text-xs flex items-center gap-1 shadow-md opacity-0 group-hover:opacity-100"
                        title="فتح الصورة في تبويب جديد"
                      >
                        <MdOpenInNew size={14} /> عرض الرابط
                      </a>
                    </>
                  ) : (
                    <div className="text-center text-slate-400 p-4">
                      <MdImage size={40} className="mx-auto mb-2 opacity-50 text-slate-400" />
                      {imageLoadFailed ? (
                        <span className="text-xs text-rose-500 font-medium block">
                          تعذر تحميل الصورة من الرابط المُدخل. تأكد من صحة الرابط المباشر.
                        </span>
                      ) : (
                        <span className="text-xs block">
                          أدخل رابط الصورة بالأعلى لمعاينتها هنا
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Audit & System Info Card (If existing) */}
            {isExisting && setupData && (
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">معلومات السجل</span>
                  <code className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    ID: #{setupData.id}
                  </code>
                </div>

                {setupData.created_at && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>تاريخ الإنشاء:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200" dir="ltr">
                      {new Date(setupData.created_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                )}

                {setupData.updated_at && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>آخر تحديث:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200" dir="ltr">
                      {new Date(setupData.updated_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* ── Footer Sticky Action Bar ───────── */}
        <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            جميع الحقول المعلمة بـ (<span className="text-red-500 font-bold">*</span>) مطلوبة وإجبارية
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={mutation.isPending}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm disabled:opacity-50"
            >
              إلغاء التعديلات
            </button>

            <button
              type="submit"
              disabled={mutation.isPending || !isFormValid}
              className="btn-primary flex items-center gap-2 px-7 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <>
                  <AiOutlineLoading3Quarters size={18} className="animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <MdSave size={18} />
                  {isExisting ? 'حفظ التعديلات' : 'إضافة الإعدادات'}
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default BusinessSetupPage;
