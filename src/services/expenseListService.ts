import { api } from '../lib/axios';
import type { 
  ExpenseList, 
  ExpenseListPayload, 
  ExpenseListResponse, 
  SingleExpenseListResponse 
} from '../types';

export const EXPENSE_LISTS_KEY = 'expense_lists';

export const expenseListApi = {
  /** GET /api/admin/expense-lists?page=&per_page= */
  list: async (page = 1, perPage = 10): Promise<ExpenseListResponse> => {
    const { data } = await api.get<ExpenseListResponse>(
      '/api/admin/expense-lists',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/expense-lists/:id */
  get: async (id: number | string): Promise<SingleExpenseListResponse> => {
    const { data } = await api.get<SingleExpenseListResponse>(`/api/admin/expense-lists/${id}`);
    return data;
  },

  /** POST /api/admin/expense-lists */
  create: async (payload: ExpenseListPayload): Promise<ExpenseList> => {
    const { data } = await api.post<{ data: ExpenseList }>('/api/admin/expense-lists', payload);
    return data.data;
  },

  /** PUT /api/admin/expense-lists/:id */
  update: async (id: number | string, payload: ExpenseListPayload): Promise<ExpenseList> => {
    const { data } = await api.put<{ data: ExpenseList }>(`/api/admin/expense-lists/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/expense-lists/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/expense-lists/${id}`);
  },
};
