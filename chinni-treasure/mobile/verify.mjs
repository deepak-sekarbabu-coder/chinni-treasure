/**
 * Resolves every @drawable/@mipmap/@color/@string/@style reference in the
 * manifest and res/ tree, plus the R.* references in Kotlin.
 *
 * There is no Android SDK in this repo, so `aapt` cannot do this. A typo'd
 * resource name compiles fine in every linter and then fails the release build.
 *
 *   node mobile/verify.mjs
 *
 * Exits non-zero on the first category it cannot resolve. Not a substitute for
 * `./gradlew lint`; a floor under it.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const RES = join(dirname(fileURLToPath(import.meta.url)), "app", "src", "main");
const RES_DIR = join(RES, "res");

/** Every file under res/, grouped by the resource type its folder name implies. */
const defined = new Map(); // type -> Set(name)
const add = (type, name) => {
  if (!defined.has(type)) defined.set(type, new Set());
  defined.get(type).add(name);
};

const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    const base = entry.name.replace(/\.[^.]+$/, "");

    // mipmap-anydpi-v26/ic_launcher.xml -> mipmap:ic_launcher
    const dirType = dirName(dir).match(/^(drawable|mipmap|values)/)?.[1];
    if (dirType === "values") {
      // Values files declare names inside; pick them up below.
      continue;
    }
    if (dirType) add(dirType, base);
  }
};

const dirName = (p) => {
  const parts = p.split(/[\\/]/);
  return parts[parts.length - 1];
};

walk(RES_DIR);

// res/values/*.xml declares <string name>, <color name>, <style name>.
for (const file of readdirSync(join(RES_DIR, "values"))) {
  if (extname(file) !== ".xml") continue;
  const xml = readFileSync(join(RES_DIR, "values", file), "utf8");
  for (const [, tag, name] of xml.matchAll(/<(string|color|style)\s[^>]*name="([^"]+)"/g)) {
    add(tag, name);
  }
}

/** Files that may contain resource references. */
const sources = [join(RES, "AndroidManifest.xml")];
const collect = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (entry.name.endsWith(".xml")) sources.push(full);
  }
};
collect(RES_DIR);
for (const dir of ["java"]) {
  const base = join(RES, dir);
  if (!existsSync(base)) continue;
  const javaFiles = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, e.name);
      if (e.isDirectory()) javaFiles(full);
      else if (e.name.endsWith(".kt")) sources.push(full);
    }
  };
  javaFiles(base);
}

// Style names may be dotted (Theme.ChinniTreasure); asset names may not.
const REF = /@(drawable|mipmap|string|color|style)\/([A-Za-z0-9_.]+)/g;
const KOTLIN_REF = /\bR\.(drawable|mipmap|string|color|style)\.([A-Za-z0-9_]+)/g;

const missing = [];
for (const file of sources) {
  const text = readFileSync(file, "utf8");
  for (const [, type, name] of text.matchAll(REF)) {
    if (!defined.get(type)?.has(name)) missing.push(`${file}: @${type}/${name}`);
  }
  for (const [, type, name] of text.matchAll(KOTLIN_REF)) {
    if (!defined.get(type)?.has(name)) missing.push(`${file}: R.${type}.${name}`);
  }
}

// BuildConfig.SITE_URL only exists if app/build.gradle.kts declares it.
const gradle = readFileSync(join(dirname(RES_DIR), "..", "..", "build.gradle.kts"), "utf8");
if (!/buildConfigField\(\s*"String"\s*,\s*"SITE_URL"/.test(gradle)) {
  missing.push("app/build.gradle.kts: no BuildConfig.SITE_URL field");
}

// Every density-specific mipmap folder the adaptive icon reads must have a
// foreground. anydpi-v* folders hold the XML definition instead.
for (const dir of readdirSync(RES_DIR)) {
  if (!dir.startsWith("mipmap-") || dir.includes("anydpi")) continue;
  if (!existsSync(join(RES_DIR, dir, "ic_launcher_foreground.png"))) {
    missing.push(`res/${dir}: ic_launcher_foreground.png absent`);
  }
}

if (missing.length) {
  console.error("Unresolved references:");
  for (const m of missing) console.error("  " + m);
  process.exit(1);
}
console.log(
  `verify: ${sources.length} sources, ${[...defined.values()].reduce((n, s) => n + s.size, 0)} resources, all references resolve`,
);