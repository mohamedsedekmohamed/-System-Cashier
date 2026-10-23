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
  MdCardGiftcard,
  MdClose,
  MdRestaurantMenu,
  MdAddPhotoAlternate,
  MdZoomIn,
  MdArrowBack,
  MdArrowForward,
  MdChevronLeft,
  MdChevronRight,
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

export interface MenuItemState {
  id: string;
  type: 'file' | 'existing';
  file?: File;
  previewUrl: string;
  pathOrUrl: string;
  name?: string;
  size?: number;
}

const resolveMenuImageUrl = (path: string): string => {
  if (!path) return '';
  if (
    path.startsWith('blob:') ||
    path.startsWith('data:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }
  const clean = path.startsWith('/') ? path.slice(1) : path;
  if (clean.startsWith('storage/')) {
    return `https://ecommerce.mazoom.online/${clean}`;
  }
  return `https://ecommerce.mazoom.online/storage/${clean}`;
};

const parseMenuData = (rawMenu: any): string[] => {
  if (!rawMenu) return [];
  if (Array.isArray(rawMenu)) {
    return rawMenu.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0
    );
  }
  if (typeof rawMenu === 'string') {
    try {
      const parsed = JSON.parse(rawMenu);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === 'string' && item.trim().length > 0
        );
      }
    } catch {
      if (rawMenu.trim()) return [rawMenu.trim()];
    }
  }
  return [];
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
    has_gift: false,
    price_gift: null,
    menu: [],
  });

  // ── File Upload States ─────────────────
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const [logoUploadMode, setLogoUploadMode] = useState<'file' | 'url'>('file');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  // ── Menu Images States ─────────────────
  const [menuItems, setMenuItems] = useState<MenuItemState[]>([]);
  const [deletedMenuPaths, setDeletedMenuPaths] = useState<string[]>([]);
  const [isDraggingMenu, setIsDraggingMenu] = useState(false);
  const menuFileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
        has_gift: setupData.has_gift ?? false,
        price_gift:
          setupData.price_gift !== null && setupData.price_gift !== undefined
            ? Number(setupData.price_gift)
            : null,
      });

      setLogoFile(null);
      setLogoPreviewUrl(initialLogo);
      setImageLoadFailed(false);

      // Populate menu items
      const parsedMenu = parseMenuData(setupData.menu);
      const initialMenuItems: MenuItemState[] = parsedMenu.map((path, idx) => ({
        id: `existing-${idx}-${path}`,
        type: 'existing',
        previewUrl: resolveMenuImageUrl(path),
        pathOrUrl: path,
        name: path.split('/').pop() || `صورة منيو ${idx + 1}`,
      }));
      setMenuItems(initialMenuItems);
      setDeletedMenuPaths([]);
    }
  }, [setupData]);

  // Clean up menu object URLs when unmounted or changed
  useEffect(() => {
    return () => {
      menuItems.forEach((item) => {
        if (item.type === 'file' && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [menuItems]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null && prev < menuItems.length - 1 ? prev + 1 : prev
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, menuItems.length]);

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
      setDeletedMenuPaths([]);
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

  // ── Menu Handlers ─────────────────────
  const handleMenuFilesSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: MenuItemState[] = Array.from(files).map((file, idx) => ({
      id: `file-${Date.now()}-${idx}-${file.name}`,
      type: 'file',
      file,
      previewUrl: URL.createObjectURL(file),
      pathOrUrl: file.name,
      name: file.name,
      size: file.size,
    }));
    setMenuItems((prev) => [...prev, ...newItems]);
  };

  const handleRemoveMenuItem = (index: number) => {
    setMenuItems((prev) => {
      const target = prev[index];
      if (target) {
        if (target.type === 'file' && target.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(target.previewUrl);
        } else if (target.type === 'existing' && target.pathOrUrl) {
          // Track existing server image for deleted_menu / delete_menu
          setDeletedMenuPaths((dPrev) => [...dPrev, target.pathOrUrl]);
        }
      }
      return prev.filter((_, i) => i !== index);
    });
    if (lightboxIndex !== null) {
      if (index === lightboxIndex) {
        setLightboxIndex(null);
      } else if (index < lightboxIndex) {
        setLightboxIndex(lightboxIndex - 1);
      }
    }
  };

  const handleMoveMenuItem = (index: number, direction: 'up' | 'down') => {
    setMenuItems((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleClearAllMenu = () => {
    if (menuItems.length === 0) return;
    if (window.confirm('هل أنت متأكد من رغبتك في حذف كافة صور المنيو؟')) {
      // Track all existing server images for deleted_menu / delete_menu
      const existingPaths = menuItems
        .filter((item) => item.type === 'existing' && item.pathOrUrl)
        .map((item) => item.pathOrUrl);
      if (existingPaths.length > 0) {
        setDeletedMenuPaths((prev) => [...prev, ...existingPaths]);
      }

      menuItems.forEach((item) => {
        if (item.type === 'file' && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      setMenuItems([]);
      setLightboxIndex(null);
    }
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

    // Separate existing remaining server images from newly uploaded files
    const existingMenuPaths = menuItems
      .filter((item) => item.type === 'existing' && item.pathOrUrl)
      .map((item) => item.pathOrUrl);

    // Newly uploaded files in this session to append
    const newMenuFiles = menuItems
      .filter((item) => item.type === 'file' && item.file)
      .map((item) => item.file!);

    // Paths of existing server images deleted in this session
    const uniqueDeletedMenu = Array.from(new Set(deletedMenuPaths));

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
      has_gift: formData.has_gift ?? false,
      price_gift:
        typeof formData.price_gift === 'number' && !isNaN(formData.price_gift)
          ? Math.round(formData.price_gift)
          : null,
      // In update (تعديل): menu sends ONLY existing paths (never newly uploaded files) to prevent duplicate addition
      menu: isExisting ? existingMenuPaths : newMenuFiles,
      new_menu: isExisting ? newMenuFiles : [],
      deleted_menu: isExisting ? uniqueDeletedMenu : [],
      delete_menu: isExisting ? uniqueDeletedMenu : [],
    });
  };

  const handleReset = () => {
    // Revoke any newly added file blob URLs
    menuItems.forEach((item) => {
      if (item.type === 'file' && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    setDeletedMenuPaths([]);

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
        has_gift: setupData.has_gift ?? false,
        price_gift:
          setupData.price_gift !== null && setupData.price_gift !== undefined
            ? Number(setupData.price_gift)
            : null,
        menu: [],
      });

      setLogoFile(null);
      setLogoPreviewUrl(initialLogo);

      // Reset menu items to saved server state
      const parsedMenu = parseMenuData(setupData.menu);
      setMenuItems(
        parsedMenu.map((path, idx) => ({
          id: `existing-${idx}-${path}`,
          type: 'existing',
          previewUrl: resolveMenuImageUrl(path),
          pathOrUrl: path,
          name: path.split('/').pop() || `صورة منيو ${idx + 1}`,
        }))
      );
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
        has_gift: false,
        price_gift: null,
        menu: [],
      });
      setLogoFile(null);
      setLogoPreviewUrl('');
      setMenuItems([]);
    }
    setImageLoadFailed(false);
    setLightboxIndex(null);
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

            {/* 2. Menu Images Section (menu: array of files/strings) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2.5 text-slate-800 dark:text-white">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
                    <MdRestaurantMenu size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-base">صور قائمة الطعام والمنيو (Menu Images)</h2>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                        menu
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      رفع وإدارة صور صفحات المنيو (ملفات من الجهاز أو مسارات/روابط بالخادم)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {menuItems.length} {menuItems.length === 1 ? 'صورة مرفوعة' : 'صور مرفوعة'}
                  </span>
                </div>
              </div>

              {/* Hidden multi-file input */}
              <input
                ref={menuFileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  handleMenuFilesSelect(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />

              {/* Multi-file Drag & Drop Zone */}
              <div
                onClick={() => menuFileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingMenu(true);
                }}
                onDragLeave={() => setIsDraggingMenu(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingMenu(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleMenuFilesSelect(e.dataTransfer.files);
                  }
                }}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  isDraggingMenu
                    ? 'border-primary bg-primary/10 scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary/60 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                  <MdAddPhotoAlternate size={26} />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center">
                  اضغط لاختيار صور صفحات المنيو من جهازك أو اسحبها وأفلتها هنا
                </p>
                <p className="text-xs text-slate-400 mt-1 text-center">
                  يمكنك تحديد عدة صور دفعة واحدة لصفحات المنيو (PNG, JPG, WEBP بحد أقصى 10MB لكل صورة)
                </p>
              </div>

              {/* Gallery Grid */}
              {menuItems.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      صفحات المنيو الحالية ({menuItems.length})
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => menuFileInputRef.current?.click()}
                        className="text-primary hover:underline font-medium flex items-center gap-1"
                      >
                        <MdCloudUpload size={14} /> إضافة صور أخرى
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllMenu}
                        className="text-rose-500 hover:underline font-medium flex items-center gap-1"
                      >
                        <MdDeleteOutline size={14} /> مسح الكل
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {menuItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="group relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col"
                      >
                        {/* Page Number & Type Badges */}
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-bold shadow-xs">
                            صفحة {index + 1}
                          </span>
                        </div>

                        <div className="absolute top-2 left-2 z-10">
                          {item.type === 'file' ? (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-semibold flex items-center gap-0.5 shadow-xs">
                              <MdCheck size={12} /> جديد
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-sky-600/90 text-white text-[10px] font-semibold flex items-center gap-0.5 shadow-xs">
                              <MdCheckCircle size={12} /> محفوظ
                            </span>
                          )}
                        </div>

                        {/* Image Preview Container */}
                        <div
                          onClick={() => setLightboxIndex(index)}
                          className="relative aspect-[3/4] w-full bg-slate-200/50 dark:bg-slate-800/80 cursor-pointer overflow-hidden flex items-center justify-center"
                        >
                          <img
                            src={item.previewUrl}
                            alt={item.name || `صفحة ${index + 1}`}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.triedFallback) {
                                target.dataset.triedFallback = 'true';
                                const clean = item.pathOrUrl.startsWith('/') ? item.pathOrUrl.slice(1) : item.pathOrUrl;
                                if (clean.startsWith('storage/')) {
                                  target.src = `https://ecommerce.mazoom.online/${clean.replace(/^storage\//, '')}`;
                                } else {
                                  target.src = `https://ecommerce.mazoom.online/${clean}`;
                                }
                              }
                            }}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* Quick Hover Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(index);
                              }}
                              className="w-8 h-8 rounded-full bg-white/90 text-slate-800 hover:bg-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                              title="تكبير ومعاينة الصفحة"
                            >
                              <MdZoomIn size={18} />
                            </button>
                            {item.previewUrl && (
                              <a
                                href={item.previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-8 h-8 rounded-full bg-white/90 text-slate-800 hover:bg-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                                title="فتح الصورة الأصلية"
                              >
                                <MdOpenInNew size={16} />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Footer Details & Reordering */}
                        <div className="p-2.5 bg-white dark:bg-slate-800 flex items-center justify-between gap-1 text-xs border-t border-slate-100 dark:border-slate-700/80">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]" title={item.name || item.pathOrUrl}>
                              {item.name || item.pathOrUrl}
                            </p>
                            {item.size ? (
                              <span className="text-[10px] text-slate-400 block">
                                {formatFileSize(item.size)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono truncate block" title={item.pathOrUrl}>
                                {item.pathOrUrl}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            {/* Reorder Buttons */}
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveMenuItem(index, 'up')}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                              title="تحريك للأمام (صفحة سابقة)"
                            >
                              <MdArrowForward size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={index === menuItems.length - 1}
                              onClick={() => handleMoveMenuItem(index, 'down')}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                              title="تحريك للخلف (صفحة تالية)"
                            >
                              <MdArrowBack size={14} />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveMenuItem(index)}
                              className="p-1 rounded-md text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="حذف هذه الصفحة من المنيو"
                            >
                              <MdDeleteOutline size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Empty state for menu */
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <MdRestaurantMenu size={22} />
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    لم تتم إضافة أي صور لقائمة الطعام حتى الآن
                  </p>
                  <p className="text-[11px] text-slate-400">
                    يمكنك اختيار أو سحب وإفلات صور صفحات المنيو لرفعها مباشرة من جهازك.
                  </p>
                </div>
              )}
            </div>

            {/* 3. Table Orders & Branch Coverage Section */}
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

            {/* 3. Gift Promotion Section (has_gift & price_gift) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 text-slate-800 dark:text-white">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                    <MdCardGiftcard size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-base">عروض الهدايا الترويجية للطلبات (Gift Promotion)</h2>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        has_gift &amp; price_gift
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      تفعيل ميزة تقديم صنف أو وجبة هدية مع الطلبات وتحديد سعرها الرمزي للعملاء
                    </p>
                  </div>
                </div>

                {/* Status Pill */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
                    formData.has_gift
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      formData.has_gift ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span>{formData.has_gift ? 'عرض الهدية مفعّل' : 'عرض الهدية معطّل'}</span>
                </span>
              </div>

              {/* Toggle Switch Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="has_gift_toggle"
                      className="text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      تفعيل عرض الهدية الترويجي (has_gift)
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">(boolean)</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    عند التفعيل، يتم تمكين إضافة الصنف الهدية للطلبات وإتاحتها للعملاء في السلة وفقاً لقواعد العرض
                  </p>
                </div>

                {/* Switch Button */}
                <button
                  type="button"
                  id="has_gift_toggle"
                  role="switch"
                  aria-checked={Boolean(formData.has_gift)}
                  onClick={() =>
                    setFormData((prev) => {
                      const nextHasGift = !prev.has_gift;
                      return {
                        ...prev,
                        has_gift: nextHasGift,
                        price_gift: nextHasGift ? (prev.price_gift ?? 1) : prev.price_gift,
                      };
                    })
                  }
                  className={`relative flex h-8 w-14 items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${
                    formData.has_gift ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ${
                      formData.has_gift ? 'translate-x-0' : '-translate-x-6'
                    }`}
                  >
                    {formData.has_gift ? (
                      <MdCheck size={14} className="text-emerald-500" />
                    ) : (
                      <MdClose size={14} className="text-slate-400" />
                    )}
                  </span>
                </button>
              </div>

              {/* Price Gift Field */}
              <div className={`space-y-3 transition-opacity duration-200 ${formData.has_gift ? 'opacity-100' : 'opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      سعر عنصر الهدية (price_gift)
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">(integer or null)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">قيمة عددية صحيحة (مثال: 1 أو 0)</span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    name="price_gift"
                    min={0}
                    step={1}
                    value={formData.price_gift ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        price_gift: val === '' ? null : Math.round(Number(val)),
                      }));
                    }}
                    placeholder="1"
                    disabled={!formData.has_gift}
                    className="w-full px-4 py-2.5 pr-10 pl-24 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono font-bold text-base disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none">
                    <MdCardGiftcard size={18} />
                  </div>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                    ج.م
                  </span>
                </div>

                {/* Helper info & Quick Presets */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <p className="text-slate-400">
                    السعر الرمزي لعنصر الهدية (ضع 0 إذا كانت الهدية مجانية بالكامل، أو 1 لسعر رمزي).
                  </p>

                  {formData.has_gift && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">اختيار سريع:</span>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, price_gift: 0 }))}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                          formData.price_gift === 0
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        مجاني (0)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, price_gift: 1 }))}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                          formData.price_gift === 1
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        رمزي (1)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Restaurant Working Hours & Overnight Shifts Section */}
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

            {/* 5. Social & Communication Channels */}
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

                  {/* Gift Promotion Banner in Preview */}
                  {formData.has_gift && (
                    <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-primary/10 border border-amber-500/30 dark:border-amber-500/20 flex items-center justify-between text-xs animate-in fade-in">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <MdCardGiftcard size={14} />
                        </div>
                        <div>
                          <span className="font-bold block text-slate-800 dark:text-slate-100">عرض الهدية مفعّل 🎁</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {formData.price_gift !== null && formData.price_gift !== undefined
                              ? Number(formData.price_gift) === 0
                                ? 'هدية مجانية مع الطلب'
                                : `سعر الهدية: ${formData.price_gift} ج.م`
                              : 'هدية مجانية مع الطلب'}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/30">
                        Gift Promo
                      </span>
                    </div>
                  )}

                  {/* Menu Images Banner in Preview */}
                  {menuItems.length > 0 ? (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <MdRestaurantMenu size={16} className="text-primary" />
                          <span>قائمة الطعام (المنيو)</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                          {menuItems.length} {menuItems.length === 1 ? 'صفحة' : 'صفحات'}
                        </span>
                      </div>

                      {/* Mini Thumbnail Strip in Preview */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {menuItems.slice(0, 4).map((item, idx) => (
                          <div
                            key={item.id}
                            onClick={() => setLightboxIndex(idx)}
                            className="relative w-12 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                            title={`معاينة صفحة ${idx + 1}`}
                          >
                            <img
                              src={item.previewUrl}
                              alt={`Menu ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] text-center font-bold">
                              {idx + 1}
                            </span>
                          </div>
                        ))}
                        {menuItems.length > 4 && (
                          <button
                            type="button"
                            onClick={() => setLightboxIndex(4)}
                            className="w-12 h-14 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex flex-col items-center justify-center shrink-0 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                          >
                            <span>+{menuItems.length - 4}</span>
                            <span className="text-[8px]">أخرى</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setLightboxIndex(0)}
                        className="w-full py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <MdZoomIn size={14} /> تصفح صفحات المنيو ({menuItems.length})
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-400 flex items-center gap-2">
                      <MdRestaurantMenu size={16} />
                      <span>لم تتم إضافة صور لقائمة الطعام بعد</span>
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

      {/* ── Lightbox Modal for Menu Images ───────── */}
      {lightboxIndex !== null && menuItems[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Lightbox Header */}
          <div
            className="flex items-center justify-between text-white pb-3 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <MdRestaurantMenu size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  معاينة قائمة الطعام (المنيو)
                </h3>
                <span className="text-xs text-white/70">
                  صفحة {lightboxIndex + 1} من {menuItems.length} &bull;{' '}
                  {menuItems[lightboxIndex].name || menuItems[lightboxIndex].pathOrUrl}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {menuItems[lightboxIndex].previewUrl && (
                <a
                  href={menuItems[lightboxIndex].previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <MdOpenInNew size={14} /> فتح في نافذة مستقلة
                </a>
              )}
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="إغلاق"
              >
                <MdClose size={20} />
              </button>
            </div>
          </div>

          {/* Lightbox Main Image & Navigation */}
          <div
            className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Page Button */}
            {lightboxIndex > 0 && (
              <button
                type="button"
                onClick={() => setLightboxIndex(lightboxIndex - 1)}
                className="absolute right-4 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                title="الصفحة السابقة"
              >
                <MdChevronRight size={28} />
              </button>
            )}

            {/* Current Image */}
            <img
              src={menuItems[lightboxIndex].previewUrl}
              alt={menuItems[lightboxIndex].name || `صفحة ${lightboxIndex + 1}`}
              className="max-h-[78vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-200"
            />

            {/* Next Page Button */}
            {lightboxIndex < menuItems.length - 1 && (
              <button
                type="button"
                onClick={() => setLightboxIndex(lightboxIndex + 1)}
                className="absolute left-4 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                title="الصفحة التالية"
              >
                <MdChevronLeft size={28} />
              </button>
            )}
          </div>

          {/* Lightbox Mini Thumbnails Strip */}
          {menuItems.length > 1 && (
            <div
              className="flex items-center justify-center gap-2 pt-2 overflow-x-auto max-w-full py-2"
              onClick={(e) => e.stopPropagation()}
            >
              {menuItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative w-14 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    idx === lightboxIndex
                      ? 'border-primary ring-2 ring-primary/50 scale-105 opacity-100'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={item.previewUrl}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] text-center font-bold">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BusinessSetupPage;
