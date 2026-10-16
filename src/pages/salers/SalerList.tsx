import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salerApi, SALERS_KEY } from '../../services/salerService';
import type { Saler } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { MdStorefront, MdEdit, MdDelete, MdVisibility } from 'react-icons/md';

const SalerList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Saler | null>(null);
  const [viewTarget, setViewTarget] = useState<Saler | null>(null);
  const perPage = 15;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [SALERS_KEY, page, perPage],
    queryFn: () => salerApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const salers = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => salerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALERS_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? salers.filter((s) => {
        const query = search.toLowerCase();
        const nameStr = typeof s.name === 'object' && s.name !== null
          ? ((s.name as any)?.ar || (s.name as any)?.en || '')
          : String(s.name || '');
        return (
          nameStr.toLowerCase().includes(query) ||
          (s.phone && s.phone.includes(search)) ||
          (s.email && s.email.toLowerCase().includes(query)) ||
          String(s.id).includes(search)
        );
      })
    : salers)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Saler>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'اسم العميل / الموزع',
      render: (row) => (
        <span className="font-bold text-slate-800 dark:text-white">
          {typeof row.name === 'object' && row.name !== null
            ? (row.name as any)?.ar || (row.name as any)?.en || ''
            : row.name || ''}
        </span>
      ),
    },
    {
      header: 'رقم الهاتف',
      render: (row) => (
        <span className="text-slate-600 dark:text-slate-300 font-mono text-sm" dir="ltr">
          {row.phone}
        </span>
      ),
    },
    {
      header: 'البريد الإلكتروني',
      render: (row) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm" dir="ltr">
          {row.email || '—'}
        </span>
      ),
    },
    {
      header: 'رصيد المديونية (الآجل)',
      render: (row) => (
        <span
          className={`font-semibold ${
            row.balance > 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {Number(row.balance || 0).toLocaleString('ar-EG')} ج.م
        </span>
      ),
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewTarget(row)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
            title="عرض التفاصيل"
          >
            <MdVisibility size={16} />
          </button>
          <Link
            to={`/dashboard/salers/edit/${row.id}`}
            className="p-2 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 hover:text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 transition-all shadow-sm border border-amber-100 dark:border-amber-800/50"
            title="تعديل"
          >
            <MdEdit size={16} />
          </Link>
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

  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 flex flex-col h-full">
      <CrudHeader
        title="إدارة العملاء والموزعين (Salers)"
        icon={<MdStorefront size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم الموزع، رقم الهاتف، أو المعرف..."
        onRefresh={() => refetch()}
        addLink="/dashboard/salers/add"
        addText="إضافة موزع جديد"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdStorefront size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف الموزع / العميل"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل الموزع / العميل"
        details={[
          { label: 'الرقم التعريفي', value: viewTarget?.id },
          { label: 'الاسم', value: viewTarget?.name },
          { label: 'رقم الهاتف', value: viewTarget?.phone },
          { label: 'البريد الإلكتروني', value: viewTarget?.email || '—' },
          { label: 'الرصيد / المديونية', value: `${Number(viewTarget?.balance || 0).toLocaleString('ar-EG')} ج.م` },
          {
            label: 'تاريخ الإنشاء',
            value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '',
          },
        ]}
      />
    </div>
  );
};

export default SalerList;
