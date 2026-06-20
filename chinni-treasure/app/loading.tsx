export default function RootLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <div className="route-loading-inner">
        <div className="loading-spinner" />
        <p className="route-loading-text">Loading…</p>
      </div>
    </div>
  );
}
