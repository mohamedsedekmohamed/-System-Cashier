import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { manufacturingApi, MANUFACTURING_KEY } from '../../services/manufacturingService';
import type { ManufacturingList } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { MdPrecisionManufacturing, MdVisibility, MdEdit, MdDelete } from 'react-icons/md';

const ManufacturingListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewTarget, setViewTarget] = useState<ManufacturingList | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManufacturingList | null>(null);
  const perPage = 15;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [MANUFACTURING_KEY, page, perPage],
    queryFn: () => manufacturingApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const lists = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => manufacturingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MANUFACTURING_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? lists.filter(item =>
        item.product?.name?.ar?.toLowerCase().includes(search.toLowerCase()) ||
        item.product_recipe?.name?.ar?.toLowerCase().includes(search.toLowerCase()) ||
        String(item.id).includes(search))
    : lists)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<ManufacturingList>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      )
    },
    {
      header: 'المنتج / الوصفة',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">
            {row.product ? row.product.name?.ar : row.product_recipe?.name?.ar}
          </p>
          <p className="text-xs text-slate-500">
            {row.product ? 'منتج جاهز' : 'وصفة تحضير'}
          </p>
        </div>
      )
    },
    {
      header: 'الكمية المنتجة',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
          {row.count}
        </span>
      )
    },
    {
      header: 'تاريخ الإنشاء',
      render: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {new Date(row.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
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
          <Link to={`/dashboard/manufacturing/edit/${row.id}`}
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
        title="قوائم التصنيع"
        icon={<MdPrecisionManufacturing size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث برقم القائمة أو المنتج..."
        onRefresh={() => refetch()}
        addLink="/dashboard/manufacturing/add"
        addText="إضافة قائمة تصنيع"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdPrecisionManufacturing size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.product?.name?.ar || deleteTarget?.product_recipe?.name?.ar || 'هذه القائمة'}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف قائمة تصنيع"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل قائمة التصنيع"
        details={[
          { label: 'رقم القائمة', value: viewTarget?.id },
          { label: 'المنتج', value: viewTarget?.product?.name?.ar || '—' },
          { label: 'وصفة المنتج', value: viewTarget?.product_recipe?.name?.ar || '—' },
          { label: 'الكمية المنتجة', value: viewTarget?.count },
          { label: 'تاريخ الإنشاء', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '' },
          { 
            label: 'المواد المستخدمة', 
            value: (
              <div className="mt-2 space-y-2">
                {viewTarget?.recipes?.map((recipe, idx) => (
                  <div key={recipe.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {idx + 1}. {recipe.material ? recipe.material.name?.ar : recipe.product_recipe?.name?.ar}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      الكمية المستهلكة: <span className="font-bold">{recipe.count}</span>
                    </p>
                  </div>
                ))}
                {(!viewTarget?.recipes || viewTarget.recipes.length === 0) && (
                  <p className="text-sm text-slate-500">لا توجد مواد مستخدمة مسجلة.</p>
                )}
              </div>
            ) 
          }
        ]}
      />
    </div>
  );
};

export default ManufacturingListPage;
