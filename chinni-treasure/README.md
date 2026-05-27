# Chinni Treasure — ❤️ Little Love ❤️

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
├── next.config.ts                # Next.js configuration
├── vercel.json                   # Vercel deployment config
├── .env.example                  # Environment variable template
└── package.json
```

---

## Deploying to Vercel

> **Important:** The project lives in the `chinni-treasure/` subdirectory. You **must** configure the Root Directory setting in Vercel, or it will fail to detect Next.js (see step 4 below).

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Create a Vercel Project

1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**
2. Import your GitHub repository
3. **Do not click Deploy yet** — the default settings need to be adjusted

### 3. Configure the Project

In the **Configure Project** screen:

| Setting | Value |
|---|---|
| **Root Directory** | `chinni-treasure` (click the dropdown and select it) |
| **Framework Preset** | Next.js (should auto-detect) |
| **Build Command** | `npm run build` (auto-filled) |
| **Output Directory** | (leave default) |
| **Install Command** | (leave default) |

#### Environment Variables

Add these under **Environment Variables**:

| Name | Value | Scope |
|---|---|---|
| `DATABASE_URL` | Your production PostgreSQL connection string | Production, Preview, Development |
| `JWT_SECRET` | A secure random string (e.g. `openssl rand -base64 32`) | Production, Preview, Development |

> If you're attaching a Vercel Postgres database, its variables (`POSTGRES_URL`, etc.) are auto-injected under **Environment Variables — Automatically** after step 5.

### 4. Deploy

Click **Deploy**. Vercel will:

1. Clone the repository
2. Change into the `chinni-treasure/` root directory
3. Run `npm install` (which triggers `prisma generate` via `postinstall`)
4. Run `npm run build` (which runs `prisma generate` then `next build`)
5. Deploy the output

> If the Root Directory is not set, you'll see: `Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies".`

### 5. Attach a Database (Recommended: Vercel Postgres)

1. After deployment, go to your project dashboard → **Storage** → **Connect Store** → **Create New** → **Postgres**
2. Follow the wizard to create and attach a database
3. Vercel auto-injects the `POSTGRES_*` env vars into your project
4. The `prisma.config.ts` already reads these vars — no config changes needed
5. Re-deploy the project by pushing a new commit (or use **Redeploy** in the Vercel dashboard)

### 6. Run Database Migrations

The empty database needs the schema applied. Run:

```bash
# Pull production env vars locally
vercel env pull .env.production.local

# Apply migrations
npx prisma migrate deploy
```

Or, if you don't have the Vercel CLI installed:

1. Go to **Vercel Dashboard → Your Project → Storage → your-database → Quickstart**
2. Copy the full `DATABASE_URL` from there
3. Run locally:
   ```bash
   DATABASE_URL="paste-the-url-here" npx prisma migrate deploy
   ```

### 7. Seed the Production Database (Once)

```bash
# Using Vercel CLI:
vercel env pull .env.production.local
npx prisma db seed

# Or inline:
DATABASE_URL="your-production-url" npx tsx prisma/seed.ts
```

> **Important:** Change the default admin password (`admin` / `admin123`) immediately after first login.

---

#### Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Error: No Next.js version detected` | Root Directory not set | Go to **Settings → General → Root Directory** and set it to `chinni-treasure` |
| `PrismaClientInitializationError` | Missing `DATABASE_URL` env var | Check env vars are set in Vercel dashboard **Settings → Environment Variables** |
| `Cannot find module '@prisma/client'` | `prisma generate` didn't run | Verify `"postinstall": "prisma generate"` exists in `package.json` |
| Build succeeds but pages show 404 | Vercel hasn't detected changes | Trigger a new deployment via **Redeploy** or push a new commit |

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
