# Chinni Treasure — ❤️ Little Love ❤️

> A high-end, artisan-crafted luxury goods e-commerce platform built with Next.js 16, Prisma, and PostgreSQL.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/) via `@prisma/adapter-pg`
- **Styling:** Raw CSS with CSS Variables (no Tailwind)
- **Authentication:** JWT-based admin auth (stored in httpOnly `session` cookie)
- **State Management:** React Context + `localStorage` (`luxe_cart`) for guest cart persistence; cookie-based cart for server-side access
- **Charts:** Chart.js v4 (admin dashboard analytics)
- **Validation:** Zod schemas for checkout, cart, and input sanitization
- **Export:** ExcelJS for admin data export
- **Fonts:** Cormorant Garamond (serif) + Albert Sans (sans-serif) + Pinyon Script (script) via `next/font`

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
```

> **Note:** The `.env` file includes example Vercel Postgres variables for production deployment. For local development, only `DATABASE_URL` and `JWT_SECRET` are needed. Vercel auto-injects the `POSTGRES_*` variables when you attach a Postgres database.

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
| `npm run dev` | Start the Next.js development server (with Turbopack) |
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

---

## Project Structure

```
chinni-treasure/
├── app/                          # Next.js App Router pages
│   ├── admin/
│   │   ├── login/page.tsx        # Admin login page
│   │   └── page.tsx              # Admin dashboard (orders, stats, catalogue CRUD)
│   ├── api/                      # API route handlers
│   │   ├── auth/                 # Login / logout / session
│   │   ├── docs/                 # OpenAPI spec endpoint
│   │   ├── orders/               # Order CRUD & status management (with pagination)
│   │   ├── products/             # Product CRUD
│   │   ├── export/               # Excel export endpoint
│   │   ├── stats/                # Dashboard statistics (with caching)
│   │   └── track/                # Order tracking (with caching)
│   ├── catalogue/                # Product catalogue (SSR + client interactive)
│   │   ├── page.tsx              # Server component fetching products
│   │   └── catalogue-content.tsx # Client component with cart interactions
│   ├── confirmation/[id]/        # Order confirmation after purchase (SSR)
│   ├── docs/page.tsx             # Swagger UI API documentation viewer
│   ├── home-content.tsx          # Client component for homepage hero + features
│   ├── order/page.tsx            # Multi-step checkout with delivery form
│   ├── track/page.tsx            # Order tracking portal
│   ├── globals.css               # Global styles and design system (~2800 lines)
│   ├── layout.tsx                # Root layout (Navbar, Footer, Providers, fonts)
│   └── page.tsx                  # Homepage (server component)
├── prisma/
│   ├── schema.prisma             # Database schema (6 models + 3 enums)
│   ├── seed.ts                   # Database seeder (6 products + 4 categories + admin)
│   └── migrations/               # Database migration history
├── scripts/
│   └── export-to-excel.ts        # Excel export utility
├── src/
│   ├── components/
│   │   ├── cart/CartProvider.tsx  # Cart context + localStorage persistence
│   │   ├── layout/
│   │   │   ├── Footer.tsx        # Site footer with 4-column grid
│   │   │   └── Navbar.tsx        # Fixed navbar with cart dropdown and mobile menu
│   │   ├── admin/
│   │   │   ├── AdminCataloguePanel.tsx # Product CRUD form + table
│   │   │   ├── AdminDeleteConfirm.tsx  # Delete confirmation modal
│   │   │   ├── AdminOrdersPanel.tsx    # Orders table with filters
│   │   │   └── AdminTrackingModal.tsx  # Tracking ID input modal
│   │   ├── order/
│   │   │   ├── CheckoutProgress.tsx # Multi-step progress indicator
│   │   │   └── OrderDetailModal.tsx # Order detail modal (admin + customer)
│   │   └── ui/
│   │       ├── AdminStatCard.tsx  # Dashboard stat display card
│   │       ├── LoadingSpinner.tsx # Loading indicator (full-page or inline)
│   │       ├── ProductCard.tsx    # Product grid card with add-to-cart
│   │       ├── SectionHeader.tsx  # Section heading component
│   │       ├── StatusBadge.tsx    # Order status badge (color-coded)
│   │       ├── StockBadge.tsx     # Stock level badge (in-stock/low/empty)
│   │       ├── ToastProvider.tsx  # Toast notification system
│   │       └── __tests__/        # Component unit tests
│   ├── lib/
│   │   ├── auth.ts               # JWT auth helpers (sign, verify, session cookies)
│   │   ├── cache.ts              # Shared in-memory cache with TTL
│   │   ├── cart-cookie.ts        # Server-side cart cookie management with Zod
│   │   ├── constants.ts          # Site constants (states, status flow, labels)
│   │   ├── csrf.ts               # CSRF protection via Origin/Referer validation
│   │   ├── openapi-spec.ts       # OpenAPI 3.0 specification document
│   │   ├── prisma.ts             # Prisma client singleton (global caching)
│   │   ├── rate-limiter.ts       # In-memory rate limiter (login attempts)
│   │   ├── sanitize.ts           # XSS sanitization via DOMPurify (isomorphic)
│   │   ├── useFocusTrap.ts       # Focus trap hook for accessible modals
│   │   └── utils.ts              # Order number generation utility
│   ├── test/                     # Test setup and utilities
│   │   ├── mocks/                # Mock implementations
│   │   ├── setup.ts              # Vitest global setup
│   │   └── utils/                # Test helper utilities
│   └── types/
│       └── index.ts              # Shared TypeScript interfaces
├── proxy.ts                      # Next.js middleware (JWT admin route protection)
├── prisma.config.ts              # Prisma configuration (defineConfig)
├── next.config.ts                # Next.js configuration (image domains, etc.)
├── vercel.json                   # Vercel deployment config
├── .env.example                  # Environment variable template
├── vitest.config.ts              # Vitest test runner configuration
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

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Admin login (rate-limited) | No |
| POST | `/api/auth/logout` | Admin logout | No |
| GET | `/api/auth/me` | Get current admin session | Yes |
| GET | `/api/products` | List active products (cached) | No |
| POST | `/api/products` | Create product | Yes |
| PUT | `/api/products/[id]` | Update product | Yes |
| DELETE | `/api/products/[id]` | Soft-delete product (sets inactive) | Yes |
| POST | `/api/orders` | Place new order (serializable transaction) | No |
| GET | `/api/orders` | List orders with pagination (admin) | Yes |
| GET | `/api/orders/[id]` | Get order with items & status history | No |
| PATCH | `/api/orders/[id]/status` | Update order status (with versioning) | Yes |
| GET | `/api/track` | Track order by order number or phone (cached) | No |
| GET | `/api/stats` | Dashboard statistics (cached) | Yes |
| GET | `/api/export` | Export orders to Excel (.xlsx) | Yes |
| GET | `/api/docs` | OpenAPI 3.0 specification JSON | No |

---


## Middleware (Admin Route Protection)

The file `proxy.ts` acts as Next.js middleware, protecting all `/admin/*` routes (except `/admin/login`) by verifying the JWT `session` cookie using the `jose` library.

---

## Testing

The project uses **Vitest** with ~99% test coverage across components and lib modules.

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

Tests live alongside their modules in `__tests__/` directories or in `src/test/` for shared test utilities.

---

## Key Libraries

| Library | Purpose |
|---|---|
| `@prisma/adapter-pg` + `pg` | PostgreSQL database adapter |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT signing and verification |
| `jose` | JWT verification in middleware |
| `zod` | Runtime validation (cart, checkout) |
| `isomorphic-dompurify` | Server-side XSS sanitization |
| `chart.js` | Admin dashboard charts |
| `swagger-ui-react` | API documentation UI |
| `exceljs` | Data export to Excel |
| `sharp` | Image processing |

---

## License

Private — All rights reserved.
