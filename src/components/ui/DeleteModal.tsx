import React from 'react';
import { MdDelete } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface DeleteModalProps {
  isOpen: boolean;
  itemName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  descriptionPrefix?: string;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  itemName,
  isDeleting,
  onConfirm,
  onCancel,
  title = 'تأكيد الحذف',
  descriptionPrefix = 'هل أنت متأكد من حذف',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <MdDelete size={28} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {descriptionPrefix}{' '}
            <strong className="text-slate-700 dark:text-slate-200">{itemName}</strong>؟
            <br />لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="flex gap-3 w-full">
            <button onClick={onCancel} disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm disabled:opacity-50">
              إلغاء
            </button>
            <button onClick={onConfirm} disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {isDeleting ? (
                <><AiOutlineLoading3Quarters size={16} className="animate-spin" /> جاري الحذف...</>
              ) : (
                'حذف'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
