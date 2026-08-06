# Chinni Treasure — Little Love

> **Last validated against codebase:** August 5, 2026 — Tokens, fonts, breakpoints, and component patterns re-validated against current code (`app/styles/variables.css`).

## Register

This is a **hybrid** surface. The front-facing store (homepage, catalogue, order,
confirmation, tracking) runs in **brand** register — every visual decision is a
creative choice, and the emotional reaction at arrival is the deliverable. The
admin panel (dashboard, login, order management, CRUD) runs in **product**
register — operators who use it daily should move without thinking.

## Users & Context

**Customers** arrive to discover, browse, select, and purchase artisan luxury
goods. They may be gift-givers, collectors, or first-time visitors. The primary
pressure is trust — "Is this real? Will it arrive? Is the quality as described?"

**Admins** arrive to monitor orders, update statuses, manage products, and keep
the store running. The primary pressure is throughput — "How many orders need
attention right now?"

## Purpose

Customers should feel they've discovered a trusted, warm, Indian artisan
marketplace where every piece feels curated. Admins should feel they have a
clear, fast command center for the day's operations.

## Voice

Warm, assured, unhurried. Like a knowledgeable shopkeeper in a heritage store —
not like a SaaS dashboard, not like a fashion magazine. The gold-black-cream
palette is the visual equivalent: precious, grounded, light.

**Physical words**: warm brass, soft cotton, polished wood, quiet confidence.

## Anti-References

- **Not a generic Shopify theme** — no pill badges everywhere, no round
  avatars, no blue CTAs, no cookie-cutter "shop now" hero
- **Not a luxury fashion house** — no full-bleed editorial photography, no
  minimal sans-serif-only, no cold white space
- **Not a SaaS product** — the admin dashboard should feel like an operations
  desk, not a cloud console

## Design Principles

1. **Warmth before polish.** A slightly imperfect texture beats a sterile
   pixel-perfect surface. The cream background is not beige — it's warm.
2. **Gold earns its moments.** The accent appears in navigation, CTAs, and
   signals — never as a decorative border or background fill. When it covers
   more than 10% of a viewport, it's too much.
3. **The artifact is the hero.** Products are photographed on the cream
   canvas. The card layout serves the product, not the other way around.
4. **Trust through transparency.** Order status, tracking, and pricing are
   surfaced immediately. No hidden fees, no ambiguous states.
5. **One job per screen.** The homepage decides (should I explore?). The
   catalogue explores (what's here?). The order page configures (where does
   this go?). The dashboard monitors (what needs my attention?).

## Accessibility

- All interactive elements must have visible focus rings (2-3px, offset, 3:1
  contrast). Never `outline: none`.
- Touch targets minimum 44×44px on mobile; prefer 48×48px on primary actions.
- `prefers-reduced-motion` kills all animations.
- `prefers-contrast: high` adds visible borders where color alone conveys
  meaning (badges, buttons, status indicators).
- Color is never the sole conveyer of state — badges, icons, and text labels
  accompany every status.
- Dark mode is not currently implemented. Respect existing CSS variables if
  adding it.

## Visual Foundation

| Token | Value | Role |
|---|---|---|
| `--gold` | #d4af37 | Primary accent, CTAs, brand markers |
| `--gold-light` | #f0d68a | Gold hover, subtle warmth |
| `--gold-dark` | #b8960f | Price text, emphasis |
| `--black` | #0d0d0d | Canvas (hero, admin), deep space |
| `--near-black` | #1a1a1a | Body text, card bg on dark |
| `--cream` | #f5f0e8 | Default page background |
| `--cream-light` | #faf7f2 | Input fields, card bg on light |
| `--font-serif` | Cormorant Garamond | Headings, brand voice, prices |
| `--font-sans` | Albert Sans | Body, labels, buttons, admin UI |
| `--font-script` | Pinyon Script | Decorative brand taglines, accents |
| `--text-muted` | #6d6d6d | Secondary labels, metadata |

**Spacing** targets a 1-4-9 rhythm: 4px micro, 16px component gap, 36px+
section break. In practice, the stylesheet defines a broader utility set
(4, 6, 8, 10, 12, 16, 18, 20, 24, 32, 36, 40px) for flexible layout needs.

**Breakpoints**: 320px / 480px / 640px / 768px / 1024px / 1440px. Content
pressure drives layout change, not device classes.

## Font Usage

| Context | Font | Weight |
|---|---|---|
| Headings (h1-h3), brand voice, prices | Cormorant Garamond (serif) | 400–700 |
| Body text, labels, buttons, admin UI | Albert Sans (sans-serif) | 400–700 |
| Decorative taglines, hero accents | Pinyon Script (script) | 400 |

## Component Rules

- **Buttons** use sentence case. One verb per button. No "OK" or "Confirm".
- **Cards** are only used when content is genuinely card-shaped — discrete,
  self-contained, scannable as a unit. The products grid qualifies. The admin
  order list qualifies. One card inside another is never right.
- **Modals** animate from the trigger edge (usually bottom on mobile, center
  on desktop). Always dismissable with Escape and overlay click.
- **Forms** keep visible labels (placeholders are format hints only). Fieldset
  legends use serif with a gold underline for section breaks.
- **Empty states** name what belongs, why it matters, and the action to fill
  it.
- **Loading states** name the actual work ("Loading products...", not
  "Loading...").
- The **order status timeline** always shows the full flow (pending → approved
  → packaging → shipped → delivered) with completed/active/incomplete states
  clearly differentiated. Rejected is a terminal state.
