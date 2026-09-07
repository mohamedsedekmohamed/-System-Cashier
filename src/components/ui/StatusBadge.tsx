import React from 'react';

interface StatusBadgeProps {
  active: boolean;
  activeText?: string;
  inactiveText?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  active, 
  activeText = 'مفعل', 
  inactiveText = 'غير مفعل' 
}) => {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
      ${active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
               : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
      {active ? activeText : inactiveText}
    </span>
  );
};
