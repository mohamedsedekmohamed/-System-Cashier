import { api } from '../lib/axios';
import type { BannerListResponse, SingleBannerResponse } from '../types';

export const BANNERS_KEY = 'banners';

export const bannerApi = {
  /** GET /api/admin/banners?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<BannerListResponse> => {
    const { data } = await api.get<BannerListResponse>('/api/admin/banners', {
      params: { page, per_page: perPage },
    });
    return data;
  },

  /** GET /api/admin/banners/:id */
  get: async (id: number | string): Promise<SingleBannerResponse> => {
    const { data } = await api.get<SingleBannerResponse>(`/api/admin/banners/${id}`);
    return data;
  },

  /** POST /api/admin/banners (multipart/form-data) */
  create: async (imageFile: File): Promise<SingleBannerResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const { data } = await api.post<SingleBannerResponse>('/api/admin/banners', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  /** DELETE /api/admin/banners/:id */
  delete: async (id: number | string): Promise<{ status: boolean; message?: string }> => {
    const { data } = await api.delete<{ status: boolean; message?: string }>(`/api/admin/banners/${id}`);
    return data;
  },
};
