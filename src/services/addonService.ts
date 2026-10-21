import { api } from '../lib/axios';
import type {
  Addon,
  AddonFormData,
  AddonListResponse,
  SingleAddonResponse,
  AddonSelectOptionsResponse,
} from '../types';

export const ADDONS_KEY = 'addons';
export const ADDONS_SELECT_OPTIONS_KEY = 'addons_select_options';

export const toAddonFormData = (payload: AddonFormData, method: 'POST' | 'PUT' = 'POST'): FormData => {
  const formData = new FormData();
  formData.append('name[ar]', payload.name?.ar || '');
  formData.append('name[en]', payload.name?.en || '');
  formData.append('price', String(payload.price ?? 0));

  if (payload.image instanceof File) {
    formData.append('image', payload.image);
  } else if (typeof payload.image === 'string' && payload.image.trim()) {
    formData.append('image', payload.image.trim());
  }

  if (payload.tax_id) {
    formData.append('tax_id', String(payload.tax_id));
  }
  if (payload.discount_id) {
    formData.append('discount_id', String(payload.discount_id));
  }
  if (payload.kitchen_id) {
    formData.append('kitchen_id', String(payload.kitchen_id));
  }

  if (method === 'PUT') {
    formData.append('_method', 'PUT');
  }

  return formData;
};

export const addonApi = {
  /** GET /api/admin/addons/select-options (fallback: /api/admin/addons/lists) */
  getSelectOptions: async (): Promise<AddonSelectOptionsResponse> => {
    try {
      const { data } = await api.get<AddonSelectOptionsResponse>('/api/admin/addons/select-options');
      return data;
    } catch {
      const { data } = await api.get<AddonSelectOptionsResponse>('/api/admin/addons/lists');
      return data;
    }
  },

  /** GET /api/admin/addons?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<AddonListResponse> => {
    const { data } = await api.get<AddonListResponse>('/api/admin/addons', {
      params: { page, per_page: perPage },
    });
    return data;
  },

  /** GET /api/admin/addons/:id */
  get: async (id: number | string): Promise<SingleAddonResponse> => {
    const { data } = await api.get<SingleAddonResponse>(`/api/admin/addons/${id}`);
    return data;
  },

  /** POST /api/admin/addons */
  create: async (payload: AddonFormData): Promise<Addon> => {
    if (payload.image instanceof File) {
      const formData = toAddonFormData(payload, 'POST');
      const { data } = await api.post<{ status?: boolean; data: Addon }>(
        '/api/admin/addons',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data.data;
    }

    const jsonPayload = {
      name: {
        ar: payload.name?.ar || '',
        en: payload.name?.en || '',
      },
      price: Number(payload.price ?? 0),
      image: typeof payload.image === 'string' ? payload.image : '',
      tax_id: payload.tax_id ? Number(payload.tax_id) : 0,
      discount_id: payload.discount_id ? Number(payload.discount_id) : 0,
      kitchen_id: payload.kitchen_id ? Number(payload.kitchen_id) : 0,
    };

    const { data } = await api.post<{ status?: boolean; data: Addon }>('/api/admin/addons', jsonPayload);
    return data.data;
  },

  /** PUT /api/admin/addons/:id */
  update: async (id: number | string, payload: AddonFormData): Promise<Addon> => {
    if (payload.image instanceof File) {
      const formData = toAddonFormData(payload, 'PUT');
      try {
        const { data } = await api.post<{ status?: boolean; data: Addon }>(
          `/api/admin/addons/${id}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return data.data;
      } catch (err: any) {
        if (err?.response?.status === 405) {
          const { data } = await api.put<{ status?: boolean; data: Addon }>(
            `/api/admin/addons/${id}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          return data.data;
        }
        throw err;
      }
    }

    const jsonPayload = {
      name: {
        ar: payload.name?.ar || '',
        en: payload.name?.en || '',
      },
      price: Number(payload.price ?? 0),
      image: typeof payload.image === 'string' ? payload.image : '',
      tax_id: payload.tax_id ? Number(payload.tax_id) : 0,
      discount_id: payload.discount_id ? Number(payload.discount_id) : 0,
      kitchen_id: payload.kitchen_id ? Number(payload.kitchen_id) : 0,
    };

    const { data } = await api.put<{ status?: boolean; data: Addon }>(`/api/admin/addons/${id}`, jsonPayload);
    return data.data;
  },

  /** DELETE /api/admin/addons/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/addons/${id}`);
  },
};
