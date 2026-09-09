export interface Tax {
  id: number;
  name: {
    ar: string;
    en: string;
  };
  type: 'percentage' | 'value';
  amount: number | string;
  status: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TaxFormData {
  name: {
    ar: string;
    en: string;
  };
  type: 'percentage' | 'value';
  amount: number;
  status: boolean;
}

export interface TaxListResponse {
  data: Tax[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  select_options: {
    taxes: Tax[];
  };
}

export interface SingleTaxResponse {
  status: boolean;
  data: Tax;
  select_options: {
    taxes: Tax[];
  };
}

export interface TaxSelectOptionsResponse {
  status: boolean;
  data: {
    taxes: Tax[];
  };
}
