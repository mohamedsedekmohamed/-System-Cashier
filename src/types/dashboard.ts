export interface DashboardProductItem {
  id: number;
  name: {
    ar: string;
    en: string;
  };
  description?: {
    ar?: string | null;
    en?: string | null;
  } | null;
  image?: string | null;
  price: number;
  stock?: number;
  tax_id?: number | null;
  discount_id?: number | null;
  category_id?: number | null;
  sub_category_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardTopProduct {
  product_id: number;
  product_name: {
    ar: string;
    en: string;
  };
  total_quantity: number;
  product?: DashboardProductItem;
}

export interface DashboardMonthlyOrder {
  month: number;
  month_name: string;
  orders_count: number;
}

export interface DashboardMonthlyFinalPrice {
  month: number;
  month_name: string;
  total_final_price: number;
}

export interface DashboardChartData {
  months: string[];
  orders_count: number[];
  final_price: number[];
}

export interface DashboardStats {
  year: number;
  total_orders: number;
  total_final_price: number;
  top_products: DashboardTopProduct[];
  monthly_orders: DashboardMonthlyOrder[];
  monthly_final_price: DashboardMonthlyFinalPrice[];
  chart?: DashboardChartData;
}

export interface DashboardResponse {
  status: boolean;
  data: DashboardStats;
}
