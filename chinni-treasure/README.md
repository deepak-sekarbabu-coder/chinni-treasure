# Chinni Treasure — Little Love

> A high-end, artisan-crafted luxury goods e-commerce platform built with Next.js 16, Prisma, and PostgreSQL.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Styling:** Raw CSS with CSS Variables (no Tailwind)
- **Authentication:** JWT-based admin auth (stored in httpOnly cookies)
- **State Management:** React Context + `localStorage` for cart persistence
- **Charts:** Chart.js (admin dashboard analytics)
- **Fonts:** Playfair Display (serif) + Montserrat (sans-serif) via `next/font`

---

## Prerequisites

- **Node.js** 20.x or later
- **npm** 10.x or later
- **PostgreSQL** 14 or later (local or remote)
- A modern browser (Chrome, Firefox, Edge, Safari)

---

## Getting Started Locally

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chinni-treasure
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up the Database

Create a PostgreSQL database and note the connection string:

```bash
createdb chinni_treasure
# or via psql: CREATE DATABASE chinni_treasure;
```

### 4. Configure Environment Variables

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
# Database (local)
DATABASE_URL=postgresql://youruser:yourpassword@localhost:5432/chinni_treasure

# JWT Secret (change in production!)
JWT_SECRET=your-secure-random-secret-key
```

> **Note:** The `.env` file includes example Vercel Postgres variables for production deployment. For local development, only `DATABASE_URL` and `JWT_SECRET` are needed. Vercel auto-injects the `POSTGRES_*` variables when you attach a Postgres database.

### 5. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This will:
- Apply the schema migrations to your PostgreSQL database
- Generate the Prisma client

### 6. Seed the Database

Populate the database with sample products and an admin user:

```bash
npx prisma db seed
```

The seed script creates:
- **9 artisan products** (golden Ganesha, silk sarees, brass lamps, etc.) with pricing and stock
- **1 admin user** — username: `admin`, password: `admin123`

### 7. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js development server (with Turbopack) |
| `npm run build` | Build the application for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint across the project |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:push` | Push the Prisma schema to the database |
| `npm run prisma:seed` | Seed the database with sample data |
| `npm run setup` | Full setup: generate client + push schema + seed data |
| `npx prisma studio` | Open Prisma Studio (GUI for database management) |

---

## Project Structure

```
chinni-treasure/
├── app/                          # Next.js App Router pages
│   ├── admin/
│   │   ├── login/page.tsx        # Admin login page
│   │   └── page.tsx              # Admin dashboard (orders, stats, catalogue CRUD)
│   ├── api/                      # API route handlers
│   │   ├── auth/                 # Login / logout / session
│   │   ├── orders/               # Order CRUD & status management
│   │   ├── products/             # Product CRUD
│   │   ├── stats/                # Dashboard statistics
│   │   └── track/                # Order tracking
│   ├── catalogue/page.tsx        # Product catalogue / browsing
│   ├── confirmation/[id]/page.tsx # Order confirmation after purchase
│   ├── order/page.tsx            # Checkout page with delivery form
│   ├── track/page.tsx            # Order tracking portal
│   ├── globals.css               # Global styles and design system
│   ├── layout.tsx                # Root layout (Navbar, Footer, Providers)
│   └── page.tsx                  # Homepage
├── prisma/
│   ├── schema.prisma             # Database schema (6 models)
│   └── seed.ts                   # Database seeder
├── src/
│   ├── components/
│   │   ├── cart/CartProvider.tsx  # Cart context + localStorage persistence
│   │   ├── layout/
│   │   │   ├── Footer.tsx        # Site footer
│   │   │   └── Navbar.tsx        # Responsive navbar with cart dropdown
│   │   ├── order/
│   │   │   └── OrderDetailModal.tsx # Order detail modal (admin)
│   │   └── ui/
│   │       └── ToastProvider.tsx  # Toast notification system
│   ├── lib/
│   │   ├── auth.ts               # JWT auth helpers (verify, getSession)
│   │   ├── constants.ts          # Site constants (states, categories, etc.)
│   │   ├── prisma.ts             # Prisma client singleton
│   │   └── utils.ts              # Utility functions (sanitize, order numbers)
│   └── types/
│       └── index.ts              # Shared TypeScript types
├── middleware.ts                 # Next.js middleware (admin route auth)
├── next.config.ts                # Next.js configuration
├── vercel.json                   # Vercel deployment config
├── .env.example                  # Environment variable template
└── package.json
```

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**
2. Import your GitHub repository
3. The framework should auto-detect **Next.js**
4. Under **Environment Variables**, add:
   - `DATABASE_URL` — Your production PostgreSQL connection string
   - `JWT_SECRET` — A secure random string
   - (Vercel Postgres variables are auto-injected if you attach a Postgres database)

### 3. Attach Vercel Postgres (Optional)

For a managed database:

1. In your Vercel project dashboard, go to **Storage → Create Database → Postgres**
2. Vercel auto-injects the `POSTGRES_*` environment variables
3. Update your Prisma datasource accordingly (or use our `prisma.config.ts` which handles it)

### 4. Run Migrations

After deploying, run migrations via Vercel CLI:

```bash
vercel env pull .env.production.local
npx prisma migrate deploy
```

Or trigger migrations via the Vercel **Post-deploy** hook.

### 5. Seed Production Database (Once)

```bash
npx prisma db seed
```

> **Important:** Change the default admin password immediately after first login.

---

## Default Admin Credentials

- **Username:** `admin`
- **Password:** `admin123`

> Change these in production! The password is hashed with bcrypt in the database.

---

## Order Status Flow

```
pending → approved → packaging → shipped → delivered
   ↓
rejected (stock restored)
```

- **Tracking ID** is required when advancing to *Shipped*
- Stock is deducted on order placement and restored if rejected

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Admin login | No |
| POST | `/api/auth/logout` | Admin logout | No |
| GET | `/api/auth/me` | Get current admin session | Yes |
| GET | `/api/products` | List all products | No |
| POST | `/api/products` | Create product | Yes |
| PUT | `/api/products/[id]` | Update product | Yes |
| DELETE | `/api/products/[id]` | Delete product | Yes |
| POST | `/api/orders` | Place new order | No |
| GET | `/api/orders` | List orders (admin) | Yes |
| GET | `/api/orders/[id]` | Get order details (admin) | Yes |
| PUT | `/api/orders/[id]/status` | Update order status | Yes |
| GET | `/api/track` | Track order by ID or phone | No |
| GET | `/api/stats` | Dashboard statistics | Yes |

---

## License

Private — All rights reserved.
