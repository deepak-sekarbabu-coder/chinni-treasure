import { SkeletonBlock, SkeletonText } from "@/src/components/ui/SkeletonLoader";

export default function Loading() {
  return (
    <div style={{ paddingTop: "72px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", gap: "40px" }}>
          <div style={{ flex: "1" }}>
            <div style={{ marginBottom: "24px" }}>
              <SkeletonText width="120px" height="20px" style={{ marginBottom: "8px" }} />
              <SkeletonText width="300px" height="32px" />
            </div>
            <div style={{ marginBottom: "32px" }}>
              <SkeletonText width="180px" height="28px" style={{ marginBottom: "16px" }} />
              <SkeletonText width="200px" height="20px" />
            </div>
          </div>
          <div style={{ flex: "1" }}>
            <SkeletonBlock
              width="100%"
              borderRadius="8px"
              style={{ aspectRatio: "3/4", marginBottom: "20px" }}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBlock key={i} width="80px" height="80px" borderRadius="6px" />
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: "40px" }}>
          <SkeletonText width="200px" height="18px" style={{ marginBottom: "16px" }} />
          <SkeletonText width="400px" height="14px" style={{ marginBottom: "12px" }} />
          <SkeletonText width="350px" height="14px" style={{ marginBottom: "12px" }} />
          <SkeletonText width="300px" height="14px" />
        </div>
        <div style={{ display: "flex", gap: "16px", marginTop: "32px" }}>
          <SkeletonBlock width="120px" height="48px" borderRadius="6px" />
          <SkeletonBlock width="140px" height="48px" borderRadius="6px" />
        </div>
      </div>
    </div>
  );
}
