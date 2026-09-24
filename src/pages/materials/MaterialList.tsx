import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialApi, MATERIALS_KEY, MATERIALS_SELECT_OPTIONS_KEY } from '../../services/materialService';
import type { Material, MaterialFormData } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { MdCategory, MdEdit, MdDelete, MdVisibility, MdStorefront } from 'react-icons/md';

const MaterialList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [viewTarget, setViewTarget] = useState<Material | null>(null);
  const perPage = 15;

  // ── Fetch Select Options (Guarded by Materials permissions) ──
  const { data: optionsData } = useQuery({
    queryKey: [MATERIALS_SELECT_OPTIONS_KEY],
    queryFn: () => materialApi.getSelectOptions(),
  });
  const branches = optionsData?.data?.branches ?? [];

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [MATERIALS_KEY, page, perPage, selectedBranchId],
    queryFn: () => materialApi.list(page, perPage, selectedBranchId),
    placeholderData: (prev) => prev,
  });

  const materials = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => materialApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MATERIALS_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Toggle Status mutation ─────────────
  const toggleStatusMutation = useMutation({
    mutationFn: (material: Material) => {
      const payload: MaterialFormData = {
        name: material.name,
        category_id: material.category_id,
        status: !material.status,
      };
      return materialApi.update(material.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MATERIALS_KEY] });
    },
  });

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? materials.filter(m =>
        m.name?.ar?.toLowerCase().includes(search.toLowerCase()) ||
        m.name?.en?.toLowerCase().includes(search.toLowerCase()) ||
        String(m.id).includes(search) ||
        m.category?.name?.ar?.toLowerCase().includes(search.toLowerCase()))
    : materials)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Material>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      )
    },
    {
      header: 'اسم المادة',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">{row.name?.ar}</p>
          <p className="text-xs text-slate-500">{row.name?.en}</p>
        </div>
      )
    },
    {
      header: 'القسم',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          {row.category?.name?.ar || 'غير محدد'}
        </span>
      )
    },
    {
      header: selectedBranchId ? 'مخزون الفرع' : 'إجمالي المخزون',
      render: (row) => {
        const stockVal = selectedBranchId ? (row.stock ?? 0) : (row.total_stock ?? row.stock ?? 0);
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
            {stockVal}
          </span>
        );
      }
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
          <StatusBadge active={row.status} />
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
          <Link to={`/dashboard/materials/edit/${row.id}`}
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
        title="إدارة المواد الخام"
        icon={<MdCategory size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم المادة، المعرف، أو القسم..."
        onRefresh={() => refetch()}
        addLink="/dashboard/materials/add"
        addText="إضافة مادة خام"
      />

      {branches.length > 0 && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-semibold">
            <MdStorefront size={18} className="text-primary" />
            <span>عرض مخزون الفرع:</span>
          </div>
          <select
            value={selectedBranchId ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              setSelectedBranchId(val);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">جميع الفروع (إجمالي المخزون)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {typeof b.name === 'object' && b.name ? (b.name.ar || b.name.en) : (b.name || '')}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdCategory size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name?.ar || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف المادة الخام"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل المادة الخام"
        details={[
          { label: 'الرقم التعريفي', value: viewTarget?.id },
          { label: 'اسم المادة (عربي)', value: viewTarget?.name?.ar },
          { label: 'اسم المادة (إنجليزي)', value: viewTarget?.name?.en },
          { label: 'الكمية (المخزون)', value: selectedBranchId ? (viewTarget?.stock ?? 0) : (viewTarget?.total_stock ?? viewTarget?.stock ?? 0) },
          { label: 'القسم', value: viewTarget?.category?.name?.ar || '—' },
          { label: 'الحالة', value: viewTarget ? <StatusBadge active={viewTarget.status} /> : null },
          { label: 'تاريخ الإنشاء', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '' },
          { label: 'تاريخ آخر تحديث', value: viewTarget?.updated_at ? new Date(viewTarget.updated_at).toLocaleString('ar-EG') : '' }
        ]}
      />
    </div>
  );
};

export default MaterialList;
