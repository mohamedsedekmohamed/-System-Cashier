export interface BusinessSetup {
  id: string | number;
  name: string;
  phone: string;
  face: string;
  instagram: string;
  whats: string;
  logo: string;
  raw_logo?: string;
  branch_cover?: string;
  raw_branch_cover?: string;
  description: string;
  start_day?: string;
  end_day?: string;
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
  branch_cover?: string | File;
  start_day?: string;
  end_day?: string;
}

export interface BusinessSetupResponse {
  status: boolean;
  data: BusinessSetup | null;
  message?: string;
}
