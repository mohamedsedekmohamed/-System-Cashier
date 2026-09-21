import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { branchApi, BRANCHES_KEY } from '../services/branchService';
import { dashboardService, DASHBOARD_STATS_KEY } from '../services/dashboardService';
import DashboardMetrics from '../components/dashboard/DashboardMetrics';
import RevenueOrdersChart from '../components/dashboard/RevenueOrdersChart';
import TopProductsSection from '../components/dashboard/TopProductsSection';
import MonthlyTable from '../components/dashboard/MonthlyTable';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorFallback from '../components/ui/ErrorFallback';
import {
  MdStorefront,
  MdArrowBack,
  MdRefresh,
  MdCalendarToday,
  MdChevronLeft,
  MdChevronRight,
} from 'react-icons/md';

const QUICK_YEARS = [2024, 2025, 2026, 2027];

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    // Default to 2026 as in current API data or current calendar year
    const current = new Date().getFullYear();
    return current >= 2024 ? current : 2026;
  });

  // 1. Fetch Dashboard Analytics & Charts
  const {
    data: stats,
    isLoading: isLoadingStats,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
    isFetching: isFetchingStats,
  } = useQuery({
    queryKey: [DASHBOARD_STATS_KEY, selectedYear],
    queryFn: () => dashboardService.getStats(selectedYear),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // 2. Fetch Recent Branches
  const {
    data: branchData,
    isLoading: isLoadingBranches,
    isError: isBranchError,
    error: branchError,
    refetch: refetchBranches,
  } = useQuery({
    queryKey: [BRANCHES_KEY, 1, 5],
    queryFn: () => branchApi.list(1, 5),
  });

  const branches = branchData?.data ?? [];
  const totalBranches = branchData?.meta?.total ?? 0;
  const activeBranches = branches.filter((b) => b.status).length;

  const handlePrevYear = () => {
    if (selectedYear > 2000) setSelectedYear((y) => y - 1);
  };

  const handleNextYear = () => {
    if (selectedYear < 2100) setSelectedYear((y) => y + 1);
  };

  const handleRefreshAll = () => {
    refetchStats();
    refetchBranches();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-8 bg-primary shadow-xl transition-colors duration-300">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 70% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-medium mb-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              لوحة التحكم والإحصائيات المباشرة
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1.5 tracking-tight">
              أهلاً وسهلاً،{' '}
              {typeof user?.name === 'object' && user?.name !== null
                ? (user?.name as any)?.ar || (user?.name as any)?.en || ''
                : user?.name || ''}{' '}
              👋
            </h1>
            <p className="text-white/80 text-sm max-w-xl">
              متابعة حركة المبيعات، حجم الطلبات، وأداء المنتجات والفروع لحظة بلحظة.
            </p>
          </div>

          {/* Year Filter & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 bg-black/15 backdrop-blur-md p-2 rounded-2xl border border-white/15 self-start md:self-auto">
            {/* Year Selector Stepper */}
            <div className="flex items-center bg-white/10 rounded-xl px-2 py-1 text-white border border-white/10">
              <button
                type="button"
                onClick={handlePrevYear}
                disabled={selectedYear <= 2000}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-30"
                title="السنة السابقة"
              >
                <MdChevronRight size={18} />
              </button>
              <div className="flex items-center gap-1.5 px-2 font-bold text-sm">
                <MdCalendarToday size={14} className="text-white/80" />
                <span>{selectedYear}</span>
              </div>
              <button
                type="button"
                onClick={handleNextYear}
                disabled={selectedYear >= 2100}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-30"
                title="السنة القادمة"
              >
                <MdChevronLeft size={18} />
              </button>
            </div>

            {/* Quick Year Buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {QUICK_YEARS.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-xl text-xs transition-all ${
                    selectedYear === yr
                      ? 'bg-white text-primary shadow-sm font-bold'
                      : 'text-white/80 hover:bg-white/15'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isFetchingStats}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-primary hover:bg-white/95 active:scale-95 transition-all shadow-sm disabled:opacity-60"
              title="تحديث البيانات"
            >
              <MdRefresh
                size={16}
                className={isFetchingStats ? 'animate-spin' : ''}
              />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -left-5 -bottom-5 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
      </div>

      {/* Dashboard Analytics Section */}
      {isLoadingStats ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 border border-slate-100 dark:border-slate-700 shadow-sm">
          <LoadingSpinner text={`جاري تحميل إحصائيات سنة ${selectedYear}...`} />
        </div>
      ) : isStatsError ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-rose-100 dark:border-rose-900/30 shadow-sm">
          <ErrorFallback
            error={statsError}
            onRetry={refetchStats}
          />
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* 1. KPI Cards */}
          <DashboardMetrics stats={stats} currency="ج.م" />

          {/* 2. Primary Revenue & Orders Chart */}
          <RevenueOrdersChart stats={stats} currency="ج.م" />

          {/* 3. Top Products Visualization & Distribution */}
          <TopProductsSection stats={stats} currency="ج.م" />

          {/* 4. Detailed Monthly Table */}
          <MonthlyTable stats={stats} currency="ج.م" />
        </div>
      ) : null}

      {/* 5. Branches Overview & Recent Branches */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white">الفروع النشطة</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeBranches} فرع نشط من أصل {totalBranches} مسجل
            </p>
          </div>
          <Link
            to="/dashboard/branches"
            className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline"
          >
            <span>إدارة الفروع</span>
            <MdArrowBack size={16} />
          </Link>
        </div>

        {isLoadingBranches ? (
          <div className="p-8">
            <LoadingSpinner text="جاري تحميل الفروع..." />
          </div>
        ) : isBranchError ? (
          <div className="p-6">
            <ErrorFallback error={branchError} onRetry={refetchBranches} />
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <MdStorefront size={40} className="mb-2 opacity-40" />
            <p className="text-sm">لا توجد فروع حالياً</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/60">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    الفرع
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    العنوان
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">
                    واتساب
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {branches.map((branch) => (
                  <tr
                    key={branch.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {typeof branch.name === 'object' && branch.name !== null
                          ? (branch.name as any)?.ar || (branch.name as any)?.en || ''
                          : branch.name || ''}
                      </p>
                      <p className="text-xs text-slate-400">#{branch.id}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                      {branch.address || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 hidden md:table-cell font-mono">
                      {branch.watts || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          branch.status
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {branch.status ? '● نشط' : '● معطل'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
