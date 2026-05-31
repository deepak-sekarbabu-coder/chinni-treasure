# Chinni Treasure — Little Love — Agent Documentation

This document outlines the architecture, roles, operational guidelines, and memory for AI agents and developers interacting with the **Chinni Treasure — Little Love** codebase.

---

## 1. Project Overview

**Chinni Treasure — Little Love** is a high-end, artisan-crafted luxury goods e-commerce platform. It is built as a highly responsive Next.js application with robust server-side data persistence, dynamic cart state, and a secure administration workflow.

### Technical Stack
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/) via `@prisma/adapter-pg`
- **Styling:** Raw CSS with custom CSS variables (no TailwindCSS)
- **State Management:** React Context + `localStorage` (`luxe_cart`) for persistent guest shopping carts; server-side cookie cart with Zod validation for SSR access
- **Authentication:** JWT-based admin authorization stored in secure `HttpOnly` cookies (`session`)
- **Charts:** Chart.js v4 for administrative analytics
- **Validation:** Zod schemas for checkout, cart, and input sanitization
- **Fonts:** Cormorant Garamond (serif), Albert Sans (sans-serif), and Pinyon Script (script) via `next/font`

---

## 2. Core Roles & Personas

### A. The Customer (Guest)
- **Objective:** Discover heritage products, manage their cart, and securely place orders.
- **Capabilities:**
  - Browse artisan catalogue featuring dynamic stock badges (e.g., *In Stock*, *Low Stock*, *Out of Stock*).
  - Add items to cart with automatic verification against real-time database stock levels.
  - Complete purchase using a fully validated **Indian Address Form** (requiring 6-digit numeric PIN, 10-digit Phone, State/UT dropdown, and correct address fields).
  - Track orders instantly via **Order ID (UUID)** or **Customer Phone Number** (exactly 10 digits).
  - View full, historical order timelines in a premium, elegant interface.

### B. The Administrator
- **Objective:** Manage product catalog, monitor operations, and handle fulfillment.
- **Capabilities:**
  - **Secure Login:** Access restricted pages via `/admin/login` (validated securely using server-side JWT and bcryptjs password hashes).
  - **Interactive Analytics:** View revenue trends, sales distributions, and total orders on the dashboard powered by Chart.js.
  - **Catalogue CRUD:** Create, read, update, and toggle status (`isActive`) of products and categories with mandatory validations.
  - **Order Operations:** Move orders through fulfillment states with notes:
    ```
    pending → approved → packaging → shipped → delivered
       ↓
    rejected (restores stock)
    ```
  - **Fulfillment Constraints:** Entering a **Tracking ID** is strictly mandatory when transitioning an order from `packaging` to `shipped`.

---

## 3. Architecture & Codebase Design

### Database Schema (Prisma Models + Enums)

**Enums:**
- `OrderStatus`: `pending` | `approved` | `packaging` | `shipped` | `delivered` | `rejected`
- `ProductBadge`: `bestseller` | `new` | `premium` | `limited` | `luxury`
- `AdminRole`: `admin` | `super_admin`

**Models:**
1. **Category:** Supports active filtering, description, and display sorting order.
2. **Product:** Tracks SKU, Name, Description, Price (Decimal), Stock Quantity, Image URL, Badge (ProductBadge: Bestseller/New/Premium/Limited/Luxury), Active state, and Category relation.
3. **Order:** Stores detailed customer details, state code, tracking ID, totals (`subtotal`, `shippingCost`, `totalAmount`), transaction reference, notes, and `version` field for optimistic concurrency control.
4. **OrderItem:** Connects orders with products, recording historical unit prices.
5. **OrderStatusHistory:** Logs every transition of order status for traceability.
6. **Admin:** Tracks user credentials, email, hashed passwords, and role (admin/super_admin).

### Core Logic & State Management
- **Cart Context:** Managed via `CartProvider.tsx` (`src/components/cart/`). It reads/writes to `localStorage` key `luxe_cart` on the client, and restricts quantities to active product stock levels.
- **Server Cart Cookie:** `cart-cookie.ts` (`src/lib/`) provides server-side cart access via Zod-validated cookies, enabling SSR cart hydration.
- **Inventory Sync:** Stock is deducted server-side within a **serializable transaction** when an order is finalized, and seamlessly restored to the inventory pool if the administrator sets the status to `rejected`. A `stock_quantity >= 0` database constraint prevents overselling.
- **Optimistic Concurrency:** Orders have a `version` field that is checked before status updates — if another request modified the order first, the update is rejected with a 409 status.
- **Rate Limiting:** Login attempts are rate-limited (5 tries per minute per IP) using an in-memory store.
- **Security Middleware:** `proxy.ts` acts as Next.js middleware (matcher: `/admin/:path*`), protecting all `/admin` routes (except `/admin/login`) by verifying the JWT `session` cookie using the `jose` library.

---

## 4. Development Guidelines for AI Agents

To maintain the high-end luxury feel and rigorous code standards of this application, all modifications must adhere to these rules:

1. **Design Integrity (Raw CSS):** 
   - Never introduce TailwindCSS or style frameworks.
   - Use CSS custom properties in `app/globals.css` to respect the curated color palette and typography pairs:
     - Serif Font (`--font-serif`): Cormorant Garamond for headings, brand voice, and prices.
     - Sans Font (`--font-sans`): Albert Sans for labels, body, inputs, and admin layout.
     - Script Font (`--font-script`): Pinyon Script for decorative brand taglines.
     - Color Tokens: Gold Accent (`--gold`), Dark Canvas (`--black`), Warm Page Background (`--cream`).

2. **Access & Security:**
   - Always verify and decode JWT tokens server-side for admin endpoints.
   - Password manipulation must always utilize the bcrypt hashing functions inside `src/lib/auth.ts`.

3. **Accessibility (A11y):**
   - Retain explicit visible focus rings for interactive components (never set `outline: none`).
   - Maintain minimum tap targets of 44×44px (prefer 48×48px for CTA buttons) on mobile views.
   - Respect user motions via `prefers-reduced-motion` and support `prefers-contrast`.

4. **Input & Validation Strictness:**
   - Always sanitize HTML and inputs utilizing `src/lib/sanitize.ts` (isomorphic-dompurify) to prevent XSS.
   - Enforce rigorous validation schemas (Zod) on checkout requests and cart operations:
     - 6-digit postal code format checking.
     - 10-digit phone number parsing (trim spaces and validate format).
     - Non-negative prices and quantities.

5. **Local Dev & Testing Safety:**
   - Ensure environment variables are read gracefully with fallbacks for development.
   - Never commit actual environment files (`.env`); update `.env.example` if you add new configuration variables.

---

## 5. File Structure Reference

```
chinni-treasure/
├── app/                          # Next.js App Router pages & API
│   ├── admin/
│   │   ├── login/page.tsx        # Admin login page
│   │   └── page.tsx              # Admin dashboard (orders, stats, catalogue CRUD)
│   ├── api/                      # Server-side API handlers
│   │   ├── auth/                 # Login / logout / session
│   │   ├── docs/                 # OpenAPI spec JSON
│   │   ├── orders/               # Order CRUD + status management with pagination
│   │   ├── products/             # Product CRUD
│   │   ├── stats/                # Dashboard statistics with caching
│   │   └── track/                # Order tracking with caching
│   ├── catalogue/                # Product catalogue (SSR + client interactive)
│   ├── confirmation/[id]/        # Order confirmation page
│   ├── docs/                     # Swagger UI API docs viewer
│   ├── order/                    # Multi-step checkout
│   ├── track/                    # Order tracking portal
│   ├── globals.css               # ~2800 lines of design system + responsive styles
│   ├── layout.tsx                # Root layout (fonts, providers, nav, footer)
│   ├── home-content.tsx          # Client homepage hero & features
│   ├── catalogue-content.tsx     # Client catalogue with cart interactions
│   └── page.tsx                  # Homepage server component
├── prisma/
│   ├── schema.prisma             # Database schema (6 models + 3 enums)
│   ├── seed.ts                   # Database seeder (6 products, 4 categories, admin)
│   └── migrations/               # Migration history
├── scripts/
│   └── export-to-excel.ts        # Excel export utility
├── src/
│   ├── components/
│   │   ├── cart/CartProvider.tsx  # Cart context + localStorage
│   │   ├── layout/               # Navbar.tsx, Footer.tsx
│   │   ├── order/                # CheckoutProgress.tsx, OrderDetailModal.tsx
│   │   └── ui/                   # ProductCard, StockBadge, StatusBadge, SectionHeader,
│   │                                AdminStatCard, LoadingSpinner, ToastProvider
│   ├── lib/                      # auth, prisma, constants, utils, cart-cookie,
│   │                                rate-limiter, sanitize, useScrollReveal, openapi-spec
│   ├── test/                     # Vitest setup, mocks, utilities
│   └── types/                    # Shared TypeScript interfaces
├── proxy.ts                      # Next.js middleware (JWT admin protection)
├── prisma.config.ts              # Prisma defineConfig
├── vitest.config.ts              # Vitest test configuration
└── package.json
```

---

## 6. Common Developer Workflows

Use the following commands during development and maintenance:

| Command | Action |
|---|---|
| `npm run dev` | Start the Next.js development server with Turbopack |
| `npm run build` | Generate Prisma client, validate TypeScript, build for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint across the project |
| `npm run typecheck` | Validate type safety (`tsc --noEmit`) |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run setup` | Full local DB setup: generate client + push schema + seed |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:push` | Push the Prisma schema to the database |
| `npm run prisma:seed` | Seed the database |
| `npx prisma studio` | Open Prisma GUI client to view local database state |
