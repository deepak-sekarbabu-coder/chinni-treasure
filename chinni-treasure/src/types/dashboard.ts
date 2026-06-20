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
