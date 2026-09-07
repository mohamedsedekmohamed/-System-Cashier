import React from 'react';
import { MdAccountBalance } from 'react-icons/md';

const FinancialAccountPage: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <MdAccountBalance size={22} className="text-primary" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">الحسابات المالية</h1>
      </div>
      {/* TODO: API integration */}
    </div>
  );
};

export default FinancialAccountPage;
