import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wasteApi, WASTES_KEY } from '../../services/wasteService';
import type { Waste } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { MdDeleteOutline, MdEdit, MdDelete, MdVisibility } from 'react-icons/md';

const WasteList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Waste | null>(null);
  const [viewTarget, setViewTarget] = useState<Waste | null>(null);
  const perPage = 15;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [WASTES_KEY, page, perPage],
    queryFn: () => wasteApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const wastes = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => wasteApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WASTES_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? wastes.filter(w =>
        w.product_recipe?.name?.ar?.toLowerCase().includes(search.toLowerCase()) ||
        w.material?.name?.ar?.toLowerCase().includes(search.toLowerCase()) ||
        String(w.id).includes(search))
    : wastes)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Waste>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      )
    },
    {
      header: 'الوصفة / المنتج',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-white">{row.product_recipe?.name?.ar || '—'}</p>
          {row.product_recipe?.name?.en && <p className="text-xs text-slate-500">{row.product_recipe?.name?.en}</p>}
        </div>
      )
    },
    {
      header: 'المادة المهدرة',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-700 dark:text-slate-300">{row.material?.name?.ar || '—'}</p>
          {row.material?.name?.en && <p className="text-xs text-slate-500">{row.material?.name?.en}</p>}
        </div>
      )
    },
    {
      header: 'الكمية المهدرة',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-100 dark:border-rose-800">
          {row.count}
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
          <Link to={`/dashboard/wastes/edit/${row.id}`}
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
        title="إدارة الهالك والتوالف"
        icon={<MdDeleteOutline size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم الوصفة أو المادة..."
        onRefresh={() => refetch()}
        addLink="/dashboard/wastes/add"
        addText="تسجيل هالك جديد"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdDeleteOutline size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={`هالك (${deleteTarget?.material?.name?.ar || deleteTarget?.product_recipe?.name?.ar || 'عنصر'})`}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف سجل"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل الهالك"
        details={[
          { label: 'الرقم التعريفي', value: viewTarget?.id },
          { label: 'الوصفة / المنتج', value: viewTarget?.product_recipe?.name?.ar || '—' },
          { label: 'المادة المهدرة', value: viewTarget?.material?.name?.ar || '—' },
          { label: 'الكمية المهدرة', value: viewTarget?.count },
          { label: 'تاريخ التسجيل', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '' },
        ]}
      />
    </div>
  );
};

export default WasteList;
