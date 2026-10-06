# Chinni Treasure — Domain Glossary

The vocabulary this business uses, and what each word means. Two companion files:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the module seams that implement these
  concepts, and which architecture questions are already settled.
- [`docs/adr/`](docs/adr) — the decisions that are hard to reverse.

Read this before naming something new. If a word here does not fit what you mean,
say so rather than reusing it for a second thing.

## Selling

**Product**:
The sellable unit. Has a price, an optional compare-at price shown struck through,
a stock quantity, an optional badge, one Category, and images of which exactly one
is primary.
_Avoid_: Item, SKU (a SKU is an identifier a Product may carry, not the Product itself)

**Category**:
A grouping of Products, identified by its slug and ordered for display. A Category
is deletable only while no live Product sits in it.
_Avoid_: Collection, Department, Section

**Gift Box**:
A Product in the Gift Box category that a customer attaches to an eligible parent
Product as paid, giftable extras. It carries its own price and its own stock, and
can never itself be a bundling parent.
_Avoid_: Packaging, Gift wrap, Wrapper

**Surprise gift**:
A complimentary item the storefront adds to every cart while the feature is on. It
is never revenue-bearing and never reaches an Order — it exists to make the
delivery feel personal.
_Avoid_: Free gift, Promo, Gift Box (a Gift Box is chosen and paid for)

**Billable line**:
Any line that carries money: a parent Product plus its Gift Boxes, and never the
Surprise gift. The rule that decides this is one rule, not a per-surface decision.
_Avoid_: Item, Product line (a cart line can be non-billable)

**Stock**:
How many units of a Product are on hand. Deducted when an Order is placed,
restored when an Order is rejected.
_Avoid_: Inventory (the concept), Availability (a derived yes/no)

**Hostname**:
The domain a visitor arrived on. Products declare which Hostnames they are visible
on, so one build can serve different catalogues per domain.
_Avoid_: Host, Domain (a domain is the broader concept)

## Buying

**Cart**:
What a visitor has chosen but not bought. Guest-only — no account, no server-side
record of who owns it — and it survives across visits.
_Avoid_: Basket, Bag, Order (an Order is placed and priced; a Cart is not)

**Checkout**:
The multi-step page where a visitor supplies delivery details and pays. It shows a
preview of the totals; the server computes the authoritative ones.
_Avoid_: Payment page, Order form, Cart

**Pricing**:
The money rules of the business: what counts toward the subtotal, when shipping is
free, and what shipping costs. One computation answers this for both the preview
and the final charge.
_Avoid_: Totals, Costs, Billing (there are no invoices)

**Order**:
A placed, paid-for purchase. Owns the customer's details and address, a status, the
stored money, its line items, and its full status history. Orders are never
re-priced from today's catalogue.
_Avoid_: Purchase, Transaction, Payment, Cart

**Order item**:
One line of an Order — the Product's name and price snapshotted at the moment of
purchase, so later catalogue edits cannot rewrite history. A Gift Box line belongs
to its parent line.
_Avoid_: Product, Line item

**Payment**:
The money actually taken for an Order, taken through the gateway or recorded as a
manual bank transfer for customers who cannot use it. No card data ever reaches
this system.
_Avoid_: Charge, Transaction (a transaction is the reference, not the payment)

**Fulfilment**:
The operator's work on a placed Order, moving it along `pending → approved →
packaging → shipped → delivered`, or `rejected` from any step before the end. Steps
cannot be skipped and the end states are final.
_Avoid_: Shipping (one step of fulfilment), Order status (the field, not the work),
Delivery (one step)

**Tracking**:
How a customer checks an Order later, with the order id or their phone number.
Requires both facts, and reveals nothing about an Order that is not theirs.
_Avoid_: Order status, Tracking ID (the courier's reference on a shipped Order)

**Packing label**:
The operator's printed artifact for a parcel at pack time — courier, AWB, payment
and recipient fields, plus flat rows an operator may edit. It is a working document,
not a customer-facing one.
_Avoid_: Invoice, Consignment note, Order summary

## Operating

**Admin**:
The operator's private surface for the catalogue and for Fulfilment, behind a
session. An operator never places an Order.
_Avoid_: Dashboard (that is the page, not the role), Back office

**Operator**:
The person who runs the business: manages Products, Categories and stock, and moves
Orders through Fulfilment by hand.
_Avoid_: Admin (that is the surface), Staff, Merchant