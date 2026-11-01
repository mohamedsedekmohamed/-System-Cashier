import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unitApi, UNITS_KEY, ALL_UNITS_KEY } from '../../services/unitService';
import type { Unit, UnitFormData } from '../../types';
import { MdClose, MdSave, MdStraighten } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null; // null => Create, non-null => Edit
}

export const UnitModal: React.FC<UnitModalProps> = ({ isOpen, onClose, unit }) => {
  const queryClient = useQueryClient();
  const isEdit = !!unit;

  const [formData, setFormData] = useState<UnitFormData>({
    name: { ar: '', en: '' },
    value: 1,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (unit) {
      const arName = typeof unit.name === 'object' ? unit.name.ar || '' : unit.name || '';
      const enName = typeof unit.name === 'object' ? unit.name.en || '' : '';
      setFormData({
        name: { ar: arName, en: enName },
        value: Number(unit.value) || 1,
      });
    } else {
      setFormData({
        name: { ar: '', en: '' },
        value: 1,
      });
    }
    setErrorMsg(null);
  }, [unit, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: UnitFormData) => {
      if (isEdit && unit) {
        return await unitApi.update(unit.id, data);
      }
      return await unitApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNITS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ALL_UNITS_KEY] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'حدث خطأ أثناء حفظ وحدة القياس';
      setErrorMsg(msg);
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const nameAr = typeof formData.name === 'object' ? formData.name.ar?.trim() : '';
    if (!nameAr) {
      setErrorMsg('يرجى إدخال اسم الوحدة باللغة العربية');
      return;
    }

    if (formData.value <= 0) {
      setErrorMsg('قيمة التحويل يجب أن تكون أكبر من 0');
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <MdStraighten size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                {isEdit ? 'تعديل وحدة قياس' : 'إضافة وحدة قياس جديدة'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEdit ? 'تعديل بيانات ومعامل تحويل الوحدة' : 'إضافة وحدة ومعامل التحويل الرياضي للمخزون'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
              {errorMsg}
            </div>
          )}

          {/* Name AR */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              اسم الوحدة (بالعربية) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={typeof formData.name === 'object' ? formData.name.ar : ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: {
                    ...(typeof prev.name === 'object' ? prev.name : { en: '' }),
                    ar: e.target.value,
                  },
                }))
              }
              placeholder="مثال: كرتونة، كيلوجرام، قطعة"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Name EN */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              اسم الوحدة (بالإنجليزية)
            </label>
            <input
              type="text"
              dir="ltr"
              value={typeof formData.name === 'object' ? formData.name.en : ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: {
                    ...(typeof prev.name === 'object' ? prev.name : { ar: '' }),
                    en: e.target.value,
                  },
                }))
              }
              placeholder="e.g. Box, Kilogram, Piece"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 text-left"
            />
          </div>

          {/* Value (Multiplier) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                قيمة التحويل (Value) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                نسبة إلى الوحدة الأساسية
              </span>
            </div>
            <input
              type="number"
              step="any"
              min="0.0001"
              required
              value={formData.value}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  value: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="1"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono text-left"
              dir="ltr"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              * مثال: الجرام = 1، الكيلو = 1000، كرتونة 12 قطعة = 12، القطعة = 1.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <AiOutlineLoading3Quarters size={14} className="animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <MdSave size={16} />
                  <span>{isEdit ? 'تحديث الوحدة' : 'إضافة الوحدة'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default UnitModal;

