#!/usr/bin/env node
/**
 * Opens the most recently generated Lighthouse HTML report.
 *
 * Usage:
 *   node scripts/open-lighthouse-report.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportDir = path.join(ROOT, "lighthouse", "reports");

function collectHtml(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtml(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const htmlFiles = collectHtml(reportDir);
if (!htmlFiles.length) {
  console.error(`No Lighthouse HTML reports found under ${path.relative(ROOT, reportDir)}.`);
  console.error("Run `npm run lighthouse` first.");
  process.exit(1);
}

htmlFiles.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
const latest = htmlFiles[0];
console.log(`Opening ${path.relative(ROOT, latest)}`);

const command =
  process.platform === "win32"
    ? `start "" "${latest}"`
    : process.platform === "darwin"
      ? `open "${latest}"`
      : `xdg-open "${latest}"`;

exec(command, (err) => {
  if (err) {
    console.error(`Could not open the report: ${err.message}`);
    process.exit(1);
  }
});
