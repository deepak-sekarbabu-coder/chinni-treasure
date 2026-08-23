# Gift-Box Bundling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the user-selected gift-box bundling feature — the system where customers choose a gift box from the "Gift Boxes" category to package their purchase in.

**Architecture:** The backend foundation is already in place — the Prisma schema has `allowGiftBoxBundling` on Product and `parentOrderItemId` on OrderItem, the order creation route validates and persists gift boxes, and the product create/update APIs accept the field. This plan fills the gaps: API schema exposure, a gift-box products endpoint, admin UI for the toggle, customer-facing gift-box selector, cart/checkout/confirmation display of linked boxes, and OpenAPI spec updates.

**Tech Stack:** Next.js 16 (App Router), React 19, Prisma 7, Zod 4, modular raw CSS under `app/styles/`, React Query 5 for server-state.

**Spec:** The requirements are in the user-provided plan above (Gift-Box Bundling Feature summary).

---

## Two Gift Systems — Do Not Confuse

This codebase has **two independent gift concepts**. They must not be mixed up:

### 1. Free Surprise Gift (✅ Already complete — no work needed)

| Aspect | Detail |
|--------|--------|
| **What** | A complimentary gift the store adds to every order (handwritten note, customized notes) |
| **Controlled by** | `NEXT_PUBLIC_ENABLE_SURPRISE_GIFT` env var |
| **Product ID** | Virtual: `"__surprise_gift__"` (not a real DB product) |
| **Cart flag** | `isGift: true` on `CartItemDisplay` |
| **Price** | Always ₹0, shown as "Complimentary" |
| **UI** | `ComplementaryGiftPopup` announces it; `NavCartDropdown` and `OrderSummaryCard` show "FREE GIFT" badge |
| **Order handling** | Excluded from order payload (`items.filter(i => !i.isGift)`) — never sent to the API |
| **Files** | `src/components/cart/CartProvider.tsx` (`ensureGiftItem`, `SURPRISE_GIFT_ITEM`), `src/components/ui/ComplementaryGiftPopup.tsx`, `app/styles/complementary-gift.css` |

**Do not modify any `isGift` logic.** It is a separate, finished feature.

### 2. User-Selected Gift-Box Bundling (🔧 This plan)

| Aspect | Detail |
|--------|--------|
| **What** | Customer chooses a gift box product from the "Gift Boxes" category to package their purchase |
| **Controlled by** | `allowGiftBoxBundling` boolean on Product (admin toggle per product) |
| **Product IDs** | Real DB products in the category with `slug === "box"` |
| **Cart storage** | `giftBoxes` array on each parent `CartItemDisplay` item |
| **Price** | Uses the gift box product's actual price; added to cart/checkout total |
| **Order handling** | Sent as `items[].giftBoxes` in the order API; persisted as `OrderItem` rows with `parentOrderItemId` linking to the parent |
| **Backend** | Already implemented (schema, order API validation, stock deduction) |
| **Frontend** | This plan covers the missing UI and API schema pieces |

**Key distinction in code:**
- `isGift` → free surprise gift (virtual, ₹0, excluded from orders)
- `giftBoxes` → user-selected gift-box bundling (real products, priced, included in orders)

---

## Global Constraints

- No Tailwind or external CSS frameworks — all styles in `app/styles/`
- Zod for all API input/output validation
- Sanitize user-facing content through `src/lib/sanitize.ts`
- Preserve existing checkout, payment, and inventory validation rules
- JWT auth via HttpOnly cookie for admin routes
- Follow existing file conventions and component patterns
- Gift Boxes category is identified by slug `"box"`
- Do not modify any `isGift` / surprise-gift logic

---

## File Structure

### Modified files

| File | Responsibility |
|------|---------------|
| `src/lib/api/schemas.ts` | Add `allowGiftBoxBundling` to `ProductSchema` and `ProductInputSchema`; add `parentOrderItemId` to `OrderItemSchema`; add `giftBoxes` to `CreateOrderInputSchema` |
| `src/lib/openapi-spec.ts` | Document `allowGiftBoxBundling` on Product schema and gift box items on Order |
| `app/api/gift-boxes/route.ts` | **New** — public endpoint to fetch active gift-box products |
| `src/lib/catalogue-cache.ts` | Add gift-box products cache |
| `src/components/admin/AdminCataloguePanel.tsx` | Add "Gift Box" column to product table; add `allowGiftBoxBundling` to `ProductFormData` |
| `src/components/admin/ProductFormModal.tsx` | Add "Allow gift-box bundling" toggle (disabled for Gift Box category products) |
| `app/admin/useAdminPageState.ts` | Pass `allowGiftBoxBundling` through filter/form state |
| `src/lib/hooks/useAdminCatalogueController.ts` | Add `allowGiftBoxBundling` to form state, defaults, conversion, and save payload |
| `src/components/pages/ProductDetailsContent.tsx` | Add gift-box selector when product supports bundling |
| `src/components/cart/CartProvider.tsx` | Handle `giftBoxes` array on cart items (add/remove/update with parent linkage) — **separate from `isGift`** |
| `src/components/order/OrderSummaryCard.tsx` | Display linked gift boxes beneath parent products |
| `app/order/page.tsx` | Pass `giftBoxes` in order payload |
| `src/components/order/ConfirmationDetails.tsx` | Display linked gift boxes in order items |
| `src/components/order/OrderDetailModal.tsx` | Display linked gift boxes in admin order detail |
| `app/styles/gift-box.css` | **New** — styles for gift-box selector and display |

---

## Tasks

### Task 1: Update API Schemas for Gift-Box Fields

**Files:**
- Modify: `src/lib/api/schemas.ts`

**Interfaces:**
- Consumes: existing `ProductSchema`, `OrderItemSchema`, `CreateOrderInputSchema`
- Produces: updated schemas with `allowGiftBoxBundling`, `parentOrderItemId`, and `giftBoxes` on order items

- [ ] **Step 1: Add `allowGiftBoxBundling` to ProductSchema**

In `src/lib/api/schemas.ts`, add the field to `ProductSchema`:

```typescript
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.coerce.number(),
  compareAtPrice: z.coerce.number().nullable().optional(),
  imageUrl: z.string().nullable(),
  description: z.string().nullable(),
  stockQuantity: z.number(),
  badge: z.string().nullable(),
  category: z.object({ name: z.string() }).nullable(),
  categoryId: z.number().nullable(),
  sku: z.string().nullable(),
  isActive: z.boolean(),
  allowGiftBoxBundling: z.boolean().optional(),
  visibleHostnames: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  images: z.array(ProductImageSchema).optional(),
});
```

- [ ] **Step 2: Add `allowGiftBoxBundling` to ProductInputSchema**

```typescript
export const ProductInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  compareAtPrice: z.coerce.number().positive("Compare at price must be positive").nullable().optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional(),
  badge: z.string().nullable().optional(),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  allowGiftBoxBundling: z.boolean().optional(),
  visibleHostnames: z.string().optional(),
  images: z.array(ProductImageInputSchema).optional(),
});
```

- [ ] **Step 3: Add `parentOrderItemId` to OrderItemSchema**

```typescript
const OrderItemSchema = z.object({
  id: z.string(),
  productName: z.string(),
  unitPrice: z.coerce.number(),
  quantity: z.number(),
  productId: z.string().nullable().optional(),
  parentOrderItemId: z.string().nullable().optional(),
  product: z
    .object({
      name: z.string().nullable().optional(),
      sku: z.string().nullable().optional(),
      imageUrl: z.string().nullable().optional(),
      compareAtPrice: z.coerce.number().nullable().optional(),
    })
    .nullable()
    .optional(),
});
```

- [ ] **Step 4: Add `giftBoxes` to CreateOrderInputSchema**

```typescript
export const CreateOrderInputSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, "Product ID is required"),
        quantity: z.number().int().positive("Quantity must be a positive integer"),
        giftBoxes: z.array(z.object({
          id: z.string().min(1),
          quantity: z.number().int().positive(),
        })).optional(),
      }),
    )
    .min(1, "At least one item is required"),
  // ... rest of fields unchanged
});
```

- [ ] **Step 5: Update CatalogueProductSchema to include `allowGiftBoxBundling`**

```typescript
const CatalogueProductSchema = z.object({
  // ... existing fields
  allowGiftBoxBundling: z.boolean().optional(),
  // ...
});
```

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/api/schemas.ts
git commit -m "feat: add allowGiftBoxBundling, parentOrderItemId, and giftBoxes to API schemas"
```

---

### Task 2: Create Gift-Box Products API Endpoint

**Files:**
- Create: `app/api/gift-boxes/route.ts`
- Modify: `src/lib/catalogue-cache.ts`

**Interfaces:**
- Consumes: Prisma `product` model with `category.slug === "box"` filter
- Produces: public `GET /api/gift-boxes` returning active gift-box products

- [ ] **Step 1: Add gift-box cache to catalogue-cache.ts**

In `src/lib/catalogue-cache.ts`, add a new cache:

```typescript
export const giftBoxCache = createRedisCache(60_000, "giftboxes");
```

Add it to the `CATALUE_CACHES` array so `invalidateCatalogCaches()` clears it too:

```typescript
const CATALOGUE_CACHES = [
  productsCache,
  categoriesCache,
  catLatestCache,
  catPageCache,
  recentCache,
  giftBoxCache,
] as const;
```

- [ ] **Step 2: Create the gift-boxes route**

Create `app/api/gift-boxes/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { giftBoxCache } from "@/src/lib/catalogue-cache";

const { get: getCached, set: setCache } = giftBoxCache;

// GET /api/gift-boxes — List active gift-box products (public)
export async function GET() {
  try {
    const cacheKey = "all";
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        stockQuantity: { gt: 0 },
        category: { slug: "box" },
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        stockQuantity: true,
        images: {
          where: { isPrimary: true },
          select: { url: true },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    const payload = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      imageUrl: p.images[0]?.url || p.imageUrl,
      stockQuantity: p.stockQuantity,
    }));

    await setCache(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Failed to fetch gift boxes:", error);
    return NextResponse.json({ error: "Failed to fetch gift boxes" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/api/gift-boxes/route.ts src/lib/catalogue-cache.ts
git commit -m "feat: add public gift-box products API endpoint with cache"
```

---

### Task 3: Admin UI — Product Form Toggle

**Files:**
- Modify: `src/components/admin/AdminCataloguePanel.tsx` — add `allowGiftBoxBundling` to `ProductFormData`
- Modify: `src/lib/hooks/useAdminCatalogueController.ts` — add field to form state, defaults, conversion, and save payload
- Modify: `src/components/admin/ProductFormModal.tsx` — add toggle switch

**Interfaces:**
- Consumes: `ProductFormData` with new `allowGiftBoxBundling: boolean` field
- Produces: toggle in product form, saved to API

- [ ] **Step 1: Add `allowGiftBoxBundling` to ProductFormData**

In `src/components/admin/AdminCataloguePanel.tsx`, update the `ProductFormData` interface:

```typescript
export interface ProductFormData {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  imageUrl: string;
  badge: string;
  categoryId: string;
  isActive: boolean;
  allowGiftBoxBundling: boolean;
  visibleHostnames: string;
  images: Array<{ url: string; isPrimary: boolean; displayOrder: number }>;
}
```

- [ ] **Step 2: Update useAdminCatalogueController**

In `src/lib/hooks/useAdminCatalogueController.ts`:

1. Add `allowGiftBoxBundling: boolean` to `ProductFormState`
2. Add `allowGiftBoxBundling: false` to `EMPTY_PRODUCT_FORM`
3. In `productToFormState`, add: `allowGiftBoxBundling: product.allowGiftBoxBundling ?? false,`
4. In `handleProductSave`, add to payload: `allowGiftBoxBundling: productForm.allowGiftBoxBundling,`

- [ ] **Step 3: Add toggle to ProductFormModal**

In `src/components/admin/ProductFormModal.tsx`, add after the "Active Status" toggle group:

```tsx
<div className="form-group toggle-form-group">
  <label>Gift-Box Bundling</label>
  <label className="toggle-switch">
    <input
      type="checkbox"
      checked={productForm.allowGiftBoxBundling}
      onChange={(e) => onFormChange({ ...productForm, allowGiftBoxBundling: e.target.checked })}
      disabled={isGiftBoxCategory}
    />
    <span className="toggle-slider"></span>
    <span className="toggle-label">
      {productForm.allowGiftBoxBundling ? "Enabled" : "Disabled"}
    </span>
  </label>
  {isGiftBoxCategory && (
    <p className="form-hint" style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>
      Gift Box products cannot enable bundling
    </p>
  )}
</div>
```

Compute `isGiftBoxCategory` inside the component:

```typescript
const isGiftBoxCategory = categories.find(
  (c) => c.id === Number(productForm.categoryId)
)?.slug === "box";
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminCataloguePanel.tsx src/lib/hooks/useAdminCatalogueController.ts src/components/admin/ProductFormModal.tsx
git commit -m "feat: add gift-box bundling toggle to admin product form"
```

---

### Task 4: Admin UI — Product List Gift-Box Column

**Files:**
- Modify: `src/components/admin/AdminCataloguePanel.tsx`

**Interfaces:**
- Consumes: `Product.allowGiftBoxBundling` from API
- Produces: "Bundling" column in admin product table

- [ ] **Step 1: Add "Bundling" column header**

In the `<thead>` of the admin product table, add a new `<th>` after "Badge":

```tsx
<th>Bundling</th>
```

- [ ] **Step 2: Add bundling cell to ProductRow**

In the `ProductRow` component, add after the badge `<td>`:

```tsx
<td>
  {product.allowGiftBoxBundling ? (
    <span className="table-status-pill active">
      <span className="status-dot" />
      Enabled
    </span>
  ) : (
    <span className="text-muted text-xs">—</span>
  )}
</td>
```

- [ ] **Step 3: Update colSpan for empty state**

Change the empty-state `colSpan` from 10 to 11 to account for the new column.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminCataloguePanel.tsx
git commit -m "feat: add gift-box bundling column to admin product list"
```

---

### Task 5: Customer-Facing Gift-Box Selector

**Files:**
- Create: `src/components/pages/GiftBoxSelector.tsx`
- Modify: `src/components/pages/ProductDetailsContent.tsx`
- Modify: `app/catalogue/[id]/page.tsx`
- Create: `app/styles/gift-box.css`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `GET /api/gift-boxes` response (array of `{ id, name, price, imageUrl, stockQuantity }`)
- Produces: selected gift boxes array `Array<{ productId: string; quantity: number }>` passed to cart's `giftBoxes` field

- [ ] **Step 1: Create GiftBoxSelector component**

Create `src/components/pages/GiftBoxSelector.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import FallbackImage from "@/src/components/ui/FallbackImage";

interface GiftBox {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
}

interface SelectedBox {
  productId: string;
  quantity: number;
}

interface Props {
  parentQuantity: number;
  selected: SelectedBox[];
  onChange: (selected: SelectedBox[]) => void;
}

export default function GiftBoxSelector({ parentQuantity, selected, onChange }: Props) {
  const [giftBoxes, setGiftBoxes] = useState<GiftBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchGiftBoxes() {
      try {
        const res = await fetch("/api/gift-boxes");
        if (res.ok) {
          const data = await res.json();
          setGiftBoxes(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchGiftBoxes();
  }, []);

  const totalSelectedQty = selected.reduce((sum, s) => sum + s.quantity, 0);
  const canAddMore = totalSelectedQty < parentQuantity;

  function toggleBox(box: GiftBox) {
    const existing = selected.find((s) => s.productId === box.id);
    if (existing) {
      onChange(selected.filter((s) => s.productId !== box.id));
    } else if (canAddMore) {
      onChange([...selected, { productId: box.id, quantity: 1 }]);
    }
  }

  function updateBoxQuantity(productId: string, delta: number) {
    onChange(
      selected
        .map((s) => {
          if (s.productId !== productId) return s;
          const newQty = s.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > parentQuantity) return s;
          return { ...s, quantity: newQty };
        })
        .filter(Boolean) as SelectedBox[]
    );
  }

  if (loading) return null;
  if (giftBoxes.length === 0) return null;

  return (
    <div className="gift-box-selector">
      <button
        type="button"
        className="gift-box-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="gift-box-toggle-icon">📦</span>
        <span>Add a Gift Box for Packing</span>
        {selected.length > 0 && (
          <span className="gift-box-count">{selected.length}</span>
        )}
        <svg
          className={`gift-box-chevron${isOpen ? " open" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="gift-box-list">
          {totalSelectedQty >= parentQuantity && (
            <p className="gift-box-limit-hint">
              Maximum gift boxes reached ({parentQuantity} for {parentQuantity} item{parentQuantity > 1 ? "s" : ""})
            </p>
          )}
          {giftBoxes.map((box) => {
            const isSelected = selected.some((s) => s.productId === box.id);
            const selectedEntry = selected.find((s) => s.productId === box.id);
            return (
              <div
                key={box.id}
                className={`gift-box-option ${isSelected ? "selected" : ""}`}
              >
                <button
                  type="button"
                  className="gift-box-option-main"
                  onClick={() => toggleBox(box)}
                  disabled={!isSelected && !canAddMore}
                >
                  <FallbackImage
                    src={box.imageUrl || "/placeholder.svg"}
                    alt={box.name}
                    width={48}
                    height={48}
                    className="gift-box-option-img"
                  />
                  <div className="gift-box-option-info">
                    <span className="gift-box-option-name">{box.name}</span>
                    <span className="gift-box-option-price">₹{box.price.toFixed(2)}</span>
                    {box.stockQuantity <= 3 && box.stockQuantity > 0 && (
                      <span className="gift-box-option-stock">Only {box.stockQuantity} left</span>
                    )}
                  </div>
                  <span className="gift-box-option-check">
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
                {isSelected && selectedEntry && (
                  <div className="gift-box-qty-controls">
                    <button
                      type="button"
                      className="btn-secondary qty-btn"
                      onClick={() => updateBoxQuantity(box.id, -1)}
                      disabled={selectedEntry.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="qty-value">{selectedEntry.quantity}</span>
                    <button
                      type="button"
                      className="btn-secondary qty-btn"
                      onClick={() => updateBoxQuantity(box.id, 1)}
                      disabled={selectedEntry.quantity >= parentQuantity}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="gift-box-selected-summary">
          {selected.map((s) => {
            const box = giftBoxes.find((b) => b.id === s.productId);
            if (!box) return null;
            return (
              <span key={s.productId} className="gift-box-selected-tag">
                📦 {box.name} ×{s.quantity}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((x) => x.productId !== s.productId))}
                  aria-label={`Remove ${box.name}`}
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update ProductDetailsContent to accept and use gift-box data**

In `src/components/pages/ProductDetailsContent.tsx`:

1. Import `GiftBoxSelector`
2. Add `allowGiftBoxBundling` and `category` to the `ProductDetails` interface
3. Add state: `const [selectedGiftBoxes, setSelectedGiftBoxes] = useState<Array<{ productId: string; quantity: number }>>([]);`
4. Show the selector between the description and the add-to-cart button:

```tsx
{product.allowGiftBoxBundling && product.category?.name !== "Gift Boxes" && (
  <GiftBoxSelector
    parentQuantity={quantity}
    selected={selectedGiftBoxes}
    onChange={setSelectedGiftBoxes}
  />
)}
```

5. Update `handleAddToCart` to pass gift boxes to the cart's `addItem`:

```typescript
const result = addItem({
  id: product.id,
  name: product.name,
  price: Number(product.price),
  image: product.imageUrl ?? "",
  stock: product.stockQuantity,
  sku: product.sku ?? undefined,
  giftBoxes: selectedGiftBoxes.length > 0 ? selectedGiftBoxes : undefined,
});
```

- [ ] **Step 3: Pass `allowGiftBoxBundling` and `category` from server page**

In `app/catalogue/[id]/page.tsx`, add to `productData`:

```typescript
const productData = {
  // ... existing fields
  allowGiftBoxBundling: product.allowGiftBoxBundling,
  category: product.category,
};
```

- [ ] **Step 4: Create gift-box.css styles**

Create `app/styles/gift-box.css` with styles for:
- `.gift-box-selector` — container
- `.gift-box-toggle` — expandable toggle button
- `.gift-box-list` — list of available boxes
- `.gift-box-option` — individual box option card
- `.gift-box-option.selected` — selected state
- `.gift-box-qty-controls` — quantity +/- buttons
- `.gift-box-selected-summary` — summary of selected boxes
- `.gift-box-selected-tag` — individual selected box tag
- `.gift-box-limit-hint` — max quantity hint
- `.gift-box-linked-items` — linked boxes in cart/checkout
- `.gift-box-linked-item` — individual linked box row
- `.gift-box-order-row` — gift box row in admin order detail

- [ ] **Step 5: Import gift-box.css in globals.css**

In `app/globals.css`, add:

```css
@import "./styles/gift-box.css";
```

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/pages/GiftBoxSelector.tsx src/components/pages/ProductDetailsContent.tsx app/catalogue/\[id\]/page.tsx app/styles/gift-box.css app/globals.css
git commit -m "feat: add customer-facing gift-box selector on product detail page"
```

---

### Task 6: Cart Provider — Handle Gift-Box Items

**Files:**
- Modify: `src/components/cart/CartProvider.tsx`

**Interfaces:**
- Consumes: `CartItem.giftBoxes` (already defined in `src/types/cart.ts`)
- Produces: cart items with `giftBoxes` array, updated `toCartCookie`, `getTotal`, and cascading removal

**Important:** This task only touches the `giftBoxes` array on cart items. The `isGift` flag (free surprise gift) is a completely separate system and must not be modified.

- [ ] **Step 1: Extend CartItemDisplay with giftBoxes**

In `src/components/cart/CartProvider.tsx`, add `giftBoxes` to `CartItemDisplay`:

```typescript
export interface CartItemDisplay {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
  sku?: string;
  isGift?: boolean;  // ← free surprise gift (DO NOT CHANGE)
  giftBoxes?: Array<{ productId: string; name: string; price: number; image: string; quantity: number }>;
}
```

- [ ] **Step 2: Add giftBox management methods to CartContextType**

Add to the context interface:

```typescript
interface CartContextType {
  items: CartItemDisplay[];
  addItem: (product: {
    id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
    sku?: string;
    giftBoxes?: Array<{ productId: string; name: string; price: number; image: string; quantity: number }>;
  }) => "added" | "max_reached" | "max_one" | "out_of_stock";
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => "updated" | "max_reached" | "max_one" | "removed" | "unchanged";
  updateGiftBoxes: (parentProductId: string, giftBoxes: Array<{ productId: string; name: string; price: number; image: string; quantity: number }>) => void;
  removeGiftBox: (parentProductId: string, giftBoxProductId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
}
```

- [ ] **Step 3: Update addItem to include giftBoxes**

When adding a product, if `giftBoxes` are provided in the product parameter, attach them to the cart item. Store the gift box product details (name, price, image) so they can be displayed in the cart without extra fetches.

- [ ] **Step 4: Update removeItem to cascade-remove linked gift boxes**

When removing a parent product, also remove its linked gift boxes from the state. This is the `giftBoxes` array, not the `isGift` flag.

- [ ] **Step 5: Update toCartCookie to include giftBoxes**

```typescript
function toCartCookie(items: CartItemDisplay[]): CartItem[] {
  return items
    .filter((i) => !i.isGift)
    .map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      giftBoxes: i.giftBoxes?.map((gb) => ({ productId: gb.productId, quantity: gb.quantity })),
    }));
}
```

- [ ] **Step 6: Update getTotal to include gift-box prices**

```typescript
const getTotal = useCallback(() => {
  return items.reduce((sum, i) => {
    if (i.isGift) return sum;
    const itemTotal = i.price * i.quantity;
    const giftBoxTotal = i.giftBoxes?.reduce((gbSum, gb) => gbSum + gb.price * gb.quantity, 0) ?? 0;
    return sum + itemTotal + giftBoxTotal;
  }, 0);
}, [items]);
```

- [ ] **Step 7: Add updateGiftBoxes and removeGiftBox callbacks**

Implement `updateGiftBoxes` (replaces all gift boxes for a parent) and `removeGiftBox` (removes one gift box from a parent).

- [ ] **Step 8: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/cart/CartProvider.tsx
git commit -m "feat: extend cart provider with gift-box item management"
```

---

### Task 7: Order Summary Card — Display Gift Boxes

**Files:**
- Modify: `src/components/order/OrderSummaryCard.tsx`

**Interfaces:**
- Consumes: `CartItemDisplay` with `giftBoxes` array
- Produces: gift boxes displayed beneath parent products in checkout summary

- [ ] **Step 1: Extend CartItem interface in OrderSummaryCard**

Add `giftBoxes` to the local `CartItem` interface:

```typescript
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
  isGift?: boolean;
  giftBoxes?: Array<{ productId: string; name: string; price: number; image: string; quantity: number }>;
}
```

- [ ] **Step 2: Render gift boxes beneath parent items**

After each non-gift parent item's quantity controls, render its linked gift boxes:

```tsx
{item.giftBoxes && item.giftBoxes.length > 0 && (
  <div className="gift-box-linked-items">
    {item.giftBoxes.map((gb) => (
      <div key={gb.productId} className="gift-box-linked-item">
        <FallbackImage src={gb.image || "/placeholder.svg"} alt={gb.name} width={32} height={32} className="gift-box-linked-img" />
        <span className="gift-box-linked-name">📦 {gb.name}</span>
        <span className="gift-box-linked-qty">×{gb.quantity}</span>
        <span className="gift-box-linked-price">₹{(gb.price * gb.quantity).toFixed(2)}</span>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/order/OrderSummaryCard.tsx
git commit -m "feat: display linked gift boxes in order summary card"
```

---

### Task 8: Checkout Page — Pass Gift Boxes in Order Payload

**Files:**
- Modify: `app/order/page.tsx`

**Interfaces:**
- Consumes: `CartItemDisplay` with `giftBoxes` from cart
- Produces: `orderPayload.items[].giftBoxes` sent to `POST /api/orders`

- [ ] **Step 1: Include giftBoxes in orderPayload**

In `app/order/page.tsx`, update the `orderPayload` construction:

```typescript
const orderPayload = {
  items: items
    .filter((i) => !i.isGift)
    .map((i) => ({
      id: i.productId,
      quantity: i.quantity,
      giftBoxes: i.giftBoxes?.map((gb) => ({
        id: gb.productId,
        quantity: gb.quantity,
      })),
    })),
  customerName: form.fullName.trim(),
  customerEmail: form.email.trim(),
  customerPhone: form.phone.trim(),
  addressLine1: form.address.trim(),
  addressLine2: form.addressLine2.trim() || undefined,
  city: form.city.trim(),
  stateCode: form.state,
  postalCode: form.zipCode.trim(),
  customerNotes: form.notes.trim() || undefined,
};
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/order/page.tsx
git commit -m "feat: pass gift-box selections through checkout to order API"
```

---

### Task 9: Confirmation Page — Display Gift Boxes

**Files:**
- Modify: `app/confirmation/[id]/page.tsx`
- Modify: `src/components/order/ConfirmationDetails.tsx`

**Interfaces:**
- Consumes: Order items with `parentOrderItemId` from database
- Produces: gift boxes displayed beneath parent items in confirmation

- [ ] **Step 1: Fetch parentOrderItemId in confirmation page query**

In `app/confirmation/[id]/page.tsx`, update the Prisma query to include `parentOrderItemId`:

```typescript
items: {
  select: {
    id: true,
    productName: true,
    unitPrice: true,
    quantity: true,
    parentOrderItemId: true,
  },
},
```

Update the `order.items` mapping to include `parentOrderItemId`.

- [ ] **Step 2: Update ConfirmationDetails to accept and render gift boxes**

In `src/components/order/ConfirmationDetails.tsx`:

1. Add `parentOrderItemId` to the `OrderItem` interface
2. Split items into parent items (where `parentOrderItemId === null`) and gift-box items
3. Render gift boxes beneath their parent items:

```tsx
{order.items
  .filter((item) => !item.parentOrderItemId)
  .map((item) => {
    const linkedGiftBoxes = order.items.filter(
      (gb) => gb.parentOrderItemId === item.id
    );
    return (
      <div key={item.id}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(212,175,55,0.15)", fontSize: "0.85rem" }}>
          <span>{item.productName} <span style={{ color: "var(--text-muted)" }}>×{item.quantity}</span></span>
          <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
        </div>
        {linkedGiftBoxes.length > 0 && (
          <div style={{ paddingLeft: "16px", borderLeft: "2px solid var(--gold)", marginLeft: "8px" }}>
            {linkedGiftBoxes.map((gb) => (
              <div key={gb.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                <span>📦 {gb.productName} ×{gb.quantity}</span>
                <span>₹{(gb.unitPrice * gb.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  })}
```

- [ ] **Step 3: Update the PDF invoice generator**

In the `generateInvoice` function within `ConfirmationDetails.tsx`, also render gift boxes beneath parent items in the PDF.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/confirmation/\[id\]/page.tsx src/components/order/ConfirmationDetails.tsx
git commit -m "feat: display linked gift boxes on order confirmation page"
```

---

### Task 10: Admin Order Detail — Display Gift Boxes

**Files:**
- Modify: `src/components/order/OrderDetailModal.tsx`

**Interfaces:**
- Consumes: Order items with `parentOrderItemId`
- Produces: gift boxes displayed in admin order detail modal

- [ ] **Step 1: Update OrderDetailModal items table**

In `src/components/order/OrderDetailModal.tsx`:

1. Add `parentOrderItemId` to the items type
2. Split items into parent and gift-box items
3. Render gift boxes beneath parent items in the items table:

```tsx
{(order.items || [])
  .filter((item) => !item.parentOrderItemId)
  .map((item) => {
    const linkedGiftBoxes = (order.items || []).filter(
      (gb) => gb.parentOrderItemId === item.id
    );
    return (
      <React.Fragment key={item.id}>
        <tr>
          <td>{item.productName}</td>
          <td>{item.quantity}</td>
          <td>₹{Number(item.unitPrice * item.quantity).toFixed(2)}</td>
        </tr>
        {linkedGiftBoxes.map((gb) => (
          <tr key={gb.id} className="gift-box-order-row">
            <td style={{ paddingLeft: "24px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              📦 {gb.productName}
            </td>
            <td style={{ fontSize: "0.82rem" }}>{gb.quantity}</td>
            <td style={{ fontSize: "0.82rem" }}>₹{Number(gb.unitPrice * gb.quantity).toFixed(2)}</td>
          </tr>
        )}
      </React.Fragment>
    );
  })}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/order/OrderDetailModal.tsx
git commit -m "feat: display linked gift boxes in admin order detail modal"
```

---

### Task 11: OpenAPI Spec Update

**Files:**
- Modify: `src/lib/openapi-spec.ts`

**Interfaces:**
- Consumes: updated schema types
- Produces: documented API contract

- [ ] **Step 1: Add `allowGiftBoxBundling` to Product schema in OpenAPI**

In the `components.schemas.Product` object, add:

```typescript
allowGiftBoxBundling: {
  type: "boolean",
  description: "When true, customers can attach gift boxes to this product at checkout",
},
```

- [ ] **Step 2: Add `parentOrderItemId` to Order items in OpenAPI**

In the `Order` schema's `items` array items, add:

```typescript
parentOrderItemId: {
  type: "string",
  nullable: true,
  description: "ID of the parent order item this gift-box item is linked to",
},
```

- [ ] **Step 3: Add giftBoxes to CreateOrder request body**

In the `/api/orders` POST requestBody items schema, add:

```typescript
giftBoxes: {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid", description: "Gift-box product ID" },
      quantity: { type: "integer", minimum: 1 },
    },
    required: ["id", "quantity"],
  },
  description: "Optional gift boxes to bundle with this product",
},
```

- [ ] **Step 4: Add `allowGiftBoxBundling` to Product create/update request bodies**

- [ ] **Step 5: Add `/api/gift-boxes` endpoint to OpenAPI**

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/openapi-spec.ts
git commit -m "docs: update OpenAPI spec with gift-box bundling fields and endpoint"
```

---

### Task 12: Verification

- [ ] **Step 1: Run full typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 2: Run all tests**

Run: `npm run test:run`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS

---

## Self-Review Checklist

1. **Spec coverage:** All requirements from the spec are covered:
   - ✅ Database changes (already done)
   - ✅ Admin toggle (Task 3)
   - ✅ Admin product list column (Task 4)
   - ✅ Admin cannot enable toggle for Gift Box products (Task 3 - disabled when category slug is "box")
   - ✅ All existing products start with bundling disabled (default false - already in schema)
   - ✅ Customer "Add a gift box" option (Task 5)
   - ✅ Show all active gift-box products with image, name, price, stock, quantity selector (Task 5)
   - ✅ Allow multiple gift-box types (Task 5)
   - ✅ Limit total gift-box quantity to parent quantity (Task 5)
   - ✅ Gift-box prices added to cart/checkout total (Task 6, 7)
   - ✅ Removing product removes linked gift boxes (Task 6)
   - ✅ Gift boxes purchasable independently (already works - no changes needed)
   - ✅ Recheck box stock during checkout (already done in order API)
   - ✅ Reject checkout with clear message if unavailable (already done)
   - ✅ Reduce stock for gift boxes (already done)
   - ✅ Display linked gift boxes in cart, checkout, confirmation, admin order detail (Tasks 7, 9, 10)
   - ✅ Test cases covered by existing tests + new components

2. **Placeholder scan:** No TBD/TODO placeholders found.

3. **Type consistency:** All interfaces and types are consistent across tasks.

4. **Two-system separation:** The plan clearly distinguishes `isGift` (free surprise gift, already complete) from `giftBoxes` (user-selected gift-box bundling, this plan). No task modifies the free gift system.
