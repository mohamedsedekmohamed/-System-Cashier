import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierApi, SUPPLIERS_KEY } from '../../services/supplierService';
import type { Supplier } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { MdLocalShipping, MdEdit, MdDelete, MdVisibility } from 'react-icons/md';

const SupplierList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [viewTarget, setViewTarget] = useState<Supplier | null>(null);
  const perPage = 15;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [SUPPLIERS_KEY, page, perPage],
    queryFn: () => supplierApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const suppliers = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => supplierApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search) ||
        (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
        String(s.id).includes(search))
    : suppliers)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Supplier>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      )
    },
    {
      header: 'اسم المورد',
      render: (row) => (
        <span className="font-bold text-slate-800 dark:text-white">{typeof row.name === 'object' && row.name !== null ? ((row.name as any)?.ar || (row.name as any)?.en || '') : (row.name || '')}</span>
      )
    },
    {
      header: 'رقم الهاتف',
      render: (row) => (
        <span className="text-slate-600 dark:text-slate-300 font-mono text-sm">{row.phone}</span>
      )
    },
    {
      header: 'البريد الإلكتروني',
      render: (row) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">{row.email || '—'}</span>
      )
    },
    {
      header: 'الرصيد المتبقي',
      render: (row) => (
        <span className={`font-semibold ${row.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {row.balance} ج.م
        </span>
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
          <Link to={`/dashboard/suppliers/edit/${row.id}`}
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
        title="إدارة الموردين"
        icon={<MdLocalShipping size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم المورد، رقم الهاتف، أو المعرف..."
        onRefresh={() => refetch()}
        addLink="/dashboard/suppliers/add"
        addText="إضافة مورد جديد"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdLocalShipping size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف المورد"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل المورد"
        details={[
          { label: 'الرقم التعريفي', value: viewTarget?.id },
          { label: 'الاسم', value: viewTarget?.name },
          { label: 'رقم الهاتف', value: viewTarget?.phone },
          { label: 'البريد الإلكتروني', value: viewTarget?.email || '—' },
          { label: 'الرصيد', value: `${viewTarget?.balance} ج.م` },
          { label: 'تاريخ الإنشاء', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '' },
        ]}
      />
    </div>
  );
};

export default SupplierList;
