import Image from "next/image";
import Link from "next/link";
import StockBadge from "./StockBadge";

export interface ProductImageData {
  id: string;
  url: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductData {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: { name: string } | null;
  stockQuantity: number;
  badge: string | null;
  images?: ProductImageData[];
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
  // Use primary image from images array, fall back to imageUrl
  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.imageUrl ||
    "/placeholder.svg";

  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div
      className={`product-card fade-in visible${isOutOfStock ? " out-of-stock" : ""}`}
      style={{ transitionDelay: `${transitionDelay}s` }}
      role="listitem"
    >
      <Link href={`/catalogue/${product.id}`} className="product-card-image-link">
        <div className="product-card-image">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="product-card-img"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
          />
          {product.badge && !isOutOfStock && (
            <span className="product-card-badge">{product.badge}</span>
          )}
          {isOutOfStock && (
            <div className="product-card-out-of-stock-overlay" aria-hidden="true">
              <span className="product-card-out-of-stock-label">Out of Stock</span>
              <span className="product-card-out-of-stock-sub">
                Please wait until we restock this
              </span>
            </div>
          )}
        </div>
      </Link>
      <div className="product-card-body">
        <div className="product-card-category">
          {product.category?.name || "General"}
        </div>
        <Link href={`/catalogue/${product.id}`} className="product-card-title-link">
          <h3>{product.name}</h3>
        </Link>
        <p className="product-card-description">{product.description}</p>
        <div className="product-card-footer">
          <span className="product-card-price">
            ₹{Number(product.price).toFixed(2)}
          </span>
          <StockBadge stockQuantity={product.stockQuantity} />
          <button
            className="btn-add"
            disabled={isOutOfStock}
            onClick={() => onAdd(product)}
          >
            {isOutOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}


