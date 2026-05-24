# Chinni Treasure — Little Love — Requirements Specification

## 1. Project Objective
To provide a premium, artisan-crafted luxury goods e-commerce experience built with Next.js 16 that allows customers to browse, purchase, and track orders while providing administrators with full control over the catalogue and order fulfillment via a secure dashboard.

## 2. Functional Requirements

### 2.1 Customer Features
- **Catalogue Browsing:** View a high-impact homepage (`/`) with featured products and a dedicated catalogue page (`/catalogue`) for the full collection.
- **Dynamic Shopping Cart:**
    - Add items to cart with real-time stock verification via CartProvider context.
    - Adjust quantities directly in the cart/checkout with +/- controls.
    - Remove items from cart.
    - Dynamic calculation of Subtotal, Shipping (always **₹0.00 - Free**), and Total.
    - Cart persisted in `localStorage` key `luxe_cart`.
- **Checkout Process:**
    - Multi-step form (Personal Details → Delivery Details → Payment & Review).
    - Mandatory field validation (Full Name, Email, Phone, Address, City, State/UT, PIN Code, Transaction ID).
    - **Indian Address Support:** PIN code validation (6 digits), State/UT dropdown with all 36 Indian states/UTs.
    - **Phone Validation:** Strictly requires exactly 10 digits (enforced via input handler).
    - **Payment Verification:** Manual Transaction ID entry for admin verification.
    - **Order Notes:** Optional special instructions field.
- **Order Tracking:**
    - Public tracking page (`/track`) with toggle between Order Number search and Phone Number search.
    - Exact matching for phone numbers (10 digits).
    - Order Number partial matching (case-insensitive via SQL ILIKE).
    - Detailed order view via OrderDetailModal (items, status timeline, customer info, tracking ID if shipped).
- **Order Confirmation:**
    - Post-checkout redirect to `/confirmation/[id]` with order summary.
    - Display of Order ID (UUID), customer details, and transaction information.

### 2.2 Administrator Features
- **Authentication:** Secure login portal (`/admin/login`) with JWT-based auth stored in httpOnly cookies. Default credentials: `admin` / `admin123`.
- **Dashboard Analytics:**
    - Order statistics cards (Total, Pending, Shipped, Delivered).
    - Orders & Revenue chart over time (Chart.js via API `/api/stats`).
    - Sales by Product chart (Chart.js).
- **Catalogue Management:**
    - Create, Read, Update, Delete (CRUD) products via `/api/products` endpoints.
    - Manage stock levels and automatic timestamps per product.
    - Mandatory field checks for Name, Category, Price, Stock, Image, and Description.
    - Optional badge field (Bestseller, New, Premium, Limited, Luxury).
    - Soft delete via `isActive` flag.
- **Order Management:**
    - Dashboard overview with stats (Total orders, Pending, Shipped, Delivered).
    - Status filtering with dynamic buttons (All, Pending, Approved, Packaging, Shipped, Delivered, Rejected).
    - Order detail modal with status timeline visualization from OrderStatusHistory.
    - Advance order status through the full flow (Pending → Approved → Packaging → Shipped → Delivered) via `PUT /api/orders/[id]/status`.
    - **Tracking ID:** Admin must enter a courier Tracking ID when advancing an order to Shipped. The ID is stored on the order and displayed to customers on the Track page.
    - Reject orders with automatic stock restoration via Prisma transaction.

## 3. Data & Persistence Requirements
- **Database:** PostgreSQL with Prisma ORM for server-side persistence.
- **Tables:**
    - `categories`: Product categories with display order.
    - `products`: Product inventory with stock tracking.
    - `orders`: Customer orders with status and tracking.
    - `order_items`: Line items linking orders to products.
    - `order_status_history`: Audit log of all status changes.
    - `admins`: Admin user credentials with bcrypt password hashes.
- **Client-Side State:**
    - `luxe_cart`: Transient shopping cart state in localStorage.
- **Session Storage:**
    - `session`: JWT token in httpOnly cookie for admin authentication.

## 4. Order Status Flow
```
pending → approved → packaging → shipped → delivered
   ↓
rejected (stock restored via transaction)
```

## 5. Non-Functional Requirements
- **Performance:** Server-side rendering with Next.js; immediate UI feedback (toasts, loading spinners, animations).
- **Usability:** Mobile-responsive design, serif/sans-serif typography pairing (Playfair Display + Montserrat via next/font).
- **Navigation:** Streamlined top menu (Home, Catalogue, Track, Admin).
- **Security:** 
    - React's built-in XSS protection via automatic escaping.
    - Input validation on all forms (client + server-side).
    - JWT authentication with httpOnly cookies.
    - Middleware protection for all `/admin/*` routes.
    - Password hashing with bcryptjs.
- **Architecture:** Next.js 16 App Router, Prisma ORM, PostgreSQL, raw CSS with CSS variables.
- **Accessibility:** ARIA labels, keyboard navigation support, visible focus rings, touch targets minimum 44×44px.
