import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wasteApi, WASTES_KEY } from '../../services/wasteService';
import type { WasteUpdateData } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { MdArrowForward, MdSave, MdEdit } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const WasteEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form State ─────────────────────────
  const [count, setCount] = useState<number>(1);

  // ── Fetch Data ─────────────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [WASTES_KEY, id],
    queryFn: () => wasteApi.get(id as string),
    enabled: !!id,
  });

  const waste = data?.data;

  // Populate form
  useEffect(() => {
    if (waste) {
      setCount(waste.count || 1);
    }
  }, [waste]);

  // ── Update Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: (payload: WasteUpdateData) => wasteApi.update(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WASTES_KEY] });
      navigate('/dashboard/wastes');
    },
  });

  // ── Handlers ───────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (count < 1) return;
    mutation.mutate({ count });
  };

  if (isLoading) return <LoadingSpinner text="جاري تحميل بيانات الهالك..." />;
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/wastes"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdEdit size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">تعديل كمية الهالك</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">تعديل سجل رقم #{waste?.id}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Info Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
            بيانات الهالك
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="block text-xs font-semibold text-slate-500 mb-1">الوصفة / المنتج</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{waste?.product_recipe?.name?.ar}</p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-500 mb-1">المادة المهدرة</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{waste?.material?.name?.ar}</p>
            </div>
          </div>

          <div className="md:w-1/2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">الكمية المهدرة (الجديدة) *</label>
            <input type="number" required min="1" value={count} onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <p className="text-xs text-slate-500 mt-2">لا يمكن تغيير الوصفة أو المادة المربوطة. يمكنك فقط تعديل الكمية. إذا أردت تغيير الوصفة أو المادة، يرجى حذف هذا السجل وإنشاء سجل جديد.</p>
          </div>
        </div>

        {/* Error message */}
        {mutation.isError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            حدث خطأ أثناء حفظ التعديلات. يرجى التأكد من صحة البيانات والمحاولة مرة أخرى.
          </div>
        )}

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 z-20 lg:pr-64">
          <Link to="/dashboard/wastes"
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
            إلغاء
          </Link>
          <button type="submit" disabled={mutation.isPending || count < 1}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {mutation.isPending ? (
              <><AiOutlineLoading3Quarters size={18} className="animate-spin" /> جاري الحفظ...</>
            ) : (
              <><MdSave size={18} /> حفظ التعديلات</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WasteEdit;
