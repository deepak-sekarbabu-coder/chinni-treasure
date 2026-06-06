import Link from "next/link";

export default function NotFound() {
  return (
    <div className="error-page">
      <div className="error-page-inner">
        <span className="error-page-code">404</span>
        <h1 className="error-page-title">Page Not Found</h1>
        <p className="error-page-desc">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          <br />
          Let us guide you back to our curated collection.
        </p>
        <div className="error-page-actions">
          <Link href="/" className="btn btn-primary">
            Return Home
          </Link>
          <Link href="/catalogue" className="btn btn-secondary">
            Browse Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
