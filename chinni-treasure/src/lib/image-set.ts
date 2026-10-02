/**
 * The image-set module — the invariant "exactly one primary, contiguous
 * displayOrder" has one owner.
 *
 * The rule was restated in four form handlers (add/remove/setPrimary/move) and
 * only approximated in both write routes, where `isPrimary ?? idx === 0` was
 * dead code (Zod defaults the flag to false, so the fallback never fired) and
 * two primaries could be stored. Reads already tolerate drift — `primaryImage`
 * picks the first flag — so the fix belongs at the write boundary, not in a
 * reader.
 *
 * Pure and framework-free: the admin form imports the same ops the server
 * routes import, so a payload is normalized identically on both sides.
 */

export interface ImageSetEntry {
  url: string;
  isPrimary: boolean;
  displayOrder: number;
}

/** Drop blank URLs and duplicates, so one bad row can't become a gallery row. */
function usable(images: readonly ImageSetEntry[]): ImageSetEntry[] {
  const seen = new Set<string>();
  return images.filter((img) => {
    const url = img.url?.trim() ?? "";
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

/**
 * The stored form of an image set: contiguous `displayOrder` from 0 and
 * **exactly one** primary — the first image flagged, or the first image when
 * nothing is flagged. This is what both write routes persist.
 */
export function normalizeImageSet(
  images: readonly Partial<ImageSetEntry>[],
): ImageSetEntry[] {
  const kept = usable(
    images.map((img) => ({
      url: img.url ?? "",
      isPrimary: img.isPrimary ?? false,
      displayOrder: img.displayOrder ?? 0,
    })),
  );
  const primaryIndex = Math.max(
    kept.findIndex((img) => img.isPrimary),
    0,
  );
  return kept.map((img, i) => ({
    url: img.url.trim(),
    isPrimary: i === primaryIndex,
    displayOrder: i,
  }));
}

/** Append an image. The set is empty before it, so it arrives as primary. */
export function addImage(
  images: readonly ImageSetEntry[],
  url: string,
): ImageSetEntry[] {
  return normalizeImageSet([...images, { url, isPrimary: false, displayOrder: images.length }]);
}

/** Drop one image; if it was the primary, the first survivor is promoted. */
export function removeImage(
  images: readonly ImageSetEntry[],
  index: number,
): ImageSetEntry[] {
  return normalizeImageSet(images.filter((_, i) => i !== index));
}

/** Exactly one primary — the image at `index`. Out-of-range is a no-op. */
export function setPrimary(
  images: readonly ImageSetEntry[],
  index: number,
): ImageSetEntry[] {
  if (index < 0 || index >= images.length) return [...images];
  return normalizeImageSet(
    images.map((img, i) => ({ ...img, isPrimary: i === index })),
  );
}

/** Swap with the neighbour in `direction` (-1 up, 1 down) and renumber. */
export function moveImage(
  images: readonly ImageSetEntry[],
  index: number,
  direction: -1 | 1,
): ImageSetEntry[] {
  const target = index + direction;
  if (index < 0 || target < 0 || target >= images.length) return [...images];
  const next = [...images];
  [next[index], next[target]] = [next[target], next[index]];
  return normalizeImageSet(next);
}

/** Rewrite one row's URL, leaving the invariant alone. */
export function editImage(
  images: readonly ImageSetEntry[],
  index: number,
  url: string,
): ImageSetEntry[] {
  if (index < 0 || index >= images.length) return [...images];
  return normalizeImageSet(images.map((img, i) => (i === index ? { ...img, url } : img)));
}
