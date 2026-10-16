import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  financialAccountApi,
  FINANCIAL_ACCOUNTS_KEY,
  FINANCIAL_ACCOUNTS_SELECT_OPTIONS_KEY,
} from '../../services/financialAccountService';
import type { FinancialAccount } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { renderName } from '../../utils/helpers';
import {
  MdAccountBalance,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdStorefront,
} from 'react-icons/md';

const FinancialAccountList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<FinancialAccount | null>(null);
  const [viewTarget, setViewTarget] = useState<FinancialAccount | null>(null);
  const perPage = 15;

  // ── Fetch Accounts (paginated) ─────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [FINANCIAL_ACCOUNTS_KEY, page, perPage],
    queryFn: () => financialAccountApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  // ── Fetch Select Options (Branches) ────
  const { data: optionsData } = useQuery({
    queryKey: [FINANCIAL_ACCOUNTS_SELECT_OPTIONS_KEY],
    queryFn: financialAccountApi.getSelectOptions,
  });

  const accounts = data?.data ?? [];
  const meta = data?.meta;
  const branches = optionsData?.data?.branches ?? data?.select_options?.branches ?? [];

  // ── Delete Mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => financialAccountApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FINANCIAL_ACCOUNTS_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side Filter Logic ───────────
  const filtered = accounts
    .filter((acc) => {
      const q = search.toLowerCase().trim();
      const arName = renderName(acc.name, 'ar').toLowerCase();
      const enName = renderName(acc.name, 'en').toLowerCase();
      const branchName = renderName(acc.branch?.name || acc.branch).toLowerCase();
      const matchesSearch =
        !q ||
        arName.includes(q) ||
        enName.includes(q) ||
        branchName.includes(q) ||
        String(acc.balance).includes(q) ||
        String(acc.id).includes(q);

      const matchesBranch =
        selectedBranch === 'all' || String(acc.branch_id) === selectedBranch;

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && acc.status) ||
        (selectedStatus === 'inactive' && !acc.status);

      return matchesSearch && matchesBranch && matchesStatus;
    })
    .sort((a, b) => b.id - a.id);

  // ── Table Columns ──────────────────────
  const columns: ColumnDef<FinancialAccount>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'الحساب المالي',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.icon && row.icon !== 'string' ? (
            <img
              src={row.icon}
              alt={renderName(row.name)}
              className="w-10 h-10 object-cover rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/40">
              <MdAccountBalance size={22} />
            </div>
          )}
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-sm">
              {renderName(row.name, 'ar') || `حساب #${row.id}`}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {renderName(row.name, 'en')}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'الفرع',
      render: (row) => {
        const branchName = renderName(row.branch?.name || row.branch);
        return branchName ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <MdStorefront size={14} className="text-primary shrink-0" />
            <span>{branchName}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">عام لجميع الفروع</span>
        );
      },
    },
    {
      header: 'الرصيد',
      render: (row) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">
          {Number(row.balance || 0).toLocaleString('ar-EG')} ج.م
        </span>
      ),
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
            to={`/dashboard/financial-accounts/edit/${row.id}`}
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
        title="الحسابات المالية"
        subtitle="إدارة الخزائن النقدية والحسابات البنكية وأرصدة الفروع"
        icon={<MdAccountBalance size={24} />}
        addLink="/dashboard/financial-accounts/add"
        addText="إضافة حساب مالي"
        count={meta?.total ?? accounts.length}
      />

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="بحث باسم الحساب أو الفرع أو الكود..."
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
                {renderName(b.name || b)}
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
        emptyMessage="لم يتم العثور على أي حسابات مالية مطابقة"
      />

      {/* Details Modal */}
      {viewTarget && (
        <DetailsModal
          isOpen={!!viewTarget}
          onClose={() => setViewTarget(null)}
          title={`تفاصيل الحساب: ${renderName(viewTarget.name, 'ar')}`}
          details={[
            {
              label: 'أيقونة الحساب',
              value: viewTarget.icon && viewTarget.icon !== 'string' ? (
                <img
                  src={viewTarget.icon}
                  alt={renderName(viewTarget.name)}
                  className="w-20 h-20 object-cover rounded-xl shadow-md border border-slate-200 dark:border-slate-700 mt-1"
                />
              ) : (
                <span className="text-slate-400 italic">لا توجد أيقونة مخصصة</span>
              ),
              fullWidth: true,
            },
            { label: 'كود الحساب (ID)', value: `#${viewTarget.id}` },
            { label: 'الاسم بالعربي', value: renderName(viewTarget.name, 'ar') },
            { label: 'الاسم بالإنجليزي', value: renderName(viewTarget.name, 'en') },
            {
              label: 'الفرع التابع له',
              value: renderName(viewTarget.branch?.name || viewTarget.branch) || 'عام (كافة الفروع)',
            },
            {
              label: 'الرصيد الحالي',
              value: (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {Number(viewTarget.balance || 0).toLocaleString('ar-EG')} ج.م
                </span>
              ),
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
          title="حذف الحساب المالي"
          message={`هل أنت متأكد من رغبتك في حذف حساب "${renderName(deleteTarget.name, 'ar')}"؟ قد يؤثر ذلك على العمليات المالية المقيدة عليه.`}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default FinancialAccountList;
