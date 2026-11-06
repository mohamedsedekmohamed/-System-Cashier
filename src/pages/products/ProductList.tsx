import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, PRODUCTS_KEY } from '../../services/productService';
import type { Product } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { MdFastfood, MdEdit, MdDelete, MdVisibility } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { renderName } from '../../utils/helpers';

const ProductList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [viewTarget, setViewTarget] = useState<Product | null>(null);
  const perPage = 15;

  // ── Fetch Details for viewTarget (includes BOM recipes) ──
  const { data: detailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: [PRODUCTS_KEY, 'detail', viewTarget?.id],
    queryFn: () => productApi.get(viewTarget!.id, true),
    enabled: !!viewTarget?.id,
  });

  const detailedProduct = detailData?.data || viewTarget;
  const productRecipes = detailedProduct?.recipes || detailedProduct?.product_manufacturing?.recipes || [];

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [PRODUCTS_KEY, page, perPage],
    queryFn: () => productApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const products = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? products.filter(m =>
        m.name?.ar?.toLowerCase().includes(search.toLowerCase()) ||
        m.name?.en?.toLowerCase().includes(search.toLowerCase()) ||
        m.category?.name?.ar?.toLowerCase().includes(search.toLowerCase()) ||
        String(m.id).includes(search))
    : products)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Product>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      )
    },
    {
      header: 'المنتج',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image && row.image !== 'string' ? (
            <img src={row.image} alt={row.name?.ar} className="w-10 h-10 object-cover rounded-lg shadow-sm border border-slate-200 dark:border-slate-700" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-700">
              <MdFastfood size={20} />
            </div>
          )}
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-sm">{row.name?.ar}</p>
            <p className="text-xs text-slate-500">{row.name?.en}</p>
          </div>
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
      header: 'السعر الأساسي',
      render: (row) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {row.price} ج.م
        </span>
      )
    },
    {
      header: 'الضرائب / الخصومات',
      render: (row) => (
        <div className="flex flex-col gap-1 text-xs">
          {row.tax ? (
            <span className="text-rose-600 dark:text-rose-400">ضريبة: {row.tax.amount}{row.tax.type === 'percentage' ? '%' : ' ج.م'}</span>
          ) : <span className="text-slate-400">بدون ضريبة</span>}
          {row.discount ? (
            <span className="text-emerald-600 dark:text-emerald-400">خصم: {row.discount.amount}{row.discount.type === 'percentage' ? '%' : ' ج.م'}</span>
          ) : null}
        </div>
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
          <Link to={`/dashboard/products/edit/${row.id}`}
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
        title="إدارة المنتجات"
        icon={<MdFastfood size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم المنتج، القسم، أو المعرف..."
        onRefresh={() => refetch()}
        addLink="/dashboard/products/add"
        addText="إضافة منتج جديد"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdFastfood size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name?.ar || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف المنتج"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل المنتج"
        details={[
          { label: 'الرقم التعريفي', value: detailedProduct?.id },
          { label: 'الاسم (عربي)', value: detailedProduct?.name?.ar },
          { label: 'الاسم (إنجليزي)', value: detailedProduct?.name?.en },
          { 
            label: 'صورة المنتج', 
            value: detailedProduct?.image && detailedProduct.image !== 'string' ? (
              <div className="flex items-center gap-2">
                <img src={detailedProduct.image} alt={detailedProduct.name?.ar} className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" />
              </div>
            ) : 'لا توجد صورة' 
          },
          { label: 'الوصف (عربي)', value: detailedProduct?.description?.ar || '—' },
          { label: 'الوصف (إنجليزي)', value: detailedProduct?.description?.en || '—' },
          { label: 'القسم الرئيسي', value: detailedProduct?.category?.name?.ar || '—' },
          { label: 'السعر الأساسي', value: `${detailedProduct?.price} ج.م` },
          { label: 'الضريبة المطبقة', value: detailedProduct?.tax?.name?.ar || 'لا يوجد' },
          { label: 'الخصم المطبق', value: detailedProduct?.discount?.name?.ar || 'لا يوجد' },
          {
            label: 'مكونات التصنيع والوصفة (BOM)',
            fullWidth: true,
            value: isLoadingDetail ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                <AiOutlineLoading3Quarters className="animate-spin text-primary" />
                <span>جاري تحميل المكونات...</span>
              </div>
            ) : productRecipes.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {productRecipes.map((r, i) => {
                  const isMat = !!r.material;
                  const name = isMat ? renderName(r.material?.name) : renderName(r.product_recipe?.name);
                  const unitName = r.unit ? renderName(r.unit.name) : '';
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        isMat
                          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                          : 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40'
                      }`}
                    >
                      <span>{isMat ? 'خامة:' : 'وصفة:'}</span>
                      <span className="font-bold">{name}</span>
                      <span className="opacity-80">({r.count} {unitName})</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-slate-400 text-xs italic">لا توجد مكونات تصنيع مرتبطة بهذا المنتج</span>
            ),
          },
          { label: 'تاريخ الإنشاء', value: detailedProduct?.created_at ? new Date(detailedProduct.created_at).toLocaleString('ar-EG') : '' },
        ]}
      />
    </div>
  );
};

export default ProductList;
