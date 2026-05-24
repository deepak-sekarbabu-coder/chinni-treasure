# Chinni Treasure — Next.js Migration Plan

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Foundation: App Router & Database Layers](#4-foundation-app-router--database-layers)
5. [Auth System](#5-auth-system)
6. [Page-by-Page Migration Plan](#6-page-by-page-migration-plan)
7. [State & Cart Strategy](#7-state--cart-strategy)
8. [CSS & Styling Approach](#8-css--styling-approach)
9. [Data Migration from localStorage](#9-data-migration-from-localstorage)
10. [Deployment to Vercel](#10-deployment-to-vercel)
11. [Migration Phases & Ordering](#11-migration-phases--ordering)

---

## 1. Architecture Overview

**Current (Vanilla JS):**
- 7 static HTML pages
- Single `main.js` (1600 lines) — all logic, rendering, and state management
- `localStorage` for persistence (products, cart, orders)
- `sessionStorage` for admin auth
- Hardcoded admin credentials

**Target (Next.js 14+ App Router):**
- Server Components for static/catalogue pages (fast, SEO-friendly)
- Client Components for interactive parts (cart, admin, checkout)
- PostgreSQL via Prisma ORM for all data persistence
- Server Actions for mutations (add to cart, place order, update status)
- API Routes for external-facing endpoints (tracking, order lookup)
- JWT-based admin authentication with bcrypt password hashing
- React Context + cookies for cart state (guest-friendly)

**Key Architectural Decisions:**
| Decision | Rationale |
|----------|-----------|
| App Router over Pages Router | Server Components, layouts, streaming |
| Prisma over Drizzle | Mature migration tooling, excellent Vercel integration |
| Server Actions over REST for mutations | Colocated logic, progressive enhancement |
| JWT stored in httpOnly cookies | Secure, works with SSR, no CSRF risk |
| Guest cart in cookies | No forced signup, survives page reload |
| Chart.js on client only | Charting is inherently client-side |

---

## 2. Technology Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| **Framework** | Next.js 14+ (App Router) | Vercel-native, SSR, Server Components |
| **Language** | TypeScript (strict) | Type safety across full stack |
| **Database** | PostgreSQL (Vercel Postgres / Neon) | Serverless-ready, pgBouncer compatible |
| **ORM** | Prisma | Schema-first, migrations, great DX |
| **Auth** | next-auth v5 (Auth.js) or custom JWT | Battle-tested, supports JWT strategy |
| **Auth Password** | bcrypt (via bcryptjs) | Industry standard |
| **Cart State** | React Context + cookie-based persistence | Guest-friendly, SSR-safe |
| **Styling** | CSS Modules (migrate from style.css) + CSS variables | Zero-cost migration, preserved design tokens |
| **Charts** | Chart.js (client-only dynamic import) | Same library, no rewrites |
| **Forms** | react-hook-form + zod | Validation-schema-driven, Server Action compatible |
| **Payment** | Manual (Transaction ID entry — same as current) | No gateway integration needed |
| **Hosting** | Vercel (Pro or Hobby) | Optimized for Next.js, Postgres + Blob storage |

---

## 3. Project Structure

```
chinni-treasure-next/
|
+-- .env.local                    # DATABASE_URL, JWT_SECRET, etc.
+-- prisma/
|   +-- schema.prisma             # Database schema
|   +-- seed.ts                   # Seed script (6 default products, admin)
|   +-- migrations/               # Auto-generated
|
+-- src/
|   +-- app/
|   |   +-- layout.tsx            # Root layout (navbar, footer, toast provider)
|   |   +-- page.tsx              # Homepage (hero + featured products)
|   |   +-- loading.tsx           # Root loading state
|   |   +-- error.tsx             # Root error boundary
|   |   |
|   |   +-- catalogue/
|   |   |   +-- page.tsx          # Product grid (Server Component)
|   |   |   +-- loading.tsx
|   |   |
|   |   +-- order/
|   |   |   +-- page.tsx          # Checkout page (Client Component)
|   |   |
|   |   +-- confirmation/
|   |   |   +-- [id]
|   |   |   |   +-- page.tsx      # Order confirmation (Server Component)
|   |   |
|   |   +-- track/
|   |   |   +-- page.tsx          # Order tracking (Client Component)
|   |   |
|   |   +-- admin/
|   |   |   +-- layout.tsx        # Auth guard layout
|   |   |   +-- page.tsx          # Admin dashboard (Client Component)
|   |   |   +-- login/
|   |   |   |   +-- page.tsx      # Login form (Client Component)
|   |   |
|   |   +-- api/
|   |       +-- auth/
|   |       |   +-- login/route.ts
|   |       |   +-- logout/route.ts
|   |       |   +-- me/route.ts
|   |       |
|   |       +-- products/route.ts
|   |       +-- products/[id]/route.ts
|   |       +-- orders/route.ts
|   |       +-- orders/[id]/route.ts
|   |       +-- track/
|   |           +-- order-id/route.ts
|   |           +-- phone/route.ts
|   |
|   +-- components/
|   |   +-- layout/
|   |   |   +-- Navbar.tsx
|   |   |   +-- Footer.tsx
|   |   |   +-- LoadingScreen.tsx
|   |   |
|   |   +-- product/
|   |   |   +-- ProductCard.tsx
|   |   |   +-- ProductGrid.tsx
|   |   |   +-- ProductModal.tsx      # Admin CRUD
|   |   |
|   |   +-- cart/
|   |   |   +-- CartDropdown.tsx
|   |   |   +-- CartSummary.tsx       # Sidebar on order page
|   |   |   +-- CartProvider.tsx      # React Context provider
|   |   |   +-- AddToCartButton.tsx
|   |   |
|   |   +-- order/
|   |   |   +-- OrderForm.tsx
|   |   |   +-- OrderDetailModal.tsx
|   |   |   +-- OrderTimeline.tsx
|   |   |   +-- TrackingIdModal.tsx
|   |   |
|   |   +-- admin/
|   |   |   +-- StatsCards.tsx
|   |   |   +-- OrderTable.tsx
|   |   |   +-- FilterButtons.tsx
|   |   |   +-- CatalogueTable.tsx
|   |   |   +-- Charts.tsx            # Client only, dynamic import
|   |   |
|   |   +-- ui/
|   |       +-- Toast.tsx             # Toast container + provider
|   |       +-- Modal.tsx             # Reusable modal component
|   |       +-- StatusBadge.tsx       # Order status badge
|   |       +-- StockBadge.tsx        # In-stock / low / out badge
|   |       +-- FormField.tsx         # Reusable form input with validation
|   |
|   +-- lib/
|   |   +-- prisma.ts                 # Singleton Prisma client
|   |   +-- auth.ts                   # JWT helpers (sign, verify, hash)
|   |   +-- constants.ts              # ORDER_STATUS_FLOW, labels, icons
|   |   +-- utils.ts                  # sanitizeHTML, sanitizeInput, formatting
|   |
|   +-- actions/
|   |   +-- auth-actions.ts           # login, logout, getSession
|   |   +-- product-actions.ts        # create, update, delete product
|   |   +-- order-actions.ts          # submitOrder, advanceStatus, rejectOrder
|   |   +-- cart-actions.ts           # addToCart, removeFromCart, updateQty
|   |
|   +-- validations/
|   |   +-- order-schema.ts           # Zod schema for order form
|   |   +-- product-schema.ts         # Zod schema for product CRUD
|   |   +-- auth-schema.ts            # Zod schema for login
|   |
|   +-- types/
|   |   +-- index.ts                  # Prisma-generated types + custom types
|   |
|   +-- styles/
|       +-- globals.css               # CSS variables, reset, base styles
|       +-- Navbar.module.css
|       +-- ProductCard.module.css
|       +-- OrderForm.module.css
|       +-- Admin.module.css
|       +-- Track.module.css
|       +-- Modal.module.css
|       +-- Toast.module.css
|
+-- public/
|   +-- favicon.ico
|   +-- manifest.json
|   +-- sw.js                         # Service worker (simplified)
|   +-- icons/
|
+-- middleware.ts                     # Admin route protection
+-- next.config.ts
+-- package.json
+-- tsconfig.json
+-- vercel.json
```

---

## 4. Foundation: App Router & Database Layers

### 4.1 Prisma Schema

Refer to [`database-schema.md`](./database-schema.md) for the full schema — it maps 1:1 to Prisma models.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OrderStatus {
  pending
  approved
  packaging
  shipped
  delivered
  rejected
}

enum ProductBadge {
  bestseller
  new
  premium
  limited
  luxury
}

enum AdminRole {
  admin
  super_admin
}

model Category {
  id            Int      @id @default(autoincrement())
  name          String   @db.VarChar(100)
  slug          String   @unique @db.VarChar(100)
  description   String?
  displayOrder  Int      @default(0) @map("display_order")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  products      Product[]

  @@map("categories")
}

model Product {
  id            String        @id @default(uuid())
  sku           String?       @unique @db.VarChar(50)
  name          String        @db.VarChar(255)
  categoryId    Int?          @map("category_id")
  category      Category?     @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  description   String?
  price         Decimal       @db.Decimal(10, 2)
  stockQuantity Int           @default(0) @map("stock_quantity")
  imageUrl      String?       @db.VarChar(500) @map("image_url")
  badge         ProductBadge?
  isActive      Boolean       @default(true) @map("is_active")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")
  orderItems    OrderItem[]

  @@index([categoryId])
  @@index([isActive])
  @@index([badge])
  @@map("products")
}

model Order {
  id              String          @id @default(uuid())
  orderNumber     String          @unique @map("order_number") @db.VarChar(20)
  customerName    String          @map("customer_name") @db.VarChar(255)
  customerEmail   String          @map("customer_email") @db.VarChar(255)
  customerPhone   String          @map("customer_phone") @db.VarChar(20)
  addressLine1    String          @map("address_line1") @db.VarChar(255)
  addressLine2    String?         @map("address_line2") @db.VarChar(255)
  city            String          @db.VarChar(100)
  stateCode       String          @map("state_code") @db.VarChar(2)
  postalCode      String          @map("postal_code") @db.VarChar(6)
  countryCode     String          @default("IN") @map("country_code") @db.VarChar(2)
  status          OrderStatus     @default(pending)
  trackingId      String?         @map("tracking_id") @db.VarChar(100)
  subtotal        Decimal         @map("subtotal") @db.Decimal(10, 2)
  shippingCost    Decimal         @default(0.00) @map("shipping_cost") @db.Decimal(10, 2)
  totalAmount     Decimal         @map("total_amount") @db.Decimal(10, 2)
  transactionId   String?         @map("transaction_id") @db.VarChar(100)
  customerNotes   String?         @map("customer_notes")
  adminNotes      String?         @map("admin_notes")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")
  items           OrderItem[]
  statusHistory   OrderStatusHistory[]

  @@index([orderNumber])
  @@index([status])
  @@index([customerEmail])
  @@index([customerPhone])
  @@index([createdAt])
  @@map("orders")
}

model OrderItem {
  id          String   @id @default(uuid())
  orderId     String   @map("order_id")
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String?  @map("product_id")
  product     Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  productName String   @map("product_name") @db.VarChar(255)
  unitPrice   Decimal  @map("unit_price") @db.Decimal(10, 2)
  quantity    Int
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

model OrderStatusHistory {
  id        String      @id @default(uuid())
  orderId   String      @map("order_id")
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  status    OrderStatus
  notes     String?
  createdAt DateTime    @default(now()) @map("created_at")

  @@index([orderId])
  @@index([createdAt])
  @@map("order_status_history")
}

model Admin {
  id           String      @id @default(uuid())
  username     String      @unique @db.VarChar(50)
  email        String      @unique @db.VarChar(255)
  passwordHash String      @map("password_hash")
  role         AdminRole   @default(admin)
  isActive     Boolean     @default(true) @map("is_active")
  lastLoginAt  DateTime?   @map("last_login_at")
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")

  @@index([username])
  @@map("admins")
}
```

### 4.2 Prisma Client Singleton

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 4.3 Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create categories
  await prisma.category.createMany({
    data: [
      { name: 'Accessories', slug: 'accessories', displayOrder: 1 },
      { name: 'Apparel', slug: 'apparel', displayOrder: 2 },
      { name: 'Watches', slug: 'watches', displayOrder: 3 },
      { name: 'Home', slug: 'home', displayOrder: 4 },
    ],
  });

  // Create 6 default products (same as current app)
  await prisma.product.createMany({
    data: [
      { /* ... same 6 products */ },
    ],
  });

  // Create admin with hashed password
  const hash = await bcrypt.hash('admin123', 12);
  await prisma.admin.create({
    data: { username: 'admin', email: 'admin@chinnitreasure.com', passwordHash: hash, role: 'super_admin' },
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

---

## 5. Auth System

### 5.1 Strategy: Custom JWT with next-auth (Auth.js)

**Why not a simpler approach?**
- Hardcoded credentials (`admin`/`admin123`) must be replaced with hashed passwords
- Session must survive SSR (Server Components need to know auth state)
- httpOnly cookies prevent XSS attacks
- next-auth v5 gives us `getServerSession()` for free

### 5.2 Auth Flow

```
Login Form
  → POST /api/auth/login (validate credentials, bcrypt.compare)
  → Return JWT token in httpOnly cookie
  → middleware.ts checks cookie for /admin/* routes
  → Server Components use getServerSession() for conditional rendering
  → Client Components use a lightweight auth context

Logout
  → POST /api/auth/logout (clear cookie)
  → Redirect to /admin/login
```

### 5.3 Middleware (Route Protection)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  if (isAdminRoute && !isLoginPage && !token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

---

## 6. Page-by-Page Migration Plan

### 6.1 Homepage (`/` → `src/app/page.tsx`)

**Current:** `index.html` — Hero section + featured products grid + features section + CTA + footer

**Strategy:** Server Component (fully static, no client JS needed)

**Components to extract:**
- `HeroSection` — static
- `FeaturesGrid` — static
- `CTASection` — static
- The product grid uses `ProductGrid` Server Component — fetches from DB

**Data flow:** `ProductGrid` fetches all products via Prisma in a Server Component. The product card buttons ("Add to Cart") are Client Components that call `cart-actions.ts`.

```tsx
// src/app/page.tsx (Server Component)
import { prisma } from '@/lib/prisma';
import { ProductGrid } from '@/components/product/ProductGrid';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesGrid } from '@/components/FeaturesGrid';

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <>
      <HeroSection />
      <ProductGrid products={products} />
      <FeaturesGrid />
    </>
  );
}
```

### 6.2 Catalogue (`/catalogue` → `src/app/catalogue/page.tsx`)

**Current:** `catalogue.html` — Full product grid

**Strategy:** Server Component — identical to homepage's product grid but no featured section

**Changes from current:**
- Replace `renderProducts()` DOM manipulation with JSX

### 6.3 Order / Checkout (`/order` → `src/app/order/page.tsx`)

**Current:** `order.html` — Form + order summary sidebar, all in one page

**Strategy:** Client Component — needs form state, cart state, validation

**Components to extract:**
- `OrderForm` — react-hook-form + zod validation
- `CartSummary` — displays cart items with quantity controls

**Data flow:**
1. Cart items read from context/cookies on mount
2. Form submits via Server Action (`submitOrder`)
3. Server Action validates, creates order in DB, clears cart, redirects to `/confirmation/[id]`

### 6.4 Confirmation (`/confirmation/[id]` → `src/app/confirmation/[id]/page.tsx`)

**Current:** `confirmation.html?id=ORD-...` — reads order from localStorage by URL param

**Strategy:** Server Component — fetches order by ID from DB

**Changes from current:**
- Replace `renderConfirmation()` with JSX rendering from Prisma data
- URL changes from `?id=` to `/[id]` dynamic segment — cleaner and more SEO-friendly

### 6.5 Track Order (`/track` → `src/app/track/page.tsx`)

**Current:** `track.html` — Radio toggle between Order ID / Phone, search results rendered dynamically

**Strategy:** Client Component — needs form state, dynamic search results

**Data flow:**
1. User selects search method (Order ID or Phone)
2. Submits form → calls `searchOrders` Server Action
3. Results rendered in a list below the form
4. Clicking an order opens `OrderDetailModal`

### 6.6 Admin Dashboard (`/admin` → `src/app/admin/page.tsx`)

**Current:** `admin.html` — Tabs (Orders / Catalogue), stats cards, charts, tables, modals

**Strategy:** Client Component — heavily interactive, but data fetched via Server Components or initial fetch

**Sub-components:**
- `StatsCards` — fetches live counts from DB
- `Charts` — uses Chart.js, dynamically imported with `next/dynamic` + `{ ssr: false }`
- `OrderTable` — with filter buttons, rows clickable to open detail modal
- `CatalogueTable` — product list with Edit/Delete buttons
- `ProductModal` — Add/Edit product form (react-hook-form)

### 6.7 Admin Login (`/admin/login` → `src/app/admin/login/page.tsx`)

**Current:** `login.html` — Hardcoded `admin`/`admin123` check in JS

**Strategy:** Client Component with Server Action

**Data flow:**
1. `/admin/login/page.tsx` renders the form
2. Submit → Server Action `loginAction(email, password)`
3. Server Action validates against DB (bcrypt.compare)
4. On success: set httpOnly cookie, redirect to `/admin`
5. On failure: return error message, form shows validation error

---

## 7. State & Cart Strategy

### 7.1 The Guest Cart Problem

Current app stores cart in `localStorage` — works because it's all client-side. In Next.js:
- `localStorage` is not available during SSR
- Cart needs to survive page navigation (including SSR pages)
- Guest users should not be forced to register

**Solution: Cookie-Based Cart in React Context**

```
CartProvider (Client Component wrapper in root layout)
  → Reads cart from cookie on mount
  → Stores cart as a JSON cookie
  → Exposes: items, addItem, removeItem, updateQuantity, clearCart, getTotal
  → Cookie attributes: { httpOnly: false, sameSite: 'lax', maxAge: 30 days }
```

### 7.2 Cookie Cart Implementation

```typescript
// src/lib/cart-cookie.ts
import { cookies } from 'next/headers';
import { z } from 'zod';

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});
const cartSchema = z.array(cartItemSchema);

export type CartItem = z.infer<typeof cartItemSchema>;

const CART_COOKIE = 'cart';

export function getCartFromCookies(): CartItem[] {
  const cookieStore = cookies();
  const raw = cookieStore.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    return cartSchema.parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function setCartCookie(items: CartItem[]): string {
  return JSON.stringify(items);
}
```

```tsx
// src/components/cart/CartProvider.tsx
'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useCookies } from 'next-client-cookies';
import type { CartItem } from '@/lib/cart-cookie';

interface CartContextType {
  items: CartItem[];
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cookies = useCookies();
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(cookies.get('cart') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    cookies.set('cart', JSON.stringify(items), { maxAge: 2592000 });
  }, [items, cookies]);

  // ... addItem, removeItem, etc.
}
```

### 7.3 Cart on Server (For Stock Checks During Order)

On order submission, the Server Action receives the cart items directly from the form submission (the client sends the items). The server re-validates stock against the database before creating the order — preventing race conditions that localStorage could never handle.

### 7.4 Why Not Server-Side Cart?

Using cookies rather than a `cart` table avoids:
- Orphaned cart records from guest users
- Requiring authentication just to browse
- Complex cleanup jobs

For a luxury e-commerce prototype where most users are guests, cookie-based cart is the right tradeoff.

---

## 8. CSS & Styling Approach

### 8.1 Migration Strategy

Current `style.css` is 2551 lines with:
- CSS custom properties (design tokens)
- Component styles for all pages
- Responsive breakpoints
- Animations
- Dark mode

**Approach: Extract & Preserve**

1. **Keep all CSS variables** — move everything in `:root` from `style.css` to `src/styles/globals.css`
2. **Keep the reset, base, typography, and utility classes** — they're the same everywhere
3. **Split component styles** into CSS Modules:
   - Each component gets its own `.module.css`
   - One-time manual split, but then it's modular and tree-shakeable
4. **Global files** in `src/styles/`:

```
src/styles/
  globals.css        # CSS variables, reset, typography, utility classes
  Navbar.module.css
  ProductCard.module.css
  OrderForm.module.css
  Admin.module.css
  Track.module.css
  Modal.module.css
  Toast.module.css
  Footer.module.css
```

### 8.2 Example: ProductCard.module.css

```css
/* Extracted from style.css — unchanged selectors, just scoped */
.card {
  background: var(--bg-card);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}
/* ... rest of product card styles */
```

This preserves the entire visual design while gaining CSS Modules' scoping benefits.

---

## 9. Data Migration from localStorage

### 9.1 One-Time Migration Script

A standalone script (runnable via `npx tsx`) that:
1. Connects to the target PostgreSQL database
2. Reads exported JSON files (products.json, orders.json) from current app
3. Inserts into Prisma tables

```typescript
// scripts/migrate-from-localstorage.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function migrate() {
  // 1. Read exported data
  const products = JSON.parse(fs.readFileSync('./data/products.json', 'utf-8'));
  const orders = JSON.parse(fs.readFileSync('./data/orders.json', 'utf-8'));

  // 2. Insert categories (if not exists)
  // 3. Insert products
  for (const p of products) {
    await prisma.product.create({
      data: {
        id: String(p.id), // Keep same IDs for order references
        name: p.name,
        price: p.price,
        stockQuantity: p.stock,
        imageUrl: p.image,
        description: p.description,
        badge: p.badge?.toLowerCase() ?? null,
      },
    });
  }

  // 4. Insert orders with items
  for (const o of orders) {
    await prisma.order.create({
      data: {
        orderNumber: o.id,
        customerName: o.customer.name,
        customerEmail: o.customer.email,
        customerPhone: o.customer.phone,
        addressLine1: o.customer.address,
        city: o.customer.city,
        stateCode: o.customer.state,
        postalCode: o.customer.zip,
        countryCode: o.customer.country === 'IN' ? 'IN' : 'OTHER',
        status: o.status,
        trackingId: o.trackingId,
        subtotal: o.total,
        shippingCost: o.shipping,
        totalAmount: o.grandTotal,
        transactionId: o.transactionId,
        customerNotes: o.notes,
        createdAt: new Date(o.date),
        items: {
          create: o.items.map((item: any) => ({
            productId: String(item.productId),
            productName: products.find((p: any) => p.id === item.productId)?.name ?? 'Unknown',
            unitPrice: products.find((p: any) => p.id === item.productId)?.price ?? 0,
            quantity: item.quantity,
          })),
        },
        statusHistory: {
          create: {
            status: o.status,
            createdAt: new Date(o.date),
          },
        },
      },
    });
  }

  console.log(`Migrated ${products.length} products and ${orders.length} orders`);
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
```

### 9.2 Export from Current App

Add a one-time helper to the existing app to dump `localStorage` data:

```javascript
// In browser console on the current app:
const data = {
  products: JSON.parse(localStorage.getItem('luxe_products')),
  orders: JSON.parse(localStorage.getItem('luxe_orders')),
};
console.log(JSON.stringify(data, null, 2));
```

Copy the output, save to `data/products.json` and `data/orders.json`.

---

## 10. Deployment to Vercel

### 10.1. PostgreSQL Database

| Option | Notes |
|--------|-------|
| **Vercel Postgres (Neon)** | Direct integration, auto-provisioned, $0.60/hr compute credit |
| **Neon (standalone)** | Generous free tier (0.5 GB storage, 100 hr compute/mo) |
| **Supabase** | Free tier (500 MB, 2 GB disk) |

**Recommended:** Vercel Postgres — one-click provisioning from the Vercel dashboard, auto-injects `DATABASE_URL`, `POSTGRES_URL`, etc. into environment variables.

### 10.2. Vercel Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npx prisma generate && next build",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "functions": {
    "api/*": {
      "maxDuration": 10
    }
  }
}
```

### 10.3. Environment Variables

```env
# Vercel Postgres (auto-injected)
DATABASE_URL=postgres://...
POSTGRES_URL=postgres://...

# App secrets
JWT_SECRET=<generate via: openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=https://chinni-treasure.vercel.app
```

### 10.4. Database Migrations

```json
// package.json scripts
{
  "scripts": {
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:push": "prisma db push",
    "build": "prisma generate && next build"
  }
}
```

On Vercel, the `postinstall` hook runs automatically. For migrations, connect a `prisma migrate deploy` step:

```bash
# Vercel Build Settings → Build Command:
npx prisma generate && npx prisma migrate deploy && next build
```

### 10.5. Deployment Checklist

| Step | Command / Action |
|------|------------------|
| 1. Push code to GitHub | `git push origin main` |
| 2. Import project to Vercel | vercel.com → Add New → Import Git Repo |
| 3. Provision Postgres | Vercel Storage → Create Database → Postgres |
| 4. Set environment variables | JWT_SECRET, etc. |
| 5. Apply migrations | `npx prisma migrate deploy` (run via Vercel CLI or post-deploy hook) |
| 6. Seed data | `npx prisma db seed` |
| 7. Deploy | Auto-deploys on push to main |
| 8. Custom domain | Vercel → Domains → Add your domain |

---

## 11. Migration Phases & Ordering

### Phase 1: Foundation (Project Setup)

```
1. Next.js project scaffold
   → npx create-next-app@latest chinni-treasure --typescript --tailwind --app --src-dir
   → But use CSS Modules instead of Tailwind
   
2. Prisma setup
   → Copy schema from database-schema.md
   → npx prisma migrate dev --name init
   → Write seed.ts
   
3. Design tokens & globals
   → Extract :root CSS variables from style.css into globals.css
   → Set up base layout (navbar, footer, toast container)
   
4. Cart context + cookie provider
   → CartProvider, cart cookie helpers, types
   
5. Auth foundation
   → JWT helpers (sign, verify), middleware.ts, login form
```

### Phase 2: Public Pages (Server Components)

```
6. Homepage (/) — ProductGrid, Hero, Features
7. Catalogue (/catalogue) — ProductGrid (reuse)
8. Confirmation (/confirmation/[id]) — Order display
```

### Phase 3: Interactive Pages (Client Components)

```
9. Track Order (/track) — Search form + results
10. Order Checkout (/order) — OrderForm + CartSummary
11. Admin Login (/admin/login) — LoginForm
```

### Phase 4: Admin Dashboard (Heavy Client)

```
12. Admin Dashboard (/admin)
    → Stats cards
    → Order table with filters
    → Order detail modal
    → Tracking ID modal
    → Product catalogue CRUD
    → Charts (Chart.js dynamic import)
```

### Phase 5: Polish & Data Migration

```
13. Data migration script
14. Export from localStorage → import to Postgres
15. Service Worker (simplified PWA)
16. SEO metadata, sitemap, robots.txt
17. Error boundaries, loading states
18. Deployment to Vercel
```

### Phase 6: Post-Deployment (Optional Enhancements)

```
19. Rate limiting on API routes
20. Database indexes for query performance
21. Image optimization (next/image + Vercel Blob)
22. Order confirmation emails (Resend or similar)
```

---

## Appendix: Key Wireframes (Route Map)

```
/                          → Homepage (Server Component)
/catalogue                 → Product Grid (Server Component)
/order                     → Checkout Form + Cart (Client Component)
/confirmation/[id]         → Order Confirmation (Server Component)
/track                     → Order Search (Client Component)
/admin/login               → Admin Login (Client Component)
/admin                     → Admin Dashboard (Client Component)

API Routes (serverless functions):
  GET  /api/products            → List all products
  POST /api/products            → Create product (admin)
  PUT  /api/products/[id]       → Update product (admin)
  DELETE /api/products/[id]     → Delete product (admin)
  
  GET  /api/orders              → List all orders (admin)
  GET  /api/orders/[id]         → Get order details
  POST /api/orders              → Create order (checkout)
  PATCH /api/orders/[id]/status → Update order status (admin)
  
  GET /api/track/order-id?q=    → Search orders by ID
  GET /api/track/phone?q=       → Search orders by phone
  
  POST /api/auth/login          → Admin login
  POST /api/auth/logout         → Admin logout
  GET  /api/auth/me             → Get current admin session
```

---

## Summary

| Metric | Current | After Migration |
|--------|---------|-----------------|
| **Pages** | 7 static HTML | 7 Next.js routes |
| **State** | localStorage (client only) | PostgreSQL (server) + cookies (cart) |
| **Auth** | Hardcoded creds, SessionStorage | JWT + httpOnly cookies, bcrypt |
| **Data Integrity** | None (client can modify) | DB constraints, triggers, Server Actions |
| **Deployment** | Static file hosting | Vercel (serverless, auto-scaling) |
| **SEO** | Manual meta tags | Dynamic metadata, SSR, sitemap |
| **JS Bundle** | 1600 lines, no tree-shaking | Code-split by route, tree-shaken |
| **Images** | Unsplash URLs | Next/Image optimization |
| **Analytics** | None | Built-in from order data (Chart.js) |
