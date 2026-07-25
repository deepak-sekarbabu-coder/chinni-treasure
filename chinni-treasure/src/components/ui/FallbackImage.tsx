"use client";

import { useState, useCallback } from "react";
import Image, { type ImageProps } from "next/image";
import {
  OPTIMIZATION_DISABLED,
  markImageFailed,
  hasImageFailed,
} from "@/src/lib/image-fallback";

// ------------------------------------------------------------------
// FallbackImage
// ------------------------------------------------------------------
// Drop-in replacement for next/image that gracefully degrades when the
// image-optimization pipeline is unavailable (e.g. Vercel free-tier
// quota exhausted).
//
// Fallback strategy (checked in order):
//  1.  Hard kill-switch (NEXT_PUBLIC_IMAGE_UNOPTIMIZED=true) → <img>
//  2.  Previously-failed URL in localStorage → <img>
//  3.  Runtime load error via next/image → <img> + persist failure
// ------------------------------------------------------------------

type Props = ImageProps & { /** no extra props needed */ };

/**
 * Compute CSS for a plain <img> that mimics next/image's `fill` mode.
 * When `fill` is true the parent is position:relative and the image
 * is absolute + object-fit:cover.
 */
function fillStyles(): React.CSSProperties {
  return {
    objectFit: "cover",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  };
}

export default function FallbackImage({
  src,
  alt,
  fill,
  className,
  style,
  onError: onErrorProp,
  sizes,
  quality,
  placeholder,
  blurDataURL,
  priority,
  loading,
  width,
  height,
  ...rest
}: Props) {
  const srcStr = typeof src === "string" ? src : "";

  // Determine if we should use a plain <img> from the start
  const shouldBypassInit =
    OPTIMIZATION_DISABLED || hasImageFailed(srcStr);

  const [useFallback, setUseFallback] = useState(shouldBypassInit);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      // Record failure so we skip the optimizer next time
      markImageFailed(srcStr);
      setUseFallback(true);
      // Bubble up to the caller's own onError if provided
      onErrorProp?.(e as never);
    },
    [srcStr, onErrorProp],
  );

  // ---- Plain <img> fallback path -----------------------------------
  if (useFallback) {
    if (fill) {
      // When `fill` is set the parent container uses position:relative.
      // We replicate the absolute-fill behaviour that next/image uses.
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={srcStr}
          alt={alt as string}
          className={className}
          sizes={sizes as string}
          loading={priority ? "eager" : loading ?? "lazy"}
          decoding="async"
          style={{
            ...fillStyles(),
            ...style,
          }}
          {...rest}
        />
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={srcStr}
        alt={alt as string}
        width={width as number | undefined}
        height={height as number | undefined}
        className={className}
        sizes={sizes as string}
        loading={priority ? "eager" : loading ?? "lazy"}
        decoding="async"
        style={style}
        {...rest}
      />
    );
  }

  // ---- Normal next/image path --------------------------------------
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      style={style}
      sizes={sizes}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      priority={priority}
      loading={loading}
      width={width}
      height={height}
      onError={handleError}
      {...rest}
    />
  );
}
