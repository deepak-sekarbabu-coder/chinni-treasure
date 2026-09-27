"use client";

import { useCallback, useEffect, useState } from "react";
import FallbackImage from "@/src/components/ui/FallbackImage";
import ImageLightbox from "@/src/components/ui/ImageLightbox";
import { PRODUCT_IMAGE_QUALITY, BLUR_PLACEHOLDER } from "@/src/lib/images";
import type { ProductImage } from "@/src/lib/api/schemas";

/**
 * The Gallery & Lightbox module — the composition.
 *
 * Owns only what makes the detail page a gallery: the main-image stage, the
 * thumbnail strip, and opening the <ImageLightbox> core. Viewing behavior —
 * navigation, keyboard, counter, failure swap, zoom — is the core's, not
 * re-implemented here (this surface previously kept its own `failedImages`
 * set, which regressed the one-placeholder rule).
 *
 * Page-level arrow keys are the composition's one deliberate exception,
 * kept here as a local listener so the core's keyboard contract stays
 * lightbox-only: arrows navigate the stage when the lightbox is closed,
 * and the core takes them over when it is open.
 */
interface Props {
  images: ProductImage[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: Props) {
  // Initial selection: the primary image, else the first.
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const primaryIdx = images.findIndex((img) => img.isPrimary);
    return primaryIdx >= 0 ? primaryIdx : 0;
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const urls = images.map((img) => img.url);

  const goToImage = useCallback(
    (index: number) => {
      if (index >= 0 && index < images.length) setSelectedIndex(index);
    },
    [images.length],
  );

  const goPrev = useCallback(() => {
    setSelectedIndex((i) => (images.length ? (i - 1 + images.length) % images.length : 0));
  }, [images.length]);

  const goNext = useCallback(() => {
    setSelectedIndex((i) => (images.length ? (i + 1) % images.length : 0));
  }, [images.length]);

  // Page-local exception: arrows on the detail page drive the stage while the
  // lightbox is closed. The core owns them once it is open.
  useEffect(() => {
    if (lightboxOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, goPrev, goNext]);

  if (images.length === 0) {
    return (
      <div className="gallery-empty">
        <div className="gallery-empty-placeholder">No Image Available</div>
      </div>
    );
  }

  const selectedImage = images[selectedIndex] ?? images[0];

  return (
    <div className="product-gallery" role="region" aria-label="Product image gallery">
      {/* Main Image */}
      <div className="gallery-main">
        <button
          className="gallery-main-image"
          onClick={() => setLightboxOpen(true)}
          aria-label={`View ${productName} - Image ${selectedIndex + 1} full size`}
          type="button"
        >
          <FallbackImage
            src={selectedImage.url}
            alt={`${productName} - Image ${selectedIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="gallery-main-img"
            quality={PRODUCT_IMAGE_QUALITY}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            priority
          />
        </button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button className="gallery-nav gallery-nav-prev" onClick={goPrev} aria-label="Previous image" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button className="gallery-nav gallery-nav-next" onClick={goNext} aria-label="Next image" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="gallery-counter">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="gallery-thumbnails" role="tablist" aria-label="Image thumbnails">
          {images.map((image, idx) => (
            <button
              key={idx}
              className={`gallery-thumb ${idx === selectedIndex ? "active" : ""}`}
              onClick={() => goToImage(idx)}
              role="tab"
              aria-selected={idx === selectedIndex}
              aria-label={`View image ${idx + 1}${image.isPrimary ? " (primary)" : ""}`}
              type="button"
            >
              <FallbackImage
                src={image.url}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="gallery-thumb-img"
                quality={PRODUCT_IMAGE_QUALITY}
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
            </button>
          ))}
        </div>
      )}

      {/* The core owns everything from here: nav, keyboard, counter, failures.
          onIndexChange keeps the stage on the image the customer browsed to. */}
      {lightboxOpen && (
        <ImageLightbox
          images={urls}
          initialIndex={selectedIndex}
          alt={productName}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setSelectedIndex}
        />
      )}
    </div>
  );
}
