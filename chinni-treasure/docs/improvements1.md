**Prioritized Roadmap**

> **Status:** Roadmap from an earlier UX review. Some items have since shipped
> (consistent skeleton loading states, sticky action-bar spacing fixes, category
> sort/pagination). Remaining items below are still open — verify against the
> live UI before treating them as gaps.
> **Last reviewed:** August 5, 2026.

**Phase 1: Highest Impact, Lowest Effort**
1. Tighten the homepage CTA flow
   - Add stronger primary actions like `Shop New Arrivals` and `Browse Categories`
   - Add a trust strip near the hero: secure payment, shipping, support, and returns policy
   - Make category entry points more visible

2. Reduce checkout friction
   - Show `Step 1 of 3` style progress more explicitly
   - Add helper text for phone, PIN, and payment method fields
   - Auto-focus the first invalid field after validation
   - Improve mobile spacing around form fields and sticky action bars

3. Improve empty and success states
   - Empty cart: give a stronger path back to shopping
   - Order confirmation: add `Copy Order ID`, `Track Order`, and `Continue Shopping`
   - Tracking page: make the search instructions more obvious

**Phase 2: Conversion and Browsing Improvements**
4. Upgrade catalogue and category discovery
   - Add search by product name and SKU
   - Add filters for category, price, stock, and badge
   - Add sorting by newest, price, and popularity
   - Make filter clear/reset actions obvious

5. Strengthen product detail pages
   - Add short benefit-focused summary above the long description
   - Show delivery/shipping expectation near price
   - Make low-stock messaging more actionable
   - Improve the visibility of the add-to-cart area on mobile

6. Improve cart preview and cart confidence
   - Add `View Cart` and `Checkout` buttons in the cart dropdown
   - Add a short note about shipping and final totals
   - Make quantity edits easier without opening a separate screen

**Phase 3: Trust and Clarity**
7. Make payment and policy messaging easier to understand
   - Rewrite policy copy in simpler language
   - Explain bank transfer flow more clearly
   - Add a small FAQ block near checkout for payment, shipping, and order updates

8. Improve order tracking clarity
   - Show a short explanation of each order status
   - Add example hints for order ID and phone search
   - Provide a clear “no results” recovery path

**Phase 4: Polish and Scale**
9. Standardize loading states
   - Add consistent skeletons for product grids, category pages, and search results
   - Replace blank waits with clearer loading feedback

10. Polish mobile ergonomics
   - Verify sticky buttons never cover content
   - Keep tap targets large enough
   - Ensure image galleries, filters, and checkout controls are thumb-friendly

**Recommended order of execution**
1. Homepage CTA + trust strip
2. Checkout friction cleanup
3. Confirmation and tracking improvements
4. Catalogue/category search and filters
5. Product detail clarity
6. Cart preview improvements
7. Policy/payment copy refinement
8. Mobile polish and loading state consistency

If you want, I can turn this into a **30-day implementation plan** or a **page-by-page checklist** with exact UI changes for each route.