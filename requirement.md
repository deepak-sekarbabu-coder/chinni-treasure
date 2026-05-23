# LUXE Artisan Collection — Requirements Specification

## 1. Project Objective
To provide a premium, artisan-crafted luxury goods e-commerce experience that allows customers to browse, purchase, and track orders while providing administrators with full control over the catalogue and order fulfillment.

## 2. Functional Requirements

### 2.1 Customer Features
- **Catalogue Browsing:** View a high-impact homepage with featured products and a dedicated catalogue page (`catalogue.html`) for the full collection.
- **Dynamic Shopping Cart:**
    - Add items to cart with real-time stock verification.
    - Adjust quantities directly in the cart/checkout.
    - Dynamic calculation of Subtotal, Shipping (Free over ₹200), and Total.
- **Checkout Process:**
    - Mandatory field validation (Full Name, Email, Phone, Address).
    - **Indian Address Support:** PIN code validation (6 digits), State/UT dropdown, and localized placeholders (e.g., Chennai, 600001).
    - **Phone Validation:** Strictly requires exactly 10 digits (limited via `maxlength` and regex).
    - **Payment Verification:** Manual Transaction ID entry for admin verification.
- **Order Tracking:**
    - Public tracking page requiring exactly a 10-digit phone number.
    - Exact matching for phone numbers (normalized numeric comparison).
    - Detailed order view via modal (items, status, customer info).

### 2.2 Administrator Features
- **Authentication:** Secure login portal (`admin` / `admin123`) with mandatory field validation.
- **Catalogue Management:**
    - Create, Read, Update, Delete (CRUD) products.
    - Manage stock levels and "Last Updated" timestamps per product.
    - Mandatory field checks for Name, Category, Price, Stock, Image, and Description.
- **Order Management:**
    - Dashboard overview (Total orders, Pending, Approved).
    - Status filtering (All, Pending, Approved, Rejected).
    - Approve/Reject orders with automatic stock restoration on rejection.

## 3. Data & Persistence Requirements
- **Local Persistence:** All data must persist across sessions using browser `localStorage`.
- **State Keys:**
    - `luxe_products`: Current product inventory.
    - `luxe_orders`: History of all placed orders.
    - `luxe_cart`: Transient shopping cart state.

## 4. Non-Functional Requirements
- **Performance:** Immediate UI feedback (toasts, loading screens).
- **Usability:** Mobile-responsive design, serif/sans-serif typography pairing.
- **Navigation:** Streamlined top menu (Home, Catalogue, Track, Admin).
- **Security:** Standard browser security origins (clean console, no CORS errors).
- **Architecture:** Zero-dependency (Vanilla JS/CSS/HTML).
