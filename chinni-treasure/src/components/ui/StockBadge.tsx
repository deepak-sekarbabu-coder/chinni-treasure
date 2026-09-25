import { stockHealth } from "@/src/lib/product-display";

interface Props {
  stockQuantity: number;
}

export default function StockBadge({ stockQuantity }: Props) {
  const state = stockHealth(stockQuantity);

  if (state === "out") {
    return <span className="stock-badge empty">Out of Stock</span>;
  }
  if (state === "low") {
    return (
      <span className="stock-badge low">Only {stockQuantity} left</span>
    );
  }
  return <span className="stock-badge in-stock">In Stock</span>;
}
