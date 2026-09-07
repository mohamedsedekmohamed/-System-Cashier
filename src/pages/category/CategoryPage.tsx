import React from 'react';
import { MdCategory } from 'react-icons/md';

const CategoryPage: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <MdCategory size={22} className="text-primary" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">الأقسام</h1>
      </div>
      {/* TODO: API integration */}
    </div>
  );
};

export default CategoryPage;
