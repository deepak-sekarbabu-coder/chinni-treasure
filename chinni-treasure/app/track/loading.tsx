import { SkeletonBlock, SkeletonText } from "@/src/components/ui/SkeletonLoader";

export default function TrackLoading() {
  return (
    <div style={{ paddingTop: "72px" }}>
      <section className="order-hero">
        <SkeletonText width="240px" height="32px" style={{ margin: "0 auto 16px" }} />
        <SkeletonText width="340px" height="14px" style={{ margin: "0 auto" }} />
      </section>
      <section className="section" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="admin-stat-card" style={{ padding: "28px" }}>
          <SkeletonBlock width="100%" height="48px" borderRadius="2px" style={{ marginBottom: "20px" }} />
          <SkeletonBlock width="100%" height="44px" borderRadius="2px" style={{ marginBottom: "16px" }} />
          <SkeletonBlock width="100%" height="48px" borderRadius="0px" />
        </div>
      </section>
    </div>
  );
}
