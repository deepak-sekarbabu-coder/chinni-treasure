# Chinni Treasure — Little Love — Agent Documentation

This guide records the current architecture, workflows, and guardrails for agents and developers contributing to Chinni Treasure.

## 1. Agent Workflow

Use the repository as a Next.js App Router codebase with a deliberate server/client split. Before editing:

- Read the relevant route or page and its adjacent schema, helper, hook, or component.
- Follow the patterns already used in the surrounding feature area.
- Keep changes focused and consistent with the existing UX and modular CSS structure.
- For checkout, payment, authentication, inventory, or admin status changes, inspect both the route boundary and the helper modules that enforce validation and security.
- Run the smallest relevant verification command before claiming completion.

Use `/graphify` for cross-module architecture questions, relationship tracing, and dependency discovery. Do not use it for a single-file lookup or a straightforward symbol search.

`CONTEXT.md` is the domain and architecture glossary. In particular, use its cache-ownership rules and its list of open architecture seams when discussing refactoring opportunities.

## 2. Project Overview

Chinni Treasure is a luxury e-commerce storefront built with Next.js 16, React 19, Prisma, and PostgreSQL.

### Current stack

- Framework: Next.js 16.3.x with the App Router; `proxy.ts` provides request logging and admin-route protection.
- UI: React 19.2.x with React Context for the cart and React Query 5 for client-side server-state caching.
- Database: PostgreSQL through Prisma 7.9.x and `@prisma/adapter-pg`.
- Styling: modular raw CSS under `app/styles/`; Tailwind and other CSS frameworks are not used.
- Validation and sanitization: Zod 4, `src/lib/api/schemas.ts`, and `src/lib/sanitize.ts`.
- Authentication: JWT-based admin sessions in an `HttpOnly` `session` cookie, verified by `proxy.ts` and `src/lib/auth.ts`.
- Payments: Razorpay Standard Checkout plus manual UPI/bank-transfer handling.
- Supporting libraries: ExcelJS, jsPDF, JsBarcode, React Markdown, ioredis (optional Redis), and custom image loading.
- Observability: Axiom helpers under `lib/axiom/`, wired through request logging, route events, Web Vitals, and error instrumentation when configured.
- Hosting: Vercel configuration includes a daily `/api/cron/db-health` keep-alive job; Docker/Podman remains supported for self-hosting.
- Testing: Vitest 4 with Testing Library, jsdom, and coverage support.

## 3. Product and Admin Workflows

### Customer workflow

- Browse active, stock-aware products in the catalogue and by category.
- View product galleries, badges, compare-at pricing, and category metadata.
- Add products to the guest cart; the cart persists in `localStorage` and synchronizes with a server-side cookie for SSR hydration.
- Complete checkout with strict Indian phone, state, address, and PIN validation.
- Pay through Razorpay or use the manual payment fallback.
- View confirmation details and track an order by order ID or customer phone number.

Customer-facing catalogue surfaces include `/catalogue`, `/catalogue/[id]`, `/category/[slug]`, recent products, and the homepage “Latest in Every Category” section.

### Admin workflow

- Log in at `/admin/login`; `/admin/*` is protected by the session cookie and JWT verification.
- Manage products, product images, categories, display order, and active/inactive state.
- Review dashboard statistics and CSS-rendered charts.
- Manage order status, notes, tracking IDs, and printable shipping labels.

Order lifecycle rules are:

```text
pending → approved → packaging → shipped → delivered
   ↓
rejected (restores stock)
```

Transitions are validated server-side and use the order `version` for optimistic concurrency. A tracking ID is required before moving an order from `packaging` to `shipped`.

## 4. Architecture Reference

### Database shape

`prisma/schema.prisma` is the source of truth. Current models are:

- `Category`
- `Product`
- `ProductImage`
- `Order`
- `OrderItem`
- `OrderStatusHistory`
- `Admin`

Important enums:

- `OrderStatus`: `pending | approved | packaging | shipped | delivered | rejected`
- `ProductBadge`: `bestseller | new | premium | limited | luxury`
- `AdminRole`: `admin | super_admin`

Products support optional SKUs, compare-at prices, multiple images, soft deletion, stock quantities, active state, category assignment, and `visibleHostnames` for multi-domain filtering. Orders retain customer/address data, payment and tracking identifiers, totals, versioning, line-item snapshots, and status history.

### Cache ownership

Redis is optional. `src/lib/redis-cache.ts` uses Redis when `REDIS_URL` is configured and falls back to the in-memory cache in `src/lib/cache.ts` otherwise. The fallback is suitable for local development but is per-instance in serverless deployments.

Cache ownership is intentionally split by domain:

- `src/lib/catalogue-cache.ts` owns products, the active-product index (`catindex`, used to serve public catalogue searches from memory), categories, latest-per-category, category-page, and recent-product caches. Any product or category mutation invalidates all six through `invalidateCatalogCaches()`.
- `src/lib/order-cache.ts` owns order-detail and tracking caches. It also clears the order-derived stats cache after order mutations through `invalidateOrderCache(orderId?)`.
- `src/lib/stats-cache.ts` owns the dashboard statistics cache; invalidation is owned by `order-cache.ts` because stats derive from orders.
- `src/lib/redis.ts` owns the shared ioredis client and is `null` when Redis is not configured.

Routes must import owned caches from these modules. They should not create caches inline or maintain a separate hardcoded invalidation list.

Cached routes/data include public catalogue queries, recent products, order tracking/detail lookups, and admin stats. Do not cache cart state, JWT sessions, admin CRUD responses, or binary assets.

### Critical server boundaries

- Cart state has both a client guest representation and a signed/server-controlled cookie representation; preserve the existing synchronization helpers.
- Order placement performs server-side price/stock validation and atomic stock mutation inside the order workflow. Rejection restores stock according to the existing status rules.
- Admin API requests must use the existing JWT helpers and session-cookie conventions.
- Payment routes use the existing CSRF/origin checks. Payment signature verification is handled server-side.
- Public API schemas and response shapes are documented through `src/lib/openapi-spec.ts` and `/api/docs`; update the contract when changing an API.
- `proxy.ts` logs page traffic to Axiom when configured and protects `/admin/*`. API routes, static assets, and metadata are excluded from its page-traffic matcher.

## 5. Development Guardrails

1. **Styling**
   - Do not introduce Tailwind or another UI framework.
   - Put new styles in the relevant file under `app/styles/`.
   - Do not add feature CSS to `app/globals.css`; it is the modular entry point.
   - Preserve tokens and typography variables in `app/styles/variables.css`.

2. **Security and authentication**
   - Verify and decode admin JWTs server-side.
   - Use password helpers from `src/lib/auth.ts`; do not add ad hoc hashing.
   - Preserve CSRF/origin protection on payment and other state-changing routes.
   - Never expose server-only secrets or commit real `.env` files.

3. **Validation and data integrity**
   - Keep API input/output validation schema-driven through Zod.
   - Sanitize HTML and user-facing content through `src/lib/sanitize.ts`.
   - Preserve checkout phone, PIN, address, price, stock, and order-transition rules.
   - Use the existing Prisma transaction and concurrency patterns for inventory and order mutations.

4. **Accessibility and UX**
   - Keep visible focus styles intact.
   - Preserve tap targets of at least 44×44px on mobile.
   - Respect reduced-motion and contrast preferences.
   - Maintain loading, error, empty, and not-found states when changing a route or data-fetching component.

5. **Environment**
   - Read environment variables defensively.
   - Update `.env.example` whenever a new configuration variable is introduced.
   - `DATABASE_URL` is used at runtime; `DIRECT_URL` is used by Prisma CLI operations.
   - Optional infrastructure variables are `REDIS_URL`, Axiom variables (`NEXT_PUBLIC_AXIOM_TOKEN`, `NEXT_PUBLIC_AXIOM_DATASET`, optional `NEXT_PUBLIC_AXIOM_EDGE`), and `CRON_SECRET`.

## 6. Repository Map

```text
chinni-treasure/
├── app/                         # App Router pages, layouts, API routes, and modular CSS
│   ├── admin/                   # Protected dashboard, catalogue/categories/orders UI
│   ├── api/                     # Auth, catalogue, categories, orders, payments, stats, health, docs, cron
│   ├── catalogue/               # Product listing and product detail routes
│   ├── category/                # Category product pages
│   ├── confirmation/            # Order confirmation route
│   ├── docs/                    # API docs viewer
│   ├── order/                   # Checkout route
│   ├── track/                   # Order tracking route
│   ├── styles/                  # Modular raw CSS files
│   ├── globals.css              # CSS import entry point
│   └── layout.tsx               # Root metadata, providers, navbar, and footer
├── lib/axiom/                   # Axiom server/client/logger helpers
├── src/components/              # UI, layout, cart, order, admin, and page components
├── src/lib/                     # Auth, Prisma, cache ownership, API schemas/client, hooks, images, utilities
├── src/types/                   # Shared types and Razorpay declarations
├── src/__tests__/               # Vitest API, library, hook, and component tests
├── prisma/                      # Schema, seed data, and four migration directories
├── docs/                        # Architecture notes, ADRs, plans, and review documents
├── public/                      # Branding, generated assets, icons, manifest, robots, and static files
├── scripts/                     # Import/export, seed, repro, static/dynamic boundary check, Fallow-report, and Lighthouse runner utilities
├── lighthouse/                  # Routes and performance budgets for the Lighthouse runner (reports are gitignored)
├── proxy.ts                     # Axiom page logging and admin route protection
├── instrumentation.ts           # Next.js instrumentation entry point
├── next.config.ts               # Headers, CORS, images, redirects, and deployment settings
├── prisma.config.ts             # Prisma CLI configuration
├── vercel.json                  # Vercel build settings and database-health cron
├── Dockerfile                   # Self-hosted container image
├── docker-compose.yml           # Podman/Compose services
├── package.json                 # Scripts and dependency manifest
└── .env.example                 # Safe environment-variable template
```

## 7. Working Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Check static/dynamic boundaries, generate Prisma Client, and build the production bundle |
| `npm start` | Start the production server |
| `npm run lint` | Check static/dynamic boundaries, then run ESLint |
| `npm run lint:fix` | Run ESLint with fixes |
| `npm run check:static-dynamic` | Verify the server/client component boundary rules (`scripts/check-static-dynamic.mjs`) |
| `npm run typecheck` | Run TypeScript validation (`tsc --noEmit`) |
| `npm test` | Run Vitest in watch mode |
| `npm run test:run` | Run Vitest once |
| `npm run test:coverage` | Run Vitest with coverage |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push the Prisma schema to PostgreSQL |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:setup` | Generate Prisma Client, push schema, and seed |
| `npm run data:export` | Export catalogue/order data to Excel |
| `npm run data:import` | Generate seed data from Excel |
| `npm run compose:build` | Build container services with Podman Compose |
| `npm run compose:up` | Start container services |
| `npm run compose:down` | Stop container services |
| `npm run fallow` | Run Fallow code-quality analysis |
| `npm run fallow:report` | Generate the Fallow report artifacts |
| `npm run lighthouse` | Run the Lighthouse performance audit (`scripts/run-lighthouse.mjs`) |
| `npm run lighthouse:desktop` | Run the Lighthouse audit with desktop emulation |
| `npm run lighthouse:analyze` | Analyze Lighthouse reports against the budgets in `lighthouse/` |
| `npm run lighthouse:report` | Open the latest Lighthouse report |
| `npm run clean` | Remove `.next`, `.turbo`, and `node_modules` |
| `npm run clean:cache` | Remove `.next` and `.turbo` only |
| `npm run clean:all` | Clean and reinstall dependencies |

### Environment variables

Required for the full application:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Runtime PostgreSQL connection |
| `DIRECT_URL` | Prisma CLI connection for migrations/introspection |
| `JWT_SECRET` | Admin session signing secret |
| `NEXT_PUBLIC_SITE_URL` | Public URL for metadata, sitemap, and absolute links |
| `ALLOWED_ORIGIN` | Comma-separated allowed API origin(s) |
| `RAZORPAY_KEY_ID` | Server-side Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Server-only Razorpay secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Browser-exposed Razorpay key ID |

Optional configuration includes `NEXT_PUBLIC_IMAGE_UNOPTIMIZED`, `REDIS_URL`, Axiom variables (`NEXT_PUBLIC_AXIOM_TOKEN`, `NEXT_PUBLIC_AXIOM_DATASET`, optional `NEXT_PUBLIC_AXIOM_EDGE`), `CRON_SECRET`, `NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS`, and `NEXT_PUBLIC_ENABLE_SURPRISE_GIFT`. See `.env.example` for setup notes and safe placeholders.

## 8. Verification Expectations

Use the smallest relevant verification that proves the change is safe:

- `npm run typecheck` for TypeScript or shared-contract changes.
- `npm run test:run` for behavior, API, cache, hook, or component changes.
- `npm run lint` for UI, hooks, route, or static-safety changes.
- `npm run build` when changing Next.js configuration, Prisma integration, route boundaries, or deployment behavior.

For checkout or payment changes, inspect the server route, CSRF/origin checks, amount and stock validation, transaction flow, and payment verification path before marking the work complete. For cache changes, confirm both the Redis and in-memory fallback paths and verify invalidation at the owning module boundary.
