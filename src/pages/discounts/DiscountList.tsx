import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discountApi, DISCOUNTS_KEY } from '../../services/discountService';
import type { Discount, DiscountType } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { renderName } from '../../utils/helpers';
import {
  MdDiscount,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdFilterList,
} from 'react-icons/md';

const getTypeBadge = (type: DiscountType) => {
  if (type === 'percentage') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
        نسبة مئوية (%)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
      مبلغ ثابت (ج.م)
    </span>
  );
};

const DiscountList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [viewTarget, setViewTarget] = useState<Discount | null>(null);
  const perPage = 15;

  // ── Fetch Discounts (paginated) ────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [DISCOUNTS_KEY, page, perPage],
    queryFn: () => discountApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const discounts = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete Mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => discountApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DISCOUNTS_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Filter and Search Logic ────────────
  const filtered = discounts
    .filter((d) => {
      const q = search.toLowerCase().trim();
      const arName = renderName(d.name, 'ar').toLowerCase();
      const enName = renderName(d.name, 'en').toLowerCase();
      const matchesSearch =
        !q ||
        arName.includes(q) ||
        enName.includes(q) ||
        String(d.amount).includes(q) ||
        String(d.id).includes(q);

      const matchesType = selectedType === 'all' || d.type === selectedType;

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && d.status) ||
        (selectedStatus === 'inactive' && !d.status);

      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => b.id - a.id);

  // ── Table Columns ──────────────────────
  const columns: ColumnDef<Discount>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'الخصم',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-800/40">
            <MdDiscount size={22} />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-sm">
              {renderName(row.name, 'ar')}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {renderName(row.name, 'en')}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'النوع',
      render: (row) => getTypeBadge(row.type),
    },
    {
      header: 'القيمة',
      render: (row) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">
          {row.amount} {row.type === 'percentage' ? '%' : 'ج.م'}
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
            to={`/dashboard/discounts/edit/${row.id}`}
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
        title="الخصومات والعروض"
        subtitle="إدارة نسب ومبالغ الخصومات الترويجية وقسائم التخفيض"
        icon={<MdDiscount size={24} />}
        addLink="/dashboard/discounts/add"
        addText="إضافة خصم جديد"
        count={meta?.total ?? discounts.length}
      />

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="بحث باسم الخصم أو القيمة أو الكود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <MdFilterList size={18} className="text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">جميع الأنواع</option>
              <option value="percentage">نسبة مئوية (%)</option>
              <option value="value">مبلغ ثابت (ج.م)</option>
            </select>
          </div>

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
        emptyMessage="لم يتم العثور على أية خصومات مطابقة"
      />

      {/* Details Modal */}
      {viewTarget && (
        <DetailsModal
          isOpen={!!viewTarget}
          onClose={() => setViewTarget(null)}
          title={`تفاصيل الخصم: ${renderName(viewTarget.name, 'ar')}`}
          details={[
            { label: 'كود الخصم (ID)', value: `#${viewTarget.id}` },
            { label: 'الاسم بالعربي', value: renderName(viewTarget.name, 'ar') },
            { label: 'الاسم بالإنجليزي', value: renderName(viewTarget.name, 'en') },
            { label: 'نوع الخصم', value: getTypeBadge(viewTarget.type) },
            {
              label: 'القيمة',
              value: (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {viewTarget.amount} {viewTarget.type === 'percentage' ? '%' : 'ج.م'}
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
          title="حذف الخصم"
          message={`هل أنت متأكد من رغبتك في حذف خصم "${renderName(deleteTarget.name, 'ar')}"؟ لن يتم تطبيق هذا الخصم على الطلبات أو الأصناف بعد ذلك.`}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default DiscountList;
