interface Props {
  fullPage?: boolean;
}

export default function LoadingSpinner({ fullPage }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      style={
        fullPage
          ? {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
            }
          : { textAlign: "center", padding: "60px 0" }
      }
    >
      <div className="loading-spinner" style={{ margin: "0 auto" }}></div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
