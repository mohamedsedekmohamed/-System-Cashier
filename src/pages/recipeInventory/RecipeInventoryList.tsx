import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  recipeInventoryApi,
  RECIPE_INVENTORY_PENDING_KEY,
  RECIPE_INVENTORY_HISTORY_KEY,
  RECIPE_INVENTORY_OPTIONS_KEY,
} from '../../services/recipeInventoryService';
import type { RecipeInventoryListItem, BranchOption } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import {
  MdFactCheck,
  MdAdd,
  MdHistory,
  MdPendingActions,
  MdStorefront,
  MdArrowForward,
  MdCalendarToday,
  MdCheckCircle,
  MdCancel,
  MdClose,
  MdSearch,
  MdRefresh,
  MdVisibility,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { renderName } from '../../utils/helpers';

const RecipeInventoryList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating a new inventory
  const [createForm, setCreateForm] = useState({
    name: '',
    branch_id: 0,
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const perPage = 15;

  // ── Fetch Pending Audits ──────────────────
  const {
    data: pendingData,
    isLoading: isLoadingPending,
    isError: isErrorPending,
    error: errorPending,
    refetch: refetchPending,
  } = useQuery({
    queryKey: [RECIPE_INVENTORY_PENDING_KEY, page, perPage],
    queryFn: () => recipeInventoryApi.getPending(page, perPage),
    enabled: activeTab === 'pending',
    placeholderData: (prev) => prev,
  });

  // ── Fetch History Audits ──────────────────
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    error: errorHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: [RECIPE_INVENTORY_HISTORY_KEY, page, perPage],
    queryFn: () => recipeInventoryApi.getHistory(page, perPage),
    enabled: activeTab === 'history',
    placeholderData: (prev) => prev,
  });

  // ── Fetch Select Options (Branches) ────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [RECIPE_INVENTORY_OPTIONS_KEY],
    queryFn: recipeInventoryApi.getSelectOptions,
  });

  const branches: BranchOption[] = optionsData?.data?.branches ?? [];

  // ── Create Mutation ────────────────────────
  const createMutation = useMutation({
    mutationFn: recipeInventoryApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [RECIPE_INVENTORY_PENDING_KEY] });
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', branch_id: 0 });
      setCreateError(null);

      // If backend returned created inventory ID, navigate directly into counting view
      const newId = res?.data?.id || res?.id;
      if (newId) {
        navigate(`/dashboard/recipe-inventory/${newId}`);
      } else {
        refetchPending();
      }
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'تعذر إنشاء جلسة جرد الوصفات، يرجى مراجعة البيانات والمحاولة مرة أخرى.';
      setCreateError(msg);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!createForm.name.trim()) {
      setCreateError('يرجى إدخال اسم أو عنوان عملية الجرد');
      return;
    }
    if (!createForm.branch_id) {
      setCreateError('يرجى اختيار الفرع المراد جرد وصفاته');
      return;
    }

    createMutation.mutate({
      name: createForm.name.trim(),
      branch_id: Number(createForm.branch_id),
    });
  };

  // Branch options for SearchableSelect
  const branchOptions = branches.map((b) => ({
    id: b.id,
    name: renderName(b.name) || `فرع #${b.id}`,
  }));

  const activeData = activeTab === 'pending' ? pendingData : historyData;
  const rawList: RecipeInventoryListItem[] = activeData?.data ?? [];
  const meta = activeData?.meta;
  const isLoading = activeTab === 'pending' ? isLoadingPending : isLoadingHistory;
  const isError = activeTab === 'pending' ? isErrorPending : isErrorHistory;
  const currentError = activeTab === 'pending' ? errorPending : errorHistory;
  const refetchCurrent = activeTab === 'pending' ? refetchPending : refetchHistory;

  // Client search filter
  const filteredList = rawList.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name?.toLowerCase().includes(q) ||
      item.branch_name?.toLowerCase().includes(q) ||
      String(item.id).includes(q) ||
      String(item.branch_id).includes(q) ||
      item.date?.includes(q)
    );
  });

  // Status renderer badge
  const renderStatus = (status: string) => {
    const s = (status || '').toLowerCase();
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

  // Table Columns
  const columns: ColumnDef<RecipeInventoryListItem>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-700 text-primary px-2.5 py-1 rounded-lg">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'جلسة جرد الوصفات',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-white text-sm hover:text-primary transition-colors">
            {renderName(row.name) || <span className="text-slate-400 italic">بدون عنوان</span>}
          </p>
          <span className="text-xs text-slate-400 font-mono mt-0.5 block">
            كود الجرد: #{row.id}
          </span>
        </div>
      ),
    },
    {
      header: 'الفرع المستهدف',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <MdStorefront size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm block">
              {renderName(row.branch_name || (row as any).branch?.name || (row as any).branch) || `فرع #${row.branch_id}`}
            </span>
            <span className="text-[11px] text-slate-400">معرف الفرع: #{row.branch_id}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'تاريخ الإنشاء',
      render: (row) => (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <MdCalendarToday size={14} className="text-slate-400" />
          <span>{renderName(row.date) || renderName(row.created_at) || '—'}</span>
        </div>
      ),
    },
    {
      header: 'الحالة',
      render: (row) => renderStatus(row.status),
    },
    {
      header: 'الإجراء',
      render: (row) => {
        const isPending =
          activeTab === 'pending' ||
          row.status === 'pending' ||
          !row.status ||
          row.status === 'قيد الجرد والمراجعة';

        return (
          <Link
            to={`/dashboard/recipe-inventory/${row.id}`}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
              isPending
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50'
            }`}
          >
            {isPending ? (
              <>
                <span>متابعة الجرد</span>
                <MdArrowForward size={14} />
              </>
            ) : (
              <>
                <MdVisibility size={14} />
                <span>عرض التفاصيل</span>
              </>
            )}
          </Link>
        );
      },
    },
  ];

  if (isError) {
    return <ErrorFallback error={currentError as Error} onRetry={() => refetchCurrent()} />;
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-primary mb-1">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <MdFactCheck size={26} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              جرد وصفات التصنيع (Recipe Inventory)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            حصر وتدقيق أرصدة الوصفات الجاهزة وتجهيزات المطبخ ومقارنة الرصيد الدفتري بالفعلي
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetchCurrent()}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="تحديث البيانات"
          >
            <MdRefresh size={18} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
          >
            <MdAdd size={20} />
            <span>بدء جرد جديد للوصفات</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <MdPendingActions size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">جلسات جرد قيد المراجعة</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">
              {pendingData?.meta?.total ?? (activeTab === 'pending' ? rawList.length : '—')}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MdHistory size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">سجل الجرد المعتمد والمنتهي</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">
              {historyData?.meta?.total ?? (activeTab === 'history' ? rawList.length : '—')}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <MdStorefront size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">الفروع المتاحة</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">
              {branches.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('pending');
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'pending'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <MdPendingActions size={18} />
              <span>الجرد الجاري (قيد المراجعة)</span>
              {pendingData?.meta?.total !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeTab === 'pending'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pendingData.meta.total}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'history'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <MdHistory size={18} />
              <span>سجل الجرد المعتمد والمنتهي</span>
              {historyData?.meta?.total !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeTab === 'history'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {historyData.meta.total}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <MdSearch
            size={18}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بعنوان جلسة الجرد، اسم الفرع، الكود..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredList}
        columns={columns}
        isLoading={isLoading}
        meta={meta}
        onPageChange={setPage}
        emptyIcon={<MdFactCheck size={48} className="text-slate-300 dark:text-slate-600" />}
        emptyMessage={
          activeTab === 'pending'
            ? 'لا توجد جلسات جرد وصفات قيد المراجعة حالياً. يمكنك بدء جرد جديد بالضغط على الزر أعلاه.'
            : 'لا توجد جلسات جرد سابقة مسجلة في الأرشيف.'
        }
      />

      {/* Create Inventory Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-primary font-bold">
                <MdAdd size={22} />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  بدء جلسة جرد وصفات جديدة
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateError(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <MdClose size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              {createError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  عنوان أو اسم جلسة الجرد <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: جرد وصفات المطبخ - نهاية الأسبوع"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  الفرع المستهدف <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  value={createForm.branch_id || null}
                  onChange={(val) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      branch_id: val ? Number(val) : 0,
                    }))
                  }
                  options={branchOptions}
                  placeholder={isLoadingOptions ? 'جاري تحميل الفروع...' : 'اختر الفرع المراد جرده...'}
                  searchPlaceholder="ابحث في الفروع..."
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  سيتم جلب جميع الوصفات والمنتجات شبه المصنعة المسجلة بالفرع للبدء في حصرها
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateError(null);
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                >
                  {createMutation.isPending ? (
                    <>
                      <AiOutlineLoading3Quarters size={16} className="animate-spin" />
                      <span>جاري الإنشاء...</span>
                    </>
                  ) : (
                    <>
                      <MdAdd size={18} />
                      <span>بدء الجرد الآن</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeInventoryList;
