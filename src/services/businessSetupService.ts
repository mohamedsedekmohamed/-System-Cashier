import { api } from '../lib/axios';
import type { 
  BusinessSetup, 
  BusinessSetupPayload, 
  BusinessSetupResponse 
} from '../types';

export const BUSINESS_SETUP_KEY = 'business_setup';

export const toBusinessSetupFormData = (payload: BusinessSetupPayload, method?: 'PUT'): FormData => {
  const formData = new FormData();
  formData.append('name', payload.name || '');
  formData.append('phone', payload.phone || '');
  formData.append('face', payload.face || '');
  formData.append('instagram', payload.instagram || '');
  formData.append('whats', payload.whats || '');
  formData.append('description', payload.description || '');

  if (payload.start_day) {
    formData.append('start_day', payload.start_day);
  }
  if (payload.end_day) {
    formData.append('end_day', payload.end_day);
  }

  if (payload.logo instanceof File) {
    formData.append('logo', payload.logo);
  } else if (typeof payload.logo === 'string' && payload.logo.trim()) {
    formData.append('logo', payload.logo.trim());
  }

  if (payload.branch_cover instanceof File) {
    formData.append('branch_cover', payload.branch_cover);
  } else if (typeof payload.branch_cover === 'string' && payload.branch_cover.trim()) {
    formData.append('branch_cover', payload.branch_cover.trim());
  }

  if (method === 'PUT') {
    formData.append('_method', 'PUT');
  }

  return formData;
};

export const businessSetupApi = {
  /** GET /api/admin/business-setup (يعرض branch_cover) */
  get: async (): Promise<BusinessSetupResponse> => {
    const { data } = await api.get<BusinessSetupResponse>('/api/admin/business-setup');
    return data;
  },

  /** POST /api/admin/business-setup (يقبل branch_cover ورفع ملفات الصور) */
  create: async (payload: BusinessSetupPayload): Promise<{ data: BusinessSetup; message?: string }> => {
    const formData = toBusinessSetupFormData(payload);
    const { data } = await api.post<{ data: BusinessSetup; message?: string }>(
      '/api/admin/business-setup',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  /** PUT /api/admin/business-setup/{id?} (يحدث branch_cover ورفع ملفات الصور) */
  update: async (id?: string | number, payload: BusinessSetupPayload = {} as BusinessSetupPayload): Promise<{ data: BusinessSetup; message?: string }> => {
    const url = id !== undefined && id !== '' ? `/api/admin/business-setup/${id}` : '/api/admin/business-setup';
    const formData = toBusinessSetupFormData(payload, 'PUT');

    try {
      // Standard Laravel multipart update via POST with _method=PUT
      const { data } = await api.post<{ data: BusinessSetup; message?: string }>(
        url,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    } catch (err: any) {
      // Fallback to native PUT if server returns 405 Method Not Allowed
      if (err?.response?.status === 405) {
        const { data } = await api.put<{ data: BusinessSetup; message?: string }>(
          url,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return data;
      }
      throw err;
    }
  },
};
