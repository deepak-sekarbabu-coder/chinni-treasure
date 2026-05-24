# Chinni Treasure — Little Love — Design Documentation

## 1. System Architecture
The application follows a **Static-First Client-Side** architecture. There is no backend server; all logic is executed in the browser, and data is managed via the `localStorage` API.

### 1.1 Multi-Page Structure
- **Customer Pages:** 
    - `index.html` (Homepage with hero section and featured products).
    - `catalogue.html` (Full Collection product grid).
    - `order.html` (Checkout with delivery form and order summary).
    - `track.html` (Order tracking with Order ID/Phone toggle).
    - `confirmation.html` (Order success page with details).
- **Admin Pages:** 
    - `login.html` (Administrative login portal).
    - `admin.html` (Dashboard with analytics, order management, catalogue management).
- **Core Engine:** `js/main.js` (Centralized state, strict validations, and rendering).
- **Style Engine:** `css/style.css` (Unified brand identity, 2551 lines).
- **Service Worker:** `sw.js` (PWA support and offline caching).

## 2. Data Model (JSON Schema)

### 2.1 Product Object
```json
{
  "id": "number/timestamp",
  "name": "string",
  "category": "string",
  "price": "number",
  "stock": "number",
  "image": "url",
  "badge": "string|null",
  "description": "string",
  "lastUpdated": "iso-date"
}
```

### 2.2 Order Object
```json
{
  "id": "string (ORD-TIMESTAMP-RANDOM)",
  "date": "iso-date",
  "status": "pending|approved|packaging|shipped|delivered|rejected",
  "items": [{"productId": 1, "quantity": 1}],
  "total": "number",
  "shipping": "number",
  "grandTotal": "number",
  "customer": {
    "name": "string",
    "email": "string",
    "phone": "string (10 digits)",
    "address": "string",
    "city": "string",
    "state": "string",
    "zip": "string (6 digits)",
    "country": "string"
  },
  "transactionId": "string",
  "notes": "string"
}
```

### 2.3 Cart Item Object
```json
{
  "productId": "number",
  "quantity": "number"
}
```

## 3. UI/UX Design System

### 3.1 Color Palette
- **Primary (Gold):** `#d4af37` / `#b8960f` (Elegance, Craftsmanship).
- **Gold Light:** `#f0d68a` (Highlights, hover states).
- **Secondary (Dark):** `#0d0d0d` / `#1a1a1a` (Luxury, Contrast).
- **Background (Cream):** `#f5f0e8` / `#faf7f2` (Warmth, Premium feel).
- **Text:** `#a0a0a0` (Light), `#707070` (Muted), `#3a3a3a` (Charcoal).
- **Accent (Success):** `#2ecc71` (Green for success states).
- **Accent (Error):** `#e74c3c` (Red for errors).
- **Accent (Warning):** `#f39c12` (Orange for pending/warning states).

### 3.2 Typography
- **Headings:** `Playfair Display` (Serif).
- **Body:** `Montserrat` (Sans-Serif).

### 3.3 Interactive Components
- **Input Restrictions:** `maxlength="10"` for phone numbers and `maxlength="6"` for PIN codes.
- **Form Feedback:** Inline red error states and toast notifications.
- **Modals:** Centralized detail views for orders and product editing.
- **Tabs:** Sticky administration tabs to prevent layout overlap.
- **Loading Screen:** Animated spinner with fade-out transition.
- **Toast Notifications:** Slide-in alerts with success/error/info variants.

## 4. Key Logic Flows

### 4.1 Stock Management
- **Deduction:** Occurs during `submitOrder` after final validation.
- **Prevention:** Real-time stock check prevents adding more than available items to cart.
- **Restoration:** Automatic when an order is `rejected`.
- **Visual Indicators:** 
    - "In Stock" (green) for stock > 3
    - "Only X left" (orange) for stock <= 3
    - "Out of Stock" (red) for stock = 0

### 4.2 Order Tracking
- **Input Methods:**
    - Order ID: Partial matching (case-insensitive).
    - Phone Number: Exact 10-digit match after normalization.
- **Process:** 
    - Toggle between search methods with radio buttons.
    - Validation before search execution.
    - Results sorted by date (newest first).
- **Detail View:** Modal with status timeline, customer info, and item breakdown.

### 4.3 Order Status Flow
```
Pending → Approved → Packaging → Shipped → Delivered
   ↓
Rejected (stock restored)
```

### 4.4 Admin Dashboard
- **Authentication:** Session-based login with `luxe_admin_auth` flag.
- **Analytics:** Chart.js line chart (orders/revenue over time) and bar chart (sales by product).
- **Order Management:**
    - Filter buttons for each status + "All Orders".
    - Table view with Order ID, Date, Customer, Items, Total, Status, Transaction ID.
    - Detail modal with timeline visualization.
    - Advance/Reject action buttons.
- **Catalogue Management:**
    - Table view with Image, Name, Category, Price, Badge, Stock, Last Updated.
    - Add/Edit modal with form validation.
    - Delete with confirmation.

## 5. Security & Validation

### 5.1 XSS Protection
- `sanitizeHTML()`: Escapes HTML entities for display.
- `sanitizeInput()`: Strips angle brackets and trims whitespace.

### 5.2 Form Validation
- **Email:** Regex pattern validation.
- **Phone:** Exactly 10 digits (regex + maxlength).
- **PIN Code:** Exactly 6 digits (regex + maxlength).
- **Required Fields:** All mandatory fields checked before submission.

### 5.3 State Persistence
- Automatic save to `localStorage` on state changes.
- Graceful fallback if storage is unavailable.
