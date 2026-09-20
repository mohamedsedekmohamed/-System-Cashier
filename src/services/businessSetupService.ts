import { api } from '../lib/axios';
import type { 
  BusinessSetup, 
  BusinessSetupPayload, 
  BusinessSetupResponse 
} from '../types';

export const BUSINESS_SETUP_KEY = 'business_setup';

export const businessSetupApi = {
  /** GET /api/admin/business-setup */
  get: async (): Promise<BusinessSetupResponse> => {
    const { data } = await api.get<BusinessSetupResponse>('/api/admin/business-setup');
    return data;
  },

  /** POST /api/admin/business-setup */
  create: async (payload: BusinessSetupPayload): Promise<{ data: BusinessSetup; message?: string }> => {
    const { data } = await api.post<{ data: BusinessSetup; message?: string }>('/api/admin/business-setup', payload);
    return data;
  },

  /** PUT /api/admin/business-setup/:id */
  update: async (id: string | number, payload: BusinessSetupPayload): Promise<{ data: BusinessSetup; message?: string }> => {
    const { data } = await api.put<{ data: BusinessSetup; message?: string }>(`/api/admin/business-setup/${id}`, payload);
    return data;
  },
};
