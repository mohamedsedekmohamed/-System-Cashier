export interface OrderProductOptionItem {
  id?: number;
  order_p_variation_id?: number;
  option_id: number;
  name?: any;
  name_translations?: any[];
  price: number | string;
  option?: {
    id: number;
    name?: any;
    price?: string | number;
    status?: boolean;
    product_id?: number;
    variation_id?: number;
    created_at?: string;
    updated_at?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface OrderProductVariationItem {
  id?: number;
  order_product_id?: number;
  variation_id: number;
  name?: any;
  name_translations?: any[];
  variation?: {
    id: number;
    name?: any;
    status?: boolean;
    required?: boolean;
    product_id?: number;
    created_at?: string;
    updated_at?: string;
  };
  options: OrderProductOptionItem[];
  created_at?: string;
  updated_at?: string;
}

export interface OrderProductAddonItem {
  id?: number;
  addon_id: number;
  order_product_id?: number;
  name?: any;
  name_translations?: any[];
  price: number | string;
  addon?: {
    id: number;
    name?: any;
    image?: string;
    price?: string | number;
    tax_id?: number;
    discount_id?: number;
    kitchen_id?: number;
    created_at?: string;
    updated_at?: string;
  };
  created_at?: string;
  updated_at?: string;
}

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
  id?: number;
  order_id?: number;
  product_id: number;
  quantity?: number;
  name?: any;
  name_translations?: any[];
  price: number;
  is_gift?: boolean;
  note?: string;
  product?: {
    id: number;
    name?: any;
    description?: any;
    image?: string;
    price?: number;
    tax_id?: number;
    tax?: any;
    discount_id?: number;
    discount?: any;
    category_id?: number;
    category?: any;
    sub_category_id?: number;
    sub_category?: any;
    variations?: any[];
    created_at?: string;
    updated_at?: string;
  };
  variations: OrderProductVariationItem[] | OrderVariation[] | any[];
  addons: OrderProductAddonItem[] | OrderAddon[] | any[];
  created_at?: string;
  updated_at?: string;
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
  shift_name?: string | null;
  shift?: {
    id: number;
    name?: any;
    start_time?: string;
    end_time?: string;
    branch_id?: number;
    is_tomorrow?: boolean;
    branch?: any;
    created_at?: string;
    updated_at?: string;
  } | null;
  cashier_id: number | null;
  cashier?: {
    id: number;
    name?: string;
    cashier_man_id?: number;
    cashier_man?: string;
    cashier_man_name?: string;
    status?: string;
    branch_id?: number;
    branch?: any;
    created_at?: string;
    updated_at?: string;
  } | null;
  cashier_man_id: number | null;
  cashier_man?: {
    id: number;
    name?: string;
    cashier_id?: number;
    branch_id?: number;
    shift_id?: number;
    role?: string;
    branch?: any;
    cashier?: any;
    shift?: any;
    created_at?: string;
    updated_at?: string;
  } | null;
  hall_table_id: number | null;
  hall_table?: {
    id: number;
    code?: string;
    name?: string;
    branch_id?: number;
    branch?: any;
    hall_id?: number;
    hall?: {
      id: number;
      name?: any;
    };
    status?: boolean;
    qr?: string;
    created_at?: string;
    updated_at?: string;
  } | null;
  financial_account_id?: number | null;
  financial_id?: number | null;
  financial_account?: {
    id: number;
    name?: any;
    icon?: string;
    balance?: number;
    status?: boolean;
    is_cash?: boolean;
    branch_id?: number;
    branch?: any;
    created_at?: string;
    updated_at?: string;
  } | null;
  payment_method_id?: number | null;
  payment_method?: {
    id: number;
    name?: any;
    description?: any;
    icon?: string;
    status?: boolean;
    is_cash?: boolean;
    created_at?: string;
    updated_at?: string;
  } | null;
  receipt?: string | null;
  reciept?: string | null;
  delivery_id?: number | null;
  delivery?: {
    id: number;
    name?: string;
    phone?: string;
    id_images?: any[];
    branch_id?: number;
    branch?: any;
    created_at?: string;
    updated_at?: string;
  } | null;
  branch_id?: number | null;
  branch?: {
    id: number;
    name?: any;
    user_name?: string;
    address?: string;
    location?: any;
    watts?: string;
    facebook?: string;
    status?: boolean;
    role?: string;
    created_at?: string;
    updated_at?: string;
  } | null;
  module: OrderModule | string;
  status?: OrderStatus;
  address: string | null;
  lat?: number | null;
  lng?: number | null;
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
