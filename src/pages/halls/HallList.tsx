import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hallApi, HALLS_KEY, HALLS_SELECT_OPTIONS_KEY } from '../../services/hallService';
import type { Hall } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { renderName } from '../../utils/helpers';
import {
  MdMeetingRoom,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdStorefront,
} from 'react-icons/md';

const HallList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Hall | null>(null);
  const [viewTarget, setViewTarget] = useState<Hall | null>(null);
  const perPage = 15;

  // ── Fetch Halls (paginated) ────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [HALLS_KEY, page, perPage],
    queryFn: () => hallApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  // ── Fetch Select Options (Branches) ────
  const { data: optionsData } = useQuery({
    queryKey: [HALLS_SELECT_OPTIONS_KEY],
    queryFn: hallApi.getSelectOptions,
  });

  const halls = data?.data ?? [];
  const meta = data?.meta;
  const branches = optionsData?.data?.branches ?? data?.select_options?.branches ?? [];

  // ── Delete Mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => hallApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HALLS_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side Filter Logic ───────────
  const filtered = halls
    .filter((hall) => {
      const q = search.toLowerCase().trim();
      const branchName = renderName(hall.branch?.name);
      const matchesSearch =
        !q ||
        hall.name?.ar?.toLowerCase().includes(q) ||
        hall.name?.en?.toLowerCase().includes(q) ||
        branchName.toLowerCase().includes(q) ||
        String(hall.id).includes(q);

      const matchesBranch =
        selectedBranch === 'all' || String(hall.branch_id) === selectedBranch;

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && hall.status) ||
        (selectedStatus === 'inactive' && !hall.status);

      return matchesSearch && matchesBranch && matchesStatus;
    })
    .sort((a, b) => b.id - a.id);

  // ── Table Columns ──────────────────────
  const columns: ColumnDef<Hall>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'اسم الصالة',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <MdMeetingRoom size={22} />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-sm">{row.name?.ar}</p>
            <p className="text-xs text-slate-400 font-medium">{row.name?.en}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'الفرع',
      render: (row) => {
        const branchName = renderName(row.branch?.name);
        return branchName ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <MdStorefront size={14} className="text-primary shrink-0" />
            <span>{branchName}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">غير محدد</span>
        );
      },
    },
    {
      header: 'الحالة',
      render: (row) => <StatusBadge active={row.status} />,
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
            to={`/dashboard/halls/edit/${row.id}`}
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
    <div className="w-full space-y-6">
      {/* Header */}
      <CrudHeader
        title="الصالات"
        subtitle="إدارة صالات الجلوس في الفروع وتخصيص الطاولات لكل صالة"
        icon={<MdMeetingRoom size={24} />}
        addLink="/dashboard/halls/add"
        addText="إضافة صالة جديدة"
        count={meta?.total ?? halls.length}
      />

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="بحث بالاسم العربي، الإنجليزي أو اسم الفرع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">جميع الفروع</option>
            {branches.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {renderName(b.name)}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط فقط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        pagination={{
          currentPage: meta?.current_page || page,
          totalPages: meta?.last_page || 1,
          onPageChange: (newPage: number) => setPage(newPage),
        }}
        emptyMessage="لم يتم العثور على أي صالات مطابقة"
      />

      {/* Details Modal */}
      {viewTarget && (
        <DetailsModal
          isOpen={!!viewTarget}
          onClose={() => setViewTarget(null)}
          title={`تفاصيل الصالة: ${viewTarget.name?.ar}`}
          details={[
            { label: 'كود الصالة (ID)', value: `#${viewTarget.id}` },
            { label: 'الاسم بالعربي', value: viewTarget.name?.ar },
            { label: 'الاسم بالإنجليزي', value: viewTarget.name?.en },
            {
              label: 'الفرع التابع له',
              value: renderName(viewTarget.branch?.name) || 'غير محدد',
            },
            { label: 'الحالة', value: <StatusBadge active={viewTarget.status} /> },
            {
              label: 'تاريخ الإنشاء',
              value: viewTarget.created_at
                ? new Date(viewTarget.created_at).toLocaleString('ar-EG')
                : '—',
            },
            {
              label: 'آخر تحديث',
              value: viewTarget.updated_at
                ? new Date(viewTarget.updated_at).toLocaleString('ar-EG')
                : '—',
            },
          ]}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          title="حذف الصالة"
          message={`هل أنت متأكد من رغبتك في حذف صالة "${deleteTarget.name?.ar}"؟ هذا الإجراء قد يحذف أو يعطل الطاولات المرتبطة بهذه الصالة.`}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default HallList;
