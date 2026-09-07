import React from 'react';
import { MdReceiptLong } from 'react-icons/md';

const ExpenseListPage: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <MdReceiptLong size={22} className="text-primary" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">قائمة المصروفات</h1>
      </div>
      {/* TODO: API integration */}
    </div>
  );
};

export default ExpenseListPage;
