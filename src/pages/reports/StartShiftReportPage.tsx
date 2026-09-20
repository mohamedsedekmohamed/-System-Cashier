import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  reportService,
  START_SHIFTS_REPORT_KEY,
  START_SHIFTS_SELECT_OPTIONS_KEY,
} from '../../services/reportService';
import type { StartShiftReportItem } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { DetailsModal } from '../../components/ui/DetailsModal';
import {
  MdAssessment,
  MdRefresh,
  MdVisibility,
  MdFilterList,
  MdClear,
  MdSchedule,
  MdAccountBalanceWallet,
  MdPaid,
  MdTrendingDown,
  MdStorefront,
  MdPointOfSale,
  MdPerson,
  MdCalendarToday,
} from 'react-icons/md';
import { renderName } from '../../utils/helpers';

export const StartShiftReportPage: React.FC = () => {
  // ── Filters State ──────────────────────
  const [page, setPage] = useState(1);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [cashierId, setCashierId] = useState<number | null>(null);
  const [cashierManId, setCashierManId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [viewTarget, setViewTarget] = useState<StartShiftReportItem | null>(null);
  const perPage = 15;

  // ── Fetch Select Options ───────────────
  const { data: optionsResponse, isLoading: isLoadingOptions } = useQuery({
    queryKey: [START_SHIFTS_SELECT_OPTIONS_KEY],
    queryFn: () => reportService.getStartShiftSelectOptions(),
  });

  const branches = optionsResponse?.data?.branches ?? [];
  const allCashiers = optionsResponse?.data?.cashiers ?? [];
  const allCashierMen = optionsResponse?.data?.cashier_men ?? [];

  // Filter cashiers and cashier_men if branch is selected
  const availableCashiers = useMemo(() => {
    if (!branchId) return allCashiers;
    return allCashiers.filter((c) => c.branch_id === branchId || !c.branch_id);
  }, [allCashiers, branchId]);

  const availableCashierMen = useMemo(() => {
    if (!branchId) return allCashierMen;
    return allCashierMen.filter((m) => m.branch_id === branchId || !m.branch_id);
  }, [allCashierMen, branchId]);

  // ── Fetch Report Data ──────────────────
  const {
    data: reportResponse,
    isLoading: isLoadingReport,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      START_SHIFTS_REPORT_KEY,
      page,
      perPage,
      branchId,
      cashierId,
      cashierManId,
      startDate,
      endDate,
    ],
    queryFn: () =>
      reportService.getStartShiftsReport({
        page,
        per_page: perPage,
        branch_id: branchId,
        cashier_id: cashierId,
        cashier_man_id: cashierManId,
        start: startDate ? startDate : null,
        end: endDate ? endDate : null,
      }),
    placeholderData: (prev) => prev,
  });

  // Extract records array safely (handles data as array, shifts as array, or nested)
  const reportList: StartShiftReportItem[] = useMemo(() => {
    if (!reportResponse) return [];
    if (Array.isArray(reportResponse.data)) return reportResponse.data;
    if (Array.isArray(reportResponse.shifts)) return reportResponse.shifts;
    if (Array.isArray((reportResponse as any).data?.shifts)) return (reportResponse as any).data.shifts;
    return [];
  }, [reportResponse]);

  const summary = reportResponse?.summary;
  const meta = reportResponse?.meta;

  // ── Reset Filters ──────────────────────
  const handleResetFilters = () => {
    setBranchId(null);
    setCashierId(null);
    setCashierManId(null);
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    branchId || cashierId || cashierManId || startDate || endDate || search
  );

  // ── Client Search Filter ────────────────
  const filteredList = useMemo(() => {
    if (!search.trim()) return reportList;
    const q = search.toLowerCase().trim();
    return reportList.filter((item) => {
      const bName = renderName(item.branch_name || item.branch?.name).toLowerCase();
      const cName = renderName(item.cashier_name || item.cashier?.name).toLowerCase();
      const cmName = (item.cashier_man_name || '').toLowerCase();
      const idMatch = String(item.id).includes(q);
      return bName.includes(q) || cName.includes(q) || cmName.includes(q) || idMatch;
    });
  }, [reportList, search]);

  // ── Table Columns ──────────────────────
  const columns: ColumnDef<StartShiftReportItem>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'الوردية',
      render: (row) => (
        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40">
          #{row.id}
        </span>
      ),
    },
    {
      header: 'الفرع',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-100">
          <MdStorefront className="text-slate-400 shrink-0" size={16} />
          <span>{renderName(row.branch_name || row.branch?.name) || 'الفرع الرئيسي'}</span>
        </div>
      ),
    },
    {
      header: 'الكاشير',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
          <MdPointOfSale className="text-slate-400 shrink-0" size={15} />
          <span className="truncate max-w-[180px]" title={renderName(row.cashier_name || row.cashier?.name)}>
            {renderName(row.cashier_name || row.cashier?.name) || 'ماكينة كاشير'}
          </span>
        </div>
      ),
    },
    {
      header: 'موظف الكاشير',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <MdPerson className="text-primary shrink-0" size={15} />
          <span>{row.cashier_man_name || renderName(row.cashier_man?.name) || '—'}</span>
        </div>
      ),
    },
    {
      header: 'العهدة الافتتاحية',
      render: (row) => (
        <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs">
          {Number(row.default_total_amount || 0).toLocaleString('ar-EG')} ج.م
        </span>
      ),
    },
    {
      header: 'المحصل الفعلي',
      render: (row) => (
        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
          {row.total_mony !== null && row.total_mony !== undefined
            ? `${Number(row.total_mony).toLocaleString('ar-EG')} ج.م`
            : '—'}
        </span>
      ),
    },
    {
      header: 'العجز / الزيادة',
      render: (row) => {
        if (row.deficit === null || row.deficit === undefined) {
          return <span className="text-slate-400 text-xs">—</span>;
        }
        const val = Number(row.deficit);
        if (val === 0) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
              متطابق (0)
            </span>
          );
        }
        if (val > 0) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40">
              عجز: {val.toLocaleString('ar-EG')} ج.م
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
            زيادة: {Math.abs(val).toLocaleString('ar-EG')} ج.م
          </span>
        );
      },
    },
    {
      header: 'البدء / الإغلاق',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <p className="text-slate-700 dark:text-slate-300">
            {row.start ? new Date(row.start).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
          </p>
          {row.end ? (
            <p className="text-slate-500 dark:text-slate-400">
              إلى: {new Date(row.end).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              وردية مفتوحة
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <button
          onClick={() => setViewTarget(row)}
          className="p-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
          title="عرض التفاصيل"
        >
          <MdVisibility size={16} />
        </button>
      ),
    },
  ];

  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 flex flex-col h-full pb-16">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
            <MdAssessment size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              تقرير بدء الورديات
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تحليل شامل ومتابعة لأداء الورديات والعهد الافتتاحية والمتحصلات والعجز
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all shadow-sm disabled:opacity-50"
        >
          <MdRefresh size={18} className={isFetching ? 'animate-spin text-primary' : ''} />
          تحديث التقرير
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Shifts Count */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <MdSchedule size={26} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              إجمالي الورديات
            </span>
            <p className="text-2xl font-black text-slate-800 dark:text-white">
              {summary ? summary.shifts_count : meta?.total ?? reportList.length}
            </p>
          </div>
        </div>

        {/* Total Default Amount */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <MdAccountBalanceWallet size={26} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              العهدة الافتتاحية
            </span>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {Number(summary?.total_default_amount || 0).toLocaleString('ar-EG')}{' '}
              <span className="text-xs font-normal text-slate-400">ج.م</span>
            </p>
          </div>
        </div>

        {/* Total Collected Money */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MdPaid size={26} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              المحصل الفعلي
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {Number(summary?.total_collected_mony || 0).toLocaleString('ar-EG')}{' '}
              <span className="text-xs font-normal text-slate-400">ج.م</span>
            </p>
          </div>
        </div>

        {/* Total Deficit */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              Number(summary?.total_deficit || 0) > 0
                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                : 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400'
            }`}
          >
            <MdTrendingDown size={26} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              إجمالي العجز
            </span>
            <p
              className={`text-2xl font-black ${
                Number(summary?.total_deficit || 0) > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-teal-600 dark:text-teal-400'
              }`}
            >
              {Number(summary?.total_deficit || 0).toLocaleString('ar-EG')}{' '}
              <span className="text-xs font-normal text-slate-400">ج.م</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters Box */}
      <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
            <MdFilterList size={20} className="text-primary" />
            <span>خيارات وتصفية التقرير</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold hover:underline"
            >
              <MdClear size={16} />
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Branch Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              الفرع
            </label>
            <select
              value={branchId ?? ''}
              onChange={(e) => {
                setBranchId(e.target.value ? Number(e.target.value) : null);
                setCashierId(null);
                setCashierManId(null);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:border-primary focus:outline-none"
            >
              <option value="">{isLoadingOptions ? 'جاري التحميل...' : 'كل الفروع'}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {renderName(b.name) || `فرع #${b.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Cashier Machine Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              ماكينة الكاشير
            </label>
            <select
              value={cashierId ?? ''}
              onChange={(e) => {
                setCashierId(e.target.value ? Number(e.target.value) : null);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:border-primary focus:outline-none"
            >
              <option value="">{isLoadingOptions ? 'جاري التحميل...' : 'كل الماكينات'}</option>
              {availableCashiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {renderName(c.name)}
                </option>
              ))}
            </select>
          </div>

          {/* Cashier Man Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              موظف الكاشير
            </label>
            <select
              value={cashierManId ?? ''}
              onChange={(e) => {
                setCashierManId(e.target.value ? Number(e.target.value) : null);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:border-primary focus:outline-none"
            >
              <option value="">{isLoadingOptions ? 'جاري التحميل...' : 'كل الموظفين'}</option>
              {availableCashierMen.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <MdCalendarToday size={13} />
              من تاريخ
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:border-primary focus:outline-none"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <MdCalendarToday size={13} />
              إلى تاريخ
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Search */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث فوري في نتائج التقرير بالفرع أو الكاشير أو اسم الموظف أو رقم الوردية..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1">
        <DataTable
          data={filteredList}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoadingReport && !reportResponse}
          emptyIcon={<MdAssessment size={48} />}
          emptyText="لا توجد بيانات ورديات مطابقة لمعايير البحث المحددة"
        />
      </div>

      {/* Details Modal */}
      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={`تفاصيل الوردية #${viewTarget?.id}`}
        details={[
          { label: 'رقم الوردية', value: `#${viewTarget?.id}` },
          { label: 'الفرع', value: renderName(viewTarget?.branch_name || viewTarget?.branch?.name) || '—' },
          { label: 'ماكينة الكاشير', value: renderName(viewTarget?.cashier_name || viewTarget?.cashier?.name) || '—' },
          { label: 'موظف الكاشير', value: viewTarget?.cashier_man_name || renderName(viewTarget?.cashier_man?.name) || '—' },
          {
            label: 'العهدة الافتتاحية',
            value: `${Number(viewTarget?.default_total_amount || 0).toLocaleString('ar-EG')} ج.م`,
          },
          {
            label: 'المبلغ الفعلي المحصل',
            value:
              viewTarget?.total_mony !== null && viewTarget?.total_mony !== undefined
                ? `${Number(viewTarget.total_mony).toLocaleString('ar-EG')} ج.م`
                : 'غير محدد بعد (وردية مفتوحة)',
          },
          {
            label: 'العجز / الزيادة',
            value:
              viewTarget?.deficit !== null && viewTarget?.deficit !== undefined ? (
                <span
                  className={`font-bold ${
                    Number(viewTarget.deficit) > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {Number(viewTarget.deficit) > 0
                    ? `عجز: ${Number(viewTarget.deficit).toLocaleString('ar-EG')} ج.م`
                    : Number(viewTarget.deficit) === 0
                    ? 'متطابق تماماً (0 ج.م)'
                    : `زيادة: ${Math.abs(Number(viewTarget.deficit)).toLocaleString('ar-EG')} ج.م`}
                </span>
              ) : (
                '—'
              ),
          },
          {
            label: 'وقت بدء الوردية',
            value: viewTarget?.start ? new Date(viewTarget.start).toLocaleString('ar-EG') : '—',
          },
          {
            label: 'وقت إغلاق الوردية',
            value: viewTarget?.end ? (
              new Date(viewTarget.end).toLocaleString('ar-EG')
            ) : (
              <span className="font-bold text-emerald-600">وردية جارية (مفتوحة)</span>
            ),
          },
          {
            label: 'تاريخ التسجيل بالسيستم',
            value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '—',
            fullWidth: true,
          },
        ]}
      />
    </div>
  );
};

export default StartShiftReportPage;
