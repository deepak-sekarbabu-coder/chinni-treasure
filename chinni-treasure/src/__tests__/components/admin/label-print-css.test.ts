import { describe, it, expect, beforeEach } from "vitest";
import { collectLabelCSS } from "@/src/components/admin/PrintShippingLabelModal";

/**
 * The print window receives the label's markup and no stylesheets, so
 * `collectLabelCSS` is what carries the label's appearance across. It used to
 * match a hand-copied list of 38 selector substrings; these assertions pin the
 * derivation that replaced it.
 */
function collect(sheetText: string, labelHtml: string): string {
  const style = document.createElement("style");
  style.textContent = sheetText;
  document.head.append(style);

  const label = document.createElement("div");
  label.className = "label-container";
  label.innerHTML = labelHtml;
  document.body.append(label);

  return collectLabelCSS(label, document.styleSheets);
}

describe("collectLabelCSS", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("copies rules for classes the label renders", () => {
    const css = collect(
      `.label-container { width: 4in }
       .label-header { border-bottom: 2px solid #000 }
       .awb-label { font-size: 11px }`,
      `<div class="label-header"><span class="awb-label">AWB</span></div>`,
    );
    expect(css).toContain(".label-container");
    expect(css).toContain(".label-header");
    expect(css).toContain(".awb-label");
  });

  it("skips classes the label does not render", () => {
    const css = collect(
      `.label-container { width: 4in }
       .print-label-editor-panel { background: #fff }
       .order-card { border: 1px solid }`,
      "",
    );
    expect(css).toContain(".label-container");
    expect(css).not.toContain(".print-label-editor-panel");
    expect(css).not.toContain(".order-card");
  });

  it("skips a rule that reaches the label through a class the window lacks", () => {
    // The print window has no `.docs-content` ancestor and no
    // `.print-label-preview-panel`, so neither rule can match there. The old
    // substring test kept the first one because it mentioned `.title`.
    const css = collect(
      `.title { font-weight: bold }
       .docs-content .swagger-ui .info .title { font-size: 13px }
       .print-label-preview-panel .label-container { margin: 0 auto }`,
      `<div class="title">CHINNI TREASURE</div>`,
    );
    expect(css).toContain(".title");
    expect(css).not.toContain("swagger-ui");
    expect(css).not.toContain("print-label-preview-panel");
  });

  it("keeps a descendant-scoped label rule, whose classes are all the label's", () => {
    const css = collect(
      `.label-header { border-bottom: 2px solid #000 }
       .label-header .pack-date { font-size: 10px }
       .label-header .title { font-weight: bold }`,
      `<div class="label-header"><span class="pack-date">x</span><span class="title">y</span></div>`,
    );
    expect(css).toContain(".label-header .pack-date");
    expect(css).toContain(".label-header .title");
  });
});
