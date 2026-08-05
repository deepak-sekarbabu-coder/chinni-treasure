import { spawnSync } from "node:child_process";
import fs from "node:fs";

// shell:true lets Windows resolve the npx.cmd shim (spawnSync EINVAL otherwise)
const analyses = [
  { file: "fallow-health.json", args: ["npx", "fallow", "health", "--format", "json", "--top", "200"] },
  { file: "fallow-dead.json", args: ["npx", "fallow", "dead-code", "--format", "json"] },
  { file: "fallow-dupes.json", args: ["npx", "fallow", "dupes", "--format", "json"] },
];

let succeeded = 0;

for (const { file, args } of analyses) {
  const res = spawnSync(args[0], args.slice(1), { encoding: "utf8", shell: true });
  if (res.stdout) fs.writeFileSync(file, res.stdout, "utf8");
  if (res.stderr) process.stderr.write(res.stderr);

  const label = args.join(" ");
  if (res.error) {
    console.error(`Failed to run: ${label} (${res.error.message})`);
  } else if (res.status !== 0) {
    // Fallow exits non-zero when findings are detected; the JSON is still valid.
    console.warn(`${label} exited with code ${res.status} (findings detected) — report continues.`);
  } else {
    succeeded++;
  }
}

const missing = analyses.filter(({ file }) => !fs.existsSync(file));
if (missing.length) {
  console.error(`Missing analysis output: ${missing.map((m) => m.file).join(", ")}`);
  process.exit(1);
}
if (succeeded < analyses.length) {
  console.warn(`Only ${succeeded}/${analyses.length} analyses exited cleanly; report may be incomplete.`);
}

const gen = spawnSync(process.execPath, ["scripts/generate-fallow-report.mjs", ".", "docs/fallow-report.md"], {
  encoding: "utf8",
});
if (gen.stdout) process.stdout.write(gen.stdout);
if (gen.stderr) process.stderr.write(gen.stderr);
process.exit(gen.status ?? 1);
