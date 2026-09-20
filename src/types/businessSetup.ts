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
  logo: string;
}

export interface BusinessSetupResponse {
  status: boolean;
  data: BusinessSetup | null;
  message?: string;
}
