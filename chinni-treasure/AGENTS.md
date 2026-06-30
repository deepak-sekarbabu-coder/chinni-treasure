# Chinni Treasure — Little Love — Agent Documentation

This document outlines the architecture, roles, operational guidelines, and memory for AI agents and developers interacting with the **Chinni Treasure — Little Love** codebase.

---

## 1. Agent Tooling

### Graphify (Knowledge Graph)

`/graphify` builds a queryable knowledge graph from this codebase. Use it for:

- **Cross-module questions**: "How does checkout interact with inventory?", "What's the data flow from cart to order?"
- **Architecture exploration**: "Trace the order fulfillment path", "Which components use the Prisma client?"
- **Relationship discovery**: "What connects admin panels to the tracking system?"

**To reduce cost, avoid graphify for:**

- Single-file lookups — use `Read`/`Grep` instead
- Simple definitions — use `Grep` for class/function locations
- The graph is cached in `graphify-out/` after first build; subsequent `/graphify query` calls cost near-zero tokens

---

## 2. Project Overview

**Chinni Treasure — Little Love** is a high-end, artisan-crafted luxury goods e-commerce platform. It is built as a highly responsive Next.js application with robust server-side data persistence, dynamic cart state, and a secure administration workflow.

### Technical Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/) via `@prisma/adapter-pg`
- **Styling:** Modular raw CSS with custom CSS variables (no TailwindCSS). The monolithic `app/globals.css` has been decomposed into 28 component-specific files under `app/styles/`, orchestrating via `@import` statements in the entry point.
- **State Management:** React Context + `localStorage` (`luxe_cart`) for persistent guest shopping carts; server-side cookie cart with Zod validation for SSR access
- **Server State:** React Query (`@tanstack/react-query`) for client-side data fetching with caching and query key management
- **Authentication:** JWT-based admin authorization stored in secure `HttpOnly` cookies (`session`)
- **Validation:** Zod schemas for checkout, cart, and API input/output validation
- **Charts:** Pure CSS bar charts (no Chart.js dependency) for administrative analytics
- **Fonts:** Cormorant Garamond (serif), Albert Sans (sans-serif), and Pinyon Script (script) via `next/font`
- **Utilities:** dayjs (dates), exceljs (export), jspdf (invoices), qrcode.react (UPI QR codes), sharp (image processing)

---

## 3. Core Roles & Personas

### A. The Customer (Guest)

- **Objective:** Discover heritage products, manage their cart, and securely place orders.
- **Capabilities:**
  - Browse artisan catalogue featuring dynamic stock badges (e.g., *In Stock*, *Low Stock*, *Out of Stock*) and price comparisons (original price displayed with strikethrough when discounted).
  - Add items to cart with automatic verification against real-time database stock levels.
  - Complete purchase using a fully validated **Indian Address Form** (requiring 6-digit numeric PIN, 10-digit Phone, State/UT dropdown, and correct address fields).
  - Track orders instantly via **Order ID (UUID)** or **Customer Phone Number** (exactly 10 digits).
  - View full, historical order timelines in a premium, elegant interface.

### B. The Administrator

- **Objective:** Manage product catalog, monitor operations, and handle fulfillment.
- **Capabilities:**
  - **Secure Login:** Access restricted pages via `/admin/login` (validated securely using server-side JWT and bcryptjs password hashes).
  - **Interactive Analytics:** View revenue trends, sales distributions, and total orders on the dashboard powered by pure CSS charts.
  - **Catalogue CRUD:** Create, read, update, and toggle status (`isActive`) of products and categories with mandatory validations.
  - **Order Operations:** Move orders through fulfillment states with notes:

    ```text
    pending → approved → packaging → shipped → delivered
       ↓
    rejected (restores stock)
    ```

  - **Fulfillment Constraints:** Entering a **Tracking ID** is strictly mandatory when transitioning an order from `packaging` to `shipped`.

---

## 4. Architecture & Codebase Design

### Database Schema (Prisma Models + Enums)

**Enums:**

- `OrderStatus`: `pending` | `approved` | `packaging` | `shipped` | `delivered` | `rejected`
- `ProductBadge`: `bestseller` | `new` | `premium` | `limited` | `luxury`
- `AdminRole`: `admin` | `super_admin`

**Models (7):**

1. **Category:** Supports active filtering, description, and display sorting order.
2. **Product:** Tracks SKU, Name, Description, Price (Decimal), CompareAtPrice (Decimal, nullable), Stock Quantity, Image URL, Badge (ProductBadge: Bestseller/New/Premium/Limited/Luxury), Active state, Category relation, and `images` relation to ProductImage. When `compareAtPrice` is set and greater than `price`, it displays as strikethrough original price.
3. **ProductImage:** Each product can have multiple images stored in a separate normalized table. Each image has a `url`, `isPrimary` flag (one image per product can be primary), and `displayOrder` for sorting. The `imageUrl` field on Product is retained as a fallback for backward compatibility.
4. **Order:** Stores detailed customer details, state code, tracking ID, totals (`subtotal`, `shippingCost`, `totalAmount`), transaction reference, notes, and `version` field for optimistic concurrency control.
5. **OrderItem:** Connects orders with products, recording historical unit prices.
6. **OrderStatusHistory:** Logs every transition of order status for traceability.
7. **Admin:** Tracks user credentials, email, hashed passwords, role (admin/super_admin), and `lastLoginAt`.

### Core Logic & State Management

- **Cart Context:** Managed via `CartProvider.tsx` (`src/components/cart/`). It reads/writes to `localStorage` key `luxe_cart` on the client, and restricts quantities to active product stock levels.
- **Server Cart Cookie:** `cart-cookie.ts` (`src/lib/`) provides server-side cart access via Zod-validated cookies, enabling SSR cart hydration.
- **Inventory Sync:** Stock is deducted server-side within a **serializable transaction** when an order is finalized, and seamlessly restored to the inventory pool if the administrator sets the status to `rejected`. A `stock_quantity >= 0` database constraint prevents overselling.
- **Optimistic Concurrency:** Orders have a `version` field that is checked before status updates — if another request modified the order first, the update is rejected with a 409 status.
- **Rate Limiting:** Login attempts are rate-limited (5 tries per minute per IP) using an in-memory store.
- **Security Middleware:** `proxy.ts` acts as Next.js middleware (matcher: `/admin/:path*`), protecting all `/admin` routes (except `/admin/login`) by verifying the JWT `session` cookie using the `jose` library.

---

## 5. Development Guidelines for AI Agents

To maintain the high-end luxury feel and rigorous code standards of this application, all modifications must adhere to these rules:

1. **Design Integrity (Modular Raw CSS):**
   - Never introduce TailwindCSS or style frameworks.
    - All styles are organized into modular files under `app/styles/`. **Never** add new CSS to `app/globals.css` — add styles to the appropriate component file. See the file structure in Section 6 for the full list.
   - CSS custom properties are defined in `app/styles/variables.css` to respect the curated color palette and typography pairs:
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

## 6. File Structure Reference

```text
chinni-treasure/
├── app/                              # Next.js App Router pages & API
│   ├── admin/
│   │   ├── login/page.tsx            # Admin login page
│   │   ├── page.tsx                  # Admin dashboard (delegates to sub-components)
│   │   ├── useAdminPageState.ts      # Admin page state management hook
│   │   ├── error.tsx                 # Admin error boundary
│   │   ├── loading.tsx               # Admin loading state
│   │   ├── not-found.tsx             # Admin 404
│   │   └── layout.tsx                # Admin layout (metadata, no-index)
│   ├── api/                          # Server-side API handlers
│   │   ├── auth/
│   │   │   ├── login/route.ts        # Admin login (rate-limited)
│   │   │   ├── logout/route.ts       # Admin logout
│   │   │   └── me/route.ts           # Current session check
│   │   ├── docs/route.ts             # OpenAPI spec JSON
│   │   ├── orders/
│   │   │   ├── route.ts              # Order CRUD + status management with pagination
│   │   │   └── [id]/
│   │   │       ├── route.ts          # Single order retrieval
│   │   │       └── status/route.ts   # Order status update (versioned)
│   │   ├── products/
│   │   │   ├── route.ts              # Product CRUD with pagination
│   │   │   └── [id]/route.ts         # Single product update/delete
│   │   ├── export/route.ts           # Excel export (cursor-based batching)
│   │   ├── stats/route.ts            # Dashboard statistics with caching (SQL aggregation)
│   │   └── track/route.ts            # Order tracking with caching
│   ├── catalogue/                    # Product catalogue (SSR + client interactive)
│   │   └── [id]/                     # Product details page with image gallery
│   ├── confirmation/[id]/            # Order confirmation page
│   ├── docs/                         # Swagger UI API docs viewer
│   ├── order/                        # Multi-step checkout
│   ├── track/                        # Order tracking portal
│   ├── styles/                       # Decomposed modular CSS files (28 files)
│   │   ├── variables.css             # CSS custom properties (colors, fonts, shadows)
│   │   ├── base.css                  # Reset, HTML/body, scrollbar, skip link
│   │   ├── keyframes.css             # All @keyframes animations
│   │   ├── buttons.css               # Button system (base + premium + responsive)
│   │   ├── forms.css                 # Form elements, inputs, validation
│   │   ├── badges.css                # Status badges + stock badges
│   │   ├── toast.css                 # Toast notification system
│   │   ├── tooltip.css               # Tooltip component
│   │   ├── section.css               # Section headers
│   │   ├── navbar.css                # Navbar, cart dropdown, hamburger menu
│   │   ├── footer.css                # Footer grid layout
│   │   ├── modal.css                 # Modal system + timeline + items table
│   │   ├── hero.css                  # Hero section with premium refresh overrides
│   │   ├── products.css              # Products grid + product cards
│   │   ├── features.css              # Features section
│   │   ├── gallery.css               # Product image gallery and product details page
│   │   ├── track.css                 # Track order page
│   │   ├── checkout.css              # Checkout progress + sticky bar
│   │   ├── order.css                 # Order page + summary sidebar + bank details
│   │   ├── confirmation.css          # Order confirmation page
│   │   ├── admin.css                 # All admin styles (stats, charts, tables, login)
│   │   ├── error.css                 # Error / Not Found / Loading pages
│   │   ├── docs.css                  # API docs page + Swagger UI overrides
│   │   ├── breadcrumbs.css           # Breadcrumb navigation component
│   │   ├── loading.css               # Loading spinners, skeletons, shimmer
│   │   ├── utility.css               # Utility classes (flex, spacing, text helpers)
│   │   ├── responsive.css            # Shared responsive breakpoints
│   │   └── accessibility.css         # prefers-reduced-motion, contrast, print
│   ├── globals.css                   # Entry point — 52 lines of @import statements importing styles/
│   ├── layout.tsx                    # Root layout (fonts, providers, nav, footer)
│   ├── sitemap.ts                    # Dynamic sitemap generation
│   ├── error.tsx                     # Root error boundary
│   ├── loading.tsx                   # Root loading state
│   ├── not-found.tsx                 # Root 404
│   └── page.tsx                      # Homepage server component
├── prisma/
│   ├── schema.prisma                 # Database schema (7 models + 3 enums)
│   ├── seed.ts                       # Database seeder
│   ├── seed-data.ts                  # Seed product/category data definitions
│   └── migrations/                   # Migration history
├── scripts/
│   └── export-to-excel.ts            # Excel export utility
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminCataloguePanel.tsx   # Product CRUD form + table
│   │   │   ├── AdminChartsSection.tsx    # Revenue & sales charts (pure CSS)
│   │   │   ├── AdminDeleteConfirm.tsx    # Delete confirmation modal
│   │   │   ├── AdminHeader.tsx           # Admin header with export/logout
│   │   │   ├── AdminOrdersPanel.tsx      # Orders table with filters
│   │   │   ├── AdminStatsGrid.tsx        # Dashboard stats cards
│   │   │   ├── AdminTabs.tsx             # Tab navigation (Orders/Catalogue)
│   │   │   └── AdminTrackingModal.tsx    # Tracking ID input modal
│   │   ├── cart/CartProvider.tsx          # Cart context + localStorage + cookie sync
│   │   ├── layout/
│   │   │   ├── Footer.tsx                # Site footer with 4-column grid
│   │   │   ├── FooterClientWrapper.tsx   # Client footer (returns policy trigger)
│   │   │   ├── Navbar.tsx                # Fixed navbar with cart dropdown and mobile menu
│   │   │   └── NavCartDropdown.tsx        # Cart dropdown in navbar
│   │   ├── order/
│   │   │   ├── CheckoutProgress.tsx      # Multi-step progress indicator
│   │   │   ├── ConfirmationDetails.tsx   # Order confirmation with invoice PDF
│   │   │   ├── OrderDetailModal.tsx      # Order detail modal (admin + customer)
│   │   │   └── OrderSummaryCard.tsx      # Order summary display card
│   │   ├── track/
│   │   │   └── TrackOrderCard.tsx        # Track order result card
│   │   ├── pages/
│   │   │   ├── home-content.tsx          # Client homepage hero & features
│   │   │   ├── catalogue-content.tsx     # Client catalogue with cart interactions
│   │   │   └── ProductDetailsContent.tsx # Client product details page with image gallery
│   │   ├── providers/
│   │   │   └── QueryProvider.tsx         # React Query provider
│   │   └── ui/
│   │       ├── AdminStatCard.tsx          # Dashboard stat display card
│   │       ├── Breadcrumbs.tsx            # Breadcrumb navigation component
│   │       ├── JsonLd.tsx                # JSON-LD structured data injection
│   │       ├── LoadingSpinner.tsx         # Loading indicator (full-page or inline)
│   │       ├── ProductCard.tsx            # Product grid card with add-to-cart
│   │       ├── ProductImageGallery.tsx    # Image gallery with thumbnails and carousel
│   │       ├── ReturnsPolicyModal.tsx     # Returns policy modal
│   │       ├── SectionHeader.tsx          # Section heading component
│   │       ├── StatusBadge.tsx            # Order status badge (color-coded)
│   │       ├── StockBadge.tsx             # Stock level badge (in-stock/low/empty)
│   │       └── ToastProvider.tsx          # Toast notification system
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                 # Typed API fetch client with Zod validation
│   │   │   ├── index.ts                  # API function exports
│   │   │   └── schemas.ts                # Zod schemas for all API inputs/outputs
│   │   ├── hooks/
│   │   │   ├── useAdminCatalogueController.ts  # Product CRUD state management
│   │   │   ├── useAdminData.ts                 # React Query data hooks
│   │   │   ├── useAdminHeaderActions.ts        # Export/logout actions
│   │   │   ├── useAdminMutations.ts            # Product/order mutation hooks
│   │   │   ├── useAdminOrdersController.ts     # Order status advancement
│   │   │   ├── useAdminSession.ts              # Auth session management
│   │   │   └── useTrackSearch.ts               # Order tracking search
│   │   ├── auth.ts                   # JWT auth helpers (sign, verify, session cookies)
│   │   ├── cache.ts                  # Shared in-memory cache with TTL
│   │   ├── cart-cookie.ts            # Server-side cart cookie management with Zod
│   │   ├── constants.ts              # Indian states, status flow, labels, icons
│   │   ├── csrf.ts                   # CSRF protection via Origin/Referer validation
│   │   ├── csrf-helpers.ts           # CSRF host validation helpers
│   │   ├── env.ts                    # Environment variable validation (requireEnv)
│   │   ├── openapi-spec.ts           # OpenAPI 3.0 specification document
│   │   ├── prisma.ts                 # Prisma client singleton (global caching)
│   │   ├── products-cache.ts         # Product-specific cache wrapper
│   │   ├── query-keys.ts             # React Query key factory
│   │   ├── rate-limiter.ts           # In-memory rate limiter (login attempts)
│   │   ├── sanitize.ts               # XSS sanitization via isomorphic-dompurify
│   │   ├── upi.ts                    # UPI payment URL builder (NPCI v1.6)
│   │   ├── useFocusTrap.ts           # Focus trap hook for accessible modals
│   │   └── utils.ts                  # API error extraction utility
│   ├── types/
│   │   ├── cart.ts                   # CartItem interface
│   │   └── index.ts                  # Re-exports
│   └── __tests__/
│       ├── setup.ts                  # Vitest global setup
│       ├── api/                      # API route handler tests (10 files)
│       ├── lib/                      # Lib module tests (12 files)
│       ├── mocks/                    # Shared mock implementations (prisma.ts)
│       └── utils/                    # Test utilities (api-test.ts)
├── proxy.ts                          # Middleware logic (JWT admin route protection, Next.js 16 proxy convention)
├── prisma.config.ts                  # Prisma defineConfig
├── vitest.config.ts                  # Vitest test configuration
└── package.json
```

---

## 7. Common Developer Workflows

Use the following commands during development and maintenance:

| Command | Action |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Generate Prisma client, validate TypeScript, build for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint across the project |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format code with ESLint fix |
| `npm run typecheck` | Validate type safety (`tsc --noEmit`) |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run setup` | Full local DB setup: generate client + push schema + seed |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:push` | Push the Prisma schema to the database |
| `npm run prisma:seed` | Seed the database |
| `npm run prisma:studio` | Open Prisma GUI client to view local database state |
