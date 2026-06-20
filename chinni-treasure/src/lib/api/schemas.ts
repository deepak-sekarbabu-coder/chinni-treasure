import { z } from "zod";

const OrderStatusSchema = z.enum([
  "pending",
  "approved",
  "packaging",
  "shipped",
  "delivered",
  "rejected",
]);

const OrderItemSchema = z.object({
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
  status: OrderStatusSchema,
  version: z.number().optional(),
  trackingId: z.string().nullable().optional(),
  totalAmount: z.coerce.number(),
  subtotal: z.coerce.number(),
  shippingCost: z.coerce.number(),
  createdAt: z.string(),
  transactionId: z.string().nullable().optional(),
  customerNotes: z.string().nullable().optional(),
  items: z.array(OrderItemSchema),
  addressLine1: z.string(),
  addressLine2: z.string().nullable().optional(),
  city: z.string(),
  stateCode: z.string(),
  postalCode: z.string(),
  countryCode: z.string().optional(),
});

export const OrdersResponseSchema = z.object({
  orders: z.array(OrderSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const TrackOrderResultSchema = OrderSchema.extend({
  itemCount: z.number().optional(),
});

export const TrackOrdersResponseSchema = z.array(TrackOrderResultSchema);

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
  updatedAt: z.string().optional(),
});

export const ProductsResponseSchema = z.object({
  products: z.array(ProductSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const CatalogueProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.coerce.number(),
  imageUrl: z.string(),
  description: z.string(),
  category: z.object({ name: z.string() }).nullable(),
  stockQuantity: z.number(),
  badge: z.string().nullable(),
});

export const CatalogueProductsResponseSchema = z.union([
  z.object({ products: z.array(CatalogueProductSchema) }),
  z.array(CatalogueProductSchema),
]);

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

const SessionSchema = z.object({
  authenticated: z.literal(true),
  id: z.string(),
  username: z.string(),
  role: z.enum(["admin", "super_admin"]),
});

const UnauthenticatedResponseSchema = z.object({
  authenticated: z.literal(false),
});

export const AuthMeResponseSchema = z.union([
  SessionSchema,
  UnauthenticatedResponseSchema,
]);

export const CreateOrderInputSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, "Product ID is required"),
        quantity: z.number().int().positive("Quantity must be a positive integer"),
      }),
    )
    .min(1, "At least one item is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  stateCode: z
    .string()
    .length(2, "State code must be 2 characters"),
  postalCode: z.string().regex(/^\d{6}$/, "Postal code must be 6 digits"),
  transactionId: z.string().min(1, "Transaction ID is required"),
  customerNotes: z.string().optional(),
});

export const UpdateOrderStatusInputSchema = z.object({
  status: OrderStatusSchema,
  trackingId: z.string().optional(),
  notes: z.string().optional(),
  expectedVersion: z.number().int().optional(),
});

export const ProductInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional(),
  badge: z.string().nullable().optional(),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
});

export const ApiErrorSchema = z.object({
  error: z.string().optional(),
  message: z.string().optional(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrdersResponse = z.infer<typeof OrdersResponseSchema>;
export type TrackOrderResult = z.infer<typeof TrackOrderResultSchema>;
export type TrackOrdersResponse = z.infer<typeof TrackOrdersResponseSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductsResponse = z.infer<typeof ProductsResponseSchema>;
export type CatalogueProduct = z.infer<typeof CatalogueProductSchema>;
export type CatalogueProductsResponse = z.infer<
  typeof CatalogueProductsResponseSchema
>;
export type Stats = z.infer<typeof StatsSchema>;
export type ChartPoint = z.infer<typeof ChartPointSchema>;
export type ProductSales = z.infer<typeof ProductSalesSchema>;
export type StatsResponse = z.infer<typeof StatsResponseSchema>;
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;
export type UpdateOrderStatusInput = z.infer<
  typeof UpdateOrderStatusInputSchema
>;
export type ProductInput = z.infer<typeof ProductInputSchema>;
