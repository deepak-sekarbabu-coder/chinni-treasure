export default function OrderLoading() {
  return (
    <div style={{ paddingTop: "72px" }}>
      <section className="section order-checkout-section">
        <div className="section-header" style={{ marginBottom: "48px" }}>
          <div className="skeleton-text" style={{ width: "100px", height: "12px", margin: "0 auto 12px" }} />
          <div className="skeleton-text" style={{ width: "220px", height: "28px", margin: "0 auto 16px" }} />
          <div className="skeleton-text" style={{ width: "340px", height: "14px", margin: "0 auto" }} />
        </div>
        <div className="order-layout">
          <div>
            <div className="order-fieldset">
              <div className="skeleton-text" style={{ width: "160px", height: "20px", marginBottom: "24px" }} />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="form-group">
                  <div className="skeleton-text" style={{ width: "80px", height: "12px", marginBottom: "8px" }} />
                  <div className="skeleton-block" style={{ width: "100%", height: "44px", borderRadius: "2px" }} />
                </div>
              ))}
            </div>
          </div>
          <div className="order-summary-sidebar">
            <div className="admin-stat-card">
              <div className="skeleton-text" style={{ width: "140px", height: "18px", marginBottom: "24px" }} />
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="skeleton-row" style={{ gap: "12px", marginBottom: "16px" }}>
                  <div className="skeleton-block" style={{ width: "50px", height: "60px", borderRadius: "4px", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-text" style={{ width: "120px", height: "14px", marginBottom: "8px" }} />
                    <div className="skeleton-text" style={{ width: "60px", height: "12px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
