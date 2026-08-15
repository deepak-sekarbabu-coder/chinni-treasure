#!/usr/bin/env node
/**
 * Summarizes the biggest opportunities from a Lighthouse run directory.
 *
 * Usage:
 *   node scripts/analyze-lighthouse.mjs                # latest run directory
 *   node scripts/analyze-lighthouse.mjs --dir lighthouse/reports/2026-08-15T07-01-40
 *   node scripts/analyze-lighthouse.mjs --top 4
 *
 * Reads each route's JSON report and prints, per route:
 *   - scores + key metrics
 *   - the LCP element and its timing
 *   - top opportunities ranked by estimated savings
 *   - notable diagnostics and failed network requests
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORTS_DIR = path.join(ROOT, "lighthouse", "reports");

function parseArgs(argv) {
  const args = { dir: null, top: 5, formFactor: null };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--dir": args.dir = argv[++i]; break;
      case "--top": args.top = Number.parseInt(argv[++i], 10) || 5; break;
      case "--form-factor": args.formFactor = argv[++i]; break;
      default: break;
    }
  }
  return args;
}

function findLatestRunDir() {
  const dirs = fs
    .readdirSync(REPORTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}T/.test(d.name))
    .map((d) => path.join(REPORTS_DIR, d.name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return dirs[0] || null;
}

function fmtMs(v) {
  return Number.isFinite(v) ? `${Math.round(v)}ms` : "n/a";
}

function fmtBytes(v) {
  if (!Number.isFinite(v) || v <= 0) return "";
  const kb = v / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)}MB` : `${Math.round(kb)}KB`;
}

function topOpportunities(lhr, top) {
  const opps = [];
  for (const audit of Object.values(lhr.audits)) {
    const details = audit.details;
    if (!details || details.type !== "opportunity") continue;
    const savings = details.overallSavingsMs ?? 0;
    const bytes = details.overallSavingsBytes ?? 0;
    if (savings <= 0 && bytes <= 0) continue;
    opps.push({
      title: audit.title,
      displayValue: audit.displayValue || "",
      savingsMs: savings,
      savingsBytes: bytes,
    });
  }
  opps.sort((a, b) => b.savingsMs - a.savingsMs);
  return opps.slice(0, top);
}

function lcpElement(lhr) {
  const audit = lhr.audits["largest-contentful-paint-element"];
  const items = audit?.details?.items || [];
  if (!items.length) return null;
  const first = items[0];
  return {
    label: (first.node?.snippet || first.node?.selector || "unknown").slice(0, 90),
    timingMs: first.timing,
  };
}

function failedRequests(lhr) {
  const audit = lhr.audits["network-requests"];
  const items = audit?.details?.items || [];
  return items
    .filter((r) => r.statusCode >= 400)
    .map((r) => ({ url: r.url.slice(0, 120), status: r.statusCode }));
}

function diagnostics(lhr) {
  const out = [];
  for (const audit of Object.values(lhr.audits)) {
    if (audit.details?.type !== "diagnostic") continue;
    if (audit.score === 1 || audit.score === null) continue;
    const items = audit.details.items || [];
    if (!items.length) continue;
    const first = items[0];
    const value = first.metricSavings?.FCP ?? first.metricSavings?.LCP ?? first.metricSavings?.TBT ?? null;
    if (value) out.push(`${audit.title} (~${Math.round(value)}ms)`);
  }
  return out.slice(0, 4);
}

function failedCategoryAudits(lhr) {
  const out = [];
  for (const [id, audit] of Object.entries(lhr.audits)) {
    if (audit.score !== 0 && audit.score !== null) continue;
    if (audit.scoreDisplayMode === "notApplicable" || audit.scoreDisplayMode === "manual") continue;
    const cat = lhr.categories && Object.values(lhr.categories).find((c) => c.auditRefs.some((r) => r.id === id));
    if (cat && cat.score !== null) {
      out.push(`${id} [${audit.score === 0 ? "fail" : "warn"}] — ${audit.title}`);
    }
  }
  return [...new Set(out)];
}

function analyzeRun(runDir, top) {
  const summaryPath = path.join(runDir, "summary.json");
  let summary = null;
  if (fs.existsSync(summaryPath)) {
    summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  }
  if (summary) {
    console.log(`Run: ${path.basename(runDir)}  ·  form factor: ${summary.formFactor}  ·  base: ${summary.baseUrl}`);
    if (summary.lighthouseVersion) console.log(`Lighthouse ${summary.lighthouseVersion}`);
    console.log("");
  }

  const jsonFiles = fs
    .readdirSync(runDir)
    .filter((f) => f.endsWith(".json") && f !== "summary.json")
    .sort();

  // Group iterations per route (NN-prefix) and analyze the last iteration.
  const byRoute = new Map();
  for (const file of jsonFiles) {
    const key = file.split("-").slice(0, 2).join("-"); // "01-home"
    byRoute.set(key, path.join(runDir, file));
  }

  for (const [key, file] of [...byRoute.entries()].sort()) {
    const lhr = JSON.parse(fs.readFileSync(file, "utf8"));
    const cat = (id) => lhr.categories[id]?.score ?? null;
    const metric = (id) => lhr.audits[id]?.numericValue ?? null;
    const name = key.replace(/^\d+-/, "").replace(/-/g, " ");

    console.log(`━━━ ${name} ━━━`);
    console.log(
      `Perf ${fmtScore(cat("performance"))}  A11y ${fmtScore(cat("accessibility"))}  BestP ${fmtScore(cat("best-practices"))}  SEO ${fmtScore(cat("seo"))}`,
    );
    console.log(
      `FCP ${fmtMs(metric("first-contentful-paint"))} · LCP ${fmtMs(metric("largest-contentful-paint"))} · TBT ${fmtMs(metric("total-blocking-time"))} · CLS ${metric("cumulative-layout-shift")?.toFixed(3)} · SI ${fmtMs(metric("speed-index"))}`,
    );

    const lcp = lcpElement(lhr);
    if (lcp) console.log(`LCP element: ${lcp.label} (${fmtMs(lcp.timingMs)})`);

    const failed = failedRequests(lhr);
    if (failed.length) {
      console.log(`Failed requests: ${failed.map((f) => `${f.status} ${f.url}`).join(" · ")}`);
    }

    const transfer = lhr.audits["total-byte-weight"]?.details?.items || [];
    const totalBytes = lhr.audits["total-byte-weight"]?.numericValue || 0;
    console.log(`Total transfer: ${fmtBytes(totalBytes)}`);
    const imageBytes = transfer
      .filter((i) => i.resourceType === "Image")
      .reduce((sum, i) => sum + (i.transferSize || 0), 0);
    console.log(`  · images: ${fmtBytes(imageBytes)} (${transfer.filter((i) => i.resourceType === "Image").length} requests)`);

    const opps = topOpportunities(lhr, top);
    if (opps.length) {
      console.log(`Top opportunities (top ${opps.length}):`);
      for (const o of opps) {
        const saved = [];
        if (o.savingsMs > 0) saved.push(`~${Math.round(o.savingsMs)}ms`);
        if (o.savingsBytes > 0) saved.push(fmtBytes(o.savingsBytes));
        console.log(`  · ${o.title} ${o.displayValue ? `(${o.displayValue})` : ""} — save ${saved.join(", ")}`);
      }
    }

    const diag = diagnostics(lhr);
    if (diag.length) {
      console.log("Diagnostics:");
      for (const d of diag) console.log(`  · ${d}`);
    }

    const failedAudits = failedCategoryAudits(lhr);
    if (failedAudits.length) {
      console.log("Failed audits:");
      for (const f of failedAudits) console.log(`  · ${f}`);
    }
    console.log("");
  }
}

function fmtScore(v) {
  if (v === null || v === undefined) return "n/a";
  const n = Math.round(v * 100);
  return n >= 90 ? `\x1b[32m${n}\x1b[0m` : n >= 50 ? `\x1b[33m${n}\x1b[0m` : `\x1b[31m${n}\x1b[0m`;
}

const args = parseArgs(process.argv.slice(2));
let runDir = args.dir ? path.resolve(ROOT, args.dir) : findLatestRunDir();
if (!runDir || !fs.existsSync(runDir)) {
  console.error("No run directory found. Pass --dir <path> or run the Lighthouse runner first.");
  process.exit(1);
}
analyzeRun(runDir, args.top);
