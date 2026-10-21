import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addonApi, ADDONS_KEY, ADDONS_SELECT_OPTIONS_KEY } from '../../services/addonService';
import type { Addon, AddonOptionKitchen } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal, type DetailItem } from '../../components/ui/DetailsModal';
import {
  MdExtension,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdSoupKitchen,
  MdMonetizationOn,
  MdDiscount,
  MdFilterList,
} from 'react-icons/md';

const AddonList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [kitchenFilter, setKitchenFilter] = useState<string>('all');
  const [taxFilter, setTaxFilter] = useState<string>('all');
  const [discountFilter, setDiscountFilter] = useState<string>('all');

  const [deleteTarget, setDeleteTarget] = useState<Addon | null>(null);
  const [viewTarget, setViewTarget] = useState<Addon | null>(null);
  const perPage = 15;

  // ── Fetch Addons ──────────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [ADDONS_KEY, page, perPage],
    queryFn: () => addonApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  // ── Fetch Select Options for filters ──
  const { data: optionsData } = useQuery({
    queryKey: [ADDONS_SELECT_OPTIONS_KEY],
    queryFn: addonApi.getSelectOptions,
    staleTime: 5 * 60 * 1000,
  });

  const rawAddons = (Array.isArray(data) ? data : data?.data) ?? [];
  const meta = data?.meta;
  const kitchens: AddonOptionKitchen[] = optionsData?.data?.kitchens ?? [];

  // ── Delete Mutation ───────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => addonApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADDONS_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Filter and Search Logic ───────────
  const filtered = useMemo(() => {
    return rawAddons.filter((addon) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        addon.name?.ar?.toLowerCase().includes(q) ||
        addon.name?.en?.toLowerCase().includes(q) ||
        String(addon.price).includes(q) ||
        String(addon.id).includes(q) ||
        addon.kitchen?.name?.ar?.toLowerCase().includes(q) ||
        addon.kitchen?.name?.en?.toLowerCase().includes(q) ||
        addon.tax?.name?.ar?.toLowerCase().includes(q) ||
        addon.tax?.name?.en?.toLowerCase().includes(q) ||
        addon.discount?.name?.ar?.toLowerCase().includes(q) ||
        addon.discount?.name?.en?.toLowerCase().includes(q);

      const matchesKitchen =
        kitchenFilter === 'all' ||
        (kitchenFilter === 'none' && !addon.kitchen_id) ||
        String(addon.kitchen_id) === kitchenFilter;

      const matchesTax =
        taxFilter === 'all' ||
        (taxFilter === 'with_tax' && Boolean(addon.tax_id || addon.tax)) ||
        (taxFilter === 'no_tax' && !addon.tax_id && !addon.tax);

      const matchesDiscount =
        discountFilter === 'all' ||
        (discountFilter === 'with_discount' && Boolean(addon.discount_id || addon.discount)) ||
        (discountFilter === 'no_discount' && !addon.discount_id && !addon.discount);

      return matchesSearch && matchesKitchen && matchesTax && matchesDiscount;
    });
  }, [rawAddons, search, kitchenFilter, taxFilter, discountFilter]);

  // ── Stats Calculation ─────────────────
  const stats = useMemo(() => {
    const total = rawAddons.length;
    const withKitchen = rawAddons.filter((a) => a.kitchen_id || a.kitchen).length;
    const withTax = rawAddons.filter((a) => a.tax_id || a.tax).length;
    const withDiscount = rawAddons.filter((a) => a.discount_id || a.discount).length;
    return { total, withKitchen, withTax, withDiscount };
  }, [rawAddons]);

  // ── Columns ───────────────────────────
  const columns: ColumnDef<Addon>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700/60 text-primary font-bold px-2.5 py-1 rounded-md">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'الصورة',
      render: (row) => (
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
          {row.image ? (
            <img
              src={row.image}
              alt={row.name?.ar || 'صورة الإضافة'}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
              onError={(e) => {
                // fallback on error
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <MdExtension size={22} className="text-slate-400 dark:text-slate-500" />
          )}
        </div>
      ),
    },
    {
      header: 'اسم الإضافة',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-white text-sm">
            {row.name?.ar || <span className="text-slate-400 italic">بدون اسم عربي</span>}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5" dir="ltr">
            {row.name?.en || '—'}
          </p>
        </div>
      ),
    },
    {
      header: 'السعر',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg text-sm">
          <span>{Number(row.price || 0).toLocaleString()}</span>
          <span className="text-xs font-medium">ج.م</span>
        </span>
      ),
    },
    {
      header: 'الضريبة',
      render: (row) => {
        const tax = row.tax;
        if (!tax && !row.tax_id) {
          return <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">بدون ضريبة</span>;
        }
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded-md w-fit">
              <MdMonetizationOn size={13} />
              {tax?.name?.ar || tax?.name_ar || `ضريبة #${row.tax_id}`}
            </span>
            {tax?.amount !== undefined && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {tax.amount} {tax.type === 'percentage' ? '%' : 'ج.م'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'الخصم',
      render: (row) => {
        const discount = row.discount;
        if (!discount && !row.discount_id) {
          return <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">بدون خصم</span>;
        }
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md w-fit">
              <MdDiscount size={13} />
              {discount?.name?.ar || discount?.name_ar || `خصم #${row.discount_id}`}
            </span>
            {discount?.amount !== undefined && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {discount.amount} {discount.type === 'percentage' ? '%' : 'ج.م'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'المطبخ المسؤول',
      render: (row) => {
        const kitchen = row.kitchen;
        if (!kitchen && !row.kitchen_id) {
          return (
            <span className="inline-flex items-center text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              عام / غير مخصص
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 px-2.5 py-1 rounded-lg">
            <MdSoupKitchen size={14} />
            {kitchen?.name?.ar || kitchen?.name?.en || `مطبخ #${row.kitchen_id}`}
          </span>
        );
      },
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewTarget(row)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors shadow-xs"
            title="عرض التفاصيل"
          >
            <MdVisibility size={16} />
          </button>
          <Link
            to={`/dashboard/addons/edit/${row.id}`}
            className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors shadow-xs"
            title="تعديل"
          >
            <MdEdit size={16} />
          </Link>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors shadow-xs"
            title="حذف"
          >
            <MdDelete size={16} />
          </button>
        </div>
      ),
    },
  ];

  // ── Prepare Details for Modal ─────────
  const viewDetails: DetailItem[] = viewTarget
    ? [
        { label: 'المعرف (ID)', value: `#${viewTarget.id}` },
        { label: 'الاسم بالعربية', value: viewTarget.name?.ar || '—' },
        { label: 'الاسم بالإنجليزية', value: viewTarget.name?.en || '—' },
        {
          label: 'السعر',
          value: (
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {Number(viewTarget.price || 0).toLocaleString()} ج.م
            </span>
          ),
        },
        {
          label: 'الضريبة التابعة',
          value: viewTarget.tax ? (
            <span>
              {viewTarget.tax.name?.ar || viewTarget.tax.name_ar} (
              {viewTarget.tax.amount} {viewTarget.tax.type === 'percentage' ? '%' : 'ج.م'})
            </span>
          ) : viewTarget.tax_id ? (
            `ضريبة #${viewTarget.tax_id}`
          ) : (
            'بدون ضريبة'
          ),
        },
        {
          label: 'الخصم التابع',
          value: viewTarget.discount ? (
            <span>
              {viewTarget.discount.name?.ar || viewTarget.discount.name_ar} (
              {viewTarget.discount.amount} {viewTarget.discount.type === 'percentage' ? '%' : 'ج.م'})
            </span>
          ) : viewTarget.discount_id ? (
            `خصم #${viewTarget.discount_id}`
          ) : (
            'بدون خصم'
          ),
        },
        {
          label: 'المطبخ المسؤول',
          value:
            viewTarget.kitchen?.name?.ar ||
            viewTarget.kitchen?.name?.en ||
            (viewTarget.kitchen_id ? `مطبخ #${viewTarget.kitchen_id}` : 'عام لجميع المطابخ'),
        },
        {
          label: 'تاريخ الإنشاء',
          value: viewTarget.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '—',
        },
        {
          label: 'صورة الإضافة',
          fullWidth: true,
          value: viewTarget.image ? (
            <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-xs">
              <img
                src={viewTarget.image}
                alt={viewTarget.name?.ar || 'صورة الإضافة'}
                className="w-full h-44 object-cover"
              />
            </div>
          ) : (
            <span className="text-slate-400 italic">لا توجد صورة مرفوعة</span>
          ),
        },
      ]
    : [];

  if (isError) {
    return <ErrorFallback error={error as Error} onRetry={() => refetch()} />;
  }

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header */}
      <CrudHeader
        title="قائمة الإضافات (Addons)"
        subtitle="إدارة وتخصيص إضافات الوجبات والأطعمة (جبن، صوصات، إضافات جانبية) وربطها بالمطابخ والضرائب"
        icon={<MdExtension size={26} className="text-primary" />}
        totalCount={meta?.total ?? rawAddons.length}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم الإضافة، السعر، المطبخ، الضريبة..."
        onRefresh={() => refetch()}
        addLink="/dashboard/addons/add"
        addText="إضافة جديدة"
      />

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MdExtension size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">إجمالي الإضافات</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <MdSoupKitchen size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">مرتبطة بمطبخ</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.withKitchen}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <MdMonetizationOn size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">خاضعة للضريبة</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.withTax}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <MdDiscount size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">تخضع لخصم</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.withDiscount}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <MdFilterList size={18} className="text-primary" />
            <span>فلترة متقدمة:</span>
          </div>

          {/* Kitchen Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">المطبخ:</label>
            <select
              value={kitchenFilter}
              onChange={(e) => setKitchenFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">جميع المطابخ</option>
              <option value="none">بدون مطبخ محدد</option>
              {kitchens.map((k) => (
                <option key={k.id} value={String(k.id)}>
                  {k.name?.ar || k.name?.en || `مطبخ #${k.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Tax Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">الضريبة:</label>
            <select
              value={taxFilter}
              onChange={(e) => setTaxFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">الكل</option>
              <option value="with_tax">مع ضريبة</option>
              <option value="no_tax">بدون ضريبة</option>
            </select>
          </div>

          {/* Discount Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">الخصم:</label>
            <select
              value={discountFilter}
              onChange={(e) => setDiscountFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">الكل</option>
              <option value="with_discount">مع خصم</option>
              <option value="no_discount">بدون خصم</option>
            </select>
          </div>

          {(kitchenFilter !== 'all' || taxFilter !== 'all' || discountFilter !== 'all') && (
            <button
              onClick={() => {
                setKitchenFilter('all');
                setTaxFilter('all');
                setDiscountFilter('all');
              }}
              className="text-xs text-red-500 hover:text-red-600 font-semibold underline mr-auto"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        meta={meta}
        onPageChange={setPage}
        emptyIcon={<MdExtension size={48} className="text-slate-300 dark:text-slate-600" />}
        emptyMessage="لم يتم العثور على أي إضافات مطابقة"
      />

      {/* Modals */}
      <DetailsModal
        isOpen={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        title="تفاصيل الإضافة"
        details={viewDetails}
      />

      <DeleteModal
        isOpen={Boolean(deleteTarget)}
        itemName={deleteTarget?.name?.ar || deleteTarget?.name?.en || 'الإضافة'}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AddonList;
