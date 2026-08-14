# Plan: User Review Functionality & Top Five Reviews on Homepage

**Date:** 2026-08-01
**Status:** Proposed
**Scope:** Add user-submitted product reviews with moderation workflow, a homepage top-five ranking algorithm, and full GDPR/CCPA compliance.

> **Update (2026-08-05):** Still **not implemented** — no `Review` model or review API routes exist in the codebase yet. This document remains a forward-looking plan.

---

## 1. Requirements & Technical Scope Definition

### 1.1 Core Functional Requirements

#### 1.1.1 User Review Submission
- **Mandatory fields:**
  - `rating` — integer 1–5 (star rating)
  - `content` — written review text (min 10 characters, max 2,000)
- **Optional fields:**
  - `productCode` — SKU of the product being reviewed (selected from the customer's order history, not manually entered)
  - `verifiedPurchase` — boolean tag indicating the reviewer purchased the product (set server-side from order verification, not user-submitted)
- **Submission flow:**
  - Authenticated users only (customer identity derived from order history)
  - User selects the product code (SKU) from their completed orders — this identifies the product being reviewed
  - One review per customer per product (prevent duplicates)
  - Review is created with `status = "pending"` and requires admin approval before public visibility
  - Rate limit: max 3 reviews per customer per hour (sliding window via Redis/in-memory limiter)

#### 1.1.2 Review Moderation Workflow
- **Admin-only actions:** approve, reject, or flag a review as inappropriate
- **Status lifecycle:**
  ```text
  pending → approved → published (visible to customers)
  pending → rejected (not visible, reason stored)
  pending → flagged (hidden, admin review queue)
  ```
- **Admin UI:** dedicated "Reviews" tab in the admin panel with:
  - Filter by status (pending/approved/rejected/flagged)
  - Filter by product
  - Filter by date range
  - Bulk approve/reject actions
  - Per-review action buttons (approve, reject, flag) with optional rejection reason
- **Rejection:** stores a `rejectionReason` field (max 500 chars) for audit trail
- **Flagging:** moves review to a separate flagged queue; does not delete content

#### 1.1.3 Top Reviews Algorithm (Homepage)
Ranking criteria applied in priority order:
1. **Star rating** — higher ratings rank first (5-star reviews preferred)
2. **Verified purchase** — verified purchases rank above unverified when ratings are equal
3. **Helpfulness votes** — user-reported "was this helpful?" votes (upvote count, descending)
4. **Recency** — newer reviews rank higher when other criteria are equal (createdAt descending)
5. **Review length** — longer reviews (min 50 chars) receive a slight boost for quality signal

The algorithm selects the top 5 reviews that are:
- `status = "approved"`
- `isActive = true`
- Associated with an active, non-deleted product

#### 1.1.4 Homepage Integration
- **Placement:** new section between the "Latest in Every Category" carousel and the "Features" section
- **Responsive design:**
  - Mobile: single-column card stack
  - Tablet (≥768px): 2-column grid
  - Desktop (≥1024px): 5-column horizontal layout (or scrollable carousel if space is tight)
- **Visual consistency:**
  - Uses existing CSS variables (`--gold`, `--cream`, `--near-black`, `--font-serif`, `--font-sans`)
  - Follows the same card/section patterns used in `LatestInEveryCategory` and `features` sections
  - Star ratings rendered with inline SVG or CSS (no external icon library)
  - Verified purchase badge uses existing `status-badge` CSS class pattern
- **Component structure:**
  - `TopReviewsSection` — server component that fetches top reviews via API
  - `ReviewCard` — client component for individual review display with helpfulness vote button
  - `ReviewStars` — presentational component for star rendering

#### 1.1.5 Compliance (GDPR, CCPA, Content Policies)
- **Data minimization:** store only `customerName` (from order), `customerEmail` (hashed for lookup, not displayed), `rating`, `content`, `productCode` (SKU), `productId`, `orderId`
- **Right to deletion:** customers can request review deletion via a "Delete my review" option; admin can also soft-delete (`deletedAt` timestamp)
- **Data export:** reviews are included in the admin data export (Excel) functionality
- **Content policy enforcement:**
  - Profanity/SPAM filter via `sanitize()` (HTML stripping) + server-side content scan
  - Product code (SKU) validated against existing product records before review creation
  - Reviews containing prohibited content (detected via keyword list) auto-flagged as `flagged`
- **Privacy:** customer email is never displayed publicly; only name (from order) is shown; productCode (SKU) is shown publicly as it identifies the reviewed product
- **Cookie consent:** review submission does not set any new cookies beyond existing session
- **Data retention:** reviews are retained indefinitely while active; soft-deleted reviews are purged after 90 days via a scheduled job

---

## 2. Phased Implementation Plan

### Phase 1: Database Schema & API Foundation (Week 1–2)

#### 2.1.1 Prisma Schema Additions (`prisma/schema.prisma`)
Add a `Review` model:

```prisma
enum ReviewStatus {
  pending
  approved
  rejected
  flagged
}

model Review {
  id              String        @id @default(uuid())
  productId       String        @map("product_id")
  product         Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderId         String?       @map("order_id")
  order           Order?        @relation(fields: [orderId], references: [id])
  productCode     String?       @map("product_code") @db.VarChar(50)
  customerName    String        @map("customer_name") @db.VarChar(255)
  customerEmail   String        @map("customer_email") @db.VarChar(255)
  rating          Int           @db.SmallInt
  content         String        @db.Text
  verifiedPurchase Boolean      @default(false) @map("verified_purchase")
  helpfulnessVotes Int          @default(0) @map("helpfulness_votes")
  status          ReviewStatus  @default(pending)
  rejectionReason String?       @map("rejection_reason") @db.VarChar(500)
  isActive        Boolean       @default(true) @map("is_active")
  deletedAt       DateTime?     @map("deleted_at")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  @@index([productId])
  @@index([status])
  @@index([createdAt])
  @@index([productId, status])
  @@map("reviews")
}
```

**Migration:** `npm run db:generate && npm run db:push` — adds `Review` model with `productCode` (SKU) field

#### 2.1.2 API Schema Additions (`src/lib/api/schemas.ts`)
Add Zod schemas for review creation, update, and response:

- `ReviewStatusSchema` — enum of the four statuses
- `CreateReviewSchema` — validates `productId`, `productCode` (SKU from order), `rating` (1–5), `content` (10–2000 chars)
- `UpdateReviewStatusSchema` — validates `status` + optional `rejectionReason`
- `ReviewSchema` — full response shape including `productCode`
- `TopReviewsResponseSchema` — array of top reviews for homepage, includes `productCode`
- Export corresponding TypeScript types

#### 2.1.3 API Routes

**`app/api/reviews/route.ts`**
- `GET` — Public. Accepts query params: `productId?`, `status=approved` (default), `limit` (default 5, max 20). Returns paginated list of approved reviews for a product or top reviews. Uses Redis cache (`reviews:product:{id}` and `reviews:top`).
- `POST` — Authenticated customer. Validates CSRF origin, checks rate limit (`review:{customerEmail}:{productId}`), verifies the customer has a delivered order containing the product (sets `verifiedPurchase = true`), validates the product code (SKU) against the order's line items, sanitizes content, creates review with `status = "pending"`. Invalidates `reviews:product:{productId}` and `reviews:top` caches.

**`app/api/reviews/[id]/route.ts`**
- `GET` — Public. Returns a single review by ID (only if `status = "approved"` and `isActive = true`).
- `PATCH` — Admin only. Updates review status (approve/reject/flag). Requires `expectedVersion` for optimistic concurrency. Stores `rejectionReason` on reject. Invalidates relevant caches.
- `DELETE` — Admin or customer (own review only). Soft-deletes by setting `deletedAt`. Invalidates caches.

**`app/api/reviews/[id]/helpfulness/route.ts`**
- `POST` — Public (authenticated optional). Increments `helpfulnessVotes` for a review. Rate-limited to 1 vote per customer per review (stored in Redis key `review:vote:{reviewId}:{customerIp}`).

#### 2.1.4 Cache & Invalidation (`src/lib/reviews-cache.ts`)
Add a reviews cache module following the cache-ownership pattern (ADR-0001 — routes never create caches inline; invalidation clears what the owning module owns):
```ts
// src/lib/reviews-cache.ts
import { createRedisCache } from "@/src/lib/redis-cache";

export const reviewsCache = createRedisCache(300_000, "reviews");

export async function invalidateReviewCaches(productId?: string): Promise<void> {
  if (productId) await reviewsCache.remove(`product:${productId}`);
  await reviewsCache.remove("top");
}
```
- Cache keys: `reviews:product:{productId}` and `reviews:top` (same `reviews` namespace).
- `remove(key)` clears both Redis and the in-memory fallback for that key (ADR-0001).
- Top-review freshness (120s, §2.3.7) is enforced via `s-maxage` headers; the module TTL is the backstop and `invalidateReviewCaches()` keeps both keys fresh on any review mutation.
- Routes import `reviewsCache` from this module and call `invalidateReviewCaches()` on review create / status change / delete — never `createRedisCache` directly.
- New module joins `catalogue-cache.ts` / `order-cache.ts` / `stats-cache.ts`; record it in `CONTEXT.md` when implemented.

#### 2.1.5 Rate Limiter Updates (`src/lib/rate-limiter.ts`)
Add review-specific rate limit check:
```ts
export async function checkReviewRateLimit(customerEmail: string, productId: string) {
  return checkRateLimit(`review:${customerEmail}:${productId}`, 3);
}
```

---

### Phase 2: Admin Moderation Workflow (Week 3–4)

#### 2.2.1 Admin Tab Integration (`app/admin/page.tsx`)
Add a "Reviews" tab to `AdminTabs`:
- Dynamic import of `AdminReviewsPanel` (client component, SSR disabled)
- New tab entry in `AdminTabs` component

#### 2.2.2 Admin Reviews Panel (`src/components/admin/AdminReviewsPanel.tsx`)
Following the existing `AdminOrdersPanel` pattern:
- Fetches reviews via `fetchReviews()` API client (to be added)
- Filter bar: status filters (pending/approved/rejected/flagged), product search
- Table layout: columns for product name (SKU: {productCode}), customer name, rating (star display), status badge, date, actions
- Per-row actions: approve, reject (with inline reason input), flag
- Bulk actions: bulk approve, bulk reject
- Pagination support
- Skeleton loading states matching existing patterns
- Responsive table wrapper with horizontal scroll on mobile

#### 2.2.3 Admin API Client Functions (`src/lib/api/index.ts`)
Add:
- `fetchReviews(params)` — GET with query params for filtering
- `updateReviewStatus(id, input)` — PATCH to update status
- `deleteReview(id)` — DELETE soft-remove

#### 2.2.4 Admin Mutation Hooks (`src/lib/hooks/useAdminMutations.ts`)
Add:
- `useUpdateReviewStatus()` — mutation hook with cache invalidation
- `useDeleteReview()` — mutation hook with cache invalidation

#### 2.2.5 Admin Query Keys (`src/lib/query-keys.ts`)
Add:
```ts
reviews: {
  all: () => [...queryKeys.all, "reviews"] as const,
  lists: () => [...queryKeys.reviews.all(), "list"] as const,
  list: (params: { page: number; limit: number; status?: string; productId?: string }) =>
    [...queryKeys.reviews.lists(), params] as const,
}
```

#### 2.2.6 Admin Styles (`app/styles/admin.css`)
Add review-specific admin styles following existing patterns:
- Review card/table styling
- Status badge colors for `pending` (warning), `approved` (success), `rejected` (error), `flagged` (warning)
- Star rating display in admin table
- Bulk action bar styling

---

### Phase 3: Top Reviews Algorithm & Homepage Integration (Week 5–6)

#### 2.3.1 Top Reviews Query Logic (`src/lib/reviews.ts` or similar)
Create a helper module implementing the ranking algorithm:
1. Query approved, active reviews joined with their products
2. Filter to products that are active and not deleted
3. Apply ranking score calculation:
   - Base score = `rating * 100`
   - +50 if `verifiedPurchase = true`
   - + `helpfulnessVotes * 10`
   - +10 if `content.length >= 50`
   - Tie-breaker: `createdAt DESC`
4. Take top 5
5. Return with product info (name, productCode, price) for display

This helper is used by both the API route and the server component.

#### 2.3.2 Homepage API Endpoint (`app/api/reviews/top/route.ts`)
- `GET` — Public, cached (s-maxage=120). Returns the top 5 reviews using the ranking algorithm.
- Response includes: review id, rating, content (truncated to 200 chars for homepage), customerName, product name, productCode (SKU), verifiedPurchase flag, helpfulnessVotes, createdAt.

#### 2.3.3 Homepage Component (`src/components/pages/home-content.tsx`)
Add `TopReviewsSection` import and render between the "Latest in Every Category" section and the "Features" section:
```tsx
<TopReviewsSection />
```

#### 2.3.4 Top Reviews Section Component (`src/components/pages/top-reviews-section.tsx`)
- Server component that fetches top reviews from `/api/reviews/top`
- Renders a section with:
  - Section header: "What Our Customers Say" (using existing `SectionHeader` pattern)
  - Grid of 5 review cards (responsive: 1 col mobile, 2 col tablet, 5 col desktop)
  - Each card shows: star rating, truncated content, customer name, verified badge, product name (SKU: {productCode}), date
  - "Read more" link to product page
- Uses existing CSS variables and spacing tokens

#### 2.3.5 Review Card Component (`src/components/ui/ReviewCard.tsx`)
Reusable presentational component:
- Props: `rating`, `content`, `customerName`, `productName`, `productCode`, `verifiedPurchase`, `helpfulnessVotes`, `createdAt`, `productId`
- Star rendering: inline SVG stars (filled/unfilled) using existing `--gold` color token
- Verified badge: uses existing `status-badge` pattern with "Verified Purchase" label
- Product code display: shows "SKU: {productCode}" alongside product name
- Helpfulness vote button: "Was this helpful?" with upvote count (client-side interaction)
- Truncated content with "Read more" expand/collapse

#### 2.3.6 Homepage Styles (`app/styles/home.css`)
New CSS file for the reviews section:
- `.top-reviews` section wrapper (matches `latest-every-category` section pattern)
- `.review-card` with existing design token variables
- `.review-stars` inline star display
- `.review-code` — product SKU display styling (monospace, smaller font, muted color)
- `.review-content` with line-clamp for truncation
- `.review-verified` badge styling
- `.review-helpful` button styling
- Responsive breakpoints matching existing grid patterns

Add `@import "./styles/home.css"` to `app/globals.css` (before responsive/accessibility).

#### 2.3.7 Cache Strategy for Top Reviews
- Cache key: `reviews:top`
- TTL: 120 seconds (short to reflect new approvals quickly)
- Stale-while-revalidate: 60 seconds
- Cache invalidated on: review status change, new review approval, review deletion

---

### Phase 4: Compliance, Testing & Polish (Week 7–8)

#### 2.4.1 GDPR/CCPA Compliance Implementation
- **Privacy policy update:** add section describing review data collection, purpose, and retention
- **Delete endpoint:** `DELETE /api/reviews/[id]` — customer can delete their own review (verified via order match)
- **Data export:** include reviews in the existing admin export (`app/api/export/route.ts`)
- **Soft-delete purge job:** scheduled task (or on-demand admin action) to permanently delete reviews where `deletedAt < 90 days ago`
- **No cookies set by review system** — relies on existing session/auth

#### 2.4.2 Content Policy Enforcement
- Server-side profanity/SPAM keyword list (configurable via env var `PROFANITY_LIST`)
- Auto-flag reviews containing prohibited keywords as `status = "flagged"`
- Content length enforcement: min 10, max 2000 characters

#### 2.4.3 Test Suite

**API Tests (`src/__tests__/api/reviews.test.ts`):**
- GET `/api/reviews` — returns approved reviews, filters by product, paginates
- POST `/api/reviews` — creates review with valid data, rejects invalid rating, rejects duplicate, enforces rate limit, sets verifiedPurchase from order match, validates productCode against order line items
- PATCH `/api/reviews/[id]/status` — admin approves/rejects/flags, requires auth, stores rejection reason, optimistic concurrency
- DELETE `/api/reviews/[id]` — soft-deletes, customer can only delete own
- POST `/api/reviews/[id]/helpfulness` — increments vote, rate-limits one vote per customer

**Unit Tests (`src/__tests__/lib/reviews.test.ts`):**
- Ranking algorithm: verifies sort order (rating → verified → helpfulness → recency → length)
- Cache key generation and invalidation
- Profanity filter detection

**Component Tests (`src/__tests__/components/ReviewCard.test.tsx`):**
- Renders stars correctly for each rating value
- Shows verified badge when `verifiedPurchase = true`
- Truncates long content
- Upvote button increments count

**Integration Tests:**
- Homepage renders top 5 reviews section
- Admin reviews panel loads, filters, and performs actions

#### 2.4.4 Documentation Updates
- Update `AGENTS.md` with review-related architecture notes
- Update `src/lib/openapi-spec.ts` with new review endpoints
- Update `.env.example` with any new env vars (e.g., `PROFANITY_LIST`)
- Update `docs/brief.md` or create `docs/reviews.md` with feature overview

#### 2.4.5 Lint, Typecheck & Build Verification
- Run `npm run typecheck` — no type errors
- Run `npm run lint` — no lint errors
- Run `npm run test:run` — all tests pass (including new ones)
- Run `npm run build` — production build succeeds

---

## 3. File Manifest (New & Modified)

### New Files
| File | Purpose |
|---|---|
| `prisma/migrations/XXXXXX_add_reviews/migration.sql` | Database migration for Review table |
| `app/api/reviews/route.ts` | Review list + creation endpoint |
| `app/api/reviews/[id]/route.ts` | Review detail + status update + delete |
| `app/api/reviews/[id]/helpfulness/route.ts` | Helpfulness vote endpoint |
| `app/api/reviews/top/route.ts` | Top 5 reviews for homepage |
| `src/components/pages/top-reviews-section.tsx` | Homepage top reviews server component |
| `src/components/ui/ReviewCard.tsx` | Reusable review card component |
| `src/components/ui/ReviewStars.tsx` | Star rating presentational component |
| `src/components/admin/AdminReviewsPanel.tsx` | Admin reviews moderation panel |
| `src/lib/reviews.ts` | Ranking algorithm helper |
| `app/styles/home.css` | Homepage reviews section styles |
| `src/__tests__/api/reviews.test.ts` | API integration tests |
| `src/__tests__/lib/reviews.test.ts` | Ranking algorithm unit tests |
| `src/__tests__/components/ReviewCard.test.tsx` | Component tests |

### Modified Files
| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `Review` model, `ReviewStatus` enum |
| `src/lib/api/schemas.ts` | Add review Zod schemas and types |
| `src/lib/api/index.ts` | Add review API client functions |
| `src/lib/query-keys.ts` | Add `reviews` query key group |
| `src/lib/reviews-cache.ts` | New: reviews cache module + `invalidateReviewCaches()` |
| `src/lib/rate-limiter.ts` | Add review rate limit helper |
| `src/lib/hooks/useAdminMutations.ts` | Add review mutation hooks |
| `app/admin/page.tsx` | Add Reviews tab with dynamic import |
| `app/globals.css` | Add `@import "./styles/home.css"` |
| `src/lib/openapi-spec.ts` | Document new review endpoints |
| `.env.example` | Add any new env vars |

---

## 4. Risk Assessment & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Review spam/abuse | High | Rate limiting (3/hr per customer), content sanitization, auto-flagging, admin moderation queue |
| Fake verified purchases | Medium | `verifiedPurchase` is set server-side only by matching order history; never user-submitted |
| Invalid product code | Medium | SKU validated against existing product records server-side before review creation |
| Performance impact on homepage | Low | Redis caching with 120s TTL, stale-while-revalidate, top-5 query is indexed and lightweight |
| GDPR non-compliance | High | Soft-delete with 90-day purge, data export inclusion, no PII in public display |
| Admin moderation bottleneck | Medium | Bulk actions, filter/search, and clear status-based queue organization |

---

## 5. Success Criteria

1. ✅ Customers can submit reviews with rating + content after purchase
2. ✅ Reviews require admin approval before public visibility
3. ✅ Admin can approve, reject, or flag reviews via dedicated panel
4. ✅ Homepage displays top 5 reviews ranked by the defined algorithm
5. ✅ Top reviews section is responsive and visually consistent with existing design
6. ✅ All review endpoints are authenticated/authorized correctly
7. ✅ GDPR/CCPA compliance: deletion, export, no PII exposure
8. ✅ All new code passes lint, typecheck, and test suite
9. ✅ Cache invalidation works correctly on review state changes
10. ✅ Rate limiting prevents abuse of review submission and voting
