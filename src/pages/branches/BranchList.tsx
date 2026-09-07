import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchApi, BRANCHES_KEY } from '../../services/branchService';
import type { Branch } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { CopyButton } from '../../components/ui/CopyButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { MdStorefront, MdEdit, MdDelete, MdVisibility } from 'react-icons/md';

const BranchList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [viewTarget, setViewTarget] = useState<Branch | null>(null);
  const perPage = 10;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [BRANCHES_KEY, page, perPage],
    queryFn: () => branchApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const branches = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => branchApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BRANCHES_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side search filter ──────────
  const filtered = search
    ? branches.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        String(b.id).includes(search) ||
        b.address.toLowerCase().includes(search.toLowerCase()))
    : branches;

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Branch>[] = [
    {
      header: '#',
      render: (row) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {row.id}
        </code>
      )
    },
    {
      header: 'اسم الفرع',
      render: (row) => <p className="font-semibold text-slate-800 dark:text-white">{row.name}</p>
    },
    {
      header: 'العنوان',
      render: (row) => <span className="text-slate-600 dark:text-slate-300">{row.address || '—'}</span>
    },
    {
      header: 'الهاتف',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-600 dark:text-slate-300">{row.watts || '—'}</span>
          {row.watts && <CopyButton text={row.watts} />}
        </div>
      )
    },
    {
      header: 'الحالة',
      render: (row) => <StatusBadge active={row.status} />
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewTarget(row)}
            className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200" title="عرض التفاصيل">
            <MdVisibility size={16} />
          </button>
          <Link to={`/branches/edit/${row.id}`}
            className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all duration-200" title="تعديل">
            <MdEdit size={16} />
          </Link>
          <button onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200" title="حذف">
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
        title="إدارة الفروع"
        icon={<MdStorefront size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم الفرع، المعرف، أو العنوان..."
        onRefresh={() => refetch()}
        addLink="/branches/add"
        addText="إضافة فرع جديد"
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
        descriptionPrefix="هل أنت متأكد من حذف الفرع"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل الفرع"
        details={[
          { label: 'الرقم التعريفي', value: viewTarget?.id },
          { label: 'اسم الفرع', value: viewTarget?.name },
          { label: 'العنوان', value: viewTarget?.address },
          { label: 'رقم الواتساب', value: viewTarget?.watts },
          { label: 'رابط فيسبوك', value: viewTarget?.facebook ? <a href={viewTarget.facebook} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">رابط الصفحة</a> : '—' },
          { label: 'الحالة', value: viewTarget ? <StatusBadge active={viewTarget.status} /> : null },
          { label: 'الدور (Role)', value: viewTarget?.role },
          { label: 'تاريخ الإنشاء', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '' }
        ]}
      />
    </div>
  );
};

export default BranchList;
