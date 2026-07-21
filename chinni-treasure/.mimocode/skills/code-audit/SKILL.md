---
name: code-audit
description: "Full-stack code audit: scan codebase for security, performance, accessibility, and code quality issues. Produces an improvements.md tracker with numbered issues, then fixes them one-by-one with verify-commit loops."
---

# Code Audit Skill

Perform a systematic code audit of the chinni-treasure codebase, produce an `improvements.md` tracker, and optionally fix each issue with the edit-verify-commit pattern.

## When to use

- User asks for a "code review", "security audit", "improvements list", or "find issues"
- User says "audit the codebase" or "what can be improved"
- User wants to work through a list of improvements sequentially

## When NOT to use

- Single-file lookups or straightforward bug fixes — just fix directly
- User asks for a specific feature implementation — that's not an audit

## Phase 1: Discovery Scan

Scan the codebase across these dimensions. Read the relevant files for each area:

### Security
- `src/lib/auth.ts` — JWT handling, password hashing, cookie flags
- `src/lib/sanitize.ts` — input sanitization approach
- `src/lib/rate-limiter.ts` — rate limiting implementation
- `proxy.ts` — middleware auth checks
- `app/api/*/route.ts` — API endpoint auth, CSRF, input validation
- `src/lib/csrf-helpers.ts` — CSRF protection
- `.env.example` — env var documentation

### Performance
- `app/api/stats/route.ts` — aggregation approach (SQL vs JS)
- `app/api/export/route.ts` — data loading strategy (batching, streaming)
- `src/lib/products-cache.ts` — caching approach
- `prisma/schema.prisma` — missing indexes, N+1 query risks
- `next.config.ts` — bundle/image optimization

### Accessibility
- `app/order/page.tsx` — form labels, aria-describedby, input modes
- `src/components/ui/LoadingSpinner.tsx` — role="status", aria-live
- `app/globals.css` — focus-visible styles, forced-colors support
- `src/components/ui/StockBadge.tsx` — screen reader text

### Code Quality
- `src/lib/utils.ts` — crypto vs Math.random for sensitive values
- `src/lib/env.ts` — startup env validation
- `package.json` — unused dependencies
- `postcss.config.mjs` — unused config files
- Test coverage gaps in `src/__tests__/`

## Phase 2: Generate Tracker

Write `improvements.md` at the project root with this format:

```markdown
# Chinni Treasure — Improvement Tracker

> Generated: YYYY-MM-DD | Project: chinni-treasure

---

## Summary

| Status | Count |
|--------|-------|
| Fixed | 0 |
| Open | N |

---

## Issues

| # | Issue | Severity | File(s) | Status |
|---|-------|----------|---------|--------|
| 1 | **Description** — detail | Critical/High/Medium/Low | `path/to/file.ts` | Open |
```

Sort by severity: Critical → High → Medium → Low.

## Phase 3: Fix Loop (Optional)

When the user asks to fix issues (e.g., "fix #1", "fix all", "work through the list"):

For each issue:

1. **Read** the affected file(s) to understand current state
2. **Edit** to apply the fix — minimal, targeted changes
3. **Verify** with the smallest relevant check:
   - `npm run typecheck` for type-level changes
   - `npm run test:run` for behavior changes
   - `npm run lint` for style changes
4. **Update** `improvements.md` — mark issue as Fixed, update summary counts
5. **Commit** with a descriptive message following the repo convention:
   ```
   fix(scope): short description

   - Bullet point detail
   - Another detail
   ```

### Git commit conventions (this repo)
- Prefix: `fix`, `feat`, `chore`, `docs`, `refactor`, `test`
- Scope: `security`, `a11y`, `perf`, `nav`, `env`, or file area
- Message: imperative mood, focus on "why"

### Known gotchas
- `router.push()` cannot replace `window.location.href` for admin login — middleware cookie timing race condition requires full reload
- `postcss.config.mjs` may exist but be unused — safe to remove
- Test files may need `vi.mock('@/src/lib/env')` when env.ts is introduced
- `@testing-library` tests in this repo use Vitest, not Jest

## Phase 4: Verification

After all fixes are applied:
1. Run `npm run test:run` — full test suite must pass
2. Run `npm run typecheck` — no type errors
3. Update `improvements.md` summary with final counts
4. Commit the tracker update

## Output

- `improvements.md` — the numbered issue tracker at project root
- Individual commits per fix, each with typecheck + test verification
- Final summary commit with tracker update
