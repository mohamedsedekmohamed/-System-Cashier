import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  purchaseDuesApi,
  saleDuesApi,
  PURCHASE_DUES_KEY,
  SALE_DUES_KEY,
} from '../../services/duesService';
import type { PurchaseDueItem, SaleDueItem, DueStatus } from '../../types';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { PayDueModal } from '../../components/dues/PayDueModal';
import { DueDetailsModal } from '../../components/dues/DueDetailsModal';
import {
  MdShoppingBag,
  MdPointOfSale,
  MdPayment,
  MdVisibility,
  MdSearch,
  MdRefresh,
  MdFilterList,
  MdCalendarToday,
  MdWarning,
  MdCheckCircle,
  MdHourglassEmpty,
  MdClear,
  MdAccountBalanceWallet,
} from 'react-icons/md';
import { renderName } from '../../utils/helpers';

export const DuesManagementPage: React.FC = () => {
  // ── States ─────────────────────────────
  const [activeTab, setActiveTab] = useState<'purchase' | 'sale'>('purchase');
  const [statusFilter, setStatusFilter] = useState<DueStatus>('all');
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Modals state
  const [payTarget, setPayTarget] = useState<PurchaseDueItem | SaleDueItem | null>(null);
  const [viewTarget, setViewTarget] = useState<PurchaseDueItem | SaleDueItem | null>(null);

  const perPage = 15;

  // ── Fetch Dues Data ────────────────────
  const queryKey = [
    activeTab === 'purchase' ? PURCHASE_DUES_KEY : SALE_DUES_KEY,
    activeTab,
    statusFilter,
    page,
    perPage,
    filterDate,
    fromDate,
    toDate,
  ];

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = {
        status: statusFilter,
        date: filterDate || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        page,
        per_page: perPage,
      };

      if (activeTab === 'purchase') {
        if (statusFilter === 'overdue') return purchaseDuesApi.getOverdue(params);
        if (statusFilter === 'unpaid') return purchaseDuesApi.getUnpaid(params);
        if (statusFilter === 'paid') return purchaseDuesApi.getPaid(params);
        return purchaseDuesApi.list(params);
      } else {
        if (statusFilter === 'overdue') return saleDuesApi.getOverdue(params);
        if (statusFilter === 'unpaid') return saleDuesApi.getUnpaid(params);
        if (statusFilter === 'paid') return saleDuesApi.getPaid(params);
        return saleDuesApi.list(params);
      }
    },
    placeholderData: (prev) => prev,
  });

  const duesList = (data?.data ?? []) as (PurchaseDueItem | SaleDueItem)[];
  const meta = data?.meta;

  // Reset page when switching tabs or status
  const handleTabChange = (tab: 'purchase' | 'sale') => {
    setActiveTab(tab);
    setPage(1);
    setSearch('');
  };

  const handleStatusChange = (status: DueStatus) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterDate('');
    setFromDate('');
    setToDate('');
    setStatusFilter('all');
    setPage(1);
  };

  // ── Client-side search filtering ────────
  const filteredDues = duesList.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();

    const isPurchase = activeTab === 'purchase';
    const partyName = isPurchase
      ? renderName((item as PurchaseDueItem).supplier?.name)
      : renderName((item as SaleDueItem).saler?.name);

    const partyPhone = isPurchase
      ? (item as PurchaseDueItem).supplier?.phone
      : (item as SaleDueItem).saler?.phone;

    const invoiceId = isPurchase
      ? (item as PurchaseDueItem).purchase_id
      : (item as SaleDueItem).sale_id;

    return (
      String(item.id).includes(q) ||
      String(invoiceId).includes(q) ||
      (partyName && partyName.toLowerCase().includes(q)) ||
      (partyPhone && partyPhone.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q)) ||
      item.date.includes(q)
    );
  });

  // Calculate stats for current items
  const totalAmount = filteredDues.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalPaid = filteredDues.reduce((sum, d) => sum + Number(d.payment || 0), 0);
  const totalRemaining = filteredDues.reduce(
    (sum, d) => sum + Number(d.remaining ?? Math.max(0, Number(d.amount) - Number(d.payment || 0))),
    0
  );

  // ── Status Badge Component ──────────────
  const renderStatusBadge = (status: string, remaining: number) => {
    if (status === 'paid' || remaining <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          <MdCheckCircle size={14} className="text-emerald-500" />
          <span>مسدد بالكامل</span>
        </span>
      );
    }
    if (status === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 animate-pulse">
          <MdWarning size={14} className="text-rose-500" />
          <span>متأخر</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
        <MdHourglassEmpty size={14} className="text-amber-500" />
        <span>غير مدفوع</span>
      </span>
    );
  };

  // ── Columns Definition ───────────────────
  const columns: ColumnDef<PurchaseDueItem | SaleDueItem>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'رقم القسط والفاتورة',
      render: (row) => {
        const isPurchase = activeTab === 'purchase';
        const invoiceId = isPurchase
          ? (row as PurchaseDueItem).purchase_id
          : (row as SaleDueItem).sale_id;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                قسط #{row.id}
              </span>
            </div>
            <span className="inline-block text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
              فاتورة {isPurchase ? 'شراء' : 'بيع'} #{invoiceId}
            </span>
          </div>
        );
      },
    },
    {
      header: activeTab === 'purchase' ? 'المورد' : 'العميل / المشتري',
      render: (row) => {
        const isPurchase = activeTab === 'purchase';
        const party = isPurchase
          ? (row as PurchaseDueItem).supplier
          : (row as SaleDueItem).saler;
        const name = renderName(party?.name) || 'غير محدد';

        return (
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-sm">{name}</p>
            {party?.phone && (
              <p className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">
                {party.phone}
              </p>
            )}
            {party?.balance !== undefined && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                رصيد الحساب: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{Number(party.balance).toLocaleString('ar-EG')}</span>
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'تاريخ الاستحقاق',
      render: (row) => {
        const isOverdue = row.status === 'overdue';
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
              <MdCalendarToday size={13} className={isOverdue ? 'text-rose-500' : 'text-slate-400'} />
              <span>{row.date}</span>
            </div>
            {isOverdue && (
              <span className="text-[10px] text-rose-500 font-bold block">
                تجاوز موعد الاستحقاق!
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'تفاصيل المبالغ',
      render: (row) => {
        const remaining = Number(row.remaining ?? Math.max(0, Number(row.amount) - Number(row.payment || 0)));
        return (
          <div className="space-y-1 text-xs font-mono min-w-[140px]">
            <div className="flex items-center justify-between text-slate-500">
              <span>الإجمالي:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {Number(row.amount).toLocaleString('ar-EG')}
              </span>
            </div>
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span>المدفوع:</span>
              <span className="font-bold">{Number(row.payment || 0).toLocaleString('ar-EG')}</span>
            </div>
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 pt-0.5 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold">المتبقي:</span>
              <span className="font-extrabold text-sm">{remaining.toLocaleString('ar-EG')}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'الحالة',
      render: (row) => {
        const remaining = Number(row.remaining ?? Math.max(0, Number(row.amount) - Number(row.payment || 0)));
        return renderStatusBadge(row.status, remaining);
      },
    },
    {
      header: 'ملاحظات',
      render: (row) => (
        <p className="text-xs text-slate-500 max-w-[150px] truncate" title={row.notes || ''}>
          {row.notes || '—'}
        </p>
      ),
    },
    {
      header: 'الإجراءات',
      render: (row) => {
        const remaining = Number(row.remaining ?? Math.max(0, Number(row.amount) - Number(row.payment || 0)));
        const canPay = remaining > 0 && row.status !== 'paid';

        return (
          <div className="flex items-center gap-1.5">
            {canPay && (
              <button
                onClick={() => setPayTarget(row)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-all font-semibold text-xs border border-emerald-200 dark:border-emerald-800/60 shadow-xs"
                title="سداد القسط"
              >
                <MdPayment size={15} />
                <span>سداد</span>
              </button>
            )}
          
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 flex flex-col h-full animate-fade-in pb-10">
      {/* ── Page Header ─────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <MdAccountBalanceWallet size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">
                إدارة الأقساط والديون الآجلة
              </h1>
              {meta?.total !== undefined && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                  {meta.total} قسط
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              متابعة وجدولة أقساط فواتير المشتريات والمبيعات المتأخرة وغير المدفوعة وإجراء السداد اللحظي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="تحديث البيانات"
          >
            <MdRefresh size={18} className={isFetching ? 'animate-spin text-primary' : ''} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* ── Main Category Tabs ──────────── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700 w-full sm:w-max">
        <button
          type="button"
          onClick={() => handleTabChange('purchase')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'purchase'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MdShoppingBag size={18} />
          <span>أقساط المشتريات (الموردين)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('sale')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'sale'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MdPointOfSale size={18} />
          <span>أقساط المبيعات (العملاء والموزعين)</span>
        </button>
      </div>

      {/* ── Summary Stats Cards ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">عدد الأقساط المعروضة</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">
              {filteredDues.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <MdFilterList size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">إجمالي مبالغ الأقساط</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white font-mono">
              {totalAmount.toLocaleString('ar-EG')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <MdPayment size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 block mb-0.5">المسدد منها</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {totalPaid.toLocaleString('ar-EG')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <MdCheckCircle size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-600 dark:text-amber-400 block mb-0.5">المتبقي المطلوب تحصيله/سداده</span>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {totalRemaining.toLocaleString('ar-EG')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <MdHourglassEmpty size={20} />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ─────── */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs space-y-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'الكل (جميع الحالات)' },
              { id: 'overdue', label: 'الأقساط المتأخرة' },
              { id: 'unpaid', label: 'غير المسددة' },
              { id: 'paid', label: 'المسددة بالكامل' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleStatusChange(st.id as DueStatus)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === st.id
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                showAdvancedFilters || filterDate || fromDate || toDate
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <MdFilterList size={16} />
              <span>فلاتر التاريخ المتقدمة</span>
            </button>

            {(search || filterDate || fromDate || toDate || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="إعادة تعيين الفلاتر"
              >
                <MdClear size={16} />
                <span>مسح الفلاتر</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Date Input Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="md:col-span-3 relative">
            <MdSearch size={20} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'purchase'
                  ? 'بحث سريع برقم القسط، رقم فاتورة الشراء، اسم المورد، الهاتف أو الملاحظات...'
                  : 'بحث سريع برقم القسط، رقم فاتورة البيع، اسم العميل، الهاتف أو الملاحظات...'
              }
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {showAdvancedFilters && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  تاريخ محدد (YYYY-MM-DD):
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">من تاريخ:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">إلى تاريخ:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Data Table ──────────────────── */}
      {isError ? (
        <ErrorFallback error={error} onRetry={refetch} />
      ) : (
        <div className="flex-1">
          <DataTable
            data={filteredDues}
            columns={columns}
            meta={meta}
            onPageChange={setPage}
            isLoading={isLoading && !data}
            emptyIcon={<MdAccountBalanceWallet size={48} />}
            emptyText={
              activeTab === 'purchase'
                ? 'لا توجد أقساط مشتريات مطابقة للبحث أو الفلاتر المحددة'
                : 'لا توجد أقساط مبيعات مطابقة للبحث أو الفلاتر المحددة'
            }
          />
        </div>
      )}

      {/* ── Pay Due Modal ───────────────── */}
      <PayDueModal
        isOpen={!!payTarget}
        onClose={() => setPayTarget(null)}
        due={payTarget}
        type={activeTab}
        onSuccess={() => refetch()}
      />

      {/* ── Due Details Modal ───────────── */}
      <DueDetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        due={viewTarget}
        type={activeTab}
        onPayClick={(due) => setPayTarget(due)}
      />
    </div>
  );
};

export default DuesManagementPage;
