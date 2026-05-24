# Chinni Treasure — Little Love — Agent Documentation

This document outlines the architecture, roles, and operational guidelines for AI agents and developers interacting with this project.

## 1. Project Overview
**Chinni Treasure — Little Love** is a high-end, artisan-crafted luxury goods e-commerce prototype. It is built as a **static-first, single-page-behavior** application that persists all state in the browser's `localStorage`.

### Technical Stack
- **Frontend:** HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+).
- **State Management:** Localized state stored in `localStorage` keys (`luxe_products`, `luxe_cart`, `luxe_orders`).
- **Persistence:** Persistent within the same browser origin.
- **Authentication:** Session-based admin auth stored in `sessionStorage` (`luxe_admin_auth`).
- **Charts:** Chart.js v4.4.1 for admin analytics.

---

## 2. Core Roles & Personas

### A. The Customer (Guest)
- **Objective:** Browse the collection and place orders.
- **Capabilities:**
    - View catalogue (dynamic stock badges: In Stock, Low Stock, Out of Stock).
    - Manage cart (quantity limits based on stock, +/- controls, remove items).
    - Place orders using a validated **Indian Address Form** (PIN Code, State/UT dropdown).
    - Track order status using **Order ID** or an **exact 10-digit phone number**.
    - View detailed order information in modal.
- **Constraints:** Navigation is streamlined; ordering is initiated via the cart or products (no top-level "Order" link).

### B. The Administrator
- **Objective:** Manage collection and fulfillment.
- **Capabilities:**
    - **Authentication:** Secure login portal with `admin` / `admin123` credentials.
    - **Dashboard Analytics:** View order statistics and revenue charts.
    - **Catalogue Management:** CRUD operations with mandatory field validation and "Last Updated" timestamps.
    - **Order Management:** Full order status flow (Pending → Approved → Packaging → Shipped → Delivered) with Approve/Reject functionality, automated stock synchronization, and mandatory **Tracking ID** entry when advancing to Shipped.
    - **Order Filtering:** Dynamic filter buttons for all order statuses.

---

## 3. Architecture & State Logic

### State Keys
1. `luxe_products`: Product array (ID, Name, Category, Price, Stock, Image, Description, Badge, lastUpdated).
2. `luxe_cart`: Current cart items (`productId`, `quantity`).
3. `luxe_orders`: History of submitted orders with validated customer details.
4. `luxe_admin_auth`: Session storage flag for admin authentication.

### Inventory Logic
- **Real-time Check:** `addToCart` prevents exceeding available stock.
- **Final Validation:** `submitOrder` performs a secondary check before deduction.
- **Deduction/Restoration:** Stock is deducted on successful submission and restored if the order is later rejected.

### Order Status Flow
```
pending → approved → packaging → shipped → delivered
   ↓
rejected (stock restored)
```

---

## 4. Development Guidelines for AI Agents

When modifying this codebase, agents must adhere to the following:

1.  **Validation Strictness:** All forms (Login, Checkout, Tracking, Product Admin) must have mandatory field checks and numeric formatting (10 digits for phone, 6 for PIN).
2.  **Maintain Architecture:** Preserve the **Vanilla JS** zero-dependency design (except Chart.js for admin).
3.  **UI Consistency:** Use existing CSS variables and typography pairings (Playfair Display + Montserrat).
4.  **Local Dev Safety:** Ensure references to external/missing files (like manifests or service workers) are removed to keep the browser console error-free during local `file://` testing.
5.  **Navigation Flow:** Use the Home, Catalogue, Track, Admin structure. Start Your Order buttons lead to `catalogue.html`.
6.  **Normalization:** Always normalize inputs (trim whitespace, strip non-numeric characters for comparisons) before processing.
7.  **XSS Protection:** Use `sanitizeHTML()` and `sanitizeInput()` functions for all user-facing output.

---

## 5. File Structure
- `index.html`: Homepage with hero section and featured products.
- `catalogue.html`: Full artisan collection product grid.
- `order.html`: Checkout page with delivery form and order summary.
- `track.html`: Order tracking portal with Order ID/Phone toggle.
- `confirmation.html`: Order success page with order details.
- `admin.html`: Dashboard with analytics charts, order management, and catalogue management.
- `login.html`: Administrative login portal.
- `js/main.js`: Core logic, state management, and rendering (1475 lines).
- `css/style.css`: Unified branding, responsive layout, and component styles (2551 lines).
- `sw.js`: Service Worker for PWA support and offline caching.
