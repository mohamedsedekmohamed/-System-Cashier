import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salerApi, SALERS_KEY } from '../../services/salerService';
import type { SalerFormData } from '../../types';
import { MdArrowForward, MdSave, MdStorefront } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const SalerAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<SalerFormData>({
    name: '',
    phone: '',
    email: '',
    balance: 0,
  });

  const mutation = useMutation({
    mutationFn: salerApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALERS_KEY] });
      navigate('/dashboard/salers');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    mutation.mutate(formData);
  };

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/salers"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdStorefront size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">إضافة عميل / موزع جديد</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">إدخال بيانات الموزع وتفاصيل الاتصال والرصيد الافتتاحي</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
            البيانات الأساسية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم الموزع / العميل *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="مثال: شركة النيل للتوزيع"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                رقم الهاتف *
              </label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="01xxxxxxxxx"
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-primary text-left"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="info@example.com"
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-primary text-left"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الرصيد الافتتاحي (ج.م)
              </label>
              <input
                type="number"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-primary"
              />
              <span className="text-xs text-slate-400 mt-1 block">
                ملاحظة: الرصيد اللاحق سيتغير تلقائياً مع فواتير المبيعات الآجلة
              </span>
            </div>
          </div>
        </div>

        {mutation.isError && (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm">
            حدث خطأ أثناء الإضافة. يرجى مراجعة البيانات والمحاولة مرة أخرى.
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t flex justify-end gap-3 z-20 lg:pr-64">
          <Link
            to="/dashboard/salers"
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending || !formData.name || !formData.phone}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold shadow-lg disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <AiOutlineLoading3Quarters size={18} className="animate-spin" /> جاري الحفظ...
              </>
            ) : (
              <>
                <MdSave size={18} /> حفظ الموزع
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalerAdd;
