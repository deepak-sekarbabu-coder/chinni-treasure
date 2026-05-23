# LUXE Artisan Collection — Design Documentation

## 1. System Architecture
The application follows a **Static-First Client-Side** architecture. There is no backend server; all logic is executed in the browser, and data is managed via the `localStorage` API.

### 1.1 Multi-Page Structure
- **Frontend Pages:** `index.html` (Catalogue), `order.html` (Checkout), `track.html` (Tracking), `confirmation.html` (Success).
- **Admin Pages:** `login.html`, `admin.html` (Dashboard).
- **Core Engine:** `js/main.js` (Centralized state, strict validations, and rendering).
- **Style Engine:** `css/style.css` (Unified brand identity).

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
  "id": "string (ORD-...) ",
  "date": "iso-date",
  "status": "pending|approved|rejected",
  "items": [{"productId": 1, "quantity": 1}],
  "total": "number",
  "grandTotal": "number",
  "customer": {
    "name": "string",
    "email": "string",
    "phone": "string (10 digits)",
    "address": "string",
    "city": "string",
    "state": "string",
    "zip": "string (6 digits)"
  },
  "transactionId": "string"
}
```

## 3. UI/UX Design System

### 3.1 Color Palette
- **Primary (Gold):** `#d4af37` / `#b8960f` (Elegance, Craftsmanship).
- **Secondary (Dark):** `#0d0d0d` (Luxury, Contrast).
- **Background (Cream):** `#f9f7f2` (Warmth, Premium feel).
- **Accent (Success/Error):** Standardized green/red for feedback.

### 3.2 Typography
- **Headings:** `Playfair Display` (Serif).
- **Body:** `Montserrat` (Sans-Serif).

### 3.3 Interactive Components
- **Input Restrictions:** `maxlength="10"` for phone numbers and `maxlength="6"` for PIN codes.
- **Form Feedback:** Inline red error states and toast notifications.
- **Modals:** Centralized detail views for orders and product editing.
- **Tabs:** Sticky administration tabs to prevent layout overlap.

## 4. Key Logic Flows

### 4.1 Stock Management
- **Deduction:** Occurs during `submitOrder`.
- **Prevention:** Real-time stock check prevents adding more than available items to cart.
- **Restoration:** Automatic when an order is `rejected`.

### 4.2 Order Tracking
- **Input:** Mandatory 10-digit phone number.
- **Process:** Strict string comparison (`===`) between normalized search input and order record.
- **Accessibility:** Accessible via the simplified navigation bar and site footer.
