import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseDuesApi, saleDuesApi, PURCHASE_DUES_KEY, SALE_DUES_KEY } from '../../services/duesService';
import { PURCHASES_KEY } from '../../services/purchaseService';
import { SALES_KEY } from '../../services/saleService';
import { SUPPLIERS_KEY } from '../../services/supplierService';
import { SALERS_KEY } from '../../services/salerService';
import type { PurchaseDueItem, SaleDueItem } from '../../types';
import { MdClose, MdPayment, MdCheckCircle, MdErrorOutline, MdInfoOutline } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { renderName } from '../../utils/helpers';

interface PayDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  due: PurchaseDueItem | SaleDueItem | null;
  type: 'purchase' | 'sale';
  onSuccess?: () => void;
}

export const PayDueModal: React.FC<PayDueModalProps> = ({
  isOpen,
  onClose,
  due,
  type,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const remaining = due ? Number(due.remaining ?? Math.max(0, Number(due.amount) - Number(due.payment || 0))) : 0;
  const isPurchase = type === 'purchase';
  const partyName = isPurchase
    ? renderName((due as PurchaseDueItem)?.supplier?.name) || 'المورد'
    : renderName((due as SaleDueItem)?.saler?.name) || 'العميل';
  const invoiceId = isPurchase
    ? (due as PurchaseDueItem)?.purchase_id
    : (due as SaleDueItem)?.sale_id;

  // Reset form when due changes
  useEffect(() => {
    if (due) {
      setPaymentAmount(remaining > 0 ? String(remaining) : '');
      setNotes('');
      setErrorMsg(null);
    }
  }, [due, remaining, isOpen]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!due) throw new Error('لا يوجد قسط محدد');
      const amountNum = Number(paymentAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('يرجى إدخال مبلغ سداد صحيح أكبر من 0');
      }
      if (amountNum > remaining) {
        throw new Error(`المبلغ المدخل (${amountNum}) أكبر من المبلغ المتبقي (${remaining})`);
      }

      const payload = {
        payment: amountNum,
        notes: notes.trim() || undefined,
      };

      if (isPurchase) {
        return await purchaseDuesApi.pay(due.id, payload);
      } else {
        return await saleDuesApi.pay(due.id, payload);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [PURCHASE_DUES_KEY] });
      queryClient.invalidateQueries({ queryKey: [SALE_DUES_KEY] });
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [SALES_KEY] });
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [SALERS_KEY] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'حدث خطأ أثناء تسجيل السداد. يرجى المحاولة مرة أخرى.';
      setErrorMsg(msg);
    },
  });

  if (!isOpen || !due) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const amountNum = Number(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      setErrorMsg('يرجى تحديد مبلغ السداد');
      return;
    }
    if (amountNum > remaining) {
      setErrorMsg(`المبلغ المطلوب سداده لا يمكن أن يتجاوز المتبقي (${remaining})`);
      return;
    }
    mutation.mutate();
  };

  const handlePayFullRemaining = () => {
    setPaymentAmount(String(remaining));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <MdPayment size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {isPurchase ? 'سداد قسط مشتريات (مورد)' : 'سداد قسط مبيعات (عميل)'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                القسط #{due.id} | فاتورة {isPurchase ? 'الشراء' : 'البيع'} #{invoiceId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Due Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {isPurchase ? 'المورد:' : 'العميل / المشتري:'}
              </span>
              <span className="font-bold text-slate-800 dark:text-white">{partyName}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700/50">
                <span className="block text-[11px] text-slate-400">إجمالي القسط</span>
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                  {Number(due.amount).toLocaleString('ar-EG')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700/50">
                <span className="block text-[11px] text-slate-400">المدفوع سابقاً</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {Number(due.payment || 0).toLocaleString('ar-EG')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-amber-200/50 dark:border-amber-800/40 bg-amber-50/20 dark:bg-amber-950/20">
                <span className="block text-[11px] text-amber-600 dark:text-amber-400 font-medium">المتبقي</span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-700 dark:text-amber-300">
                  {remaining.toLocaleString('ar-EG')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
              <span>تاريخ الاستحقاق:</span>
              <span className="font-mono">{due.date}</span>
            </div>
          </div>

          {/* Payment Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                المبلغ المراد سداده الآن <span className="text-rose-500">*</span>
              </label>
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={handlePayFullRemaining}
                  className="text-xs font-semibold text-primary hover:underline hover:text-primary/80 transition-colors"
                >
                  سداد كامل المتبقي ({remaining.toLocaleString('ar-EG')})
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remaining}
                required
                value={paymentAmount}
                onChange={(e) => {
                  setPaymentAmount(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-left"
                dir="ltr"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              الحد الأدنى 0.01، والحد الأقصى هو المتبقي على القسط ({remaining.toLocaleString('ar-EG')}).
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ملاحظات السداد (اختياري)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: سداد نقدي من الخزينة، تحويل بنكي رقم #12345..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Financial Impact Note */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 text-xs flex items-start gap-2.5">
            <MdInfoOutline size={18} className="shrink-0 mt-0.5 text-blue-500" />
            <div className="space-y-0.5">
              <p className="font-semibold">الأثر المالي التلقائي للعملية:</p>
              <p className="text-[11px] leading-relaxed opacity-90">
                {isPurchase
                  ? 'سيتم خصم قيمة السداد تلقائياً من رصيد مديونية المورد، وزيادة المبلغ المدفوع في فاتورة الشراء وتخفيض متبقي الفاتورة.'
                  : 'سيتم خصم قيمة السداد تلقائياً من رصيد مديونية العميل، وتحديث إجمالي المدفوع والمتبقي على فاتورة البيع.'}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <MdErrorOutline size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !paymentAmount || Number(paymentAmount) <= 0 || remaining <= 0}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <>
                  <AiOutlineLoading3Quarters size={18} className="animate-spin" />
                  <span>جاري تسجيل السداد...</span>
                </>
              ) : (
                <>
                  <MdCheckCircle size={18} />
                  <span>تأكيد السداد</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
