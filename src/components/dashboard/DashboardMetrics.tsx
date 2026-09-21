import React from 'react';
import {
  MdAttachMoney,
  MdShoppingCart,
  MdAnalytics,
  MdStars,
} from 'react-icons/md';
import type { DashboardStats } from '../../types/dashboard';

interface DashboardMetricsProps {
  stats: DashboardStats;
  currency?: string;
}

export const formatCurrency = (val: number | string, currency = 'ج.م'): string => {
  const num = Number(val) || 0;
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

export const formatAmount = (val: number | string): string => {
  const num = Number(val) || 0;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatNumber = (val: number | string): string => {
  const num = Number(val) || 0;
  return num.toLocaleString('en-US');
};

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ stats, currency = 'ج.م' }) => {
  const totalOrders = Number(stats?.total_orders) || 0;
  const totalRevenue = Number(stats?.total_final_price) || 0;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const topProduct = stats?.top_products?.[0];
  const topProductName = topProduct?.product_name?.ar || topProduct?.product_name?.en || 'لا يوجد بيانات';
  const topProductQty = topProduct?.total_quantity || 0;

  const cards = [
    {
      title: 'إجمالي المبيعات',
      amount: formatAmount(totalRevenue),
      unit: currency,
      subtitle: `إجمالي إيرادات سنة ${stats?.year || ''}`,
      icon: <MdAttachMoney size={22} />,
    },
    {
      title: 'إجمالي الطلبات',
      amount: formatNumber(totalOrders),
      unit: 'طلب',
      subtitle: 'الطلبات المكتملة المسجلة',
      icon: <MdShoppingCart size={22} />,
    },
    {
      title: 'متوسط قيمة الطلب',
      amount: formatAmount(aov),
      unit: currency,
      subtitle: 'معدل الإنفاق لكل فاتورة',
      icon: <MdAnalytics size={22} />,
    },
    {
      title: 'المنتج الأكثر طلباً',
      amount: topProductName,
      subtitle: topProductQty > 0 ? `${topProductQty} قطعة مباعة` : 'لا توجد مبيعات',
      icon: <MdStars size={22} />,
      isTextVal: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="relative overflow-hidden rounded-2xl p-4 md:p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
              {card.title}
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary transition-transform hover:scale-110 shrink-0">
              {card.icon}
            </div>
          </div>

          <div className="space-y-1">
            <h3
              className={`font-bold text-slate-900 dark:text-white leading-snug tracking-tight flex items-baseline ${
                card.isTextVal
                  ? 'text-sm md:text-base truncate'
                  : 'text-base md:text-lg lg:text-xl font-mono'
              }`}
              title={card.isTextVal ? card.amount : `${card.amount} ${card.unit || ''}`}
            >
              <span className="truncate">{card.amount}</span>
              {card.unit && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans mr-1.5 shrink-0">
                  {card.unit}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              {card.subtitle}
            </p>
          </div>

          {/* Theme Color Bottom Edge */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary opacity-80" />
        </div>
      ))}
    </div>
  );
};

export default DashboardMetrics;
