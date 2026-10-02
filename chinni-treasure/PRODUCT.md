# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two equally-weighted primary audiences, both shopping on mobile in India:

- **Gift buyers** purchasing for someone else, usually for an occasion. They need confidence the gift will land well, that delivery will arrive on time, and that presentation justifies the price. Decision risk is social — a wrong choice is embarrassing and hard to return.
- **Self-purchase buyers** treating themselves. They care about craft, material, and whether the object is distinctive rather than mass-market.

Secondary audience: the business operator, who manages products, categories, stock, and order fulfilment from the `/admin` dashboard on a desktop or tablet.

## Product Purpose

Chinni Treasure is an artisan-crafted luxury goods storefront selling leather accessories, silk scarves, and premium gifts across India. It exists to let a small craft business present handmade work at a premium tier and sell it nationwide without a physical retail presence.

Success means a customer can browse the full catalogue, understand what each piece is and where it came from, pay securely, and know exactly where their order is — without needing to contact the business to ask.

## Positioning

**Accessible artisan luxury.** Handmade craft at a price point that works as a gift, not an investment — under ₹5,000, with free shipping over ₹599.

The distinguishing claim is genuine handcraft and the "Little Love" care framing, delivered with the polish of a luxury boutique rather than a marketplace listing. The competitive hazard is a generic handcrafted-goods marketplace; the store's job is to make each piece feel individually made and the whole experience feel curated.

Design must therefore carry luxury through **presentation, typography, and restraint** — because price cannot carry it.

## Operating Context

- Real business operating at `chinnitreasure.in`, reachable by phone, WhatsApp, and email from the footer.
- Fulfilment is manual and in-house: an operator moves each order through pending → approved → packaging → shipped → delivered, prints a packing label at pack time, and records a courier tracking ID.
- Payment is Razorpay Standard Checkout, with a manual UPI/bank-transfer fallback for customers who cannot use it. Manual transfers are reconciled by staff afterwards.
- A complimentary surprise gift can be enabled for the whole storefront via an environment flag; when on, a free gift item is auto-added to the cart.
- Gift boxes can be attached to eligible products both on the product page and at checkout.
- Indian operational rules are load-bearing, not decoration: phone, PIN code, and state validation; Tamil Nadu shipping priced differently from the rest of India.
- Customers can track an order later with order number + phone. They never create an account.

## Capabilities and Constraints

**Customer-facing:** catalogue browsing with search/filter/sort, category pages, product detail with gallery and zoom, guest cart persisted across visits, multi-step checkout, payment, confirmation with PDF invoice, order tracking.

**Operator-facing:** dashboard statistics and charts, product and category CRUD, stock management, order status transitions with internal notes, printable packing labels, spreadsheet export.

**Confirmed technical constraints that bound design work:**

- Styling is **modular raw CSS** under `app/styles/`, orchestrated by `@import` from `app/globals.css`. No Tailwind, no CSS framework. Feature CSS must not be added to `globals.css`.
- Design tokens live in `app/styles/variables.css` and must be preserved.
- Payments are Razorpay; no card data touches the system.
- Order pricing includes gift-box prices, and the server verifies the charged amount matches the stored total before persisting an order.
- The hero has a 3D gold-particle layer (React Three Fiber) with a full `prefers-reduced-motion` fallback.
- Lighthouse performance budgets are enforced in CI via `npm run lighthouse`.
- Multi-domain support exists: products carry `visibleHostnames`, so the same build can serve different catalogues per domain.

**Explicitly undecided:** whether the surprise gift is permanently on; whether gift boxes are free or priced; long-term category expansion.

## Brand Commitments

- **Name:** Chinni Treasure. **Tagline:** "Little Love" — set with hearts in the admin login and footer, and carried in the site title as "Chinni Treasure — Little Love | Artisan-Crafted Luxury Goods".
- **Voice:** warm, personal, craft-forward. The tagline and the surprise-gift mechanic both signal that the business cares about the person, not just the transaction. Copy must not read as corporate retail.
- **Identity constraint (binding):** the gold-on-dark-and-cream luxury palette and the Cormorant Garamond / Albert Sans / Pinyon Script type system are established and load-bearing across every surface. Refinement preserves this world; it does not replace it.
- Existing brand assets: logo files under `public/images/branding/`, a `Final1.jpg` mark, apple-touch icon, and a web manifest.

## Evidence on Hand

- **Real product photography** exists for the catalogue. This is the only proof asset available.
- **No customer reviews, testimonials, press, or case studies exist yet.** Future work must not fabricate any. Social proof may not be invented, implied, or placeholdered with fake quotes, star ratings, or invented customer names.
- Verified real contact details exist in the footer: phone +91 9499011029, WhatsApp on the same number, email chinnitreasures29@gmail.com.
- Brand copy in the codebase: "Artisan-made • Premium design • Made for the moments you want to remember."

## Product Principles

1. **Presentation carries the luxury, because price cannot.** Under ₹5,000 means the design has to earn perceived value through restraint, typography, imagery, and motion rather than through extravagance.
2. **Proof is photography or nothing.** The only honest proof is the product itself. Never manufacture social proof.
3. **Warmth over polish.** "Little Love" is the product's character. Stripping every trace of warmth to look more premium makes it less of what it is.
4. **Two buyers, one store.** Gift buyers need reassurance and occasion framing; self-purchase buyers need material and craft detail. Both must be served without splitting into two experiences.
5. **Respect the operator's manual reality.** Fulfilment is done by hand by a person. The admin dashboard optimises their real workflow, not an abstract ideal.

## Accessibility & Inclusion

Accessibility-first is a committed product position, not a compliance afterthought — already built into the codebase via skip links, ARIA attributes, focus trapping, and `prefers-reduced-motion` / `prefers-contrast` support.

Durable requirements: visible focus styles preserved, minimum 44×44px mobile tap targets, loading/error/empty/not-found states maintained on every data-fetching route, and one gold token (`--gold-deep`) already exists specifically to hold WCAG AA 4.5:1 text contrast on light backgrounds — it must be used for text rather than the brighter `--gold`.