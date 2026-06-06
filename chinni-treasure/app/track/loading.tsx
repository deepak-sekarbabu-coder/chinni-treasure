export default function TrackLoading() {
  return (
    <div style={{ paddingTop: "72px" }}>
      <section className="order-hero">
        <div className="skeleton-text" style={{ width: "240px", height: "32px", margin: "0 auto 16px" }} />
        <div className="skeleton-text" style={{ width: "340px", height: "14px", margin: "0 auto" }} />
      </section>
      <section className="section" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="admin-stat-card" style={{ padding: "28px" }}>
          <div className="skeleton-block" style={{ width: "100%", height: "48px", borderRadius: "2px", marginBottom: "20px" }} />
          <div className="skeleton-block" style={{ width: "100%", height: "44px", borderRadius: "2px", marginBottom: "16px" }} />
          <div className="skeleton-block" style={{ width: "100%", height: "48px", borderRadius: "2px" }} />
        </div>
      </section>
    </div>
  );
}
