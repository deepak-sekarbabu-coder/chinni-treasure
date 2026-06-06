import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="admin-page-root">
      <div className="admin-top-header">
        <div className="section admin-header-row">
          <div>
            <div className="section-subtitle text-gold">Administrator Portal</div>
            <h1 className="admin-heading">Page Not Found</h1>
          </div>
        </div>
      </div>
      <div className="section section-top-lg">
        <div className="admin-stat-card" style={{ maxWidth: "540px", margin: "0 auto", textAlign: "center", padding: "48px 36px" }}>
          <div className="error-page-code" style={{ marginBottom: "16px" }}>404</div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--near-black)", marginBottom: "12px" }}>
            Not Found
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "28px", lineHeight: "1.7" }}>
            The admin page you&apos;re looking for doesn&apos;t exist.
          </p>
          <div className="flex gap-12 justify-center">
            <Link href="/admin" className="btn btn-primary">
              Back to Dashboard
            </Link>
            <Link href="/" className="btn btn-secondary">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
