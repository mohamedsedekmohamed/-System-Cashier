export interface Shift {
  id: number;
  name: {
    ar: string;
    en: string;
  };
  start_time: string;
  end_time: string;
  branch_id: number;
  is_tomorrow: boolean;
  branch?: {
    id: number;
    name: string | null;
    user_name: string | null;
    address: string;
    watts: string;
    facebook: string;
    status: boolean;
    role: string;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ShiftFormData {
  name: {
    ar: string;
    en: string;
  };
  start_time: string;
  end_time: string;
  branch_id: number;
}
