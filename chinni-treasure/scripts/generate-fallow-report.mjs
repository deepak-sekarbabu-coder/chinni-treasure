import fs from "node:fs";

const dir = process.argv[2] ?? "/tmp";
const out = process.argv[3] ?? "docs/fallow-report.md";

const read = (f) => JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"));

const health = read("fallow-health.json");
const dead = read("fallow-dead.json");
const dupes = read("fallow-dupes.json");

const md = [];
const push = (s = "") => md.push(s);

/* ---------- helpers ---------- */
const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/`/g, "");
const sev = (s) => (s === "critical" ? "🔴 critical" : s === "high" ? "🟠 high" : "🟡 moderate");
const fileOf = (p) => {
  try {
    return decodeURIComponent(p).replace(/\\/g, "/");
  } catch {
    return p.replace(/\\/g, "/");
  }
};
const backtick = (s) => `\`${s}\``;

const cloneLines = (g) =>
  g.instances.reduce((acc, i) => acc + (i.end_line - i.start_line + 1), 0);

const groupKey = (g) =>
  g.instances
    .map((i) => `${fileOf(i.file)}:${i.start_line}-${i.end_line}`)
    .join(" + ");

/* ---------- header ---------- */
const today = new Date().toISOString().slice(0, 10);
push(`# Fallow Analysis Report — Chinni Treasure`);
push();
push(`> **Generated:** ${today} · **Fallow version:** ${health.version} (schema ${health.schema_version}) · **Command:** \`npm run fallow\``);
push(`> Raw JSON sources: \`fallow-health.json\`, \`fallow-dead.json\`, \`fallow-dupes.json\` (regenerate with \`npx fallow <analysis> --format json\`).`);
push();

/* ---------- summary ---------- */
const vs = health.vital_signs;
const hs = health.health_score;
const s = health.summary;
push(`## Summary`);
push();
push(`| Metric | Value |`);
push(`| --- | --- |`);
push(`| **Health score** | **${hs.score} / 100 (grade ${hs.grade})** |`);
push(`| Maintainability index | ${vs.maintainability_avg} (good) |`);
push(`| Files analyzed | ${vs.counts.total_files} |`);
push(`| Lines of code | ${vs.counts.total_lines.toLocaleString()} |`);
push(`| Functions analyzed | ${s.functions_analyzed.toLocaleString()} |`);
push(`| Functions above complexity threshold | **${s.functions_above_threshold}** (🔴 ${s.severity_critical_count} critical · 🟠 ${s.severity_high_count} high · 🟡 ${s.severity_moderate_count} moderate) |`);
push(`| Functions > 60 LOC | ${vs.functions_over_60_loc_per_k.toFixed(1)} per 1k functions |`);
push(`| Dead files | ${vs.counts.dead_files} (${vs.dead_file_pct}%) |`);
push(`| Dead exports | ${vs.counts.dead_exports} (${vs.dead_export_pct}%) |`);
push(`| Duplicated lines | ${vs.counts.duplicated_lines.toLocaleString()} (${vs.duplication_pct}%) across ${dupes.stats.files_with_clones} files |`);
push(`| Circular dependencies | ${vs.circular_dep_count} |`);
push(`| Unused dependencies | ${vs.unused_dep_count} |`);
push(`| Change hotspots (6 mo) | ${vs.hotspot_count} |`);
push(`| Avg cyclomatic | ${vs.avg_cyclomatic} (p90: ${vs.p90_cyclomatic}) |`);
push(`| Istanbul coverage matched | ${s.istanbul_matched} / ${s.istanbul_total} functions (${((s.istanbul_matched / s.istanbul_total) * 100).toFixed(1)}%) |`);
push();
push(`**Health score penalties:** ${Object.entries(hs.penalties)
  .filter(([, v]) => v > 0)
  .map(([k, v]) => `${k} −${v}`)
  .join(" · ")}`);
push();
push(`**Exit status:** analysis fails (non-zero) when any category has issues: dead-code (${dead.total_issues}), dupes (${dupes.clone_groups.length} groups), health (${s.functions_above_threshold} above threshold).`);
push();

/* ---------- progress tracker ---------- */
push(`## Progress Tracker`);
push();
push(`Check off categories as they are resolved (fallow will confirm with a clean exit):`);
push();
push(`- [ ] **Dead code** — 23 issues (3 files, 10 exports, 5 types, 1 test-only dep, 4 stale suppressions)`);
push(`- [ ] **Duplication** — 42 clone groups / 100 instances, ${dupes.stats.duplicated_lines.toLocaleString()} lines (${dupes.stats.duplication_percentage.toFixed(1)}%)`);
push(`- [ ] **Complexity** — ${s.functions_above_threshold} functions above threshold (${s.severity_critical_count} critical, ${s.severity_high_count} high, ${s.severity_moderate_count} moderate)`);
push(`- [ ] **File health** — ${health.file_scores.length} files scored; resolve the highest-risk files first`);
push(`- [ ] **Refactoring targets** — ${health.targets.length} prioritized recommendations`);
push();
push(`---`);
push();

/* ---------- 1. dead code ---------- */
push(`## 1. Dead Code (${dead.total_issues} issues)`);
push();

// unused files
push(`### 1.1 Unused files (${dead.unused_files.length})`);
push();
push(`Files not reachable from any entry point. Verify each is truly obsolete before deleting.`);
push();
push(`| File | Status |`);
push(`| --- | --- |`);
for (const f of dead.unused_files) push(`| ${backtick(fileOf(f.path))} | [ ] |`);
push();

// unused exports
push(`### 1.2 Unused exports (${dead.unused_exports.length})`);
push();
push(`Exported symbols with no known consumers.`);
push();
push(`| File | Export | Line | Status |`);
push(`| --- | --- | --- | --- |`);
for (const e of dead.unused_exports)
  push(`| ${backtick(fileOf(e.path))} | ${backtick(e.export_name)}${e.is_type_only ? " (type)" : ""} | ${e.line} | [ ] |`);
push();

// unused types
push(`### 1.3 Unused type exports (${dead.unused_types.length})`);
push();
push(`| File | Type | Line | Status |`);
push(`| --- | --- | --- | --- |`);
for (const t of dead.unused_types)
  push(`| ${backtick(fileOf(t.path))} | ${backtick(t.export_name)} | ${t.line} | [ ] |`);
push();

// test-only deps
push(`### 1.4 Test-only production dependencies (${dead.test_only_dependencies.length})`);
push();
push(`Consider moving to \`devDependencies\`.`);
push();
push(`| Package | File | Status |`);
push(`| --- | --- | --- |`);
for (const d of dead.test_only_dependencies) push(`| ${backtick(d.package_name)} | ${backtick(d.path)} | [ ] |`);
push();

// stale suppressions
push(`### 1.5 Stale suppressions (${dead.stale_suppressions.length})`);
push();
push(`Suppression comments that no longer match any issue (mostly a typo: \`unused-files\` → \`unused-file\`).`);
push();
push(`| File | Line | Issue kind | Status |`);
push(`| --- | --- | --- | --- |`);
for (const st of dead.stale_suppressions)
  push(`| ${backtick(fileOf(st.path))} | ${st.line} | ${backtick(st.origin?.issue_kind ?? "unknown")} | [ ] |`);
push();

push(`---`);
push();

/* ---------- 2. duplication ---------- */
push(`## 2. Duplication (${dupes.clone_groups.length} clone groups · ${dupes.stats.duplicated_lines.toLocaleString()} lines · ${dupes.stats.duplication_percentage.toFixed(1)}%)`);
push();
push(`Identical code blocks detected via suffix-array analysis. Groups with the most lines are the highest-value extraction targets.`);
push();
push(`> **Note:** some groups overlap — e.g. rows 3–4 are the same duplicated CSRF-check + rate-limit block spread across API routes, detected at different token granularities. Fixing the shared block clears both.`);
push();
push(`| # | Lines | Locations | Status |`);
push(`| --- | --- | --- | --- |`);
const sortedGroups = [...dupes.clone_groups].sort((a, b) => cloneLines(b) - cloneLines(a));
sortedGroups.forEach((g, idx) => {
  const locs = g.instances
    .map((i) => backtick(`${fileOf(i.file)}:${i.start_line}-${i.end_line}`))
    .join("<br>");
  push(`| ${idx + 1} | ${cloneLines(g)} | ${locs} | [ ] |`);
});
push();

// clone families
push(`### Clone families (${dupes.clone_families.length})`);
push();
push(`Related groups spanning the same files — extract a shared function/module once to clear all of them.`);
push();
for (const fam of dupes.clone_families) {
  const files = fam.files.map((f) => backtick(fileOf(f))).join(", ");
  const total = fam.groups.reduce((acc, g) => acc + cloneLines(g), 0);
  const n = fam.groups.length;
  push(`- [ ] **${total} lines across ${n} ${n === 1 ? "group" : "groups"}** — ${files}`);
}
push();

push(`---`);
push();

/* ---------- 3. complexity ---------- */
push(`## 3. Complexity (${s.functions_above_threshold} functions above threshold)`);
push();
push(`Thresholds: cyclomatic > ${s.max_cyclomatic_threshold} · cognitive > ${s.max_cognitive_threshold} · CRAP ≥ ${s.max_crap_threshold} · unit size > ${s.max_unit_size_threshold} LOC.`);
push(`Coverage model: **${s.coverage_model}** — only ${s.istanbul_matched}/${s.istanbul_total} functions matched by Istanbul coverage; unmatched CRAP scores are estimated from export references.`);
push();

// large functions
push(`### 3.1 Large functions (${health.large_functions.length} total, > ${s.max_unit_size_threshold} LOC)`);
push();
push(`| Function | File:line | LOC | Status |`);
push(`| --- | --- | --- | --- |`);
for (const lf of [...health.large_functions].sort((a, b) => b.line_count - a.line_count))
  push(`| ${backtick(lf.name)} | ${backtick(`${fileOf(lf.path)}:${lf.line}`)} | ${lf.line_count} | [ ] |`);
push();

// complexity findings
push(`### 3.2 High-complexity functions (${health.findings.length})`);
push();
push(`Sorted by cyclomatic complexity (descending).`);
push();
push(`| Severity | Function | File:line | CC | Cog | LOC | CRAP | Status |`);
push(`| --- | --- | --- | --- | --- | --- | --- | --- |`);
const sortedFindings = [...health.findings].sort((a, b) => b.cyclomatic - a.cyclomatic);
for (const f of sortedFindings)
  push(
    `| ${sev(f.severity)} | ${backtick(f.name)} | ${backtick(`${fileOf(f.path)}:${f.line}`)} | ${f.cyclomatic} | ${f.cognitive} | ${f.line_count} | ${f.crap} | [ ] |`,
  );
push();

push(`---`);
push();

/* ---------- 4. file health ---------- */
push(`## 4. File Health Scores (${health.file_scores.length} files)`);
push();
push(`Sorted by triage concern (higher = address first). **Risk** is the max CRAP score (untested complexity); **MI** is the maintainability index (100 = best). **Risk flag** marks files where CRAP risk is the dominant concern.`);
push();
push(`| Rank | File | LOC | Fan-in | Fan-out | Dead % | Density | MI | Max CRAP | Funcs > thresh | Triage |`);
push(`| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |`);
health.file_scores.forEach((f, idx) => {
  const risk = f.crap_max >= 30;
  push(
    `| ${idx + 1} | ${backtick(fileOf(f.path))} | ${f.lines} | ${f.fan_in} | ${f.fan_out} | ${(f.dead_code_ratio * 100).toFixed(0)}% | ${f.complexity_density} | ${f.maintainability_index} | ${f.crap_max} | ${f.crap_above_threshold} | ${risk ? "⚠️ risk" : "structure"} |`,
  );
});
push();

push(`---`);
push();

/* ---------- 5. refactoring targets ---------- */
push(`## 5. Refactoring Targets (${health.targets.length})`);
push();
push(`Sorted by **ROI score** (quick-win efficiency, descending). **Pri** is the absolute priority weight (efficiency × effort) — a high effort can push a medium ROI target up.`);
push();
push(`| # | ROI | Pri | File | Category | Effort | Confidence | Recommendation | Status |`);
push(`| --- | --- | --- | --- | --- | --- | --- | --- | --- |`);
health.targets.forEach((t, idx) => {
  const cat = t.category.replace(/_/g, " ");
  push(
    `| ${idx + 1} | ${t.efficiency} | ${t.priority} | ${backtick(fileOf(t.path))} | ${cat} | ${t.effort} | ${t.confidence} | ${esc(t.recommendation)} | [ ] |`,
  );
});
push();
push(`### Target details`);
push();
for (const t of health.targets) {
  push(`#### ${t.priority} — ${backtick(fileOf(t.path))}`);
  push();
  push(`*ROI ${t.efficiency} · Pri ${t.priority}*`);
  push();
  push(`- **Category:** ${t.category.replace(/_/g, " ")} · **Effort:** ${t.effort} · **Confidence:** ${t.confidence}`);
  push(`- **Recommendation:** ${t.recommendation}`);
  if (t.evidence?.direct_callers?.length) {
    const callers = t.evidence.direct_callers.map((c) => backtick(fileOf(c.path))).join(", ");
    push(`- **Consumers:** ${callers}`);
  }
  if (t.evidence?.unused_exports?.length) {
    push(`- **Unused exports:** ${t.evidence.unused_exports.map(backtick).join(", ")}`);
  }
  push();
}
push();

/* ---------- footer ---------- */
push(`---`);
push();
push(`## Appendix: Re-running`);
push();
push(`\`\`\`bash`);
push(`npm run fallow                      # full analysis (dead-code + dupes + health)`);
push(`npx fallow health --format json --top 200 > fallow-health.json`);
push(`npx fallow dead-code --format json > fallow-dead.json`);
push(`npx fallow dupes --format json > fallow-dupes.json`);
push(`\`\`\``);
push();
push(`Suppression markers (use sparingly, and only after fixing what you can):`);
push();
push(`| Marker | Scope |`);
push(`| --- | --- |`);
push(`| \`// fallow-ignore-next-line complexity\` | above a function |`);
push(`| \`// fallow-ignore-next-line unused-export\` / \`unused-type\` | above an export |`);
push(`| \`// fallow-ignore-file unused-file\` | top of a file |`);
push();

fs.writeFileSync(out, md.join("\n"), "utf8");
console.log(`Wrote ${out} (${md.length} lines, ${fs.statSync(out).size} bytes)`);
