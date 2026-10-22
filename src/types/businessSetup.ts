export interface BusinessSetup {
  id: string | number;
  name: string;
  phone: string;
  face: string;
  instagram: string;
  whats: string;
  logo: string;
  raw_logo?: string;
  description: string;
  branch_cover?: number | null;
  table_order_url?: string;
  start_day?: string | null;
  end_day?: string | null;
  has_gift?: boolean | null;
  price_gift?: number | null;
  is_open?: boolean;
  is_overnight?: boolean;
  working_hours_text?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessSetupPayload {
  name: string;
  phone: string;
  face: string;
  instagram: string;
  whats: string;
  description: string;
  logo: string | File;
  table_order_url: string;
  branch_cover?: number | null;
  start_day?: string | null;
  end_day?: string | null;
  has_gift?: boolean | null;
  price_gift?: number | null;
}

export interface BusinessSetupResponse {
  status: boolean;
  data: BusinessSetup | null;
  message?: string;
}

