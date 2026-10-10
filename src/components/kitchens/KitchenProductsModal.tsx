import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  kitchenProductApi,
  KITCHEN_PRODUCTS_KEY,
  UNASSIGNED_KITCHEN_PRODUCTS_KEY,
} from '../../services/kitchenService';
import type { Kitchen, KitchenAssignedProduct } from '../../types';
import { renderName } from '../../utils/helpers';
import {
  MdClose,
  MdCheckCircle,
  MdRestaurantMenu,
  MdSearch,
  MdCheck,
  MdClear,
  MdRefresh,
  MdLayers,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface KitchenProductsModalProps {
  kitchen: Kitchen | null;
  isOpen: boolean;
  onClose: () => void;
}

export const KitchenProductsModal: React.FC<KitchenProductsModalProps> = ({
  kitchen,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [selectedIdsOverride, setSelectedIdsOverride] = useState<Set<number> | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Fetch currently assigned products for this kitchen
  const {
    data: assignedProducts = [],
    isLoading: isLoadingAssigned,
    refetch: refetchAssigned,
  } = useQuery({
    queryKey: [KITCHEN_PRODUCTS_KEY, kitchen?.id],
    queryFn: () => (kitchen ? kitchenProductApi.getByKitchen(kitchen.id, 'ar') : Promise.resolve([])),
    enabled: Boolean(isOpen && kitchen?.id),
  });

  // 2. Fetch unassigned products
  const {
    data: unassignedProducts = [],
    isLoading: isLoadingUnassigned,
    refetch: refetchUnassigned,
  } = useQuery({
    queryKey: [UNASSIGNED_KITCHEN_PRODUCTS_KEY],
    queryFn: () => kitchenProductApi.getUnassigned('ar'),
    enabled: Boolean(isOpen && kitchen?.id),
  });

  // Derive initial selectedIds from assignedProducts without setState in effect
  const initialAssignedIds = useMemo(() => {
    return new Set<number>(assignedProducts.map((p: any) => p.id));
  }, [assignedProducts]);

  const selectedIds = selectedIdsOverride ?? initialAssignedIds;

  // Combine unique list of products relevant to this kitchen
  const allAvailableProducts = useMemo(() => {
    const map = new Map<number, KitchenAssignedProduct>();
    assignedProducts.forEach((p: any) => map.set(p.id, p));
    unassignedProducts.forEach((p: any) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    return Array.from(map.values());
  }, [assignedProducts, unassignedProducts]);

  // Filter products based on search and tab
  const filteredProducts = useMemo(() => {
    return allAvailableProducts.filter((product) => {
      const productName =
        product.name_ar ||
        product.name_en ||
        product.name ||
        (typeof product.name === 'object' ? renderName(product.name) : '') ||
        '';
      const matchesSearch =
        !search ||
        productName.toLowerCase().includes(search.toLowerCase()) ||
        String(product.id).includes(search);

      const isAssigned = selectedIds.has(product.id);

      if (!matchesSearch) return false;
      if (filterMode === 'assigned') return isAssigned;
      if (filterMode === 'unassigned') return !isAssigned;
      return true;
    });
  }, [allAvailableProducts, search, filterMode, selectedIds]);

  // Toggle single product
  const toggleProduct = (id: number) => {
    setSelectedIdsOverride(() => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select / Deselect all filtered
  const selectAllFiltered = () => {
    setSelectedIdsOverride(() => {
      const next = new Set(selectedIds);
      filteredProducts.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const deselectAllFiltered = () => {
    setSelectedIdsOverride(() => {
      const next = new Set(selectedIds);
      filteredProducts.forEach((p) => next.delete(p.id));
      return next;
    });
  };

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: () => {
      if (!kitchen) throw new Error('Kitchen not provided');
      return kitchenProductApi.assign(kitchen.id, Array.from(selectedIds));
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [KITCHEN_PRODUCTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNASSIGNED_KITCHEN_PRODUCTS_KEY] });
      setFeedback({
        type: 'success',
        message: res.message || 'تم تحديث المنتجات المربوطة بالمطبخ بنجاح.',
      });
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 1200);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'فشل حفظ المنتجات المربوطة بالمطبخ.',
      });
    },
  });

  if (!isOpen || !kitchen) return null;

  const isLoading = isLoadingAssigned || isLoadingUnassigned;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        dir="rtl"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* ── Modal Header ── */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <MdRestaurantMenu size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                  ربط وتوزيع المنتجات: {kitchen.name?.ar || 'المطبخ'}
                </h3>
                {kitchen.branch?.name && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                    {renderName(kitchen.branch.name)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                حدد قائمة المنتجات والوجبات التي يتم تحضيرها داخل هذا المطبخ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* ── Feedback Message ── */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            <MdCheckCircle size={16} />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* ── Filter & Search Toolbar ── */}
        <div className="px-6 pt-4 pb-2 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <MdSearch size={18} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو السعر..."
                className="w-full pr-10 pl-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs shrink-0">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                الكل ({allAvailableProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('assigned')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterMode === 'assigned'
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                المربوطة ({selectedIds.size})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('unassigned')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterMode === 'unassigned'
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                غير المعينة ({allAvailableProducts.length - selectedIds.size})
              </button>
            </div>
          </div>

          {/* Quick Selection Actions */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllFiltered}
                className="hover:text-primary transition-colors inline-flex items-center gap-1 font-medium"
              >
                <MdCheck size={14} /> تحديد المعروض
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={deselectAllFiltered}
                className="hover:text-rose-500 transition-colors inline-flex items-center gap-1 font-medium"
              >
                <MdClear size={14} /> إلغاء تحديد المعروض
              </button>
            </div>

            <span className="font-semibold text-slate-700 dark:text-slate-300">
              تم تحديد <strong className="text-primary">{selectedIds.size}</strong> منتج
            </span>
          </div>
        </div>

        {/* ── Product List Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <AiOutlineLoading3Quarters size={26} className="animate-spin text-primary" />
              <p className="text-xs">جاري تحميل قائمة المنتجات...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 text-center">
              <MdLayers size={36} className="opacity-40" />
              <p className="text-xs font-semibold">لا توجد منتجات مطابقة لخيارات البحث أو الفلتر</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isSelected = selectedIds.has(product.id);
              const displayName =
                product.name_ar ||
                product.name_en ||
                (typeof product.name === 'object' ? renderName(product.name) : product.name) ||
                `منتج #${product.id}`;

              return (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`
                    flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all select-none
                    ${
                      isSelected
                        ? 'bg-primary/5 dark:bg-primary/10 border border-primary/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProduct(product.id)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        معرف: #{product.id}
                      </p>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {product.price} ج.م
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              refetchAssigned();
              refetchUnassigned();
            }}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1"
          >
            <MdRefresh size={15} /> تحديث البيانات
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={assignMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => assignMutation.mutate()}
              disabled={assignMutation.isPending || isLoading}
              className="
                px-5 py-2.5 rounded-xl font-bold text-xs text-white
                btn-primary flex items-center gap-2 shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {assignMutation.isPending ? (
                <>
                  <AiOutlineLoading3Quarters size={15} className="animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>حفظ التعيين ({selectedIds.size})</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
