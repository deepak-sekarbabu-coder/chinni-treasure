import type { ProductBadge } from "@prisma/client";

export const SEED_CATEGORIES = [
  { name: "Accessories", slug: "accessories", displayOrder: 1 },
  { name: "Apparel", slug: "apparel", displayOrder: 2 },
  { name: "Watches", slug: "watches", displayOrder: 3 },
  { name: "Home", slug: "home", displayOrder: 4 },
];

export interface SeedProduct {
  sku: string;
  name: string;
  categorySlug: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  description: string;
  badge: ProductBadge | null;
}

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    sku: "LUX-WAL-001",
    name: "Artisan Leather Wallet",
    categorySlug: "accessories",
    price: 89.0,
    stockQuantity: 15,
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=700&fit=crop",
    description: "Hand-stitched Italian full-grain leather wallet with RFID protection. Ages beautifully over time.",
    badge: "bestseller",
  },
  {
    sku: "LUX-SCF-001",
    name: "Premium Silk Scarf",
    categorySlug: "apparel",
    price: 129.0,
    stockQuantity: 8,
    imageUrl: "https://copilot.microsoft.com/th/id/BCO.3992779c-884a-4f83-afcb-b4b45a3217e6.png",
    description: "Luxurious 100% mulberry silk scarf with hand-rolled edges. A timeless addition to any wardrobe.",
    badge: "new",
  },
  {
    sku: "LUX-WAT-001",
    name: "Handcrafted Timepiece",
    categorySlug: "watches",
    price: 349.0,
    stockQuantity: 5,
    imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=700&fit=crop",
    description: "Swiss quartz movement encased in polished stainless steel with sapphire crystal glass.",
    badge: "premium",
  },
  {
    sku: "LUX-PER-001",
    name: "Crystal Perfume Bottle",
    categorySlug: "home",
    price: 199.0,
    stockQuantity: 3,
    imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=700&fit=crop",
    description: "Hand-blown crystal bottle with 24k gold-plated accents. Each piece is uniquely crafted.",
    badge: "limited",
  },
  {
    sku: "LUX-BLT-001",
    name: "Italian Leather Belt",
    categorySlug: "accessories",
    price: 159.0,
    stockQuantity: 12,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=700&fit=crop",
    description: "Full-grain Italian leather belt with a brushed gold-plated buckle. Width: 35mm.",
    badge: null,
  },
  {
    sku: "LUX-THR-001",
    name: "Cashmere Throw Blanket",
    categorySlug: "home",
    price: 279.0,
    stockQuantity: 6,
    imageUrl: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=600&h=700&fit=crop",
    description: "Pure Mongolian cashmere throw in a heritage twill weave. Exceptionally soft and warm.",
    badge: "luxury",
  },
];
