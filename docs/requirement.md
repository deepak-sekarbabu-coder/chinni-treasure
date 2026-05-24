# Chinni Treasure — Little Love — Requirements Specification

## 1. Project Objective
To provide a premium, artisan-crafted luxury goods e-commerce experience that allows customers to browse, purchase, and track orders while providing administrators with full control over the catalogue and order fulfillment.

## 2. Functional Requirements

### 2.1 Customer Features
- **Catalogue Browsing:** View a high-impact homepage with featured products and a dedicated catalogue page (`catalogue.html`) for the full collection.
- **Dynamic Shopping Cart:**
    - Add items to cart with real-time stock verification.
    - Adjust quantities directly in the cart/checkout with +/- controls.
    - Remove items from cart.
    - Dynamic calculation of Subtotal, Shipping (always **Free**), and Total.
- **Checkout Process:**
    - Mandatory field validation (Full Name, Email, Phone, Address, City, State/UT, PIN Code, Country, Transaction ID).
    - **Indian Address Support:** PIN code validation (6 digits), State/UT dropdown with all 36 Indian states/UTs, and localized placeholders.
    - **Phone Validation:** Strictly requires exactly 10 digits (limited via `maxlength` and regex).
    - **Payment Verification:** Manual Transaction ID entry for admin verification.
    - **Order Notes:** Optional special instructions field.
- **Order Tracking:**
    - Public tracking page with toggle between Order ID search and Phone Number search.
    - Exact matching for phone numbers (normalized numeric comparison).
    - Order ID partial matching (case-insensitive).
    - Detailed order view via modal (items, status timeline, customer info).
- **Order Confirmation:**
    - Post-checkout redirect to confirmation page with order summary.
    - Display of Order ID, customer details, and transaction information.

### 2.2 Administrator Features
- **Authentication:** Secure login portal (`admin` / `admin123`) with mandatory field validation and session-based auth.
- **Dashboard Analytics:**
    - Order statistics cards (Total, Pending, Shipped, Delivered).
    - Orders & Revenue chart over time (Chart.js).
    - Sales by Product chart (Chart.js).
- **Catalogue Management:**
    - Create, Read, Update, Delete (CRUD) products.
    - Manage stock levels and "Last Updated" timestamps per product.
    - Mandatory field checks for Name, Category, Price, Stock, Image, and Description.
    - Optional badge field (Bestseller, New, Premium, Limited, Luxury).
- **Order Management:**
    - Dashboard overview with stats (Total orders, Pending, Shipped, Delivered).
    - Status filtering with dynamic buttons (All, Pending, Approved, Packaging, Shipped, Delivered, Rejected).
    - Order detail modal with status timeline visualization.
    - Advance order status through the full flow (Pending → Approved → Packaging → Shipped → Delivered).
    - **Tracking ID:** Admin must enter a courier Tracking ID when advancing an order to Shipped. The ID is stored on the order and displayed to customers on the Track page.
    - Reject orders with automatic stock restoration on rejection.

## 3. Data & Persistence Requirements
- **Local Persistence:** All data must persist across sessions using browser `localStorage`.
- **State Keys:**
    - `luxe_products`: Current product inventory.
    - `luxe_orders`: History of all placed orders.
    - `luxe_cart`: Transient shopping cart state.
- **Session Storage:**
    - `luxe_admin_auth`: Admin authentication flag (session-only).

## 4. Order Status Flow
```
Pending → Approved → Packaging → Shipped → Delivered
   ↓
Rejected (stock restored)
```

## 5. Non-Functional Requirements
- **Performance:** Immediate UI feedback (toasts, loading screens, animations).
- **Usability:** Mobile-responsive design, serif/sans-serif typography pairing (Playfair Display + Montserrat).
- **Navigation:** Streamlined top menu (Home, Catalogue, Track, Admin).
- **Security:** 
    - XSS protection via sanitization functions.
    - Input validation on all forms.
    - Clean browser console (no CORS errors, no missing file references).
- **Architecture:** Minimal dependencies (Vanilla JS/CSS/HTML, Chart.js for admin charts only).
- **Accessibility:** ARIA labels, skip links, keyboard navigation support.
