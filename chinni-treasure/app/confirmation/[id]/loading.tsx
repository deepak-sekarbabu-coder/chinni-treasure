import { SkeletonText } from "@/src/components/ui/SkeletonLoader";

export default function ConfirmationLoading() {
  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--cream-light)", margin: "0 auto 24px" }}>
          <div className="loading-spinner" style={{ width: "100%", height: "100%", border: "3px solid rgba(212, 175, 55, 0.15)", borderTopColor: "var(--gold)" }} />
        </div>
        <SkeletonText width="200px" height="24px" style={{ margin: "0 auto 12px" }} />
        <SkeletonText width="280px" height="14px" style={{ margin: "0 auto" }} />
      </div>
    </div>
  );
}
