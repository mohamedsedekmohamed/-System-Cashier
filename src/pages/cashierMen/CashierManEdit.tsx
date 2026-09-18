import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cashierManApi, CASHIER_MEN_KEY } from '../../services/cashierManService';
import type { CashierManFormData } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { MdArrowForward, MdSave, MdEdit } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const renderName = (name: any) => {
  if (typeof name === 'object' && name !== null) {
    return name.ar || name.en || '';
  }
  return name || '';
};

const CashierManEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<CashierManFormData>({
    name: '',
    password: '', // Optional for edit
    cashier_id: 0,
    branch_id: 0,
    shift_id: 0,
  });

  // ── Fetch Cashier Man Data ─────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [CASHIER_MEN_KEY, id],
    queryFn: () => cashierManApi.get(id as string),
    enabled: !!id,
  });

  const man = data?.data;
  const branches = data?.select_options?.branches ?? [];
  const cashiers = data?.select_options?.cashiers ?? [];
  const shifts = data?.select_options?.shifts ?? [];

  // Populate form when data arrives
  useEffect(() => {
    if (man) {
      setFormData({
        name: man.name,
        password: '', // leave empty unless they want to change
        cashier_id: man.cashier_id,
        branch_id: man.branch_id,
        shift_id: man.shift_id || 0,
      });
    }
  }, [man]);

  // ── Update Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: (payload: CashierManFormData) => cashierManApi.update(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASHIER_MEN_KEY] });
      navigate('/dashboard/cashier-men');
    },
  });

  // ── Handlers ───────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'cashier_id' || name === 'branch_id' || name === 'shift_id') ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cashier_id || !formData.branch_id || !formData.shift_id) return;
    
    // Only send password if it's provided
    const payload = { ...formData };
    if (!payload.password) {
      delete payload.password;
    }
    
    mutation.mutate(payload);
  };

  // ── Render States ──────────────────────
  if (isLoading) return <LoadingSpinner text="جاري تحميل بيانات الموظف..." />;
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/cashier-men"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdEdit size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">تعديل بيانات الموظف</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              تعديل بيانات {renderName(man?.name)}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الاسم <span className="text-red-500">*</span>
              </label>
              <input type="text" name="name" required
                value={typeof formData.name === 'object' && formData.name !== null ? ((formData.name as any)?.ar || (formData.name as any)?.en || '') : (formData.name || '')} onChange={handleChange}
                placeholder="اسم الموظف..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                كلمة المرور <span className="text-slate-400 font-normal text-xs">(اتركها فارغة إذا لم ترد التغيير)</span>
              </label>
              <input type="password" name="password"
                value={formData.password} onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الفرع <span className="text-red-500">*</span>
              </label>
              <select name="branch_id" required
                value={formData.branch_id || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="" disabled>-- اختر الفرع --</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>{renderName(branch.name)}</option>
                ))}
              </select>
            </div>

            {/* Cashier Machine */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                ماكينة الكاشير <span className="text-red-500">*</span>
              </label>
              <select name="cashier_id" required
                value={formData.cashier_id || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="" disabled>-- اختر ماكينة الكاشير --</option>
                {cashiers.map((c: any) => (
                  <option key={c.id} value={c.id}>{renderName(c.name)}</option>
                ))}
              </select>
            </div>

            {/* Shift */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الوردية <span className="text-red-500">*</span>
              </label>
              <select name="shift_id" required
                value={formData.shift_id || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="" disabled>-- اختر الوردية --</option>
                {shifts.map((s: any) => (
                  <option key={s.id} value={s.id}>{renderName(s.name)} - {s.start_time} إلى {s.end_time}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error message */}
        {mutation.isError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            حدث خطأ أثناء تحديث بيانات الموظف. يرجى المحاولة مرة أخرى.
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
          <Link to="/dashboard/cashier-men"
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
            إلغاء
          </Link>
          <button type="submit" disabled={mutation.isPending || !formData.name || !formData.cashier_id || !formData.branch_id || !formData.shift_id}
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

export default CashierManEdit;
