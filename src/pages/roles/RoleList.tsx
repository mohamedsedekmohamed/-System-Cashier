import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi, ROLES_KEY } from '../../services/roleService';
import type { Role, PermissionAction } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable, type ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { 
  MdSecurity, 
  MdEdit, 
  MdDelete, 
  MdVisibility, 
  MdCheckCircle,
  MdShield
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { getPermissionModuleMeta, PERMISSIONS_ACTION_LABELS } from '../../utils/permissionsMaster';
import { usePermissions } from '../../hooks/usePermissions';

const RoleList: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [viewTarget, setViewTarget] = useState<Role | null>(null);
  const perPage = 15;

  // ── Fetch Roles (Paginated) ────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [ROLES_KEY, page, perPage, search],
    queryFn: () => roleApi.list(page, perPage, search),
    placeholderData: (prev) => prev,
  });

  const roles = data?.data ?? [];
  const meta = data?.meta;

  // ── Fetch Single Role Details for Modal ─
  const { data: singleRoleData, isLoading: isLoadingSingle } = useQuery({
    queryKey: [ROLES_KEY, 'detail', viewTarget?.id],
    queryFn: () => roleApi.get(viewTarget!.id),
    enabled: Boolean(viewTarget?.id),
  });

  const detailedRole = singleRoleData?.data || viewTarget;
  const groupedPerms = detailedRole?.grouped_permissions || {};

  // ── Delete Mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => roleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Role>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'اسم الدور',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <MdShield size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-sm">{row.name}</p>
            <p className="text-xs text-slate-400 font-mono">معرف الدور #{row.id}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'عدد الصلاحيات الممنوحة',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
          <MdCheckCircle size={14} className="text-primary" />
          <span>{row.permissions_count ?? (row.permissions?.length ?? 0)} صلاحية</span>
        </span>
      ),
    },
    {
      header: 'تاريخ الإنشاء',
      render: (row) => (
        <span className="text-xs text-slate-500 font-mono">
          {row.created_at ? new Date(row.created_at).toLocaleDateString('ar-EG') : '—'}
        </span>
      ),
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-2">
          {/* View Details */}
          <button
            onClick={() => setViewTarget(row)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 transition-all shadow-xs border border-indigo-100 dark:border-indigo-800/50 cursor-pointer"
            title="عرض الصلاحيات المسندة"
          >
            <MdVisibility size={16} />
          </button>

          {/* Edit */}
          {can('role', 'update') && (
            <Link
              to={`/dashboard/roles/edit/${row.id}`}
              className="p-2 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 hover:text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 transition-all shadow-xs border border-amber-100 dark:border-amber-800/50"
              title="تعديل الدور والصلاحيات"
            >
              <MdEdit size={16} />
            </Link>
          )}

          {/* Delete */}
          {can('role', 'delete') && (
            <button
              onClick={() => setDeleteTarget(row)}
              className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 transition-all shadow-xs border border-rose-100 dark:border-rose-800/50 cursor-pointer"
              title="حذف الدور"
            >
              <MdDelete size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 flex flex-col h-full">
      <CrudHeader
        title="إدارة الأدوار والصلاحيات"
        icon={<MdSecurity size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم الدور..."
        onRefresh={() => refetch()}
        addLink={can('role', 'add') ? '/dashboard/roles/add' : undefined}
        addText="إضافة دور وصلاحيات جديدة"
      />

      <div className="flex-1">
        <DataTable
          data={roles}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdSecurity size={48} />}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={Boolean(deleteTarget)}
        itemName={deleteTarget?.name || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف الدور"
      />

      {/* Details Modal */}
      <DetailsModal
        isOpen={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        title={`صلاحيات الدور: ${viewTarget?.name || ''}`}
        details={[
          { label: 'الرقم التعريفي', value: detailedRole?.id },
          { label: 'اسم الدور', value: detailedRole?.name },
          {
            label: 'إجمالي الصلاحيات',
            value: `${detailedRole?.permissions_count ?? (detailedRole?.permissions?.length ?? 0)} صلاحية مسجلة`,
          },
          {
            label: 'الصلاحيات الممنوحة حسب الموديول',
            fullWidth: true,
            value: isLoadingSingle ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
                <AiOutlineLoading3Quarters className="animate-spin text-primary" />
                <span>جاري تحميل قائمة الصلاحيات...</span>
              </div>
            ) : Object.keys(groupedPerms).length > 0 ? (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
                {(Object.entries(groupedPerms) as [string, PermissionAction[]][]).map(([modKey, actions]) => {
                  const meta = getPermissionModuleMeta(modKey);
                  return (
                    <div
                      key={modKey}
                      className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                          {meta.label} <code className="text-[10px] text-slate-400 font-mono">({modKey})</code>
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          {meta.category}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {actions.map((act: PermissionAction) => {
                          const actMeta = (PERMISSIONS_ACTION_LABELS as Record<string, { label: string; color: string }>)[act] || { label: String(act), color: 'bg-slate-100 text-slate-700' };
                          return (
                            <span
                              key={act}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${actMeta.color}`}
                            >
                              {actMeta.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-slate-400 text-xs italic">لا توجد صلاحيات مسندة لهذا الدور بعد</span>
            ),
          },
          {
            label: 'تاريخ الإنشاء',
            value: detailedRole?.created_at ? new Date(detailedRole.created_at).toLocaleString('ar-EG') : '—',
          },
        ]}
      />
    </div>
  );
};

export default RoleList;
