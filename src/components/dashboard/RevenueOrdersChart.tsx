import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  MdShowChart,
  MdBarChart,
  MdStackedLineChart,
  MdTrendingUp,
  MdEventNote,
} from 'react-icons/md';
import type { DashboardStats } from '../../types/dashboard';
import { formatCurrency, formatNumber } from './DashboardMetrics';

interface RevenueOrdersChartProps {
  stats: DashboardStats;
  currency?: string;
}

type ChartMode = 'combined' | 'revenue' | 'orders';

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

const RevenueOrdersChart: React.FC<RevenueOrdersChartProps> = ({ stats, currency = 'ج.م' }) => {
  const [mode, setMode] = useState<ChartMode>('combined');

  // Process data from chart object and fallback to monthly_orders/monthly_final_price
  const chartData = useMemo(() => {
    const list = [];
    const monthsEn = stats?.chart?.months || [];
    const ordersCount = stats?.chart?.orders_count || [];
    const finalPrices = stats?.chart?.final_price || [];

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

      list.push({
        monthIndex: monthNum,
        nameAr,
        nameEn,
        orders,
        revenue,
        avgOrder,
      });
    }
    return list;
  }, [stats]);

  // Find peak months
  const peakRevenue = useMemo(() => {
    return chartData.reduce(
      (max, item) => (item.revenue > max.revenue ? item : max),
      chartData[0] || { nameAr: '', revenue: 0 }
    );
  }, [chartData]);

  const peakOrders = useMemo(() => {
    return chartData.reduce(
      (max, item) => (item.orders > max.orders ? item : max),
      chartData[0] || { nameAr: '', orders: 0 }
    );
  }, [chartData]);

  // Custom Rich Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-right min-w-[200px] z-50">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {data.nameEn}
            </span>
            <span className="font-bold text-slate-800 dark:text-white text-sm">
              {data.nameAr}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary">
                {formatCurrency(data.revenue, currency)}
              </span>
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                المبيعات:
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatNumber(data.orders)} طلب
              </span>
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 inline-block" />
                الطلبات:
              </span>
            </div>
            {data.orders > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatCurrency(data.avgOrder, currency)}
                </span>
                <span className="text-slate-400">متوسط الطلب:</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 md:p-6 transition-colors">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <MdTrendingUp size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              مسار المبيعات وحجم الطلبات الشهري
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مقارنة الإيرادات وحركات الشراء خلال شهور سنة {stats?.year || ''}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('combined')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'combined'
                ? 'bg-primary text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MdStackedLineChart size={15} />
            <span>شامل</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('revenue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'revenue'
                ? 'bg-primary text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MdShowChart size={15} />
            <span>المبيعات</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('orders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'orders'
                ? 'bg-primary text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MdBarChart size={15} />
            <span>الطلبات</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 md:h-80 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'combined' ? (
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
                className="stroke-slate-200 dark:stroke-slate-700/50"
              />
              <XAxis
                dataKey="nameAr"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Cairo' }}
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="left"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                formatter={(value) => (
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {value === 'revenue' ? `المبيعات (${currency})` : 'عدد الطلبات'}
                  </span>
                )}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke="var(--color-primary)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#revenueGradient)"
              />
              <Bar
                yAxisId="right"
                dataKey="orders"
                name="orders"
                fill="var(--color-primary)"
                fillOpacity={0.45}
                stroke="var(--color-primary)"
                strokeWidth={1}
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            </ComposedChart>
          ) : mode === 'revenue' ? (
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueOnlyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
                className="stroke-slate-200 dark:stroke-slate-700/50"
              />
              <XAxis
                dataKey="nameAr"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Cairo' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke="var(--color-primary)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#revenueOnlyGradient)"
              />
            </AreaChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
                className="stroke-slate-200 dark:stroke-slate-700/50"
              />
              <XAxis
                dataKey="nameAr"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Cairo' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="orders"
                name="orders"
                fill="var(--color-primary)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Highlights Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <div className="p-2 rounded-lg bg-primary text-white">
            <MdTrendingUp size={18} />
          </div>
          <div className="text-xs">
            <p className="text-slate-500 dark:text-slate-400">أعلى شهر مبيعاً</p>
            <p className="font-bold text-slate-800 dark:text-white mt-0.5">
              {peakRevenue.nameAr} ({formatCurrency(peakRevenue.revenue, currency)})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <div className="p-2 rounded-lg bg-primary text-white">
            <MdEventNote size={18} />
          </div>
          <div className="text-xs">
            <p className="text-slate-500 dark:text-slate-400">أعلى شهر في عدد الطلبات</p>
            <p className="font-bold text-slate-800 dark:text-white mt-0.5">
              {peakOrders.nameAr} ({formatNumber(peakOrders.orders)} طلب)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueOrdersChart;
