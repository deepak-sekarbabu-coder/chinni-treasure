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
| `npm run dev` | Start the Next.js development server (with Turbopack) |
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
- **Dev:** `npm run dev` (Starts Next.js on port 3000 with Turbopack).
- **Type Checking:** `npm run typecheck` (Runs `tsc --noEmit`).
- **Linting:** `npm run lint` (ESLint).
- **Build:** `npm run build` (Runs `prisma generate` then `next build`).

## 5. Architecture & Conventions

### 5.1 Directory Structure
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
│   │   ├── stats/                # Dashboard statistics (with caching)
│   │   └── track/                # Order tracking (with caching)
│   ├── catalogue/                # Product catalogue (SSR + client interactive)
│   ├── confirmation/[id]/        # Order confirmation page
│   ├── docs/                     # Swagger UI API docs viewer
│   ├── order/                    # Multi-step checkout with delivery form
│   ├── track/                    # Order tracking portal
│   ├── globals.css               # ~2800 lines design system + responsive styles
│   ├── layout.tsx                # Root layout (fonts, providers, nav, footer)
│   ├── home-content.tsx          # Client homepage hero & features
│   ├── catalogue-content.tsx     # Client catalogue with cart interactions
│   └── page.tsx                  # Homepage server component
├── prisma/
│   ├── schema.prisma             # Database schema (6 models + 3 enums)
│   ├── seed.ts                   # Database seeder (6 products, 4 categories, admin)
│   └── migrations/               # Migration history (3 migrations)
├── scripts/
│   └── export-to-excel.ts        # Excel export utility
├── src/
│   ├── components/
│   │   ├── cart/CartProvider.tsx  # Cart context + localStorage + cookie sync
│   │   ├── layout/
│   │   │   ├── Navbar.tsx        # Fixed navbar with cart dropdown + mobile menu
│   │   │   └── Footer.tsx        # 4-column grid footer
│   │   ├── order/
│   │   │   ├── CheckoutProgress.tsx # Multi-step progress indicator
│   │   │   └── OrderDetailModal.tsx # Order detail modal (admin + customer)
│   │   └── ui/
│   │       ├── AdminStatCard.tsx  # Dashboard stat display card
│   │       ├── LoadingSpinner.tsx # Full-page or inline spinner
│   │       ├── ProductCard.tsx    # Product grid card with add-to-cart
│   │       ├── SectionHeader.tsx  # Section heading with gold underline
│   │       ├── StatusBadge.tsx    # Color-coded order status badge
│   │       ├── StockBadge.tsx     # Stock level indicator
│   │       ├── ToastProvider.tsx  # Toast notification system
│   │       └── __tests__/        # Unit tests for each component
│   ├── lib/
│   │   ├── auth.ts               # JWT helpers (sign/verify), bcrypt, session cookies
│   │   ├── cart-cookie.ts        # Server-side cart cookie with Zod validation
│   │   ├── constants.ts          # Indian states, status flow, labels, icons
│   │   ├── openapi-spec.ts       # OpenAPI 3.0 specification document
│   │   ├── prisma.ts             # Prisma client singleton (global caching)
│   │   ├── rate-limiter.ts       # In-memory rate limiter (5 req/min per IP)
│   │   ├── sanitize.ts          # XSS sanitization via isomorphic-dompurify
│   │   ├── useScrollReveal.ts    # IntersectionObserver scroll reveal hook
│   │   └── utils.ts              # Order number generation
│   ├── test/
│   │   ├── mocks/                # Prisma, next/headers mock implementations
│   │   ├── setup.ts              # Vitest global setup
│   │   └── utils/                # API test helpers
│   └── types/
│       └── index.ts              # Shared TypeScript interfaces (CartItem, DashboardStats, etc.)
├── proxy.ts                      # Next.js middleware (JWT admin route protection)
├── prisma.config.ts              # Prisma defineConfig
├── vitest.config.ts              # Vitest test runner configuration
├── next.config.ts                # Next.js config
├── vercel.json                   # Vercel deployment config
└── package.json
```

### 5.2 Coding Standards
- **Component Patterns:** Prefer functional components with explicit interfaces for props.
- **State Management:** Use React Context (`CartProvider`) for global UI state; server components for data fetching.
- **Data Fetching:** Server Components for initial data; client components with `useEffect` or events for interactivity.
- **Type Safety:** No `any`. Use Zod for runtime validation (cart, checkout).

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
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT signing and verification |
| `zod` | Runtime validation (cart, checkout) |
| `isomorphic-dompurify` | Server-side XSS sanitization |
| `chart.js` | Admin dashboard charts |
| `swagger-ui-react` | API documentation UI |
| `exceljs` | Data export to Excel |
| `sharp` | Image processing (devDependency) |
| `vitest` + `@testing-library/react` | Unit testing framework |

## 8. Testing

The project uses **Vitest** with ~99% test coverage across components and lib modules.

Tests live alongside their modules in `__tests__/` directories, with shared mocks and utilities in `src/test/`.

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

**Test locations:**
- `src/components/*/__tests__/` — Component tests (Cart, Layout, Order, UI)
- `src/lib/__tests__/` — Lib module tests (auth, prisma, utils, constants, etc.)
- `src/__tests__/api/` — API route handler tests
- `src/test/` — Test setup, mocks, and utility helpers

**Coverage includes:**
- Auth (JWT, bcrypt, sessions)
- Cart (localStorage, cookie sync)
- All UI components (ProductCard, StockBadge, StatusBadge, etc.)
- API routes (auth, orders, products, stats, track)
- Lib utilities (constants, utils, sanitize, rate-limiter, scroll-reveal)

## 9. Agent Instructions
- **Tooling:** Use `npx prisma` for database tasks. Use `npm run` scripts defined in `package.json`.
- **Windows Compatibility:** The OS is win32. Use forward slashes (`/`) in imports/code. For terminal commands, use bash-compatible syntax (the shell is bash).
- **Testing:** Tests live in `__tests__/` dirs alongside modules and in `src/__tests__/api/`. Run `npm run test:run` for CI-style single run.
- **Git:** Match the concise, "why-focused" commit style found in `git log`.
- **Vanilla CSS:** Do not install or use Tailwind CSS. Write CSS in `globals.css` using established custom properties.
- **Middleware:** `proxy.ts` acts as Next.js middleware, protecting `/admin/*` routes via JWT cookie verification using the `jose` library.
