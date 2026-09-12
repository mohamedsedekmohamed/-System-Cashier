import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftApi, SHIFTS_KEY } from '../../services/shiftService';
import type { Shift } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { MdSchedule, MdEdit, MdDelete, MdVisibility } from 'react-icons/md';
import { renderName } from '../../utils/helpers';

const ShiftList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);
  const [viewTarget, setViewTarget] = useState<Shift | null>(null);
  const perPage = 10;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [SHIFTS_KEY, page, perPage],
    queryFn: () => shiftApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const shifts = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => shiftApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIFTS_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? shifts.filter(s =>
        s.name.ar.toLowerCase().includes(search.toLowerCase()) ||
        s.name.en.toLowerCase().includes(search.toLowerCase()) ||
        String(s.id).includes(search) ||
        s.branch?.name?.toLowerCase().includes(search.toLowerCase()))
    : shifts)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Shift>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      )
    },
    {
      header: 'اسم الوردية (عربي)',
      render: (row) => <p className="font-semibold text-slate-800 dark:text-white">{row.name?.ar}</p>
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
      header: 'وقت البدء',
      render: (row) => (
        <span className="text-slate-600 dark:text-slate-300 dir-ltr inline-block">
          {row.start_time}
        </span>
      )
    },
    {
      header: 'وقت الانتهاء',
      render: (row) => (
        <span className="text-slate-600 dark:text-slate-300 dir-ltr inline-block">
          {row.end_time}
        </span>
      )
    },
    {
      header: 'اليوم التالي؟',
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.is_tomorrow ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'}`}>
          {row.is_tomorrow ? 'نعم' : 'لا'}
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
          <Link to={`/dashboard/shifts/edit/${row.id}`}
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
        title="إدارة الورديات"
        icon={<MdSchedule size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم الوردية، الفرع..."
        onRefresh={() => refetch()}
        addLink="/dashboard/shifts/add"
        addText="إضافة وردية"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdSchedule size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name?.ar || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف الوردية"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل الوردية"
        details={[
          { label: 'الرقم التعريفي', value: viewTarget?.id },
          { label: 'الاسم (عربي)', value: viewTarget?.name?.ar },
          { label: 'الاسم (إنجليزي)', value: viewTarget?.name?.en },
          { label: 'وقت البدء', value: viewTarget?.start_time },
          { label: 'وقت الانتهاء', value: viewTarget?.end_time },
          { label: 'اليوم التالي', value: viewTarget?.is_tomorrow ? 'نعم' : 'لا' },
          { label: 'الفرع', value: renderName(viewTarget?.branch?.name) || '—' },
          { label: 'تاريخ الإنشاء', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '' },
          { label: 'تاريخ آخر تحديث', value: viewTarget?.updated_at ? new Date(viewTarget.updated_at).toLocaleString('ar-EG') : '' }
        ]}
      />
    </div>
  );
};

export default ShiftList;
