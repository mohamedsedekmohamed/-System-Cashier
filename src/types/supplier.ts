export interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierFormData {
  name: string;
  phone: string;
  email?: string;
  balance?: number;
}

export interface SupplierListResponse {
  data: Supplier[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  select_options: {
    suppliers: Supplier[];
  };
}

export interface SingleSupplierResponse {
  status: boolean;
  data: Supplier;
  select_options: {
    suppliers: Supplier[];
  };
}

export interface SupplierSelectOptionsResponse {
  status: boolean;
  data: {
    suppliers: Supplier[];
  };
}
