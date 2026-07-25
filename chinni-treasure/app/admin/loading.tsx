export default function AdminLoading() {
  return (
    <div className="admin-page-root">
      <div className="admin-top-header">
        <div className="section admin-header-row">
          <div>
            <div className="skeleton-text" style={{ width: "180px", height: "16px", marginBottom: "12px" }} />
            <h1 className="admin-heading">
              <div className="skeleton-text" style={{ width: "280px", height: "32px" }} />
            </h1>
          </div>
        </div>
      </div>
      <div className="section section-top-lg">
        <div className="stats-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="admin-stat-card chart-skeleton" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="skeleton-text" style={{ width: "80px", height: "12px", marginBottom: "12px" }} />
              <div className="skeleton-text" style={{ width: "120px", height: "24px" }} />
            </div>
          ))}
        </div>
      </div>
      <div className="section section-top-md">
        <div className="charts-grid">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="admin-stat-card chart-skeleton" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="skeleton-text" style={{ width: "180px", height: "18px", marginBottom: "20px" }} />
              {Array.from({ length: 5 }).map((__, j) => (
                <div key={j} className="skeleton-row" style={{ marginBottom: "12px" }}>
                  <div className="skeleton-text" style={{ width: `${100 + (j * 8) % 40}px`, height: "12px" }} />
                  <div className="skeleton-text" style={{ width: "50px", height: "12px" }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
