import Image from "next/image";
import StockBadge from "./StockBadge";

interface ProductData {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: { name: string } | null;
  stockQuantity: number;
  badge: string | null;
}

interface Props {
  product: ProductData;
  onAdd: (product: ProductData) => void;
  transitionDelay?: number;
  priority?: boolean;
}

export default function ProductCard({
  product,
  onAdd,
  transitionDelay = 0,
  priority = false,
}: Props) {
  return (
    <div
      className="product-card fade-in visible"
      style={{ transitionDelay: `${transitionDelay}s` }}
      role="listitem"
    >
      <div className="product-card-image">
        <Image
          src={product.imageUrl || "/placeholder.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="product-card-img"
          loading={priority ? "eager" : "lazy"}
          priority={priority}
        />
        {product.badge && (
          <span className="product-card-badge">{product.badge}</span>
        )}
      </div>
      <div className="product-card-body">
        <div className="product-card-category">
          {product.category?.name || "General"}
        </div>
        <h3>{product.name}</h3>
        <p className="product-card-description">{product.description}</p>
        <div className="product-card-footer">
          <span className="product-card-price">
            ₹{Number(product.price).toFixed(2)}
          </span>
          <StockBadge stockQuantity={product.stockQuantity} />
          <button
            className="btn-add"
            disabled={product.stockQuantity <= 0}
            onClick={() => onAdd(product)}
          >
            {product.stockQuantity <= 0 ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}


