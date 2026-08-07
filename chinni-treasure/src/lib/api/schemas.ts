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
  productId: z.string().nullable().optional(),
  product: z
    .object({
      name: z.string().nullable().optional(),
      sku: z.string().nullable().optional(),
      imageUrl: z.string().nullable().optional(),
      compareAtPrice: z.coerce.number().nullable().optional(),
    })
    .nullable()
    .optional(),
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

const TrackOrderResultSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: OrderStatusSchema,
  trackingId: z.string().nullable().optional(),
  totalAmount: z.coerce.number(),
  createdAt: z.string(),
  itemCount: z.number().optional(),
  items: z.array(OrderItemSchema).optional(),
});

export const TrackOrdersResponseSchema = z.array(TrackOrderResultSchema);

const ProductImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  isPrimary: z.boolean(),
  displayOrder: z.number(),
});

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.coerce.number(),
  compareAtPrice: z.coerce.number().nullable().optional(),
  imageUrl: z.string().nullable(),
  description: z.string().nullable(),
  stockQuantity: z.number(),
  badge: z.string().nullable(),
  category: z.object({ name: z.string() }).nullable(),
  categoryId: z.number().nullable(),
  sku: z.string().nullable(),
  isActive: z.boolean(),
  visibleHostnames: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  images: z.array(ProductImageSchema).optional(),
});

export const ProductsResponseSchema = z.object({
  products: z.array(ProductSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

const CatalogueProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.coerce.number(),
  compareAtPrice: z.coerce.number().nullable().optional(),
  imageUrl: z.string().nullable(),
  description: z.string().nullable(),
  category: z.object({ name: z.string() }).nullable(),
  stockQuantity: z.number(),
  badge: z.string().nullable(),
  sku: z.string().nullable(),
  images: z.array(ProductImageSchema).optional(),
});

const CatalogueProductsResponseSchema = z.union([
  z.object({ products: z.array(CatalogueProductSchema) }),
  z.array(CatalogueProductSchema),
]);

const StatsSchema = z.object({
  totalOrders: z.number(),
  pendingOrders: z.number(),
  approvedOrders: z.number(),
  packagingOrders: z.number(),
  shippedOrders: z.number(),
  deliveredOrders: z.number(),
  rejectedOrders: z.number(),
  totalRevenue: z.number(),
});

const ChartPointSchema = z.object({
  date: z.string(),
  orders: z.number(),
  revenue: z.number(),
});

const ProductSalesSchema = z.object({
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
  transactionId: z.string().optional(),
  customerNotes: z.string().optional(),
});

export const UpdateOrderStatusInputSchema = z.object({
  status: OrderStatusSchema,
  trackingId: z.string().optional(),
  notes: z.string().optional(),
  expectedVersion: z.number().int().optional(),
});

export const UpdateTrackingInputSchema = z.object({
  trackingId: z.string().min(1, "Tracking ID is required"),
});

const ProductImageInputSchema = z.object({
  url: z.string().min(1, "Image URL is required"),
  isPrimary: z.boolean().optional().default(false),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export const ProductInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  compareAtPrice: z.coerce.number().positive("Compare at price must be positive").nullable().optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional(),
  badge: z.string().nullable().optional(),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  visibleHostnames: z.string().optional(),
  images: z.array(ProductImageInputSchema).optional(),
});

const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  displayOrder: z.number(),
  isActive: z.boolean().optional(),
  description: z.string().nullable().optional(),
  productCount: z.number().optional(),
});

export const CategoriesResponseSchema = z.array(CategorySchema);

// Full category shape returned by admin management + detail endpoints.
export const CategoryDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  displayOrder: z.number(),
  isActive: z.boolean(),
  productCount: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case (lowercase, digits, hyphens)")
    .optional(),
  description: z.string().max(2000).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case (lowercase, digits, hyphens)")
    .optional(),
  description: z.string().max(2000).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ---- Latest product per active category ----

const LatestCategoryProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.coerce.number(),
  compareAtPrice: z.coerce.number().nullable().optional(),
  imageUrl: z.string().nullable(),
  description: z.string().nullable(),
  stockQuantity: z.number(),
  badge: z.string().nullable(),
  images: z.array(ProductImageSchema).optional(),
});

export const LatestCategorySectionSchema = z.object({
  category: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
  }),
  product: LatestCategoryProductSchema,
});

export const LatestCategoriesResponseSchema = z.array(LatestCategorySectionSchema);

export const CategoryProductsResponseSchema = z.object({
  category: CategoryDetailSchema,
  products: z.array(ProductSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
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
type CatalogueProductsResponse = z.infer<
  typeof CatalogueProductsResponseSchema
>;
export type Stats = z.infer<typeof StatsSchema>;
export type ChartPoint = z.infer<typeof ChartPointSchema>;
export type ProductSales = z.infer<typeof ProductSalesSchema>;
export type StatsResponse = z.infer<typeof StatsResponseSchema>;
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export const CreateRazorpayOrderInputSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3).default("INR"),
  receipt: z.string().optional(),
});
export type CreateRazorpayOrderInput = z.infer<typeof CreateRazorpayOrderInputSchema>;

export const CreateRazorpayOrderResponseSchema = z.object({
  order_id: z.string(),
  amount: z.number(),
  currency: z.string(),
});
export type CreateRazorpayOrderResponse = z.infer<typeof CreateRazorpayOrderResponseSchema>;

export const VerifyRazorpayPaymentInputSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
export type VerifyRazorpayPaymentInput = z.infer<typeof VerifyRazorpayPaymentInputSchema>;

export const VerifyRazorpayPaymentResponseSchema = z.object({
  ok: z.boolean(),
  order_id: z.string().optional(),
  payment_id: z.string().optional(),
});
export type VerifyRazorpayPaymentResponse = z.infer<typeof VerifyRazorpayPaymentResponseSchema>;
export type UpdateOrderStatusInput = z.infer<
  typeof UpdateOrderStatusInputSchema
>;
export type UpdateTrackingInput = z.infer<typeof UpdateTrackingInputSchema>;
export type ProductInput = z.infer<typeof ProductInputSchema>;
type ProductImage = z.infer<typeof ProductImageSchema>;
type ProductImageInput = z.infer<typeof ProductImageInputSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;
export type CategoryDetail = z.infer<typeof CategoryDetailSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
type LatestCategoryProduct = z.infer<typeof LatestCategoryProductSchema>;
export type LatestCategorySection = z.infer<typeof LatestCategorySectionSchema>;
export type LatestCategoriesResponse = z.infer<typeof LatestCategoriesResponseSchema>;
export type CategoryProductsResponse = z.infer<typeof CategoryProductsResponseSchema>;
