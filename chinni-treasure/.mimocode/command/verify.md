---
description: "Run the full verification suite (typecheck, lint, tests) and report results. Use after code changes to confirm nothing is broken."
---

# Verify Command

Run the standard verification pipeline for chinni-treasure after making code changes.

## Steps

1. **TypeScript check** — `npm run typecheck`
2. **ESLint** — `npm run lint`
3. **Test suite** — `npm run test:run`

## Report format

After all checks complete, report:

```
Verification results:
- Typecheck: ✅ passed | ❌ N errors
- Lint: ✅ passed | ❌ N warnings/errors
- Tests: ✅ N passed | ❌ N failed (of M total)
```

If any check fails, show the first few errors and suggest the fix.

## Scope variants

- `$ARGUMENTS` — if provided, run only the matching check:
  - `type` or `types` → typecheck only
  - `lint` → lint only
  - `test` or `tests` → test suite only
  - `full` or empty → all three checks
