import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi, CATEGORIES_KEY } from '../../services/categoryService';
import type { Category, CategoryType } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  MdCategory,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdFilterList,
} from 'react-icons/md';

const getTypeBadge = (type: CategoryType | null | undefined) => {
  switch (type) {
    case 'product':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
          منتجات (Product)
        </span>
      );
    case 'material':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
          مواد خام (Material)
        </span>
      );
    case 'recipe':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
          وصفات (Recipe)
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          عام
        </span>
      );
  }
};

const CategoryList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [viewTarget, setViewTarget] = useState<Category | null>(null);
  const perPage = 15;

  // ── Fetch Categories (paginated) ────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [CATEGORIES_KEY, page, perPage],
    queryFn: () => categoryApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const categories = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete Mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Filter and Search Logic ────────────
  const filtered = categories
    .filter((cat) => {
      // Search
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cat.name?.ar?.toLowerCase().includes(q) ||
        cat.name?.en?.toLowerCase().includes(q) ||
        cat.description?.ar?.toLowerCase().includes(q) ||
        cat.description?.en?.toLowerCase().includes(q) ||
        String(cat.id).includes(q);

      // Type Filter
      const matchesType =
        selectedType === 'all' ||
        (selectedType === 'none' && !cat.type) ||
        cat.type === selectedType;

      // Status Filter
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && cat.status) ||
        (selectedStatus === 'inactive' && !cat.status);

      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => b.id - a.id);

  // ── Table Columns ──────────────────────
  const columns: ColumnDef<Category>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'القسم',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image ? (
            <img
              src={row.image}
              alt={row.name?.ar}
              className="w-11 h-11 object-cover rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0">
              <MdCategory size={22} />
            </div>
          )}
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-sm">{row.name?.ar}</p>
            <p className="text-xs text-slate-400 font-medium">{row.name?.en}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'النوع',
      render: (row) => getTypeBadge(row.type),
    },
    {
      header: 'القسم الرئيسي',
      render: (row) => {
        if (row.parent?.name?.ar) {
          return (
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {row.parent.name.ar}
            </span>
          );
        }
        if (row.category_id) {
          return (
            <span className="text-xs text-slate-500 font-mono">
              #{row.category_id}
            </span>
          );
        }
        return <span className="text-xs text-slate-400 italic">قسم رئيسي</span>;
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
            to={`/dashboard/categories/edit/${row.id}`}
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
        title="الأقسام"
        subtitle="إدارة وتصنيف أقسام المنتجات والمواد الخام ووصفات التصنيع"
        icon={<MdCategory size={24} />}
        addLink="/dashboard/categories/add"
        addText="إضافة قسم جديد"
        count={meta?.total ?? categories.length}
      />

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="بحث بالاسم العربي، الإنجليزي أو الكود..."
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
              <option value="product">منتجات (Products)</option>
              <option value="material">مواد خام (Materials)</option>
              <option value="recipe">وصفات (Recipes)</option>
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
        emptyMessage="لم يتم العثور على أية أقسام تطابق البحث"
      />

      {/* Details Modal */}
      {viewTarget && (
        <DetailsModal
          isOpen={!!viewTarget}
          onClose={() => setViewTarget(null)}
          title={`تفاصيل القسم: ${viewTarget.name?.ar}`}
          details={[
            {
              label: 'صورة القسم',
              value: viewTarget.image ? (
                <img
                  src={viewTarget.image}
                  alt={viewTarget.name?.ar}
                  className="w-32 h-32 object-cover rounded-xl shadow-md border border-slate-200 dark:border-slate-700 mt-1"
                />
              ) : (
                <span className="text-slate-400 italic">لا توجد صورة</span>
              ),
              fullWidth: true,
            },
            { label: 'كود القسم (ID)', value: `#${viewTarget.id}` },
            { label: 'الاسم بالعربي', value: viewTarget.name?.ar },
            { label: 'الاسم بالإنجليزي', value: viewTarget.name?.en },
            { label: 'نوع القسم', value: getTypeBadge(viewTarget.type) },
            {
              label: 'القسم الرئيسي',
              value: viewTarget.parent?.name?.ar || (viewTarget.category_id ? `#${viewTarget.category_id}` : 'قسم رئيسي أساسي'),
            },
            { label: 'الحالة', value: <StatusBadge active={viewTarget.status} /> },
            {
              label: 'الوصف بالعربي',
              value: viewTarget.description?.ar || 'لا يوجد وصف',
              fullWidth: true,
            },
            {
              label: 'الوصف بالإنجليزي',
              value: viewTarget.description?.en || 'No description',
              fullWidth: true,
            },
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
          title="حذف القسم"
          message={`هل أنت متأكد من رغبتك في حذف قسم "${deleteTarget.name?.ar}"؟ هذا الإجراء قد يؤثر على المنتجات والمواد المرتبطة به.`}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default CategoryList;
