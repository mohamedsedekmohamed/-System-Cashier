import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salerApi, SALERS_KEY } from '../../services/salerService';
import type { SalerFormData } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { MdArrowForward, MdSave, MdEdit } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const SalerEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<SalerFormData>({
    name: '',
    phone: '',
    email: '',
    balance: 0,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [SALERS_KEY, id],
    queryFn: () => salerApi.get(id as string),
    enabled: !!id,
  });

  const saler = data?.data;

  useEffect(() => {
    if (saler) {
      setFormData({
        name: typeof saler.name === 'object' && saler.name !== null
          ? (saler.name as any)?.ar || (saler.name as any)?.en || ''
          : saler.name || '',
        phone: saler.phone || '',
        email: saler.email || '',
        balance: saler.balance || 0,
      });
    }
  }, [saler]);

  const mutation = useMutation({
    mutationFn: (payload: SalerFormData) => salerApi.update(id as string, payload),
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

  if (isLoading) return <LoadingSpinner text="جاري تحميل بيانات الموزع..." />;
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="w-full space-y-6 pb-24">
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
              <MdEdit size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">تعديل بيانات الموزع / العميل</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">تعديل بيانات {saler?.name}</p>
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
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-primary text-left"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                رصيد المديونية الحالي
              </label>
              <input
                type="number"
                disabled
                value={formData.balance}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-bold"
              />
              <span className="text-xs text-amber-600 dark:text-amber-400 mt-1 block">
                تنبيه: الرصيد غير قابل للتعديل اليدوي، ويتحدث آلياً من خلال فواتير المبيعات
              </span>
            </div>
          </div>
        </div>

        {mutation.isError && (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm">
            حدث خطأ أثناء حفظ التعديلات. يرجى المحاولة مرة أخرى.
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
                <MdSave size={18} /> حفظ التعديلات
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalerEdit;
