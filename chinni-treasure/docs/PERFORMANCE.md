# Performance Auditing with Lighthouse

Chinni Treasure ships with a programmatic Lighthouse runner that audits the key
storefront routes, enforces performance budgets, and writes browsable reports.

## Quick start

1. Start the app in one terminal:

   ```bash
   npm run dev            # or: npm run build && npm start
   ```

2. Run the audit (mobile form factor, simulated 4G throttling):

   ```bash
   npm run lighthouse
   ```

3. Open the latest HTML report:

   ```bash
   npm run lighthouse:report
   ```

Desktop auditing:

```bash
npm run lighthouse:desktop
```

## CLI flags

All flags pass through to `scripts/run-lighthouse.mjs`:

| Flag | Purpose | Default |
| --- | --- | --- |
| `--base-url <url>` | Base URL of the running app | `http://localhost:3000` |
| `--routes <list>` | Comma-separated route names, paths, or 1-based indices | all routes |
| `--desktop` | Desktop form factor instead of mobile | mobile |
| `--iterations <n>` | Runs per route (1–5); budgets use the median | `1` |
| `--chrome-path <path>` | Explicit Chrome/Edge/Chromium executable | auto-detect (Edge fallback on Windows) |
| `--report-dir <path>` | Report output directory | `lighthouse/reports` |
| `--no-fail` | Exit `0` even when budgets are exceeded | budgets enforced |
| `--open` | Open the latest report when finished | off |

Example:

```bash
npm run lighthouse -- --routes Home,Catalogue --iterations 3
```

## What gets audited

Routes come from `lighthouse/routes.json`. The `"First Product"` entry is
resolved at runtime by scraping the first product link from `/catalogue`, so it
works without hardcoding a product ID. Adjust the list to match your seeded
categories/slugs (default: `clutches`).

Each run measures:

- **Scores** — Performance, Accessibility, Best Practices, SEO (0–100)
- **Metrics** — FCP, LCP, TBT, CLS, SI (Web Vitals plus load experience)

Reports land in `lighthouse/reports/<run-id>/`:

- `NN-<route>.html` — full Lighthouse report (drill-down with opportunities)
- `NN-<route>-<n>.json` — raw Lighthouse result per run
- `summary.json` — machine-readable scores, metrics, and violations

`lighthouse/reports/` is gitignored; treat reports as generated artifacts.

## Budgets

Budgets live in `lighthouse/budgets.json` (values are the maximum acceptable
metric, aligned with Core Web Vitals "good" thresholds):

| Metric | Mobile | Desktop |
| --- | --- | --- |
| First Contentful Paint (FCP) | 1.8s | 1.2s |
| Largest Contentful Paint (LCP) | 2.5s | 2.0s |
| Total Blocking Time (TBT) | 200ms | 150ms |
| Cumulative Layout Shift (CLS) | 0.10 | 0.10 |
| Speed Index (SI) | 3.4s | 2.5s |

The runner exits non-zero when any route exceeds its budget — useful as a
pre-deploy gate. Use `--no-fail` for exploratory runs.

## Best-practice recommendations for this stack

The runner will surface concrete opportunities in each HTML report; the
following are the patterns most relevant to this Next.js 16 / React 19 codebase:

- **Image loading** — product galleries are image-heavy. Keep `next/image` with
  explicit `width`/`height` (or aspect-ratio CSS) so CLS stays at 0, enable
  `loading="lazy"` for below-the-fold gallery thumbnails, and serve
  appropriately sized `srcset` variants.
- **Fonts** — load only the weights actually used, and keep `font-display`
  swap so text renders instead of blocking on webfonts.
- **Server rendering cost** — the catalogue and category pages are
  `force-dynamic` because of the `visibleHostnames` host filter; product
  detail uses `unstable_cache` with 60s revalidation. If budget pressure shows
  up in TBT/LCP, the biggest lever is reducing per-request Prisma/query work
  and keeping those cached surfaces cached.
- **Third-party scripts** — Razorpay checkout and analytics load on specific
  routes. Make sure payment scripts only load on checkout/confirmation pages,
  not the whole site, and keep `@vercel/analytics`/`@vercel/speed-insights`
  deferred.
- **JavaScript size** — keep heavy client bundles (React Query, admin
  components) out of public pages. Verify the route-level JS payloads in the
  Lighthouse "Reduce JavaScript execution time" audit.
- **Accessibility** — the a11y score enforces focus visibility (44×44px tap
  targets, visible focus rings) and contrast, both of which this project
  already treats as guardrails.

## Baseline run — 2026-08-15 (production build, post-a11y-fix re-run)

Full production audit of all six default routes (mobile + desktop), using
`npm run build && npm start` and Lighthouse 13.4.1 (Edge headless).
Re-run **2026-08-15** after the accessibility fixes, against the same
production build that contains them. Reports:
`lighthouse/reports/2026-08-15T08-15-16/` (mobile) and
`lighthouse/reports/2026-08-15T08-16-41/` (desktop).

### Scores and metrics

| Route | Form | Perf | A11y | BestP | SEO | LCP | TBT | CLS | Transfer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | mobile | 87 | 100 | 96 | 100 | 3.9s | 89ms | 0.000 | 17.4MB |
| Home | desktop | 99 | 100 | 96 | 100 | 0.9s | 5ms | 0.001 | 21.9MB |
| Catalogue | mobile | 46 | 100 | 96 | 100 | 27.9s | 2578ms | 0.000 | 13.0MB |
| Catalogue | desktop | 65 | 100 | 96 | 100 | 1.3s | 2252ms | 0.001 | 22.9MB |
| Category (clutches) | mobile | 45 | 100 | 96 | 100 | 33.2s | 3243ms | 0.000 | 17.5MB |
| Category (clutches) | desktop | 43 | 100 | 96 | 100 | 11.3s | 3652ms | 0.001 | 17.5MB |
| First Product | mobile | 45 | 100 | 96 | 100 | 53.6s | 4891ms | 0.001 | 33.0MB |
| First Product | desktop | 38 | 100 | 96 | 100 | 31.2s | 9005ms | 0.001 | 36.7MB |
| Track Order | mobile | 90 | 100 | 96 | 100 | 3.6s | 78ms | 0.000 | 538KB |
| Track Order | desktop | 99 | 100 | 96 | 100 | 0.9s | 19ms | 0.001 | 545KB |
| Admin Login | mobile | 88 | 100 | 96 | 69 | 3.8s | 70ms | 0.000 | 513KB |
| Admin Login | desktop | 99 | 100 | 96 | 69 | 0.6s | 64ms | 0.006 | 545KB |

### Root cause: images are downloaded at full size

Product images on `i.imgur.gg` are **4.3–6.5 MB camera-original JPEGs**. The
site's custom image loader (`src/lib/image-loader.ts`, wired in
`next.config.ts` via `images.loader: "custom"`) skips Next's server-side
optimizer and appends `?w=256&q=75`-style params that the origin ignores — so
the browser downloads the **full original for every image**, thumbnails
included. On the product page that is 8 requests ≈ **36 MB**.

This single issue explains the entire performance gap: at Lighthouse mobile
throttling (1.6 Mbps) one image takes ~30 s to download (LCP 26–33 s), and
decoding multi-MB JPEGs on the main thread drives TBT up to 7.3 s.

The custom loader exists to avoid the built-in optimizer's ~30 s fetch timeout
(which caused 500s when i.imgur.gg was slow). The right fix is at the source:
resize/compress images at upload time (target ≤ 200 KB at display width, e.g.
~1024 px for heroes, ~400 px for cards) or move to a CDN/optimizer that
respects the `w`/`q` params (imgix, Cloudinary, Vercel's optimizer).

Run-to-run variance is large on the image-heavy pages (First Product mobile
LCP: 26.4s vs 53.6s across runs of identical code) because a single ~6.5 MB
image download at 1.6 Mbps simulated throttling is a near-threshold race —
expect those pages to keep bouncing until the source-size fix lands.

### Secondary findings

- **Vercel insights 404** — `/_vercel/insights/script.js` and
  `/_vercel/speed-insights/script.js` return 404 outside Vercel (local and
  self-hosted Docker), causing console errors (`errors-in-console` fails
  everywhere, BestP stuck at 96). On Vercel these load fine.
- **Admin Login SEO 69** — “blocked from indexing” is intentional
  (`app/admin/layout.tsx` sets `robots: noindex` for the whole admin section).
- **Accessibility** — Track Order and Admin Login (95): low-contrast text
  (`.login-subtitle`, `.brand-tagline`, `.track-info`, and the login labels,
  which rendered charcoal due to a CSS specificity bug) and non-sequential
  heading order (footer `<h3>` with no preceding `<h2>`); Home: category-card
  links had mismatched `aria-label` vs. visible text.

  **Fixed 2026-08-15, verified by the re-run** — all six routes now score
  **A11y 100** (Track Order and Admin Login up from 95; the other four stayed
  at 100): `--text-muted` → `--text-light` on the dark surfaces (≥ 6.6:1), the
  `.login-label` override bumped to `.form-group .login-label` so cream
  actually applies, persistent `.sr-only` `<h2>` section headings, and
  label-in-name fixes on the category cards (`aria-label` now contains the
  visible text, and the product-card link name comes from its content).
- **bf-cache** — catalogue/category/product pages fail back/forward cache
  restoration (worth investigating once images are fixed).
- **Unused JS/CSS** — ~74 KiB of unused JS + ~14 KiB CSS per page (minor).

## CI gating (optional)

To gate deployments on budgets, run the production server in CI, audit the
public routes, and fail on violations:

```bash
npm run build && npm start &
npm run lighthouse -- --base-url http://localhost:3000 --routes Home,Catalogue
```

For per-PR trend dashboards, Lighthouse CI (`@lhci/cli`) can be layered on top
of the same budgets; the local runner above is intentionally dependency-light
so it works without a CI service.
