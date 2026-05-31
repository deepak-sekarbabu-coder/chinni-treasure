export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Chinni Treasure API",
    version: "1.0.0",
    description:
      "RESTful API for the Chinni Treasure — Little Love luxury e-commerce platform.\n\n" +
      "Supports product catalog browsing, order placement and tracking, admin dashboard analytics, " +
      "and secure JWT-based administrator authentication.",
    contact: {
      name: "Chinni Treasure",
    },
  },
  servers: [{ url: "/", description: "Local development" }],
  tags: [
    { name: "Authentication", description: "Admin login and session management" },
    { name: "Products", description: "Product catalog CRUD operations" },
    { name: "Orders", description: "Order placement, listing, and status management" },
    { name: "Tracking", description: "Public order tracking by order ID or phone" },
    { name: "Analytics", description: "Admin dashboard statistics" },
  ],
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Admin login",
        operationId: "adminLogin",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", description: "Admin username" },
                  password: { type: "string", description: "Admin password" },
                },
              },
              example: { username: "admin", password: "your-password" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful. Sets HttpOnly session cookie.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    username: { type: "string" },
                    role: { type: "string", enum: ["admin", "super_admin"] },
                  },
                },
              },
            },
          },
          "400": { description: "Missing required fields" },
          "401": { description: "Invalid credentials" },
          "429": {
            description: "Rate limited — 5 attempts per minute per IP",
            headers: {
              "Retry-After": { schema: { type: "integer" }, description: "Seconds until retry" },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Admin logout",
        operationId: "adminLogout",
        responses: {
          "200": {
            description: "Session cookie cleared",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Check current session",
        operationId: "getSession",
        responses: {
          "200": {
            description: "User is authenticated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    authenticated: { type: "boolean" },
                    id: { type: "string", format: "uuid" },
                    username: { type: "string" },
                    role: { type: "string" },
                  },
                },
              },
            },
          },
          "401": {
            description: "No valid session",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    authenticated: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "List active products",
        operationId: "listProducts",
        responses: {
          "200": {
            description: "Array of active products with category info",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Product" },
                },
              },
            },
            headers: {
              "Cache-Control": {
                schema: { type: "string" },
                description: "public, s-maxage=60",
              },
            },
          },
        },
      },
      post: {
        tags: ["Products"],
        summary: "Create a product (admin only)",
        operationId: "createProduct",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "price"],
                properties: {
                  sku: { type: "string", description: "Stock keeping unit" },
                  name: { type: "string", description: "Product name" },
                  categoryId: { type: "integer", nullable: true },
                  description: { type: "string", nullable: true },
                  price: { type: "number", description: "Product price" },
                  stockQuantity: { type: "integer", default: 0 },
                  imageUrl: { type: "string", nullable: true },
                  badge: {
                    type: "string",
                    enum: ["bestseller", "new", "premium", "limited", "luxury"],
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Product created successfully" },
          "400": { description: "Name and price are required" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/products/{id}": {
      put: {
        tags: ["Products"],
        summary: "Update a product (admin only)",
        operationId: "updateProduct",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  sku: { type: "string" },
                  name: { type: "string" },
                  categoryId: { type: "integer", nullable: true },
                  description: { type: "string", nullable: true },
                  price: { type: "number" },
                  stockQuantity: { type: "integer" },
                  imageUrl: { type: "string", nullable: true },
                  badge: {
                    type: "string",
                    enum: ["bestseller", "new", "premium", "limited", "luxury"],
                    nullable: true,
                  },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Product updated" },
          "401": { description: "Unauthorized" },
        },
      },
      delete: {
        tags: ["Products"],
        summary: "Soft-delete a product (admin only)",
        operationId: "deleteProduct",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Product deactivated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean" } },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/orders": {
      get: {
        tags: ["Orders"],
        summary: "List orders with pagination (admin only)",
        operationId: "listOrders",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1, minimum: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10, minimum: 1, maximum: 100 },
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "pending",
                "approved",
                "packaging",
                "shipped",
                "delivered",
                "rejected",
              ],
            },
            description: "Filter by order status",
          },
        ],
        responses: {
          "200": {
            description: "Paginated list of orders",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    orders: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Order" },
                    },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    totalPages: { type: "integer" },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Orders"],
        summary: "Place a new order (public)",
        operationId: "createOrder",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "customerName",
                  "customerEmail",
                  "customerPhone",
                  "addressLine1",
                  "city",
                  "stateCode",
                  "postalCode",
                  "transactionId",
                  "items",
                ],
                properties: {
                  customerName: { type: "string" },
                  customerEmail: { type: "string", format: "email" },
                  customerPhone: { type: "string", description: "10-digit phone" },
                  addressLine1: { type: "string" },
                  addressLine2: { type: "string", nullable: true },
                  city: { type: "string" },
                  stateCode: { type: "string", description: "2-letter Indian state code" },
                  postalCode: { type: "string", description: "6-digit PIN" },
                  transactionId: { type: "string" },
                  customerNotes: { type: "string", nullable: true },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid", description: "Product ID" },
                        quantity: { type: "integer", minimum: 1 },
                      },
                      required: ["id", "quantity"],
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Order created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Order" },
              },
            },
          },
          "400": { description: "Missing required fields or insufficient stock" },
          "404": { description: "Product not found" },
          "409": { description: "Conflict — retry your order" },
        },
      },
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get a single order by ID (public)",
        operationId: "getOrder",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Full order with items and status history",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OrderDetail" },
              },
            },
          },
          "404": { description: "Order not found" },
        },
      },
    },
    "/api/orders/{id}/status": {
      patch: {
        tags: ["Orders"],
        summary: "Update order status (admin only)",
        operationId: "updateOrderStatus",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: [
                      "approved",
                      "packaging",
                      "shipped",
                      "delivered",
                      "rejected",
                    ],
                  },
                  trackingId: {
                    type: "string",
                    description: "Required when status is 'shipped'",
                  },
                  notes: { type: "string" },
                  expectedVersion: {
                    type: "integer",
                    description: "For optimistic concurrency control",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Order status updated" },
          "400": {
            description: "Tracking ID required for shipped, or invalid transition",
          },
          "401": { description: "Unauthorized" },
          "404": { description: "Order not found" },
          "409": {
            description:
              "Version conflict — order was modified by another request",
          },
        },
      },
    },
    "/api/stats": {
      get: {
        tags: ["Analytics"],
        summary: "Dashboard statistics (admin only)",
        operationId: "getDashboardStats",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "Dashboard stats, chart data, and product sales",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    stats: {
                      type: "object",
                      properties: {
                        totalOrders: { type: "integer" },
                        pendingOrders: { type: "integer" },
                        approvedOrders: { type: "integer" },
                        packagingOrders: { type: "integer" },
                        shippedOrders: { type: "integer" },
                        deliveredOrders: { type: "integer" },
                        rejectedOrders: { type: "integer" },
                        totalRevenue: { type: "number" },
                      },
                    },
                    chartData: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          date: { type: "string" },
                          orders: { type: "integer" },
                          revenue: { type: "number" },
                        },
                      },
                    },
                    productSalesData: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          productName: { type: "string" },
                          quantity: { type: "integer" },
                          revenue: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/track": {
      get: {
        tags: ["Tracking"],
        summary: "Track orders by order number or phone (public)",
        operationId: "trackOrder",
        parameters: [
          {
            name: "orderId",
            in: "query",
            schema: { type: "string" },
            description: "Partial order number search (case-insensitive)",
          },
          {
            name: "phone",
            in: "query",
            schema: { type: "string" },
            description: "Customer phone number search",
          },
        ],
        responses: {
          "200": {
            description: "Matching orders with item details",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      orderNumber: { type: "string" },
                      customerName: { type: "string" },
                      customerEmail: { type: "string" },
                      customerPhone: { type: "string" },
                      status: { type: "string" },
                      trackingId: { type: "string", nullable: true },
                      totalAmount: { type: "number" },
                      subtotal: { type: "number" },
                      shippingCost: { type: "number" },
                      createdAt: { type: "string", format: "date-time" },
                      transactionId: { type: "string", nullable: true },
                      customerNotes: { type: "string", nullable: true },
                      addressLine1: { type: "string" },
                      city: { type: "string" },
                      stateCode: { type: "string" },
                      postalCode: { type: "string" },
                      itemCount: { type: "integer" },
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string", format: "uuid" },
                            productName: { type: "string" },
                            unitPrice: { type: "number" },
                            quantity: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Provide orderId or phone parameter",
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "session",
        description: "JWT session cookie set after admin login",
      },
    },
    schemas: {
      Product: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          sku: { type: "string", nullable: true },
          name: { type: "string" },
          categoryId: { type: "integer", nullable: true },
          category: {
            type: "object",
            nullable: true,
            properties: {
              name: { type: "string" },
            },
          },
          description: { type: "string", nullable: true },
          price: { type: "number" },
          stockQuantity: { type: "integer" },
          imageUrl: { type: "string", nullable: true },
          badge: {
            type: "string",
            enum: ["bestseller", "new", "premium", "limited", "luxury"],
            nullable: true,
          },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          orderNumber: { type: "string" },
          customerName: { type: "string" },
          customerEmail: { type: "string" },
          customerPhone: { type: "string" },
          addressLine1: { type: "string" },
          addressLine2: { type: "string", nullable: true },
          city: { type: "string" },
          stateCode: { type: "string" },
          postalCode: { type: "string" },
          countryCode: { type: "string" },
          status: { type: "string" },
          trackingId: { type: "string", nullable: true },
          subtotal: { type: "number" },
          shippingCost: { type: "number" },
          totalAmount: { type: "number" },
          transactionId: { type: "string", nullable: true },
          customerNotes: { type: "string", nullable: true },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                productId: { type: "string", nullable: true },
                productName: { type: "string" },
                unitPrice: { type: "number" },
                quantity: { type: "integer" },
              },
            },
          },
          version: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      OrderDetail: {
        allOf: [
          { $ref: "#/components/schemas/Order" },
          {
            type: "object",
            properties: {
              statusHistory: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    status: { type: "string" },
                    notes: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
} as const;
