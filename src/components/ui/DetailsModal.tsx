import React from 'react';
import { MdClose } from 'react-icons/md';

const renderSafe = (val: any) => {
  if (val && typeof val === 'object' && !React.isValidElement(val)) {
    return val.ar || val.en || String(val);
  }
  return val;
};

export interface DetailItem {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  details: DetailItem[];
}

export const DetailsModal: React.FC<DetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  details,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {details.map((item, idx) => (
              <div 
                key={idx} 
                className={`bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-600 ${
                  item.fullWidth ? 'md:col-span-2' : ''
                }`}
              >
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                  {item.label}
                </span>
                <div className="text-slate-800 dark:text-slate-200 font-medium break-words">
                  {renderSafe(item.value) || <span className="text-slate-400 italic">غير متوفر</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
