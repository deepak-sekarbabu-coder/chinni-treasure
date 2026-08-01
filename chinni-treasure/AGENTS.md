# Chinni Treasure — Little Love — Agent Documentation

This guide captures the working assumptions, architecture, and guardrails for AI agents and developers contributing to the Chinni Treasure repository.

---

## 1. Agent Workflow

Use the repository as a Next.js App Router codebase with a strong server/client split. When making changes:

- Read the relevant route, page, and its adjacent model/schema/helper before editing.
- Prefer the existing patterns already used in the surrounding feature area.
- Keep changes minimal and consistent with the current product UX and CSS structure.
- For checkout, payment, auth, stock mutation, or admin status transitions, review the matching server route and the helper modules that enforce validation and security.
- Verify the affected area with the relevant lint/type/test command before claiming completion.

### Graphify (Knowledge Graph)

Use `/graphify` for cross-module architecture questions, relationship tracing, and dependency discovery. Avoid it for single-file lookups or straightforward symbol searches.

---

## 2. Project Overview

Chinni Treasure is a luxury e-commerce storefront built on Next.js 16, React 19, Prisma, and PostgreSQL.

### Technical Stack

- Framework: Next.js 16.2.6 with the App Router and React 19.2.4
- Database: PostgreSQL with Prisma ORM 7.8.0 via `@prisma/adapter-pg`
- Styling: Modular raw CSS under `app/styles/` (30 files) with custom CSS variables and no Tailwind usage
- State management: React Context + `localStorage` cart persistence for guests, plus server-side cookie cart hydration
- Server state: React Query (`@tanstack/react-query` v5.101.0 + devtools) for client-side caching and data fetch orchestration
- Authentication: JWT-based admin auth stored in an `HttpOnly` `session` cookie
- Validation: Zod v4.4.3 for checkout, cart, and API request/response validation
- Payments: Razorpay Standard Checkout plus manual UPI/bank transfer flows
- Utility stack: `dayjs`, `exceljs`, `jspdf`, `jsbarcode`, `sharp`, `react-markdown`
- Analytics: Vercel Analytics + Speed Insights
- Testing: Vitest v4.1.7 with @testing-library/react v16.3.2, @testing-library/jest-dom, @testing-library/user-event, and jsdom

---

## 3. Core Product & Admin Workflows

### Customer Workflow

The storefront is designed to support:

- Product discovery and stock-aware cart interactions
- **Category-based browsing** with dedicated `/category/[slug]` pages (paginated, sortable, SEO-friendly) and a homepage "Latest in Every Category" section
- Checkout with strict Indian address and phone/PIN validation
- Online payment via Razorpay or manual payment fallback
- Order tracking by order ID or customer phone number
- Historical order timeline review for the customer

### Admin Workflow

The admin experience is responsible for:

- Secure login and authenticated access to protected admin routes
- Catalogue CRUD operations with validation and active/inactive state management
- **Category CRUD operations** with validation, display order, and active/inactive state management
- Revenue and order analytics rendered through pure CSS charts
- Order lifecycle updates with explicit status rules:

```text
pending → approved → packaging → shipped → delivered
   ↓
rejected (restores stock)
```

A tracking ID is required before an order can transition from `packaging` to `shipped`.

---

## 4. Architecture Notes

### Database Shape

The Prisma schema is the source of truth for the domain model. Current core entities include:

- `Category`
- `Product`
- `ProductImage`
- `Order`
- `OrderItem`
- `OrderStatusHistory`
- `Admin`

Important enum values:

- `OrderStatus`: `pending | approved | packaging | shipped | delivered | rejected`
- `ProductBadge`: `bestseller | new | premium | limited | luxury`
- `AdminRole`: `admin | super_admin`

### Redis Caching (shared, with in-memory fallback)

Redis is optional (`REDIS_URL`). Every Redis-backed module falls back to an in-memory store when `REDIS_URL` is unset, so the app works identically in local dev and on serverless where a shared cache matters.

- `src/lib/redis.ts` — single `ioredis` client; exports `null` when `REDIS_URL` is unset.
- `src/lib/redis-cache.ts` — `createRedisCache(ttlMs, namespace)` provides async `get`/`set`/`clear`. `clear()` SCANs + DELs the `namespace:*` prefix. TTLs are short (15–300s) and payloads small to stay well under Redis Cloud's 30 MB free tier.
- `src/lib/cache-invalidate.ts` — `invalidateCatalogCaches()` clears the catalog namespaces (`products`, `categories`, `catlatest`, `catpage`, `recent`) after any product/category mutation; `invalidateOrderCache(orderId)` clears the order detail + tracking namespaces after status/tracking changes.
- `src/lib/rate-limiter.ts` — shared `INCR` + `EXPIRE` sliding window with per-route limits (`checkRateLimit(key, maxAttempts)`); used for login (5), checkout (3), Razorpay order creation (5), and tracking lookups (10).

Cached public routes: products listing, categories, categories/latest, category product pages, recent products, order tracking, order detail, and the admin stats dashboard. Never cache: cart data (client-side), JWT sessions (stateless), admin CRUD responses, or binary assets.

### Critical Server Boundaries

- The cart is synchronized through a guest client cart and a server-side cookie-backed cart.
- Stock is decremented server-side during order finalization, and restored when an order is rejected.
- Order status updates use versioning/optimistic concurrency to avoid blind overwrites.
- Admin requests are protected by the middleware in `proxy.ts` and JWT verification helpers in `src/lib/auth.ts`.
- Razorpay order creation and payment verification validate CSRF origin before execution.

---

## 5. Development Guardrails

All modifications must follow these repository conventions:

1. Styling integrity
   - Do not introduce TailwindCSS or another UI framework.
   - Keep new styles in the relevant file under `app/styles/`.
   - Do not add new CSS into `app/globals.css`; use the modular style entry points instead.
   - Preserve the existing color tokens and typography variables defined in `app/styles/variables.css`.

2. Security and auth
   - Verify and decode admin JWTs server-side.
   - Use the password hashing helpers in `src/lib/auth.ts` rather than ad hoc hashing.
   - Protect payment routes with the existing CSRF flow.

3. Accessibility
   - Keep visible focus styles intact.
   - Preserve tap targets of at least 44×44px on mobile.
   - Respect reduced-motion and contrast preferences.

4. Input validation
   - Sanitize HTML and user-facing input via `src/lib/sanitize.ts`.
   - Keep validation strict and schema-driven through Zod.
   - Follow the existing postal-code, phone-number, and stock/price rules for checkout and cart flows.

5. Environment safety
   - Read environment variables defensively and never commit real `.env` files.
   - Update `.env.example` if a new configuration variable is introduced.

---

## 6. Repository Map

```text
chinni-treasure/
├── app/                        # Next.js App Router pages and API routes
│   ├── admin/                  # Protected admin UI and admin state hook
│   ├── api/                    # Server API handlers (products, orders, auth, payment, stats, tracking, categories, health)
│   ├── catalogue/              # Product listing + product detail pages (/catalogue/[id])
│   ├── category/               # Category browsing pages (/category/[slug])
│   ├── confirmation/           # Order confirmation pages
│   ├── docs/                   # API docs viewer
│   ├── order/                  # Checkout flow
│   ├── track/                  # Order tracking experience
│   ├── styles/                 # Modular raw CSS files (30 files)
│   ├── globals.css             # CSS entry point that imports the modular styles
│   └── layout.tsx              # Root layout, fonts, providers, navbar, footer
├── docs/                       # Project notes and implementation docs
├── prisma/                     # Prisma schema, seed scripts, and migrations (5 migrations)
├── public/                     # Static assets, manifest, robots, and branding
├── scripts/                    # One-off automation utilities (Excel, seed, repro)
├── src/
│   ├── components/             # UI, layout, cart, order, admin, and page-level components
│   ├── lib/                    # Auth, Prisma, cache, utilities, hooks, API schema helpers, images
│   ├── types/                  # Shared TypeScript types and Razorpay SDK typings
│   └── __tests__/              # Vitest test suites (45 test files) and shared test setup
├── proxy.ts                    # Middleware for admin route protection (JWT verification)
├── prisma.config.ts            # Prisma config
├── next.config.ts              # Next.js config
├── Dockerfile                  # Container build definition
├── docker-compose.yml          # Podman/Compose service definition
├── vitest.config.ts            # Vitest config
├── eslint.config.mjs           # ESLint flat config
├── package.json                # Project scripts and dependencies
└── .env.example                # Environment variable template (includes DIRECT_URL, NEXT_PUBLIC_IMAGE_UNOPTIMIZED)
```

---

## 7. Working Commands

Use the following npm scripts during development and maintenance:

| Command | Action |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run build` | Generate the Prisma client and build the production bundle |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run typecheck` | Run TypeScript validation (`tsc --noEmit`) |
| `npm test` | Run Vitest in watch mode |
| `npm run test:run` | Run Vitest once |
| `npm run test:coverage` | Run Vitest with coverage |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:push` | Push the Prisma schema to PostgreSQL |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:setup` | Generate Prisma client, push schema, and seed the database |
| `npm run data:export` | Export data to Excel |
| `npm run data:import` | Generate seed data from Excel |
| `npm run clean` | Remove `.next`, `.turbo`, and `node_modules` |
| `npm run clean:cache` | Remove `.next` and `.turbo` only |
| `npm run clean:all` | Clean and reinstall dependencies |
| `npm run compose:build` | Build container images (Podman) |
| `npm run compose:up` | Start container services (Podman) |
| `npm run compose:down` | Stop container services (Podman) |
| `npm run fallow` | Run Fallow code quality analysis (complexity, duplication, dead code) |

### Required Environment Variables

| Variable | Purpose | Required |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (used by Prisma Client at runtime) | Yes |
| `DIRECT_URL` | Direct PostgreSQL URL (used by Prisma CLI for migrations/introspection) | Yes, for Prisma CLI |
| `RAZORPAY_KEY_ID` | Razorpay API key ID | Yes, for payments |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret | Yes, for payments |
| `JWT_SECRET` | Secret for admin session JWT signing | Yes |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (metadata, sitemap, absolute links) | Yes |
| `ALLOWED_ORIGIN` | Comma-separated list of allowed CORS origins | Yes |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key exposed to the browser | Yes, for payments |
| `NEXT_PUBLIC_IMAGE_UNOPTIMIZED` | Set to `true` to disable Next.js image optimization (uses plain `<img>`) | No |

---

## 8. Verification Expectations

Before closing a task, use the smallest relevant verification that proves the change is safe:

- `npm run typecheck` for type-level regressions
- `npm run test:run` for behavior-level regressions
- `npm run lint` for style and static safety if the change affects UI or hooks

If a change affects payment or checkout behavior, double-check the server route boundary, CSRF enforcement, and stock mutation path before marking the task complete.
