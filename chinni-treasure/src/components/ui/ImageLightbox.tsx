"use client";

import { useCallback, useEffect, useState } from "react";
import FallbackImage from "@/src/components/ui/FallbackImage";
import { PRODUCT_IMAGE_QUALITY, BLUR_PLACEHOLDER } from "@/src/lib/images";

/**
 * The Gallery & Lightbox module — the deep core.
 *
 * One viewer for "show this image full-screen and move through the list":
 * navigation with wrap-around, the keyboard contract (ArrowLeft/ArrowRight/
 * Escape while open), the counter, the empty/degraded states, and every
 * failure swap through FallbackImage. Zoom is core behavior behind an opt-in
 * `zoom` prop. Display-side picks (which images exist, which is primary)
 * belong to the Product display module — callers pass `imageUrls(product)`.
 *
 * Surfaces:
 * - <ProductImageGallery> (composition): thumbnails + main stage, opens this.
 * - Admin catalogue lightbox: rendered directly, `zoom` off.
 * - Product-form lightbox: rendered directly, `zoom` on.
 *
 * The overlay is intentionally NOT a focus-trapped modal — overlay semantics
 * belong to the Modal module's contract, not to an image viewer (the shared
 * classes already style this exactly like the previous viewers rendered it).
 */
export interface ImageLightboxProps {
  /** Ordered image URLs, primary first — `imageUrls(product)` from the display module. */
  images: string[];
  /** Index into `images` the viewer opens on; clamped to the list. */
  initialIndex?: number;
  /** Accessibility label prefix (the product name). */
  alt: string;
  /** Close callback: Escape, close button, or overlay backdrop click. */
  onClose: () => void;
  /** Opt-in wheel/button zoom with clamp + reset. */
  zoom?: boolean;
  /** Notified on user-driven navigation so a host composition can keep its
   * own stage selection in sync with what the viewer is showing. */
  onIndexChange?: (index: number) => void;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

export default function ImageLightbox({
  images,
  initialIndex = 0,
  alt,
  onClose,
  zoom = false,
  onIndexChange,
}: ImageLightboxProps) {
  const clamp = useCallback(
    (i: number) => Math.min(Math.max(i, 0), Math.max(images.length - 1, 0)),
    [images.length],
  );
  const [index, setIndex] = useState(() => clamp(initialIndex));
  const [zoomLevel, setZoomLevel] = useState(1);

  const hasMultiple = images.length > 1;
  const currentUrl = images[index] ?? "";

  // Re-open insurance, via React's documented render-phase adjustment: a
  // caller that keeps the viewer mounted and swaps the list content restarts
  // selection and zoom. Keyed on content (not array identity), so a parent
  // re-render that recomputes the same list cannot reset the customer's place.
  const imagesKey = images.join("\n");
  const [prevKey, setPrevKey] = useState(imagesKey);
  if (imagesKey !== prevKey) {
    setPrevKey(imagesKey);
    setIndex(clamp(initialIndex));
    setZoomLevel(1);
  }

  const goPrev = useCallback(() => {
    const next = (index - 1 + images.length) % images.length;
    setIndex(next);
    setZoomLevel(1);
    onIndexChange?.(next);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    const next = (index + 1) % images.length;
    setIndex(next);
    setZoomLevel(1);
    onIndexChange?.(next);
  }, [index, images.length, onIndexChange]);

  // Keyboard contract — while open only. No page-level grabbing: the old
  // customer gallery's open-page arrows were dropped deliberately (the
  // composition keeps a page-local exception listener when it wants them).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Never steal arrows from a focused editable — the form modal's lightbox
      // can be open while its inputs hold the caret. Escape still closes.
      const target = e.target as HTMLElement | null;
      const editable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (editable) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goPrev, goNext]);

  const zoomIn = useCallback(
    () => setZoomLevel((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX)),
    [],
  );
  const zoomOut = useCallback(
    () => setZoomLevel((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN)),
    [],
  );
  const zoomReset = useCallback(() => setZoomLevel(1), []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    },
    [zoomIn, zoomOut],
  );

  if (images.length === 0) {
    return (
      <div
        className="lightbox-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={`${alt} viewer`}
        onClick={onClose}
      >
        <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="lightbox-close" onClick={onClose} aria-label={`Close ${alt} viewer`}>
            ✕
          </button>
          <div className="gallery-empty-placeholder" style={{ color: "var(--white)" }}>
            No image available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} viewer`}
      onClick={onClose}
    >
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="lightbox-close" onClick={onClose} aria-label={`Close ${alt} viewer`}>
          ✕
        </button>

        {hasMultiple && (
          <>
            <button type="button" className="lightbox-nav lightbox-nav-prev" onClick={goPrev} aria-label={`Previous image for ${alt}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button type="button" className="lightbox-nav lightbox-nav-next" onClick={goNext} aria-label={`Next image for ${alt}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        <div className="lightbox-image-wrapper" onWheel={zoom ? handleWheel : undefined}>
          <FallbackImage
            key={currentUrl}
            src={currentUrl}
            alt={`${alt} — image ${index + 1} of ${images.length}`}
            fill
            sizes="90vw"
            className="lightbox-image"
            style={
              zoom
                ? { transform: `scale(${zoomLevel})`, transition: "transform 0.2s ease" }
                : undefined
            }
            quality={PRODUCT_IMAGE_QUALITY}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            priority
          />
        </div>

        {hasMultiple && (
          <div className="lightbox-counter">
            {index + 1} / {images.length}
          </div>
        )}

        {zoom && (
          <div className="lightbox-zoom-controls">
            <button
              type="button"
              className="lightbox-zoom-btn"
              onClick={zoomOut}
              disabled={zoomLevel <= ZOOM_MIN}
              aria-label="Zoom out"
              title="Zoom out"
            >
              −
            </button>
            <span className="lightbox-zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              className="lightbox-zoom-btn"
              onClick={zoomIn}
              disabled={zoomLevel >= ZOOM_MAX}
              aria-label="Zoom in"
              title="Zoom in"
            >
              +
            </button>
            {zoomLevel !== 1 && (
              <button
                type="button"
                className="lightbox-zoom-btn lightbox-zoom-reset"
                onClick={zoomReset}
                aria-label="Reset zoom"
                title="Reset zoom"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
