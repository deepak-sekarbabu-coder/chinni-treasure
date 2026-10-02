import { CatalogueGridSkeleton } from "@/src/components/ui/SkeletonLoader";

export default function CatalogueLoading() {
  return (
    <div style={{ paddingTop: "72px" }}>
      <CatalogueGridSkeleton cardCount={3} />
    </div>
  );
}
