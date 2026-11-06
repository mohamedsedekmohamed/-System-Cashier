import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addonInventoryApi,
  ADDON_INVENTORY_DETAIL_KEY,
  ADDON_INVENTORY_PENDING_KEY,
  ADDON_INVENTORY_HISTORY_KEY,
  ADDON_INVENTORY_OPTIONS_KEY,
} from '../../services/addonInventoryService';
import type { InventoryAddonItem } from '../../types';
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
  MdWarningAmber,
  MdDoneAll,
  MdTrendingDown,
  MdTrendingUp,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { renderName } from '../../utils/helpers';

export const AddonInventoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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

  // Confirmation modal for status
  const [confirmStatusModal, setConfirmStatusModal] = useState<'approve' | 'reject' | null>(null);

  // ── Fetch Details ─────────────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [ADDON_INVENTORY_DETAIL_KEY, id],
    queryFn: () => addonInventoryApi.getById(id as string),
    enabled: !!id,
  });

  // ── Fetch Select Options (Units & Branches) ───────────────
  const { data: optionsData } = useQuery({
    queryKey: [ADDON_INVENTORY_OPTIONS_KEY],
    queryFn: () => addonInventoryApi.getSelectOptions(),
  });
  const units = optionsData?.data?.units ?? [];

  const inventory = data?.data;
  const items: InventoryAddonItem[] = inventory?.items ?? [];
  const isPending = inventory?.status === 'pending';

  // Initialize actual stock & units map from fetched data
  useEffect(() => {
    if (items.length > 0) {
      const stockInit: Record<number, number> = {};
      const unitInit: Record<number, number | null> = {};
      items.forEach((it) => {
        stockInit[it.id] = it.actual_stock !== undefined ? Number(it.actual_stock) : Number(it.stock || 0);
        unitInit[it.id] = it.unit_id ?? (it.unit ? it.unit.id : null);
      });
      setActualStockMap(stockInit);
      setUnitMap(unitInit);
    }
  }, [items]);

  // ── Bulk Save Mutation ────────────────────
  const bulkSaveMutation = useMutation({
    mutationFn: (payload: { items: Array<{ id: number; actual_stock: number; unit_id?: number | null }> }) =>
      addonInventoryApi.updateItems(id as string, payload),
    onSuccess: () => {
      setSuccessMessage('تم حفظ وتحديث كميات الجرد الفعلية بنجاح!');
      queryClient.invalidateQueries({ queryKey: [ADDON_INVENTORY_DETAIL_KEY, id] });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'تعذر حفظ بنود الجرد دفعة واحدة';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    },
  });

  // ── Single Item Save Mutation ─────────────
  const singleItemSaveMutation = useMutation({
    mutationFn: (payload: { itemId: number; actualStock: number; unitId?: number | null }) =>
      addonInventoryApi.updateSingleItem(payload.itemId, {
        actual_stock: payload.actualStock,
        unit_id: payload.unitId,
      }),
    onSuccess: () => {
      setSavingItemId(null);
      setSuccessMessage('تم حفظ البند بنجاح!');
      queryClient.invalidateQueries({ queryKey: [ADDON_INVENTORY_DETAIL_KEY, id] });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: any) => {
      setSavingItemId(null);
      const msg = err?.response?.data?.message || 'تعذر تحديث البند';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    },
  });

  // ── Status (Approve / Reject) Mutation ────
  const statusMutation = useMutation({
    mutationFn: (status: 'approve' | 'reject') =>
      addonInventoryApi.updateStatus(id as string, { status }),
    onSuccess: (_, status) => {
      setConfirmStatusModal(null);
      queryClient.invalidateQueries({ queryKey: [ADDON_INVENTORY_DETAIL_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [ADDON_INVENTORY_PENDING_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADDON_INVENTORY_HISTORY_KEY] });
      setSuccessMessage(
        status === 'approve'
          ? 'تم اعتماد الجرد وتسوية أرصدة مخزون الإضافات في الفرع بنجاح مع التحويل الرياضي للوحدات!'
          : 'تم رفض نتائج الجرد الحالية.'
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err: any) => {
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

  // Handle unit change
  const handleUnitChange = (itemId: number, unitId: number | null) => {
    setUnitMap((prev) => ({
      ...prev,
      [itemId]: unitId,
    }));
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
  const handleSaveSingleRow = (item: InventoryAddonItem) => {
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
      const name = (it.addon_name || renderName(it.addon?.name) || `إضافة #${it.addon_id}`).toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch = !q || name.includes(q) || String(it.addon_id).includes(q);
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
    return <LoadingSpinner text="جاري تحميل تفاصيل ومخزون جلسة جرد الإضافات..." />;
  }

  if (isError || !inventory) {
    return (
      <ErrorFallback
        error={error as Error}
        onRetry={refetch}
        message="تعذر تحميل بيانات جرد الإضافات"
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center gap-2 animate-in fade-in shadow-sm">
          <MdCheckCircle size={20} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm font-bold flex items-center gap-2 animate-in fade-in shadow-sm">
          <MdCancel size={20} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/addon-inventory"
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-all"
              title="العودة لقائمة الجرد"
            >
              <MdArrowForward size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                  {inventory.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-primary/10 text-primary">
                  #{inventory.id}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold ${
                    isPending
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      : inventory.status === 'approve'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                  }`}
                >
                  {isPending ? 'قيد الجرد والمراجعة' : inventory.status === 'approve' ? 'معتمد ومغلق' : 'مرفوض'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MdStorefront size={14} />
                  الفرع: <strong>{renderName(inventory.branch_name) || `فرع #${inventory.branch_id}`}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MdCalendarToday size={14} />
                  {inventory.date || (inventory.created_at ? new Date(inventory.created_at).toLocaleDateString('ar-EG') : '—')}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons (only when pending) */}
          {isPending && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleBulkSave}
                disabled={bulkSaveMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {bulkSaveMutation.isPending ? (
                  <AiOutlineLoading3Quarters size={14} className="animate-spin" />
                ) : (
                  <MdSave size={16} />
                )}
                <span>حفظ التعديلات الحالية</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmStatusModal('approve')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm cursor-pointer"
              >
                <MdCheckCircle size={16} />
                <span>اعتماد الجرد وتسوية المخزون</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmStatusModal('reject')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/40 transition-all border border-rose-200 dark:border-rose-900 cursor-pointer"
              >
                <MdCancel size={16} />
                <span>رفض الجرد</span>
              </button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">إجمالي الإضافات</span>
            <span className="text-xl font-black text-slate-800 dark:text-white">{totalItemsCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block mb-0.5">مطابق تماماً</span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{matchingCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/40">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 block mb-0.5">عناصر بها فروقات</span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300">{discrepantCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/40">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 block mb-0.5">إجمالي العجز الكمي</span>
            <span className="text-xl font-black text-rose-700 dark:text-rose-300">{totalDeficitQuantity.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MdSearch size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن إضافة بالاسم أو الكود..."
            className="w-full pr-10 pl-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === 'all' ? 'bg-white dark:bg-slate-700 text-primary shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            الكل ({totalItemsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('differences')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === 'differences' ? 'bg-white dark:bg-slate-700 text-primary shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            فروقات ({discrepantCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('deficit')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === 'deficit' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            عجز فقط ({itemsWithComputedDiff.filter((it) => it.computedDiff < 0).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('matching')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === 'matching' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            مطابق ({matchingCount})
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">الإضافة</th>
                <th className="py-3.5 px-4 text-center">الرصيد الدفتري المسجل</th>
                <th className="py-3.5 px-4 text-center">الرصيد الفعلي المعدود</th>
                <th className="py-3.5 px-4 text-center">وحدة الجرد (تحويل آلي)</th>
                <th className="py-3.5 px-4 text-center">الفارق / العجز</th>
                {isPending && <th className="py-3.5 px-4 text-center">إجراء</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={isPending ? 7 : 6} className="py-12 text-center text-slate-400 font-medium">
                    لا توجد إضافات تطابق الفلتر أو البحث الحالي
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const currentActual = actualStockMap[item.id] !== undefined ? actualStockMap[item.id] : Number(item.stock || 0);
                  const currentUnitId = unitMap[item.id] ?? (item.unit_id || (item.unit ? item.unit.id : null));
                  const isSavingThis = savingItemId === item.id;
                  const diff = item.computedDiff;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {item.addon?.image ? (
                            <img
                              src={item.addon.image}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              <MdFactCheck size={16} />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                              {item.addon_name || renderName(item.addon?.name) || `إضافة #${item.addon_id}`}
                            </p>
                            <span className="text-[11px] text-slate-400 font-mono">
                              كود: #{item.addon_id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* System Stock */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300 text-sm">
                        {Number(item.stock || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </td>

                      {/* Actual Physical Stock Input */}
                      <td className="py-3.5 px-4 text-center">
                        {isPending ? (
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={currentActual}
                            onChange={(e) => handleActualStockChange(item.id, e.target.value)}
                            className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono font-bold text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
                          />
                        ) : (
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {Number(item.actual_stock || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>

                      {/* Unit Selector */}
                      <td className="py-3.5 px-4 text-center">
                        {isPending ? (
                          <select
                            value={currentUnitId ?? ''}
                            onChange={(e) => handleUnitChange(item.id, e.target.value ? Number(e.target.value) : null)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/40 focus:outline-none"
                          >
                            <option value="">وحدة المخزون الأساسية</option>
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {renderName(u.name)} (x{u.value})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs">
                            {item.unit ? renderName(item.unit.name) : 'الوحدة الأساسية'}
                          </span>
                        )}
                      </td>

                      {/* Discrepancy Status */}
                      <td className="py-3.5 px-4 text-center">
                        {diff === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold font-mono">
                            <MdDoneAll size={14} /> مطابق (0)
                          </span>
                        ) : diff < 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold font-mono">
                            <MdTrendingDown size={14} /> عجز: {Math.abs(diff).toFixed(2)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold font-mono">
                            <MdTrendingUp size={14} /> زيادة: +{diff.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Single Row Save */}
                      {isPending && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleSaveSingleRow(item)}
                            disabled={isSavingThis}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-600 dark:bg-slate-800 dark:text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                            title="حفظ هذا البند منفصلاً"
                          >
                            {isSavingThis ? (
                              <AiOutlineLoading3Quarters size={15} className="animate-spin text-primary" />
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

      {/* Confirmation Modal for Approve / Reject */}
      {confirmStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  confirmStatusModal === 'approve'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50'
                    : 'bg-rose-100 text-rose-600 dark:bg-rose-950/50'
                }`}
              >
                {confirmStatusModal === 'approve' ? <MdCheckCircle size={28} /> : <MdWarningAmber size={28} />}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                  {confirmStatusModal === 'approve' ? 'تأكيد اعتماد جرد الإضافات' : 'تأكيد رفض الجرد'}
                </h3>
                <p className="text-xs text-slate-500">
                  {confirmStatusModal === 'approve'
                    ? 'سيتم تحديث أرصدة مخزون الفرع الفعلية وإغلاق الجلسة نهائياً'
                    : 'سيتم إلغاء نتائج هذه الجلسة ولن يتأثر رصيد المخزن'}
                </p>
              </div>
            </div>

            {confirmStatusModal === 'approve' && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
                <p className="font-bold">⚠️ تنبيه تحويل الوحدات والمخزون:</p>
                <p>
                  عند الاعتماد، سيتم استبدال رصيد كل إضافة بالرصيد الفعلي، وفي حال اختيار وحدة مختلفة (كالكرتونة)، سيقوم النظام آلياً بضربها في معامل التحويل لتسجيلها بوحدة المخزون.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmStatusModal(null)}
                disabled={statusMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => statusMutation.mutate(confirmStatusModal)}
                disabled={statusMutation.isPending}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
                  confirmStatusModal === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {statusMutation.isPending ? (
                  <>
                    <AiOutlineLoading3Quarters size={14} className="animate-spin" />
                    <span>جاري التنفيذ...</span>
                  </>
                ) : (
                  <span>{confirmStatusModal === 'approve' ? 'نعم، اعتماد وتسوية' : 'نعم، رفض الجرد'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AddonInventoryDetail;

