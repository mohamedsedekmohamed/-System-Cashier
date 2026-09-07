import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/authService';
import { getToken, setToken, removeToken } from '../lib/axios';
import type { User, LoginPayload, LoginResponse } from '../types';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoadingUser: boolean;
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  loginError: string | null;
  isLoginPending: boolean;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);

  const hasToken = Boolean(getToken());

  // ── GET /api/auth/me — restore session on mount ──────────────
  const {
    data: user = null,
    isLoading: isLoadingUser,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: hasToken,           // Only run when a token exists
    retry: false,
    staleTime: Infinity,         // Re-fetch only on explicit invalidation
  });

  // ── POST /api/auth/login ─────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      setToken(data.token);
      setLoginError(null);
      // Seed the "me" cache with the user from the login response
      queryClient.setQueryData(['auth', 'me'], data.user);
      navigate('/dashboard', { replace: true });
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setLoginError(msg || 'فشل تسجيل الدخول. تحقق من بيانات الاعتماد.');
    },
  });

  // ── POST /api/auth/logout ────────────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Always clean up, regardless of API response
      removeToken();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });

  // ── Listen for forced logout from the Axios interceptor ──────
  useEffect(() => {
    const handleForcedLogout = () => {
      removeToken();
      queryClient.clear();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [navigate, queryClient]);

  const login = useCallback(
    (payload: LoginPayload) => loginMutation.mutateAsync(payload),
    [loginMutation]
  );

  const logout = useCallback(
    () => logoutMutation.mutateAsync(),
    [logoutMutation]
  );

  const isAuthenticated = Boolean(user && getToken());

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingUser,
        login,
        logout,
        loginError,
        isLoginPending: loginMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
