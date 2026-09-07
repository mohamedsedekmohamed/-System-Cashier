import { api } from '../lib/axios';
import type { LoginPayload, LoginResponse, User } from '../types';

export const authApi = {
  /** POST /api/auth/login */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await api.post<any>('/api/auth/login', payload);
    return {
      token: data.data.access_token,
      user: data.data.user,
    };
  },

  /** GET /api/auth/me */
  me: async (): Promise<User> => {
    const { data } = await api.get<{ data: User } | User>('/api/auth/me');
    // Handle both wrapped and unwrapped responses
    return (data as { data: User }).data ?? data as User;
  },

  /** POST /api/auth/logout */
  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  },

  /** POST /api/auth/refresh */
  refresh: async (): Promise<{ token: string }> => {
    const { data } = await api.post<{ token: string }>('/api/auth/refresh');
    return data;
  },
};
