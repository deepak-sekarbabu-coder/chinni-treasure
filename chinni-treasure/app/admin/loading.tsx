import { SkeletonText } from "@/src/components/ui/SkeletonLoader";

export default function AdminLoading() {
  return (
    <div className="admin-page-root">
      <div className="admin-top-header">
        <div className="section admin-header-row">
          <div>
            <SkeletonText width="180px" height="16px" style={{ marginBottom: "12px" }} />
            <h1 className="admin-heading">
              <SkeletonText width="280px" height="32px" />
            </h1>
          </div>
        </div>
      </div>
      <div className="section section-top-lg">
        <div className="stats-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="admin-stat-card chart-skeleton" style={{ animationDelay: `${i * 0.05}s` }}>
              <SkeletonText width="80px" height="12px" style={{ marginBottom: "12px" }} />
              <SkeletonText width="120px" height="24px" />
            </div>
          ))}
        </div>
      </div>
      <div className="section section-top-md">
        <div className="charts-grid">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="admin-stat-card chart-skeleton" style={{ animationDelay: `${i * 0.1}s` }}>
              <SkeletonText width="180px" height="18px" style={{ marginBottom: "20px" }} />
              {Array.from({ length: 5 }).map((__, j) => (
                <div key={j} className="skeleton-row" style={{ marginBottom: "12px" }}>
                  <SkeletonText width={`${100 + ((j * 8) % 40)}px`} height="12px" />
                  <SkeletonText width="50px" height="12px" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
