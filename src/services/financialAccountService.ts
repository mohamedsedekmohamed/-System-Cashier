import { api } from '../lib/axios';
import type {
  FinancialAccount,
  FinancialAccountFormData,
  FinancialAccountListResponse,
  SingleFinancialAccountResponse,
  FinancialAccountSelectOptionsResponse,
} from '../types';

export const FINANCIAL_ACCOUNTS_KEY = 'financial_accounts';
export const FINANCIAL_ACCOUNTS_SELECT_OPTIONS_KEY = 'financial_accounts_select_options';

export const toFinancialAccountFormData = (
  payload: FinancialAccountFormData,
  method: 'POST' | 'PUT' = 'POST'
): FormData => {
  const formData = new FormData();
  formData.append('name[ar]', payload.name?.ar || '');
  formData.append('name[en]', payload.name?.en || '');
  formData.append('balance', String(payload.balance ?? 0));

  if (payload.icon instanceof File) {
    formData.append('icon', payload.icon);
  } else if (typeof payload.icon === 'string' && payload.icon.trim()) {
    formData.append('icon', payload.icon.trim());
  }

  if (payload.branch_id !== null && payload.branch_id !== undefined && payload.branch_id > 0) {
    formData.append('branch_id', String(payload.branch_id));
  }

  formData.append('status', payload.status ? '1' : '0');

  if (method === 'PUT') {
    formData.append('_method', 'PUT');
  }

  return formData;
};

export const financialAccountApi = {
  /** GET /api/admin/financial-accounts/select-options */
  getSelectOptions: async (): Promise<FinancialAccountSelectOptionsResponse> => {
    const { data } = await api.get<FinancialAccountSelectOptionsResponse>(
      '/api/admin/financial-accounts/select-options'
    );
    return data;
  },

  /** GET /api/admin/financial-accounts?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<FinancialAccountListResponse> => {
    const { data } = await api.get<FinancialAccountListResponse>(
      '/api/admin/financial-accounts',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/financial-accounts/:id */
  get: async (id: number | string): Promise<SingleFinancialAccountResponse> => {
    const { data } = await api.get<SingleFinancialAccountResponse>(
      `/api/admin/financial-accounts/${id}`
    );
    return data;
  },

  /** POST /api/admin/financial-accounts */
  create: async (payload: FinancialAccountFormData): Promise<FinancialAccount> => {
    const formData = toFinancialAccountFormData(payload, 'POST');
    const { data } = await api.post<{ data: FinancialAccount }>(
      '/api/admin/financial-accounts',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },

  /** PUT /api/admin/financial-accounts/:id */
  update: async (
    id: number | string,
    payload: FinancialAccountFormData
  ): Promise<FinancialAccount> => {
    const formData = toFinancialAccountFormData(payload, 'PUT');
    try {
      const { data } = await api.post<{ data: FinancialAccount }>(
        `/api/admin/financial-accounts/${id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data.data;
    } catch (err: any) {
      if (err?.response?.status === 405) {
        const { data } = await api.put<{ data: FinancialAccount }>(
          `/api/admin/financial-accounts/${id}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return data.data;
      }
      throw err;
    }
  },

  /** DELETE /api/admin/financial-accounts/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/financial-accounts/${id}`);
  },
};
