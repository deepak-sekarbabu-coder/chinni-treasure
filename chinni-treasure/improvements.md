# Chinni Treasure — Improvement Recommendations

> Generated: 2026-06-20 | Project: chinni-treasure

---

## Critical Security Fixes (Immediate)

| # | Issue | File | Impact |
|---|---|---|---|
| 1 | **Hardcoded JWT fallback `"dev-secret"`** — if `JWT_SECRET` is unset in production, sessions are signed with a known public string | `src/lib/auth.ts:9`, `proxy.ts:5` | Admin account takeover |
| 2 | ~~**Session cookie missing `Secure` flag**~~ **FIXED** — added `Secure` flag in production mode | `src/lib/auth.ts:46-58` | Session hijacking |
| 3 | ~~**`sanitize()` is a simple regex, not DOMPurify`~~ **FIXED** — replaced with `isomorphic-dompurify` | `src/lib/sanitize.ts` | XSS risk |
| 4 | **CORS defaults to `*`** — allows any origin to access API endpoints | `next.config.ts:5-6` | Data leakage |

### Recommended Fixes

**1. JWT Secret — throw in production if unset:**

```ts
// src/lib/auth.ts
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}
const SECRET = encoder.encode(process.env.JWT_SECRET || "dev-secret");
```

**2. Session cookie — use `Set-Cookie` with `Secure`:**

```ts
// src/lib/auth.ts — createSessionCookie()
return `${COOKIE_NAME}=${token}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=86400`;
```

**3. Sanitize — install and use DOMPurify:**

```bash
npm install isomorphic-dompurify
```

```ts
// src/lib/sanitize.ts
import DOMPurify from "isomorphic-dompurify";
export function sanitize(input: string): string {
  return DOMPurify.sanitize(input.trim());
}
```

**4. CORS — default to actual domain:**

```ts
// next.config.ts
{ key: "Access-Control-Allow-Origin", value: process.env.ALLOWED_ORIGIN || "https://chinnitreasure.in" }
```

---

## High Priority (Before Next Release)

| # | Area | Details |
|---|---|---|
| 5 | **In-memory rate limiter** | Won't work on serverless/Vercel (each cold start resets). Needs Redis/Upstash |
| 6 | **Tracking endpoint exposes full PII** | Returns `customerEmail`, `customerPhone`, `transactionId` to unauthenticated users |
| 7 | ~~**Stats endpoint fetches ALL order items**~~ **FIXED** — replaced with Prisma `groupBy` SQL aggregation | Aggregation done in SQL |
| 8 | ~~**Export endpoint loads entire DB into memory**~~ **FIXED** — cursor-based pagination in 1000-record batches | Batched reads |
| 9 | ~~**Missing `allowed_origin` env var in `.env.example`**~~ **FIXED** — added `ALLOWED_ORIGIN` | Documented |

### Recommended Fixes

**5. Replace in-memory rate limiter with Redis-backed store:**

```bash
npm install @upstash/ratelimit @upstash/redis
```

```ts
// src/lib/rate-limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
});
```

**6. Reduce PII in public tracking endpoint:**

```ts
// app/api/track/route.ts — formatOrderResults()
return results.map((order) => ({
  orderNumber: order.orderNumber,
  status: order.status,
  trackingId: order.trackingId,
  totalAmount: order.totalAmount,
  createdAt: order.createdAt,
  items: order.items.map((i) => ({
    productName: i.productName,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
  })),
}));
```

**7. Stats aggregation — move to SQL:**

```ts
// app/api/stats/route.ts
const salesByProduct = await prisma.orderItem.groupBy({
  by: ["productName"],
  _sum: { quantity: true, unitPrice: true },
  _count: true,
  orderBy: { _sum: { quantity: "desc" } },
});
```

**8. Export — add pagination limits:**

```ts
// app/api/export/route.ts
const MAX_ORDERS = 10000;
const orders = await prisma.order.findMany({
  take: MAX_ORDERS,
  orderBy: { createdAt: "desc" },
});
```

**9. Update `.env.example`:**

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/chinni_treasure
JWT_SECRET=your-super-secret-key-change-this-in-production
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ALLOWED_ORIGIN=http://localhost:3000
```

---

## Medium Priority (Plan for Next Sprint)

| # | Area | Details |
|---|---|---|
| 10 | **Root layout DB call on every page navigation** | Cart hydration queries Prisma on every request — should be client-only or cached |
| 11 | **In-memory cache not shared across serverless instances** | Use Vercel KV or Redis |
| 12 | **`window.location.href` after login** — required for middleware cookie timing; full reload guarantees cookie availability before middleware check | Deferred (architectural constraint) |
| 13 | ~~**Loading spinners lack `role="status"` / `aria-label`**~~ **FIXED** — added `role="status"`, `aria-live="polite"`, and `sr-only` text | Announced by screen readers |
| 14 | ~~**Form error messages not linked to inputs via `aria-describedby`**~~ **FIXED** — added `aria-describedby` + `aria-invalid` to all form fields | Programmatically associated |
| 15 | ~~**`outline: none` without `forced-colors` fallback**~~ **FIXED** — added `@media (forced-colors: active)` block | Visible in Windows High Contrast |
| 16 | **No structured error reporting** | `console.error` only — needs Sentry/Logflare for production observability |
| 17 | **No startup env var validation** | Missing `DATABASE_URL` or `JWT_SECRET` produces confusing runtime errors |

### Recommended Fixes

**10. Client-side cart hydration (avoid SSR DB call):**

```tsx
// app/layout.tsx — remove cart query from server component
// In CartProvider.tsx, hydrate from API on mount:
useEffect(() => {
  fetch("/api/cart").then(res => res.json()).then(setItems);
}, []);
```

**11. Shared cache — use Vercel KV or `unstable_cache`:**

```ts
// src/lib/cache.ts
import { unstable_cache } from "next/cache";

export const getCachedStats = unstable_cache(
  async () => prisma.order.aggregate({ _count: true, _sum: { totalAmount: true } }),
  ["stats"],
  { revalidate: 30 }
);
```

**12. Client-side navigation after login:**

```tsx
// app/admin/login/page.tsx
import { useRouter } from "next/navigation";
const router = useRouter();
// On successful login:
router.push("/admin");
```

**13. Accessible loading spinner:**

```tsx
// src/components/ui/LoadingSpinner.tsx
<div className="loading-spinner" role="status" aria-live="polite">
  <span className="sr-only">Loading content…</span>
</div>
```

**14. Link form errors to inputs:**

```tsx
// app/order/page.tsx
<input
  id="fullName"
  aria-describedby={errors.fullName ? "fullName-error" : undefined}
  aria-invalid={!!errors.fullName}
/>
{errors.fullName && (
  <span id="fullName-error" className="form-error visible" role="alert">
    {errors.fullName}
  </span>
)}
```

**15. High contrast mode fix:**

```css
/* app/globals.css */
@media (forced-colors: active) {
  *:focus-visible {
    outline: 3px solid;
  }
}
```

**16. Structured error reporting — add Sentry:**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**17. Startup env validation:**

```ts
// src/lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  ALLOWED_ORIGIN: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
```

---

## Low Priority (Technical Debt)

| # | Area | Details |
|---|---|---|
| 18 | **`generateOrderNumber()` uses `Math.random()`** | Works but less robust than DB sequences or UUIDs |
| 19 | **Public OpenAPI spec with CORS `*`** | `app/api/docs/route.ts` exposes full API schema |
| 20 | **Admin dashboard is fully client-side** | No SSR — slower initial load on admin pages |
| 21 | **Rate limiter memory leak** | Map never cleans up expired entries |
| 22 | **`postcss.config.mjs` exists but unused** | No PostCSS plugins configured |

### Recommended Fixes

**18. Order number — use UUID or DB sequence:**

```ts
// src/lib/utils.ts
import { v4 as uuidv4 } from "uuid";
export function generateOrderNumber(): string {
  return `ORD-${uuidv4().split("-")[0].toUpperCase()}`;
}
```

**22. Remove unused PostCSS config:**

```bash
rm postcss.config.mjs
```

---

## Architecture Strengths (Worth Preserving)

These are well-implemented patterns that should be maintained:

- **Serializable transactions** for order placement with stock deduction
- **Optimistic concurrency** via `version` field on orders
- **Typed API client** with Zod schemas for both input and response validation
- **React Query** for server state with proper query key management
- **Clean separation**: `src/lib/`, `src/components/`, `src/types/` with a typed API layer
- **38 test files** covering API, library, components, and hooks
- **Comprehensive accessibility**: skip links, ARIA labels, `prefers-reduced-motion`, `prefers-contrast`, focus management
- **Prisma migrations** with incremental improvements (versioning, stock constraints)

---

## Priority Matrix

```
                        Impact
                  Low         High
         ┌──────────────────────────┐
   Low   │  18, 22 (Tech Debt)     │  13, 14, 15 (A11y)
         │                          │
  Effort ├──────────────────────────┤
   High  │  20 (Admin SSR)         │  1, 2, 3, 4 (Security)
         │                          │  5, 7 (Infra)
         │                          │  16, 17 (Ops)
         └──────────────────────────┘
```

---

## Recommended Implementation Order

1. **Week 1**: Items 1–4 (Critical security fixes)
2. **Week 2**: Items 5–9 (High-priority infrastructure)
3. **Week 3**: Items 10–12, 16–17 (Medium — performance + ops)
4. **Week 4**: Items 13–15 (Medium — accessibility)
5. **Ongoing**: Items 18–22 (Low — tech debt)
