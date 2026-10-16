import { api } from '../lib/axios';
import type { 
  BusinessSetup, 
  BusinessSetupPayload, 
  BusinessSetupResponse 
} from '../types';

export const BUSINESS_SETUP_KEY = 'business_setup';

/** Format time string ensuring HH:mm format matching pattern ^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$ */
export const formatTimePattern = (time?: string | null): string | null => {
  if (!time) return null;
  const trimmed = time.trim();
  if (!trimmed) return null;
  if (/^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed.substring(0, 5);
};

export const toBusinessSetupFormData = (payload: BusinessSetupPayload, method?: 'PUT'): FormData => {
  const formData = new FormData();
  formData.append('name', payload.name || '');
  formData.append('phone', payload.phone || '');
  formData.append('face', payload.face || '');
  formData.append('instagram', payload.instagram || '');
  formData.append('whats', payload.whats || '');
  formData.append('description', payload.description || '');
  formData.append('table_order_url', payload.table_order_url || '');

  if (payload.branch_cover !== null && payload.branch_cover !== undefined) {
    formData.append('branch_cover', String(payload.branch_cover));
  }

  const startDay = formatTimePattern(payload.start_day);
  if (startDay) {
    formData.append('start_day', startDay);
  }

  const endDay = formatTimePattern(payload.end_day);
  if (endDay) {
    formData.append('end_day', endDay);
  }

  if (payload.logo instanceof File) {
    formData.append('logo', payload.logo);
  } else if (typeof payload.logo === 'string' && payload.logo.trim()) {
    formData.append('logo', payload.logo.trim());
  }

  if (method === 'PUT') {
    formData.append('_method', 'PUT');
  }

  return formData;
};

export const toBusinessSetupJson = (payload: BusinessSetupPayload): Record<string, any> => {
  const json: Record<string, any> = {
    name: payload.name || '',
    phone: payload.phone || '',
    face: payload.face || '',
    instagram: payload.instagram || '',
    whats: payload.whats || '',
    description: payload.description || '',
    table_order_url: payload.table_order_url || '',
    branch_cover:
      payload.branch_cover !== null && payload.branch_cover !== undefined
        ? Number(payload.branch_cover)
        : 0,
    start_day: formatTimePattern(payload.start_day),
    end_day: formatTimePattern(payload.end_day),
    logo: typeof payload.logo === 'string' ? payload.logo.trim() : '',
  };
  return json;
};

export const businessSetupApi = {
  /** GET /api/admin/business-setup */
  get: async (): Promise<BusinessSetupResponse> => {
    const { data } = await api.get<BusinessSetupResponse>('/api/admin/business-setup');
    return data;
  },

  /** POST /api/admin/business-setup */
  create: async (payload: BusinessSetupPayload): Promise<{ data: BusinessSetup; message?: string }> => {
    // If logo is a File, use FormData with multipart
    if (payload.logo instanceof File) {
      const formData = toBusinessSetupFormData(payload);
      const { data } = await api.post<{ data: BusinessSetup; message?: string }>(
        '/api/admin/business-setup',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    }

    // Standard application/json
    const jsonBody = toBusinessSetupJson(payload);
    const { data } = await api.post<{ data: BusinessSetup; message?: string }>(
      '/api/admin/business-setup',
      jsonBody
    );
    return data;
  },

  /** PUT /api/admin/business-setup/{id?} */
  update: async (
    id?: string | number,
    payload: BusinessSetupPayload = {} as BusinessSetupPayload
  ): Promise<{ data: BusinessSetup; message?: string }> => {
    const url = id !== undefined && id !== '' ? `/api/admin/business-setup/${id}` : '/api/admin/business-setup';

    // If logo is a File, send via multipart/form-data
    if (payload.logo instanceof File) {
      const formData = toBusinessSetupFormData(payload, 'PUT');
      try {
        const { data } = await api.post<{ data: BusinessSetup; message?: string }>(
          url,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return data;
      } catch (err: any) {
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
    }

    // JSON payload
    const jsonBody = toBusinessSetupJson(payload);
    try {
      // Standard PUT with application/json
      const { data } = await api.put<{ data: BusinessSetup; message?: string }>(url, jsonBody);
      return data;
    } catch (err: any) {
      // Fallback: POST with _method: 'PUT' if PUT method is rejected
      if (err?.response?.status === 405) {
        const { data } = await api.post<{ data: BusinessSetup; message?: string }>(
          url,
          { ...jsonBody, _method: 'PUT' }
        );
        return data;
      }
      throw err;
    }
  },
};
