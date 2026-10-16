export interface Saler {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface SalerFormData {
  name: string;
  phone: string;
  email?: string;
  balance?: number;
}

export interface SalerListResponse {
  data: Saler[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  select_options?: {
    salers: Saler[];
  };
}

export interface SingleSalerResponse {
  status: boolean;
  data: Saler;
  select_options?: {
    salers: Saler[];
  };
}

export interface SalerSelectOptionsResponse {
  status: boolean;
  data: {
    salers: Saler[];
  };
}
