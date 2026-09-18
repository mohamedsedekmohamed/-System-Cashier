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
import { MdReceipt, MdVisibility, MdDelete, MdStore, MdLanguage, MdList } from 'react-icons/md';
import { renderName } from '../../utils/helpers';

type TabType = 'all' | 'pos' | 'online';

const OrderList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [viewTarget, setViewTarget] = useState<Order | null>(null);
  const perPage = 15;

  // Debounce search input - البحث بعد توقف الكتابة بـ 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // رجوع للصفحة الأولى عند البحث
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [ORDERS_KEY, activeTab, page, perPage, debouncedSearch],
    queryFn: () => {
      const isPos = activeTab === 'pos' ? true : activeTab === 'online' ? false : undefined;
      return orderService.list(page, perPage, isPos, debouncedSearch || undefined);
    },
    placeholderData: (prev) => prev,
    retry: 2, // محاولة مرتين فقط
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

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
      )
    },
    {
      header: 'رقم الطلب',
      render: (row) => (
        <code className="text-sm font-mono bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md font-bold">
          #{row.id}
        </code>
      )
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
      )
    },
    {
      header: 'الوردية',
      render: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {(row as any).shift?.name?.ar || (row as any).shift?.name?.en || '—'}
        </span>
      )
    },
    {
      header: 'الكاشير',
      render: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {renderName((row as any).cashier?.name) || '—'}
        </span>
      )
    },
    {
      header: 'النوع',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          row.is_pos 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
        }`}>
          {row.is_pos ? <MdStore size={14} /> : <MdLanguage size={14} />}
          {row.is_pos ? 'نقطة بيع' : 'أونلاين'}
        </span>
      )
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
      )
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setViewTarget(row)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50" title="عرض التفاصيل">
            <MdVisibility size={16} />
          </button>
          <button onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 transition-all shadow-sm border border-rose-100 dark:border-rose-800/50" title="حذف">
            <MdDelete size={16} />
          </button>
        </div>
      )
    }
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
    { id: 'online', label: 'طلبات أونلاين', icon: <MdLanguage size={18} /> }
  ];

  return (
    <div className="space-y-5 flex flex-col h-full">
      <CrudHeader
        title="إدارة الطلبات"
        icon={<MdReceipt size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث برقم الطلب، أو اسم العميل..."
        onRefresh={() => refetch()}
        addLink="/dashboard/orders/add"
        addText="طلب جديد"
      />

      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id as TabType); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

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

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={`الطلب #${deleteTarget?.id}`}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={`تفاصيل الطلب #${viewTarget?.id}`}
        details={[
          { label: 'رقم الطلب', value: `#${viewTarget?.id}` },
          { label: 'العميل', value: renderName(viewTarget?.name) || 'عميل نقدي' },
          { label: 'رقم الهاتف', value: viewTarget?.phone || '—' },
          { label: 'العنوان', value: viewTarget?.address || '—' },
          { label: 'النوع', value: viewTarget?.is_pos ? 'نقطة بيع (POS)' : 'أونلاين' },
          { label: 'طريقة الطلب', value: viewTarget?.module || '—' },
          { label: 'الوردية', value: renderName((viewTarget as any)?.shift?.name) || '—' },
          { label: 'الكاشير', value: renderName((viewTarget as any)?.cashier?.name) || '—' },
          { label: 'موظف الكاشير', value: renderName((viewTarget as any)?.cashier_man?.name) || '—' },
          { label: 'الطاولة', value: renderName((viewTarget as any)?.hall_table?.name) || '—' },
          { label: 'عدد المنتجات', value: (viewTarget as any)?.products?.length || 0, fullWidth: false },
          { label: 'الإجمالي الفرعي', value: `${viewTarget?.total} ج.م`, fullWidth: false },
          { label: 'الضريبة', value: `${viewTarget?.total_tax} ج.م`, fullWidth: false },
          { label: 'الخصم', value: `${viewTarget?.total_discount} ج.م`, fullWidth: false },
          { label: 'الإجمالي النهائي', value: <span className="font-bold text-emerald-600 text-lg">{viewTarget?.final_price} ج.م</span>, fullWidth: false },
          { label: 'ملاحظات', value: viewTarget?.note || '—', fullWidth: true },
          { label: 'تاريخ الإنشاء', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '', fullWidth: true },
        ]}
      />
    </div>
  );
};

export default OrderList;
