import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deliveryApi, DELIVERIES_KEY, DELIVERIES_SELECT_OPTIONS_KEY } from '../../services/deliveryService';
import type { DeliveryFormData } from '../../types';
import ImageUploadPreview from '../../components/ui/ImageUploadPreview';
import { renderName } from '../../utils/helpers';
import { MdArrowForward, MdSave, MdDeliveryDining } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const DeliveryAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<DeliveryFormData>({
    name: '',
    phone: '',
    branch_id: 0,
    id_images: [],
  });

  // ── Fetch Select Options ───────────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [DELIVERIES_SELECT_OPTIONS_KEY],
    queryFn: deliveryApi.getSelectOptions,
  });

  const branches = optionsData?.data?.branches ?? [];

  // ── Create Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: deliveryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DELIVERIES_KEY] });
      navigate('/dashboard/deliveries');
    },
  });

  // ── Handlers ───────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalVal: any = value;
    if (name === 'branch_id') finalVal = Number(value);
    if (name === 'phone') finalVal = value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      [name]: finalVal,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.branch_id) return;
    mutation.mutate(formData);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/deliveries"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdDeliveryDining size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">إضافة طيار جديد</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">أدخل بيانات الطيار وارفع صور الهوية والرخصة</p>
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
                value={renderName(formData.name)} onChange={handleChange}
                placeholder="اسم الطيار..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel" 
                inputMode="numeric"
                pattern="[0-9]*"
                name="phone" 
                required
                value={formData.phone} 
                onChange={handleChange}
                placeholder="01xxxxxxxxx"
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-left"
              />
            </div>

            {/* Branch */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الفرع <span className="text-red-500">*</span>
              </label>
              <select name="branch_id" required
                value={formData.branch_id || ''} onChange={handleChange}
                disabled={isLoadingOptions}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50">
                <option value="" disabled>-- اختر الفرع --</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{renderName(branch.name)}</option>
                ))}
              </select>
            </div>

            {/* Images Upload with Live Preview */}
            <div className="md:col-span-2">
              <ImageUploadPreview
                files={formData.id_images ?? []}
                onChange={(files) => setFormData(prev => ({ ...prev, id_images: files }))}
                label="صور الهوية / الرخصة"
                hint="اضغط لاختيار الصور أو اسحبها هنا (JPG, PNG, WEBP)"
                disabled={mutation.isPending}
              />
            </div>
          </div>
        </div>

        {/* Error message */}
        {mutation.isError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            حدث خطأ أثناء إضافة الطيار. تأكد من صحة البيانات وحاول مرة أخرى.
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
          <Link to="/dashboard/deliveries"
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
            إلغاء
          </Link>
          <button type="submit" disabled={mutation.isPending || !formData.name || !formData.phone || !formData.branch_id}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {mutation.isPending ? (
              <><AiOutlineLoading3Quarters size={18} className="animate-spin" /> جاري الحفظ...</>
            ) : (
              <><MdSave size={18} /> حفظ الطيار</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeliveryAdd;
