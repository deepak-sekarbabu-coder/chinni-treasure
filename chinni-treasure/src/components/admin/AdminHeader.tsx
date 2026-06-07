"use client";

import Link from "next/link";

interface Props {
  isExporting: boolean;
  isLoggingOut: boolean;
  onExport: () => void;
  onLogout: () => void;
}

export default function AdminHeader({ isExporting, isLoggingOut, onExport, onLogout }: Props) {
  return (
    <div className="admin-top-header">
      <div className="section admin-header-row">
        <div>
          <div className="section-subtitle text-gold">Administrator Portal</div>
          <h1 className="admin-heading">Dashboard</h1>
        </div>
        <div className="admin-header-actions">
          <Link href="/docs" className="btn btn-secondary btn-link btn-lg">
            API Docs
          </Link>
          <button
            className="btn btn-secondary btn-lg"
            onClick={onExport}
            disabled={isExporting || isLoggingOut}
          >
            {isExporting ? "Exporting..." : "Export Excel"}
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
