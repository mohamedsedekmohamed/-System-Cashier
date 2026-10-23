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

export const formatIntegerOrNull = (val: any): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const num = parseInt(String(val), 10);
  return isNaN(num) ? null : num;
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

  if (payload.has_gift !== undefined && payload.has_gift !== null) {
    formData.append('has_gift', payload.has_gift ? '1' : '0');
  }

  const priceGift = formatIntegerOrNull(payload.price_gift);
  if (priceGift !== null) {
    formData.append('price_gift', String(priceGift));
  }

  if (payload.logo instanceof File) {
    formData.append('logo', payload.logo);
  } else if (typeof payload.logo === 'string' && payload.logo.trim()) {
    formData.append('logo', payload.logo.trim());
  }

  // Handle menu images (array of uploaded image files or existing image paths/URLs)
  if (Array.isArray(payload.menu)) {
    payload.menu.forEach((item) => {
      if (item instanceof File) {
        formData.append('menu[]', item);
      } else if (typeof item === 'string' && item.trim()) {
        formData.append('menu[]', item.trim());
      }
    });
  }

  // Handle new_menu (new menu images to append to current menu)
  if (Array.isArray(payload.new_menu)) {
    payload.new_menu.forEach((item) => {
      if (item instanceof File) {
        formData.append('new_menu[]', item);
      } else if (typeof item === 'string' && item.trim()) {
        formData.append('new_menu[]', item.trim());
      }
    });
  }

  // Handle deleted_menu and delete_menu (array of menu image paths, URLs, or indices to delete)
  const deletedItems = payload.deleted_menu || payload.delete_menu;
  if (Array.isArray(deletedItems) && deletedItems.length > 0) {
    deletedItems.forEach((item) => {
      if (item !== null && item !== undefined && String(item).trim()) {
        const val = String(item).trim();
        formData.append('deleted_menu[]', val);
        formData.append('delete_menu[]', val);
      }
    });
  }

  if (method === 'PUT') {
    formData.append('_method', 'PUT');
  }

  return formData;
};

export const toBusinessSetupJson = (payload: BusinessSetupPayload): Record<string, any> => {
  const deletedItems = payload.deleted_menu || payload.delete_menu;
  const formattedDeleted = Array.isArray(deletedItems)
    ? deletedItems
        .filter((item) => item !== null && item !== undefined && String(item).trim().length > 0)
        .map((item) => (typeof item === 'number' ? item : String(item).trim()))
    : null;

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
    has_gift: payload.has_gift !== undefined && payload.has_gift !== null ? Boolean(payload.has_gift) : null,
    price_gift: formatIntegerOrNull(payload.price_gift),
    menu: Array.isArray(payload.menu)
      ? payload.menu.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : (payload.menu ?? null),
    new_menu: Array.isArray(payload.new_menu)
      ? payload.new_menu.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : (payload.new_menu ?? null),
    deleted_menu: formattedDeleted,
    delete_menu: formattedDeleted,
  };
  return json;
};

const hasFileInPayload = (payload: BusinessSetupPayload): boolean => {
  if (payload.logo instanceof File) return true;
  if (Array.isArray(payload.menu) && payload.menu.some((item) => item instanceof File)) {
    return true;
  }
  if (Array.isArray(payload.new_menu) && payload.new_menu.some((item) => item instanceof File)) {
    return true;
  }
  return false;
};

export const businessSetupApi = {
  /** GET /api/admin/business-setup */
  get: async (): Promise<BusinessSetupResponse> => {
    const { data } = await api.get<BusinessSetupResponse>('/api/admin/business-setup');
    return data;
  },

  /** POST /api/admin/business-setup */
  create: async (payload: BusinessSetupPayload): Promise<{ data: BusinessSetup; message?: string }> => {
    // If logo or any menu item is a File, use FormData with multipart
    if (hasFileInPayload(payload)) {
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

    // If logo or any menu item is a File, send via multipart/form-data
    if (hasFileInPayload(payload)) {
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
