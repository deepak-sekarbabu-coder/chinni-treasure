export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  transactionId: string;
  notes: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  packagingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  rejectedOrders: number;
  totalRevenue: number;
}

export interface ChartDataPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface ProductSalesData {
  productName: string;
  quantity: number;
  revenue: number;
}
