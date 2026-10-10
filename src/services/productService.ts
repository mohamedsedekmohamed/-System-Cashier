import { api } from '../lib/axios';
import type { 
  Product, 
  ProductFormData, 
  ProductListResponse, 
  SingleProductResponse, 
  ProductSelectOptionsResponse 
} from '../types';

export const PRODUCTS_KEY = 'products';
export const PRODUCTS_SELECT_OPTIONS_KEY = 'products_select_options';

export const toProductFormData = (payload: ProductFormData, method: 'POST' | 'PUT' = 'POST'): FormData => {
  const formData = new FormData();
  formData.append('name[ar]', payload.name?.ar || '');
  formData.append('name[en]', payload.name?.en || '');
  if (payload.description?.ar) {
    formData.append('description[ar]', payload.description.ar);
  }
  if (payload.description?.en) {
    formData.append('description[en]', payload.description.en);
  }

  formData.append('price', String(payload.price ?? 0));

  if (payload.category_id) {
    formData.append('category_id', String(payload.category_id));
  }
  if (payload.sub_category_id) {
    formData.append('sub_category_id', String(payload.sub_category_id));
  }
  if (payload.tax_id) {
    formData.append('tax_id', String(payload.tax_id));
  }
  if (payload.discount_id) {
    formData.append('discount_id', String(payload.discount_id));
  }

  if (payload.image instanceof File) {
    formData.append('image', payload.image);
  } else if (typeof payload.image === 'string' && payload.image.trim()) {
    formData.append('image', payload.image.trim());
  }

  if (payload.variations && payload.variations.length > 0) {
    payload.variations.forEach((variation, vIndex) => {
      if (variation.id) {
        formData.append(`variations[${vIndex}][id]`, String(variation.id));
      }
      formData.append(`variations[${vIndex}][name][ar]`, variation.name?.ar || '');
      formData.append(`variations[${vIndex}][name][en]`, variation.name?.en || '');
      formData.append(`variations[${vIndex}][required]`, variation.required ? '1' : '0');
      formData.append(`variations[${vIndex}][status]`, variation.status ? '1' : '0');

      if (variation.options && variation.options.length > 0) {
        variation.options.forEach((opt, oIndex) => {
          if (opt.id) {
            formData.append(`variations[${vIndex}][options][${oIndex}][id]`, String(opt.id));
          }
          formData.append(`variations[${vIndex}][options][${oIndex}][name][ar]`, opt.name?.ar || '');
          formData.append(`variations[${vIndex}][options][${oIndex}][name][en]`, opt.name?.en || '');
          formData.append(`variations[${vIndex}][options][${oIndex}][price]`, String(opt.price || 0));
          formData.append(`variations[${vIndex}][options][${oIndex}][status]`, opt.status ? '1' : '0');
        });
      }
    });
  }

  if (method === 'PUT') {
    formData.append('_method', 'PUT');
  }

  return formData;
};

export const productApi = {
  /** GET /api/admin/products/select-options */
  getSelectOptions: async (): Promise<ProductSelectOptionsResponse> => {
    const { data } = await api.get<ProductSelectOptionsResponse>('/api/admin/products/select-options');
    return data;
  },

  /** GET /api/admin/products?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<ProductListResponse> => {
    const { data } = await api.get<ProductListResponse>(
      '/api/admin/products',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/products/:id */
  get: async (id: number | string): Promise<SingleProductResponse> => {
    const { data } = await api.get<SingleProductResponse>(`/api/admin/products/${id}`);
    return data;
  },

  /** POST /api/admin/products */
  create: async (payload: ProductFormData): Promise<Product> => {
    if (payload.image instanceof File) {
      const formData = toProductFormData(payload, 'POST');
      const { data } = await api.post<{ data: Product }>(
        '/api/admin/products',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data.data;
    }
    const { data } = await api.post<{ data: Product }>('/api/admin/products', payload);
    return data.data;
  },

  /** PUT /api/admin/products/:id */
  update: async (id: number | string, payload: ProductFormData): Promise<Product> => {
    if (payload.image instanceof File) {
      const formData = toProductFormData(payload, 'PUT');
      try {
        const { data } = await api.post<{ data: Product }>(
          `/api/admin/products/${id}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return data.data;
      } catch (err: any) {
        if (err?.response?.status === 405) {
          const { data } = await api.put<{ data: Product }>(
            `/api/admin/products/${id}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          return data.data;
        }
        throw err;
      }
    }
    const { data } = await api.put<{ data: Product }>(`/api/admin/products/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/products/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/products/${id}`);
  },
};
