# Chinni Treasure — Little Love — Test Cases

This document defines the manual and automated test scenarios required to verify the integrity and functionality of the e-commerce platform built with Next.js 16, Prisma, and PostgreSQL.

## 1. Customer Workflow Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-C01** | Cart | Add item to cart from Catalogue. | Cart badge count increases; "Success" toast appears via ToastProvider; Item is visible in cart dropdown. |
| **TC-C02** | Cart | Increment item quantity beyond available stock. | System prevents increment; "Error" toast displays insufficient stock message. |
| **TC-C03** | Cart | Remove item from Checkout page. | Item is removed from summary; Subtotal and Total update immediately. |
| **TC-C04** | Checkout | Submit order with empty mandatory fields. | Page shows inline errors; Fields turn red; Error messages displayed. |
| **TC-C05** | Checkout | Validate Phone Number input length. | Input field restricts input to exactly 10 digits; Submit fails if < 10 digits. |
| **TC-C06** | Checkout | Validate PIN Code input. | Submit fails if PIN is not exactly 6 numeric digits; Helper placeholder "6-digit PIN code" is visible. |
| **TC-C07** | Checkout | Free Shipping calculation. | Shipping always shows **₹0.00** (free) regardless of order total. |
| **TC-C08** | Success | Order Confirmation display. | Redirects to `/confirmation/[id]`; Correct Order ID (UUID) and customer details are displayed. |
| **TC-C09** | Cart | Decrease quantity to zero. | Item is removed from cart; Cart badge updates. |
| **TC-C10** | Cart | Add out-of-stock item. | "Out of Stock" button disabled; Cannot add to cart; Error toast shown. |

## 2. Order Tracking Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-T01** | Search (Phone) | Search with non-existent phone number. | "No orders found" message displays in results area. |
| **TC-T02** | Search (Phone) | Search with valid 10-digit number. | List of matching orders appears showing Order Number, Date, Status, and Total. |
| **TC-T03** | Detail | Click on search result item. | OrderDetailModal opens showing full order details, status timeline, items, and customer info. |
| **TC-T04** | Security (Phone) | Attempt to search with malformed number (e.g. "123"). | "Enter a valid 10-digit phone number" error appears. |
| **TC-T05** | Search (Order ID) | Search with exact Order Number. | Matching order appears in results. |
| **TC-T06** | Search (Order ID) | Search with partial Order Number. | Orders with matching Order Number substring appear (case-insensitive). |
| **TC-T07** | Search (Order ID) | Search with non-existent Order Number. | "No orders found" message displays. |
| **TC-T08** | Toggle | Switch between Order Number and Phone search. | Input fields toggle visibility; Previous results clear. |
| **TC-T09** | Results Sorting | Multiple orders found. | Orders sorted by date (newest first). |

## 3. Administrator Workflow Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-A01** | Auth | Login with invalid credentials. | "Invalid credentials" error toast appears. |
| **TC-A02** | Auth | Login with `admin` / `admin123`. | Success; User is redirected to `/admin` dashboard. |
| **TC-A03** | Auth | Access admin page without login. | Middleware redirects to `/admin/login`. |
| **TC-A04** | Auth | Logout. | Session cookie cleared; Redirected to `/admin/login`. |
| **TC-A05** | Catalogue | Create new product via API. | Product appears in database; Visible on catalogue page. |
| **TC-A06** | Catalogue | Edit existing product stock. | Stock units update; Low stock indicator appears if ≤ 3. |
| **TC-A07** | Catalogue | Delete product. | Product soft-deleted (isActive=false); No longer visible on catalogue. |
| **TC-A08** | Catalogue | Validation on empty fields. | Error response from API; Product not saved. |
| **TC-A09** | Orders | Approve a pending order. | Status badge changes to "Approved"; Status history updated. |
| **TC-A10** | Orders | Advance order through full flow. | Can advance: Pending → Approved → Packaging → Shipped (requires Tracking ID) → Delivered. |
| **TC-A11** | Orders | Reject an order. | Order status becomes "Rejected"; Stock quantities restored via API. |
| **TC-A12** | Orders | Filter by status. | API returns only orders with that status. |
| **TC-A13** | Orders | View order details. | OrderDetailModal shows full order info and status timeline. |
| **TC-A14** | Analytics | View charts. | Stats API returns correct data for dashboard statistics. |
| **TC-A15** | UI | Sticky Tab Navigation. | Scrolling keeps "Orders" and "Catalogue" tabs visible. |
| **TC-A16** | Orders | Advance to Shipped without Tracking ID. | API returns error; Tracking ID is required. |
| **TC-A17** | Orders | Tracking ID displayed on Track page. | After shipping, customer sees the Tracking ID on the order card. |

## 4. System & Persistence Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-S01** | State | Refresh page after adding to cart. | Cart items and count badge persist using `localStorage` (luxe_cart). |
| **TC-S02** | State | Place order and check persistence. | Order persists in PostgreSQL; Appears in tracking and admin. |
| **TC-S03** | State | Admin product changes persist. | Added/edited products persist in database. |
| **TC-S04** | Console | Browser Console Inspection. | No critical errors; No CORS issues. |
| **TC-S05** | Mobile | Responsive Menu Toggle. | Hamburger menu opens/closes correctly on screens < 768px. |
| **TC-S06** | XSS | Attempt script injection. | Inputs are sanitized server-side; Scripts not executed. |
| **TC-S07** | Accessibility | Skip link navigation. | Skip link appears on focus; Moves focus to main content. |

## 5. Order Status Flow Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-F01** | Flow | Verify complete status progression. | Order can advance through all statuses: Pending → Approved → Packaging → Shipped → Delivered. |
| **TC-F02** | Flow | Reject from pending. | Order status changes to "Rejected"; Stock restored; Cannot advance further. |
| **TC-F03** | Flow | Attempt to advance delivered order. | API returns error; Order is already at final status. |
| **TC-F04** | Flow | Stock restoration on reject. | Rejected order's items return to available stock in database. |

---

## 6. Playwright E2E Test Suite

The following Playwright tests cover the critical user journeys and API endpoints.

### 6.1 Test Setup

```bash
# Install Playwright
npm init playwright@latest -- --yes

# Run tests
npx playwright test

# Run with UI
npx playwright test --ui

# Generate report
npx playwright show-report
```

### 6.2 Test Files

#### `tests/e2e/customer-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Customer Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-C01: Add item to cart from homepage', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('[data-testid="product-card"]')).toBeVisible({ timeout: 10000 });
    
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const productName = await firstProduct.locator('[data-testid="product-name"]').textContent();
    
    await firstProduct.locator('[data-testid="add-to-cart-btn"]').click();
    
    // Check toast notification
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('added to cart');
    
    // Check cart badge
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1');
  });

  test('TC-C10: Cannot add out-of-stock item', async ({ page }) => {
    // Navigate to catalogue
    await page.goto('/catalogue');
    await expect(page.locator('[data-testid="product-card"]')).toBeVisible({ timeout: 10000 });
    
    // Find out of stock product
    const outOfStockBtn = page.locator('[data-testid="add-to-cart-btn"][disabled]');
    await expect(outOfStockBtn).toBeDisabled();
  });

  test('TC-C04, TC-C05, TC-C06: Checkout form validation', async ({ page }) => {
    // Add item to cart first
    await page.goto('/catalogue');
    await page.locator('[data-testid="product-card"]').first().locator('[data-testid="add-to-cart-btn"]').click();
    
    // Go to checkout
    await page.goto('/order');
    
    // Try to submit without filling fields
    await page.locator('button[type="submit"]').click();
    
    // Should see errors
    await expect(page.locator('.form-error')).toBeVisible();
    
    // Fill invalid phone
    await page.locator('#phone').fill('123');
    await page.locator('#fullName').fill('Test User');
    await page.locator('#email').fill('test@example.com');
    await page.locator('button:has-text("Next")').click();
    
    // Phone error should appear
    await expect(page.locator('.form-error')).toContainText('10-digit');
  });

  test('TC-C07: Free shipping on checkout', async ({ page }) => {
    await page.goto('/order');
    
    // Shipping should show as free (₹0.00)
    await expect(page.locator('[data-testid="shipping-cost"]')).toHaveText(/₹0\.00|Free/);
  });
});
```

#### `tests/e2e/order-tracking.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Order Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/track');
  });

  test('TC-T04: Invalid phone number validation', async ({ page }) => {
    // Enter invalid phone
    await page.locator('input[placeholder*="phone"]').fill('123');
    await page.locator('button:has-text("Search")').click();
    
    await expect(page.locator('.form-error')).toContainText('10-digit');
  });

  test('TC-T01: Search with non-existent phone', async ({ page }) => {
    await page.locator('input[placeholder*="phone"]').fill('9999999999');
    await page.locator('button:has-text("Search")').click();
    
    await expect(page.locator('[data-testid="no-orders-message"]')).toBeVisible();
  });

  test('TC-T07: Search with non-existent Order ID', async ({ page }) => {
    // Switch to Order ID search
    await page.locator('label:has-text("Order ID")').click();
    
    await page.locator('input[placeholder*="Order"]').fill('NONEXISTENT123');
    await page.locator('button:has-text("Search")').click();
    
    await expect(page.locator('[data-testid="no-orders-message"]')).toBeVisible();
  });
});
```

#### `tests/e2e/admin-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Administrator Workflow', () => {
  test('TC-A01, TC-A02: Admin login', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Try invalid credentials first
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    
    await expect(page.locator('[data-testid="toast-error"]')).toContainText('Invalid');
    
    // Login with correct credentials
    await page.locator('#password').fill('admin123');
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL('/admin');
  });

  test('TC-A03: Access admin without login redirects', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin/login');
  });

  test('TC-A05: Create product via API', async ({ request }) => {
    // First login to get auth cookie
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' }
    });
    expect(loginRes.ok()).toBeTruthy();
    
    const cookies = await loginRes.allHeaders();
    
    // Create product
    const createRes = await request.post('/api/products', {
      data: {
        name: 'Test Product',
        price: 99.99,
        stockQuantity: 10,
        categoryId: 1,
        description: 'Test description',
        imageUrl: 'https://example.com/image.jpg'
      },
      headers: {
        Cookie: cookies['set-cookie'] || ''
      }
    });
    
    expect(createRes.ok()).toBeTruthy();
    const product = await createRes.json();
    expect(product.name).toBe('Test Product');
  });
});
```

#### `tests/api/orders.api.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Orders API', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const res = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' }
    });
    const cookies = await res.allHeaders();
    authToken = cookies['set-cookie'] || '';
  });

  test('POST /api/orders - Create order', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: {
        items: [{ id: 'test-product-id', quantity: 1 }],
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '9876543210',
        addressLine1: '123 Test St',
        city: 'Mumbai',
        stateCode: 'MH',
        postalCode: '400001',
        transactionId: 'TXN123456'
      }
    });
    
    // Should fail if product doesn't exist
    expect(res.status()).toBe(404);
  });

  test('GET /api/orders - Requires auth', async ({ request }) => {
    const res = await request.get('/api/orders');
    expect(res.status()).toBe(401);
  });

  test('GET /api/orders - With auth', async ({ request }) => {
    const res = await request.get('/api/orders', {
      headers: { Cookie: authToken }
    });
    expect(res.status()).toBe(200);
  });
});
```

#### `tests/api/auth.api.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Auth API', () => {
  test('POST /api/auth/login - Invalid credentials', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'wrongpassword' }
    });
    
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid');
  });

  test('POST /api/auth/login - Valid credentials', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' }
    });
    
    expect(res.status()).toBe(200);
    expect(res.headers()['set-cookie']).toBeDefined();
  });

  test('POST /api/auth/logout', async ({ request }) => {
    // First login
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' }
    });
    const cookies = await loginRes.allHeaders();
    
    // Then logout
    const logoutRes = await request.post('/api/auth/logout', {
      headers: { Cookie: cookies['set-cookie'] || '' }
    });
    
    expect(logoutRes.status()).toBe(200);
  });

  test('GET /api/auth/me - Without auth', async ({ request }) => {
    const res = await request.get('/api/auth/me');
    expect(res.status()).toBe(401);
  });
});
```

#### `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
```
