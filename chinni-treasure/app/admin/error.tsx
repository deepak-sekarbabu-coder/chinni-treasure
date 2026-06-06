"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <div className="admin-page-root">
      <div className="admin-top-header">
        <div className="section admin-header-row">
          <div>
            <div className="section-subtitle text-gold">Administrator Portal</div>
            <h1 className="admin-heading">Error</h1>
          </div>
        </div>
      </div>
      <div className="section section-top-lg">
        <div className="admin-stat-card" style={{ maxWidth: "540px", margin: "0 auto", textAlign: "center", padding: "48px 36px" }}>
          <div className="error-page-code" style={{ marginBottom: "16px" }}>!</div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--near-black)", marginBottom: "12px" }}>
            Dashboard Error
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "28px", lineHeight: "1.7" }}>
            Something went wrong while loading the admin dashboard.
            <br />
            Please try again or return to the dashboard.
          </p>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "24px", fontFamily: "monospace" }}>
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex gap-12 justify-center">
            <button type="button" className="btn btn-primary" onClick={reset}>
              Try Again
            </button>
            <Link href="/" className="btn btn-secondary">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
