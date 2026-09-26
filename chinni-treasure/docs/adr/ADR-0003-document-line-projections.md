# ADR-0003: Document-line projections — shipping label and Excel export stay separate from `orderLineViews`

- **Status:** Accepted
- **Date:** 2026-09-26
- **Related:** ADR-0002 (pricing basis); `CONTEXT.md` → *Pricing module — seam*, *Order view module — seam*

## Context

`src/lib/pricing.ts` owns `orderLineViews` — the shared projection that nests
each parent line's gift-box rows under it in render order. Three surfaces
consume it: the admin order-detail modal, the customer confirmation page, and
the PDF invoice. Two other artifacts project order lines on their own:

1. **`ShippingLabel` / `PrintShippingLabelModal`** (`ProductRow`) flattens
   every order item into a packing row: `{ code, description, actualPrice
   (compare-at or unit), sellPrice (unit), qty }`. It drops
   `parentOrderItemId` (gift boxes are listed as their own rows, not nested),
   shows the compare-at price as a struck-through "actual", and — the
   load-bearing difference — the rows are **editable in the modal** before
   printing: codes, prices, quantities can be added, changed, or removed by
   hand at pack time.
2. **`excel-export.ts`** emits the raw seven-sheet database dump
   (`Order Items` sheet carries `parentOrderItemId` verbatim, no `lineTotal`
   column, no nesting). Faithfulness to the stored rows is the point: the
   export feeds re-import (`npm run data:import`) and ad-hoc reconciliation.

An earlier drift in the same family — the order-detail modal, tracking
projection, and PDF each projecting orders independently — produced `₹NaN`
totals and flattened gift boxes on the track surface, and was fixed by the
**Order view seam** (`toOrderView`) + `orderLineViews`
(CONTEXT.md, *Order view module — seam*). The question: do the label and the
Excel export represent "a slower repeat of that drift", or deliberate
separate artifacts?

## Decision

**They are deliberate separate artifacts, and both stay separate.**
`orderLineViews` remains the shared projection for *customer-facing money
rendering*; the packing label and the Excel export are *operator artifacts*
that are **documented as intentionally different**, not conformed.

The rule that makes this a decision rather than drift:

> `orderLineViews` is the one projection for any surface whose job is to show
> a customer (or an admin reviewing an order) what was bought and what it
> cost. Surfaces whose job is *physical packing* or *data export* define
> their own rows — but must say so, here and in the code.

### Why the label does not conform

- **Editability is load-bearing.** The modal's product rows are a form: pack
  staff add a row for a physical freebie, fix a wrong quantity, or retype a
  code from the shelf. `OrderLineView` is a derived read model with no
  write path; adapting it into an editable form would add an
  `editable` variant to the pricing module — a display concern growing write
  semantics inside the money module.
- **Nesting is wrong for packing.** Gift boxes go into the same parcel as
  loose rows; the packer scans each box code separately. A nested
  parent-under-parent render would have to be re-flattened for the physical
  checklist.
- **"Actual/Sell" is a label vocabulary, not an order vocabulary.** The
  label prints compare-at as the struck "actual" price — retailer table
  language, deliberately unlike the invoice.

### Why Excel does not conform

The export is an audit/re-import artifact. `parentOrderItemId` already ships
in the `Order Items` sheet, so the nesting is recoverable by any consumer
that wants it; a derived `lineTotal` column would duplicate what the Pricing
module computes and invite the export and the module to disagree. Raw beats
derived for dumps.

### Guardrail (what would change the decision)

If a surface that *renders order money for a reader* starts hand-rolling its
own line projection — totals, nesting, or per-line math that `orderLineViews`
already owns — that is the ₹NaN drift recurring and it must conform. The
label's own price rendering (`formatMoney`, the actual-vs-sell compare) is
presentation, not money math, and stays put.

## Consequences

- `PrintShippingLabelModal` maps `order.items → ProductRow` through a single
  named helper (`productsFromOrder`) instead of two inline copies — the
  projection has one home even though it stays a separate shape.
- No changes to `excel-export.ts`.
- `orderLineViews` keeps exactly its three current consumers; no `editable`
  variant is added.
- Future operator artifacts (pick lists, customs forms) may follow this ADR;
  future *reading* surfaces may not.
