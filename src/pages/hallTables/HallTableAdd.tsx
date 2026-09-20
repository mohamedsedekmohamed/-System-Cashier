import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hallTableApi, HALL_TABLES_KEY, HALL_TABLES_SELECT_OPTIONS_KEY } from '../../services/hallTableService';
import type { HallTablePayload } from '../../types';
import { MdArrowForward, MdSave, MdTableRestaurant } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { renderName } from '../../utils/helpers';

const HallTableAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<HallTablePayload>({
    name: '',
    branch_id: 0,
    hall_id: 0,
    status: true,
    base_url: '',
  });

  // ── Fetch Select Options ───────────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [HALL_TABLES_SELECT_OPTIONS_KEY],
    queryFn: hallTableApi.getSelectOptions,
  });

  const branches = optionsData?.data?.branches ?? [];
  const halls = optionsData?.data?.halls ?? [];

  // Filter halls based on chosen branch
  const filteredHalls = useMemo(() => {
    if (!formData.branch_id) return [];
    const hallsHaveBranchId = halls.some((h: any) => h.branch_id !== undefined && h.branch_id !== null);
    if (!hallsHaveBranchId) return halls;
    return halls.filter(hall => Number(hall.branch_id) === Number(formData.branch_id));
  }, [halls, formData.branch_id]);

  // ── Create Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: hallTableApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HALL_TABLES_KEY] });
      navigate('/dashboard/hall-tables');
    },
  });

  // ── Handlers ───────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'branch_id') {
      const selectedBranchId = Number(value);
      setFormData(prev => ({
        ...prev,
        branch_id: selectedBranchId,
        hall_id: 0, // Reset selected hall when branch changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: (name === 'branch_id' || name === 'hall_id') ? Number(value) : value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.branch_id || !formData.hall_id || !formData.base_url?.trim()) return;
    mutation.mutate({
      ...formData,
      base_url: formData.base_url.trim(),
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/hall-tables"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdTableRestaurant size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">إضافة طاولة جديدة</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">أدخل بيانات الطاولة والفرع والصالة التابعة لها</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Table Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم الطاولة <span className="text-red-500">*</span>
              </label>
              <input type="text" name="name" required
                value={typeof formData.name === 'object' && formData.name !== null ? ((formData.name as any)?.ar || (formData.name as any)?.en || '') : (formData.name || '')} onChange={handleChange}
                placeholder="مثال: طاولة رقم 1"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Base URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الرابط الأساسي (Base URL) <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="base_url" 
                required
                maxLength={255}
                value={formData.base_url} 
                onChange={handleChange}
                placeholder="https://ecommerce.mazoom.online"
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-left"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                الرابط الأساسي المعتمد لإنشاء رمز الـ QR وتوجيه العملاء لقائمة الطلبات (أقل من أو يساوي 255 حرف)
              </p>
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الفرع <span className="text-red-500">*</span>
              </label>
              <select name="branch_id" required
                value={formData.branch_id || ''} onChange={handleChange}
                disabled={isLoadingOptions}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50">
                <option value="" disabled>-- اختر الفرع --</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {renderName(branch.name) || `فرع #${branch.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Hall */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الصالة <span className="text-red-500">*</span>
              </label>
              <select name="hall_id" required
                value={formData.hall_id || ''} onChange={handleChange}
                disabled={isLoadingOptions || !formData.branch_id || filteredHalls.length === 0}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50">
                <option value="" disabled>
                  {!formData.branch_id 
                    ? '-- اختر الفرع أولاً --' 
                    : filteredHalls.length === 0 
                      ? '-- لا توجد صالات لهذا الفرع --' 
                      : '-- اختر الصالة --'}
                </option>
                {filteredHalls.map(hall => (
                  <option key={hall.id} value={hall.id}>
                    {renderName(hall.name) || `صالة #${hall.id}`}
                  </option>
                ))}
              </select>
              {!formData.branch_id && (
                <p className="text-xs text-slate-400 mt-1.5">اختر الفرع أولاً لتحديد الصالات المتاحة</p>
              )}
              {formData.branch_id > 0 && filteredHalls.length === 0 && (
                <p className="text-xs text-amber-500 dark:text-amber-400 mt-1.5">لا توجد صالات تابعة لهذا الفرع حالياً</p>
              )}
            </div>

            {/* Status */}
            <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer group w-max">
                <div className="relative">
                  <input type="checkbox" name="status" className="sr-only"
                    checked={formData.status} onChange={handleChange} />
                  <div className={`block w-12 h-6 rounded-full transition-colors ${formData.status ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                  <div className={`absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.status ? '-translate-x-6' : 'translate-x-0'}`}></div>
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-white">حالة الطاولة</span>
                  <span className="text-xs text-slate-500">{formData.status ? 'مفعلة (متاحة للحجز)' : 'غير مفعلة'}</span>
                </div>
              </label>
            </div>

          </div>
        </div>

        {/* Error message */}
        {mutation.isError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {(mutation.error as any)?.response?.data?.message || 'حدث خطأ أثناء الإضافة. تأكد من صحة البيانات وحاول مرة أخرى.'}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
          <Link to="/dashboard/hall-tables"
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
            إلغاء
          </Link>
          <button type="submit" disabled={mutation.isPending || !formData.name || !formData.branch_id || !formData.hall_id || !formData.base_url?.trim()}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {mutation.isPending ? (
              <><AiOutlineLoading3Quarters size={18} className="animate-spin" /> جاري الحفظ...</>
            ) : (
              <><MdSave size={18} /> حفظ الطاولة</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HallTableAdd;
