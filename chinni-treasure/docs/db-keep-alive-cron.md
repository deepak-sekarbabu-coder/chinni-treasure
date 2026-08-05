# Database Keep-Alive Cron — Setup Guide

Chinni Treasure's database is hosted on **Nhost** (free tier). Nhost's Starter plan
**pauses a project after 1 week of inactivity**, which makes the database unreachable
(Prisma error `P1001` / `DatabaseNotReachable`, and the DB hostname stops resolving —
`NXDOMAIN`) until you manually unpause it in the Nhost dashboard.

This document covers the **Vercel Cron Job** that pings the database on a schedule so
it never idles long enough to be paused.

The code integration is **complete** (changes are in the working tree, not yet
committed — commit and push them before deploying). This guide covers activation,
plan limitations, verification, and troubleshooting.

---

## 1. What was added (code, already done)

| Area | File | What it does |
| --- | --- | --- |
| Cron endpoint | `app/api/cron/db-health/route.ts` | `GET /api/cron/db-health` — runs `SELECT 1` through the retry-wrapped Prisma client. Verifies `Authorization: Bearer <CRON_SECRET>` (constant-time compare). Returns `not_configured` (200) if `CRON_SECRET` is unset — never touches the DB in that case. Returns 503 on DB failure. Logs every outcome to Axiom. Exports `maxDuration = 60` so a cold start + the 15s pool connect timeout fit inside Vercel's function limit. |
| Cron trigger | `vercel.json` | `"crons": [{ "path": "/api/cron/db-health", "schedule": "0 8 * * *" }]` — fires every day at 08:00 UTC. Daily is the maximum frequency allowed on the Vercel Hobby (free) plan, so this deploys cleanly everywhere. |
| Env template | `.env.example` | Documents `CRON_SECRET` with a generation one-liner. |

### How Vercel cron authentication works

When `CRON_SECRET` is set as an environment variable on the Vercel project, Vercel
**automatically** sends `Authorization: Bearer <CRON_SECRET>` on every cron request.
You never configure this header yourself — you only set the env var. The route
rejects requests without the correct secret with `401`, so the endpoint is not
publicly abusable.

Vercel also sends `x-vercel-cron-schedule` (the triggering cron expression) and uses
the user-agent `vercel-cron/1.0`.

---

## 2. Prerequisites

- A Vercel project for this repo (production deployment).
- The Nhost project must be **running** (see §5.1 — you must unpause it first).
- A Vercel plan. **This matters — see §3.**

---

## 3. Plan limitation: Hobby vs Pro

The shipped schedule is `0 8 * * *` (daily) because Vercel's cron frequency limits
make that the maximum on the Hobby plan — this is what the repo deploys today:

| Plan | Min interval | `0 8 * * *` (daily)? |
| --- | --- | --- |
| **Hobby (free)** | **Once per day** | ✅ |
| **Pro** | Once per minute | ✅ (and can go faster) |

A daily ping is still **7× margin** under Nhost's 7-day pause threshold, so it fully
achieves the goal. **If you're on Pro** and want the original every-2-hours cadence,
change the schedule in `vercel.json` and redeploy:

```json
"crons": [
  {
    "path": "/api/cron/db-health",
    "schedule": "0 */2 * * *"
  }
]
```

Useful schedules:

| Schedule | Meaning |
| --- | --- |
| `0 8 * * *` | Every day at 08:00 UTC — all plans (current config) |
| `0 */2 * * *` | Every 2 hours, on the hour (UTC) — Pro only |
| `0 */6 * * *` | Every 6 hours (UTC) — Pro only |
| `0 */12 * * *` | Every 12 hours — Pro only |

> The cron timezone is always **UTC**. Cron expressions are 5-field (minute hour
> day-of-month month day-of-week). Day-of-month and day-of-week can't both be set.

---

## 4. Activation steps

### 4.1 Generate a CRON_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output — a 64-character hex string.

### 4.2 Set the env var in Vercel

1. Open the project in the [Vercel dashboard](https://vercel.com).
2. **Settings → Environment Variables**.
3. Add:
   - **Key:** `CRON_SECRET`
   - **Value:** the hex string from §4.1
   - **Environments:** check **Production** (and Preview if you want it in previews).
4. Save.

### 4.3 Deploy

```bash
vercel deploy --prod
```

Cron jobs are registered during the build and fire only on **production**
deployments (never previews).

> The shipped `0 8 * * *` schedule deploys on every plan. If you changed it to a
> sub-daily expression (e.g. `0 */2 * * *`) while on Hobby, the build fails here —
> revert to a daily expression per §3 and redeploy.

### 4.4 Confirm the cron was created

Vercel dashboard → project → **Settings → Cron Jobs**. You should see the entry
`/api/cron/db-health` with its schedule.

---

## 5. Before you deploy: fix the database first

### 5.1 Unpause the Nhost project

The keep-alive only *prevents future* pauses. If the project is already paused (or
unreachable), the cron will just log 503s:

1. Log in at **app.nhost.io**.
2. Open your organization → check the project list.
3. If the project is there: click it → **unpause/resume** → wait for it to start.
4. Copy the **current** database connection string from Project Settings (the hostname
   may have changed) and update `DATABASE_URL` (and `DIRECT_URL`) in your `.env` and
   in Vercel's environment variables.

If the project is **gone** from the dashboard, it was deleted (free tier has no
backups) — recover from `exports/chinni-treasure-export-*.xlsx` + Prisma migrations,
or switch to the local Docker Postgres in `docker-compose.yml`.

---

## 6. Verify it works

### 6.1 Local (after deploying)

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://<your-app>.vercel.app/api/cron/db-health
```

The `<CRON_SECRET>` in the header must **exactly match** the value set in Vercel — a
different value returns `401` (generate one secret once in §4.1 and reuse it).

| Response | Meaning |
| --- | --- |
| `200 {"status":"ok","db":"connected"}` | ✅ DB reachable |
| `200 {"status":"ok","db":"not_configured"}` | `CRON_SECRET` not set in Vercel — add it and redeploy |
| `401 {"status":"unauthorized"}` | Wrong/missing header |
| `503 {"status":"error","db":"unreachable"}` | DB unreachable — see §7 |

### 6.2 Check Axiom

Cron invocations log to Axiom with messages `Cron db-health ok`, `Cron db-health
failed`, `Cron db-health rejected`, or `Cron db-health not configured`. Query the
dataset for the last week to confirm pings are landing (≈1/day on the shipped
daily schedule, ≈12/day if you switched to every 2 hours).

### 6.3 Check Vercel logs

Project → **Logs** → filter by the `vercel-cron/1.0` user agent.

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Deploy fails: *"Hobby accounts are limited to daily cron jobs"* | Schedule more frequent than daily on Hobby | Use a daily schedule (§3) |
| `503 db: unreachable` | Nhost project paused / hostname gone | Unpause in Nhost dashboard; verify `DATABASE_URL`; test `nslookup <host>.db.ap-south-1.nhost.run` |
| `401 unauthorized` from manual curl | You didn't send the Bearer header | Add `-H "Authorization: Bearer <CRON_SECRET>"` |
| `401` from Vercel cron | `CRON_SECRET` env mismatch between route and Vercel | Recheck the value in Vercel Settings → Environment Variables; redeploy after change |
| `not_configured` | `CRON_SECRET` unset in Vercel | Set it and redeploy |
| Cron row missing in Settings → Cron Jobs | Deploy didn't include `vercel.json` crons, or not a production deploy | `vercel deploy --prod`; confirm `vercel.json` has the `crons` array |
| Pause still happens after a week | Nhost may measure project-level activity, not raw pooler connections | Cron should also ping a Nhost/app endpoint (see §8) |

---

## 8. Monitoring the assumption

The keep-alive is built on the assumption that a scheduled `SELECT 1` counts as Nhost
"activity." Nhost's inactivity metric may be measured at the project level (API /
platform usage), not raw Postgres pooler connections. **Watch after the first week:**
if the project pauses despite the cron, change the cron endpoint to also (or instead)
request a Nhost service endpoint (e.g. the app's homepage or a Nhost GraphQL/health
URL) so platform-level activity is generated.

---

## Appendix: what not to do

- **Don't** run a `setInterval` inside a serverless function to "keep the app alive" —
  Vercel functions are not long-running; the process is frozen between requests.
- **Don't** make the cron endpoint public (no secret) — it would be an open endpoint
  that opens DB connections per request. The current code refuses to touch the DB
  when `CRON_SECRET` is unset.
- **Don't** use `@` (at) or other non-standard cron syntax — Vercel supports only the
  basic 5-field expressions.
