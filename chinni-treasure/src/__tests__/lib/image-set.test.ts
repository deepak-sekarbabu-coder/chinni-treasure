import { describe, it, expect } from "vitest";
import {
  addImage,
  editImage,
  moveImage,
  normalizeImageSet,
  removeImage,
  setPrimary,
  type ImageSetEntry,
} from "@/src/lib/image-set";

const a: ImageSetEntry = { url: "https://x/1.png", isPrimary: false, displayOrder: 0 };
const b: ImageSetEntry = { url: "https://x/2.png", isPrimary: false, displayOrder: 1 };
const c: ImageSetEntry = { url: "https://x/3.png", isPrimary: false, displayOrder: 2 };

/** The invariant every op must leave behind. */
function expectInvariant(images: ImageSetEntry[]) {
  const primaries = images.filter((i) => i.isPrimary);
  expect(primaries.length).toBe(images.length === 0 ? 0 : 1);
  expect(images.map((i) => i.displayOrder)).toEqual(images.map((_, i) => i));
}

describe("image-set module", () => {
  it("promotes the first image when the payload flags no primary", () => {
    // The bug this module exists to kill: Zod defaults isPrimary to false, so
    // a whole gallery used to be stored with no primary at all.
    const out = normalizeImageSet([a, b, c]);
    expect(out.map((i) => i.isPrimary)).toEqual([true, false, false]);
    expect(out.map((i) => i.displayOrder)).toEqual([0, 1, 2]);
  });

  it("keeps exactly one primary when the payload flags several", () => {
    const out = normalizeImageSet([
      { ...a, isPrimary: true },
      { ...b, isPrimary: true },
      c,
    ]);
    expect(out.map((i) => i.isPrimary)).toEqual([true, false, false]);
  });

  it("renumbers contiguously and drops blank + duplicate rows", () => {
    const out = normalizeImageSet([
      { url: "https://x/1.png", isPrimary: false, displayOrder: 7 },
      { url: "  ", isPrimary: false, displayOrder: 8 },
      { url: "https://x/1.png", isPrimary: false, displayOrder: 9 },
      { url: " https://x/2.png ", isPrimary: false, displayOrder: 10 },
    ]);
    expect(out).toEqual([
      { url: "https://x/1.png", isPrimary: true, displayOrder: 0 },
      { url: "https://x/2.png", isPrimary: false, displayOrder: 1 },
    ]);
  });

  it("addImage makes the first image primary, then keeps it primary", () => {
    const one = addImage([], a.url);
    expectInvariant(one);
    expect(one[0].isPrimary).toBe(true);
    expectInvariant(addImage(one, b.url));
    expect(addImage(one, b.url).map((i) => i.isPrimary)).toEqual([true, false]);
  });

  it("removeImage promotes the first survivor when the primary goes", () => {
    const out = removeImage([one(a), one(b), one(c)], 0);
    expectInvariant(out);
    expect(out.map((i) => i.isPrimary)).toEqual([true, false]);
    expect(removeImage([one(a)], 0)).toEqual([]);
  });

  it("setPrimary moves the flag and is a no-op out of range", () => {
    const out = setPrimary([one(a), one(b), one(c)], 2);
    expect(out.map((i) => i.isPrimary)).toEqual([false, false, true]);
    expect(setPrimary([one(a)], 5)).toEqual([one(a)]);
  });

  it("moveImage swaps and renumbers, and is a no-op past the ends", () => {
    const start = [one(a), one(b), one(c)];
    const down = moveImage(start, 0, 1);
    expect(down.map((i) => i.url)).toEqual([b.url, a.url, c.url]);
    expectInvariant(down);
    expect(moveImage(start, 0, -1)).toEqual(start);
    expect(moveImage(start, 2, 1)).toEqual(start);
  });

  it("editImage rewrites the URL and leaves the invariant alone", () => {
    const out = editImage([one(a), one(b)], 1, "https://x/9.png");
    expect(out.map((i) => i.url)).toEqual([a.url, "https://x/9.png"]);
    expectInvariant(out);
  });
});

/** A non-primary row, which is what the form holds before a primary is picked. */
function one(img: ImageSetEntry): ImageSetEntry {
  return { ...img, isPrimary: false };
}
