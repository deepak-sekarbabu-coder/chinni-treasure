#!/usr/bin/env node
/**
 * Lighthouse performance runner for Chinni Treasure.
 *
 * Audits the routes in lighthouse/routes.json against a running server,
 * enforces the budgets in lighthouse/budgets.json, and writes HTML + JSON
 * reports to lighthouse/reports/<run-id>/.
 *
 * Usage (requires a running server first — `npm run dev` or `npm start`):
 *   node scripts/run-lighthouse.mjs
 *   node scripts/run-lighthouse.mjs --desktop
 *   node scripts/run-lighthouse.mjs --base-url http://localhost:3000 --routes Home,Catalogue
 *   node scripts/run-lighthouse.mjs --iterations 3 --open
 *
 * Flags:
 *   --base-url <url>     Base URL of the running app (default http://localhost:3000)
 *   --routes <list>      Comma-separated route names, paths, or 1-based indices
 *   --desktop            Run with the desktop form factor instead of mobile
 *   --iterations <n>     Number of runs per route (default 1; median is used for budgets)
 *   --chrome-path <path> Path to a Chrome/Edge/Chromium executable
 *   --report-dir <path>  Report output directory (default lighthouse/reports)
 *   --no-fail            Never exit non-zero on budget violations
 *   --open               Open the latest HTML report when finished
 *   --help               Show this help
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { default: lighthouse } = require("lighthouse");
const { launch } = require("chrome-launcher");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_BASE_URL = "http://localhost:3000";
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    routes: null,
    desktop: false,
    iterations: 1,
    chromePath: process.env.CHROME_PATH || process.env.LIGHTHOUSE_CHROME_PATH || null,
    reportDir: path.join(ROOT, "lighthouse", "reports"),
    fail: true,
    open: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case "--base-url": args.baseUrl = next(); break;
      case "--routes": args.routes = next(); break;
      case "--desktop": args.desktop = true; break;
      case "--iterations": args.iterations = Number.parseInt(next(), 10) || 1; break;
      case "--chrome-path": args.chromePath = next(); break;
      case "--report-dir": args.reportDir = next(); break;
      case "--no-fail": args.fail = false; break;
      case "--open": args.open = true; break;
      case "--help": args.help = true; break;
      default:
        console.warn(`Unknown flag: ${arg}`);
        break;
    }
  }
  args.iterations = Math.max(1, Math.min(5, args.iterations));
  return args;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function fmtScore(score) {
  if (score === null || score === undefined) return "n/a";
  const pct = Math.round(score * 100);
  const color = pct >= 90 ? GREEN : pct >= 50 ? YELLOW : RED;
  return `${color}${String(pct).padStart(3)}${RESET}`;
}

function fmtMs(ms) {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "n/a";
  return `${Math.round(ms)}ms`;
}

function fmtCls(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/a";
  return value.toFixed(3);
}

function normalizeBaseUrl(raw) {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

async function waitForServer(baseUrl, attempts = 40, delayMs = 2000) {
  // The first request to a dev server can take a while (on-demand compilation),
  // so be patient and use a generous per-attempt timeout.
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(baseUrl, { signal: AbortSignal.timeout(15000) });
      if (res.ok || res.status < 500) return true;
    } catch {
      // server not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

function findChrome(chromePath) {
  if (chromePath) {
    if (!fs.existsSync(chromePath)) {
      throw new Error(`Chrome executable not found at --chrome-path: ${chromePath}`);
    }
    return chromePath;
  }
  // Fall back to Microsoft Edge on Windows (Chromium-based, works with Lighthouse).
  if (process.platform === "win32") {
    const candidates = [
      path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Microsoft", "Edge", "Application", "msedge.exe"),
      path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Microsoft", "Edge", "Application", "msedge.exe"),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null; // let chrome-launcher discover Chrome itself
}

async function resolveRoutes(config, baseUrl) {
  const routes = [];
  for (const route of config.routes) {
    if (route.resolve === "firstProduct") {
      const resolved = await resolveFirstProduct(baseUrl);
      if (!resolved) {
        console.warn(`${YELLOW}⚠ Skipping "First Product": could not find a product link on ${baseUrl}/catalogue${RESET}`);
        continue;
      }
      routes.push({ name: route.name, path: resolved });
    } else {
      routes.push({ name: route.name, path: route.path });
    }
  }
  return routes;
}

async function resolveFirstProduct(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/catalogue`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const html = await res.text();
    const matches = html.match(/href="\/catalogue\/[^"#?]+"/g) || [];
    const ids = [...new Set(matches.map((m) => m.replace(/^href="\/catalogue\//, "").replace(/"$/, "")))];
    return ids.length ? `/catalogue/${ids[0]}` : null;
  } catch {
    return null;
  }
}

function filterRoutes(routes, filter) {
  if (!filter) return routes;
  const tokens = filter.split(",").map((t) => t.trim()).filter(Boolean);
  return routes.filter((route, index) =>
    tokens.some((token) => {
      if (/^\d+$/.test(token)) return index + 1 === Number.parseInt(token, 10);
      const normalized = token.startsWith("/") ? token : `/${token}`;
      return (
        route.name.toLowerCase() === token.toLowerCase() ||
        route.path.toLowerCase() === normalized.toLowerCase() ||
        route.path.toLowerCase() === token.toLowerCase()
      );
    }),
  );
}

function settingsFor(formFactor) {
  if (formFactor === "desktop") {
    return {
      formFactor: "desktop",
      throttlingMethod: "simulate",
      throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
      screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    };
  }
  return {
    formFactor: "mobile",
    throttlingMethod: "simulate",
    throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
    screenEmulation: { mobile: true, width: 412, height: 915, deviceScaleFactor: 2.625, disabled: false },
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function collectResults(lhrs, formFactor, budgets) {
  const pick = (auditId) => {
    const values = lhrs
      .map((lhr) => lhr?.audits?.[auditId]?.numericValue)
      .filter((v) => Number.isFinite(v));
    return values.length ? median(values) : null;
  };

  const metrics = {
    fcpMs: pick("first-contentful-paint"),
    lcpMs: pick("largest-contentful-paint"),
    tbtMs: pick("total-blocking-time"),
    cls: pick("cumulative-layout-shift"),
    siMs: pick("speed-index"),
  };

  const budget = budgets[formFactor] || {};
  const violations = [];
  const checks = [
    { label: "FCP", metric: metrics.fcpMs, limit: budget.fcpMs },
    { label: "LCP", metric: metrics.lcpMs, limit: budget.lcpMs },
    { label: "TBT", metric: metrics.tbtMs, limit: budget.tbtMs },
    { label: "CLS", metric: metrics.cls, limit: budget.cls },
    { label: "SI", metric: metrics.siMs, limit: budget.siMs },
  ];
  for (const check of checks) {
    if (Number.isFinite(check.metric) && Number.isFinite(check.limit) && check.metric > check.limit) {
      violations.push(`${check.label} ${check.metric.toFixed(check.metric < 1 ? 3 : 0)} > ${check.limit}`);
    }
  }

  const scores = {};
  for (const category of CATEGORIES) {
    const values = lhrs.map((lhr) => lhr?.categories?.[category]?.score).filter((v) => v !== null && v !== undefined);
    scores[category] = values.length ? median(values) : null;
  }

  return { metrics, scores, violations, lighthouseVersion: lhrs[0]?.lighthouseVersion };
}

function stripAnsi(str) {
  return String(str).replace(/\x1b\[[0-9;]*m/g, "");
}

function pad(str, width) {
  const visible = stripAnsi(str);
  return String(str) + " ".repeat(Math.max(0, width - visible.length));
}

function printSummary(results) {
  const table = [];
  const header = [
    pad("Route", 22),
    pad("Form", 8),
    pad("Perf", 6),
    pad("A11y", 6),
    pad("BestP", 6),
    pad("SEO", 6),
    pad("FCP", 9),
    pad("LCP", 9),
    pad("TBT", 9),
    pad("CLS", 8),
    pad("SI", 9),
  ].join("");
  console.log("\n" + header);
  console.log("-".repeat(header.length));
  for (const r of results) {
    table.push(
      [
        pad(r.route, 22),
        pad(r.formFactor, 8),
        pad(fmtScore(r.scores.performance), 6),
        pad(fmtScore(r.scores.accessibility), 6),
        pad(fmtScore(r.scores["best-practices"]), 6),
        pad(fmtScore(r.scores.seo), 6),
        pad(fmtMs(r.metrics.fcpMs), 9),
        pad(fmtMs(r.metrics.lcpMs), 9),
        pad(fmtMs(r.metrics.tbtMs), 9),
        pad(fmtCls(r.metrics.cls), 8),
        pad(fmtMs(r.metrics.siMs), 9),
      ].join(""),
    );
  }
  console.log(table.join("\n"));

  const failing = results.filter((r) => r.violations.length > 0);
  if (failing.length) {
    console.log(`\n${RED}Budget violations:${RESET}`);
    for (const r of failing) {
      console.log(`  ${r.route} (${r.formFactor}): ${r.violations.join(", ")}`);
    }
  } else {
    console.log(`\n${GREEN}All routes within budget for ${results[0]?.formFactor ?? "?"} form factor.${RESET}`);
  }
}

async function openReport(reportDir) {
  const htmlFiles = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".html")) htmlFiles.push(full);
    }
  };
  walk(reportDir);
  if (!htmlFiles.length) {
    console.warn("No HTML reports found to open.");
    return;
  }
  htmlFiles.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  const latest = htmlFiles[0];
  console.log(`Opening ${latest}`);
  const { exec } = await import("node:child_process");
  const command =
    process.platform === "win32"
      ? `start "" "${latest}"`
      : process.platform === "darwin"
        ? `open "${latest}"`
        : `xdg-open "${latest}"`;
  exec(command, (err) => {
    if (err) console.warn(`Could not open report: ${err.message}`);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`Lighthouse runner for Chinni Treasure.

Usage:
  node scripts/run-lighthouse.mjs [flags]

Flags:
  --base-url <url>     Base URL of the running app (default ${DEFAULT_BASE_URL})
  --routes <list>      Comma-separated route names, paths, or 1-based indices
  --desktop            Run with the desktop form factor instead of mobile
  --iterations <n>     Runs per route, 1-5 (default 1; median used for budgets)
  --chrome-path <path> Chrome/Edge/Chromium executable to use
  --report-dir <path>  Output directory (default lighthouse/reports)
  --no-fail            Never exit non-zero on budget violations
  --open               Open the latest HTML report when finished

Start a server first: npm run dev (or npm run build && npm start).`);
    return;
  }

  const budgets = JSON.parse(fs.readFileSync(path.join(ROOT, "lighthouse", "budgets.json"), "utf8"));
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, "lighthouse", "routes.json"), "utf8"));

  const baseUrl = normalizeBaseUrl(args.baseUrl);
  console.log(`Checking ${baseUrl} ...`);
  const up = await waitForServer(baseUrl);
  if (!up) {
    console.error(`${RED}Server at ${baseUrl} is not reachable.${RESET}`);
    console.error("Start it first with `npm run dev` or `npm run build && npm start`.");
    process.exit(1);
  }

  const allRoutes = await resolveRoutes(config, baseUrl);
  const routes = filterRoutes(allRoutes, args.routes);
  if (!routes.length) {
    console.error("No routes matched. Use --routes Home,Catalogue or check lighthouse/routes.json.");
    process.exit(1);
  }

  const chromePath = findChrome(args.chromePath);
  const formFactor = args.desktop ? "desktop" : "mobile";
  const runId = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(args.reportDir, runId);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(
    `Auditing ${routes.length} route(s) × ${args.iterations} run(s) (${formFactor}) → ${path.relative(ROOT, outDir)}`,
  );
  console.log(chromePath ? `Using browser: ${chromePath}` : "Using browser: Chrome (auto-discovered)");

  let chrome;
  try {
    chrome = await launch({
      chromePath,
      chromeFlags: ["--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "--disable-extensions", "--disable-crash-reporter", "--disable-features=Translate,OptimizationHints"],
    });
  } catch (err) {
    console.error(`${RED}Failed to launch Chrome.${RESET}`);
    console.error(
      "Install Google Chrome, or point the runner at Edge/Chromium with --chrome-path (e.g. --chrome-path \"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe\").",
    );
    console.error(err.message);
    process.exit(1);
  }

  const results = [];
  try {
    const flags = {
      port: chrome.port,
      output: ["html", "json"],
      logLevel: "error",
      onlyCategories: CATEGORIES,
      cacheDisabled: false,
    };
    const configOverride = {
      extends: "lighthouse:default",
      settings: { ...settingsFor(formFactor) },
    };

    for (const [index, route] of routes.entries()) {
      const url = `${baseUrl}${route.path}`;
      console.log(`\n▶ ${route.name} — ${url}`);
      const lhrs = [];
      for (let i = 1; i <= args.iterations; i++) {
        process.stdout.write(`  run ${i}/${args.iterations} ... `);
        const runnerResult = await lighthouse(url, flags, configOverride);
        if (!runnerResult || !runnerResult.lhr) {
          console.log("failed");
          continue;
        }
        const reports = Array.isArray(runnerResult.report) ? runnerResult.report : [runnerResult.report];
        const htmlReport = reports[0] || "";
        const jsonReport = reports[1] || JSON.stringify(runnerResult.lhr, null, 2);
        const prefix = `${String(index + 1).padStart(2, "0")}-${slugify(route.name)}`;
        fs.writeFileSync(path.join(outDir, `${prefix}.html`), htmlReport);
        fs.writeFileSync(path.join(outDir, `${prefix}-${i}.json`), jsonReport);
        lhrs.push(runnerResult.lhr);
        console.log("done");
      }
      if (!lhrs.length) {
        console.warn(`${YELLOW}  No successful runs for ${route.name} — skipped.${RESET}`);
        continue;
      }
      const result = collectResults(lhrs, formFactor, budgets);
      results.push({
        route: route.name,
        path: route.path,
        formFactor,
        ...result,
      });
    }
  } finally {
    try {
      await chrome.kill();
    } catch (err) {
      // On Windows the profile temp dir is sometimes briefly locked by lingering
      // child processes; clean up best-effort and never fail the run over it.
      console.warn(`${YELLOW}Warning: Chrome cleanup incomplete: ${err.message}${RESET}`);
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        fs.rmSync(chrome.userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
      } catch {
        // best effort only
      }
    }
  }

  if (!results.length) {
    console.error("No audits completed.");
    process.exit(1);
  }

  printSummary(results);

  const summary = {
    runId,
    baseUrl,
    formFactor,
    generatedAt: new Date().toISOString(),
    lighthouseVersion: results[0]?.lighthouseVersion,
    results: results.map((r) => ({
      route: r.route,
      path: r.path,
      scores: r.scores,
      metrics: r.metrics,
      violations: r.violations,
    })),
  };
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));

  if (args.open) await openReport(args.reportDir);

  const anyViolations = results.some((r) => r.violations.length > 0);
  if (anyViolations && args.fail) {
    console.error(`\n${RED}One or more routes exceeded the performance budget.${RESET}`);
    process.exit(1);
  }
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
