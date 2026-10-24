import React from 'react';
import type { PurchaseDueItem, SaleDueItem } from '../../types';
import { MdClose, MdReceiptLong, MdPayment, MdCalendarToday, MdPerson, MdStorefront, MdInfo } from 'react-icons/md';
import { renderName } from '../../utils/helpers';

interface DueDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  due: PurchaseDueItem | SaleDueItem | null;
  type: 'purchase' | 'sale';
  onPayClick?: (due: PurchaseDueItem | SaleDueItem) => void;
}

export const DueDetailsModal: React.FC<DueDetailsModalProps> = ({
  isOpen,
  onClose,
  due,
  type,
  onPayClick,
}) => {
  if (!isOpen || !due) return null;

  const isPurchase = type === 'purchase';
  const remaining = Number(due.remaining ?? Math.max(0, Number(due.amount) - Number(due.payment || 0)));
  const isPaid = due.status === 'paid' || remaining <= 0;
  const isOverdue = due.status === 'overdue';

  const partyName = isPurchase
    ? renderName((due as PurchaseDueItem)?.supplier?.name) || 'غير محدد'
    : renderName((due as SaleDueItem)?.saler?.name) || 'غير محدد';

  const partyPhone = isPurchase
    ? (due as PurchaseDueItem)?.supplier?.phone
    : (due as SaleDueItem)?.saler?.phone;

  const partyBalance = isPurchase
    ? (due as PurchaseDueItem)?.supplier?.balance
    : (due as SaleDueItem)?.saler?.balance;

  const invoice = isPurchase
    ? (due as PurchaseDueItem)?.purchase
    : (due as SaleDueItem)?.sale;

  const invoiceId = isPurchase
    ? (due as PurchaseDueItem)?.purchase_id
    : (due as SaleDueItem)?.sale_id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <MdReceiptLong size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  تفاصيل القسط #{due.id}
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : isOverdue
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {isPaid ? 'مسدد بالكامل' : isOverdue ? 'متأخر' : 'غير مدفوع بالكامل'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isPurchase ? 'قسط مديونية مشتريات' : 'قسط آجل لمبيعات عميل'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* Due Financial Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              المبالغ والاستحقاق
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="block text-xs text-slate-400 mb-1">المبلغ المطلوب</span>
                <span className="text-base font-extrabold text-slate-800 dark:text-white font-mono">
                  {Number(due.amount).toLocaleString('ar-EG')}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <span className="block text-xs text-emerald-600 dark:text-emerald-400 mb-1">المسدد حتى الآن</span>
                <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                  {Number(due.payment || 0).toLocaleString('ar-EG')}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <span className="block text-xs text-amber-600 dark:text-amber-400 mb-1">المتبقي</span>
                <span className="text-base font-extrabold text-amber-700 dark:text-amber-300 font-mono">
                  {remaining.toLocaleString('ar-EG')}
                </span>
              </div>
            </div>
          </div>

          {/* Due Date & Notes */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MdCalendarToday size={15} /> تاريخ استحقاق القسط:
              </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{due.date}</span>
            </div>
            {due.created_at && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">تاريخ الإنشاء:</span>
                <span className="text-slate-500 font-mono">
                  {new Date(due.created_at).toLocaleString('ar-EG')}
                </span>
              </div>
            )}
            {due.notes && (
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 text-xs">
                <span className="text-slate-400 block mb-1">ملاحظات وسجل السداد:</span>
                <p className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 leading-relaxed">
                  {due.notes}
                </p>
              </div>
            )}
          </div>

          {/* Party Details */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <MdPerson size={16} /> بيانات {isPurchase ? 'المورد' : 'العميل / المشتري'}
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">الاسم:</span>
                <span className="font-bold text-slate-800 dark:text-white">{partyName}</span>
              </div>
              {partyPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">رقم الهاتف:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                    {partyPhone}
                  </span>
                </div>
              )}
              {partyBalance !== undefined && (
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-400 text-xs">رصيد الحساب الإجمالي:</span>
                  <span className="font-mono font-bold text-primary">
                    {Number(partyBalance).toLocaleString('ar-EG')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          {invoice && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <MdStorefront size={16} /> بيانات فاتورة {isPurchase ? 'الشراء' : 'البيع'}
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">رقم الفاتورة:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    #{invoice.id || invoiceId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">إجمالي قيمة الفاتورة:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                    {Number(invoice.total_cost || 0).toLocaleString('ar-EG')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">المبلغ المدفوع من الفاتورة:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {Number(invoice.paid_amount || 0).toLocaleString('ar-EG')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">المبلغ المتبقي على الفاتورة:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {Number(invoice.remaining_amount || 0).toLocaleString('ar-EG')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            إغلاق
          </button>
          {!isPaid && remaining > 0 && onPayClick && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onPayClick(due);
              }}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:shadow-lg transition-all"
            >
              <MdPayment size={18} />
              <span>سداد القسط الآن ({remaining.toLocaleString('ar-EG')})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
