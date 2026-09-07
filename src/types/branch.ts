export interface Branch {
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

export interface BranchFormData {
  name: string;
  address: string;
  watts: string;
  facebook: string;
  status: boolean;
  password?: string;
}
