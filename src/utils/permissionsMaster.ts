import type { PermissionAction } from '../types';

export interface PermissionModuleMeta {
  key: string;
  label: string;
  description: string;
  category: string;
  supportedActions: PermissionAction[];
}

export const PERMISSION_CATEGORIES: string[] = [
  'المبيعات والطلبات',
  'المنتجات والمطبخ',
  'التصنيع والوصفات',
  'المخازن والمشتريات',
  'المالية والتقارير',
  'الصالة والتشغيل',
  'إدارة النظام والصلاحيات',
];

export const PERMISSIONS_MASTER_LIST: PermissionModuleMeta[] = [
  // ── المبيعات والطلبات ──────────────────────────────────────────
  {
    key: 'order',
    label: 'الطلبات والمبيعات',
    description: 'إدارة واستعراض فواتير وطلبات العملاء الحالية والسابقة',
    category: 'المبيعات والطلبات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'sale',
    label: 'المبيعات الخارجية',
    description: 'إدارة فواتير المبيعات الخارجية ومنافذ التوزيع',
    category: 'المبيعات والطلبات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'sale_due',
    label: 'أقساط ومستحقات المبيعات',
    description: 'متابعة وسداد أقساط وديون فواتير المبيعات',
    category: 'المبيعات والطلبات',
    supportedActions: ['all', 'view', 'update'],
  },
  {
    key: 'saler',
    label: 'الموزعون والعملاء',
    description: 'إدارة حسابات مسؤولي المبيعات والعملاء الآجلين',
    category: 'المبيعات والطلبات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'cashier',
    label: 'أجهزة ونقاط البيع (POS)',
    description: 'إدارة أجهزة الكاشير ونقاط البيع في الفروع',
    category: 'المبيعات والطلبات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'cashier_man',
    label: 'موظفو الكاشير',
    description: 'إدارة وتعيين موظفي الكاشير على الأجهزة',
    category: 'المبيعات والطلبات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'captain_order',
    label: 'كباتن الصالة / الويترز',
    description: 'إدارة كباتن الصالة وتلقي طلبات الطاولات',
    category: 'المبيعات والطلبات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'delivery',
    label: 'طيارو ومناديب التوصيل',
    description: 'إدارة سائقي التوصيل والدليفري وتوزيع الأوردرات',
    category: 'المبيعات والطلبات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },

  // ── المنتجات والمطبخ ──────────────────────────────────────────
  {
    key: 'category',
    label: 'الأقسام والتصنيفات',
    description: 'إدارة تصنيفات وقوائم الطعام الرئيسية والفرعية',
    category: 'المنتجات والمطبخ',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'product',
    label: 'المنتجات وقائمة الطعام',
    description: 'إدارة الأصناف، التسعير، المتغيرات، والخيارات',
    category: 'المنتجات والمطبخ',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'addon',
    label: 'الإضافات والمقبلات',
    description: 'إدارة الإضافات والجبن والمقبلات الاختيارية',
    category: 'المنتجات والمطبخ',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'kitchen',
    label: 'المطابخ',
    description: 'إدارة وتوزيع المطابخ وشاشات الشيف (KDS)',
    category: 'المنتجات والمطبخ',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'kitchen_product',
    label: 'توزيع المنتجات على المطابخ',
    description: 'تعيين الأصناف والمنتجات على كل مطبخ مختص',
    category: 'المنتجات والمطبخ',
    supportedActions: ['all', 'view', 'update'],
  },
  {
    key: 'discount',
    label: 'الخصومات والعروض',
    description: 'إدارة كوبونات الخصم ونسب التخفيض للعملاء',
    category: 'المنتجات والمطبخ',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'tax',
    label: 'الضرائب والرسوم',
    description: 'إدارة نسب وضوابط القيمة المضافة وضرائب الصالة',
    category: 'المنتجات والمطبخ',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },

  // ── التصنيع والوصفات ──────────────────────────────────────────
  {
    key: 'product_manufacturing',
    label: 'معايير وتراكيب المنتجات (BOM)',
    description: 'تحديد المعايير المعتمدة والمكونات الداخلة في كل وجبة',
    category: 'التصنيع والوصفات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'product_recipe',
    label: 'وصفات المنتجات نصف المصنعة',
    description: 'إدارة الخلطات والوصفات التجهيزية ومتابعة تكاليفها',
    category: 'التصنيع والوصفات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'manufacturing',
    label: 'أوامر وعمليات التصنيع الفعلي',
    description: 'تشغيل وتتبع عمليات الإنتاج والتصنيع داخل الفروع',
    category: 'التصنيع والوصفات',
    supportedActions: ['all', 'view', 'add'],
  },

  // ── المخازن والمشتريات ──────────────────────────────────────────
  {
    key: 'purchase',
    label: 'فواتير المشتريات',
    description: 'إنشاء ومراجعة فواتير توريد الخامات والإضافات',
    category: 'المخازن والمشتريات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'purchase_due',
    label: 'أقساط ومستحقات المشتريات',
    description: 'إدارة وسداد ديون الموردين وأقساط المشتريات',
    category: 'المخازن والمشتريات',
    supportedActions: ['all', 'view', 'update'],
  },
  {
    key: 'supplier',
    label: 'الموردون',
    description: 'سجل الموردين وبيانات الاتصال والأرصدة',
    category: 'المخازن والمشتريات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'material',
    label: 'المواد الخام والمكونات',
    description: 'تعريف وتتبع المواد الخام ومستويات إعادة الطلب',
    category: 'المخازن والمشتريات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'inventory',
    label: 'جرد المخازن (خامات / وصفات / إضافات)',
    description: 'تنفيذ ومراجعة جلسات الجرد الدوري وتسوية الفروقات',
    category: 'المخازن والمشتريات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'unit',
    label: 'وحدات القياس والتحويل',
    description: 'إدارة وحدات القياس (كيلو، جرام، لتر، إلخ) ومعاملاتها',
    category: 'المخازن والمشتريات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'waste',
    label: 'الهوالك والتوالف',
    description: 'تسجيل الهالك من الخامات والوجبات وأسباب التلف',
    category: 'المخازن والمشتريات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },

  // ── المالية والتقارير ──────────────────────────────────────────
  {
    key: 'financial_account',
    label: 'الخزائن والحسابات المالية',
    description: 'إدارة الخزائن النقدية، البنوك، وحسابات الدفع',
    category: 'المالية والتقارير',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'expense_list',
    label: 'بنود المصروفات',
    description: 'تسجيل المصروفات التشغيلية والنثرية',
    category: 'المالية والتقارير',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'payment_method',
    label: 'طرق الدفع',
    description: 'إدارة وتفعيل طرق الدفع (نقدي، شبكة، إلكتروني)',
    category: 'المالية والتقارير',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'shift',
    label: 'الورديات والشيفتات',
    description: 'إدارة فتح وإغلاق الشيفتات ومتابعة العهد النقدية',
    category: 'المالية والتقارير',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'report',
    label: 'تقارير الورديات والمبيعات',
    description: 'استخراج تقارير الأداء، المبيعات، وإغلاقات الورديات',
    category: 'المالية والتقارير',
    supportedActions: ['all', 'view'],
  },
  {
    key: 'dashboard',
    label: 'لوحة الإحصائيات العامة',
    description: 'عرض الرسوم البيانية والمؤشرات والملخصات العامة',
    category: 'المالية والتقارير',
    supportedActions: ['all', 'view'],
  },

  // ── الصالة والتشغيل ──────────────────────────────────────────
  {
    key: 'hall',
    label: 'الصالات والغرف',
    description: 'إدارة صالات الطعام، الأدوار، والأقسام الداخلية',
    category: 'الصالة والتشغيل',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'hall_table',
    label: 'طاولات الصالة ورموز الـ QR',
    description: 'إدارة الطاولات والسعة وأكواد QR الخاصة بطلب الصالة',
    category: 'الصالة والتشغيل',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'banner',
    label: 'البانرات والإعلانات',
    description: 'إدارة الإعلانات والعروض الترويجية المصورة',
    category: 'الصالة والتشغيل',
    supportedActions: ['all', 'view', 'add', 'delete'],
  },

  // ── إدارة النظام والصلاحيات ───────────────────────────────────
  {
    key: 'admin',
    label: 'إدارة حسابات مسؤولي النظام',
    description: 'إنشاء وتعديل مستخدمي لوحة التحكم وإسناد الأدوار لهم',
    category: 'إدارة النظام والصلاحيات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'role',
    label: 'إدارة الأدوار والصلاحيات',
    description: 'تحديد المسميات الوظيفية وصلاحيات كل دور بدقة',
    category: 'إدارة النظام والصلاحيات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'branch',
    label: 'الفروع ومواقعها',
    description: 'إدارة فروع المطعم، العناوين، ونطاقات الخرائط',
    category: 'إدارة النظام والصلاحيات',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  },
  {
    key: 'business_setup',
    label: 'إعدادات النظام والمطعم',
    description: 'إعدادات المتجر العامة، اللوجو، ساعات العمل والضريبة',
    category: 'إدارة النظام والصلاحيات',
    supportedActions: ['all', 'view', 'update'],
  },
];

export const PERMISSIONS_ACTION_LABELS: Record<PermissionAction, { label: string; color: string }> = {
  all: { label: 'كامل الصلاحيات (All)', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  view: { label: 'عرض وتصفح (View)', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  add: { label: 'إضافة وإنشاء (Add)', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  update: { label: 'تعديل وتحديث (Update)', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  delete: { label: 'حذف (Delete)', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
};

export const getPermissionModuleMeta = (key: string): PermissionModuleMeta => {
  const found = PERMISSIONS_MASTER_LIST.find((m) => m.key === key);
  if (found) return found;
  return {
    key,
    label: key,
    description: `صلاحيات موديول ${key}`,
    category: 'أخرى',
    supportedActions: ['all', 'view', 'add', 'update', 'delete'],
  };
};

