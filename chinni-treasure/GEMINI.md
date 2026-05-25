# Chinni Treasure — Engineering & Design Mandates

This document serves as the primary source of truth for architecture, conventions, and workflows within the Chinni Treasure codebase. Adhere to these instructions strictly.

## 1. Project Overview
Chinni Treasure is a hybrid e-commerce platform for artisan luxury goods. It features a high-emotion, brand-focused customer storefront and a high-efficiency, product-focused admin dashboard.

- **Stack:** Next.js (App Router), TypeScript, Prisma (PostgreSQL), React 19.
- **Design:** Custom Vanilla CSS (no Tailwind), focusing on warmth, gold accents, and a serif/sans-serif typographic hierarchy.

## 2. Tech Stack & Environment
- **Node.js:** v24.x (LTS)
- **Database:** PostgreSQL (via Prisma with `@prisma/adapter-pg`)
- **Package Manager:** npm
- **OS:** Windows (win32) - Ensure commands are compatible with PowerShell/CMD where applicable.

## 3. Core Workflows

### 3.1 Database Management (Prisma)
- **Schema Changes:** Modify `prisma/schema.prisma`.
- **Syncing:** Use `npm run prisma:push` for local development. Use `npx prisma migrate dev` if formal migrations are required for production-like environments.
- **Generation:** Always run `npm run prisma:generate` after schema changes.
- **Seeding:** Use `npm run prisma:seed` to populate the database with initial artisan products and categories.
- **Full Reset:** `npm run setup` runs generate, push, and seed in sequence.

### 3.2 Development & Build
- **Dev:** `npm run dev` (Starts Next.js on port 3000).
- **Type Checking:** `npm run typecheck` (Runs `tsc`). Perform this before any significant commit.
- **Linting:** `npm run lint` (ESLint).
- **Build:** `npm run build` (Ensures Prisma client is generated before the Next.js build).

## 4. Architecture & Conventions

### 4.1 Directory Structure
- `app/`: Next.js App Router.
  - `api/`: Backend routes.
  - `admin/`: Operator dashboard.
  - `catalogue/`, `order/`, `track/`: Customer-facing modules.
- `src/components/`: Reusable UI components.
  - `ui/`: Atomic elements (badges, cards, spinners).
  - `layout/`: Global structure (Navbar, Footer).
- `src/lib/`: Core logic, constants, and database client.
- `src/types/`: Global TypeScript definitions.

### 4.2 Coding Standards
- **Component Patterns:** Prefer functional components with explicit interfaces for props.
- **State Management:** Use React Context (e.g., `CartProvider`) for global UI state; server components for data fetching.
- **Data Fetching:** Prefer Server Components and Server Actions over client-side `useEffect` fetches where possible.
- **Type Safety:** No `any`. Use Zod for runtime validation (especially in API routes).

## 5. Design & UI Standards (from brief.md)

### 5.1 Color Palette
| Token | Value | Role |
|---|---|---|
| `--gold` | `#d4af37` | Primary accent, CTAs |
| `--gold-dark` | `#b8960f` | Price text, emphasis |
| `--black` | `#0d0d0d` | Hero backgrounds, Admin UI |
| `--cream` | `#f5f0e8` | Customer page background |

### 5.2 Typography
- **Headings/Prices:** `Playfair Display` (Serif).
- **Body/Admin/Buttons:** `Montserrat` (Sans-serif).

### 5.3 Principles
- **Warmth over sterile polish:** Use texture and warm colors.
- **One job per screen:** Maintain clear focus in UI layout.
- **Physicality:** Evoke "warm brass" and "polished wood" through visual depth.

## 6. Agent Instructions
- **Tooling:** Use `npx prisma` for database tasks. Use `npm run` scripts defined in `package.json`.
- **Windows Compatibility:** Always provide file paths using backslashes (`\`) when communicating with the OS, but use forward slashes (`/`) in imports/code.
- **Testing:** Search for existing tests in `src/test/` before adding new features.
- **Git:** Match the concise, "why-focused" commit style found in `git log`.
- **Vanilla CSS:** Do not install or use Tailwind CSS. Write modular CSS or global styles in `globals.css` using the established tokens.
