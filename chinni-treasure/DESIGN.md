---
name: Chinni Treasure
description: Accessible artisan luxury — gold on lacquer black, serif craft, tactile warmth.
colors:
  gold: "#d4af37"
  gold-light: "#f0d68a"
  gold-dark: "#b8960f"
  gold-deep: "#8a6d0f"
  black: "#0d0d0d"
  near-black: "#1a1a1a"
  cream: "#f5f0e8"
  cream-light: "#faf7f2"
  white: "#ffffff"
  text-muted: "#6d6d6d"
  text-light: "#a0a0a0"
  success: "#2ecc71"
  error: "#e74c3c"
  warning: "#f39c12"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.5rem, 5vw, 4.2rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.8rem, 3vw, 2.8rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0.01em"
  title:
    fontFamily: "Cormorant Garamond, Georgia, 'Times New Roman', serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.25
  body:
    fontFamily: "Albert Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Albert Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    letterSpacing: "2px"
  script:
    fontFamily: "Pinyon Script, 'Brush Script MT', cursive"
    fontSize: "1.3rem"
    fontWeight: 400
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
  lg: "6px"
  xl: "8px"
  card: "8px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "20px"
  xl: "24px"
  section: "48px"
  block: "64px"
  container: "1200px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.black}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "16px 36px"
  button-primary-hover:
    backgroundColor: "{colors.gold-dark}"
    textColor: "{colors.black}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.gold}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "16px 36px"
  button-secondary-hover:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.black}"
  button-add:
    backgroundColor: "{colors.black}"
    textColor: "{colors.gold}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-cart:
    backgroundColor: "transparent"
    textColor: "{colors.text-light}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  input-text:
    backgroundColor: "{colors.cream-light}"
    textColor: "{colors.near-black}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    padding: "14px 16px"
  product-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.near-black}"
    typography: "{typography.title}"
    rounded: "{rounded.card}"
    padding: "20px"
  navbar:
    backgroundColor: "{colors.black}"
    textColor: "{colors.cream}"
    typography: "{typography.label}"
    padding: "16px 32px"
  eyebrow:
    textColor: "{colors.gold}"
    typography: "{typography.label}"
---

# Design System: Chinni Treasure

## Overview

**Creative North Star: "The Gilded Atelier"**

Chinni Treasure looks like a jeweller's workbench after closing time. The surface is dark and quiet — lacquer black, warm cream, a single precious metal — and the only thing that moves is light passing over gold. Nothing shouts. Gold appears in small, deliberate amounts: a 48px rule beneath a heading, a hairline under the navbar, a border that warms when you hover. Its scarcity is the point.

Restraint carries the luxury because the price point cannot. At under ₹5,000 this is not a watch-company vault; it is a craft studio that has decided its work deserves to be presented properly. So craft is shown rather than claimed — large photography, generous whitespace, and a serif with real drawn contrast doing the talking. Body copy stays quiet and small; the eye should land on the object, not the sentence about the object.

Warmth is engineered into the mechanics. Everything you can touch lifts two pixels and settles back when pressed. Gold controls catch a diagonal shimmer. This is warmth through the hands rather than through exclamation marks, which is what keeps "Little Love" from tipping into sentimentality.

**Key Characteristics:**
- Gold is a punctuation mark, never a paragraph
- Dark surfaces, cream content — the room is dim, the work is lit
- Everything tactile lifts and presses
- Uppercase micro-labels with wide tracking open every section
- Photography is the largest element on any product surface
- Motion is slow on entry and instant on response

## Colors

The palette is a dim room and one precious metal: four golds that shift in temperature and duty, backed by a black-to-cream neutral spine, with three functional status colours held well clear of the brand.

### Primary
- **Gilded Gold** (`#d4af37`): The brand colour and the default accent. Used on dark backgrounds for text, borders, rules, and eyebrows; on light backgrounds only for borders and fills, never for text.
- **Pale Gilt** (`#f0d68a`): The highlight end of the metal. Hover states, gradient stops, and the brightest point of the shimmer sweep.
- **Antique Gold** (`#b8960f`): The gradient partner and structural border. Also the darker end of primary button fills.
- **Deep Patina Gold** (`#8a6d0f`): **The only gold approved for text on cream or white.** It exists specifically to hold WCAG AA 4.5:1 against light grounds. Also used for small category labels.

### Neutral
- **Lacquer Black** (`#0d0d0d`): The page's base ground, and the navbar/footer/hero surface. Also the "Add to Cart" fill at rest.
- **Soft Black** (`#1a1a1a`): Body text on light grounds, and the near-black button surface.
- **Atelier Cream** (`#f5f0e8`): The content ground — dark chrome framing light content.
- **Raw Linen** (`#faf7f2`): Form field fill. Sits just off-white so inputs read as recessed paper rather than holes.
- **Gallery White** (`#ffffff`): Cards and the focused state of inputs, so the focus shift reads as the field coming forward.
- **Ash Grey** (`#6d6d6d`): Secondary text and form labels. Chosen to hold contrast on cream.
- **Dust Grey** (`#a0a0a0`): Tertiary text, placeholders, and at-rest icon colour. Never for anything a customer must read to act.

### Tertiary
- **Verdant** (`#2ecc71`): Success and in-stock confirmation.
- **Cinnabar** (`#e74c3c`): Errors, destructive actions, and validation failure.
- **Saffron** (`#f39c12`): Low-stock and warning states.

### Named Rules

**The One Voice Rule.** Gold appears on roughly a tenth of any given screen. Its rarity is the entire point — a page where gold is everywhere reads cheap, and cheap contradicts everything the brand claims.

**The Dark Gold Rule.** Gold text on cream backgrounds uses Deep Patina Gold, never Gilded Gold. The brighter gold fails WCAG AA 4.5:1 against a light ground, and luxury that nobody can read is not luxury.

## Typography

**Display Font:** Cormorant Garamond (with Georgia, Times New Roman)
**Body Font:** Albert Sans (with system sans fallbacks)
**Signature Font:** Pinyon Script — decorative only

**Character:** A high-contrast didone-adjacent serif against a quiet grotesque sans. The serif is set large, light, and tightly — it carries craft and occasion. The sans is small, uppercase, and widely tracked for anything functional, so labels behave like engraved tags rather than headings. The script is a signature on the door and nowhere else.

### Hierarchy
- **Display** (400, `clamp(2.5rem, 5vw, 4.2rem)`, 1.1): Hero headlines only. Never below the fold.
- **Headline** (400, `clamp(1.8rem, 3vw, 2.8rem)`, 1.15): Section headings, always paired with the 48px gold rule beneath.
- **Title** (500, `1.25rem`, 1.25): Product names, order-summary values, card titles.
- **Body** (400, `0.9rem`, 1.6): All running copy, forms, and tables. Keep line length under 75ch.
- **Label** (600, `0.7rem`, `2px` tracking, uppercase): Buttons, eyebrows, badges, form labels, table headers.

### Named Rules

**The Three-Weight Rule.** Typography runs at three weights only — light serif for display, regular body, semibold labels. Nothing heavier, ever. Weight is not how this system creates emphasis; space and gold are.

**The Script Restriction Rule.** Pinyon Script is a signature, not a typeface. It appears only in the footer wordmark and the "Little Love" tagline. It never touches a heading, body copy, form label, or price.

## Layout

Content sits in a `1200px` centred container with responsive padding; the primary reading column caps at `480px`. Sections are generous — `48px` of internal block spacing and `64px` between major sections — because whitespace is doing the luxury work that price cannot.

The page ground is a warm cream gradient (`#f7f3ec` → `#f3ede3`) with a dark radial vignette at the top, so content appears to sit in a lit alcove rather than on a flat sheet. Chrome (navbar, footer, hero) is lacquer black. The contrast between the dim frame and the lit content is the structural signature.

Breakpoints are mobile-first at `374 / 480 / 600 / 768 / 850 / 1024 / 1200 / 1440`. The catalogue grid reflows across these, and the navigation collapses to a drawer below `768px`. Touch targets hold a 44×44px minimum — the cart button and quantity controls are sized to that floor, not to their visual padding.

`font-size-adjust` is set deliberately on display type (`0.48`) and body (`0.5`) to stop the serif from reflowing unpredictably across platforms — a real concern given the type carries the brand.

## Elevation & Depth

This system uses **ambient, gold-warm shadow** as its primary depth cue, layered over subtle 1px inset highlights. Shadows are atmospheric rather than structural: their job is to catch the light in the room, not to explain stacking order. That is what lets the gold shimmer on hover feel like the same material as the card's resting shadow.

### Shadow Vocabulary
- **Shadow Small** (`0 2px 8px rgba(0,0,0,0.06)`): Barely-there lift for secondary surfaces.
- **Shadow Medium** (`0 4px 24px rgba(0,0,0,0.1)`): Default card and panel rest state.
- **Shadow Large** (`0 8px 48px rgba(0,0,0,0.15)`): Modals and overlays lifted clear of the page.
- **Gold Glow** (`0 4px 24px rgba(212,175,55,0.15)`): The signature. Hover glow beneath gold-accented controls.
- **Inset Highlight** (`0 1px 0 rgba(255,255,255,0.14) inset`): A 1px light edge on top of dark buttons and cards, giving them a metal lip. This is what separates "dark button" from "black rectangle".

### Named Rules

**The Lift-and-Settle Rule.** Every interactive element lifts `translateY(-2px)` on hover and presses to `translateY(1px) scale(0.985)` on active. If something can be touched, it does this. Static interactivity is the fastest way to make a craft store feel like a template.

**The Ambient Shadow Rule.** Shadows are gold-warm, never neutral-grey. When a shadow is needed, prefer `shadow-gold` on gold-accented controls over a neutral equivalent.

## Shapes

Corners stay in a narrow, deliberately unfashionable band — **2px to 8px**. Nothing is fully square and nothing is pill-shaped, with two exceptions: true pills (`999px`) for badges and quantity pills, and `12px` reserved for large soft containers like the shipping-nudge sheet.

The dominant radius is `4px` on interactive controls, `2px` on form fields (recessed, papery), and `8px` on cards and images (the one place softness is allowed, because photography benefits from it).

Borders are 1px and almost always gold-tinted at partial opacity (`rgba(212,175,55,0.25)`) rather than a flat colour. This makes edges feel like a warm outline catching light instead of a drawn line.

### Named Rules

**The Near-Sharp Corner Rule.** Corners stay between 2px and 8px. Soft-round reads friendly-consumer; fully square reads brutalist. This is neither, and the narrow band is what keeps it recognisably Chinni Treasure.

## Components

### Buttons
Tactile and warm — every button lifts, presses, and (if gold) shimmers.

- **Shape:** Gently rounded, near-sharp (4px radius).
- **Primary:** Gold gradient (`#d4af37` → `#b8960f` at 135°) with a black uppercase label at `0.75rem`/`2px` tracking, padded `16px 36px`. Carries a 1px inset highlight and a gold-tinted drop shadow.
- **Hover / Focus:** Background gradient position animates left-to-right, the button lifts 2px, and a diagonal shimmer sweeps across in 0.75s. Focus is a 3px gold-tinted ring (`rgba(212,175,55,0.25)`), never removed.
- **Secondary:** Transparent with a 2px gold border and gold label; fills solid gold on hover with the label flipping to black.
- **Dark:** Near-black fill with a gold label and a 25%-opacity gold border; inverts to gold-on-black on hover. Used on dark chrome.
- **Danger / Success:** Outline in the status colour, filling solid on hover with the label flipping to white.
- **Add to Cart:** The inverted variant on product cards — black fill, gold label — which warms into a full gold gradient on hover. This inversion is what distinguishes the product-level action from the page-level ones.
- **Pressed:** `scale(0.97)` with `translateY(1px)` throughout. Disabled buttons drop to `0.45` opacity and desaturate.

### Chips (if used)
- **Style:** Pill (`999px`), gold text on a low-opacity gold wash, or a muted grey fill for neutral metadata.
- **State:** Product badges (Bestseller, New, Premium, Limited, Luxury) and low-stock indicators. Low stock uses Saffron, never error-red — low stock is not a failure.

### Cards / Containers
- **Corner Style:** Softly rounded (8px).
- **Background:** Gallery white against the cream page ground, with a 1px warm border (`#e8e2d8`).
- **Shadow Strategy:** Shadow Medium at rest, deepening and lifting on hover — see Elevation.
- **Internal Padding:** `20px`, holding a 4:5 photography frame above the text block.

### Inputs / Fields
- **Style:** Recessed and papery — Raw Linen fill, 1px `#e0d8cc` border, `2px` radius, `14px 16px` padding. The near-zero radius is deliberate: fields should read as paper, not as buttons.
- **Focus:** Border shifts to Gilded Gold, the fill lifts to pure white so the field appears to come forward, plus a soft 3px gold ring and a single 1.5s pulse. One pulse, never looping.
- **Error / Disabled:** Cinnabar border with a matching soft ring and a single 0.4s shake. The shake is a one-time acknowledgement, not a loop.

### Navigation
- **Style:** Lacquer black bar with a gold-tinted hairline underneath (25% opacity). Brand wordmark in Cormorant Garamond gold at `1.4rem`; links in Albert Sans, uppercase, `2px` tracking, cream.
- **Default / Hover / Active:** Links stay cream at rest and warm to gold on hover, with a 1px gold underline growing from the centre outward — the underline animates from the middle, so it feels drawn rather than switched on.
- **Cart:** Always visible as a bordered trigger, never collapsed into an icon on mobile where it matters.
- **Mobile:** Collapses below 768px; tap targets hold the 44px floor.

### Section Header
The signature editorial block, repeated across every section: a gold uppercase eyebrow at `3px` tracking, the serif headline, and a centred 48×2px gold rule beneath it with `1px` radius. It is the single most recognisable pattern in the system and should open most major sections.

### Product Card
Gallery-first. A 4:5 photography frame leads; beneath it sit the category eyebrow in Deep Patina Gold, the serif product title, the price in Cormorant with the compare-at price struck through in Dust Grey, then the inverted Add to Cart button. Discount is communicated by the strike-through alone — no red, no "SALE" badge competing with the product badge.

## Do's and Don'ts

Concrete guardrails grounded in the incumbent implementation.

### Do:
- **Do** use Deep Patina Gold for any text on cream or white.
- **Do** keep photography at 4:5 and let it be the largest thing in the card.
- **Do** pair every section heading with the 48px gold rule.
- **Do** lift on hover and press on active for anything clickable.
- **Do** let the serif carry headlines and the sans carry everything functional.
- **Do** preserve visible focus rings at 3px gold-tinted spread.
- **Do** put new styles in their own module under `app/styles/` and wire it through `@import` in `app/globals.css`.

### Don't:
- **Don't** use Gilded Gold for body text on light backgrounds — it fails contrast.
- **Don't** add a second accent hue; the single-gold discipline *is* the system.
- **Don't** set copy in Pinyon Script outside the footer wordmark.
- **Don't** introduce heavy font weights (700+) to create emphasis.
- **Don't** use fully square (0px) or pill (999px) corners on cards and buttons.
- **Don't** signal low stock with error-red — it is a notice, not a failure.
- **Don't** add feature CSS to `app/globals.css`; it is an import entry point only.
- **Don't** fabricate social proof. Real product photography is the only evidence asset this product has, so testimonials, star ratings, and customer names must never be invented or placeholdered.