"use client";

import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";

// Swagger UI ships as ESM; dynamic import avoids the CSS import bundling issue
export default function ApiDocsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    import("swagger-ui-react/swagger-ui.css");
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="docs-loading">
        <div className="docs-loading-spinner" />
        <p>Loading API documentation…</p>
      </div>
    );
  }

  return (
    <div className="docs-page">
      <div className="docs-header">
        <h1 className="docs-title">API Documentation</h1>
        <p className="docs-subtitle">
          Explore the Chinni Treasure REST API — try endpoints, view schemas, and see responses.
        </p>
      </div>
      <div className="docs-content">
        <SwaggerUI url="/api/docs" docExpansion="list" defaultModelsExpandDepth={1} filter={true} tryItOutEnabled={false} />
      </div>
    </div>
  );
}
