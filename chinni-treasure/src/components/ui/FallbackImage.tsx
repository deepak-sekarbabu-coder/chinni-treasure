"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { IMAGE_UNAVAILABLE_PLACEHOLDER } from "@/src/lib/images";

const OPTIMIZATION_DISABLED =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_IMAGE_UNOPTIMIZED === "true";

export default function FallbackImage({
  src,
  alt,
  fill,
  placeholder,
  blurDataURL,
  priority,
  quality,
  loading,
  onError,
  ...rest
}: ImageProps) {
  const srcStr = typeof src === "string" ? src : "";
  const [useFallback, setUseFallback] = useState(OPTIMIZATION_DISABLED);
  // The src that broke, not a boolean — a new src auto-resets the failure
  // (the admin lightbox reuses one instance across previews).
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc !== null && failedSrc === srcStr;
  // Empty src fails upfront: next/image throws on "" and a broken icon
  // teaches nothing. One shared placeholder for null AND load failure.
  const showPlaceholder = failed || !srcStr;

  const handleError = (e: never) => {
    setUseFallback(true);
    setFailedSrc(srcStr);
    onError?.(e);
  };

  if (useFallback || showPlaceholder) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={showPlaceholder ? IMAGE_UNAVAILABLE_PLACEHOLDER : srcStr}
        alt={alt as string}
        loading={priority ? "eager" : loading ?? "lazy"}
        decoding="async"
        onError={showPlaceholder ? undefined : (e) => handleError(e as never)}
        {...rest}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      priority={priority}
      quality={quality}
      loading={loading}
      onError={(e) => handleError(e as never)}
      {...rest}
    />
  );
}