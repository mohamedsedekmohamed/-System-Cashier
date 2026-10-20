import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, ORDERS_KEY } from '../../services/orderService';
import type { Order } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { UpdateOrderStatusModal } from '../../components/orders/UpdateOrderStatusModal';
import { getOrderStatusConfig, playNotificationChime } from '../../utils/orderStatus';
import {
  MdReceipt,
  MdVisibility,
  MdDelete,
  MdStore,
  MdLanguage,
  MdList,
  MdAccessTime,
  MdAutorenew,
  MdFilterAlt,
  MdCalendarToday,
  MdNotificationsActive,
  MdVolumeUp,
  MdVolumeOff,
} from 'react-icons/md';
import { renderName } from '../../utils/helpers';

type TabType = 'all' | 'pos' | 'online';
type DateFilterType = 'default' | 'all' | 'single' | 'range';

const OrderList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('default');
  const [singleDate, setSingleDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [viewTarget, setViewTarget] = useState<Order | null>(null);
  const [statusTarget, setStatusTarget] = useState<Order | null>(null);

  // New Orders notification state
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const perPage = 15;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Determine query parameters based on date filter
  const queryDate = dateFilter === 'all' ? 'all' : dateFilter === 'single' && singleDate ? singleDate : undefined;
  const queryFrom = dateFilter === 'range' && fromDate ? fromDate : undefined;
  const queryTo = dateFilter === 'range' && toDate ? toDate : undefined;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      ORDERS_KEY,
      activeTab,
      page,
      perPage,
      debouncedSearch,
      dateFilter,
      queryDate,
      queryFrom,
      queryTo,
    ],
    queryFn: () => {
      const isPos = activeTab === 'pos' ? true : activeTab === 'online' ? false : undefined;
      return orderService.list(
        page,
        perPage,
        isPos,
        debouncedSearch || undefined,
        undefined,
        undefined,
        queryDate,
        queryFrom,
        queryTo
      );
    },
    placeholderData: (prev) => prev,
    retry: 2,
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

  // Real-time Polling for new online orders
  useEffect(() => {
    const currentCount = meta?.total ?? 0;
    if (currentCount === 0) return;

    const interval = setInterval(async () => {
      try {
        const res = await orderService.checkNew(currentCount);
        if (res.has_new && res.difference > 0) {
          setNewOrdersCount(res.difference);
          if (soundEnabled) {
            playNotificationChime();
          }
        }
      } catch {
        // Silent catch for background poll
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [meta?.total, soundEnabled]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => orderService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });
      setDeleteTarget(null);
    },
  });

  const filtered = [...orders].sort((a, b) => b.id - a.id);

  const columns: ColumnDef<Order>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'رقم الطلب',
      render: (row) => (
        <code className="text-sm font-mono bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md font-bold">
          #{row.id}
        </code>
      ),
    },
    {
      header: 'العميل',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">
            {renderName(row.name) || 'عميل نقدي'}
          </p>
          {row.phone && <p className="text-xs text-slate-500">{row.phone}</p>}
        </div>
      ),
    },
    {
      header: 'النوع',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            row.is_pos
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
          }`}
        >
          {row.is_pos ? <MdStore size={14} /> : <MdLanguage size={14} />}
          {row.is_pos ? 'نقطة بيع' : 'أونلاين'}
        </span>
      ),
    },
    {
      header: 'حالة الطلب',
      render: (row) => {
        const conf = getOrderStatusConfig(row.status);
        return (
          <button
            type="button"
            onClick={() => setStatusTarget(row)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border
              ${conf.badgeClass} hover:opacity-85 hover:scale-105 transition-all shadow-sm cursor-pointer
            `}
            title="انقر لتعديل حالة الطلب"
          >
            <span className={`w-2 h-2 rounded-full ${conf.dotClass}`} />
            <span>{conf.label}</span>
          </button>
        );
      },
    },
    {
      header: 'حالة الدفع',
      render: (row) => (
        row.paid ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            مدفوع
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            غير مدفوع (تحصيل)
          </span>
        )
      ),
    },
    {
      header: 'الإجمالي',
      render: (row) => (
        <div className="text-right">
          <p className="font-bold text-emerald-600 dark:text-emerald-400">
            {Number(row.final_price).toLocaleString('ar-EG')} ج.م
          </p>
          {row.total_discount > 0 && (
            <p className="text-xs text-slate-500 line-through">
              {Number(row.total).toLocaleString('ar-EG')} ج.م
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusTarget(row)}
            className="p-2 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-400 transition-all shadow-sm border border-teal-100 dark:border-teal-800/50"
            title="تغيير حالة الطلب"
          >
            <MdAutorenew size={16} />
          </button>
          <button
            onClick={() => setViewTarget(row)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
            title="عرض التفاصيل"
          >
            <MdVisibility size={16} />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 transition-all shadow-sm border border-rose-100 dark:border-rose-800/50"
            title="حذف"
          >
            <MdDelete size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="space-y-5">
        <CrudHeader
          title="إدارة الطلبات"
          icon={<MdReceipt size={28} />}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="ابحث برقم الطلب، أو اسم العميل..."
          onRefresh={() => refetch()}
          addLink="/dashboard/orders/add"
          addText="طلب جديد"
        />
        <ErrorFallback error={error} onRetry={refetch} />
      </div>
    );
  }

  const tabs = [
    { id: 'all', label: 'كل الطلبات', icon: <MdList size={18} /> },
    { id: 'pos', label: 'طلبات الكاشير', icon: <MdStore size={18} /> },
    { id: 'online', label: 'طلبات أونلاين', icon: <MdLanguage size={18} /> },
  ];

  return (
    <div className="space-y-5 flex flex-col h-full">
      {/* ── Crud Header ── */}
      <CrudHeader
        title="إدارة الطلبات"
        icon={<MdReceipt size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث برقم الطلب، أو اسم العميل..."
        onRefresh={() => {
          setNewOrdersCount(0);
          refetch();
        }}
        addLink="/dashboard/orders/add"
        addText="طلب جديد"
      />

      {/* ── Real-time Alert for New Orders ── */}
      {newOrdersCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/40 flex items-center justify-between text-amber-900 dark:text-amber-200 shadow-lg animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
              <MdNotificationsActive size={24} className="animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-sm">
                يوجد {newOrdersCount} طلب أونلاين جديد!
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                تم استلام طلبات جديدة عبر المنصة، انقر لتحديث الجدول واستعراضها فوراً.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNewOrdersCount(0);
                refetch();
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              تحديث القائمة الآن
            </button>
          </div>
        </div>
      )}

      {/* ── Filters & Options Bar ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
        {/* Module Tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filters Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Working Hours Info Badge */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <MdAccessTime size={15} className="text-primary shrink-0" />
            <span className="font-medium">
              {dateFilter === 'default'
                ? 'أوردرات اليوم وأمس (ساعات التشغيل)'
                : dateFilter === 'all'
                ? 'عرض السجل كاملاً'
                : 'تاريخ مخصص'}
            </span>
          </div>

          {/* Quick Date Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setDateFilter('default');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                dateFilter === 'default'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              اليوم وأمس
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFilter('all');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                dateFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              عرض الكل
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFilter(dateFilter === 'single' ? 'default' : 'single');
                setPage(1);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                dateFilter === 'single' || dateFilter === 'range'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MdFilterAlt size={14} />
              <span>تاريخ مخصص</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'تنبيهات الصوت مفعلة' : 'تنبيهات الصوت معطلة'}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              soundEnabled
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
          >
            {soundEnabled ? <MdVolumeUp size={16} /> : <MdVolumeOff size={16} />}
          </button>
        </div>
      </div>

      {/* ── Custom Date Input Row ── */}
      {(dateFilter === 'single' || dateFilter === 'range') && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <MdCalendarToday size={16} className="text-primary" />
            <span className="font-bold text-slate-700 dark:text-slate-300">
              فلترة بالتاريخ:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={singleDate}
              onChange={(e) => {
                setSingleDate(e.target.value);
                setDateFilter('single');
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {singleDate && (
              <button
                type="button"
                onClick={() => setSingleDate('')}
                className="text-xs text-rose-500 hover:underline"
              >
                مسح
              </button>
            )}
          </div>

          <span className="text-slate-400">أو حدد نطاقاً:</span>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">من:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDateFilter('range');
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <span className="text-slate-500">إلى:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDateFilter('range');
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdReceipt size={48} />}
        />
      </div>

      {/* ── Modals ── */}
      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={`الطلب #${deleteTarget?.id}`}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف"
      />

      <UpdateOrderStatusModal
        key={statusTarget?.id ?? 'none'}
        order={statusTarget}
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={`تفاصيل الطلب #${viewTarget?.id}`}
        details={[
          { label: 'رقم الطلب', value: `#${viewTarget?.id}` },
          {
            label: 'حالة الطلب',
            value: viewTarget ? (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  getOrderStatusConfig(viewTarget.status).badgeClass
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    getOrderStatusConfig(viewTarget.status).dotClass
                  }`}
                />
                <span>{getOrderStatusConfig(viewTarget.status).label}</span>
              </span>
            ) : null,
          },
          { label: 'العميل', value: renderName(viewTarget?.name) || 'عميل نقدي' },
          { label: 'رقم الهاتف', value: viewTarget?.phone || '—' },
          { label: 'العنوان', value: viewTarget?.address || '—' },
          { label: 'النوع', value: viewTarget?.is_pos ? 'نقطة بيع (POS)' : 'أونلاين' },
          {
            label: 'حالة الدفع',
            value: viewTarget ? (
              viewTarget.paid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  مدفوع بالكامل
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  غير مدفوع (مطلوب تحصيل نقدي)
                </span>
              )
            ) : null,
          },
          {
            label: 'طريقة الدفع',
            value: renderName((viewTarget as any)?.payment_method?.name) || '—',
          },
          {
            label: 'الحساب المالي (الخزينة)',
            value: renderName((viewTarget as any)?.financial_account?.name) || '—',
          },
          {
            label: 'مندوب التوصيل (Delivery)',
            value: renderName((viewTarget as any)?.delivery?.name) || '—',
          },
          { label: 'طريقة الطلب', value: viewTarget?.module || '—' },
          { label: 'الوردية', value: renderName((viewTarget as any)?.shift?.name) || '—' },
          { label: 'الكاشير', value: renderName((viewTarget as any)?.cashier?.name) || '—' },
          { label: 'موظف الكاشير', value: renderName((viewTarget as any)?.cashier_man?.name) || '—' },
          { label: 'الطاولة', value: renderName((viewTarget as any)?.hall_table?.name) || '—' },
          {
            label: 'عدد المنتجات',
            value: (viewTarget as any)?.products?.length || 0,
            fullWidth: false,
          },
          { label: 'الإجمالي الفرعي', value: `${viewTarget?.total} ج.م`, fullWidth: false },
          { label: 'الضريبة', value: `${viewTarget?.total_tax} ج.م`, fullWidth: false },
          { label: 'الخصم', value: `${viewTarget?.total_discount} ج.م`, fullWidth: false },
          {
            label: 'الإجمالي النهائي',
            value: (
              <span className="font-bold text-emerald-600 text-lg">
                {viewTarget?.final_price} ج.م
              </span>
            ),
            fullWidth: false,
          },
          { label: 'ملاحظات', value: viewTarget?.note || '—', fullWidth: true },
          {
            label: 'تاريخ الإنشاء',
            value: viewTarget?.created_at
              ? new Date(viewTarget.created_at).toLocaleString('ar-EG')
              : '',
            fullWidth: true,
          },
        ]}
      />
    </div>
  );
};

export default OrderList;
