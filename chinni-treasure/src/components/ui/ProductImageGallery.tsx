"use client";

import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import type { ProductImageData } from "./ProductCard";
import {
  PRODUCT_IMAGE_QUALITY,
  BLUR_PLACEHOLDER,
} from "@/src/lib/images";

interface Props {
    images: ProductImageData[];
    productName: string;
}

export default function ProductImageGallery({ images, productName }: Props) {
    // Compute initial selected index from primary image
    const [selectedIndex, setSelectedIndex] = useState(() => {
        const primaryIdx = images.findIndex((img) => img.isPrimary);
        return primaryIdx >= 0 ? primaryIdx : 0;
    });
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
    const lightboxRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const openLightbox = useCallback(() => {
        setLightboxOpen(true);
    }, []);

    const closeLightbox = useCallback(() => {
        setLightboxOpen(false);
    }, []);

    const goToImage = useCallback((index: number) => {
        if (index === selectedIndex || isTransitioning) return;
        setIsTransitioning(true);
        setSelectedIndex(index);
        setTimeout(() => setIsTransitioning(false), 300);
    }, [selectedIndex, isTransitioning]);

    const goNext = useCallback(() => {
        if (images.length <= 1 || isTransitioning) return;
        const next = (selectedIndex + 1) % images.length;
        goToImage(next);
    }, [selectedIndex, images.length, isTransitioning, goToImage]);

    const goPrev = useCallback(() => {
        if (images.length <= 1 || isTransitioning) return;
        const prev = (selectedIndex - 1 + images.length) % images.length;
        goToImage(prev);
    }, [selectedIndex, images.length, isTransitioning, goToImage]);

    const handleImageError = useCallback((index: number) => {
        setFailedImages((prev) => new Set(prev).add(index));
    }, []);

    // Keyboard navigation + lightbox close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && lightboxOpen) {
                closeLightbox();
                return;
            }
            if (lightboxOpen) {
                if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    goPrev();
                }
                if (e.key === "ArrowRight") {
                    e.preventDefault();
                    goNext();
                }
                return;
            }
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "ArrowRight") goNext();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goNext, goPrev, lightboxOpen, closeLightbox]);

    if (images.length === 0) {
        return (
            <div className="gallery-empty">
                <div className="gallery-empty-placeholder">No Image Available</div>
            </div>
        );
    }

    const selectedImage = images[selectedIndex];

    return (
        <div className="product-gallery" role="region" aria-label="Product image gallery">
            {/* Main Image */}
            <div className="gallery-main">
                <button
                    className="gallery-main-image"
                    onClick={openLightbox}
                    aria-label={`View ${productName} - Image ${selectedIndex + 1} full size`}
                    type="button"
                >
                    {failedImages.has(selectedIndex) ? (
                        <div className="gallery-empty-placeholder" style={{ position: "absolute", inset: 0 }}>Image unavailable</div>
                    ) : (
                        <Image
                            src={selectedImage.url}
                            alt={`${productName} - Image ${selectedIndex + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className={`gallery-main-img ${isTransitioning ? "fade" : ""}`}
                            quality={PRODUCT_IMAGE_QUALITY}
                            placeholder="blur"
                            blurDataURL={BLUR_PLACEHOLDER}
                            priority
                            onError={() => handleImageError(selectedIndex)}
                        />
                    )}
                </button>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            className="gallery-nav gallery-nav-prev"
                            onClick={goPrev}
                            aria-label="Previous image"
                            type="button"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button
                            className="gallery-nav gallery-nav-next"
                            onClick={goNext}
                            aria-label="Next image"
                            type="button"
                        >
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
                            {failedImages.has(idx) ? (
                                <div className="gallery-empty-placeholder" style={{ position: "absolute", inset: 0, fontSize: 10 }}>N/A</div>
                            ) : (
                                <Image
                                    src={image.url}
                                    alt={`${productName} thumbnail ${idx + 1}`}
                                    fill
                                    sizes="80px"
                                    className="gallery-thumb-img"
                                    quality={PRODUCT_IMAGE_QUALITY}
                                    placeholder="blur"
                                    blurDataURL={BLUR_PLACEHOLDER}
                                    onError={() => handleImageError(idx)}
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Lightbox / Fullscreen Image Viewer */}
            {lightboxOpen && (
                <div
                    className="lightbox-overlay"
                    ref={lightboxRef}
                    onClick={(e) => {
                        if (e.target === lightboxRef.current) {
                            closeLightbox();
                        }
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${productName} - Image ${selectedIndex + 1}`}
                >
                    <div className="lightbox-container">
                        {/* Close Button */}
                        <button
                            className="lightbox-close"
                            onClick={closeLightbox}
                            ref={closeButtonRef}
                            aria-label="Close fullscreen image"
                            type="button"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        {/* Previous Button */}
                        {images.length > 1 && (
                            <button
                                className="lightbox-nav lightbox-nav-prev"
                                onClick={goPrev}
                                aria-label="Previous image"
                                type="button"
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                        )}

                        {/* Image */}
                        <div className="lightbox-image-wrapper">
                            {failedImages.has(selectedIndex) ? (
                                <div className="gallery-empty-placeholder" style={{ position: "absolute", inset: 0 }}>Image unavailable</div>
                            ) : (
                                <Image
                                    src={selectedImage.url}
                                    alt={`${productName} - Image ${selectedIndex + 1}`}
                                    fill
                                    sizes="90vw"
                                    className="lightbox-image"
                                    quality={PRODUCT_IMAGE_QUALITY}
                                    placeholder="blur"
                                    blurDataURL={BLUR_PLACEHOLDER}
                                    priority
                                    onError={() => handleImageError(selectedIndex)}
                                />
                            )}
                        </div>

                        {/* Next Button */}
                        {images.length > 1 && (
                            <button
                                className="lightbox-nav lightbox-nav-next"
                                onClick={goNext}
                                aria-label="Next image"
                                type="button"
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        )}

                        {/* Counter */}
                        {images.length > 1 && (
                            <div className="lightbox-counter">
                                {selectedIndex + 1} / {images.length}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
