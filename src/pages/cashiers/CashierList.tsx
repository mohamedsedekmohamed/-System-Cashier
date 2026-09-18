import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashierApi, CASHIERS_KEY } from '../../services/cashierService';
import type { Cashier } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { MdPointOfSale, MdEdit, MdDelete, MdVisibility } from 'react-icons/md';
import { renderName } from '../../utils/helpers';

const CashierList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Cashier | null>(null);
  const [viewTarget, setViewTarget] = useState<Cashier | null>(null);
  const perPage = 10;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [CASHIERS_KEY, page, perPage],
    queryFn: () => cashierApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const cashiers = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => cashierApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASHIERS_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Toggle Status mutation ─────────────
  const toggleStatusMutation = useMutation({
    mutationFn: (cashier: Cashier) => {
      const payload = {
        name: cashier.name,
        cashier_man_id: cashier.cashier_man_id,
        branch_id: cashier.branch_id,
        status: !cashier.status,
      };
      return cashierApi.update(cashier.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASHIERS_KEY] });
    },
  });

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? cashiers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        String(c.id).includes(search) ||
        renderName(c.branch?.name).toLowerCase().includes(search.toLowerCase()))
    : cashiers)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Cashier>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      )
    },
    {
      header: 'اسم ماكينة الكاشير',
      render: (row) => <p className="font-semibold text-slate-800 dark:text-white">{typeof row.name === 'object' && row.name !== null ? ((row.name as any)?.ar || (row.name as any)?.en || '') : (row.name || '')}</p>
    },
    {
      header: 'الفرع',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          {renderName(row.branch?.name) || 'غير محدد'}
        </span>
      )
    },
    {
      header: 'الحالة',
      render: (row) => (
        <button 
          onClick={() => toggleStatusMutation.mutate(row)}
          disabled={toggleStatusMutation.isPending}
          className="hover:opacity-80 transition-opacity disabled:opacity-50"
          title="تغيير الحالة"
        >
          <StatusBadge active={!!row.status} />
        </button>
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
          <Link to={`/dashboard/cashiers/edit/${row.id}`}
            className="p-2 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 hover:text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 transition-all shadow-sm border border-amber-100 dark:border-amber-800/50" title="تعديل">
            <MdEdit size={16} />
          </Link>
          <button onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 transition-all shadow-sm border border-rose-100 dark:border-rose-800/50" title="حذف">
            <MdDelete size={16} />
          </button>
        </div>
      )
    }
  ];

  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 flex flex-col h-full">
      <CrudHeader
        title="إدارة ماكينات الكاشير"
        icon={<MdPointOfSale size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم الماكينة، المعرف، أو الفرع..."
        onRefresh={() => refetch()}
        addLink="/dashboard/cashiers/add"
        addText="إضافة ماكينة كاشير"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdPointOfSale size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف ماكينة الكاشير"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل الماكينة"
        details={[
          { label: 'الرقم التعريفي', value: viewTarget?.id },
          { label: 'اسم الماكينة', value: viewTarget?.name },
          { label: 'الفرع', value: renderName(viewTarget?.branch?.name) || '—' },
          { label: 'رقم الموظف المرتبط', value: viewTarget?.cashier_man_id || '—' },
          { label: 'الحالة', value: viewTarget ? <StatusBadge active={!!viewTarget.status} /> : null },
          { label: 'تاريخ الإنشاء', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '' },
          { label: 'تاريخ آخر تحديث', value: viewTarget?.updated_at ? new Date(viewTarget.updated_at).toLocaleString('ar-EG') : '' }
        ]}
      />
    </div>
  );
};

export default CashierList;
