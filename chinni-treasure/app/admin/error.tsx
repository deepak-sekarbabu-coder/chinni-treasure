"use client";

import { useEffect } from "react";
import Link from "next/link";
import AdminRouteState from "@/src/components/admin/AdminRouteState";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <AdminRouteState
      heading="Error"
      code="!"
      title="Dashboard Error"
      body={
        <>
          Something went wrong while loading the admin dashboard.
          <br />
          Please try again or return to the dashboard.
        </>
      }
      extra={
        error.digest ? (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginBottom: "24px",
              fontFamily: "monospace",
            }}
          >
            Error ID: {error.digest}
          </p>
        ) : null
      }
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={reset}>
            Try Again
          </button>
          <Link href="/" className="btn btn-secondary">
            Return Home
          </Link>
        </>
      }
    />
  );
}
