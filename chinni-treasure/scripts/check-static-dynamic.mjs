#!/usr/bin/env node
// Build guard: a route file must not combine `export const revalidate` with
// calling `headers()` or `cookies()` from "next/headers".
//
// Next.js cannot statically render a page whose output varies by request
// header or cookie — it throws DYNAMIC_SERVER_USAGE at runtime ("Page
// changed from static to dynamic at runtime"). Pages that read the Host
// header (e.g. the visibleHostnames domain filter) must instead export
// `export const dynamic = "force-dynamic"`.
//
// See https://nextjs.org/docs/messages/dynamic-server-error

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const APP_DIR = join(process.cwd(), "app");

if (!statSync(APP_DIR, { throwIfNoEntry: false })) {
  console.log("check-static-dynamic: no app/ directory — nothing to check.");
  process.exit(0);
}

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(full));
    else files.push(full);
  }
  return files;
}

const offenders = [];

for (const file of collectFiles(APP_DIR)) {
  if (!/\.(ts|tsx|js|jsx)$/.test(file)) continue;

  const src = readFileSync(file, "utf8");

  // Route segment config — `export const revalidate = N;`
  if (!/export\s+const\s+revalidate\b/.test(src)) continue;

  // Uses the headers()/cookies() APIs from next/headers (import alone is inert).
  if (!/from\s+["']next\/headers["']/.test(src)) continue;
  if (!/headers\s*\(|\bcookies\s*\(/.test(src)) continue;

  offenders.push(relative(process.cwd(), file));
}

if (offenders.length > 0) {
  console.error(
    "check-static-dynamic: FAIL — these files combine `revalidate` with `headers()`/`cookies()`:",
  );
  for (const file of offenders) console.error(`  - ${file}`);
  console.error(
    "Next.js cannot statically cache a page that varies by request header or cookie;",
    'the route throws DYNAMIC_SERVER_USAGE at runtime. Replace `export const revalidate`',
    'with `export const dynamic = "force-dynamic"` (and remove generateStaticParams if',
    "present), or stop calling headers()/cookies().",
  );
  process.exit(1);
}

console.log("check-static-dynamic: OK — no route file combines revalidate with headers()/cookies().");
