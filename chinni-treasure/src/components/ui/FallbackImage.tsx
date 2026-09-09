"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

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

  if (useFallback) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={srcStr}
        alt={alt as string}
        loading={priority ? "eager" : loading ?? "lazy"}
        decoding="async"
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
      onError={(e) => {
        setUseFallback(true);
        onError?.(e as never);
      }}
      {...rest}
    />
  );
}