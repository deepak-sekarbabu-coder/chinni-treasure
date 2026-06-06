import { z } from "zod";

export const StatsSchema = z.object({
  totalOrders: z.number(),
  pendingOrders: z.number(),
  approvedOrders: z.number(),
  packagingOrders: z.number(),
  shippedOrders: z.number(),
  deliveredOrders: z.number(),
  rejectedOrders: z.number(),
  totalRevenue: z.number(),
});

export const ChartPointSchema = z.object({
  date: z.string(),
  orders: z.number(),
  revenue: z.number(),
});

export const ProductSalesSchema = z.object({
  productName: z.string(),
  quantity: z.number(),
  revenue: z.number(),
});

export const StatsResponseSchema = z.object({
  stats: StatsSchema,
  chartData: z.array(ChartPointSchema),
  productSalesData: z.array(ProductSalesSchema),
});

export const OrderItemSchema = z.object({
  id: z.string(),
  productName: z.string(),
  unitPrice: z.coerce.number(),
  quantity: z.number(),
});

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string(),
  status: z.string(),
  version: z.number(),
  trackingId: z.string().nullable().optional(),
  totalAmount: z.coerce.number(),
  subtotal: z.coerce.number(),
  shippingCost: z.coerce.number(),
  createdAt: z.string(),
  transactionId: z.string().nullable().optional(),
  customerNotes: z.string().nullable().optional(),
  items: z.array(OrderItemSchema),
  addressLine1: z.string(),
  city: z.string(),
  stateCode: z.string(),
  postalCode: z.string(),
});

export const OrdersResponseSchema = z.object({
  orders: z.array(OrderSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.coerce.number(),
  imageUrl: z.string(),
  description: z.string(),
  stockQuantity: z.number(),
  badge: z.string().nullable(),
  category: z.object({ name: z.string() }).nullable(),
  categoryId: z.number().nullable(),
  sku: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ProductsResponseSchema = z.object({
  products: z.array(ProductSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type StatsResponse = z.infer<typeof StatsResponseSchema>;
export type OrdersResponse = z.infer<typeof OrdersResponseSchema>;
export type ProductsResponse = z.infer<typeof ProductsResponseSchema>;
