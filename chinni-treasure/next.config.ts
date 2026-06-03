import type { NextConfig } from "next";

const CORS_HEADERS = [
  {
    key: "Access-Control-Allow-Origin",
    value: process.env.ALLOWED_ORIGIN || "*",
  },
  {
    key: "Access-Control-Allow-Methods",
    value: "GET, POST, OPTIONS",
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
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  headers() {
    return [
      {
        source: "/api/track",
        headers: CORS_HEADERS,
      },
      {
        source: "/api/orders",
        headers: CORS_HEADERS,
      },
    ];
  },
};

export default nextConfig;
