# Chinni Treasure — Little Love — Agent Documentation

This document outlines the architecture, roles, operational guidelines, and memory for AI agents and developers interacting with the **Chinni Treasure — Little Love** codebase.

---

## 1. Project Overview

**Chinni Treasure — Little Love** is a high-end, artisan-crafted luxury goods e-commerce platform. It is built as a highly responsive Next.js application with robust server-side data persistence, dynamic cart state, and a secure administration workflow.

### Technical Stack
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Styling:** Raw CSS with custom CSS variables (no TailwindCSS)
- **State Management:** React Context + `localStorage` (`luxe_cart`) for persistent guest shopping carts
- **Authentication:** JWT-based admin authorization stored in secure `HttpOnly` cookies (`session`)
- **Charts:** Chart.js v4 for administrative analytics
- **Fonts:** Playfair Display (serif) and Montserrat (sans-serif) integrated via `next/font`

---

## 2. Core Roles & Personas

### A. The Customer (Guest)
- **Objective:** Discover heritage products, manage their cart, and securely place orders.
- **Capabilities:**
  - Browse artisan catalogue featuring dynamic stock badges (e.g., *In Stock*, *Low Stock*, *Out of Stock*).
  - Add items to cart with automatic verification against real-time database stock levels.
  - Complete purchase using a fully validated **Indian Address Form** (requiring 6-digit numeric PIN, 10-digit Phone, State/UT dropdown, and correct address fields).
  - Track orders instantly via **Order ID (UUID)** or **Customer Phone Number** (exactly 10 digits).
  - View full, historical order timelines in a premium, elegant interface.

### B. The Administrator
- **Objective:** Manage product catalog, monitor operations, and handle fulfillment.
- **Capabilities:**
  - **Secure Login:** Access restricted pages via `/admin/login` (validated securely using server-side JWT and bcryptjs password hashes).
  - **Interactive Analytics:** View revenue trends, sales distributions, and total orders on the dashboard powered by Chart.js.
  - **Catalogue CRUD:** Create, read, update, and toggle status (`isActive`) of products and categories with mandatory validations.
  - **Order Operations:** Move orders through fulfillment states with notes:
    ```
    pending → approved → packaging → shipped → delivered
       ↓
    rejected (restores stock)
    ```
  - **Fulfillment Constraints:** Entering a **Tracking ID** is strictly mandatory when transitioning an order from `packaging` to `shipped`.

---

## 3. Architecture & Codebase Design

### Database Schema (Prisma Models)
1. **Category:** Supports active filtering, description, and display sorting order.
2. **Product:** Tracks SKU, Name, Description, Price (Decimal), Stock Quantity, Image URL, Badge (e.g., Bestseller, Luxury), and Active state.
3. **Order:** Stores detailed customer details, state code, tracking ID, totals, transaction references, and notes.
4. **OrderItem:** Connects orders with products, recording historical unit prices.
5. **OrderStatusHistory:** Logs every transition of order status for traceability.
6. **Admin:** Tracks user credentials, email, hashed passwords, and permission roles.

### Core Logic & State Management
- **Cart Context:** Managed via `CartProvider.tsx` (`src/components/cart/`). It reads/writes to `localStorage` key `luxe_cart` on the client, and restricts quantities to active product stock levels.
- **Inventory Sync:** Stock is deducted server-side when an order is finalized, and seamlessly restored to the inventory pool if the administrator sets the status to `rejected`.
- **Security Middleware:** Next.js middleware (`middleware.ts`) protects all `/admin` routes (except `/admin/login`) by verifying the secure JWT cookie.

---

## 4. Development Guidelines for AI Agents

To maintain the high-end luxury feel and rigorous code standards of this application, all modifications must adhere to these rules:

1. **Design Integrity (Raw CSS):** 
   - Never introduce TailwindCSS or style frameworks.
   - Use CSS custom properties in `app/globals.css` to respect the curated color palette and typography pairs:
     - Serif Font (`--font-serif`): Playfair Display for headings, brand voice, and prices.
     - Sans Font (`--font-sans`): Montserrat for labels, body, inputs, and admin layout.
     - Color Tokens: Gold Accent (`--gold`), Dark Canvas (`--black`), Warm Page Background (`--cream`).

2. **Access & Security:**
   - Always verify and decode JWT tokens server-side for admin endpoints.
   - Password manipulation must always utilize the bcrypt hashing functions inside `src/lib/auth.ts`.

3. **Accessibility (A11y):**
   - Retain explicit visible focus rings for interactive components (never set `outline: none`).
   - Maintain minimum tap targets of 44×44px (prefer 48×48px for CTA buttons) on mobile views.
   - Respect user motions via `prefers-reduced-motion` and support `prefers-contrast`.

4. **Input & Validation Strictness:**
   - Always sanitize HTML and inputs utilizing helper utilities to prevent XSS.
   - Enforce rigorous validation schemas (e.g., Zod) on checkout requests:
     - 6-digit postal code format checking.
     - 10-digit phone number parsing (trim spaces and validate format).
     - Non-negative prices and quantities.

5. **Local Dev & Testing Safety:**
   - Ensure environment variables are read gracefully with fallbacks for development.
   - Never commit actual environment files (`.env`); update `.env.example` if you add new configuration variables.

---

## 5. File Structure Reference

```
chinni-treasure/
├── app/                          # Next.js App Router pages
│   ├── admin/
│   │   ├── login/page.tsx        # Admin login page
│   │   └── page.tsx              # Admin dashboard (orders, stats, catalogue CRUD)
│   ├── api/                      # Server-side API handlers (auth, orders, products, track)
│   ├── catalogue/page.tsx        # Product catalog / browsing
│   ├── confirmation/[id]/page.tsx # Order confirmation after purchase
│   ├── order/page.tsx            # Checkout page with delivery form
│   ├── track/page.tsx            # Order tracking portal
│   ├── globals.css               # Main styling & luxury design system variables
│   ├── layout.tsx                # Root layout, layout components
│   └── page.tsx                  # Landing homepage
├── prisma/
│   ├── schema.prisma             # Database schema (6 models + enums)
│   └── seed.ts                   # Database seeder (sample admin & catalog items)
├── src/
│   ├── components/               # Cart Context, Navbar, Footer, Modal, Toast components
│   ├── lib/                      # Auth helpers, DB connections, formatting utilities
│   └── types/                    # Shared TypeScript interfaces
├── middleware.ts                 # Route protection middleware
└── package.json                  # Scripts & dependencies
```

---

## 6. Common Developer Workflows

Use the following commands during development and maintenance:

| Command | Action |
|---|---|
| `npm run dev` | Starts the local Next.js development server with Turbopack |
| `npm run build` | Validates TypeScript, generates Prisma client, and compiles Next.js for production |
| `npm run setup` | Performs complete DB setup (generates Prisma client, pushes schema, and seeds data) |
| `npm run lint` | Runs ESLint analysis across the project |
| `npm run typecheck` | Validates type safety (`tsc --noEmit`) |
| `npx prisma studio` | Opens the Prisma GUI client to view local database state |
