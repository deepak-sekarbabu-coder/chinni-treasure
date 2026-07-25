export default function Loading() {
  return (
    <div style={{ paddingTop: "72px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", gap: "40px" }}>
          <div style={{ flex: "1" }}>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ width: "120px", height: "20px", background: "#ddd", marginBottom: "8px", borderRadius: "4px" }} />
              <div style={{ width: "300px", height: "32px", background: "#ddd", borderRadius: "4px" }} />
            </div>
            <div style={{ marginBottom: "32px" }}>
              <div style={{ width: "180px", height: "28px", background: "#ddd", marginBottom: "16px", borderRadius: "4px" }} />
              <div style={{ width: "200px", height: "20px", background: "#ddd", borderRadius: "4px" }} />
            </div>
          </div>
          <div style={{ flex: "1" }}>
            <div style={{ aspectRatio: "3/4", background: "#eee", borderRadius: "8px", marginBottom: "20px" }} />
            <div style={{ display: "flex", gap: "12px" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ width: "80px", height: "80px", background: "#eee", borderRadius: "6px" }} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: "40px" }}>
          <div style={{ width: "200px", height: "18px", background: "#ddd", marginBottom: "16px", borderRadius: "4px" }} />
          <div style={{ width: "400px", height: "14px", background: "#ddd", marginBottom: "12px", borderRadius: "4px" }} />
          <div style={{ width: "350px", height: "14px", background: "#ddd", marginBottom: "12px", borderRadius: "4px" }} />
          <div style={{ width: "300px", height: "14px", background: "#ddd", borderRadius: "4px" }} />
        </div>
        <div style={{ display: "flex", gap: "16px", marginTop: "32px" }}>
          <div style={{ width: "120px", height: "48px", background: "#ddd", borderRadius: "6px" }} />
          <div style={{ width: "140px", height: "48px", background: "#ddd", borderRadius: "6px" }} />
        </div>
      </div>
    </div>
  );
}