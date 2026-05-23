# LUXE Artisan Collection — Test Cases

This document defines the manual and automated test scenarios required to verify the integrity and functionality of the LUXE e-commerce prototype.

## 1. Customer Workflow Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-C01** | Cart | Add item to cart from Catalogue. | Cart badge count increases; "Success" toast appears; Item is visible in cart dropdown. |
| **TC-C02** | Cart | Increment item quantity beyond available stock. | System prevents increment; "Warning" toast displays maximum stock message. |
| **TC-C03** | Cart | Remove item from Checkout page. | Item is removed from summary; Subtotal and Total update immediately. |
| **TC-C04** | Checkout | Submit order with empty mandatory fields. | Page scrolls to first error; Fields turn red; "Error" toast appears. |
| **TC-C05** | Checkout | Validate Phone Number input length. | Input field restricts input to exactly 10 digits (`maxlength="10"`); Submit fails if < 10 digits. |
| **TC-C06** | Checkout | Validate PIN Code input. | Submit fails if PIN is not exactly 6 numeric digits; Helper placeholder "e.g. 600001" is visible. |
| **TC-C07** | Checkout | Free Shipping calculation. | Shipping shows "₹12.00" for orders < ₹200; Shows "Free" for orders ≥ ₹200. |
| **TC-C08** | Success | Order Confirmation display. | Redirects to `confirmation.html?id=ORD-...`; Correct Order ID and customer details are displayed. |

## 2. Order Tracking Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-T01** | Search | Search with non-existent phone number. | "No orders found" message displays in results area. |
| **TC-T02** | Search | Search with valid 10-digit number. | List of matching orders appears showing ID, Date, and Status. |
| **TC-T03** | Detail | Click on search result item. | Modal opens showing full order details, items, and current approval status. |
| **TC-T04** | Security | Attempt to search with malformed number (e.g. "123"). | "Please enter a valid 10-digit phone number" error appears. |

## 3. Administrator Workflow Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-A01** | Auth | Login with invalid credentials. | Fields turn red; "Invalid credentials" toast appears. |
| **TC-A02** | Auth | Login with `admin` / `admin123`. | Success toast; User is redirected to `admin.html`. |
| **TC-A03** | Catalogue | Create new product. | Modal form validates all fields; New product appears in table and on the home page catalogue. |
| **TC-A04** | Catalogue | Edit existing product stock. | Stock units update in Admin table; Status badge (e.g. "Low Stock") updates based on value. |
| **TC-A05** | Orders | Approve a pending order. | Status badge changes to "Approved" (green); User can see update via Track Order page. |
| **TC-A06** | Inventory | Reject an order. | Order status becomes "Rejected"; Stock quantities for the items in that order are **restored** to the catalogue. |
| **TC-A07** | UI | Sticky Tab Navigation. | Scrolling down the admin dashboard keeps "Orders" and "Catalogue" tabs visible at the top. |

## 4. System & Persistence Tests

| Test ID | Area | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-S01** | State | Refresh page after adding to cart. | Cart items and count badge persist using `localStorage`. |
| **TC-S02** | Console | Browser Console Inspection. | No "CORS" errors for missing manifests; No "ServiceWorker" registration errors on `file://` protocol. |
| **TC-S03** | Mobile | Responsive Menu Toggle. | Hamburger menu opens/closes correctly on screens < 768px; Links are clickable. |
