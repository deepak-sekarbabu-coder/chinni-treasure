# Chinni Treasure — Little Love — Design Documentation

## 1. System Architecture
The application follows a **Next.js 16 App Router** architecture with server-side rendering (SSR), API routes, and PostgreSQL persistence via Prisma ORM.

### 1.1 Application Structure
- **Customer Pages (App Router):** 
    - `/` (`app/page.tsx`) — Homepage with hero section and featured products.
    - `/catalogue` (`app/catalogue/page.tsx`) — Full product catalogue grid.
    - `/order` (`app/order/page.tsx`) — Checkout with multi-step delivery form and order summary.
    - `/track` (`app/track/page.tsx`) — Order tracking with Order Number/Phone toggle.
    - `/confirmation/[id]` (`app/confirmation/[id]/page.tsx`) — Order success page with details.
- **Admin Pages (Protected by Middleware):** 
    - `/admin/login` (`app/admin/login/page.tsx`) — Administrative login portal.
    - `/admin` (`app/admin/page.tsx`) — Dashboard with analytics, order management, catalogue CRUD.
- **API Routes:** 
    - `/api/auth/*` — Login, logout, session validation.
    - `/api/products/*` — Product CRUD operations.
    - `/api/orders/*` — Order creation, listing, status updates.
    - `/api/track` — Order tracking by Order Number or phone.
    - `/api/stats` — Dashboard statistics for charts.
- **Core Components:** 
    - `CartProvider.tsx` — Cart context with `localStorage` persistence.
    - `ToastProvider.tsx` — Toast notification system.
    - `Navbar.tsx`, `Footer.tsx` — Layout components.
    - `ProductCard.tsx`, `StatusBadge.tsx`, `StockBadge.tsx` — UI components.
- **Style Engine:** `app/globals.css` (CSS variables, unified brand identity).
- **Database:** PostgreSQL with Prisma ORM (6 models: Category, Product, Order, OrderItem, OrderStatusHistory, Admin).

## 2. Data Model (Prisma Schema)

### 2.1 Product Model
```prisma
model Product {
  id            String       @id @default(uuid())
  sku           String?      @unique @db.VarChar(50)
  name          String       @db.VarChar(255)
  categoryId    Int?         @map("category_id")
  category      Category?    @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  description   String?
  price         Decimal      @db.Decimal(10, 2)
  stockQuantity Int          @default(0) @map("stock_quantity")
  imageUrl      String?      @db.VarChar(500) @map("image_url")
  badge         ProductBadge?
  isActive      Boolean      @default(true) @map("is_active")
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  orderItems    OrderItem[]
}
```

### 2.2 Order Model
```prisma
model Order {
  id            String              @id @default(uuid())
  orderNumber   String              @unique @map("order_number") @db.VarChar(20)
  customerName  String              @map("customer_name") @db.VarChar(255)
  customerEmail String              @map("customer_email") @db.VarChar(255)
  customerPhone String              @map("customer_phone") @db.VarChar(20)
  addressLine1  String              @map("address_line1") @db.VarChar(255)
  addressLine2  String?             @map("address_line2") @db.VarChar(255)
  city          String              @db.VarChar(100)
  stateCode     String              @map("state_code") @db.VarChar(2)
  postalCode    String              @map("postal_code") @db.VarChar(6)
  countryCode   String              @default("IN") @map("country_code") @db.VarChar(2)
  status        OrderStatus         @default(pending)
  trackingId    String?             @map("tracking_id") @db.VarChar(100)
  subtotal      Decimal             @map("subtotal") @db.Decimal(10, 2)
  shippingCost  Decimal             @default(0.00) @map("shipping_cost") @db.Decimal(10, 2)
  totalAmount   Decimal             @map("total_amount") @db.Decimal(10, 2)
  transactionId String?             @map("transaction_id") @db.VarChar(100)
  customerNotes String?             @map("customer_notes")
  adminNotes    String?             @map("admin_notes")
  createdAt     DateTime            @default(now()) @map("created_at")
  updatedAt     DateTime            @updatedAt @map("updated_at")
  items         OrderItem[]
  statusHistory OrderStatusHistory[]
}
```

### 2.3 Cart State (Client-Side localStorage)
```typescript
interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  quantity: number;
}
// Stored in localStorage key: 'luxe_cart'
```

## 3. UI/UX Design System

### 3.1 Color Palette (CSS Variables)
- **Primary (Gold):** `--gold: #d4af37`, `--gold-dark: #b8960f` (Elegance, Craftsmanship).
- **Gold Light:** `--gold-light: #f0d68a` (Highlights, hover states).
- **Secondary (Dark):** `--black: #0d0d0d`, `--near-black: #1a1a1a` (Luxury, Contrast).
- **Background (Cream):** `--cream: #f5f0e8`, `--cream-light: #faf7f2` (Warmth, Premium feel).
- **Text:** `--text-muted: #707070`, `--text-charcoal: #3a3a3a`.
- **Accent (Success):** `#2ecc71` (Green for success states).
- **Accent (Error):** `#e74c3c` (Red for errors).
- **Accent (Warning):** `#f39c12` (Orange for pending/warning states).

### 3.2 Typography (via next/font)
- **Headings:** `Playfair Display` (Serif) — `var(--font-serif)`.
- **Body:** `Montserrat` (Sans-Serif) — `var(--font-sans)`.

### 3.3 Interactive Components
- **Input Restrictions:** Phone limited to 10 digits, PIN code to 6 digits via onChange handlers.
- **Form Feedback:** Inline red error states (`.form-error`) and ToastProvider notifications.
- **Modals:** OrderDetailModal for order details, admin product edit modals.
- **Tabs:** Sticky tab navigation in admin dashboard.
- **Loading States:** LoadingSpinner component with fade-in animations.
- **Toast Notifications:** ToastProvider with success/error variants, auto-dismiss.

## 4. Key Logic Flows

### 4.1 Stock Management
- **Deduction:** Occurs server-side in `POST /api/orders` after validating stock availability.
- **Prevention:** CartProvider checks stock before adding; ProductCard disables button for out-of-stock.
- **Restoration:** Automatic via Prisma transaction when order status is set to `rejected` in `PUT /api/orders/[id]/status`.
- **Visual Indicators:** 
    - StockBadge component shows "In Stock" (green), "Low Stock" (orange for ≤3), "Out of Stock" (red).

### 4.2 Order Tracking (API: GET /api/track)
- **Input Methods:**
    - Order Number: Partial matching (case-insensitive) via SQL `ILIKE`.
    - Phone Number: Exact 10-digit match.
- **Process:** 
    - Client-side toggle between search methods.
    - Validation before API call.
    - Results sorted by createdAt DESC.
- **Detail View:** OrderDetailModal component displays status timeline from OrderStatusHistory.

### 4.3 Order Status Flow (Server-Side)
```
pending → approved → packaging → shipped → delivered
   ↓
rejected (stock restored via transaction)
```
- **Tracking ID Required:** When advancing to `shipped`, API requires `trackingId` field.
- **Status History:** Every status change logged in `OrderStatusHistory` table.

### 4.4 Admin Dashboard
- **Authentication:** JWT stored in httpOnly cookie (`session`), verified by middleware.ts.
- **Analytics:** Stats API returns data for Chart.js visualization (orders over time, revenue, product sales).
- **Order Management:**
    - Status filter buttons query API with status parameter.
    - OrderDetailModal shows full order with status timeline.
    - Advance/Reject actions call `PUT /api/orders/[id]/status`.
- **Catalogue Management:**
    - Products table with CRUD operations via `/api/products` endpoints.
    - Create/Update via POST/PUT with validation.
    - Soft delete via `isActive` flag.

## 5. Security & Validation

### 5.1 XSS Protection
- Server-side input sanitization not required due to React's automatic escaping.
- Database inputs validated via Zod schemas in API routes.

### 5.2 Form Validation
- **Email:** Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- **Phone:** Exactly 10 digits enforced via `.replace(/\D/g, '').slice(0, 10)`.
- **PIN Code:** Exactly 6 digits enforced via `.replace(/\D/g, '').slice(0, 6)`.
- **Required Fields:** Validated client-side before submission; re-validated server-side in API routes.

### 5.3 Authentication & Authorization
- **JWT Tokens:** Signed with `JWT_SECRET`, stored in httpOnly cookies.
- **Password Hashing:** bcryptjs used for admin password hashing.
- **Middleware:** Protects all `/admin/*` routes except `/admin/login`.
- **Session Verification:** `GET /api/auth/me` validates token and returns admin session.

### 5.4 State Persistence
- **Cart:** localStorage key `luxe_cart` synced with CartProvider context.
- **Orders:** Persisted in PostgreSQL via Prisma.
- **Products:** Persisted in PostgreSQL via Prisma.
- **Admin Session:** httpOnly cookie with JWT token (session-only, no expiration).
