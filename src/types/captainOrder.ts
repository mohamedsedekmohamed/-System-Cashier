import type { PaginatedMeta, LocalizedString } from './common';

export interface CaptainOrder {
  id: number;
  name: string | LocalizedString;
  user_name: string;
  status: boolean | number;
  images: string[];
  raw_images?: string[];
  created_at: string;
  updated_at: string;
}

export interface CaptainOrderFormData {
  name: string;
  user_name: string;
  password?: string;
  status: boolean | number;
  images?: File[]; // For new additions (images[])
  new_images?: File[]; // For updates (new_images[])
  deleted_images?: string[]; // For updates (deleted_images[])
  existing_images?: string[]; // Client state tracking
}

export interface CaptainOrderSelectOption {
  id: number;
  name: string;
  user_name: string;
}

export interface CaptainOrderSelectOptionsResponse {
  status: boolean;
  data: {
    captain_orders: CaptainOrderSelectOption[];
  };
}

export interface CaptainOrderListResponse {
  data: CaptainOrder[];
  meta: PaginatedMeta;
  links?: {
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
  };
}

export interface SingleCaptainOrderResponse {
  status: boolean;
  message?: string;
  data: CaptainOrder;
}
