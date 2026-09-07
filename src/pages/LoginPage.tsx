import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { MdPerson, MdLock, MdLogin, MdDashboard } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const LoginPage: React.FC = () => {
  const { login, loginError, isLoginPending } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ name, password, guard: 'admin' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary opacity-10 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary opacity-10 blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary opacity-5 blur-2xl animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
      </div>

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="
          bg-white/10 backdrop-blur-2xl
          border border-white/20
          rounded-3xl p-8 shadow-2xl
        ">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl mb-4 ring-4 ring-primary/20">
              <MdDashboard size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">لوحة التحكم</h1>
            <p className="text-slate-400 text-sm">نظام إدارة الكاشير</p>
          </div>

          {/* Error */}
          {loginError && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm text-center"
            >
              {loginError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name / Username */}
            <div>
              <label htmlFor="login-name" className="block text-sm font-medium text-slate-300 mb-2">
                اسم المستخدم
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <MdPerson size={20} />
                </span>
                <input
                  id="login-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  required
                  disabled={isLoginPending}
                  autoComplete="username"
                  className="
                    w-full pr-10 pl-4 py-3 rounded-xl
                    bg-white/10 border border-white/20
                    text-white placeholder:text-slate-500
                    focus:outline-none focus:ring-2 ring-primary focus:border-transparent
                    disabled:opacity-60
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <MdLock size={20} />
                </span>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  disabled={isLoginPending}
                  autoComplete="current-password"
                  className="
                    w-full pr-10 pl-4 py-3 rounded-xl
                    bg-white/10 border border-white/20
                    text-white placeholder:text-slate-500
                    focus:outline-none focus:ring-2 ring-primary focus:border-transparent
                    disabled:opacity-60
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Guard (hidden — sent as null) */}
            <input type="hidden" name="guard" value="" />

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoginPending || !name || !password}
              className="
                w-full py-3 rounded-xl font-bold text-base
                btn-primary
                flex items-center justify-center gap-2
                shadow-lg disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200 mt-2
              "
            >
              {isLoginPending ? (
                <>
                  <AiOutlineLoading3Quarters size={20} className="animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <MdLogin size={20} />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-5">
          نظام إدارة الكاشير © {new Date().getFullYear()} — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
