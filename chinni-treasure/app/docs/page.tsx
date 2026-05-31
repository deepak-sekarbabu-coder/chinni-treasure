"use client";

import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";

// Swagger UI ships as ESM; this approach avoids the CSS import issue
export default function ApiDocsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    import("swagger-ui-react/swagger-ui.css");
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: "var(--font-sans, sans-serif)",
          color: "#666",
        }}
      >
        Loading API documentation…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <SwaggerUI url="/api/docs" />
    </div>
  );
}
