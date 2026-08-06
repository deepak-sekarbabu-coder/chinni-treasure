# Axiom Observability — Setup Guide

Chinni Treasure uses the **`@axiomhq/nextjs`** SDK to ship structured logs, page-traffic
request logs, Web Vitals, and unhandled request errors to [Axiom](https://axiom.co)
(ingestion-based logging, free tier: ~0.5–1 TB/month with 30-day retention).

The code integration is **complete**. This document covers the account-side setup
that makes logs actually flow, in both local dev and production (Vercel).

---

## 1. What was integrated (code, already done)

| Area | File | What it does |
| --- | --- | --- |
| Shared client | `lib/axiom/axiom.ts` | Axiom client; reads `NEXT_PUBLIC_AXIOM_TOKEN` + `NEXT_PUBLIC_AXIOM_EDGE`. No-ops when unconfigured. `onError` handler means a bad token/dataset/network **warns but never crashes the app**. |
| Server logger | `lib/axiom/server.ts` | `logger` used by routes/proxy/instrumentation. Axiom transport when configured; console fallback in dev; silent in tests. |
| Client logger | `lib/axiom/client.ts` | `useLogger` hook + `WebVitals` component for the browser. |
| Error capture | `instrumentation.ts` | `onRequestError` → sends unhandled request errors to Axiom (Next 15+ hook). |
| Traffic logs | `proxy.ts` | Logs every matched page request (method, path, ip, region, user agent). Existing admin JWT auth is **unchanged**. API routes and static assets (images/icons/fonts) are excluded from the matcher. |
| Web Vitals | `app/layout.tsx` | `<WebVitals />` mounted in the root layout. |
| Route events | `app/api/verify-payment/route.ts` · `app/api/auth/login/route.ts` · `app/api/orders/[id]/status/route.ts` | Targeted structured logs: payment verified/failed, admin login rejected/succeeded, order status transitions. **No passwords or payment secrets are ever logged.** |
| Env template | `.env.example` | Documents `NEXT_PUBLIC_AXIOM_TOKEN`, `NEXT_PUBLIC_AXIOM_DATASET`, `NEXT_PUBLIC_AXIOM_EDGE`. |
| Tests | `src/__tests__/setup.ts` | `AsyncLocalStorage` polyfill + logger mock so the 183 tests across 32 files stay deterministic. |

> Note: `transformMiddlewareRequest` (used in `proxy.ts`) only sends `ip`, `region`,
> `method`, `host`, `path`, `scheme`, `referer`, `userAgent` — **no cookies, no
> headers, no query strings**.

---

## 2. One-time Axiom account setup

1. Create an account at <https://axiom.co> (free tier is fine).
2. Create the dataset **`chinni-treasure`**:
   Axiom UI → **Data** → **New dataset** → name it `chinni-treasure`.
   > The dataset was already auto-created during verification, so it may already exist.
3. **Important — create an *ingest-only* token** (do *not* reuse a full personal token):
   Axiom UI → **Settings → API tokens** → create a token with permission to
   **ingest into the `chinni-treasure` dataset only**.
   > Why: this token is exposed to browsers (`NEXT_PUBLIC_`). A full personal
   > token would give anyone who reads your site's JS access to your account API.
4. Find your **edge deployment domain**:
   Axiom UI → **Settings → Data**, or:
   ```bash
   curl -H "Authorization: Bearer <token>" https://api.axiom.co/v1/datasets
   ```
   Copy the host of the `edgeDeploymentUrl` field (for this account it is
   `eu-central-1.aws.edge.axiom.co`). Ingest **must** go to this domain —
   the global `api.axiom.co` endpoint rejects it with
   `must use the "... " edge deployment domain, not api.axiom.co`.

---

## 3. Local development

Add these to `.env.local` (already present in this repo; the token currently in
the file is a full personal token — replace it with the ingest-only token):

```bash
NEXT_PUBLIC_AXIOM_TOKEN=your-ingest-only-token
NEXT_PUBLIC_AXIOM_DATASET=chinni-treasure
NEXT_PUBLIC_AXIOM_EDGE=eu-central-1.aws.edge.axiom.co   # your account's edge domain
```

Restart the dev server after changing env vars:

```bash
npm run dev
```

**Verify locally:** load a few pages, then check the terminal. You should see
request lines (`GET / 200 ... proxy.ts: ...`) and **no** `[axiom] log delivery failed`
warnings. If the token/dataset/edge are wrong, the only symptom is that warning —
the app keeps working.

---

## 4. Production (Vercel)

1. Vercel → project → **Settings → Environment Variables** → add for all
   environments (Production, Preview, Development):

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_AXIOM_TOKEN` | your **ingest-only** token |
   | `NEXT_PUBLIC_AXIOM_DATASET` | `chinni-treasure` |
   | `NEXT_PUBLIC_AXIOM_EDGE` | `eu-central-1.aws.edge.axiom.co` |

2. Redeploy.

**Verify:** once deployed, Axiom UI → **Data → chinni-treasure** → run a query like:

```apl
['chinni-treasure'] | limit 20
```

You should see `source: "middleware"` entries (page traffic), `Web Vitals` events,
and route events (`Payment verified`, `Admin login succeeded`, `Order status changed`, …).

---

## 5. What each signal looks like

| Signal | Example message | Source |
| --- | --- | --- |
| Page request | `GET /catalogue` | `proxy.ts` (`source: "middleware"`) |
| Web Vitals | `LCP`, `CLS`, `INP` events | `lib/axiom/client.ts` (browser) |
| Payment | `Payment verified` / `Payment verification failed` | `verify-payment` route |
| Auth | `Admin login rejected` / `Admin login succeeded` | `login` route |
| Orders | `Order status changed` / `Order status update failed` | `orders/[id]/status` route |
| Errors | Unhandled request errors | `instrumentation.ts` |

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `[axiom] log delivery failed: ingest ... must use the "eu-central-1" edge deployment domain` | Missing/wrong `NEXT_PUBLIC_AXIOM_EDGE` | Set it to your account's `edgeDeploymentUrl` host (see §2.4) |
| `... dataset not found` | Dataset doesn't exist | Create `chinni-treasure` in Axiom (ingest auto-creates it too) |
| `... forbidden` | Invalid token | Use the ingest-only token value |
| Nothing arrives, no warnings | Env vars not set → logger is a no-op | Add the three vars and restart/redeploy |
| Logs stop after a flash sale | Free-tier ingest volume exceeded | Check Axiom usage; upgrade or trim logged fields |

---

## 7. Optional hardening: keep the token out of the browser

Even with an ingest-only token, `NEXT_PUBLIC_*` ships it to every visitor. If you
prefer zero token exposure, switch the client to the proxy pattern:

- `lib/axiom/client.ts` → `ProxyTransport({ url: "/api/axiom" })`
- Add `app/api/axiom/route.ts` → `POST = createProxyRouteHandler(logger)`

Client logs/Web Vitals then go browser → your server → Axiom, and the browser
never holds the token.
