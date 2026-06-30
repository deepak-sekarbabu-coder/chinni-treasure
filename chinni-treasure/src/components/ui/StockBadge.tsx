interface Props {
  stockQuantity: number;
}

export default function StockBadge({ stockQuantity }: Props) {
  if (stockQuantity <= 0) {
    return <span className="stock-badge empty">Out of Stock</span>;
  }
  if (stockQuantity > 1 && stockQuantity <= 3) {
    return (
      <span className="stock-badge low">Only {stockQuantity} left</span>
    );
  }
  return <span className="stock-badge in-stock">In Stock</span>;
}
