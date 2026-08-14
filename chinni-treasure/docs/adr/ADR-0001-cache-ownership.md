# ADR-0001: Cache ownership by domain modules

- **Status:** Accepted
- **Date:** 2026-08-14
- **Related:** `CONTEXT.md` → *Architecture modules* and *Cache-ownership rule*

## Context

The caching layer had no owner for the concept "the catalogue is one thing that
must invalidate together."

- Each of the 7 cached routes called `createRedisCache(ttl, "namespace")`
  inline, so namespace knowledge was scattered across `app/api/*`.
- Invalidation lived in `src/lib/cache-invalidate.ts` as a **hardcoded string
  list** (`["products", "categories", "catlatest", "catpage", "recent"]`) plus a
  second hardcoded list for tracking keys. Adding a new cached query required
  remembering to edit the central list; the `stats` namespace was never
  invalidated on mutation at all, leaving the dashboard stale for up to the TTL.
- Invalidation deleted Redis keys only — the per-instance in-memory fallback was
  never cleared, so a Vercel instance that had been running with Redis down could
  keep serving stale data after a mutation.
- The fallback of the dual-path cache (`createRedisCache` → in-memory
  `createCache`) was duplicated per namespace and had no single-key delete, so
  invalidating one order required either deleting the whole namespace or another
  hardcoded key format string.

## Decision

Cache namespaces are **owned by domain modules**, never created inline in routes
and never invalidated by a central hardcoded list.

1. **`src/lib/catalogue-cache.ts`** owns the five catalogue caches —
   `products`, `categories`, `catlatest`, `catpage`, `recent` — and exports
   `invalidateCatalogCaches()`, which clears exactly what the module owns.
2. **`src/lib/order-cache.ts`** owns the order-detail (`order`) and tracking
   (`track`) caches and exports `invalidateOrderCache(orderId?)`, which removes
   the single order key, clears all tracking keys, **and** clears the stats
   cache (stats are order-derived).
3. **`src/lib/stats-cache.ts`** owns the `stats` cache; its invalidation is
   delegated to the order cache module.
4. **Cache-ownership rules** (codified in `CONTEXT.md`):
   - A route never creates a cache inline — it imports an owned cache.
   - Invalidation clears what the owning module owns — never a hardcoded list.
   - Mutating an Order invalidates Order caches **and** stats; mutating any
     catalogue entity invalidates the whole Catalogue.
5. `createRedisCache` gained a single-key `remove(key)` (with a matching
   `remove` on the in-memory fallback), the primitive `invalidateOrderCache`
   needed to drop one order key without nuking the namespace.
6. `src/lib/cache-invalidate.ts` and `src/lib/products-cache.ts` were deleted;
   the Redis primitives (`cache.ts`, `redis-cache.ts`, `redis.ts`) are unchanged
   in responsibility.

## Consequences

**Positive**

- **Locality:** adding a cached catalogue query can no longer be forgotten by
  invalidation — the module owns both creation and clearing.
- **Correctness:** invalidation now clears the in-memory fallback too, closing
  the stale-data-after-Redis-outage window; `stats` is no longer permanently
  TTL-only.
- **Testability:** each owning module has a direct unit test surface
  (`catalogue-cache.test.ts`, `order-cache.test.ts`) asserting exactly which
  namespaces survive invalidation — no HTTP harness required.

**Negative / trade-offs**

- **Coarse blast radius:** any catalogue mutation clears all five catalogue
  namespaces (unchanged from before, but now explicit). Writes are rare enough
  that this churn is acceptable; if it becomes a problem, the module is the
  single place to introduce finer-grained invalidation.
- **Per-instance fallback is still per-instance:** the in-memory fallback does
  not share state across serverless instances. That is a pre-existing property
  of the dual-path design, now documented rather than hidden; Redis remains the
  source of truth across instances.
- The `stats` cache is cleared on order status changes but **not** on order
  placement (`POST /api/orders`) — that gap is deliberately left open and is
  tracked under the Order module deepening opportunity (review candidate 1).

## Alternatives considered

- **A central registry** (`createRedisCache` auto-registers namespaces; a single
  invalidator iterates the registry): rejected — it moves the hardcoded list
  into the primitive instead of giving the catalogue concept a named owner, and
  makes "what invalidates together" implicit rather than declared in one module.
- **Keeping `cache-invalidate.ts` as a facade** re-exporting both invalidators:
  rejected — the facade would be a shallow module (interface ≈ implementation)
  and would keep the invalidation entry points separate from the caches they
  clear.
