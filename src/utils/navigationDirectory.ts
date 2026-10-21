export const normalizeArabic = (str: string): string =>
  str
    .toLowerCase()
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/[\u064B-\u065F]/g, '')
    .trim();

export type PageActionType = 'add' | 'list' | 'report' | 'settings' | 'inventory';

export interface NavigationPageItem {
  id: string;
  title: string;
  category: string;
  actionType: PageActionType;
  path: string;
  description: string;
  keywords: string[];
}

export const ACTION_BADGES: Record<PageActionType, { label: string; colorClass: string; bgClass: string }> = {
  add: {
    label: 'إضافة جديدة',
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
  },
  list: {
    label: 'عرض وإدارة',
    colorClass: 'text-blue-700 dark:text-blue-300',
    bgClass: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
  },
  report: {
    label: 'تقرير وإحصائيات',
    colorClass: 'text-purple-700 dark:text-purple-300',
    bgClass: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
  },
  settings: {
    label: 'إعدادات',
    colorClass: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
  },
  inventory: {
    label: 'جرد ومخزون',
    colorClass: 'text-teal-700 dark:text-teal-300',
    bgClass: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800',
  },
};

export const NAVIGATION_PAGES: NavigationPageItem[] = [
  // ── الرئيسية ──
  {
    id: 'dashboard-home',
    title: 'لوحة التحكم الرئيسية',
    category: 'الرئيسية',
    actionType: 'list',
    path: '/dashboard',
    description: 'نظرة عامة على أداء النشاط، إجمالي المبيعات، الطلبات الحديثة، ونشاط النظام اللحظي',
    keywords: ['رئيسية', 'احصائيات', 'داشبورد', 'لوحة', 'مبيعات', 'ارباح', 'نظرة عامة', 'هوم'],
  },

  // ── الفروع ──
  {
    id: 'branch-add',
    title: 'إضافة فرع جديد',
    category: 'الفروع',
    actionType: 'add',
    path: '/dashboard/branches/add',
    description: 'إنشاء فرع جديد للمطعم وتحديد الاسم العربي والإنجليزي، الموقع، وبيانات الاتصال',
    keywords: ['اضافة فرع', 'فرع جديد', 'انشاء فرع', 'فروع', 'مطعم', 'مقر', 'فرعي', 'اضافه'],
  },
  {
    id: 'branch-list',
    title: 'قائمة وإدارة الفروع',
    category: 'الفروع',
    actionType: 'list',
    path: '/dashboard/branches',
    description: 'عرض جميع فروع المطعم، البحث والتعديل على بياناتها، والتحكم في تفعيل أو تعطيل الفروع',
    keywords: ['فروع', 'قائمة الفروع', 'عرض الفروع', 'تعديل فرع', 'فروع المطعم', 'ادارة'],
  },

  // ── الطلبات ──
  {
    id: 'order-add',
    title: 'إضافة طلب جديد',
    category: 'الطلبات',
    actionType: 'add',
    path: '/dashboard/orders/add',
    description: 'إنشاء وتسجيل طلب بيع جديد (سفري، صالة، أو دليفري)، اختيار الوجبات وتحديد الكاشير والفرع',
    keywords: ['اضافة طلب', 'طلب جديد', 'اوردر جديد', 'انشاء اوردر', 'فاتورة', 'سفري', 'توصيل', 'دليفري', 'صالة', 'تيك اواي', 'اضافه'],
  },
  {
    id: 'order-list',
    title: 'قائمة ومتابعة الطلبات',
    category: 'الطلبات',
    actionType: 'list',
    path: '/dashboard/orders',
    description: 'متابعة جميع الطلبات الواردة، تحديث حالات الطلب (مكتمل، جاري التوصيل، مرتجع)، وفلترة التواريخ',
    keywords: ['طلبات', 'قائمة الطلبات', 'اوردرات', 'حالات الطلب', 'تعديل طلب', 'فواتير', 'طلبات الاونلاين'],
  },

  // ── الأقسام ──
  {
    id: 'category-add',
    title: 'إضافة قسم جديد',
    category: 'الأقسام',
    actionType: 'add',
    path: '/dashboard/categories/add',
    description: 'إضافة تصنيف أو قسم جديد للوجبات، المواد الخام، أو وصفات التصنيع مع رفع صورته',
    keywords: ['اضافة قسم', 'قسم جديد', 'تصنيف جديد', 'اضافة تصنيف', 'categories', 'category', 'اضافه'],
  },
  {
    id: 'category-list',
    title: 'قائمة وإدارة الأقسام',
    category: 'الأقسام',
    actionType: 'list',
    path: '/dashboard/categories',
    description: 'استعراض وتعديل جميع الأقسام والتصنيفات الرئيسية والفرعية، الفلترة حسب النوع وحذف الأقسام',
    keywords: ['اقسام', 'الاقسام', 'تصنيفات', 'التصنيفات', 'قائمة الاقسام', 'categories', 'category'],
  },

  // ── المنتجات ──
  {
    id: 'product-add',
    title: 'إضافة منتج جديد',
    category: 'المنتجات',
    actionType: 'add',
    path: '/dashboard/products/add',
    description: 'إضافة صنف أو وجبة جديدة للقائمة، تحديد السعر، الأقسام، الضرائب المطبقة، وخيارات التحضير',
    keywords: ['اضافة منتج', 'منتج جديد', 'صنف جديد', 'وجبة جديدة', 'منيو', 'طعام', 'اكل', 'قائمة الاصناف', 'اضافه'],
  },
  {
    id: 'product-list',
    title: 'قائمة وإدارة المنتجات',
    category: 'المنتجات',
    actionType: 'list',
    path: '/dashboard/products',
    description: 'استعراض جميع أصناف المنيو، تعديل الأسعار والأقسام، وحذف أو تفعيل وتعطيل المنتجات',
    keywords: ['منتجات', 'منيو', 'اصناف', 'قائمة المنتجات', 'تعديل منتج', 'اسعار', 'وجبات'],
  },

  // ── منتجات غير منتهية التصنيع ──
  {
    id: 'recipe-add',
    title: 'إضافة منتج غير منتهي التصنيع جديد',
    category: 'منتجات غير منتهية التصنيع',
    actionType: 'add',
    path: '/dashboard/product-recipes/add',
    description: 'إنشاء منتج غير منتهي التصنيع وتحديد المواد الخام والمقادير لخصمها تلقائياً من المخزون مع كل طلب',
    keywords: ['منتجات غير منتهية التصنيع', 'اضافة منتج غير منتهي', 'اضافة وصفة', 'ريسيبي جديد', 'مكونات الوجبة', 'مقادير', 'طريقة التحضير', 'اضافه'],
  },
  {
    id: 'recipe-list',
    title: 'قائمة منتجات غير منتهية التصنيع',
    category: 'منتجات غير منتهية التصنيع',
    actionType: 'list',
    path: '/dashboard/product-recipes',
    description: 'عرض المنتجات غير منتهية التصنيع، تعديل المكونات والمقادير، ومتابعة رصيد مخزون الوجبات عبر الفروع',
    keywords: ['منتجات غير منتهية التصنيع', 'وصفات', 'ريسيبي', 'قائمة الوصفات', 'تعديل وصفة', 'مكونات الاصناف'],
  },

  // ── المطابخ ──
  {
    id: 'kitchen-add',
    title: 'إضافة مطبخ جديد',
    category: 'المطابخ',
    actionType: 'add',
    path: '/dashboard/kitchens/add',
    description: 'تعريف شاشة مطبخ جديدة وتعيين الفرع التابع له واسم المستخدم للدخول لشاشة الشيف',
    keywords: ['اضافة مطبخ', 'مطبخ جديد', 'شاشة مطبخ', 'طباخ', 'شيف', 'مطابخ', 'اضافه'],
  },
  {
    id: 'kitchen-list',
    title: 'قائمة المطابخ وتوزيع المنتجات',
    category: 'المطابخ',
    actionType: 'list',
    path: '/dashboard/kitchens',
    description: 'عرض مطابخ الفروع، تعديل بياناتها، وربط وتوزيع الأصناف على المطبخ المسؤول عن تحضيرها',
    keywords: ['مطابخ', 'قائمة المطابخ', 'توزيع المنتجات على المطابخ', 'تعديل مطبخ', 'ربط الاصناف'],
  },

  // ── الورديات والتقارير ──
  {
    id: 'shift-add',
    title: 'إضافة وردية جديدة',
    category: 'الورديات',
    actionType: 'add',
    path: '/dashboard/shifts/add',
    description: 'إنشاء وردية عمل جديدة وتحديد وقت البداية والنهاية والفرع المسؤول',
    keywords: ['اضافة وردية', 'وردية جديدة', 'شفت جديد', 'دوام', 'ساعات الوردية', 'اضافه'],
  },
  {
    id: 'shift-list',
    title: 'قائمة الورديات',
    category: 'الورديات',
    actionType: 'list',
    path: '/dashboard/shifts',
    description: 'عرض فترات الورديات، وتعديل مواعيد العمل وأوقات الشفتات لمختلف الفروع',
    keywords: ['ورديات', 'قائمة الورديات', 'شفتات العمل', 'تعديل وردية', 'مواعيد الشفت'],
  },
  {
    id: 'shift-report',
    title: 'تقرير بدء وانتهاء الورديات',
    category: 'التقارير',
    actionType: 'report',
    path: '/dashboard/reports/start-shifts',
    description: 'تقرير تفصيلي عن ورديات الكاشير، المبالغ الافتتاحية والختامية، والعجز والزيادة وإجمالي المبيعات',
    keywords: ['تقرير الورديات', 'تقارير', 'ايرادات الكاشير', 'تقفيل الوردية', 'جرد الدرج', 'شفتات'],
  },

  // ── الكاشير والموظفين ──
  {
    id: 'cashier-add',
    title: 'إضافة ماكينة كاشير (نقطة بيع)',
    category: 'الكاشير',
    actionType: 'add',
    path: '/dashboard/cashiers/add',
    description: 'تعريف جهاز كاشير جديد (POS)، وتعيين موظف الكاشير والفرع التابع له',
    keywords: ['اضافة كاشير', 'ماكينة كاشير', 'نقطة بيع', 'pos', 'جهاز كاشير', 'اضافه'],
  },
  {
    id: 'cashier-list',
    title: 'قائمة ماكينات الكاشير',
    category: 'الكاشير',
    actionType: 'list',
    path: '/dashboard/cashiers',
    description: 'عرض ماكينات ونقاط بيع الكاشير، تعديل الموظفين المسؤولين، وحالة تشغيل الأجهزة',
    keywords: ['كاشيرات', 'قائمة الكاشير', 'نقاط البيع', 'تعديل كاشير', 'اجهزة الكاشير'],
  },
  {
    id: 'cashier-man-add',
    title: 'إضافة موظف كاشير',
    category: 'موظفي الكاشير',
    actionType: 'add',
    path: '/dashboard/cashier-men/add',
    description: 'تسجيل بيانات موظف كاشير جديد وتعيين اسم المستخدم وكلمة المرور والفرع',
    keywords: ['اضافة موظف', 'كاشير مان', 'موظف كاشير جديد', 'مستخدم كاشير', 'بائع', 'اضافه'],
  },
  {
    id: 'cashier-man-list',
    title: 'قائمة موظفي الكاشير',
    category: 'موظفي الكاشير',
    actionType: 'list',
    path: '/dashboard/cashier-men',
    description: 'عرض موظفي الكاشير، تعديل بياناتهم وصلاحياتهم ومتابعة نشاطهم',
    keywords: ['موظفي الكاشير', 'كاشير مان', 'قائمة الموظفين', 'تعديل موظف كاشير'],
  },

  // ── المواد الخام والمخزون ──
  {
    id: 'material-add',
    title: 'إضافة مادة خام جديدة',
    category: 'المواد الخام',
    actionType: 'add',
    path: '/dashboard/materials/add',
    description: 'إضافة مادة خام أولية للمخزن، تحديد الاسم والقسم ووحدة القياس وسعر الشراء',
    keywords: ['اضافة مادة خام', 'مادة جديدة', 'خامات', 'مخزن', 'مستودع', 'مواد اولية', 'اضافه'],
  },
  {
    id: 'material-list',
    title: 'قائمة المواد الخام',
    category: 'المواد الخام',
    actionType: 'list',
    path: '/dashboard/materials',
    description: 'استعراض جميع المواد الخام المسجلة، أسعارها، وتعديل كمياتها وأقسامها عبر الفروع',
    keywords: ['مواد خام', 'قائمة المواد الخام', 'خامات المخزن', 'تعديل مادة خام'],
  },
  {
    id: 'material-inventory',
    title: 'جرد المواد الخام والمخزون',
    category: 'المخزون والجرد',
    actionType: 'inventory',
    path: '/dashboard/material-inventory',
    description: 'متابعة الأرصدة الفعلية للمخزون لكل فرع، تسجيل نتائج الجرد الدوري، ومقارنة الفعلي بالدفتري',
    keywords: ['جرد', 'مخزون', 'جرد المواد الخام', 'حصر المخزن', 'ارصدة الخامات', 'مستودع'],
  },
  {
    id: 'recipe-inventory',
    title: 'جرد وصفات التصنيع والمنتجات نصف المصنعة',
    category: 'المخزون والجرد',
    actionType: 'inventory',
    path: '/dashboard/recipe-inventory',
    description: 'حصر ومطابقة الأرصدة الدفترية والفعلية لتجهيزات المطبخ والوصفات الجاهزة وتسجيل الفروقات',
    keywords: ['جرد', 'وصفات', 'جرد الوصفات', 'نصف مصنعة', 'تجهيزات', 'حصر الوصفات', 'مطبخ'],
  },
  {
    id: 'waste-add',
    title: 'تسجيل هالك وتوالف',
    category: 'الهالك والتوالف',
    actionType: 'add',
    path: '/dashboard/wastes/add',
    description: 'تسجيل هالك في المواد الخام أو الوجبات المحضرة وتحديد سبب التلف لخصمها من المخزون',
    keywords: ['تسجيل هالك', 'اضافة هالك', 'توالف', 'مهدرات', 'تلف', 'خصم تالف', 'اضافه'],
  },
  {
    id: 'waste-list',
    title: 'سجل الهالك والتوالف',
    category: 'الهالك والتوالف',
    actionType: 'list',
    path: '/dashboard/wastes',
    description: 'عرض تقارير وسجل الهالك السابق وتعديل الكميات ومراجعة أسباب وتكاليف التوالف',
    keywords: ['هالك', 'توالف', 'سجل الهالك', 'تقارير الهالك', 'تعديل هالك'],
  },

  // ── المشتريات والموردين ──
  {
    id: 'purchase-add',
    title: 'إضافة فاتورة مشتريات',
    category: 'المشتريات',
    actionType: 'add',
    path: '/dashboard/purchases/add',
    description: 'تسجيل فاتورة شراء جديدة للمواد الخام من الموردين وتزويد المخزون تلقائياً',
    keywords: ['اضافة مشتريات', 'فاتورة شراء', 'شراء مواد خام', 'شراء خامات', 'موردين', 'اضافه'],
  },
  {
    id: 'purchase-list',
    title: 'قائمة فواتير المشتريات',
    category: 'المشتريات',
    actionType: 'list',
    path: '/dashboard/purchases',
    description: 'استعراض فواتير الشراء السابقة والمبالغ الإجمالية والموردين ومتابعة حركات التوريد',
    keywords: ['مشتريات', 'قائمة المشتريات', 'فواتير الشراء', 'سجل المشتريات'],
  },
  {
    id: 'supplier-add',
    title: 'إضافة مورد جديد',
    category: 'الموردين',
    actionType: 'add',
    path: '/dashboard/suppliers/add',
    description: 'تسجيل مورد جديد في النظام وتحديد بيانات الاتصال، العنوان، والسجل التجاري',
    keywords: ['اضافة مورد', 'مورد جديد', 'شركة توريد', 'تاجر', 'تجار', 'اضافه'],
  },
  {
    id: 'supplier-list',
    title: 'قائمة الموردين',
    category: 'الموردين',
    actionType: 'list',
    path: '/dashboard/suppliers',
    description: 'إدارة قائمة الموردين، تعديل بيانات التواصل ومتابعة الفواتير الموردة منهم',
    keywords: ['موردين', 'قائمة الموردين', 'تعديل مورد', 'شركات التوريد'],
  },

  // ── الصالات ──
  {
    id: 'hall-add',
    title: 'إضافة صالة جديدة',
    category: 'الصالات',
    actionType: 'add',
    path: '/dashboard/halls/add',
    description: 'إنشاء صالة جلوس جديدة في المطعم وربطها بالفرع لتنظيم وتوزيع الطاولات',
    keywords: ['اضافة صالة', 'صالة جديدة', 'قاعة جديدة', 'halls', 'hall', 'اضافه'],
  },
  {
    id: 'hall-list',
    title: 'قائمة وإدارة الصالات',
    category: 'الصالات',
    actionType: 'list',
    path: '/dashboard/halls',
    description: 'استعراض جميع صالات الجلوس في الفروع، تعديل البيانات، وتفعيل أو تعطيل الصالات',
    keywords: ['صالات', 'الصالات', 'قائمة الصالات', 'قاعات', 'halls', 'hall'],
  },

  // ── طاولات الصالة ──
  {
    id: 'hall-table-add',
    title: 'إضافة طاولة صالة جديدة',
    category: 'طاولات الصالة',
    actionType: 'add',
    path: '/dashboard/hall-tables/add',
    description: 'إنشاء طاولة صالة جديدة وتحديد رقم الطاولة وسعة الأفراد والفرع التابع لها',
    keywords: ['اضافة طاولة', 'طاولة جديدة', 'ترابيزة جديدة', 'صالة', 'سعة الطاولة', 'اضافه'],
  },
  {
    id: 'hall-table-list',
    title: 'قائمة طاولات الصالة',
    category: 'طاولات الصالة',
    actionType: 'list',
    path: '/dashboard/hall-tables',
    description: 'عرض وتعديل طاولات الصالة ومتابعة الطاولات المتاحة والمشغولة في كل فرع',
    keywords: ['طاولات', 'صالة', 'قائمة الطاولات', 'ترابيزات', 'تعديل طاولة'],
  },

  // ── التوصيل والطيارين ──
  {
    id: 'delivery-add',
    title: 'إضافة مندوب توصيل جديد (طيار)',
    category: 'مناديب التوصيل',
    actionType: 'add',
    path: '/dashboard/deliveries/add',
    description: 'تسجيل مندوب / كابتن توصيل جديد في النظام وتحديد أرقام الهاتف ورخصة القيادة والفرع',
    keywords: ['اضافة طيار', 'كابتن توصيل', 'سائق دليفري', 'طيار دليفري', 'اضافه', 'مندوب', 'مناديب', 'توصيل', 'دليفري'],
  },
  {
    id: 'delivery-list',
    title: 'قائمة مناديب وطياري التوصيل',
    category: 'مناديب التوصيل',
    actionType: 'list',
    path: '/dashboard/deliveries',
    description: 'إدارة فريق مناديب التوصيل وتعديل بياناتهم ومتابعة رحلات توصيل الطلبات للعملاء',
    keywords: ['توصيل', 'طيارين', 'سائقين', 'دليفري', 'تعديل طيار', 'مندوب', 'مناديب', 'كابتن', 'كباتن', 'دليفري'],
  },

  // ── المصروفات ──
  {
    id: 'expense-add',
    title: 'إضافة بند مصروفات جديد',
    category: 'قائمة المصروفات',
    actionType: 'add',
    path: '/dashboard/expense-lists/add',
    description: 'تسجيل بند مصروف تشغيلي (إيجار، صيانة، نثريات، كهرباء) وتحديد المبلغ والبيان',
    keywords: ['اضافة مصروف', 'بند مصروفات', 'نفقات', 'تكاليف', 'صيانة', 'ايجار', 'اضافه'],
  },
  {
    id: 'expense-list',
    title: 'قائمة المصروفات والنفقات',
    category: 'قائمة المصروفات',
    actionType: 'list',
    path: '/dashboard/expense-lists',
    description: 'عرض سجل بنود المصروفات وتعديلها ومتابعة إجمالي الصرف اليومي والشهري',
    keywords: ['مصروفات', 'نفقات', 'سجل المصروفات', 'تعديل مصروف', 'تكاليف التشغيل'],
  },

  // ── الحسابات المالية ──
  {
    id: 'financial-account-add',
    title: 'إضافة حساب مالي جديد',
    category: 'الحسابات المالية',
    actionType: 'add',
    path: '/dashboard/financial-accounts/add',
    description: 'إنشاء حساب مالي جديد (خزينة، بنك، محفظة إلكترونية)، تحديد الرصيد الافتتاحي والفرع ورفع الأيقونة',
    keywords: ['اضافة حساب مالي', 'حساب مالي جديد', 'خزينة جديدة', 'بنك جديد', 'حسابات مالية', 'خزنة', 'رصيد', 'financial', 'اضافه'],
  },
  {
    id: 'financial-account-list',
    title: 'قائمة وإدارة الحسابات المالية',
    category: 'الحسابات المالية',
    actionType: 'list',
    path: '/dashboard/financial-accounts',
    description: 'استعراض الحسابات المالية والخزائن، متابعة الأرصدة، الفلترة حسب الفرع، وتعديل أو حذف الحسابات',
    keywords: ['حسابات مالية', 'الحسابات المالية', 'خزائن', 'خزنة', 'بنوك', 'ارصدة الحسابات', 'قائمة الحسابات المالية', 'financial accounts'],
  },

  // ── معايير وتراكيب تصنيع المنتجات (BOM) ──
  {
    id: 'product-manufacturing-add',
    title: 'إضافة معيار تصنيع منتج جديد (BOM)',
    category: 'معايير تصنيع المنتجات',
    actionType: 'add',
    path: '/dashboard/product-manufacturings/add',
    description: 'تحديد المكونات والخامات القياسية المطلوبة لإنتاج قطعة واحدة من منتج جاهز أو غير منتهي التصنيع',
    keywords: ['معيار تصنيع', 'مواصفة تصنيع', 'تركيبة منتج', 'مكونات المنتج', 'bom', 'product manufacturing', 'اضافة معيار'],
  },
  {
    id: 'product-manufacturing-list',
    title: 'قائمة معايير وتراكيب تصنيع المنتجات',
    category: 'معايير تصنيع المنتجات',
    actionType: 'list',
    path: '/dashboard/product-manufacturings',
    description: 'استعراض مواصفات وتراكيب المنتجات والمواد الخام الداخلة في إنتاجها وتعديلها أو حذفها',
    keywords: ['معايير التصنيع', 'تراكيب المنتجات', 'مواصفات التصنيع', 'product manufacturings'],
  },

  // ── أوامر وقوائم التصنيع ──
  {
    id: 'manufacturing-add',
    title: 'إضافة أمر تصنيع وتشغيل جديد',
    category: 'أوامر التصنيع',
    actionType: 'add',
    path: '/dashboard/manufacturing/add',
    description: 'بدء عملية تصنيع وتشغيل بالفرع لتحويل المواد الخام إلى منتجات جاهزة أو نصف مصنعة وخصمها من المخزون',
    keywords: ['اضافة تصنيع', 'امر تشغيل', 'انتاج', 'تصنيع وجبات', 'تحضير', 'اضافه', 'امر انتاج'],
  },
  {
    id: 'manufacturing-list',
    title: 'سجل عمليات وأوامر التصنيع',
    category: 'أوامر التصنيع',
    actionType: 'list',
    path: '/dashboard/manufacturing',
    description: 'متابعة سجل أوامر التصنيع المنفذة في الفروع والكميات المنتجة والمواد المستهلكة',
    keywords: ['تصنيع', 'قوائم التصنيع', 'اوامر الانتاج', 'تشغيل', 'اوامر التصنيع'],
  },

  // ── الخصومات والعروض ──
  {
    id: 'discount-add',
    title: 'إضافة خصم أو عرض جديد',
    category: 'الخصومات',
    actionType: 'add',
    path: '/dashboard/discounts/add',
    description: 'إنشاء خصم ترويجي جديد وتحديد نسبته المئوية أو قيمته النقدية وحالة التفعيل',
    keywords: ['اضافة خصم', 'خصم جديد', 'تخفيض جديد', 'عروض', 'تخفيضات', 'discounts', 'discount', 'اضافه'],
  },
  {
    id: 'discount-list',
    title: 'قائمة وإدارة الخصومات',
    category: 'الخصومات',
    actionType: 'list',
    path: '/dashboard/discounts',
    description: 'استعراض جميع الخصومات والعروض الترويجية، تعديل النسب والقيم وتفعيل أو إيقاف الخصومات',
    keywords: ['خصومات', 'الخصومات', 'تخفيضات', 'عروض', 'discounts', 'discount', 'قائمة الخصومات'],
  },

  // ── الإضافات ──
  {
    id: 'addon-add',
    title: 'إضافة إضافة جديدة (Addon)',
    category: 'الإضافات',
    actionType: 'add',
    path: '/dashboard/addons/add',
    description: 'تعريف وتخصيص إضافات الوجبات والأطعمة (جبن، صوصات، مكملات) وتحديد السعر والمطبخ والضريبة',
    keywords: ['اضافة جديدة', 'اضافات', 'مكملات', 'توبنج', 'صوص', 'جبنة', 'addon', 'addons', 'اضافه'],
  },
  {
    id: 'addon-list',
    title: 'قائمة وإدارة الإضافات (Addons)',
    category: 'الإضافات',
    actionType: 'list',
    path: '/dashboard/addons',
    description: 'عرض جميع إضافات الأطعمة والخيارات الإضافية، تعديل الأسعار، ومتابعة المطابخ والضرائب المرتبطة',
    keywords: ['اضافات', 'قائمة الاضافات', 'مكملات الوجبات', 'توبنج', 'صوصات', 'addon', 'addons'],
  },

  // ── الضرائب وطرق الدفع ──
  {
    id: 'tax-add',
    title: 'إضافة ضريبة أو رسم جديد',
    category: 'الضرائب والرسوم',
    actionType: 'add',
    path: '/dashboard/taxes/add',
    description: 'تعريف ضريبة جديدة (نسبة مئوية أو قيمة ثابتة كالضريبة المضافة أو رسم الخدمة)',
    keywords: ['اضافة ضريبة', 'ضريبة جديدة', 'رسوم', 'قيمة مضافة', 'vat', 'خدمة', 'اضافه'],
  },
  {
    id: 'tax-list',
    title: 'قائمة الضرائب والرسوم',
    category: 'الضرائب والرسوم',
    actionType: 'list',
    path: '/dashboard/taxes',
    description: 'استعراض الضرائب والرسوم وتعديل نسبها وتحديد سريانها على المبيعات',
    keywords: ['ضرائب', 'رسوم', 'تعديل ضريبة', 'قيمة مضافة'],
  },
  {
    id: 'payment-method-add',
    title: 'إضافة طريقة دفع جديدة',
    category: 'طرق الدفع',
    actionType: 'add',
    path: '/dashboard/payment-methods/add',
    description: 'إضافة وسيلة دفع جديدة لنقاط البيع (فيزا، كاش، فودافون كاش، محفظة إلكترونية)',
    keywords: ['اضافة طريقة دفع', 'وسيلة دفع جديدة', 'فيزا', 'كاش', 'محفظة', 'اضافه'],
  },
  {
    id: 'payment-method-list',
    title: 'قائمة طرق الدفع',
    category: 'طرق الدفع',
    actionType: 'list',
    path: '/dashboard/payment-methods',
    description: 'إدارة وتعديل وسائل الدفع المتاحة في الكاشير وتفعيلها أو إيقافها',
    keywords: ['طرق الدفع', 'وسائل الدفع', 'تعديل طريقة دفع', 'كاش', 'فيزا'],
  },

  // ── المديرين والإعدادات ──
  {
    id: 'admin-add',
    title: 'إضافة مدير نظام جديد',
    category: 'المديرين',
    actionType: 'add',
    path: '/dashboard/admins/add',
    description: 'إنشاء حساب أدمن جديد وتعيين اسم المستخدم، البريد، كلمة المرور، والصلاحيات',
    keywords: ['اضافة مدير', 'ادمن جديد', 'مسؤول جديد', 'انشاء ادمن', 'مستخدم نظام', 'اضافه'],
  },
  {
    id: 'admin-list',
    title: 'قائمة المديرين والمسؤولين',
    category: 'المديرين',
    actionType: 'list',
    path: '/dashboard/admins',
    description: 'عرض جميع مسؤولي النظام وتعديل صلاحيات الإدارة والتحكم بحساباتهم',
    keywords: ['مديرين', 'ادمن', 'مسؤولين', 'صلاحيات المديرين', 'تعديل مدير'],
  },
  {
    id: 'settings-business',
    title: 'إعدادات النشاط وساعات العمل',
    category: 'الإعدادات',
    actionType: 'settings',
    path: '/dashboard/settings',
    description: 'ضبط بيانات المطعم الأساسية، مواعيد وساعات العمل، الشيفتات الليلية، والعملة',
    keywords: ['اعدادات', 'ساعات العمل', 'مواعيد العمل', 'شيفت ليلي', 'تعديل النشاط', 'اسم المطعم', 'ضبط'],
  },
  {
    id: 'user-profile',
    title: 'الملف الشخصي والحساب',
    category: 'الإعدادات',
    actionType: 'settings',
    path: '/dashboard/profile',
    description: 'تعديل بيانات الحساب الشخصي للمستخدم الحالي وتغيير كلمة المرور',
    keywords: ['بروفايل', 'الملف الشخصي', 'حسابي', 'تعديل كلمة المرور', 'بيانات الحساب'],
  },
];

/**
 * Filter navigation pages by query text and optional actionType filter.
 */
export function searchNavigation(
  query: string,
  filterAction?: PageActionType | 'all'
): NavigationPageItem[] {
  const normalizedQuery = normalizeArabic(query.trim());

  return NAVIGATION_PAGES.filter((item) => {
    // 1. Check action filter
    if (filterAction && filterAction !== 'all' && item.actionType !== filterAction) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    // 2. Normalize fields for fuzzy matching
    const titleNorm = normalizeArabic(item.title);
    const descNorm = normalizeArabic(item.description);
    const catNorm = normalizeArabic(item.category);
    const keywordsNorm: string[] = item.keywords.map((k: string) => normalizeArabic(k));

    // Direct substring in title, description, or category
    if (
      titleNorm.includes(normalizedQuery) ||
      descNorm.includes(normalizedQuery) ||
      catNorm.includes(normalizedQuery)
    ) {
      return true;
    }

    // Keyword matches
    if (keywordsNorm.some((k: string) => k.includes(normalizedQuery) || normalizedQuery.includes(k))) {
      return true;
    }

    // Split query by whitespace for multi-word match (e.g. "اضافة فرع")
    const words: string[] = normalizedQuery.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      const allWordsMatch = words.every(
        (word: string) =>
          titleNorm.includes(word) ||
          descNorm.includes(word) ||
          catNorm.includes(word) ||
          keywordsNorm.some((k: string) => k.includes(word))
      );
      if (allWordsMatch) return true;
    }

    return false;
  });
}
