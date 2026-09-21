import React, { useState, useMemo } from 'react';
import {
  MdCalendarMonth,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdFilterList,
} from 'react-icons/md';
import type { DashboardStats } from '../../types/dashboard';
import { formatCurrency, formatNumber } from './DashboardMetrics';

interface MonthlyTableProps {
  stats: DashboardStats;
  currency?: string;
}

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const MonthlyTable: React.FC<MonthlyTableProps> = ({ stats, currency = 'ج.م' }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [onlyActive, setOnlyActive] = useState(false);

  const totalYearRevenue = Number(stats?.total_final_price) || 0;
  const totalYearOrders = Number(stats?.total_orders) || 0;

  const rows = useMemo(() => {
    const monthsEn = stats?.chart?.months || [];
    const ordersCount = stats?.chart?.orders_count || [];
    const finalPrices = stats?.chart?.final_price || [];

    const list = [];
    for (let i = 0; i < 12; i++) {
      const monthNum = i + 1;
      const nameAr = ARABIC_MONTHS[i];
      const nameEn = monthsEn[i] || stats?.monthly_orders?.[i]?.month_name || `Month ${monthNum}`;

      const orders =
        ordersCount[i] !== undefined
          ? Number(ordersCount[i])
          : Number(stats?.monthly_orders?.[i]?.orders_count || 0);

      const revenue =
        finalPrices[i] !== undefined
          ? Number(finalPrices[i])
          : Number(stats?.monthly_final_price?.[i]?.total_final_price || 0);

      const avgOrder = orders > 0 ? revenue / orders : 0;
      const revenueShare = totalYearRevenue > 0 ? (revenue / totalYearRevenue) * 100 : 0;

      list.push({
        monthNum,
        nameAr,
        nameEn,
        orders,
        revenue,
        avgOrder,
        revenueShare,
        isActive: orders > 0 || revenue > 0,
      });
    }

    if (onlyActive) {
      return list.filter((r) => r.isActive);
    }
    return list;
  }, [stats, totalYearRevenue, onlyActive]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
      {/* Table Header / Toggle Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <MdCalendarMonth size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">
              تفاصيل الأداء المالي والطلبات لكل شهر
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              بيانات تفصيلية لجميع شهور سنة {stats?.year || ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyActive((prev) => !prev)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              onlyActive
                ? 'bg-primary text-white border-primary'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200'
            }`}
            title="عرض الشهور التي بها مبيعات فقط"
          >
            <MdFilterList size={14} />
            <span>الشهور النشطة فقط</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
            title={isOpen ? 'طي الجدول' : 'عرض الجدول'}
          >
            {isOpen ? <MdKeyboardArrowUp size={20} /> : <MdKeyboardArrowDown size={20} />}
          </button>
        </div>
      </div>

      {/* Table Body */}
      {isOpen && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/70">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  الشهر
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  عدد الطلبات
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  إجمالي المبيعات
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                  متوسط الفاتورة
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">
                  المساهمة السنوية
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {rows.map((row) => (
                <tr
                  key={row.monthNum}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-colors ${
                    row.isActive ? 'bg-primary/5 dark:bg-primary/5' : ''
                  }`}
                >
                  {/* Month */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {row.monthNum}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {row.nameAr}
                        </p>
                        <p className="text-[11px] text-slate-400">{row.nameEn}</p>
                      </div>
                    </div>
                  </td>

                  {/* Orders */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatNumber(row.orders)}
                      </span>
                      {row.orders > 0 && totalYearOrders > 0 && (
                        <div className="w-12 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden hidden lg:block">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{
                              width: `${Math.min((row.orders / totalYearOrders) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Revenue */}
                  <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(row.revenue, currency)}
                  </td>

                  {/* AOV */}
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                    {row.orders > 0 ? formatCurrency(row.avgOrder, currency) : '—'}
                  </td>

                  {/* Share % */}
                  <td className="px-6 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        {row.revenueShare.toFixed(1)}%
                      </span>
                      {row.revenueShare > 0 && (
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${Math.min(row.revenueShare, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.isActive
                          ? 'bg-primary/10 text-primary'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                      }`}
                    >
                      {row.isActive ? '● نشط' : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MonthlyTable;
