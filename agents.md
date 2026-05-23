# LUXE Artisan Collection — Agent Documentation

This document outlines the architecture, roles, and operational guidelines for AI agents and developers interacting with this project.

## 1. Project Overview
**LUXE** is a high-end, artisan-crafted luxury goods e-commerce prototype. It is built as a **static-first, single-page-behavior** application that persists all state in the browser's `localStorage`.

### Technical Stack
- **Frontend:** HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+).
- **State Management:** Localized state stored in `localStorage` keys (`luxe_products`, `luxe_cart`, `luxe_orders`).
- **Persistence:** Persistent within the same browser origin.

---

## 2. Core Roles & Personas

### A. The Customer (Guest)
- **Objective:** Browse the collection and place orders.
- **Capabilities:**
    - View catalogue (dynamic stock badges).
    - Manage cart (quantity limits based on stock).
    - Place orders using a validated **Indian Address Form** (PIN Code, State/UT dropdown).
    - Track order status using an **exact 10-digit phone number**.
- **Constraints:** Navigation is streamlined; ordering is initiated via the cart or products (no top-level "Order" link).

### B. The Administrator
- **Objective:** Manage collection and fulfillment.
- **Capabilities:**
    - **Catalogue Management:** CRUD operations with mandatory field validation.
    - **Order Management:** Approve/Reject orders with automated stock synchronization.
    - **Security:** Login requires `admin` / `admin123` credentials.

---

## 3. Architecture & State Logic

### State Keys
1. `luxe_products`: Product array (ID, Name, Category, Price, Stock, Image, Description, Badge, lastUpdated).
2. `luxe_cart`: Current cart items (`productId`, `quantity`).
3. `luxe_orders`: History of submitted orders with validated customer details.

### Inventory Logic
- **Real-time Check:** `addToCart` prevents exceeding available stock.
- **Final Validation:** `submitOrder` performs a secondary check before deduction.
- **Deduction/Restoration:** Stock is deducted on successful submission and restored if the order is later rejected.

---

## 4. Development Guidelines for AI Agents

When modifying this codebase, agents must adhere to the following:

1.  **Validation Strictness:** All forms (Login, Checkout, Tracking, Product Admin) must have mandatory field checks and numeric formatting (10 digits for phone, 6 for PIN).
2.  **Maintain Architecture:** Preserve the **Vanilla JS** zero-dependency design.
3.  **UI Consistency:** Use existing CSS variables and typography pairings.
4.  **Local Dev Safety:** Ensure references to external/missing files (like manifests or service workers) are removed to keep the browser console error-free during local `file://` testing.
5.  **Navigation Flow:** Use the Home, Catalogue, Track, Admin structure. Start Your Order buttons lead to `catalogue.html`.
6.  **Normalization:** Always normalize inputs (trim whitespace, strip non-numeric characters for comparisons) before processing.

---

## 5. File Structure
- `index.html`: Homepage with highlights.
- `catalogue.html`: Full artisan collection.
- `order.html`: Checkout details.
- `track.html`: Tracking portal.
- `admin.html`: Dashboard with Last Updated column.
- `login.html`: Administrative login.
- `js/main.js`: Core logic and state management.
- `css/style.css`: Unified branding and layout fixes.
