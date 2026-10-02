import { SkeletonBlock, SkeletonText } from "@/src/components/ui/SkeletonLoader";

export default function OrderLoading() {
  return (
    <div style={{ paddingTop: "72px" }}>
      <section className="section order-checkout-section">
        <div className="section-header" style={{ marginBottom: "48px" }}>
          <SkeletonText width="100px" height="12px" style={{ margin: "0 auto 12px" }} />
          <SkeletonText width="220px" height="28px" style={{ margin: "0 auto 16px" }} />
          <SkeletonText width="340px" height="14px" style={{ margin: "0 auto" }} />
        </div>
        <div className="order-layout">
          <div>
            <div className="order-fieldset">
              <SkeletonText width="160px" height="20px" style={{ marginBottom: "24px" }} />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="form-group">
                  <SkeletonText width="80px" height="12px" style={{ marginBottom: "8px" }} />
                  <SkeletonBlock width="100%" height="44px" borderRadius="2px" />
                </div>
              ))}
            </div>
          </div>
          <div className="order-summary-sidebar">
            <div className="admin-stat-card">
              <SkeletonText width="140px" height="18px" style={{ marginBottom: "24px" }} />
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="skeleton-row" style={{ gap: "12px", marginBottom: "16px" }}>
                  <SkeletonBlock width="50px" height="60px" borderRadius="4px" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <SkeletonText width="120px" height="14px" style={{ marginBottom: "8px" }} />
                    <SkeletonText width="60px" height="12px" />
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
