"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="error-page">
      <div className="error-page-inner">
        <span className="error-page-code">!</span>
        <h1 className="error-page-title">Something Went Wrong</h1>
        <p className="error-page-desc">
          An unexpected error occurred. Our team has been notified.
          <br />
          Please try again or return to our homepage.
        </p>
        {error.digest && (
          <p className="error-page-digest">Error ID: {error.digest}</p>
        )}
        <div className="error-page-actions">
          <button type="button" className="btn btn-primary" onClick={reset}>
            Try Again
          </button>
          <a href="/" className="btn btn-secondary">
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}
