"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import type { ProductImageData } from "./ProductCard";

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

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "ArrowRight") goNext();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goNext, goPrev]);

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
                <div className="gallery-main-image">
                    <Image
                        src={selectedImage.url}
                        alt={`${productName} - Image ${selectedIndex + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className={`gallery-main-img ${isTransitioning ? "fade" : ""}`}
                        priority
                    />
                </div>

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
                            <Image
                                src={image.url}
                                alt={`${productName} thumbnail ${idx + 1}`}
                                fill
                                sizes="80px"
                                className="gallery-thumb-img"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
