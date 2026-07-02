import type { ProductBadge } from "@prisma/client";

export const SEED_CATEGORIES = [
  { name: "Accessories", slug: "accessories", displayOrder: 1 },
  { name: "Apparel", slug: "apparel", displayOrder: 2 },
  { name: "Watches", slug: "watches", displayOrder: 3 },
  { name: "Home", slug: "home", displayOrder: 4 },
  { name: "Jewellery Organizer", slug: "organizer", displayOrder: 5 },
];

export interface SeedProduct {
  sku: string;
  name: string;
  categorySlug: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  imageUrl: string;
  additionalImages: string[];
  description: string;
  badge: ProductBadge | null;
}

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    sku: "0016",
    name: "Multicolor Bangles (Set of 36 pcs)",
    categorySlug: "accessories",
    price: 760,
    compareAtPrice: 999,
    stockQuantity: 1,
    imageUrl: "https://i.imgur.gg/noGuuZz-IMG_20260626_162815.jpg",
    additionalImages: [
      "https://i.imgur.gg/noGuuZz-IMG_20260626_162815.jpg",
      "https://i.imgur.gg/g8tTmuu-IMG_20260626_162929.jpg",
      "https://i.imgur.gg/7Hv0MI8-IMG_20260626_162919.jpg",
      "https://i.imgur.gg/T1lpaE6-IMG_20260626_162909.jpg",
      "https://i.imgur.gg/9pmUg87-IMG_20260626_162903.jpg",
      "https://i.imgur.gg/qKpe2PL-IMG_20260626_162837.jpg",
    ],
    description: "# Multi Color Bangles (Set of 36 pcs)\n\n## 🛍️ Product Details\n- **Price:** 760 Rs\n- **Color:** Multicolor\n- **Material:** Glass and metal type\n- **Size:** 2/4\n\n## ✨ Description\n- Delicate ghungroo(bell) embellishments create a melodious tinkling sound with every graceful movement of your wrist.\n- Crafted with meticulous attention to each bangle.\n- Intricately embraced with ghungroo and stone details.\n- Exceptional craftmanship to create a bold and eye-catching look.\n\n## 💎 Why Choose This?\n- Premium bangles set offered in a cost-effective range.\n- Perfect for festive occasions or weddings.",
    badge: "premium",
  },
  {
    sku: "0017",
    name: "Pink Velvet Bangle Set",
    categorySlug: "apparel",
    price: 860,
    compareAtPrice: 999,
    stockQuantity: 1,
    imageUrl: "https://i.imgur.gg/cArGP3I-IMG_20260626_155904.jpg",
    additionalImages: [
      "https://i.imgur.gg/cArGP3I-IMG_20260626_155904.jpg",
      "https://i.imgur.gg/eLJnyg4-IMG_20260626_160117.jpg",
      "https://i.imgur.gg/6qo3NPH-IMG_20260626_160241.jpg",
      "https://i.imgur.gg/Z3EdRTR-IMG_20260626_160254.jpg",
      "https://i.imgur.gg/1MFyVKJ-IMG_20260626_160300.jpg",
      "https://i.imgur.gg/5G1Zvce-IMG_20260626_160309.jpg",
    ],
    description: "# Pink Velvet Bangles (Set of 18 pcs)\n\n## 🛍️ Product Details\n- **Price:** 860 Rs\n- **Color:** Pink\n- **Material:** Premium Velvet with metal type\n- **Size:** 2/4\n\n## ✨ Description\n- Crafted with meticulous attention to each bangle.\n- Intricately embraced with kundan, pearl and stone details.\n- Exceptional craftmanship to create a bold and eye-catching look.\n\n## 💎 Why Choose This?\n- Premium bangles set offered in a cost-effective range.\n- Perfect for festive occasions or weddings.\n- Unique Premium collection & rare to find in other social platforms.",
    badge: "premium",
  },
  {
    sku: "0012 maroon",
    name: "Designer Bangle Organizer Box",
    categorySlug: "organizer",
    price: 799,
    compareAtPrice: 999,
    stockQuantity: 1,
    imageUrl: "https://i.imgur.gg/J2iAGgM-red-jewelry-box-front-view.jpg",
    additionalImages: [
      "https://i.imgur.gg/J2iAGgM-red-jewelry-box-front-view.jpg",
      "https://i.imgur.gg/sDdDdca-red-jewelry-box-interior-mirror.jpg",
      "https://i.imgur.gg/zMCxS9p-red-jewelry-box-open-empty.jpg",
      "https://i.imgur.gg/0sdktNV-red-jewelry-box-clasp-closeup.jpg",
      "https://i.imgur.gg/2rMp7Rf-red-jewelry-box-with-bangles.jpg",
    ],
    description: "# 6 – Rod Bangle Organizer\n\n## 📏 Dimensions\n- **Length:** 17 in / 44 cm\n- **Width:** 10 in / 26 cm\n\n## 🎨 Appearance\n- **Color:** Maroon\n- **Material:** Engineered wood with premium fabric cutwork\n\n## ✨ Special Features\n- Lightweight yet sturdy design\n- Spacious storage with 6 rods\n- Convenient handle for portability\n- Dual secure locks for safety\n- Built-in mirror for added utility\n\n## 📝 Product Description\nCrafted to protect what matters most. Premium bangle organizer with a luxurious designer finish, secure lock and sturdy design to safely organize your precious bangle collection.\n\n## 💎 Why Choose This Treasure?\n- Unique handcrafted masterpiece\n- Tuff to find this hidden gem in other social platforms\n- Luxurious product at a cost-effective range\n- Beauty begins with organization\n- Give your cherished bangles the elegant home they deserve.",
    badge: "limited",
  },
  {
    sku: "0013 cream white",
    name: "Designer Bangle Organizer Box",
    categorySlug: "organizer",
    price: 799,
    compareAtPrice: 999,
    stockQuantity: 1,
    imageUrl: "https://i.imgur.gg/ABT4Rup-white-jewelry-box-closed-front.jpg",
    additionalImages: [
      "https://i.imgur.gg/ABT4Rup-white-jewelry-box-closed-front.jpg",
      "https://i.imgur.gg/doeveL6-white-jewelry-box-front-view.jpg",
      "https://i.imgur.gg/6vOk9qz-white-jewelry-box-interior-mirror.jpg",
      "https://i.imgur.gg/5bKICFV-white-jewelry-box-open-empty.jpg",
      "https://i.imgur.gg/guiu1cH-white-jewelry-box-open-mirror.jpg",
      "https://i.imgur.gg/1nSpFtz-red-jewelry-box-with-bangles.jpg",
    ],
    description: "# 6 – Rod Bangle Organizer\n\n## 📏 Dimensions\n- **Length:** 17 in / 44 cm\n- **Width:** 10 in / 26 cm\n\n## 🎨 Appearance\n- **Color:** Cream White\n- **Material:** Engineered wood with premium fabric cutwork\n\n## ✨ Special Features\n- Lightweight yet sturdy design\n- Spacious storage with 6 rods\n- Convenient handle for portability\n- Dual secure locks for safety\n- Built-in mirror for added utility\n\n## 📝 Product Description\nCrafted to protect what matters most. Premium bangle organizer with a luxurious designer finish, secure lock and sturdy design to safely organize your precious bangle collection.\n\n## 💎 Why Choose This Treasure?\n- Unique handcrafted masterpiece\n- Tuff to find this hidden gem in other social platforms\n- Luxurious product at a cost-effective range\n- Beauty begins with organization\n- Give your cherished bangles the elegant home they deserve.",
    badge: "limited",
  },
];
