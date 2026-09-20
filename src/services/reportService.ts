import { api } from '../lib/axios';
import type {
  StartShiftSelectOptionsResponse,
  StartShiftReportResponse,
  StartShiftReportParams,
} from '../types';

export const START_SHIFTS_REPORT_KEY = 'start_shifts_report';
export const START_SHIFTS_SELECT_OPTIONS_KEY = 'start_shifts_select_options';

export const reportService = {
  /** GET /api/admin/reports/start-shifts/select-options */
  getStartShiftSelectOptions: async (lang?: string): Promise<StartShiftSelectOptionsResponse> => {
    const params: Record<string, any> = {};
    if (lang) params.lang = lang;

    const { data } = await api.get<StartShiftSelectOptionsResponse>(
      '/api/admin/reports/start-shifts/select-options',
      { params }
    );
    return data;
  },

  /** GET /api/admin/reports/start-shifts */
  getStartShiftsReport: async (params: StartShiftReportParams): Promise<StartShiftReportResponse> => {
    const cleanParams: Record<string, any> = {
      page: params.page ?? 1,
      per_page: params.per_page ?? 15,
    };

    if (params.branch_id) cleanParams.branch_id = params.branch_id;
    if (params.cashier_id) cleanParams.cashier_id = params.cashier_id;
    if (params.cashier_man_id) cleanParams.cashier_man_id = params.cashier_man_id;
    if (params.start) cleanParams.start = params.start;
    if (params.end) cleanParams.end = params.end;
    if (params.lang) cleanParams.lang = params.lang;

    const { data } = await api.get<StartShiftReportResponse>(
      '/api/admin/reports/start-shifts',
      { params: cleanParams }
    );
    return data;
  },
};
