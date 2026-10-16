import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productRecipeApi, PRODUCT_RECIPES_KEY, PRODUCT_RECIPES_SELECT_OPTIONS_KEY } from '../../services/productRecipeService';
import type { ProductRecipe } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { MdReceiptLong, MdEdit, MdDelete, MdVisibility, MdStorefront } from 'react-icons/md';

const ProductRecipeList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ProductRecipe | null>(null);
  const [viewTarget, setViewTarget] = useState<ProductRecipe | null>(null);
  const perPage = 15;

  // ── Fetch Select Options (Guarded by Product Recipes permissions) ──
  const { data: optionsData } = useQuery({
    queryKey: [PRODUCT_RECIPES_SELECT_OPTIONS_KEY],
    queryFn: () => productRecipeApi.getSelectOptions(),
  });
  const branches = optionsData?.data?.branches ?? [];

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [PRODUCT_RECIPES_KEY, page, perPage, selectedBranchId],
    queryFn: () => productRecipeApi.list(page, perPage, selectedBranchId),
    placeholderData: (prev) => prev,
  });

  const productRecipes = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => productRecipeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_RECIPES_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? productRecipes.filter(m =>
        m.name?.ar?.toLowerCase().includes(search.toLowerCase()) ||
        m.name?.en?.toLowerCase().includes(search.toLowerCase()) ||
        m.category?.name?.ar?.toLowerCase().includes(search.toLowerCase()) ||
        String(m.id).includes(search))
    : productRecipes)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<ProductRecipe>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      )
    },
    {
      header: 'الوصفة',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-white">{row.name?.ar}</p>
          <p className="text-xs text-slate-500">{row.name?.en}</p>
        </div>
      )
    },
    {
      header: 'القسم',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
          {row.category?.name?.ar || '—'}
        </span>
      )
    },
    {
      header: selectedBranchId ? 'مخزون الفرع' : 'المخزون',
      render: (row) => {
        const stockVal = selectedBranchId ? (row.stock ?? 0) : (row.total_stock ?? row.stock ?? 0);
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {stockVal}
          </span>
        );
      }
    },
    {
      header: 'الحالة',
      render: (row) => <StatusBadge active={row.status} />
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setViewTarget(row)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50" title="عرض التفاصيل">
            <MdVisibility size={16} />
          </button>
          <Link to={`/dashboard/product-recipes/edit/${row.id}`}
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
        title="منتجات غير منتهية التصنيع"
        icon={<MdReceiptLong size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم المنتج غير منتهي التصنيع، القسم، أو المعرف..."
        onRefresh={() => refetch()}
        addLink="/dashboard/product-recipes/add"
        addText="إضافة منتج غير منتهي التصنيع"
      />

      {branches.length > 0 && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-semibold shrink-0">
            <MdStorefront size={18} className="text-primary" />
            <span>عرض مخزون الفرع:</span>
          </div>
          <div className="w-72">
            <SearchableSelect
              value={selectedBranchId ?? ''}
              onChange={(val) => {
                setSelectedBranchId(val ? Number(val) : undefined);
                setPage(1);
              }}
              options={branches}
              placeholder="جميع الفروع (إجمالي المخزون)"
              searchPlaceholder="ابحث عن الفرع..."
              isClearable={true}
            />
          </div>
        </div>
      )}

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdReceiptLong size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name?.ar || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف الوصفة"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل الوصفة"
        details={[
          { label: 'الرقم التعريفي', value: viewTarget?.id },
          { label: 'الاسم (عربي)', value: viewTarget?.name?.ar },
          { label: 'الاسم (إنجليزي)', value: viewTarget?.name?.en },
          { label: 'القسم الرئيسي', value: viewTarget?.category?.name?.ar || '—' },
          { label: 'المخزون', value: selectedBranchId ? (viewTarget?.stock ?? 0) : (viewTarget?.total_stock ?? viewTarget?.stock ?? 0) },
          { label: 'الحالة', value: viewTarget?.status ? 'نشط' : 'غير نشط' },
          { label: 'تاريخ الإنشاء', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '' },
        ]}
      />
    </div>
  );
};

export default ProductRecipeList;
