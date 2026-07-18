export default function CategoryLoading() {
  return (
    <>
      <section className="catalogue-hero">
        <div className="catalogue-hero-inner">
          <div
            className="skeleton-text"
            style={{ width: "120px", height: "12px", marginBottom: "14px" }}
          />
          <div
            className="skeleton-text"
            style={{ width: "320px", height: "36px", marginBottom: "16px" }}
          />
          <div className="skeleton-text" style={{ width: "400px", height: "14px" }} />
        </div>
      </section>
      <section className="catalogue-section">
        <div className="section">
          <div className="section-header">
            <div
              className="skeleton-text"
              style={{ width: "140px", height: "12px", margin: "0 auto 12px" }}
            />
            <div
              className="skeleton-text"
              style={{ width: "280px", height: "28px", margin: "0 auto 16px" }}
            />
          </div>
          <div className="products-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="product-card chart-skeleton"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="product-card-image">
                  <div
                    className="skeleton-block"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
                <div className="product-card-body">
                  <div
                    className="skeleton-text skeleton-text-name"
                    style={{ marginBottom: "8px" }}
                  />
                  <div
                    className="skeleton-text"
                    style={{ width: "180px", height: "14px", marginBottom: "12px" }}
                  />
                  <div className="skeleton-text skeleton-text-price" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
