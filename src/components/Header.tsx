import React from 'react';
import { Link } from 'react-router-dom';
import { MdMenu, MdPerson } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import NavigationProgressBar from './NavigationProgressBar';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();

  return (
    <header className="
      fixed top-0 left-0 right-0 lg:right-64 z-20 h-16
      bg-white/80 dark:bg-slate-900/80
      backdrop-blur-md
      border-b border-slate-200 dark:border-slate-700
      flex items-center justify-between px-4 gap-3
    ">
      <div className="flex items-center gap-3">
        <button
          id="sidebar-toggle"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="فتح القائمة الجانبية"
        >
          <MdMenu size={22} />
        </button>
      </div>

      {/* Right: User Profile Link */}
      <div className="flex items-center gap-2">
        <Link 
          to="/dashboard/profile"
          className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition-colors rounded-xl px-3 py-1.5 border border-slate-100 dark:border-slate-700"
          title="الإعدادات والملف الشخصي"
        >
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
              {user?.name ?? '—'}
            </p>
            <p className="text-[11px] font-medium text-slate-400">{user?.role ?? 'مستخدم'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm border-2 border-white dark:border-slate-800">
            <MdPerson size={20} className="text-white" />
          </div>
        </Link>
      </div>

      {/* Page Navigation & Loading Progress Bar */}
      <NavigationProgressBar />
    </header>
  );
};

export default Header;
