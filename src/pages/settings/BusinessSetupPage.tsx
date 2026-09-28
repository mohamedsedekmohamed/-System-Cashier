import React, { useState, useEffect, useRef } from 'react';
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
  MdWallpaper,
  MdStorefront,
  MdCloudUpload,
  MdDeleteOutline,
  MdUploadFile,
} from 'react-icons/md';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

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
    branch_cover: '',
  });

  // ── File Upload States ─────────────────
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [branchCoverFile, setBranchCoverFile] = useState<File | null>(null);

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>('');

  const [logoUploadMode, setLogoUploadMode] = useState<'file' | 'url'>('file');
  const [coverUploadMode, setCoverUploadMode] = useState<'file' | 'url'>('file');

  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [coverLoadFailed, setCoverLoadFailed] = useState(false);

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
      const initialLogo = setupData.logo || setupData.raw_logo || '';
      const initialCover = setupData.branch_cover || setupData.raw_branch_cover || '';

      setFormData({
        name: setupData.name || '',
        phone: setupData.phone || '',
        face: setupData.face || '',
        instagram: setupData.instagram || '',
        whats: setupData.whats || '',
        description: setupData.description || '',
        logo: initialLogo,
        branch_cover: initialCover,
      });

      setLogoFile(null);
      setBranchCoverFile(null);
      setLogoPreviewUrl(initialLogo);
      setCoverPreviewUrl(initialCover);

      setImageLoadFailed(false);
      setCoverLoadFailed(false);
    }
  }, [setupData]);

  // Clean up object URLs when unmounted or changed
  useEffect(() => {
    return () => {
      if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
      if (coverPreviewUrl && coverPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [logoPreviewUrl, coverPreviewUrl]);

  // Reset image error state when preview changes
  useEffect(() => {
    setImageLoadFailed(false);
  }, [logoPreviewUrl]);

  useEffect(() => {
    setCoverLoadFailed(false);
  }, [coverPreviewUrl]);

  // ── Save / Update Mutation ─────────────
  const mutation = useMutation({
    mutationFn: (payload: BusinessSetupPayload) => {
      if (isExisting) {
        return businessSetupApi.update(setupData?.id, payload);
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

    if (name === 'logo' && logoUploadMode === 'url') {
      setLogoPreviewUrl(value);
      setLogoFile(null);
    }
    if (name === 'branch_cover' && coverUploadMode === 'url') {
      setCoverPreviewUrl(value);
      setBranchCoverFile(null);
    }
  };

  const handleLogoFileSelect = (file: File | null) => {
    if (!file) {
      setLogoFile(null);
      const fallbackUrl = typeof formData.logo === 'string' ? formData.logo : '';
      setLogoPreviewUrl(fallbackUrl);
      return;
    }
    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreviewUrl(objectUrl);
  };

  const handleCoverFileSelect = (file: File | null) => {
    if (!file) {
      setBranchCoverFile(null);
      const fallbackUrl = typeof formData.branch_cover === 'string' ? formData.branch_cover : '';
      setCoverPreviewUrl(fallbackUrl);
      return;
    }
    setBranchCoverFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCoverPreviewUrl(objectUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.face.trim() ||
      !formData.instagram.trim() ||
      !formData.whats.trim() ||
      !formData.description.trim()
    ) {
      return;
    }

    const finalLogo = logoFile || (typeof formData.logo === 'string' ? formData.logo.trim() : '');
    const finalCover = branchCoverFile || (typeof formData.branch_cover === 'string' ? formData.branch_cover.trim() : '');

    if (!finalLogo) {
      return;
    }

    mutation.mutate({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      face: formData.face.trim(),
      instagram: formData.instagram.trim(),
      whats: formData.whats.trim(),
      description: formData.description.trim(),
      logo: finalLogo,
      branch_cover: finalCover,
    });
  };

  const handleReset = () => {
    if (setupData) {
      const initialLogo = setupData.logo || setupData.raw_logo || '';
      const initialCover = setupData.branch_cover || setupData.raw_branch_cover || '';

      setFormData({
        name: setupData.name || '',
        phone: setupData.phone || '',
        face: setupData.face || '',
        instagram: setupData.instagram || '',
        whats: setupData.whats || '',
        description: setupData.description || '',
        logo: initialLogo,
        branch_cover: initialCover,
      });

      setLogoFile(null);
      setBranchCoverFile(null);
      setLogoPreviewUrl(initialLogo);
      setCoverPreviewUrl(initialCover);
    } else {
      setFormData({
        name: '',
        phone: '',
        face: '',
        instagram: '',
        whats: '',
        description: '',
        logo: '',
        branch_cover: '',
      });
      setLogoFile(null);
      setBranchCoverFile(null);
      setLogoPreviewUrl('');
      setCoverPreviewUrl('');
    }
    setImageLoadFailed(false);
    setCoverLoadFailed(false);
  };

  // ── Render Loading & Error States ──────
  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل بيانات إعدادات النشاط التجاري..." />;
  }

  if (isError) {
    return <ErrorFallback error={error} onRetry={refetch} />;
  }

  const hasLogo = Boolean(logoFile) || (typeof formData.logo === 'string' && Boolean(formData.logo.trim()));

  const isFormValid =
    Boolean(formData.name.trim()) &&
    Boolean(formData.phone.trim()) &&
    Boolean(formData.face.trim()) &&
    Boolean(formData.instagram.trim()) &&
    Boolean(formData.whats.trim()) &&
    Boolean(formData.description.trim()) &&
    hasLogo;

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
              البيانات الأساسية للمتجر، أرقام التواصل، الحسابات الرسمية، وشعار المنشأة وغلاف الفرع مع إمكانية الرفع المباشر من جهازك
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

          {/* Right Column: Branding, Covers & Visual Preview + Audit Card (1 col) */}
          <div className="space-y-6">
            
            {/* 1. Branch Cover Settings Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white">
                <div className="flex items-center gap-2">
                  <MdWallpaper size={20} className="text-primary" />
                  <h2 className="font-bold text-base">غلاف الفرع (Branch Cover)</h2>
                </div>

                {/* Mode Selector Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setCoverUploadMode('file')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                      coverUploadMode === 'file'
                        ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <MdCloudUpload size={14} /> رفع من الجهاز
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverUploadMode('url')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                      coverUploadMode === 'url'
                        ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <MdLink size={14} /> رابط URL
                  </button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCoverFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {coverUploadMode === 'file' ? (
                /* File Upload Mode */
                <div className="space-y-3">
                  {branchCoverFile ? (
                    /* Newly Selected File from Device */
                    <div className="space-y-3">
                      <div className="relative w-full aspect-[21/9] rounded-2xl border-2 border-emerald-500/40 bg-slate-900 overflow-hidden shadow-sm group">
                        <img
                          src={coverPreviewUrl}
                          alt="Selected Cover"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-md">
                          <MdCheckCircle size={14} /> ملف جديد جاهز للحفظ
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <MdUploadFile size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold text-emerald-900 dark:text-emerald-300 truncate">
                              {branchCoverFile.name}
                            </p>
                            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                              الحجم: {formatFileSize(branchCoverFile.size)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => coverFileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors font-medium text-[11px]"
                          >
                            تغيير
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCoverFileSelect(null)}
                            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 transition-colors"
                            title="إلغاء التحديد"
                          >
                            <MdDeleteOutline size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : coverPreviewUrl && !coverLoadFailed ? (
                    /* Existing Saved Cover on Server */
                    <div className="space-y-3">
                      <div className="relative w-full aspect-[21/9] rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-900 overflow-hidden shadow-sm group">
                        <img
                          src={coverPreviewUrl}
                          alt="Current Cover"
                          onError={() => setCoverLoadFailed(true)}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1">
                          <MdCheckCircle size={14} className="text-emerald-400" /> الغلاف المحفوظ حالياً
                        </span>
                        <a
                          href={coverPreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-2 left-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors text-xs flex items-center gap-1 shadow-md opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                        >
                          <MdOpenInNew size={14} /> عرض الرابط
                        </a>
                      </div>

                      {/* Dropzone Button to change */}
                      <div
                        onClick={() => coverFileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingCover(true); }}
                        onDragLeave={() => setIsDraggingCover(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingCover(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleCoverFileSelect(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                          isDraggingCover
                            ? 'border-primary bg-primary/10 scale-[1.01]'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary/60 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        <MdCloudUpload size={20} className="text-primary" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          اضغط لاختيار صورة من جهازك لتغيير الغلاف
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Empty State: Big Dropzone */
                    <div
                      onClick={() => coverFileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingCover(true); }}
                      onDragLeave={() => setIsDraggingCover(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingCover(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleCoverFileSelect(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                        isDraggingCover
                          ? 'border-primary bg-primary/10 scale-[1.01]'
                          : 'border-slate-200 dark:border-slate-700 hover:border-primary/60 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                        <MdCloudUpload size={26} />
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center">
                        اضغط لاختيار صورة الغلاف من جهازك
                      </p>
                      <p className="text-xs text-slate-400 mt-1 text-center">
                        أو اسحب الصورة وأفلتها هنا (PNG, JPG, WEBP بحد أقصى 5MB)
                      </p>
                      <span className="mt-3 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        الأبعاد الموصى بها: 1200×500 أو 1920×600
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* URL Input Mode */
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        رابط صورة غلاف الفرع (Cover URL)
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {(formData.branch_cover as string || '').length} / 255
                      </span>
                    </div>
                    <input
                      type="text"
                      name="branch_cover"
                      maxLength={255}
                      value={typeof formData.branch_cover === 'string' ? formData.branch_cover : ''}
                      onChange={handleChange}
                      placeholder="https://example.com/images/branch-cover.jpg"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-left"
                    />
                  </div>

                  {coverPreviewUrl && !coverLoadFailed && (
                    <div className="relative w-full aspect-[21/9] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <img
                        src={coverPreviewUrl}
                        alt="URL Cover Preview"
                        onError={() => setCoverLoadFailed(true)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Logo Settings Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white">
                <div className="flex items-center gap-2">
                  <MdImage size={20} className="text-primary" />
                  <h2 className="font-bold text-base">شعار النشاط التجاري (Logo) <span className="text-red-500">*</span></h2>
                </div>

                {/* Mode Selector Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setLogoUploadMode('file')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                      logoUploadMode === 'file'
                        ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <MdCloudUpload size={14} /> رفع من الجهاز
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoUploadMode('url')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                      logoUploadMode === 'url'
                        ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <MdLink size={14} /> رابط URL
                  </button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleLogoFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {logoUploadMode === 'file' ? (
                /* File Upload Mode */
                <div className="space-y-3">
                  {logoFile ? (
                    /* Newly Selected File from Device */
                    <div className="space-y-3">
                      <div className="relative w-full aspect-video rounded-2xl border-2 border-emerald-500/40 bg-slate-50 dark:bg-slate-900/60 p-4 flex items-center justify-center overflow-hidden shadow-sm">
                        <img
                          src={logoPreviewUrl}
                          alt="Selected Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-md">
                          <MdCheckCircle size={14} /> ملف جديد جاهز للحفظ
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <MdUploadFile size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold text-emerald-900 dark:text-emerald-300 truncate">
                              {logoFile.name}
                            </p>
                            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                              الحجم: {formatFileSize(logoFile.size)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => logoFileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors font-medium text-[11px]"
                          >
                            تغيير
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLogoFileSelect(null)}
                            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 transition-colors"
                            title="إلغاء التحديد"
                          >
                            <MdDeleteOutline size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : logoPreviewUrl && !imageLoadFailed ? (
                    /* Existing Saved Logo on Server */
                    <div className="space-y-3">
                      <div className="relative w-full aspect-video rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 flex items-center justify-center overflow-hidden shadow-sm group">
                        <img
                          src={logoPreviewUrl}
                          alt="Current Logo"
                          onError={() => setImageLoadFailed(true)}
                          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1">
                          <MdCheckCircle size={14} className="text-emerald-400" /> الشعار المحفوظ حالياً
                        </span>
                        <a
                          href={logoPreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-2 left-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors text-xs flex items-center gap-1 shadow-md opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                        >
                          <MdOpenInNew size={14} /> عرض الرابط
                        </a>
                      </div>

                      {/* Dropzone Button to change */}
                      <div
                        onClick={() => logoFileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                        onDragLeave={() => setIsDraggingLogo(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleLogoFileSelect(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                          isDraggingLogo
                            ? 'border-primary bg-primary/10 scale-[1.01]'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary/60 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        <MdCloudUpload size={20} className="text-primary" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          اضغط لاختيار صورة من جهازك لتغيير الشعار
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Empty State: Big Dropzone */
                    <div
                      onClick={() => logoFileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                      onDragLeave={() => setIsDraggingLogo(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleLogoFileSelect(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                        isDraggingLogo
                          ? 'border-primary bg-primary/10 scale-[1.01]'
                          : 'border-slate-200 dark:border-slate-700 hover:border-primary/60 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                        <MdCloudUpload size={26} />
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center">
                        اضغط لاختيار شعار المتجر من جهازك
                      </p>
                      <p className="text-xs text-slate-400 mt-1 text-center">
                        أو اسحب الشعار وأفلته هنا (PNG, JPG, WEBP بحد أقصى 5MB)
                      </p>
                      <span className="mt-3 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        يُفضل استخدام صورة مربعة واضحة
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* URL Input Mode */
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        رابط الشعار (Logo URL) <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {(formData.logo as string || '').length} / 255
                      </span>
                    </div>
                    <input
                      type="text"
                      name="logo"
                      required={!logoFile}
                      maxLength={255}
                      value={typeof formData.logo === 'string' ? formData.logo : ''}
                      onChange={handleChange}
                      placeholder="https://example.com/images/logo.png"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-left"
                    />
                  </div>

                  {logoPreviewUrl && !imageLoadFailed && (
                    <div className="relative w-full aspect-video rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center p-4 overflow-hidden">
                      <img
                        src={logoPreviewUrl}
                        alt="URL Logo Preview"
                        onError={() => setImageLoadFailed(true)}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Live Storefront Mockup Preview */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white">
                <div className="flex items-center gap-2">
                  <MdStorefront size={20} className="text-primary" />
                  <h2 className="font-bold text-base">معاينة واجهة المتجر والفروع</h2>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  معاينة حية
                </span>
              </div>

              {/* Mockup Card */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900 shadow-md">
                {/* Banner / Cover */}
                <div className="relative h-32 sm:h-36 w-full bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 overflow-hidden">
                  {coverPreviewUrl && !coverLoadFailed ? (
                    <img
                      src={coverPreviewUrl}
                      alt="Store Cover Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5">
                      <MdWallpaper size={28} className="text-primary/70 mb-1" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">صورة غلاف الفرع</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">ستظهر هنا كبانر عريض للمتجر</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Profile Details Container */}
                <div className="p-4 pt-0 relative bg-white dark:bg-slate-900">
                  {/* Floating Logo + Info Row */}
                  <div className="flex items-start gap-3.5 pt-2">
                    {/* Floating Avatar Logo */}
                    <div className="-mt-10 w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-900 shadow-lg bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 z-10 transition-transform hover:scale-105">
                      {logoPreviewUrl && !imageLoadFailed ? (
                        <img
                          src={logoPreviewUrl}
                          alt="Store Logo"
                          className="w-full h-full object-contain p-1.5"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-primary bg-primary/5">
                          <MdStore size={32} />
                        </div>
                      )}
                    </div>

                    {/* Store Title & Phone Info */}
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-800 dark:text-white truncate">
                          {formData.name || 'اسم النشاط التجاري'}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          نشط
                        </span>
                      </div>

                      {/* Phone Number */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <MdPhone size={14} className="text-primary shrink-0" />
                        <span className="font-medium" dir="ltr">
                          {formData.phone || '010XXXXXXXX'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Store Description */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {formData.description || 'نبذة النشاط التجاري والوصف التعريفي للخدمات والمنتجات ستظهر هنا للعملاء.'}
                    </p>
                  </div>

                  {/* Connected Social Accounts Footer */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      قنوات التواصل المربوطة:
                    </span>
                    <div className="flex items-center gap-2">
                      {formData.whats ? (
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shadow-xs" title="واتساب متصل">
                          <FaWhatsapp size={13} />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center opacity-40">
                          <FaWhatsapp size={13} />
                        </span>
                      )}

                      {formData.face ? (
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shadow-xs" title="فيسبوك متصل">
                          <FaFacebook size={13} />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center opacity-40">
                          <FaFacebook size={13} />
                        </span>
                      )}

                      {formData.instagram ? (
                        <span className="w-6 h-6 rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400 flex items-center justify-center shadow-xs" title="انستغرام متصل">
                          <FaInstagram size={13} />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center opacity-40">
                          <FaInstagram size={13} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Audit & System Info Card (If existing) */}
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
                  جاري الحفظ والرفع...
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
