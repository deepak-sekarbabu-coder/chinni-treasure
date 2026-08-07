import type { NextConfig } from "next";

const CORS_HEADERS = [
  {
    key: "Access-Control-Allow-Origin",
    value: process.env.ALLOWED_ORIGIN || "*",
  },
  {
    key: "Access-Control-Allow-Methods",
    value: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  },
  {
    key: "Access-Control-Allow-Headers",
    value: "Content-Type, Authorization",
  },
  {
    key: "Access-Control-Max-Age",
    value: "86400",
  },
];

const nextConfig: NextConfig = {
  // Standalone output is only needed for self-hosting (Docker). Vercel deploys
  // serverless functions and never uses the standalone folder. Keeping it
  // enabled on Vercel breaks the build on Next 16.3+ (Turbopack): Vercel's
  // build adapter makes Turbopack skip emitting `.next/next-server.js.nft.json`,
  // but the standalone finalize step still requires it -> ENOENT
  // (vercel/next.js#96646 / #96657). Disable standalone when building on
  // Vercel (`VERCEL=1` is set by the platform during every build).
  output:
    process.env.VERCEL || process.env.NODE_ENV !== "production"
      ? undefined
      : "standalone",
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "sharp"],
  allowedDevOrigins: ['192.168.1.6'],
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  generateEtags: true,
  // Give slow database queries more time during static page generation.
  staticPageGenerationTimeout: 120,
  experimental: {
    optimizePackageImports: ["jspdf", "exceljs", "react-markdown", "jsbarcode"],
  },
  images: {
    // When the Vercel free-tier optimization quota is exhausted, set
    // NEXT_PUBLIC_IMAGE_UNOPTIMIZED=true in .env to disable the
    // optimizer at build time.  The FallbackImage component will
    // automatically render plain <img> tags instead.
    unoptimized: process.env.NEXT_PUBLIC_IMAGE_UNOPTIMIZED === "true",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Use a custom loader to pass remote images through without server-side
    // optimisation.  This avoids the built-in 30 s timeout that
    // next/image hits when the remote host (e.g. i.imgur.gg) is slow or
    // unreachable, which was causing 500 errors on product pages.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // Tuned for the actual rendered sizes used across the site:
    // - Product cards / gallery main images render at ~542px wide on desktop,
    //   so a 550 breakpoint avoids serving the oversized 768px variant that
    //   Lighthouse flagged (~504 KiB of avoidable bytes).
    // - 384 remains for thumbnails and the lightbox on small screens.
    deviceSizes: [384, 550, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
    qualities: [75, 85],
    // Cache optimised images for 5 minutes to reduce repeated fetches.
    minimumCacheTTL: 300,
  },

  async redirects() {
    return [
      {
        source: "/apple-touch-icon-precomposed.png",
        destination: "/apple-touch-icon.png",
        permanent: true,
      },
      {
        source: "/apple-touch-icon-120x120.png",
        destination: "/apple-touch-icon.png",
        permanent: true,
      },
      {
        source: "/apple-touch-icon-120x120-precomposed.png",
        destination: "/apple-touch-icon.png",
        permanent: true,
      },
    ];
  },

  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: CORS_HEADERS,
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=259200",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
