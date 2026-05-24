# Chinni Treasure — Little Love — Test Cases

This document defines the manual and automated test scenarios required to verify the integrity and functionality of the e-commerce prototype.

## 1. Customer Workflow Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-C01** | Cart | Add item to cart from Catalogue. | Cart badge count increases; "Success" toast appears; Item is visible in cart dropdown. |
| **TC-C02** | Cart | Increment item quantity beyond available stock. | System prevents increment; "Warning" toast displays maximum stock message. |
| **TC-C03** | Cart | Remove item from Checkout page. | Item is removed from summary; Subtotal and Total update immediately. |
| **TC-C04** | Checkout | Submit order with empty mandatory fields. | Page scrolls to first error; Fields turn red; "Error" toast appears. |
| **TC-C05** | Checkout | Validate Phone Number input length. | Input field restricts input to exactly 10 digits (`maxlength="10"`); Submit fails if < 10 digits. |
| **TC-C06** | Checkout | Validate PIN Code input. | Submit fails if PIN is not exactly 6 numeric digits; Helper placeholder "e.g. 600001" is visible. |
| **TC-C07** | Checkout | Free Shipping calculation. | Shipping always shows **"Free"** regardless of order total. |
| **TC-C08** | Success | Order Confirmation display. | Redirects to `confirmation.html?id=ORD-...`; Correct Order ID and customer details are displayed. |
| **TC-C09** | Cart | Decrease quantity to zero. | Item is removed from cart; Cart badge updates. |
| **TC-C10** | Cart | Add out-of-stock item. | "Sold Out" button disabled; Cannot add to cart. |

## 2. Order Tracking Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-T01** | Search (Phone) | Search with non-existent phone number. | "No orders found for this phone number" message displays in results area. |
| **TC-T02** | Search (Phone) | Search with valid 10-digit number. | List of matching orders appears showing ID, Date, Status, and Total. |
| **TC-T03** | Detail | Click on search result item. | Modal opens showing full order details, status timeline, items, and customer info. |
| **TC-T04** | Security (Phone) | Attempt to search with malformed number (e.g. "123"). | "Please enter a valid 10-digit phone number" error appears. |
| **TC-T05** | Search (Order ID) | Search with exact Order ID. | Matching order appears in results. |
| **TC-T06** | Search (Order ID) | Search with partial Order ID. | Orders with matching ID substring appear (case-insensitive). |
| **TC-T07** | Search (Order ID) | Search with non-existent Order ID. | "No orders found matching this Order ID" message displays. |
| **TC-T08** | Toggle | Switch between Order ID and Phone search. | Input fields toggle visibility; Previous results clear. |
| **TC-T09** | Results Sorting | Multiple orders found. | Orders sorted by date (newest first). |

## 3. Administrator Workflow Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-A01** | Auth | Login with invalid credentials. | Fields turn red; "Invalid credentials" toast appears. |
| **TC-A02** | Auth | Login with `admin` / `admin123`. | Success toast; User is redirected to `admin.html`. |
| **TC-A03** | Auth | Access admin page without login. | Redirected to `login.html`. |
| **TC-A04** | Auth | Logout. | Session cleared; Redirected to `login.html`. |
| **TC-A05** | Catalogue | Create new product. | Modal form validates all fields; New product appears in table and on the home page catalogue. |
| **TC-A06** | Catalogue | Edit existing product stock. | Stock units update in Admin table; "Low Stock" badge appears if ≤ 3. |
| **TC-A07** | Catalogue | Delete product. | Confirmation dialog appears; Product removed from table and catalogue after confirm. |
| **TC-A08** | Catalogue | Validation on empty fields. | Error toast appears; Product not saved. |
| **TC-A09** | Orders | Approve a pending order. | Status badge changes to "Approved"; Timeline updates in detail modal. |
| **TC-A10** | Orders | Advance order through full flow. | Can advance: Pending → Approved → Packaging → Shipped (requires Tracking ID) → Delivered. |
| **TC-A11** | Orders | Reject an order. | Order status becomes "Rejected"; Stock quantities restored to catalogue. |
| **TC-A12** | Orders | Filter by status. | Clicking filter buttons shows only orders with that status. |
| **TC-A13** | Orders | View order details. | Clicking "View" opens modal with full order info and status timeline. |
| **TC-A14** | Analytics | View charts. | Orders & Revenue chart and Sales by Product chart render correctly. |
| **TC-A15** | UI | Sticky Tab Navigation. | Scrolling down the admin dashboard keeps "Orders" and "Catalogue" tabs visible at the top. |
| **TC-A16** | Orders | Advance to Shipped without Tracking ID. | Tracking ID modal appears; Submit is blocked with an inline error if field is empty. |
| **TC-A17** | Orders | Tracking ID displayed on Track page. | After shipping, customer searching their order sees the Courier Tracking ID on the order card. |

## 4. System & Persistence Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-S01** | State | Refresh page after adding to cart. | Cart items and count badge persist using `localStorage`. |
| **TC-S02** | State | Place order and check persistence. | Order appears in tracking and admin after page refresh. |
| **TC-S03** | State | Admin product changes persist. | Added/edited products remain after page refresh. |
| **TC-S04** | Console | Browser Console Inspection. | No "CORS" errors for missing manifests; No "ServiceWorker" registration errors on `file://` protocol. |
| **TC-S05** | Mobile | Responsive Menu Toggle. | Hamburger menu opens/closes correctly on screens < 768px; Links are clickable. |
| **TC-S06** | XSS | Attempt script injection. | Scripts are sanitized and displayed as plain text, not executed. |
| **TC-S07** | Accessibility | Skip link navigation. | Skip link appears on focus; Moves focus to main content. |

## 5. Order Status Flow Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-F01** | Flow | Verify complete status progression. | Order can advance through all statuses: Pending → Approved → Packaging → Shipped → Delivered. |
| **TC-F02** | Flow | Reject from pending. | Order status changes to "Rejected"; Stock restored; Cannot advance further. |
| **TC-F03** | Flow | Attempt to advance delivered order. | "Order is already at the final status" toast appears. |
| **TC-F04** | Flow | Stock restoration on reject. | Rejected order's items return to available stock in catalogue. |
