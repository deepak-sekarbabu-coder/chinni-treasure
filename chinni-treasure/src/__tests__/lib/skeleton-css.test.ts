import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The skeleton stylesheet contract (CONTEXT.md → Skeleton & route-state
 * module): loading.css is the ONE home for the skeleton vocabulary. These
 * assertions pin the drift classes the Sep 2026 review found in the wild —
 * a shadowed reversed `shimmer` in keyframes.css, `skeletonShimmer` pasted
 * twice inside loading.css itself, and dead `.delay-*` utilities in two files.
 */

const stylesDir = join(process.cwd(), "app", "styles");

const sheets = readdirSync(stylesDir)
  .filter((f) => f.endsWith(".css"))
  .map((file) => ({ file, text: readFileSync(join(stylesDir, file), "utf8") }));

function occurrences(needle: string): { total: number; files: string[] } {
  const files = sheets.filter((s) => s.text.includes(needle)).map((s) => s.file);
  const total = sheets.reduce((n, s) => n + s.text.split(needle).length - 1, 0);
  return { total, files };
}

describe("skeleton stylesheet ownership", () => {
  it("declares @keyframes shimmer exactly once", () => {
    const { total, files } = occurrences("@keyframes shimmer");
    expect(total).toBe(1);
    expect(files).toEqual(["loading.css"]);
  });

  it("declares @keyframes skeletonShimmer exactly once", () => {
    const { total, files } = occurrences("@keyframes skeletonShimmer");
    expect(total).toBe(1);
    expect(files).toEqual(["loading.css"]);
  });

  it("defines the latest-category skeleton line once", () => {
    const { total, files } = occurrences(".latest-category-skeleton-line {");
    expect(total).toBe(1);
    expect(files).toEqual(["loading.css"]);
  });

  it("keeps no dead .delay-* stagger utilities anywhere", () => {
    const pattern = /\.delay-\d+\s*\{/g;
    for (const { file, text } of sheets) {
      expect(`${file}: ${text.match(pattern)?.length ?? 0}`).toBe(`${file}: 0`);
    }
  });

  it("keeps the base skeleton classes in loading.css", () => {
    const { files } = occurrences(".skeleton-block,");
    expect(files).toEqual(["loading.css"]);
  });
});

/**
 * The Modal module owns the dialog scaffold; every overlay that customises it
 * must stack ABOVE `.modal-overlay`, because a nested modal (the shipping-label
 * editor inside the order-detail modal) is a child of its parent's overlay and
 * loses to it at equal-or-lower z-index. The editor sat at 10000 against the
 * base 10001 and rendered behind the dialog that opened it.
 */
describe("modal overlay stacking", () => {
  function zIndexOf(selector: string): number {
    const sheet = sheets.find((s) => s.text.includes(`${selector} {`));
    if (!sheet) throw new Error(`no stylesheet declares ${selector}`);
    const block = sheet.text.slice(sheet.text.indexOf(`${selector} {`));
    const match = block.match(/z-index:\s*(\d+)/);
    if (!match) throw new Error(`${selector} declares no z-index`);
    return Number(match[1]);
  }

  it("stacks the shipping-label editor above the base modal overlay", () => {
    expect(zIndexOf(".print-label-overlay-active")).toBeGreaterThan(
      zIndexOf(".modal-overlay"),
    );
  });

  it("stacks the other modal overlays above the base too", () => {
    const base = zIndexOf(".modal-overlay");
    for (const selector of [".gift-box-modal-overlay", ".shipping-nudge-overlay"]) {
      expect(`${selector}: ${zIndexOf(selector)}`).toBe(
        `${selector}: above ${base}`,
      );
    }
  });
});
