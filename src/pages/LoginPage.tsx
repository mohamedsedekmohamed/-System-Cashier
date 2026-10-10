import React, { useState, useId } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MdPerson,
  MdLock,
  MdLogin,
  MdDashboard,
  MdVisibility,
  MdVisibilityOff,
  MdClose,
  MdErrorOutline,
  MdSecurity,
  MdCheckCircle,
  MdWarningAmber,
  MdCode,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { formatAuthError } from '../utils/authErrors';

const REMEMBERED_USER_KEY = 'cashier_remembered_username';

const LoginPage: React.FC = () => {
  const { login, loginError, clearLoginError, isLoginPending } = useAuth();
  const nameInputId = useId();
  const passwordInputId = useId();

  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem(REMEMBERED_USER_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return Boolean(localStorage.getItem(REMEMBERED_USER_KEY));
    } catch {
      return false;
    }
  });
  const [expandedErrorKey, setExpandedErrorKey] = useState<string | null>(null);
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Parse and format error into professional Arabic structure
  const formattedError = formatAuthError(loginError);
  const isTechnicalVisible = Boolean(loginError && expandedErrorKey === loginError);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (loginError) clearLoginError();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (loginError) clearLoginError();
  };

  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockActive(e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return;

    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_USER_KEY, name.trim());
      } else {
        localStorage.removeItem(REMEMBERED_USER_KEY);
      }
    } catch {
      // localStorage may fail in restricted environments
    }

    try {
      await login({ name: name.trim(), password, guard: 'admin' });
    } catch {
      // Error handled via AuthContext mutation onError
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none"
    >
      {/* ── Dynamic Ambient Glow Elements ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Primary radial glow - top right */}
        <div
          className="absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full opacity-20 blur-[100px] animate-pulse-subtle"
          style={{ backgroundColor: 'var(--color-primary, #3b82f6)' }}
        />
        {/* Violet/Indigo radial glow - bottom left */}
        <div
          className="absolute -bottom-36 -left-36 w-[34rem] h-[34rem] rounded-full bg-indigo-600 opacity-20 blur-[110px] animate-pulse-subtle"
          style={{ animationDelay: '2.5s' }}
        />
        {/* Soft center backdrop glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-[90px]"
          style={{ backgroundColor: 'var(--color-primary, #3b82f6)' }}
        />
      </div>

      {/* ── Subtle Geometric Dot Matrix Overlay ── */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 85%)',
        }}
        aria-hidden="true"
      />

      {/* ── Main Login Container ── */}
      <div className="relative w-full max-w-md z-10">
        <div
          className="
            relative rounded-3xl p-6 sm:p-9
            bg-slate-900/75 backdrop-blur-2xl
            border border-slate-700/60
            shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]
            before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-3xl
            before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
          "
        >
          {/* ── Top Header / Brand Badge ── */}
          <div className="flex flex-col items-center mb-6 text-center">
            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>النظام متصل وآمن</span>
            </div>

            {/* Glowing Brand Icon */}
            <div className="relative mb-3 group">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-primary/20 transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary, #3b82f6), #6366f1)',
                  boxShadow: '0 10px 25px -5px var(--color-primary, #3b82f6)',
                }}
              >
                <MdDashboard size={32} className="text-white drop-shadow-md" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-2xl sm:text-[1.7rem] font-extrabold text-white tracking-tight">
              لوحة التحكم الإدارية
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
              منظومة إدارة الكاشير ونقاط البيع المتكاملة
            </p>
          </div>

          {/* ── Enhanced Error Alert Box ── */}
          {formattedError && (
            <div
              role="alert"
              aria-live="assertive"
              className="
                mb-6 p-4 rounded-2xl
                bg-gradient-to-r from-rose-950/40 via-red-950/30 to-rose-950/40
                border border-rose-500/35
                text-rose-100 shadow-lg shadow-rose-950/40
                animate-login-shake relative overflow-hidden
              "
            >
              {/* Colored accent side indicator */}
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 to-red-600" />

              <div className="flex items-start gap-3">
                {/* Error Icon Badge */}
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 mt-0.5">
                  <MdErrorOutline size={22} className="animate-pulse" />
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 pr-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-rose-200">
                      {formattedError.title}
                    </h2>
                    {/* Close / Dismiss button */}
                    <button
                      type="button"
                      onClick={clearLoginError}
                      title="إغلاق التنبيه"
                      className="text-rose-400/80 hover:text-white p-1 rounded-lg hover:bg-rose-500/20 transition-colors"
                    >
                      <MdClose size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
                    {formattedError.description}
                  </p>

                  {/* Optional Technical Details Toggle */}
                  {formattedError.rawMessage && (
                    <div className="mt-2.5 pt-2 border-t border-rose-500/20">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedErrorKey(isTechnicalVisible ? null : (loginError ?? null))
                        }
                        className="inline-flex items-center gap-1.5 text-[11px] text-rose-300/80 hover:text-rose-200 transition-colors focus:outline-none"
                      >
                        <MdCode size={14} />
                        <span>{isTechnicalVisible ? 'إخفاء التفاصيل التقنية' : 'عرض التفاصيل التقنية للخطأ'}</span>
                      </button>

                      {isTechnicalVisible && (
                        <div
                          dir="ltr"
                          className="mt-1.5 p-2 rounded-lg bg-black/50 border border-rose-500/30 text-rose-300 font-mono text-[11px] break-all select-all leading-normal text-left"
                        >
                          {formattedError.rawMessage}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Login Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={nameInputId}
                  className="block text-xs sm:text-sm font-semibold text-slate-200"
                >
                  اسم المستخدم
                </label>
                <span className="text-[11px] text-slate-500">حساب المدير أو الكاشير</span>
              </div>
              <div className="relative group">
                {/* Person icon on right */}
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white pointer-events-none transition-colors">
                  <MdPerson size={20} />
                </span>

                <input
                  id={nameInputId}
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="أدخل اسم المستخدم (مثال: super admin)"
                  required
                  disabled={isLoginPending}
                  autoComplete="username"
                  autoFocus
                  className="
                    w-full pr-11 pl-10 py-3 rounded-2xl
                    bg-slate-800/60 border border-slate-700/80
                    text-white placeholder:text-slate-500 text-sm
                    focus:outline-none focus:border-transparent focus:ring-2
                    focus:ring-[var(--color-primary,#3b82f6)] focus:bg-slate-800/90
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-all duration-200
                  "
                />

                {/* Quick clear button on left */}
                {name && !isLoginPending && (
                  <button
                    type="button"
                    onClick={() => {
                      setName('');
                      if (loginError) clearLoginError();
                    }}
                    title="مسح الحقل"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <MdClose size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={passwordInputId}
                  className="block text-xs sm:text-sm font-semibold text-slate-200"
                >
                  كلمة المرور
                </label>
                <span className="text-[11px] text-slate-500">مشفرة وآمنة</span>
              </div>
              <div className="relative group">
                {/* Lock icon on right */}
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white pointer-events-none transition-colors">
                  <MdLock size={20} />
                </span>

                <input
                  id={passwordInputId}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyUp={handlePasswordKey}
                  onKeyDown={handlePasswordKey}
                  placeholder="أدخل كلمة المرور الخاصة بك"
                  required
                  disabled={isLoginPending}
                  autoComplete="current-password"
                  className="
                    w-full pr-11 pl-11 py-3 rounded-2xl
                    bg-slate-800/60 border border-slate-700/80
                    text-white placeholder:text-slate-500 text-sm
                    focus:outline-none focus:border-transparent focus:ring-2
                    focus:ring-[var(--color-primary,#3b82f6)] focus:bg-slate-800/90
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-all duration-200
                  "
                />

                {/* Show/Hide password toggle on left */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoginPending}
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  className="
                    absolute left-3 top-1/2 -translate-y-1/2
                    text-slate-400 hover:text-white p-1 rounded-lg
                    hover:bg-slate-700/50 transition-colors
                  "
                >
                  {showPassword ? <MdVisibilityOff size={19} /> : <MdVisibility size={19} />}
                </button>
              </div>

              {/* Caps Lock Alert */}
              {capsLockActive && (
                <div className="flex items-center gap-1.5 text-amber-400 text-xs mt-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <MdWarningAmber size={15} />
                  <span>تنبيه: زر الأحرف الكبيرة (Caps Lock) مفعل</span>
                </div>
              )}
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoginPending}
                  className="
                    w-4 h-4 rounded border-slate-700 bg-slate-800
                    text-primary focus:ring-primary/40 focus:ring-offset-0
                    cursor-pointer
                  "
                />
                <span className="text-xs text-slate-300 hover:text-white transition-colors">
                  تذكر اسم المستخدم على هذا الجهاز
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="login-submit"
                type="submit"
                disabled={isLoginPending || !name.trim() || !password.trim()}
                className="
                  group relative w-full py-3.5 px-4 rounded-2xl
                  font-bold text-white text-sm sm:text-base
                  btn-primary
                  shadow-[0_10px_25px_-5px_var(--color-primary,rgba(59,130,246,0.5))]
                  hover:shadow-[0_15px_30px_-5px_var(--color-primary,rgba(59,130,246,0.6))]
                  active:scale-[0.99]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                  flex items-center justify-center gap-2.5
                  transition-all duration-200
                "
              >
                {isLoginPending ? (
                  <>
                    <AiOutlineLoading3Quarters size={20} className="animate-spin text-white" />
                    <span>جاري التحقق والاتصال...</span>
                  </>
                ) : (
                  <>
                    <span>تسجيل الدخول</span>
                    <MdLogin
                      size={20}
                      className="transition-transform duration-200 group-hover:-translate-x-1"
                    />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* ── Security Trust Indicators ── */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-4 sm:gap-6 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <MdSecurity size={15} className="text-emerald-400" />
              <span>تشفير آمن 256-bit SSL</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MdCheckCircle size={15} className="text-primary" />
              <span>جلسة عمل محمية</span>
            </span>
          </div>
        </div>

        {/* ── Outer Page Footer ── */}
        <p className="text-center text-slate-500 text-xs mt-5 leading-relaxed">
          نظام إدارة الكاشير والمبيعات © {new Date().getFullYear()} — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
