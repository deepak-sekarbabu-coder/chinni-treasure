# Chinni Treasure — ❤️ Little Love ❤️

> A high-end, artisan-crafted luxury goods e-commerce platform built with Next.js 16, Prisma, and PostgreSQL.

## Tech Stack

- **Framework:** [Next.js 16.2.6](https://nextjs.org/) (App Router, React 19.2.4)
- **Database:** PostgreSQL with [Prisma ORM 7.8.0](https://www.prisma.io/) via `@prisma/adapter-pg`
- **Styling:** Modular raw CSS with CSS Variables (no Tailwind). The monolithic `app/globals.css` has been decomposed into **29 component-specific files** under `app/styles/`, orchestrated via `@import` statements in the entry point.
- **Authentication:** JWT-based admin auth stored in an `HttpOnly` `session` cookie
- **State Management:** React Context + `localStorage` cart persistence for guests, plus server-side cookie cart hydration
- **Server State:** React Query (`@tanstack/react-query` v5.101.0) for client-side caching and data fetch orchestration
- **Validation:** Zod v4.4.3 for checkout, cart, and API request/response validation
- **Payments:** Razorpay Standard Checkout (server-side order creation + HMAC-SHA256 signature verification) with a manual UPI/bank-transfer fallback
- **Analytics:** Vercel Analytics (`@vercel/analytics` v2.0.1) for privacy-friendly traffic insights
- **Markdown:** `react-markdown` v10.1.0 for rendering rich product/legal content
- **Export:** ExcelJS v4.4.0 for admin data export; jsPDF v4.2.1 for invoice generation
- **Fonts:** Cormorant Garamond (serif) + Albert Sans (sans-serif) + Pinyon Script (script) via `next/font`
- **Testing:** Vitest v4.1.7 with @testing-library/react v16.3.2 and jsdom

---

## Feature Highlights

- **Artisan catalogue** with categories, rich product descriptions, **multiple product images with primary image support**, and discount display (MRP `compareAtPrice` struck through against the selling price)
- **Guest + authenticated shopping** with a persistent cart (React Context + `localStorage` + cookie sync for server-side access)
- **Razorpay payments** via Standard Checkout with server-side HMAC-SHA256 signature verification, plus a manual UPI/bank-transfer fallback
- **Multi-step checkout** with delivery form, Indian address validation (states, PIN codes), shipping calculation, and a confirmation page with a downloadable PDF invoice
- **Admin dashboard** with order management, catalogue CRUD, **category management** (create/edit/delete/toggle active, display order), status advancement, Excel export, and pure-CSS charts
- **Category browsing** with dedicated `/category/[slug]` pages, paginated/sortable listings, and a homepage "Latest in Every Category" section showing the newest in-stock product per active category
- **Order tracking** portal and shareable confirmation pages (by Order ID or customer phone number)
- **Accessibility-first** UI: skip links, ARIA attributes, focus trapping, and `prefers-reduced-motion` / `prefers-contrast` support
- **Production hardening**: CSRF/origin validation, rate-limited admin login, DOMPurify sanitization, Zod validation, serializable inventory transactions, and optimistic-concurrency order updates

---

## Prerequisites

- **Node.js** 20.x or later
- **npm** 10.x or later
- **PostgreSQL** 14 or later (local or remote)
- A modern browser (Chrome, Firefox, Edge, Safari)

---

## Getting Started Locally

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chinni-treasure
```

### 2. Install Dependencies

```bash
npm install
```

This automatically runs `prisma generate` via the `postinstall` script.

### 3. Set Up the Database

Create a PostgreSQL database and note the connection string:

```bash
createdb chinni_treasure
# or via psql: CREATE DATABASE chinni_treasure;
```

### 4. Configure Environment Variables

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
# Database (local)
DATABASE_URL=postgresql://youruser:yourpassword@localhost:5432/chinni_treasure

# JWT Secret (change in production!)
JWT_SECRET=your-secure-random-secret-key

# Public site URL (used for metadata, sitemap, and absolute links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# CORS — comma-separated list of allowed origins for API requests
ALLOWED_ORIGIN=http://localhost:3000

# Razorpay (Standard Checkout) — the server-only secret MUST never be exposed to the client
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
# Public Razorpay key exposed to the browser (prefixed NEXT_PUBLIC_)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

> **Note:** The `.env` file includes example Vercel Postgres variables for production deployment. For local development, `DATABASE_URL`, `JWT_SECRET`, and the Razorpay variables are required. Vercel auto-injects the `POSTGRES_*` variables when you attach a Postgres database. Set `ALLOWED_ORIGIN` and `NEXT_PUBLIC_SITE_URL` to your production domain in the Vercel dashboard.

### 5. Run Database Setup

Use the convenient setup script to apply the schema and seed the database:

```bash
npm run setup
```

This will:

- Generate the Prisma client
- Push the schema to your PostgreSQL database
- Seed the database with sample data

If you prefer step-by-step:

```bash
npx prisma migrate dev --name init
```

### 6. Seed the Database (if not done via setup)

Populate the database with sample products and an admin user:

```bash
npm run prisma:seed
```

The seed script creates:

- **4 categories** (Accessories, Apparel, Watches, Home)
- **6 artisan products** (Leather Wallet, Silk Scarf, Handcrafted Timepiece, Crystal Perfume Bottle, Italian Leather Belt, Cashmere Throw Blanket) with pricing and stock
- **1 admin user** with `super_admin` role — username: `admin`, password: `admin123`

### 7. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the application for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint across the project |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm test` | Run tests in watch mode (Vitest) |
| `npm run test:run` | Run tests once (Vitest) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:push` | Push the Prisma schema to the database |
| `npm run prisma:seed` | Seed the database with sample data |
| `npm run setup` | Full setup: generate client + push schema + seed data |
| `npx prisma studio` | Open Prisma Studio (GUI for database management) |
| `npm run podman:build` | Build the container image via `podman compose build` |
| `npm run podman:up` | Build (if needed) and start all services in detached mode |
| `npm run podman:down` | Stop and remove the containers |

---

## Project Structure

```
chinni-treasure/
├── app/                              # Next.js App Router pages
│   ├── admin/
│   │   ├── login/page.tsx            # Admin login page
│   │   ├── page.tsx                  # Admin dashboard (delegates to sub-components)
│   │   ├── useAdminPageState.ts      # Admin page state management hook
│   │   ├── error.tsx                 # Admin error boundary
│   │   ├── loading.tsx               # Admin loading state
│   │   └── not-found.tsx             # Admin 404
│   ├── api/                          # API route handlers
│   │   ├── auth/
│   │   │   ├── login/route.ts        # Admin login (rate-limited)
│   │   │   ├── logout/route.ts       # Admin logout
│   │   │   └── me/route.ts           # Current session check
│   │   ├── categories/route.ts       # List active categories (cached)
│   │   ├── create-order/route.ts     # Create a Razorpay order (Standard Checkout)
│   │   ├── docs/route.ts             # OpenAPI spec endpoint
│   │   ├── orders/
│   │   │   ├── route.ts              # Create order (public) + list (admin, paginated)
│   │   │   └── [id]/route.ts         # Single order retrieval
│   │   │   └── [id]/status/route.ts  # Order status update (versioned)
│   │   ├── products/
│   │   │   ├── route.ts              # Product CRUD (with pagination)
│   │   │   └── [id]/route.ts         # Single product update/delete
│   │   ├── verify-payment/route.ts   # Verify Razorpay payment signature (HMAC-SHA256)
│   │   ├── export/route.ts           # Excel export endpoint
│   │   ├── stats/route.ts            # Dashboard statistics (cached)
│   │   └── track/route.ts            # Order tracking (cached)
│   ├── catalogue/
│   │   ├── page.tsx                  # Server component fetching products
│   │   └── loading.tsx               # Catalogue loading state
│   ├── confirmation/[id]/            # Order confirmation (SSR)
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── docs/
│   │   ├── page.tsx                  # API documentation viewer (OpenAPI renderer)
│   │   └── loading.tsx
│   ├── order/
│   │   ├── page.tsx                  # Multi-step checkout with delivery form
│   │   ├── layout.tsx                # Order page layout
│   │   └── loading.tsx
│   ├── track/
│   │   ├── page.tsx                  # Order tracking portal
│   │   ├── layout.tsx                # Track page layout
│   │   └── loading.tsx
│   ├── error.tsx                     # Root error boundary
│   ├── loading.tsx                   # Root loading state
│   ├── not-found.tsx                 # Root 404
│   ├── sitemap.ts                    # Dynamic sitemap generation
│   ├── styles/                       # Decomposed modular CSS files (**29 files**)
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
│   │   ├── track.css                 # Track order page
│   │   ├── checkout.css              # Checkout progress + sticky bar
│   │   ├── order.css                 # Order page + summary sidebar + bank details
│   │   ├── confirmation.css          # Order confirmation page
│   │   ├── admin.css                 # All admin styles (stats, charts, tables, login)
│   │   ├── error.css                 # Error / Not Found / Loading pages
│   │   ├── docs.css                  # API docs page + Swagger UI overrides
│   │   ├── loading.css               # Loading spinners, skeletons, shimmer
│   │   ├── utility.css               # Utility classes (flex, spacing, text helpers)
│   │   ├── responsive.css            # Shared responsive breakpoints
│   │   ├── accessibility.css         # prefers-reduced-motion, contrast, print
│   │   ├── **latest-category.css**   # Homepage "Latest in Every Category" section
│   │   ├── **gallery.css**           # Product image gallery
│   │   └── **breadcrumbs.css**       # Breadcrumb navigation
│   ├── globals.css                   # Entry point — 48 lines of @import statements importing styles/
│   ├── layout.tsx                    # Root layout (Navbar, Footer, Providers, fonts)
│   └── page.tsx                      # Homepage (server component)
├── prisma/
│   ├── schema.prisma                 # Database schema (**7 models + 3 enums**)
│   ├── seed.ts                       # Database seeder (**6 products + 5 categories + admin**)
│   └── migrations/                   # Database migration history
├── scripts/
│   ├── export-to-excel.ts            # Excel export utility
│   ├── **generate-seed-from-excel.ts**  # Generate seed data from Excel
│   ├── **import-production.ts**      # Import production data
│   └── **repro-catalogue.ts**        # Reproduce catalogue issues
├── src/
│   ├── components/
│   │   ├── cart/
│   │   │   ├── CartProvider.tsx       # Cart context + localStorage + cookie sync
│   │   │   └── __tests__/
│   │   ├── layout/
│   │   │   ├── Footer.tsx            # Site footer with 4-column grid
│   │   │   ├── Navbar.tsx            # Fixed navbar with cart dropdown and mobile menu
│   │   │   ├── NavCartDropdown.tsx    # Cart dropdown in navbar
│   │   │   ├── PageTransition.tsx    # Page transition wrapper
│   │   │   └── __tests__/
│   │   ├── admin/
│   │   │   ├── AdminCataloguePanel.tsx  # Product CRUD form + table
│   │   │   ├── AdminCategoriesPanel.tsx # Category CRUD form + table
│   │   │   ├── AdminChartsSection.tsx   # Revenue & sales charts (Chart.js)
│   │   │   ├── AdminDeleteConfirm.tsx   # Delete confirmation modal
│   │   │   ├── AdminHeader.tsx          # Admin header with export/logout
│   │   │   ├── AdminOrdersPanel.tsx     # Orders table with filters
│   │   │   ├── AdminStatsGrid.tsx       # Dashboard stats cards
│   │   │   ├── AdminTabs.tsx            # Tab navigation (Orders/Catalogue/Categories)
│   │   │   └── AdminTrackingModal.tsx   # Tracking ID input modal
│   │   ├── order/
│   │   │   ├── CheckoutProgress.tsx     # Multi-step progress indicator
│   │   │   ├── ConfirmationDetails.tsx  # Order confirmation with invoice PDF
│   │   │   ├── OrderDetailModal.tsx     # Order detail modal (admin + customer)
│   │   │   ├── OrderSummaryCard.tsx     # Order summary display card
│   │   │   └── __tests__/
│   │   ├── track/
│   │   │   └── TrackOrderCard.tsx       # Track order result card
│   │   ├── pages/
│   │   │   ├── home-content.tsx         # Client homepage hero + features
│   │   │   ├── **category-content.tsx** # Category page content component
│   │   │   ├── **LatestInEveryCategory.tsx** # Homepage category carousel
│   │   │   └── catalogue-content.tsx    # Client catalogue with cart interactions
│   │   ├── providers/
│   │   │   └── QueryProvider.tsx        # React Query provider
│   │   └── ui/
│   │       ├── AdminStatCard.tsx        # Dashboard stat display card
│   │       ├── LoadingSpinner.tsx       # Loading indicator (full-page or inline)
│   │       ├── ProductCard.tsx          # Product grid card with add-to-cart
│   │       ├── ReturnsPolicyModal.tsx   # Returns policy modal
│   │       ├── SectionHeader.tsx        # Section heading component
│   │       ├── StatusBadge.tsx          # Order status badge (color-coded)
│   │       ├── StockBadge.tsx           # Stock level badge (in-stock/low/empty)
│   │       ├── ToastProvider.tsx        # Toast notification system
│   │       └── __tests__/              # Component unit tests (7 files)
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts               # Typed API fetch client with Zod validation
│   │   │   ├── index.ts                # API function exports (fetchStats, fetchOrders, etc.)
│   │   │   └── schemas.ts              # Zod schemas for all API inputs/outputs
│   │   ├── hooks/
│   │   │   ├── useAdminCatalogueController.ts  # Product CRUD state management
│   │   │   ├── useAdminData.ts                 # React Query data hooks
│   │   │   ├── useAdminHeaderActions.ts        # Export/logout actions
│   │   │   ├── useAdminMutations.ts            # Product/order mutation hooks
│   │   │   ├── useAdminOrdersController.ts     # Order status advancement
│   │   │   ├── useAdminSession.ts              # Auth session management
│   │   │   ├── useTrackSearch.ts               # Order tracking search
│   │   │   └── __tests__/                      # Hook unit tests (4 files)
│   │   ├── auth.ts                   # JWT auth helpers (sign, verify, session cookies)
│   │   ├── cache.ts                  # Shared in-memory cache with TTL
│   │   ├── cart-cookie.ts            # Server-side cart cookie management with Zod
│   │   ├── constants.ts              # Indian states, status flow, labels, icons
│   │   ├── csrf.ts                   # CSRF protection via Origin/Referer validation
│   │   ├── csrf-helpers.ts           # CSRF host validation helpers
│   │   ├── env.ts                    # Environment variable validation (requireEnv)
│   │   ├── openapi-spec.ts           # OpenAPI 3.0 specification document
│   │   ├── prisma.ts                 # Prisma client singleton (global caching)
│   │   ├── razorpay.ts               # Loads the Razorpay Standard Checkout script (browser)
│   │   ├── products-cache.ts         # Product-specific cache wrapper
│   │   ├── query-keys.ts             # React Query key factory
│   │   ├── rate-limiter.ts           # In-memory rate limiter (login attempts)
│   │   ├── sanitize.ts               # XSS sanitization via isomorphic-dompurify
│   │   ├── useFocusTrap.ts           # Focus trap hook for accessible modals
│   │   └── utils.ts                  # API error extraction utility
│   ├── test/                         # Test setup and utilities
│   │   ├── mocks/                    # Prisma mock implementations
│   │   ├── setup.ts                  # Vitest global setup
│   │   └── utils/                    # Test helper utilities
│   ├── types/
│   │   ├── cart.ts                   # CartItem interface
│   │   ├── razorpay.d.ts             # Razorpay response/constructor types
│   │   └── index.ts                  # Re-exports
│   └── __tests__/
│       ├── api/                      # API route handler tests (10 files)
│       ├── lib/                      # Lib module tests (12 files)
│       ├── mocks/                    # Shared mock implementations
│       ├── setup.ts                  # Test setup
│       └── utils/                    # Test utilities
├── middleware.ts                      # Re-exports proxy.ts (Next.js middleware entry)
├── proxy.ts                          # Next.js middleware logic (JWT admin route protection)
├── prisma.config.ts                  # Prisma configuration (defineConfig)
├── next.config.ts                    # Next.js configuration (image domains, etc.)
├── vercel.json                       # Vercel deployment config
├── .env.example                      # Environment variable template
├── vitest.config.ts                  # Vitest test runner configuration
└── package.json
```

---

## Deploying to Vercel

> **Important:** The project lives in the `chinni-treasure/` subdirectory. You **must** configure the Root Directory setting in Vercel, or it will fail to detect Next.js (see step 4 below).

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Create a Vercel Project

1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**
2. Import your GitHub repository
3. **Do not click Deploy yet** — the default settings need to be adjusted

### 3. Configure the Project

In the **Configure Project** screen:

| Setting | Value |
|---|---|
| **Root Directory** | `chinni-treasure` (click the dropdown and select it) |
| **Framework Preset** | Next.js (should auto-detect) |
| **Build Command** | `npm run build` (auto-filled) |
| **Output Directory** | (leave default) |
| **Install Command** | (leave default) |

#### Environment Variables

Add these under **Environment Variables**:

| Name | Value | Scope |
|---|---|---|
| `DATABASE_URL` | Your production PostgreSQL connection string | Production, Preview, Development |
| `JWT_SECRET` | A secure random string (e.g. `openssl rand -base64 32`) | Production, Preview, Development |
| `RAZORPAY_KEY_ID` | Your Razorpay Key ID (e.g. `rzp_live_xxx`) | Production, Preview, Development |
| `RAZORPAY_KEY_SECRET` | Your Razorpay Key Secret (server-only, never exposed) | Production, Preview, Development |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Your Razorpay Key ID exposed to the browser | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | Your production site URL (e.g. `https://chinni-treasure.vercel.app`) | Production, Preview, Development |
| `ALLOWED_ORIGIN` | Comma-separated allowed origins (e.g. `https://your-domain.com`) | Production, Preview, Development |

> If you're attaching a Vercel Postgres database, its variables (`POSTGRES_URL`, etc.) are auto-injected under **Environment Variables — Automatically** after step 5.

### 4. Deploy

Click **Deploy**. Vercel will:

1. Clone the repository
2. Change into the `chinni-treasure/` root directory
3. Run `npm install` (which triggers `prisma generate` via `postinstall`)
4. Run `npm run build` (which runs `prisma generate` then `next build`)
5. Deploy the output

> If the Root Directory is not set, you'll see: `Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies".`

### 5. Attach a Database (Recommended: Vercel Postgres)

1. After deployment, go to your project dashboard → **Storage** → **Connect Store** → **Create New** → **Postgres**
2. Follow the wizard to create and attach a database
3. Vercel auto-injects the `POSTGRES_*` env vars into your project
4. The `prisma.config.ts` already reads these vars — no config changes needed
5. Re-deploy the project by pushing a new commit (or use **Redeploy** in the Vercel dashboard)

### 6. Run Database Migrations

The empty database needs the schema applied. Run:

```bash
# Pull production env vars locally
vercel env pull .env.production.local

# Apply migrations
npx prisma migrate deploy
```

Or, if you don't have the Vercel CLI installed:

1. Go to **Vercel Dashboard → Your Project → Storage → your-database → Quickstart**
2. Copy the full `DATABASE_URL` from there
3. Run locally:

   ```bash
   DATABASE_URL="paste-the-url-here" npx prisma migrate deploy
   ```

### 7. Seed the Production Database (Once)

```bash
# Using Vercel CLI:
vercel env pull .env.production.local
npx prisma db seed

# Or inline:
DATABASE_URL="your-production-url" npx tsx prisma/seed.ts
```

> **Important:** Change the default admin password (`admin` / `admin123`) immediately after first login.

---

#### Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Error: No Next.js version detected` | Root Directory not set | Go to **Settings → General → Root Directory** and set it to `chinni-treasure` |
| `PrismaClientInitializationError` | Missing `DATABASE_URL` env var | Check env vars are set in Vercel dashboard **Settings → Environment Variables** |
| `Cannot find module '@prisma/client'` | `prisma generate` didn't run | Verify `"postinstall": "prisma generate"` exists in `package.json` |
| Build succeeds but pages show 404 | Vercel hasn't detected changes | Trigger a new deployment via **Redeploy** or push a new commit |

---

## Default Admin Credentials

- **Username:** `admin`
- **Password:** `admin123`
- **Role:** `super_admin`

> Change these in production! The password is hashed with bcrypt in the database.

---

## Order Status Flow

```
pending → approved → packaging → shipped → delivered
   ↓
rejected (stock restored)
```

- **Tracking ID** is required when advancing to *Shipped*
- Stock is deducted on order placement and restored if rejected
- **Optimistic concurrency control** via a `version` field prevents conflicting status updates
- Order creation uses **serializable transaction isolation** for inventory integrity
- Payments are captured via **Razorpay Standard Checkout** (or a manual bank-transfer fallback); the gateway `transactionId` is stored on the order for reconciliation

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Admin login (rate-limited) | No |
| POST | `/api/auth/logout` | Admin logout | No |
| GET | `/api/auth/me` | Get current admin session | No |
| GET | `/api/products` | List products (with pagination, cached for catalogue) | No |
| POST | `/api/products` | Create product | Yes |
| PUT | `/api/products/[id]` | Update product | Yes |
| DELETE | `/api/products/[id]` | Soft-delete product (sets inactive) | Yes |
| GET | `/api/categories` | List active categories (cached); `?includeInactive=true` for admin | No |
| POST | `/api/categories` | Create category (auto-generates slug) | Yes |
| PUT | `/api/categories/[id]` | Update category | Yes |
| DELETE | `/api/categories/[id]` | Delete category (blocked if active products exist) | Yes |
| GET | `/api/categories/latest` | Latest in-stock product per active category (homepage) | No |
| GET | `/api/category/[slug]/products` | Paginated, sortable product listing for a category | No |
| POST | `/api/orders` | Place new order (serializable transaction; captures `transactionId` from Razorpay or manual payment) | No |
| POST | `/api/create-order` | Create a Razorpay order for Standard Checkout | No |
| POST | `/api/verify-payment` | Verify Razorpay payment signature (HMAC-SHA256) | No |
| GET | `/api/orders` | List orders with pagination (admin) | Yes |
| GET | `/api/orders/[id]` | Get order with items & status history | No |
| PATCH | `/api/orders/[id]/status` | Update order status (with versioning) | Yes |
| GET | `/api/track` | Track order by order number or phone (cached) | No |
| GET | `/api/stats` | Dashboard statistics (cached, SQL aggregation) | Yes |
| GET | `/api/export` | Export orders to Excel (.xlsx, cursor-based batching) | Yes |
| GET | `/api/docs` | OpenAPI 3.0 specification JSON | No |

---

## Middleware (Admin Route Protection)

The `proxy.ts` file contains the middleware logic (JWT verification), and `middleware.ts` is a thin re-export shim that Next.js requires as its middleware entry point. Together they protect all `/admin/*` routes (except `/admin/login`) by verifying the JWT `session` cookie using the `jose` library.

---

## Testing

The project uses **Vitest** with comprehensive test coverage across components, lib modules, API routes, and hooks.

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

**Test locations:**

- `src/components/*/__tests__/` — Component tests (Cart, Layout, Order, UI)
- `src/lib/hooks/__tests__/` — Custom hook tests
- `src/__tests__/api/` — API route handler tests (10 files)
- `src/__tests__/lib/` — Lib module tests (12 files)
- `src/test/` — Test setup, mocks, and utility helpers

---

## Key Libraries

| Library | Purpose |
|---|---|
| `@prisma/adapter-pg` + `pg` | PostgreSQL database adapter |
| `@tanstack/react-query` | Server state management with caching |
| `bcryptjs` | Password hashing |
| `dayjs` | Date/time formatting |
| `jose` | JWT verification in middleware |
| `jspdf` | PDF invoice generation |
| `zod` | Runtime validation (API schemas, cart, checkout) |
| `isomorphic-dompurify` | Server-side XSS sanitization |
| `exceljs` | Data export to Excel |
| `sharp` | Image processing |
| `razorpay` | Razorpay Standard Checkout payment gateway |
| `@vercel/analytics` | Privacy-friendly Vercel Analytics |
| `react-markdown` | Markdown rendering for product/legal content |

---

## License

Private — All rights reserved.
