export interface BranchLocationPoint {
  lat: number;
  lng: number;
}

export interface BranchOption {
  id: number;
  name: { en?: string; ar?: string } | string | null;
  role?: string;
}

export interface Branch {
  id: number;
  name: { en: string; ar: string } | string;
  address: string;
  location?: BranchLocationPoint[] | string;
  watts: string;
  facebook: string;
  status: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface BranchFormData {
  name: string;
  address: string;
  location: BranchLocationPoint[];
  watts: string;
  facebook: string;
  status: boolean;
  password?: string;
}
