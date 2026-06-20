# Chinni Treasure — Engineering & Design Mandates

This document serves as the primary source of truth for architecture, conventions, and workflows within the Chinni Treasure codebase. Adhere to these instructions strictly.

## 1. Project Overview
Chinni Treasure is a hybrid e-commerce platform for artisan luxury goods. It features a high-emotion, brand-focused customer storefront and a high-efficiency, product-focused admin dashboard.

- **Stack:** Next.js (App Router), TypeScript, Prisma (PostgreSQL), React 19.
- **Design:** Custom Vanilla CSS (no Tailwind), focusing on warmth, gold accents, and a serif/sans-serif typographic hierarchy.

## 2. Tech Stack & Environment
- **Node.js:** v24.x (LTS)
- **Database:** PostgreSQL (via Prisma with `@prisma/adapter-pg`)
- **Package Manager:** npm
- **OS:** Windows (win32) - Ensure commands are compatible with PowerShell/CMD where applicable.

## 3. Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Generate Prisma client + build for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint across the project |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm test` | Run tests in watch mode (Vitest) |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:push` | Push the Prisma schema to the database |
| `npm run prisma:seed` | Seed the database |
| `npm run setup` | Full DB setup: generate + push + seed |
| `npx prisma studio` | Open Prisma GUI client |

## 4. Core Workflows

### 4.1 Database Management (Prisma)
- **Schema Changes:** Modify `prisma/schema.prisma`.
- **Syncing:** Use `npm run prisma:push` for local development. Use `npx prisma migrate dev` if formal migrations are required for production-like environments.
- **Generation:** Always run `npm run prisma:generate` after schema changes.
- **Seeding:** Use `npm run prisma:seed` to populate the database with initial artisan products (6 products, 4 categories) and an admin user.
- **Full Reset:** `npm run setup` runs generate, push, and seed in sequence.

### 4.2 Development & Build
- **Dev:** `npm run dev` (Starts Next.js on port 3000).
- **Type Checking:** `npm run typecheck` (Runs `tsc --noEmit`).
- **Linting:** `npm run lint` (ESLint).
- **Build:** `npm run build` (Runs `prisma generate` then `next build`).

## 5. Architecture & Conventions

### 5.1 Directory Structure
```
chinni-treasure/
├── app/                              # Next.js App Router pages & API
│   ├── admin/
│   │   ├── login/page.tsx            # Admin login page
│   │   ├── page.tsx                  # Admin dashboard (delegates to sub-components)
│   │   ├── useAdminPageState.ts      # Admin page state management hook
│   │   ├── error.tsx                 # Admin error boundary
│   │   ├── loading.tsx               # Admin loading state
│   │   └── not-found.tsx             # Admin 404
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
│   ├── confirmation/[id]/            # Order confirmation page
│   ├── docs/                         # API documentation viewer (hand-rolled OpenAPI renderer)
│   ├── order/                        # Multi-step checkout with delivery form
│   ├── track/                        # Order tracking portal
│   ├── globals.css                   # ~5300 lines of design system + responsive styles
│   ├── layout.tsx                    # Root layout (fonts, providers, nav, footer)
│   ├── sitemap.ts                    # Dynamic sitemap generation
│   ├── error.tsx                     # Root error boundary
│   ├── loading.tsx                   # Root loading state
│   ├── not-found.tsx                 # Root 404
│   └── page.tsx                      # Homepage server component
├── prisma/
│   ├── schema.prisma                 # Database schema (6 models + 3 enums)
│   ├── seed.ts                       # Database seeder (6 products, 4 categories, admin)
│   └── migrations/                   # Migration history
├── scripts/
│   └── export-to-excel.ts            # Excel export utility
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminCataloguePanel.tsx   # Product CRUD form + table
│   │   │   ├── AdminChartsSection.tsx    # Revenue & sales charts (Chart.js)
│   │   │   ├── AdminDeleteConfirm.tsx    # Delete confirmation modal
│   │   │   ├── AdminHeader.tsx           # Admin header with export/logout
│   │   │   ├── AdminOrdersPanel.tsx      # Orders table with filters
│   │   │   ├── AdminStatsGrid.tsx        # Dashboard stats cards
│   │   │   ├── AdminTabs.tsx             # Tab navigation (Orders/Catalogue)
│   │   │   └── AdminTrackingModal.tsx    # Tracking ID input modal
│   │   ├── cart/CartProvider.tsx          # Cart context + localStorage + cookie sync
│   │   ├── layout/
│   │   │   ├── Footer.tsx                # Site footer with 4-column grid
│   │   │   ├── Navbar.tsx                # Fixed navbar with cart dropdown + mobile menu
│   │   │   ├── NavCartDropdown.tsx        # Cart dropdown in navbar
│   │   │   └── PageTransition.tsx        # Page transition wrapper
│   │   ├── order/
│   │   │   ├── CheckoutProgress.tsx      # Multi-step progress indicator
│   │   │   ├── ConfirmationDetails.tsx   # Order confirmation with invoice PDF
│   │   │   ├── OrderDetailModal.tsx      # Order detail modal (admin + customer)
│   │   │   └── OrderSummaryCard.tsx      # Order summary display card
│   │   ├── track/
│   │   │   └── TrackOrderCard.tsx        # Track order result card
│   │   ├── pages/
│   │   │   ├── home-content.tsx          # Client homepage hero & features
│   │   │   └── catalogue-content.tsx     # Client catalogue with cart interactions
│   │   ├── providers/
│   │   │   └── QueryProvider.tsx         # React Query provider
│   │   └── ui/
│   │       ├── AdminStatCard.tsx          # Dashboard stat display card
│   │       ├── LoadingSpinner.tsx         # Full-page or inline spinner
│   │       ├── ProductCard.tsx            # Product grid card with add-to-cart
│   │       ├── ReturnsPolicyModal.tsx     # Returns policy modal
│   │       ├── SectionHeader.tsx          # Section heading with gold underline
│   │       ├── StatusBadge.tsx            # Color-coded order status badge
│   │       ├── StockBadge.tsx             # Stock level indicator
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
│   │   ├── auth.ts                   # JWT helpers (sign/verify), bcrypt, session cookies
│   │   ├── cache.ts                  # Shared in-memory cache with TTL
│   │   ├── cart-cookie.ts            # Server-side cart cookie with Zod validation
│   │   ├── constants.ts              # Indian states, status flow, labels, icons
│   │   ├── csrf.ts                   # CSRF protection via Origin/Referer validation
│   │   ├── csrf-helpers.ts           # CSRF host validation helpers
│   │   ├── env.ts                    # Environment variable validation (requireEnv)
│   │   ├── openapi-spec.ts           # OpenAPI 3.0 specification document
│   │   ├── prisma.ts                 # Prisma client singleton (global caching)
│   │   ├── products-cache.ts         # Product-specific cache wrapper
│   │   ├── query-keys.ts             # React Query key factory
│   │   ├── rate-limiter.ts           # In-memory rate limiter (5 req/min per IP)
│   │   ├── sanitize.ts               # XSS sanitization via isomorphic-dompurify
│   │   ├── useFocusTrap.ts           # Focus trap hook for accessible modals
│   │   └── utils.ts                  # API error extraction utility
│   ├── test/
│   │   ├── mocks/                    # Prisma mock implementations
│   │   ├── setup.ts                  # Vitest global setup
│   │   └── utils/                    # API test helpers
│   ├── types/
│   │   ├── cart.ts                   # CartItem interface
│   │   └── index.ts                  # Re-exports
│   └── __tests__/
│       ├── api/                      # API route handler tests (10 files)
│       ├── lib/                      # Lib module tests (12 files)
│       └── mocks/                    # Shared mock implementations
├── proxy.ts                          # Next.js middleware (JWT admin route protection)
├── prisma.config.ts                  # Prisma defineConfig
├── vitest.config.ts                  # Vitest test runner configuration
├── next.config.ts                    # Next.js config
├── vercel.json                       # Vercel deployment config
└── package.json
```

### 5.2 Coding Standards
- **Component Patterns:** Prefer functional components with explicit interfaces for props.
- **State Management:** Use React Context (`CartProvider`) for global UI state; React Query for server state; server components for initial data fetching.
- **Data Fetching:** Server Components for initial data; React Query for client-side data management with proper query key management (`src/lib/query-keys.ts`).
- **Type Safety:** No `any`. Use Zod for runtime validation (API schemas, cart, checkout).
- **Admin Architecture:** Admin page (`app/admin/page.tsx`) delegates to sub-components and uses `useAdminPageState` hook for state management.

## 6. Design & UI Standards (from brief.md)

### 6.1 Color Palette
| Token | Value | Role |
|---|---|---|
| `--gold` | `#d4af37` | Primary accent, CTAs, brand markers |
| `--gold-light` | `#f0d68a` | Gold hover, subtle warmth |
| `--gold-dark` | `#b8960f` | Price text, emphasis |
| `--black` | `#0d0d0d` | Canvas (hero, admin), deep space |
| `--near-black` | `#1a1a1a` | Body text, card bg on dark |
| `--cream` | `#f5f0e8` | Default page background |
| `--cream-light` | `#faf7f2` | Input fields, card bg on light |
| `--text-muted` | `#707070` | Secondary labels, metadata |

### 6.2 Typography
- **Headings/Prices:** `Cormorant Garamond` (Serif) via `--font-serif`.
- **Body/Admin/Buttons:** `Albert Sans` (Sans-serif) via `--font-sans`.
- **Decorative Taglines:** `Pinyon Script` (Script) via `--font-script`.

Fonts are loaded via `next/font/google` in `app/layout.tsx` and applied as CSS variables on the `<html>` element.

### 6.3 Principles
- **Warmth over sterile polish:** Use texture and warm colors.
- **One job per screen:** Maintain clear focus in UI layout.
- **Physicality:** Evoke "warm brass" and "polished wood" through visual depth.
- **Gold earns its moments:** Accent appears only in navigation, CTAs, and signals.

## 7. Key Dependencies

| Package | Purpose |
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
| `vitest` + `@testing-library/react` | Unit testing framework |

## 8. Testing

The project uses **Vitest** with comprehensive test coverage across components, lib modules, API routes, and hooks.

Tests live in `__tests__/` directories alongside their modules, with shared mocks and utilities in `src/test/`.

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

**Coverage includes:**
- Auth (JWT, bcrypt, sessions)
- Cart (localStorage, cookie sync)
- All UI components (ProductCard, StockBadge, StatusBadge, etc.)
- API routes (auth, orders, products, stats, track)
- Lib utilities (constants, utils, sanitize, rate-limiter, cache)
- Custom hooks (useAdminCatalogueController, useAdminOrdersController, useAdminSession, useAdminHeaderActions)

## 9. Agent Instructions
- **Tooling:** Use `npx prisma` for database tasks. Use `npm run` scripts defined in `package.json`.
- **Windows Compatibility:** The OS is win32. Use forward slashes (`/`) in imports/code. For terminal commands, use bash-compatible syntax (the shell is bash).
- **Testing:** Tests live in `__tests__/` dirs alongside modules and in `src/__tests__/api/`. Run `npm run test:run` for CI-style single run.
- **Git:** Match the concise, "why-focused" commit style found in `git log`.
- **Vanilla CSS:** Do not install or use Tailwind CSS. Write CSS in `globals.css` using established custom properties.
- **Middleware:** `proxy.ts` acts as Next.js middleware, protecting `/admin/*` routes via JWT cookie verification using the `jose` library.
