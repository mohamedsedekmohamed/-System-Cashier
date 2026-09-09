import type { PaginatedMeta } from './common';

export interface PaymentMethodName {
  ar: string;
  en: string;
}

export interface PaymentMethodDescription {
  ar: string;
  en: string;
}

export interface PaymentMethod {
  id: number;
  name: PaymentMethodName;
  description: PaymentMethodDescription;
  icon: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodFormData {
  name: PaymentMethodName;
  description: PaymentMethodDescription;
  icon: string;
  status: boolean;
}

export interface PaymentMethodSelectOptions {
  payment_methods: Pick<PaymentMethod, 'id' | 'name' | 'icon' | 'status'>[];
}

export interface PaymentMethodListResponse {
  data: PaymentMethod[];
  meta: PaginatedMeta;
  links: any;
  select_options?: PaymentMethodSelectOptions;
}

export interface SinglePaymentMethodResponse {
  status: boolean;
  data: PaymentMethod;
  select_options?: PaymentMethodSelectOptions;
}

export interface PaymentMethodSelectOptionsResponse {
  status: boolean;
  data: PaymentMethodSelectOptions;
}
