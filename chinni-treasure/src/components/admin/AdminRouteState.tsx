import type { ReactNode } from "react";

/**
 * Route-state module — the admin loading/error/not-found scaffold.
 *
 * Owns the shared chrome the admin error and not-found routes used to restate
 * as 38-line twins: the admin top header, the centred stat-card frame, and the
 * code / title / body typography. Each route keeps only its own copy —
 * heading, code, title, body, optional `extra`, and the actions — so the pair
 * cannot drift.
 *
 * Deliberately NOT marked "use client": it is presentational, so the server
 * `not-found` route can render it directly while the client `error`
 * boundary imports it into its own bundle.
 */
export interface AdminRouteStateProps {
  /** The admin header heading, e.g. "Error" or "Page Not Found". */
  heading: string;
  /** Big glyph above the card title, e.g. "!" or "404". */
  code: string;
  title: string;
  body: ReactNode;
  /** Optional block between the body and the actions (e.g. the error digest). */
  extra?: ReactNode;
  actions: ReactNode;
}

export default function AdminRouteState({
  heading,
  code,
  title,
  body,
  extra,
  actions,
}: AdminRouteStateProps) {
  return (
    <div className="admin-page-root">
      <div className="admin-top-header">
        <div className="section admin-header-row">
          <div>
            <div className="section-subtitle text-gold">Administrator Portal</div>
            <h1 className="admin-heading">{heading}</h1>
          </div>
        </div>
      </div>
      <div className="section section-top-lg">
        <div
          className="admin-stat-card"
          style={{ maxWidth: "540px", margin: "0 auto", textAlign: "center", padding: "48px 36px" }}
        >
          <div className="error-page-code" style={{ marginBottom: "16px" }}>
            {code}
          </div>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.5rem",
              color: "var(--near-black)",
              marginBottom: "12px",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.9rem",
              marginBottom: "28px",
              lineHeight: "1.7",
            }}
          >
            {body}
          </p>
          {extra}
          <div className="flex gap-12 justify-center">{actions}</div>
        </div>
      </div>
    </div>
  );
}
