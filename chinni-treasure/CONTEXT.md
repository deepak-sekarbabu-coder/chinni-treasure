# Chinni Treasure — Domain Glossary (CONTEXT.md)

Living vocabulary for architecture reviews and agents working in this codebase.
Architecture terms follow the codebase-design vocabulary (see [Design vocabulary](#design-vocabulary)).
Terms marked **seam** are names for good module boundaries — use them when talking about deepening opportunities.

## Domain concepts

| Term | Meaning | Where it lives |
|---|---|---|
| **Product** | The sellable unit. Has `sku`, `price`, `compareAtPrice` (MRP for strikethrough display), `stockQuantity`, `badge`, `visibleHostnames` (multi-domain filter), soft-delete (`deletedAt`), and multiple `ProductImage`s (one primary). | `prisma/schema.prisma` |
| **Category** | Product grouping with `slug`, `displayOrder`, `isActive`. Deleting is blocked while non-deleted products reference it (409). | `prisma/schema.prisma`, `app/api/categories/*` |
| **Catalogue** | The customer-facing listing surface: product listings, category pages, "latest per category", and recent products. Treated as **one concept** for caching — see [Catalogue cache module](#architecture-modules). | `app/api/products/*`, `app/api/categories/*`, `app/api/category/[slug]/products` |
| **Cart** | Guest cart: React Context + `localStorage`, synced to a server-side cookie for SSR. | `src/components/cart/CartProvider.tsx`, `src/lib/cart-cookie.ts` |
| **Checkout** | The multi-step order page (details → delivery → payment & review). Computes a client-side preview of totals. | `app/order/page.tsx` |
| **Pricing** | The money module: subtotal (parent lines **plus** gift-box lines), shipping (₹599 free threshold; ₹150 TN / ₹200 elsewhere; `0000`-SKU test product ships free), and total. Carries rupee floats; the exact paid==stored invariant is owned by the Order seam. Decided Sep 2026: subtotal includes gift-box prices — paid == stored going forward. | `src/lib/pricing.ts` (planned) |
| **Order** | The aggregate: `orderNumber`, customer + address, `status`, `version` (optimistic concurrency), `subtotal`/`shippingCost`/`totalAmount`, `transactionId`, `trackingId`, `items`, `statusHistory`. | `prisma/schema.prisma` |
| **OrderItem** | Price/name snapshot of a product at purchase time; `productId` is nullable (SetNull when the product is deleted). | `prisma/schema.prisma` |
| **Fulfilment** | The status flow: `pending → approved → packaging → shipped → delivered`, with `rejected` (restores stock). Tracking ID required at `shipped`; transitions are versioned. | `src/lib/constants.ts` (`ORDER_STATUS_FLOW`), `app/api/orders/[id]/status` |
| **Payment** | The Razorpay gateway flow: `create-order` (client-computed amount), `verify-payment` (HMAC-SHA256 signature), and `transactionId` recorded on the Order. **Known gap:** no invariant linking paid amount to the server-computed order total (see [Open seams](#open-seams)). | `app/api/create-order`, `app/api/verify-payment`, `app/api/orders` |
| **Inventory** | `stockQuantity` on Product. Deducted atomically at order placement (serializable transaction), restored on rejection. | `app/api/orders/route.ts` |
| **Admin** | The dashboard surface: JWT session in an HttpOnly cookie (`proxy.ts` guards `/admin/*`), roles `admin` / `super_admin`, stats + charts, catalogue/category/order CRUD. | `app/admin/*`, `src/lib/hooks/useAdmin*Controller.ts` |

## Architecture modules

These are **deep modules** — small interfaces, big hidden implementations — that own a concept. Future reviews should deepen around these seams, not re-litigate them.

### Catalogue cache module — *seam*
`src/lib/catalogue-cache.ts`. Owns **all six catalogue caches** (`products`, `catindex`, `categories`, `catlatest`, `catpage`, `recent`) and exports `invalidateCatalogCaches()`, which clears exactly what the module owns (the namespace in Redis via SCAN+DEL **plus** the local in-memory fallback). Routes import their cache from this module; they never call `createRedisCache` themselves. **Resolved by the Aug 2026 architecture review** — do not re-suggest a hardcoded namespace list. The `catindex` cache holds the full active-product list per hostname so public catalogue searches filter in memory instead of querying Postgres per request.

### Order cache module — *seam*
`src/lib/order-cache.ts`. Owns the order-detail cache (`order`) and the tracking cache (`track`), plus `invalidateOrderCache(orderId?)`. Order-derived **stats are cleared here too** — on any order mutation (status change / tracking update), the dashboard cache must refresh.

### Stats cache module
`src/lib/stats-cache.ts`. The dashboard statistics cache. Invalidation is owned by the Order cache module (stats derive from orders).

### Cache primitives
`src/lib/redis-cache.ts` (`createRedisCache(ttlMs, namespace)`) over `src/lib/cache.ts` (`createCache` in-memory fallback) and `src/lib/redis.ts`. The dual path is deliberate: Redis when `REDIS_URL` is set, in-memory fallback otherwise.

### Cache-ownership rule
1. A route never creates a cache inline — it imports an owned cache from the module that owns the concept.
2. Invalidation clears what the owning module owns — never a hardcoded string list in a central file.
3. Mutating an Order (or its status) invalidates Order caches **and** stats; mutating any catalogue entity invalidates the whole Catalogue.

### Pricing module — *seam* (planned)
`src/lib/pricing.ts`. One money computation shared by the checkout preview and the server finalize. Takes flat priced lines (`{ price, quantity, sku? }`) + `stateCode` → `{ subtotal, shippingCost, totalAmount }`. Owns the ₹599 free-shipping threshold, the TN/non-TN charges, and the `0000`-SKU test-product override; absorbs `calcShippingCost`. Two real callers justify the seam. Decided Sep 2026: subtotal **includes gift-box prices** so paid == stored going forward (historical orders keep their stored totals); money stays rupee floats — integer-paise arithmetic and the exact paid==stored comparison belong to the Order seam; display formatting lives beside it in `src/lib/format.ts`. Gift-box bundling rules stay with the Order intake, not Pricing.

## Design vocabulary

Terms from the codebase-design vocabulary, used exactly in architecture discussion:

- **Module** — a unit with an interface and an implementation. A **deep** module hides big complexity behind a small interface; a **shallow** module has interface ≈ implementation.
- **Interface** — what callers must know to use the module. **The interface is the test surface** — tests should exercise the interface, not the HTTP harness.
- **Seam** — a place where behavior can be swapped or intercepted; the boundary a deepening refactor targets.
- **Adapter** — a thin layer translating between the module interface and the outside world (e.g. HTTP handlers, a payment gateway client).
- **Leverage** — how much work a small amount of interface buys; deep modules are high-leverage.
- **Locality** — related things living together; the opposite of "bounce across eight files to understand one concept."
- **Deletion test** — would deleting this module *concentrate* complexity (deep, keep it) or just *move* it (shallow, merge it)? "Yes, concentrates" is the signal for a deepening opportunity.

## Open seams

Findings from the Aug 2026 architecture review, not yet addressed:

- **Order module** (candidate 1, *Strong*) — placement / fulfilment / payment logic lives inline in HTTP handlers; inventory knowledge is split; the payment flow lacks an amount-integrity invariant.
- **Pricing policy** (candidate 2, *Strong*) — shipping + total computed twice (checkout preview vs server finalize). **Decisions made (Sep 2026):** deepen into `src/lib/pricing.ts` (planned); subtotal includes gift-box prices (paid == stored, forward); rupee floats; separate `src/lib/format.ts`. Not yet implemented.
- **One contract, not four** (candidate 3, *Worth exploring*) — input contracts duplicated as server Zod, client Zod, and hand-rolled checkout rules. **Partially resolved (Aug 2026):** the 9× copy-pasted `.safeParse` 400 block in the API routes is now one shared helper, `validateOr400` in `src/lib/validate.ts`; the remaining duplication — server Zod vs client Zod vs hand-rolled checkout rules — is still open.
- **Admin dashboard mesh** (candidate 5, *Speculative*) — six controller hooks behind a 25-key interface. **Partially resolved (Aug 2026):** the duplicated cache patching collapsed into `patchProductCache` / `removeProductFromCache` (one key-group list drives both admin lists and catalogue grids) and the controllers have direct hook tests. **Direction agreed (Sep 2026 review):** if the dashboard keeps growing, deepen toward **panel-view modules** — one `useAdmin<Panel>Panel` module co-located in each lazy-loaded panel file exposing a typed `{ data, loading, actions }` view-model, with the page keeping auth gate, tab state, stats/charts, and selected-order state (the page-level modals keep selection at the aggregate). Cache patching stays in `useAdminMutations`. Constraint that decides the shape: panels are `next/dynamic` with `ssr: false`, so the module must live in the panel file, not an eager page-level bundle.

**Resolved:** Catalogue cache module (candidate 4) — done Aug 2026.
