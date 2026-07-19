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
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "sharp"],
  allowedDevOrigins: ['192.168.1.6'],
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  generateEtags: true,
  // Give slow database queries more time during static page generation.
  staticPageGenerationTimeout: 120,
  experimental: {
    optimizePackageImports: ["jspdf", "exceljs"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Tuned for the actual rendered sizes used across the site:
    // - Product cards / gallery main images render at ~542px wide on desktop,
    //   so a 550 breakpoint avoids serving the oversized 768px variant that
    //   Lighthouse flagged (~504 KiB of avoidable bytes).
    // - 384 remains for thumbnails and the lightbox on small screens.
    deviceSizes: [384, 550, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
    qualities: [75, 85],
    minimumCacheTTL: 60,
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
