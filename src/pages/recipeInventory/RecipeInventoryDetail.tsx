import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  recipeInventoryApi,
  RECIPE_INVENTORY_DETAIL_KEY,
  RECIPE_INVENTORY_PENDING_KEY,
  RECIPE_INVENTORY_HISTORY_KEY,
} from '../../services/recipeInventoryService';
import { unitApi, ALL_UNITS_KEY } from '../../services/unitService';
import type { RecipeInventoryItem } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import {
  MdArrowForward,
  MdSave,
  MdCheckCircle,
  MdCancel,
  MdStorefront,
  MdCalendarToday,
  MdFactCheck,
  MdSearch,
  MdTrendingDown,
  MdTrendingUp,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { renderName } from '../../utils/helpers';

const RecipeInventoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'differences' | 'deficit' | 'surplus' | 'matching'
  >('all');

  // Local state for tracking edited physical actual_stock and unit per item id
  const [actualStockMap, setActualStockMap] = useState<Record<number, number>>({});
  const [unitMap, setUnitMap] = useState<Record<number, number | null>>({});
  const [savingItemId, setSavingItemId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation modals
  const [confirmStatusModal, setConfirmStatusModal] = useState<'approve' | 'reject' | null>(null);

  // ── Fetch Details ─────────────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [RECIPE_INVENTORY_DETAIL_KEY, id],
    queryFn: () => recipeInventoryApi.getById(id as string),
    enabled: !!id,
  });

  // ── Fetch Units ───────────────────────────
  const { data: units = [] } = useQuery({
    queryKey: [ALL_UNITS_KEY],
    queryFn: () => unitApi.getAll(),
  });

  const inventory = data?.data;
  const items: RecipeInventoryItem[] = inventory?.items ?? [];

  // Initialize actual stock and unit map from fetched data
  useEffect(() => {
    if (items.length > 0) {
      const initialMap: Record<number, number> = {};
      const initialUnitMap: Record<number, number | null> = {};
      items.forEach((item) => {
        initialMap[item.id] = Number(item.actual_stock ?? item.stock ?? 0);
        initialUnitMap[item.id] = item.unit_id ?? (item.unit ? item.unit.id : null);
      });
      setActualStockMap(initialMap);
      setUnitMap(initialUnitMap);
    }
  }, [items]);

  const isPending =
    inventory?.status === 'pending' ||
    !inventory?.status ||
    inventory?.status === 'قيد الجرد والمراجعة';

  // ── Bulk Save Mutation ────────────────────
  const bulkSaveMutation = useMutation({
    mutationFn: (payload: { items: Array<{ id: number; actual_stock: number; unit_id?: number | null }> }) =>
      recipeInventoryApi.updateItems(id as string, payload),
    onSuccess: () => {
      setSuccessMessage('تم حفظ كميات جرد الوصفات بنجاح.');
      queryClient.invalidateQueries({ queryKey: [RECIPE_INVENTORY_DETAIL_KEY, id] });
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        'حدث خطأ أثناء حفظ كميات الجرد، يرجى المحاولة مرة أخرى.';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    },
  });

  // ── Single Item Save Mutation ─────────────
  const singleItemSaveMutation = useMutation({
    mutationFn: ({ itemId, actualStock, unitId }: { itemId: number; actualStock: number; unitId?: number | null }) =>
      recipeInventoryApi.updateSingleItem(itemId, { actual_stock: actualStock, unit_id: unitId }),
    onSuccess: () => {
      setSavingItemId(null);
      setSuccessMessage('تم تحديث الوصفة بنجاح');
      queryClient.invalidateQueries({ queryKey: [RECIPE_INVENTORY_DETAIL_KEY, id] });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: any) => {
      setSavingItemId(null);
      const msg =
        err?.response?.data?.message ||
        'تعذر تحديث كمية البند، يرجى المحاولة مرة أخرى.';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    },
  });

  // ── Status (Approve / Reject) Mutation ────
  const statusMutation = useMutation({
    mutationFn: (status: 'approve' | 'reject') =>
      recipeInventoryApi.updateStatus(id as string, { status }),
    onSuccess: (_, status) => {
      setConfirmStatusModal(null);
      setSuccessMessage(
        status === 'approve'
          ? 'تم اعتماد جلسة جرد الوصفات وترحيل التسويات مع التحويل الرياضي للوحدات بنجاح.'
          : 'تم رفض جلسة جرد الوصفات وإلغاؤها.'
      );
      queryClient.invalidateQueries({ queryKey: [RECIPE_INVENTORY_DETAIL_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [RECIPE_INVENTORY_PENDING_KEY] });
      queryClient.invalidateQueries({ queryKey: [RECIPE_INVENTORY_HISTORY_KEY] });
      setTimeout(() => {
        navigate('/dashboard/recipe-inventory');
      }, 1500);
    },
    onError: (err: any) => {
      setConfirmStatusModal(null);
      const msg =
        err?.response?.data?.message ||
        'تعذر تحديث حالة الجرد، يرجى التأكد من الصلاحيات والبيانات.';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  // Handle actual stock input change
  const handleActualStockChange = (itemId: number, valueStr: string) => {
    const val = parseFloat(valueStr);
    setActualStockMap((prev) => ({
      ...prev,
      [itemId]: isNaN(val) ? 0 : val,
    }));
  };

  // Helper for recipe display name
  const getRecipeName = (item: RecipeInventoryItem): string => {
    const raw = item.recipe_name ?? item.material_name ?? item.name;
    return renderName(raw) || `وصفة تصنيع #${item.recipe_id || item.id}`;
  };

  // Bulk save all edited items
  const handleBulkSave = () => {
    if (!id || items.length === 0) return;
    const payloadItems = items.map((it) => ({
      id: it.id,
      actual_stock: actualStockMap[it.id] !== undefined ? actualStockMap[it.id] : Number(it.stock || 0),
      unit_id: unitMap[it.id] ?? undefined,
    }));
    bulkSaveMutation.mutate({ items: payloadItems });
  };

  // Single row save
  const handleSaveSingleRow = (item: RecipeInventoryItem) => {
    const actualStock = actualStockMap[item.id] !== undefined ? actualStockMap[item.id] : Number(item.stock || 0);
    const unitId = unitMap[item.id] ?? undefined;
    setSavingItemId(item.id);
    singleItemSaveMutation.mutate({ itemId: item.id, actualStock, unitId });
  };

  // Calculate discrepancies
  const itemsWithComputedDiff = useMemo(() => {
    return items.map((it) => {
      const currentActual =
        actualStockMap[it.id] !== undefined ? actualStockMap[it.id] : Number(it.actual_stock ?? it.stock ?? 0);
      const bookStock = Number(it.stock ?? 0);
      const diff = currentActual - bookStock; // positive = surplus, negative = deficit
      const deficit = diff < 0 ? Math.abs(diff) : 0;
      const surplus = diff > 0 ? diff : 0;
      return {
        ...it,
        computedActual: currentActual,
        computedDiff: diff,
        computedDeficit: deficit,
        computedSurplus: surplus,
      };
    });
  }, [items, actualStockMap]);

  // Filter items
  const filteredItems = useMemo(() => {
    return itemsWithComputedDiff.filter((it) => {
      const name = getRecipeName(it).toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch =
        !q || name.includes(q) || String(it.recipe_id || it.material_id || it.id).includes(q);
      if (!matchesSearch) return false;

      if (filterType === 'differences') return it.computedDiff !== 0;
      if (filterType === 'deficit') return it.computedDiff < 0;
      if (filterType === 'surplus') return it.computedDiff > 0;
      if (filterType === 'matching') return it.computedDiff === 0;
      return true;
    });
  }, [itemsWithComputedDiff, search, filterType]);

  // Summary statistics
  const totalItemsCount = items.length;
  const discrepantCount = itemsWithComputedDiff.filter((it) => it.computedDiff !== 0).length;
  const matchingCount = itemsWithComputedDiff.filter((it) => it.computedDiff === 0).length;
  const totalDeficitQuantity = itemsWithComputedDiff.reduce(
    (acc, it) => acc + it.computedDeficit,
    0
  );

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل تفاصيل ومكونات جلسة جرد الوصفات..." />;
  }

  if (isError || !inventory) {
    return (
      <ErrorFallback
        error={error as Error}
        onRetry={refetch}
        message="تعذر تحميل بيانات جرد الوصفات"
      />
    );
  }

  const renderStatusBadge = (status: any) => {
    const raw = typeof status === 'object' && status !== null
      ? (status.en || status.ar || '')
      : String(status || '');
    const s = raw.toLowerCase();
    if (s === 'approved' || s === 'approve' || s === 'مكتمل' || s === 'معتمد') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <MdCheckCircle className="text-emerald-500 text-sm" />
          معتمد ومغلق
        </span>
      );
    }
    if (s === 'rejected' || s === 'reject' || s === 'مرفوض') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <MdCancel className="text-rose-500 text-sm" />
          مرفوض
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        قيد الجرد والمراجعة
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-sm">
          <MdCheckCircle className="text-emerald-500 text-lg shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-sm">
          <MdCancel className="text-rose-500 text-lg shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/recipe-inventory"
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              title="رجوع للقائمة"
            >
              <MdArrowForward size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {renderName(inventory.name)}
                </h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  #{inventory.id}
                </span>
                {renderStatusBadge(inventory.status)}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MdStorefront size={15} className="text-slate-400" />
                  {renderName(inventory.branch_name)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MdCalendarToday size={14} className="text-slate-400" />
                  {inventory.date || inventory.created_at_full || inventory.created_at}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isPending && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleBulkSave}
                disabled={bulkSaveMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {bulkSaveMutation.isPending ? (
                  <AiOutlineLoading3Quarters className="animate-spin text-sm" />
                ) : (
                  <MdSave size={16} />
                )}
                <span>حفظ التعديلات</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmStatusModal('approve')}
                disabled={statusMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <MdCheckCircle size={16} />
                <span>اعتماد الجرد وتسوية المخزون</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmStatusModal('reject')}
                disabled={statusMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 text-xs font-bold transition-all border border-rose-200 dark:border-rose-900/60 cursor-pointer"
              >
                <MdCancel size={16} />
                <span>رفض الجرد</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Statistics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
              إجمالي الأصناف
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100">
              {totalItemsCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block mb-0.5">
              مطابق تماماً
            </span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
              {matchingCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 block mb-0.5">
              أصناف بها فروقات
            </span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300">
              {discrepantCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/40">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 block mb-0.5">
              إجمالي العجز الكمي
            </span>
            <span className="text-xl font-black text-rose-700 dark:text-rose-300">
              {totalDeficitQuantity.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MdSearch
            size={20}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم الوصفة أو الكود..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            الكل ({items.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('differences')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'differences'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            فروقات فقط ({discrepantCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('deficit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'deficit'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            عجز فقط ({itemsWithComputedDiff.filter((it) => it.computedDiff < 0).length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('surplus')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'surplus'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            زيادة فقط ({itemsWithComputedDiff.filter((it) => it.computedDiff > 0).length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('matching')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'matching'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            مطابق ({matchingCount})
          </button>
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400">
                <th className="py-4 px-4">#</th>
                <th className="py-4 px-4">وصفة المنتج</th>
                <th className="py-4 px-4 text-center">الرصيد الدفتري (النظام)</th>
                <th className="py-4 px-4 text-center">الرصيد الفعلي (الجرد)</th>
                <th className="py-4 px-4 text-center">وحدة الجرد (تحويل آلي)</th>
                <th className="py-4 px-4 text-center">الفارق / العجز</th>
                {isPending && <th className="py-4 px-4 text-center">إجراء سريع</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={isPending ? 7 : 6} className="py-12 text-center text-slate-400">
                    <MdFactCheck size={40} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">لا توجد وصفات مطابقة لخيارات البحث أو الفلترة</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const currentVal =
                    actualStockMap[item.id] !== undefined
                      ? actualStockMap[item.id]
                      : Number(item.actual_stock ?? item.stock ?? 0);
                  const isModified =
                    actualStockMap[item.id] !== undefined &&
                    actualStockMap[item.id] !== Number(item.actual_stock ?? item.stock ?? 0);
                  const isSavingThis = savingItemId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50 transition-colors"
                    >
                      {/* Index */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {idx + 1}
                        </span>
                      </td>

                      {/* Recipe Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                          {getRecipeName(item)}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          كود الصنف: #{item.recipe_id || item.material_id || item.id}
                        </span>
                      </td>

                      {/* System Book Stock */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-sm bg-slate-100 dark:bg-slate-700/70 px-3 py-1 rounded-lg">
                          {Number(item.stock ?? 0)}
                        </span>
                      </td>

                      {/* Actual Physical Stock */}
                      <td className="py-3.5 px-4 text-center">
                        {isPending ? (
                          <div className="inline-flex items-center justify-center">
                            <input
                              type="number"
                              step="any"
                              value={currentVal}
                              onChange={(e) => handleActualStockChange(item.id, e.target.value)}
                              className={`w-28 px-3 py-1.5 rounded-xl border text-center font-mono font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                                isModified
                                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                                  : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                              }`}
                            />
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {Number(item.actual_stock ?? 0)}
                          </span>
                        )}
                      </td>

                      {/* Unit Selector */}
                      <td className="py-3.5 px-4 text-center">
                        {isPending ? (
                          <select
                            value={unitMap[item.id] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : null;
                              setUnitMap((prev) => ({ ...prev, [item.id]: val }));
                            }}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/40 focus:outline-none"
                          >
                            <option value="">الوحدة الأساسية</option>
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {renderName(u.name)} (x{u.value})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs">
                            {item.unit ? renderName(item.unit.name) : 'الوحدة الأساسية'}
                          </span>
                        )}
                      </td>

                      {/* Difference / Deficit */}
                      <td className="py-3.5 px-4 text-center">
                        {item.computedDiff === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg">
                            <MdCheckCircle size={14} className="text-emerald-500" />
                            مطابق (0)
                          </span>
                        ) : item.computedDiff < 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-lg">
                            <MdTrendingDown size={14} />
                            عجز: {item.computedDeficit.toFixed(2)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 px-2.5 py-1 rounded-lg">
                            <MdTrendingUp size={14} />
                            زيادة: +{item.computedSurplus.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Row Action (Save single) */}
                      {isPending && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleSaveSingleRow(item)}
                            disabled={isSavingThis}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/5 transition-all text-xs font-bold cursor-pointer"
                            title="حفظ تعديل هذا البند فقط"
                          >
                            {isSavingThis ? (
                              <AiOutlineLoading3Quarters size={16} className="animate-spin text-primary" />
                            ) : (
                              <MdSave size={16} />
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Approve or Reject */}
      {confirmStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                  confirmStatusModal === 'approve' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {confirmStatusModal === 'approve' ? (
                  <MdCheckCircle size={28} />
                ) : (
                  <MdCancel size={28} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {confirmStatusModal === 'approve'
                    ? 'تأكيد اعتماد نتائج جرد الوصفات'
                    : 'تأكيد رفض جلسة جرد الوصفات'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {confirmStatusModal === 'approve'
                    ? 'سيتم تحديث أرصدة الوصفات الفعلية في الفرع وفق نتائج هذا الجرد وتسوية الفروقات مع التحويل الرياضي للوحدات.'
                    : 'سيتم وضع علامة مرفوض على جلسة الجرد دون تعديل الأرصدة الحالية.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span>اسم الجرد:</span>
                <span className="font-bold">{renderName(inventory.name)}</span>
              </div>
              <div className="flex justify-between">
                <span>الفرع:</span>
                <span className="font-bold">{renderName(inventory.branch_name)}</span>
              </div>
              <div className="flex justify-between">
                <span>إجمالي الأصناف:</span>
                <span className="font-bold">{totalItemsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>الأصناف المتطابقة:</span>
                <span className="font-bold text-emerald-600">{matchingCount}</span>
              </div>
              <div className="flex justify-between">
                <span>الأصناف التي بها فروقات:</span>
                <span className="font-bold text-rose-600">{discrepantCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmStatusModal(null)}
                disabled={statusMutation.isPending}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => statusMutation.mutate(confirmStatusModal)}
                disabled={statusMutation.isPending}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all cursor-pointer ${
                  confirmStatusModal === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                }`}
              >
                {statusMutation.isPending && (
                  <AiOutlineLoading3Quarters className="animate-spin text-sm" />
                )}
                <span>
                  {confirmStatusModal === 'approve'
                    ? 'نعم، اعتماد وإغلاق الجرد'
                    : 'نعم، تأكيد الرفض'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeInventoryDetail;
