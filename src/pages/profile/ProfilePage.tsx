import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColor, FontSize } from '../../types';
import {
  MdPerson,
  MdDarkMode,
  MdLightMode,
  MdTextFields,
  MdLogout,
  MdSettings,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const COLOR_OPTIONS: { color: ThemeColor; hex: string; label: string }[] = [
  { color: 'blue',   hex: '#3b82f6', label: 'أزرق' },
  { color: 'green',  hex: '#10b981', label: 'أخضر' },
  { color: 'red',    hex: '#ef4444', label: 'أحمر' },
  { color: 'purple', hex: '#8b5cf6', label: 'بنفسجي' },
  { color: 'orange', hex: '#f97316', label: 'برتقالي' },
  { color: 'teal',   hex: '#14b8a6', label: 'زيتي' },
];

const FONT_SIZES: { value: FontSize; label: string; title: string }[] = [
  { value: 'small',  label: 'ص', title: 'خط صغير' },
  { value: 'medium', label: 'م', title: 'خط متوسط' },
  { value: 'large',  label: 'ك', title: 'خط كبير' },
];

const ProfilePage: React.FC = () => {
  const { user, logout, isLoginPending } = useAuth();
  const { isDark, toggleDark, themeColor, setThemeColor, fontSize, setFontSize } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <MdSettings size={26} className="text-primary" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">الإعدادات والملف الشخصي</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* User Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-4 border-primary/20">
              <MdPerson size={48} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{typeof user?.name === 'object' && user?.name !== null ? ((user?.name as any)?.ar || (user?.name as any)?.en || '') : (user?.name || '')}</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full inline-block">
              {user?.role ?? 'مستخدم'}
            </p>
            {user?.email && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{user.email}</p>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => logout()}
              disabled={isLoginPending}
              className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoginPending ? (
                <AiOutlineLoading3Quarters size={20} className="animate-spin" />
              ) : (
                <MdLogout size={20} />
              )}
              تسجيل الخروج
            </button>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-8">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">
            إعدادات المظهر
          </h3>

          {/* Dark Mode */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              وضع الشاشة
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => isDark && toggleDark()}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  !isDark 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <MdLightMode size={24} />
                <span className="font-semibold text-sm">فاتح</span>
              </button>
              <button
                onClick={() => !isDark && toggleDark()}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  isDark 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <MdDarkMode size={24} />
                <span className="font-semibold text-sm">داكن</span>
              </button>
            </div>
          </div>

          {/* Color Switcher */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              اللون الأساسي للنظام
            </label>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl overflow-x-auto">
              {COLOR_OPTIONS.map(({ color, hex, label }) => (
                <button
                  key={color}
                  onClick={() => setThemeColor(color)}
                  title={label}
                  className={`
                    w-8 h-8 rounded-full transition-all duration-200 border-2 shrink-0
                    ${themeColor === color
                      ? 'border-slate-500 dark:border-white scale-125 shadow-md'
                      : 'border-transparent hover:scale-110'
                    }
                  `}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              حجم الخط
            </label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl">
              <MdTextFields size={20} className="text-slate-400 mx-2" />
              {FONT_SIZES.map(({ value, label, title }) => (
                <button
                  key={value}
                  onClick={() => setFontSize(value)}
                  title={title}
                  className={`
                    flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200
                    ${fontSize === value
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
