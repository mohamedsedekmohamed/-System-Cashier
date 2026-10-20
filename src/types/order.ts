export interface OrderOption {
  option_id: number;
  price: number;
}

export interface OrderVariation {
  variation_id: number;
  options: OrderOption[];
}

export interface OrderAddon {
  addon_id: number;
  price: number;
}

export interface OrderProduct {
  product_id: number;
  price: number;
  note: string;
  variations: OrderVariation[];
  addons: OrderAddon[];
}

// أنواع الطلبات
export type OrderModule = 'delivery' | 'takeaway' | 'dinein';

// حالات الأوردر المتاحة
export type OrderStatus =
  | 'preparing'
  | 'done'
  | 'pickup'
  | 'out_of_delivery'
  | 'delivered'
  | 'return'
  | 'failed_to_delivered'
  | 'faild_to_delivered';

export interface Order {
  id: number;
  shift_id: number | null;
  cashier_id: number | null;
  cashier_man_id: number | null;
  hall_table_id: number | null;
  financial_account_id?: number | null;
  financial_account?: any | null;
  delivery_id?: number | null;
  delivery?: any | null;
  payment_method_id?: number | null;
  payment_method?: any | null;
  module: OrderModule | string;
  status?: OrderStatus;
  address: string | null;
  note: string | null;
  phone: string | null;
  name: string | null;
  is_pos: boolean;
  paid: boolean;
  total: number;
  total_tax: number;
  total_discount: number;
  final_price: number;
  products: OrderProduct[];
  created_at?: string;
  updated_at?: string;
}

export interface OrderFormData {
  shift_id: number;
  cashier_id: number;
  cashier_man_id: number;
  hall_table_id: number | null;
  financial_account_id?: number | null;
  delivery_id?: number | null;
  payment_method_id?: number | null;
  module: string;
  address: string;
  note: string;
  phone: string;
  name: string;
  is_pos: boolean;
  paid?: boolean;
  total: number;
  total_tax: number;
  total_discount: number;
  final_price: number;
  products: OrderProduct[];
}

export interface OrderSelectOptions {
  shifts: any[];
  branches: any[];
  cashiers: any[];
  cashier_men: any[];
  hall_tables: any[];
  financial_accounts?: any[];
  payment_methods?: any[];
  deliveries?: any[];
  products: any[];
  addons: any[];
}
