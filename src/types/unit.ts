import type { PaginatedMeta } from './common';

export interface Unit {
  id: number;
  name: { ar: string; en: string } | string;
  value: number; // multiplier value relative to base (e.g., 1000 for kg, 1 for gram)
  created_at?: string;
  updated_at?: string;
}

export interface UnitFormData {
  name: { ar: string; en: string } | string;
  value: number;
}

export interface UnitListResponse {
  data: Unit[];
  links?: any;
  meta: PaginatedMeta;
  status?: boolean;
}

export interface SingleUnitResponse {
  status: boolean;
  data: Unit;
  message?: string;
}

