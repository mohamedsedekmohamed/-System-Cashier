import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdStorefront,
  MdPointOfSale,
  MdPeople,
  MdDeliveryDining,
  MdReceiptLong,
  MdClose,
  MdDashboard,
  MdSoupKitchen,
  MdPrecisionManufacturing,
  MdLayers,
  MdPayment,
  MdFastfood,
  MdLocalShipping,
  MdMonetizationOn,
  MdDeleteOutline,
  MdSchedule,
  MdTableRestaurant,
  MdReceipt,
  MdSearch,
  MdSearchOff,
  MdAdminPanelSettings,
  MdSettings,
  MdShoppingBag,
  MdAssessment,
  MdFactCheck,
  MdCategory,
  MdMeetingRoom,
  MdDiscount,
  MdAccountBalance,
  MdSchema,
  MdExtension,
  MdAccountBalanceWallet,
  MdViewCarousel,
  MdSportsMotorsports,
  MdStraighten,
  MdSecurity,
} from 'react-icons/md';
import { usePermissions } from '../hooks/usePermissions';
import type { PermissionAction } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  keywords?: string[];
  permission?: string;
  action?: PermissionAction;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'الرئيسية', path: '/dashboard', icon: <MdDashboard size={20} />, keywords: ['داشبورد', 'احصائيات', 'مبيعات'], permission: 'dashboard' },
  { label: 'الفروع', path: '/dashboard/branches', icon: <MdStorefront size={20} />, keywords: ['فرع', 'مطعم'], permission: 'branch' },
  { label: 'المديرين', path: '/dashboard/admins', icon: <MdAdminPanelSettings size={20} />, keywords: ['ادمن', 'مسؤول', 'صلاحيات'], permission: 'admin' },
  { label: 'الأدوار والصلاحيات', path: '/dashboard/roles', icon: <MdSecurity size={20} />, keywords: ['ادوار', 'صلاحيات', 'اذونات', 'roles', 'permissions', 'رتب'], permission: 'role' },
  { label: 'الكاشير', path: '/dashboard/cashiers', icon: <MdPointOfSale size={20} />, keywords: ['جهاز', 'نقطة بيع', 'pos'], permission: 'cashier' },
  { label: 'موظفي الكاشير', path: '/dashboard/cashier-men', icon: <MdPeople size={20} />, keywords: ['كاشيرجي', 'كاشير', 'موظف'], permission: 'cashier_man' },
  { label: 'الورديات', path: '/dashboard/shifts', icon: <MdSchedule size={20} />, keywords: ['شيفت', 'دوام'], permission: 'shift' },
  { label: 'تقرير الورديات', path: '/dashboard/reports/start-shifts', icon: <MdAssessment size={20} />, keywords: ['تقارير', 'شيفتات', 'اغلاق'], permission: 'report' },
  { label: 'مناديب التوصيل', path: '/dashboard/deliveries', icon: <MdDeliveryDining size={20} />, keywords: ['توصيل', 'دليفري', 'طيار', 'طيارين', 'سائق', 'سائقين', 'مندوب', 'مناديب'], permission: 'delivery' },
  { label: 'كباتن الطلبات', path: '/dashboard/captain-orders', icon: <MdSportsMotorsports size={20} />, keywords: ['كابتن', 'كباتن', 'كابتن طلبات', 'توصيل', 'captain', 'orders'], permission: 'captain_order' },
  { label: 'قائمة المصروفات', path: '/dashboard/expense-lists', icon: <MdReceiptLong size={20} />, keywords: ['مصاريف', 'نفقات'], permission: 'expense_list' },
  { label: 'الحسابات المالية', path: '/dashboard/financial-accounts', icon: <MdAccountBalance size={20} />, keywords: ['خزنة', 'بنك', 'درج', 'مالية'], permission: 'financial_account' },
  { label: 'الصالات', path: '/dashboard/halls', icon: <MdMeetingRoom size={20} />, keywords: ['صالة', 'غرفة'], permission: 'hall' },
  { label: 'طاولات الصالة', path: '/dashboard/hall-tables', icon: <MdTableRestaurant size={20} />, keywords: ['طاولة', 'ترابيزة'], permission: 'hall_table' },
  { label: 'الطلبات', path: '/dashboard/orders', icon: <MdReceipt size={20} />, keywords: ['اوردر', 'اوردرات', 'فواتير'], permission: 'order' },
  { label: 'المطابخ', path: '/dashboard/kitchens', icon: <MdSoupKitchen size={20} />, keywords: ['مطبخ', 'شيف'], permission: 'kitchen' },
  { label: 'الأقسام', path: '/dashboard/categories', icon: <MdCategory size={20} />, keywords: ['تصنيف', 'قسم', 'منيو'], permission: 'category' },
  { label: 'المنتجات', path: '/dashboard/products', icon: <MdFastfood size={20} />, keywords: ['وجبات', 'اصناف', 'اكل'], permission: 'product' },
  { label: 'الإضافات', path: '/dashboard/addons', icon: <MdExtension size={20} />, keywords: ['اضافات', 'اضافة', 'توبنج', 'جبن', 'صوص', 'addon', 'addons'], permission: 'addon' },
  { label: 'منتجات غير منتهية التصنيع', path: '/dashboard/product-recipes', icon: <MdReceiptLong size={20} />, keywords: ['نصف مصنعة', 'تجهيز'], permission: 'product_recipe' },
  { label: 'معايير تصنيع المنتجات', path: '/dashboard/product-manufacturings', icon: <MdSchema size={20} />, keywords: ['معيار', 'وصفة', 'رسبي'], permission: 'product_manufacturing' },
  { label: 'أوامر وقوائم التصنيع', path: '/dashboard/manufacturing', icon: <MdPrecisionManufacturing size={20} />, keywords: ['تشغيل', 'انتاج'], permission: 'manufacturing' },
  { label: 'المواد الخام', path: '/dashboard/materials', icon: <MdLayers size={20} />, keywords: ['مخزن', 'خامات'], permission: 'material' },
  { label: 'جرد المواد الخام', path: '/dashboard/material-inventory', icon: <MdFactCheck size={20} />, keywords: ['جرد', 'تسوية'], permission: 'inventory' },
  { label: 'جرد وصفات التصنيع', path: '/dashboard/recipe-inventory', icon: <MdFactCheck size={20} />, keywords: ['جرد', 'وصفات', 'نصف مصنعة', 'تجهيز', 'recipe inventory', 'جرد الوصفات'], permission: 'inventory' },
  { label: 'جرد مخزون الإضافات', path: '/dashboard/addon-inventory', icon: <MdFactCheck size={20} />, keywords: ['جرد', 'اضافات', 'مخزون', 'توبنج', 'addon inventory', 'جرد الإضافات'], permission: 'inventory' },
  { label: 'المشتريات', path: '/dashboard/purchases', icon: <MdShoppingBag size={20} />, keywords: ['فواتير شراء', 'شراء'], permission: 'purchase' },
  { label: 'المبيعات', path: '/dashboard/sales', icon: <MdPointOfSale size={20} />, keywords: ['فواتير بيع', 'بيع'], permission: 'sale' },
  { label: 'الأقساط والديون', path: '/dashboard/dues', icon: <MdAccountBalanceWallet size={20} />, keywords: ['اقساط', 'ديون', 'اجل', 'سداد', 'مشتريات', 'مبيعات', 'مديونيات', 'due', 'dues', 'installments'], permission: 'dues' },
  { label: 'الموردين', path: '/dashboard/suppliers', icon: <MdLocalShipping size={20} />, keywords: ['تجار', 'توريد'], permission: 'supplier' },
  { label: 'الموزعين / العملاء', path: '/dashboard/salers', icon: <MdStorefront size={20} />, keywords: ['عميل', 'زبون'], permission: 'saler' },
  { label: 'الخصومات', path: '/dashboard/discounts', icon: <MdDiscount size={20} />, keywords: ['تخفيض', 'كوبون'], permission: 'discount' },
  { label: 'الضرائب والرسوم', path: '/dashboard/taxes', icon: <MdMonetizationOn size={20} />, keywords: ['ضريبة', 'قيمة مضافة'], permission: 'tax' },
  { label: 'وحدات القياس', path: '/dashboard/units', icon: <MdStraighten size={20} />, keywords: ['وحدات', 'قياس', 'كيلو', 'جرام', 'كرتونة', 'unit', 'units', 'معامل تحويل'], permission: 'unit' },
  { label: 'الهالك والتوالف', path: '/dashboard/wastes', icon: <MdDeleteOutline size={20} />, keywords: ['هدر', 'تالف'], permission: 'waste' },
  { label: 'طرق الدفع', path: '/dashboard/payment-methods', icon: <MdPayment size={20} />, keywords: ['كاش', 'فيزا', 'دفع'], permission: 'payment_method' },
  { label: 'البانرات الإعلانية', path: '/dashboard/banners', icon: <MdViewCarousel size={20} />, keywords: ['بانرات', 'اعلانات', 'سلايدر', 'عروض', 'banners', 'banner'], permission: 'banner' },
  { label: 'الإعدادات', path: '/dashboard/settings', icon: <MdSettings size={20} />, keywords: ['ضبط', 'لوجو'], permission: 'business_setup' },
];

const normalizeArabic = (str: string) =>
  str
    .toLowerCase()
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/[\u064B-\u065F]/g, '')
    .trim();

const matchesArabicText = (text: string, q: string) => {
  const l = normalizeArabic(text);
  if (l.includes(q)) return true;
  const qNoAl = q.startsWith('ال') ? q.slice(2) : q;
  const lNoAl = l.startsWith('ال') ? l.slice(2) : l;
  return l.includes(qNoAl) || lNoAl.includes(qNoAl) || lNoAl.includes(q);
};

const matchesSearch = (item: NavItem, query: string) => {
  const q = normalizeArabic(query);
  if (!q) return true;
  if (matchesArabicText(item.label, q)) return true;
  if (item.keywords?.some((k) => matchesArabicText(k, q))) return true;
  return false;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { can, isSuperAdmin } = usePermissions();

  const authorizedItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      if (isSuperAdmin) return true;
      if (!item.permission) return true;
      if (item.permission === 'dues') {
        return can('purchase_due', 'view') || can('sale_due', 'view');
      }
      return can(item.permission, item.action || 'view');
    });
  }, [can, isSuperAdmin]);

  const filteredItems = useMemo(() => {
    return authorizedItems.filter((item) => matchesSearch(item, searchQuery));
  }, [authorizedItems, searchQuery]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 right-0 h-full z-40
          w-64 flex flex-col
          bg-white dark:bg-slate-900
          border-l border-slate-200 dark:border-slate-700
          shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <MdDashboard size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight">لوحة التحكم</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">نظام الكاشير</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Page Search at the top */}
        <div className="px-3 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="relative">
            <MdSearch
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredItems.length > 0) {
                  navigate(filteredItems[0].path);
                  if (window.innerWidth < 1024) onClose();
                } else if (e.key === 'Escape') {
                  setSearchQuery('');
                }
              }}
              placeholder="بحث في الصفحات..."
              className="w-full pr-9 pl-8 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 focus:border-primary focus:bg-white dark:focus:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 ring-primary/20 transition-all duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="مسح البحث"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <MdClose size={14} />
              </button>
            )}
          </div>
          {searchQuery.trim() && (
            <div className="flex items-center justify-between mt-1.5 px-1 text-[11px] text-slate-400">
              <span>النتائج:</span>
              <span className="font-semibold text-primary">{filteredItems.length} صفحة</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {filteredItems.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <MdSearchOff size={22} />
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                لا توجد صفحات مطابقة
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-primary hover:underline font-semibold"
              >
                مسح البحث
              </button>
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/dashboard'}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-xl
                      font-medium text-sm
                      transition-all duration-200
                      ${isActive
                        ? 'sidebar-active shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <span className={isActive ? 'text-white' : 'sidebar-active-text'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-center text-slate-400 dark:text-slate-500">
            نظام الكاشير © 2024
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
