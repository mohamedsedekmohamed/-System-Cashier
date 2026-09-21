import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import {
  MdRestaurantMenu,
  MdLocalOffer,
} from 'react-icons/md';
import { useTheme } from '../../context/ThemeContext';
import type { DashboardStats, DashboardTopProduct } from '../../types/dashboard';
import { formatCurrency, formatNumber } from './DashboardMetrics';

interface TopProductsSectionProps {
  stats: DashboardStats;
  currency?: string;
}

const THEME_HEX_MAP: Record<string, string> = {
  blue: '#3b82f6',
  green: '#10b981',
  red: '#ef4444',
  purple: '#8b5cf6',
  orange: '#f97316',
  teal: '#14b8a6',
};

const TopProductsSection: React.FC<TopProductsSectionProps> = ({ stats, currency = 'ج.م' }) => {
  const { themeColor } = useTheme();
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const topProducts: DashboardTopProduct[] = useMemo(() => {
    return stats?.top_products || [];
  }, [stats]);

  const totalQuantity = useMemo(() => {
    return topProducts.reduce((sum, p) => sum + (Number(p.total_quantity) || 0), 0);
  }, [topProducts]);

  // Unified color palette derived from the active theme
  const palette = useMemo(() => {
    const base = THEME_HEX_MAP[themeColor] || '#3b82f6';
    return [
      base,
      `${base}d9`, // ~85%
      `${base}b3`, // ~70%
      `${base}8c`, // ~55%
      `${base}66`, // ~40%
      `${base}40`, // ~25%
      `${base}26`, // ~15%
    ];
  }, [themeColor]);

  // Chart data for Pie
  const pieData = useMemo(() => {
    return topProducts.map((p, idx) => {
      const qty = Number(p.total_quantity) || 0;
      const name = p.product_name?.ar || p.product_name?.en || `منتج #${p.product_id}`;
      const percent = totalQuantity > 0 ? (qty / totalQuantity) * 100 : 0;
      return {
        id: p.product_id,
        name,
        qty,
        percent: percent.toFixed(1),
        color: palette[idx % palette.length],
      };
    });
  }, [topProducts, totalQuantity, palette]);

  const handleImageError = (productId: number) => {
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-right text-xs z-50">
          <p className="font-bold text-slate-800 dark:text-white mb-1">{data.name}</p>
          <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-primary">{data.qty} قطعة</span>
            <span>الكمية:</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-semibold text-primary">
              {data.percent}%
            </span>
            <span>النسبة:</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (topProducts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 text-center">
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <MdRestaurantMenu size={36} className="mb-2 opacity-40" />
          <p className="text-sm font-medium">لا توجد بيانات مبيعات للمنتجات في هذه السنة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 md:p-6 transition-colors">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <MdRestaurantMenu size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              المنتجات الأكثر طلباً ومبيعاً
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ترتيب الأصناف بحسب إجمالي الكميات المطلوبة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <MdLocalOffer size={14} className="text-primary" />
          <span>{topProducts.length} منتجات</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Donut Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full h-64 flex items-center justify-center" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="qty"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Counter */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
                {formatNumber(totalQuantity)}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                إجمالي القطع المباعة
              </span>
            </div>
          </div>

          {/* Quick Legend Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-sm">
            {pieData.slice(0, 4).map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px]"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[110px]">
                  {entry.name}
                </span>
                <span className="text-slate-400 font-mono">({entry.percent}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Products Ranked List */}
        <div className="lg:col-span-7 space-y-3">
          {topProducts.map((item, idx) => {
            const qty = Number(item.total_quantity) || 0;
            const price = Number(item.product?.price) || 0;
            const itemTotalRevenue = qty * price;
            const percent = totalQuantity > 0 ? (qty / totalQuantity) * 100 : 0;
            const hasImg = item.product?.image && !imageErrors[item.product_id];
            const color = palette[idx % palette.length];

            const rankBadgeClass =
              idx === 0
                ? 'bg-primary text-white font-bold border-primary shadow-xs'
                : idx === 1
                ? 'bg-primary/20 text-primary font-bold border-primary/30'
                : idx === 2
                ? 'bg-primary/10 text-primary font-bold border-primary/20'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-transparent';

            return (
              <div
                key={item.product_id}
                className="group relative p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/70 hover:border-primary/40 bg-slate-50/50 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-800/80 transition-all shadow-xs hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Right info in RTL */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 border ${rankBadgeClass}`}
                    >
                      #{idx + 1}
                    </span>

                    {/* Image */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-600/50 flex items-center justify-center">
                      {hasImg ? (
                        <img
                          src={item.product!.image!}
                          alt={item.product_name?.ar || 'product'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => handleImageError(item.product_id)}
                        />
                      ) : (
                        <MdRestaurantMenu size={22} className="text-slate-400" />
                      )}
                    </div>

                    {/* Titles */}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {item.product_name?.ar || item.product_name?.en}
                      </h4>
                      {item.product_name?.en && (
                        <p className="text-xs text-slate-400 truncate dir-ltr text-right">
                          {item.product_name.en}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {price > 0 && (
                          <span>سعر الحبة: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(price, currency)}</strong></span>
                        )}
                        {itemTotalRevenue > 0 && (
                          <span className="hidden sm:inline">
                            الإجمالي المقدر: <strong className="text-primary">{formatCurrency(itemTotalRevenue, currency)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Left stats badge */}
                  <div className="text-left shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                      {qty} مبيعات
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono text-left">
                      {percent.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full bg-slate-200/80 dark:bg-slate-700/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(percent, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopProductsSection;
