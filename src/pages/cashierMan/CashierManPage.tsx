import React from 'react';
import { MdPeople } from 'react-icons/md';

const CashierManPage: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <MdPeople size={22} className="text-primary" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">موظفي الكاشير</h1>
      </div>
      {/* TODO: API integration */}
    </div>
  );
};

export default CashierManPage;
