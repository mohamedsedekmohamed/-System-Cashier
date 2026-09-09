import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { branchApi, BRANCHES_KEY } from '../services/branchService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorFallback from '../components/ui/ErrorFallback';
import {
  MdStorefront,
  MdPointOfSale,
  MdPeople,
  MdCategory,
  MdArrowBack,
} from 'react-icons/md';

const STAT_ICONS = [
  { label: 'إجمالي الفروع', icon: <MdStorefront size={24} /> },
  { label: 'أجهزة الكاشير', icon: <MdPointOfSale size={24} /> },
  { label: 'الموظفين', icon: <MdPeople size={24} /> },
  { label: 'الأقسام', icon: <MdCategory size={24} /> },
];

const DashboardHome: React.FC = () => {
  const { user } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [BRANCHES_KEY, 1, 5],
    queryFn: () => branchApi.list(1, 5),
  });

  const branches = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const activeBranches = branches.filter(b => b.status).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-primary shadow-xl">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 70% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)`
        }} />
        <div className="relative z-10">
          <p className="text-white/80 text-sm font-medium mb-1">أهلاً وسهلاً،</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{user?.name} 👋</h1>
          <p className="text-white/70 text-sm">{user?.role ?? 'مستخدم'} — لوحة التحكم الإدارية</p>
        </div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -left-5 -bottom-5 w-20 h-20 rounded-full bg-white/10" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_ICONS.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <span className="text-primary">{card.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
              {i === 0 ? total : '—'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Branches */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white">آخر الفروع المضافة</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeBranches} فرع نشط من أصل {total}
            </p>
          </div>
          <Link to="/dashboard/branches" className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
            <span>عرض الكل</span>
            <MdArrowBack size={16} />
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner text="جاري تحميل الفروع..." />
        ) : isError ? (
          <ErrorFallback error={error} onRetry={refetch} />
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <MdStorefront size={40} className="mb-2 opacity-40" />
            <p className="text-sm">لا توجد فروع حالياً</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">الفرع</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">العنوان</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">واتساب</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {branches.map(branch => (
                  <tr key={branch.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 dark:text-white">{branch.name}</p>
                      <p className="text-xs text-slate-400">#{branch.id}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">{branch.address || '—'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 hidden md:table-cell font-mono">{branch.watts || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                        ${branch.status
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                        {branch.status ? '● نشط' : '● معطل'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
