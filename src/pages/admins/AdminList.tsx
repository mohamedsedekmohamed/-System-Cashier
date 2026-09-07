import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, ADMINS_KEY } from '../../services/adminService';
import type { Admin } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { MdAdminPanelSettings, MdEdit, MdDelete, MdVisibility } from 'react-icons/md';

const AdminList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [viewTarget, setViewTarget] = useState<Admin | null>(null);
  const perPage = 10;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [ADMINS_KEY, page, perPage],
    queryFn: () => adminApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const admins = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMINS_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side search filter ──────────
  const filtered = search
    ? admins.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        String(a.id).includes(search) ||
        a.role.toLowerCase().includes(search.toLowerCase()))
    : admins;

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Admin>[] = [
    {
      header: '#',
      render: (row) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {row.id}
        </code>
      )
    },
    {
      header: 'اسم المدير',
      render: (row) => <p className="font-semibold text-slate-800 dark:text-white">{row.name}</p>
    },
    {
      header: 'الصلاحية',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {row.role}
        </span>
      )
    },
    {
      header: 'تاريخ الإضافة',
      render: (row) => new Date(row.created_at).toLocaleDateString('ar-EG')
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewTarget(row)}
            className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200" title="عرض التفاصيل">
            <MdVisibility size={16} />
          </button>
          <Link to={`/admins/edit/${row.id}`}
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
        title="إدارة المديرين"
        icon={<MdAdminPanelSettings size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم المدير، المعرف، أو الصلاحية..."
        onRefresh={() => refetch()}
        addLink="/admins/add"
        addText="إضافة مدير جديد"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdAdminPanelSettings size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف المدير"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل المدير"
        details={[
          { label: 'الرقم التعريفي', value: viewTarget?.id },
          { label: 'اسم المدير', value: viewTarget?.name },
          { label: 'الدور (Role)', value: viewTarget?.role },
          { label: 'تاريخ الإنشاء', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '' },
          { label: 'تاريخ آخر تحديث', value: viewTarget?.updated_at ? new Date(viewTarget.updated_at).toLocaleString('ar-EG') : '' }
        ]}
      />
    </div>
  );
};

export default AdminList;
