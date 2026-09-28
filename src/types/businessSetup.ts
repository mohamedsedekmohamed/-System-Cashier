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
}

export interface BusinessSetupResponse {
  status: boolean;
  data: BusinessSetup | null;
  message?: string;
}
