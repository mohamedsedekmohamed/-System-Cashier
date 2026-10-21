import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  recipeInventoryApi,
  RECIPE_INVENTORY_DETAIL_KEY,
  RECIPE_INVENTORY_PENDING_KEY,
  RECIPE_INVENTORY_HISTORY_KEY,
} from '../../services/recipeInventoryService';
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
  MdWarningAmber,
  MdDoneAll,
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

  // Local state for tracking edited physical actual_stock per item id
  const [actualStockMap, setActualStockMap] = useState<Record<number, number>>({});
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

  const inventory = data?.data;
  const items: RecipeInventoryItem[] = inventory?.items ?? [];

  // Initialize actual stock map from fetched data
  useEffect(() => {
    if (items.length > 0) {
      const initialMap: Record<number, number> = {};
      items.forEach((item) => {
        initialMap[item.id] = Number(item.actual_stock ?? item.stock ?? 0);
      });
      setActualStockMap(initialMap);
    }
  }, [items]);

  const isPending =
    inventory?.status === 'pending' ||
    !inventory?.status ||
    inventory?.status === 'قيد الجرد والمراجعة';

  // ── Bulk Save Mutation ────────────────────
  const bulkSaveMutation = useMutation({
    mutationFn: (payload: { items: Array<{ id: number; actual_stock: number }> }) =>
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
    mutationFn: ({ itemId, actualStock }: { itemId: number; actualStock: number }) =>
      recipeInventoryApi.updateSingleItem(itemId, { actual_stock: actualStock }),
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
          ? 'تم اعتماد جلسة جرد الوصفات وترحيل التسويات بنجاح.'
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

  // Helper for recipe/material display name
  const getRecipeName = (item: RecipeInventoryItem): string => {
    const raw =
      item.recipe_name ??
      item.material_name ??
      item.name ??
      (item as any).recipe?.name ??
      (item as any).material?.name;

    if (Array.isArray(raw)) {
      const nonNull = raw.filter(Boolean);
      if (nonNull.length > 0) return renderName(nonNull[0]);
    }
    return renderName(raw) || `وصفة #${item.recipe_id || item.material_id || item.id}`;
  };

  // Bulk save all edited items
  const handleBulkSave = () => {
    if (!id || items.length === 0) return;
    const payloadItems = items.map((it) => ({
      id: it.id,
      actual_stock:
        actualStockMap[it.id] !== undefined ? actualStockMap[it.id] : Number(it.stock || 0),
    }));
    bulkSaveMutation.mutate({ items: payloadItems });
  };

  // Single row save
  const handleSaveSingleRow = (item: RecipeInventoryItem) => {
    const actualStock =
      actualStockMap[item.id] !== undefined ? actualStockMap[item.id] : Number(item.stock || 0);
    setSavingItemId(item.id);
    singleItemSaveMutation.mutate({ itemId: item.id, actualStock });
  };

  // Calculate discrepancies
  const itemsWithComputedDiff = useMemo(() => {
    return items.map((it) => {
      const currentActual =
        actualStockMap[it.id] !== undefined
          ? actualStockMap[it.id]
          : Number(it.actual_stock ?? it.stock ?? 0);
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

  // Filter items based on active chip & search
  const filteredItems = useMemo(() => {
    return itemsWithComputedDiff.filter((it) => {
      const q = search.toLowerCase().trim();
      const name = getRecipeName(it).toLowerCase();
      const code = String(it.recipe_id || it.material_id || it.id);
      const matchesSearch = !q || name.includes(q) || code.includes(q);

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
  const deficitCount = itemsWithComputedDiff.filter((it) => it.computedDiff < 0).length;
  const surplusCount = itemsWithComputedDiff.filter((it) => it.computedDiff > 0).length;
  const totalDeficitQuantity = itemsWithComputedDiff.reduce(
    (acc, it) => acc + it.computedDeficit,
    0
  );

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size={44} text="جاري تحميل تفاصيل ومواد جلسة الجرد..." />
      </div>
    );
  }

  if (isError || !inventory) {
    return (
      <ErrorFallback
        error={error as Error}
        onRetry={() => refetch()}
        message="تعذر تحميل بيانات جرد الوصفات"
      />
    );
  }

  const renderStatusBadge = (status: any) => {
    const raw =
      typeof status === 'object' && status !== null
        ? status.en || status.ar || ''
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
    <div className="space-y-6 pb-24">
      {/* Toast Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <MdCheckCircle size={20} className="text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <MdWarningAmber size={20} className="text-red-500" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/recipe-inventory"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                {renderName(inventory.name) || `جلسة جرد وصفات #${id}`}
              </h1>
              {renderStatusBadge(inventory.status)}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <MdStorefront size={14} className="text-teal-500" />
                {renderName(inventory.branch_name || (inventory as any).branch?.name || (inventory as any).branch) || `فرع #${inventory.branch_id}`}
              </span>
              <span className="flex items-center gap-1">
                <MdCalendarToday size={14} className="text-indigo-500" />
                {renderName(inventory.date) || renderName(inventory.created_at) || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        {isPending && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleBulkSave}
              disabled={bulkSaveMutation.isPending}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
            >
              {bulkSaveMutation.isPending ? (
                <>
                  <AiOutlineLoading3Quarters size={16} className="animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <MdSave size={18} />
                  <span>حفظ الكميات الفعلية</span>
                </>
              )}
            </button>

            <button
              onClick={() => setConfirmStatusModal('approve')}
              disabled={statusMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <MdDoneAll size={18} />
              <span>اعتماد الجرد</span>
            </button>

            <button
              onClick={() => setConfirmStatusModal('reject')}
              disabled={statusMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <MdCancel size={18} />
              <span>إلغاء / رفض</span>
            </button>
          </div>
        )}
      </div>

      {/* Discrepancy Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">إجمالي الوصفات</span>
            <MdFactCheck size={20} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white font-mono">
            {totalItemsCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">وصفة وتجهيز مجرود</span>
        </div>

        {/* Matching Items */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">مطابقة تماماً</span>
            <MdCheckCircle size={20} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {matchingCount}
          </div>
          <span className="text-[11px] text-emerald-600/70 font-semibold mt-1 block">
            بدون أي عجز أو زيادة
          </span>
        </div>

        {/* Deficit Count */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">بها عجز (نقص)</span>
            <MdTrendingDown size={20} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {deficitCount}
          </div>
          <span className="text-[11px] text-rose-500/80 font-semibold mt-1 block">
            إجمالي العجز: {totalDeficitQuantity.toFixed(2)}
          </span>
        </div>

        {/* Surplus Count */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">بها زيادة (فائض)</span>
            <MdTrendingUp size={20} className="text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">
            {surplusCount}
          </div>
          <span className="text-[11px] text-teal-500/80 font-semibold mt-1 block">
            رصيد فعلي أعلى من الدفتري
          </span>
        </div>
      </div>

      {/* Filter Chips & Table Search */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <MdSearch
            size={18}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو كود الوصفة..."
            className="w-full pr-10 pl-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
          />
        </div>

        {/* Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            الكل ({totalItemsCount})
          </button>

          <button
            onClick={() => setFilterType('differences')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'differences'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            بها فروقات ({discrepantCount})
          </button>

          <button
            onClick={() => setFilterType('deficit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'deficit'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            عجز فقط ({deficitCount})
          </button>

          <button
            onClick={() => setFilterType('surplus')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'surplus'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            زيادة فقط ({surplusCount})
          </button>

          <button
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
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400">
                <th className="py-4 px-4">#</th>
                <th className="py-4 px-4">الوصفة / المنتج شبه المصنع</th>
                <th className="py-4 px-4 text-center">الرصيد الدفتري (النظام)</th>
                <th className="py-4 px-4 text-center">الرصيد الفعلي (الجرد)</th>
                <th className="py-4 px-4 text-center">الفارق / العجز</th>
                {isPending && <th className="py-4 px-4 text-center">إجراء سريع</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={isPending ? 6 : 5} className="py-12 text-center text-slate-400">
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
                          كود الوصفة: #{item.recipe_id || item.material_id || item.id}
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
                            disabled={isSavingThis || !isModified}
                            className={`p-2 rounded-xl transition-all ${
                              isModified
                                ? 'bg-primary text-white shadow-xs hover:bg-primary/90'
                                : 'bg-slate-100 dark:bg-slate-750 text-slate-400 opacity-50 cursor-not-allowed'
                            }`}
                            title={isModified ? 'حفظ تعديل هذا السطر' : 'لم يتم تغيير الكمية'}
                          >
                            {isSavingThis ? (
                              <AiOutlineLoading3Quarters size={16} className="animate-spin" />
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

      {/* Confirmation Modal for Status (Approve / Reject) */}
      {confirmStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 max-w-md w-full border border-slate-100 dark:border-slate-700">
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                  confirmStatusModal === 'approve'
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600'
                    : 'bg-rose-100 dark:bg-rose-950/50 text-rose-600'
                }`}
              >
                {confirmStatusModal === 'approve' ? (
                  <MdDoneAll size={32} />
                ) : (
                  <MdCancel size={32} />
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {confirmStatusModal === 'approve'
                  ? 'تأكيد اعتماد وإغلاق جلسة الجرد'
                  : 'تأكيد إلغاء ورفض جلسة الجرد'}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                {confirmStatusModal === 'approve' ? (
                  <>
                    هل أنت متأكد من رغبتك في اعتماد نتائج الجرد لفرع{' '}
                    <strong className="text-slate-700 dark:text-slate-200">
                      {renderName(inventory.branch_name || (inventory as any).branch?.name || (inventory as any).branch) || `فرع #${inventory.branch_id}`}
                    </strong>
                    ؟ سيتم تثبيت الأرصدة الفعلية في النظام وترحيل الفروقات والتسويات، ولن يمكن تعديل
                    الكميات بعد ذلك.
                  </>
                ) : (
                  <>
                    هل أنت متأكد من رغبتك في رفض جلسة الجرد؟ سيتم إلغاء العملية وتجاهل أي تعديلات تم
                    إدخالها.
                  </>
                )}
              </p>

              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setConfirmStatusModal(null)}
                  disabled={statusMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={() => statusMutation.mutate(confirmStatusModal)}
                  disabled={statusMutation.isPending}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    confirmStatusModal === 'approve'
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-md'
                      : 'bg-rose-500 hover:bg-rose-600 shadow-md'
                  }`}
                >
                  {statusMutation.isPending ? (
                    <>
                      <AiOutlineLoading3Quarters size={16} className="animate-spin" />
                      <span>جاري التنفيذ...</span>
                    </>
                  ) : (
                    <span>تأكيد الإجراء</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeInventoryDetail;
