import type { PaginatedMeta } from './common';

export interface Banner {
  id: number;
  image: string;
  created_at: string;
  updated_at: string;
}

export interface BannerListResponse {
  data: Banner[];
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta: PaginatedMeta;
}

export interface SingleBannerResponse {
  status: boolean;
  message?: string;
  data: Banner;
}
