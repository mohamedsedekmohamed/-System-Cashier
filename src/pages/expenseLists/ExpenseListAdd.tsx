import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseListApi, EXPENSE_LISTS_KEY } from '../../services/expenseListService';
import type { ExpenseListPayload } from '../../types';
import { MdArrowForward, MdSave, MdReceipt } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const ExpenseListAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<ExpenseListPayload>({
    name: {
      ar: '',
      en: '',
    },
    description: {
      ar: '',
      en: '',
    }
  });

  // ── Create Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: expenseListApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSE_LISTS_KEY] });
      navigate('/expense-lists');
    },
  });

  // ── Handlers ───────────────────────────
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, lang: 'ar' | 'en') => {
    setFormData(prev => ({
      ...prev,
      name: { ...prev.name, [lang]: e.target.value },
    }));
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>, lang: 'ar' | 'en') => {
    setFormData(prev => ({
      ...prev,
      description: { ...prev.description, [lang]: e.target.value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.ar || !formData.name.en) return;
    
    // Ensure description null if empty to match schema (optional, but good practice)
    const payload = {
      name: formData.name,
      description: {
        ar: formData.description.ar || null,
        en: formData.description.en || null,
      }
    };

    mutation.mutate(payload);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/expense-lists"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdReceipt size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">إضافة قائمة مصروفات</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">أدخل الاسم والوصف باللغتين العربية والإنجليزية</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Arabic Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الاسم (بالعربية) <span className="text-red-500">*</span>
              </label>
              <input type="text" required maxLength={255}
                value={formData.name.ar} onChange={(e) => handleNameChange(e, 'ar')}
                placeholder="مثال: مصاريف التشغيل..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* English Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الاسم (بالانجليزية) <span className="text-red-500">*</span>
              </label>
              <input type="text" required maxLength={255} dir="ltr"
                value={formData.name.en} onChange={(e) => handleNameChange(e, 'en')}
                placeholder="e.g., Operating Expenses..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-left"
              />
            </div>

            {/* Arabic Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الوصف (بالعربية) <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
              </label>
              <textarea rows={3}
                value={formData.description.ar || ''} onChange={(e) => handleDescChange(e, 'ar')}
                placeholder="أدخل وصفاً لقائمة المصروفات..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
              />
            </div>

            {/* English Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الوصف (بالانجليزية) <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
              </label>
              <textarea rows={3} dir="ltr"
                value={formData.description.en || ''} onChange={(e) => handleDescChange(e, 'en')}
                placeholder="Enter description..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none text-left"
              />
            </div>

          </div>
        </div>

        {/* Error message */}
        {mutation.isError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            حدث خطأ أثناء الإضافة. تأكد من صحة البيانات وحاول مرة أخرى.
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
          <Link to="/expense-lists"
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
            إلغاء
          </Link>
          <button type="submit" disabled={mutation.isPending || !formData.name.ar || !formData.name.en}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {mutation.isPending ? (
              <><AiOutlineLoading3Quarters size={18} className="animate-spin" /> جاري الحفظ...</>
            ) : (
              <><MdSave size={18} /> حفظ القائمة</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseListAdd;
