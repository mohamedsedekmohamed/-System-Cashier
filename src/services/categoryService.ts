import { api } from '../lib/axios';
import type {
  Category,
  CategoryFormData,
  CategoryListResponse,
  SingleCategoryResponse,
  CategorySelectOptionsResponse
} from '../types';

export const CATEGORIES_KEY = 'categories';
export const CATEGORIES_SELECT_OPTIONS_KEY = 'categories_select_options';

export const toCategoryFormData = (payload: CategoryFormData, method: 'POST' | 'PUT' = 'POST'): FormData => {
  const formData = new FormData();
  formData.append('name[ar]', payload.name?.ar || '');
  formData.append('name[en]', payload.name?.en || '');
  formData.append('description[ar]', payload.description?.ar || '');
  formData.append('description[en]', payload.description?.en || '');

  if (payload.image instanceof File) {
    formData.append('image', payload.image);
  }

  if (payload.category_id !== null && payload.category_id !== undefined && payload.category_id > 0) {
    formData.append('category_id', String(payload.category_id));
  }

  if (payload.type) {
    formData.append('type', payload.type);
  }

  formData.append('status', payload.status ? '1' : '0');

  if (method === 'PUT') {
    formData.append('_method', 'PUT');
  }

  return formData;
};

export const categoryApi = {
  /** GET /api/admin/categories/select-options */
  getSelectOptions: async (): Promise<CategorySelectOptionsResponse> => {
    const { data } = await api.get<CategorySelectOptionsResponse>('/api/admin/categories/select-options');
    return data;
  },

  /** GET /api/admin/categories?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<CategoryListResponse> => {
    const { data } = await api.get<CategoryListResponse>(
      '/api/admin/categories',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/categories/:id */
  get: async (id: number | string): Promise<SingleCategoryResponse> => {
    const { data } = await api.get<SingleCategoryResponse>(`/api/admin/categories/${id}`);
    return data;
  },

  /** POST /api/admin/categories */
  create: async (payload: CategoryFormData): Promise<Category> => {
    const formData = toCategoryFormData(payload, 'POST');
    const { data } = await api.post<{ data: Category }>(
      '/api/admin/categories',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },

  /** PUT /api/admin/categories/:id */
  update: async (id: number | string, payload: CategoryFormData): Promise<Category> => {
    const formData = toCategoryFormData(payload, 'PUT');
    try {
      const { data } = await api.post<{ data: Category }>(
        `/api/admin/categories/${id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data.data;
    } catch (err: any) {
      if (err?.response?.status === 405) {
        const { data } = await api.put<{ data: Category }>(
          `/api/admin/categories/${id}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return data.data;
      }
      throw err;
    }
  },

  /** DELETE /api/admin/categories/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/categories/${id}`);
  },
};
