export interface PaginatedMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface SelectOption {
  id: number;
  name: string;
  role?: string;
}

export interface LocalizedString {
  ar: string;
  en: string;
}

export interface LocalizedDescription {
  ar: string | null;
  en: string | null;
}
