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
  MdCloudUpload,
  MdDeleteOutline,
  MdUploadFile,
  MdAccessTime,
  MdNightsStay,
  MdQrCodeScanner,
  MdRadar,
  MdContentCopy,
  MdTableBar,
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
  const [copiedLink, setCopiedLink] = useState(false);

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<BusinessSetupPayload>({
    name: '',
    phone: '',
    face: '',
    instagram: '',
    whats: '',
    description: '',
    logo: '',
    table_order_url: '',
    branch_cover: 0,
    start_day: '09:00',
    end_day: '03:00',
  });

  // ── File Upload States ─────────────────
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const [logoUploadMode, setLogoUploadMode] = useState<'file' | 'url'>('file');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
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
      const initialLogo = setupData.logo || setupData.raw_logo || '';

      setFormData({
        name: setupData.name || '',
        phone: setupData.phone || '',
        face: setupData.face || '',
        instagram: setupData.instagram || '',
        whats: setupData.whats || '',
        description: setupData.description || '',
        table_order_url: setupData.table_order_url || '',
        branch_cover:
          setupData.branch_cover !== null && setupData.branch_cover !== undefined
            ? Number(setupData.branch_cover)
            : 0,
        logo: initialLogo,
        start_day: setupData.start_day ? setupData.start_day.substring(0, 5) : '09:00',
        end_day: setupData.end_day ? setupData.end_day.substring(0, 5) : '03:00',
      });

      setLogoFile(null);
      setLogoPreviewUrl(initialLogo);
      setImageLoadFailed(false);
    }
  }, [setupData]);

  // Clean up object URLs when unmounted or changed
  useEffect(() => {
    return () => {
      if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  // Reset image error state when preview changes
  useEffect(() => {
    setImageLoadFailed(false);
  }, [logoPreviewUrl]);

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
        res.message ||
          (isExisting
            ? 'تم تحديث بيانات الإعدادات بنجاح'
            : 'تمت إضافة إعدادات النشاط التجاري بنجاح')
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
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : Number(value)) : value,
    }));

    if (name === 'logo' && logoUploadMode === 'url') {
      setLogoPreviewUrl(value);
      setLogoFile(null);
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

  const handleCopyTableUrl = () => {
    if (!formData.table_order_url) return;
    navigator.clipboard.writeText(formData.table_order_url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name?.trim() ||
      !formData.phone?.trim() ||
      !formData.face?.trim() ||
      !formData.instagram?.trim() ||
      !formData.whats?.trim() ||
      !formData.description?.trim() ||
      !formData.table_order_url?.trim()
    ) {
      return;
    }

    const finalLogo =
      logoFile || (typeof formData.logo === 'string' ? formData.logo.trim() : '');

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
      table_order_url: formData.table_order_url.trim(),
      branch_cover:
        formData.branch_cover !== null && formData.branch_cover !== undefined
          ? Number(formData.branch_cover)
          : 0,
      logo: finalLogo,
      start_day: formData.start_day || '09:00',
      end_day: formData.end_day || '03:00',
    });
  };

  const handleReset = () => {
    if (setupData) {
      const initialLogo = setupData.logo || setupData.raw_logo || '';

      setFormData({
        name: setupData.name || '',
        phone: setupData.phone || '',
        face: setupData.face || '',
        instagram: setupData.instagram || '',
        whats: setupData.whats || '',
        description: setupData.description || '',
        table_order_url: setupData.table_order_url || '',
        branch_cover:
          setupData.branch_cover !== null && setupData.branch_cover !== undefined
            ? Number(setupData.branch_cover)
            : 0,
        logo: initialLogo,
        start_day: setupData.start_day ? setupData.start_day.substring(0, 5) : '09:00',
        end_day: setupData.end_day ? setupData.end_day.substring(0, 5) : '03:00',
      });

      setLogoFile(null);
      setLogoPreviewUrl(initialLogo);
    } else {
      setFormData({
        name: '',
        phone: '',
        face: '',
        instagram: '',
        whats: '',
        description: '',
        logo: '',
        table_order_url: '',
        branch_cover: 0,
        start_day: '09:00',
        end_day: '03:00',
      });
      setLogoFile(null);
      setLogoPreviewUrl('');
    }
    setImageLoadFailed(false);
  };

  // ── Render Loading & Error States ──────
  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل بيانات إعدادات النشاط التجاري..." />;
  }

  if (isError) {
    return <ErrorFallback error={error} onRetry={refetch} />;
  }

  const hasLogo =
    Boolean(logoFile) ||
    (typeof formData.logo === 'string' && Boolean(formData.logo.trim()));

  const isFormValid =
    Boolean(formData.name?.trim()) &&
    Boolean(formData.phone?.trim()) &&
    Boolean(formData.face?.trim()) &&
    Boolean(formData.instagram?.trim()) &&
    Boolean(formData.whats?.trim()) &&
    Boolean(formData.description?.trim()) &&
    Boolean(formData.table_order_url?.trim()) &&
    hasLogo;

  const isOvernight = Boolean(
    formData.start_day &&
      formData.end_day &&
      formData.start_day > formData.end_day
  );

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── Page Header ─────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm">
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
              البيانات الأساسية للمتجر، مواعيد وساعات العمل، رابط الطلب الذاتي للطاولات، وشعار المنشأة
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
          {/* Left / Main Column: Basic Info & Operating Hours & Table Ordering (2 cols) */}
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
                    rows={3}
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

            {/* 2. Table Orders & Branch Coverage Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white">
                <MdTableBar size={22} className="text-primary" />
                <div>
                  <h2 className="font-bold text-base">الطلب الذاتي للطاولات وتغطية الفروع</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    رابط منيو الطاولات عبر رمز QR ونطاق تغطية الفروع بالكيلومتر
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Table Order URL */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      رابط الطلب من الطاولة (table_order_url) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {formData.table_order_url.length} / 255
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="table_order_url"
                      required
                      maxLength={255}
                      value={formData.table_order_url}
                      onChange={handleChange}
                      placeholder="مثال: https://ecommerce.mazoom.online/table-orders"
                      dir="ltr"
                      className="w-full px-4 py-2.5 pr-10 pl-24 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-left font-mono text-xs sm:text-sm"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                      <MdQrCodeScanner size={20} />
                    </div>

                    {/* Action buttons inside the input container */}
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {formData.table_order_url && (
                        <>
                          <button
                            type="button"
                            onClick={handleCopyTableUrl}
                            className="p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-xs"
                            title="نسخ الرابط"
                          >
                            {copiedLink ? <MdCheck size={14} className="text-emerald-500" /> : <MdContentCopy size={14} />}
                          </button>
                          <a
                            href={formData.table_order_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs flex items-center gap-0.5"
                            title="تجربة الرابط"
                          >
                            <MdOpenInNew size={14} />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    الرابط الذي يتم تحويله إلى QR Code ولصقه على طاولات الصالة ليقوم العملاء بمسحه وطلب الوجبات مباشرة من هواتفهم.
                  </p>
                </div>

                {/* Branch Coverage (branch_cover) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      نطاق تغطية الفروع (branch_cover)
                    </label>
                    <span className="text-[11px] text-slate-400">قيمة عددية &gt;= 0</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      name="branch_cover"
                      min={0}
                      step={1}
                      value={formData.branch_cover ?? 0}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono font-bold"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <MdRadar size={18} />
                    </div>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                      كيلومتر (كم)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    أقصى مسافة بالكيلومتر لتغطية وتوصيل طلبات الفروع المحيطة (ضع 0 في حالة عدم وجود حد أقصى).
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Restaurant Working Hours & Overnight Shifts Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                  <MdAccessTime size={22} className="text-primary" />
                  <div>
                    <h2 className="font-bold text-base">مواعيد وساعات العمل اليومية (فترات التشغيل)</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      تحديد وقت بدء وانتهاء يوم التشغيل للتحكم بالسلة والطلبات وفلترة الأوردرات
                    </p>
                  </div>
                </div>

                {setupData && setupData.is_open !== undefined && (
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${
                      setupData.is_open
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        setupData.is_open ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span>{setupData.is_open ? 'المطعم مفتوح الآن' : 'المطعم مغلق الآن'}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Start Day */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      وقت بدء يوم العمل (start_day) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">صيغة 24 ساعة (HH:mm)</span>
                  </div>
                  <div className="relative">
                    <input
                      type="time"
                      name="start_day"
                      required
                      value={formData.start_day || '09:00'}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-center font-mono text-base font-bold"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    مثال: 09:00 (صباحاً)
                  </span>
                </div>

                {/* End Day */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      وقت انتهاء يوم العمل (end_day) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">صيغة 24 ساعة (HH:mm)</span>
                  </div>
                  <div className="relative">
                    <input
                      type="time"
                      name="end_day"
                      required
                      value={formData.end_day || '03:00'}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-center font-mono text-base font-bold"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    مثال: 03:00 (فجراً)
                  </span>
                </div>
              </div>

              {/* Overnight Indicator Alert */}
              {isOvernight && (
                <div className="p-4 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200 flex items-start gap-3 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MdNightsStay size={20} />
                  </div>
                  <div className="text-xs leading-relaxed space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-indigo-950 dark:text-indigo-100 font-bold text-sm">
                        ينتهي وقت العمل في اليوم التالي (فترة ليلية - Overnight) 🌙
                      </strong>
                    </div>
                    <p className="text-indigo-700 dark:text-indigo-300 text-xs">
                      نظراً لأن وقت الانتهاء ({formData.end_day}) يسبق وقت البدء ({formData.start_day})، تمتد ساعات التشغيل حتى فجر اليوم التالي، وتعتبر طلبات ما بعد منتصف الليل تابعة لنفس يوم العمل حتى الساعة {formData.end_day}.
                    </p>
                  </div>
                </div>
              )}

              {setupData?.working_hours_text && (
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span>صيغة مواعيد العمل المعروضة للعميل:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {setupData.working_hours_text}
                  </span>
                </div>
              )}
            </div>

            {/* 4. Social & Communication Channels */}
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

          {/* Right Column: Logo, Store Preview & System Info (1 col) */}
          <div className="space-y-6">
            {/* 1. Logo Settings Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white">
                <div className="flex items-center gap-2">
                  <MdImage size={20} className="text-primary" />
                  <h2 className="font-bold text-base">
                    شعار النشاط التجاري (Logo) <span className="text-red-500">*</span>
                  </h2>
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
                          <MdUploadFile
                            size={18}
                            className="text-emerald-600 dark:text-emerald-400 shrink-0"
                          />
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
                          <MdCheckCircle size={14} className="text-emerald-400" /> الشعار المحفوظ
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
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(true);
                        }}
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
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(true);
                      }}
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
                        {((formData.logo as string) || '').length} / 255
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

            {/* 2. Live Storefront Mockup Preview */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white">
                <div className="flex items-center gap-2">
                  <MdStore size={20} className="text-primary" />
                  <h2 className="font-bold text-base">معاينة واجهة المتجر</h2>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  معاينة حية
                </span>
              </div>

              {/* Mockup Card */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900 shadow-md">
                {/* Banner / Header */}
                <div className="relative h-28 w-full bg-gradient-to-r from-primary/80 via-primary to-primary-focus p-4 flex items-end justify-between overflow-hidden">
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-none" />
                  <div className="relative z-10 flex items-center gap-2 text-white">
                    <span className="text-xs font-bold tracking-wide">
                      {formData.name || 'اسم النشاط التجاري'}
                    </span>
                  </div>
                  {formData.branch_cover !== undefined && formData.branch_cover !== null && (
                    <span className="relative z-10 text-[10px] bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                      تغطية: {formData.branch_cover} كم
                    </span>
                  )}
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
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">
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
                      {formData.description ||
                        'نبذة النشاط التجاري والوصف التعريفي للخدمات والمنتجات ستظهر هنا للعملاء.'}
                    </p>
                  </div>

                  {/* Table Order Banner in Preview */}
                  {formData.table_order_url && (
                    <div className="mt-3 p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-primary">
                        <MdQrCodeScanner size={16} />
                        <span className="font-bold">طلب الطاولة متاح</span>
                      </div>
                      <a
                        href={formData.table_order_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                      >
                        معاينة <MdOpenInNew size={12} />
                      </a>
                    </div>
                  )}

                  {/* Connected Social Accounts Footer */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      قنوات التواصل:
                    </span>
                    <div className="flex items-center gap-2">
                      {formData.whats ? (
                        <span
                          className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shadow-xs"
                          title="واتساب متصل"
                        >
                          <FaWhatsapp size={13} />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center opacity-40">
                          <FaWhatsapp size={13} />
                        </span>
                      )}

                      {formData.face ? (
                        <span
                          className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shadow-xs"
                          title="فيسبوك متصل"
                        >
                          <FaFacebook size={13} />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center opacity-40">
                          <FaFacebook size={13} />
                        </span>
                      )}

                      {formData.instagram ? (
                        <span
                          className="w-6 h-6 rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400 flex items-center justify-center shadow-xs"
                          title="انستغرام متصل"
                        >
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

            {/* 3. Audit & System Info Card (If existing) */}
            {isExisting && setupData && (
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    معلومات السجل
                  </span>
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
