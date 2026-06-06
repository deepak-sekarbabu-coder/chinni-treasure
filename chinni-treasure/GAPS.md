# Gap Analysis & Fixes

## 4.1 Cart Loads from localStorage After Mount (Flash of Empty Cart) ✅ FIXED

**File:** `src/components/cart/CartProvider.tsx:54-65`

**Problem:** Cart started as `[]` and hydrated asynchronously after mount via `useEffect`. SSR always saw an empty cart, causing cart-dependent content to flash "empty" before client-side state loaded.

**Fix:**
- `CartProvider` now accepts an `initialItems` prop (`CartItemDisplay[]`)
- `layout.tsx` (server component) reads the server cart cookie via `getCartFromCookies()` and fetches product details from the database using Prisma
- Mapped product data is passed as `initialItems` to `CartProvider`, so SSR renders with the correct cart state
- On client mount, `localStorage` is still checked and takes precedence if it has data (handles multi-tab scenarios)

**Files changed:**
- `app/layout.tsx` — made async, reads cart cookie + DB, passes `initialItems`
- `src/components/cart/CartProvider.tsx` — accepts `initialItems` prop

---

## 4.2 Server Cart Cookie Exists but Is Never Used ✅ FIXED

**File:** `src/lib/cart-cookie.ts` (was dead code)

**Problem:** `getCartFromCookies()`, `serializeCartCookie()`, and `getCartCookieOptions()` were defined but never called anywhere in the codebase.

**Fix:**
- Added `setCartCookieClient()` — client-side function to write the cart cookie via `document.cookie`
- `CartProvider` now calls `setCartCookieClient(toCartCookie(items))` alongside `saveCart(items)` in the persistence effect, keeping the server cookie in sync with every cart change
- The server-side `getCartFromCookies()` is now called from `layout.tsx` to hydrate SSR cart state (fix 4.1)
- Exported `CART_COOKIE` and `CART_MAX_AGE` constants for reuse

**Files changed:**
- `src/lib/cart-cookie.ts` — added `setCartCookieClient()`, exported constants
- `src/components/cart/CartProvider.tsx` — syncs cart to cookie on every change
- `app/layout.tsx` — consumes `getCartFromCookies()` for SSR hydration

---

## 5.5 Admin Login Error Not Announced to Screen Readers ✅ FIXED

**File:** `app/admin/login/page.tsx:84-88`

**Problem:** When an error appeared, focus was not moved to it. The error container had no `role="alert"` or focus management, so screen readers might not announce the error.

**Fix:**
- Added `ref` to the error div with `useRef`
- Added `role="alert"` and `tabIndex={-1}` so the div can receive programmatic focus
- Added a `useEffect` that calls `errorRef.current.focus()` whenever the error state changes

**Files changed:**
- `app/admin/login/page.tsx` — focus management with `useRef` + `useEffect`, added `role="alert"` and `tabIndex={-1}`
