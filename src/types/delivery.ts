import type { PaginatedMeta, SelectOption } from './common';

export interface DeliveryBranch {
  id: number;
  name: string;
  address: string;
  watts: string;
  facebook: string;
  status: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: number;
  name: string;
  phone: string;
  id_images: string[];
  branch_id: number;
  branch: DeliveryBranch;
  created_at: string;
  updated_at: string;
}

export interface DeliveryFormData {
  name: string;
  phone: string;
  branch_id: number;
  id_images?: File[]; // For client-side form state
}

export interface DeliverySelectOptions {
  branches: SelectOption[];
}

export interface DeliveryListResponse {
  data: Delivery[];
  meta: PaginatedMeta;
  select_options?: DeliverySelectOptions;
}

export interface SingleDeliveryResponse {
  status: boolean;
  data: Delivery;
  select_options?: DeliverySelectOptions;
}

export interface DeliverySelectOptionsResponse {
  status: boolean;
  data: DeliverySelectOptions;
}
