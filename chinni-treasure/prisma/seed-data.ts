import type { ProductBadge } from "@prisma/client";

export const SEED_CATEGORIES = [
  {
    "name": "Clutches",
    "slug": "clutches",
    "description": null,
    "displayOrder": 1,
    "isActive": true
  },
  {
    "name": "Bangles",
    "slug": "bangles",
    "description": null,
    "displayOrder": 2,
    "isActive": true
  },
  {
    "name": "Jewellery",
    "slug": "jewellery",
    "description": null,
    "displayOrder": 3,
    "isActive": true
  },
  {
    "name": "Bangle Organizer",
    "slug": "organizer",
    "description": null,
    "displayOrder": 4,
    "isActive": true
  },
  {
    "name": "Bracelets",
    "slug": "bracelet",
    "description": null,
    "displayOrder": 5,
    "isActive": true
  }
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
    "sku": "0005",
    "name": "Golden Flower Glam Clutch",
    "categorySlug": "clutches",
    "price": 2050,
    "compareAtPrice": 2599,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/KubkjRp-IMG_20260705_164746.jpg",
    "description": "# Golden Flower Glam Clutch\n\n## 🛍️ Product Details\n- **Price:** 2050 Rs  \n- **Color:** Gold\n\n## ✨ Features\n- Decorative lock, detachable gold chain, premium quality gold frame, metallic gold finish handle, designer gold fabric at the back.\n\n## ✨ Description\n- A Luxurious clutch in a glam look crafted with meticulous premium stone embellishment details.\n- A Structured rectangular shape & a gold toned frame that makes it stand out as a statement.\n- Suits for luxury occasions, wedding, festive & bridesmaid.\n- Premium shining stonework for a rich look.\n- Spacious yet compact size, easy to carry for events and functions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "luxury",
    "additionalImages": [
      "https://i.imgur.gg/KubkjRp-IMG_20260705_164746.jpg",
      "https://i.imgur.gg/MpnlvKu-IMG_20260705_164715.jpg",
      "https://i.imgur.gg/XEcEMCr-IMG_20260705_171521.jpg",
      "https://i.imgur.gg/7hHNIn9-IMG_20260705_171539.jpg",
      "https://i.imgur.gg/9DIwgl3-IMG_20260705_171554.jpg",
      "https://i.imgur.gg/CBgVXRF-IMG_20260705_171607.jpg",
      "https://i.imgur.gg/f4EAsWV-IMG_20260705_164657.jpg",
      "https://i.imgur.gg/IM3pHOC-IMG_20260705_164705.jpg"
    ]
  },
  {
    "sku": "0002",
    "name": "Golden Luxe Pearl Clutch",
    "categorySlug": "clutches",
    "price": 1650,
    "compareAtPrice": 1999,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/YGmcHhj-IMG_20260705_163627.jpg",
    "description": "# Golden Luxe Pearl Clutch\n\n## 🛍️ Product Details\n- **Price:** 1650 Rs  \n- **Color:** Gold\n\n## Features\n-  A front flap closure, premium stone details on handle, handcrafted beadwork, detachable chain, soft premium fabric inside, metallic gold tone finish at the back.\n\n## ✨ Description\n- A Luxurious clutch in a glam look embellished with premium pearls & stone details.\n- A structured rectangular shape, & a semicircular handle intricated with stone details that makes it standout as a statement.\n- Suits for bridesmaid, wedding, luxury occasion, festive & cocktail party.\n- Spacious yet compact size, easy to carry for events and functions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium pearls and stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "luxury",
    "additionalImages": [
      "https://i.imgur.gg/bqwaNy5-IMG_20260705_163714.jpg",
      "https://i.imgur.gg/2prDVur-IMG_20260705_163620.jpg",
      "https://i.imgur.gg/CaSUkND-IMG_20260705_163606.jpg",
      "https://i.imgur.gg/asnOI23-IMG_20260705_163534.jpg",
      "https://i.imgur.gg/TbMHSBd-IMG_20260705_163729.jpg",
      "https://i.imgur.gg/2ZTQdJt-IMG_20260705_163538.jpg",
      "https://i.imgur.gg/uMICzTw-IMG_20260705_163602.jpg",
      "https://i.imgur.gg/YGmcHhj-IMG_20260705_163627.jpg"
    ]
  },
  {
    "sku": "0004",
    "name": "Silver Fringe Clutch",
    "categorySlug": "clutches",
    "price": 1650,
    "compareAtPrice": 1999,
    "stockQuantity": 0,
    "imageUrl": "https://i.imgur.gg/dEvA4vE-IMG_20260705_165128.jpg",
    "description": "# Silver Fringe Clutch\n\n## 🛍️ Product Details\n- **Price:** 1650Rs  \n- **Color:** Silver\n\n## Features\n-  Decorative lock clasp, Detachable gold chain, rhinestone fringe, marquise cut crystals, premium fine seed beads, satin fabric inside, premium velvet finish at the back, gold metal handle.\n\n## ✨ Description\n- A luxurious clutch in a glam look embellished with premium fine seed beads and rhinestone fringe details with premium metallic gold finish handle.\n- Suits for bridesmaid, wedding, luxury occasion, festive and cocktail party.\n- Spacious yet compact size, easy to carry for events and functions.\n- Premium shining stone details for a rich look.\n\n## 💎 Why Choose This Treasure?\n- Crafted with meticulous attention.\n- Intricately embellished with crystals, fine seed beads and premium Rhinestone fringe details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Premium gold finish handle.",
    "badge": "luxury",
    "additionalImages": [
      "https://i.imgur.gg/dEvA4vE-IMG_20260705_165128.jpg",
      "https://i.imgur.gg/XQ1WDRG-IMG_20260705_170804.jpg",
      "https://i.imgur.gg/y7bKdkd-IMG_20260705_170706.jpg",
      "https://i.imgur.gg/ExV2tjL-IMG_20260705_170653.jpg",
      "https://i.imgur.gg/6Dk9y30-IMG_20260705_170727.jpg",
      "https://i.imgur.gg/hGBHf4O-IMG_20260705_170657.jpg",
      "https://i.imgur.gg/Fcae0PT-IMG_20260705_170717.jpg"
    ]
  },
  {
    "sku": "0012",
    "name": "Designer Bangle Organizer Box",
    "categorySlug": "organizer",
    "price": 799,
    "compareAtPrice": 999,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/J2iAGgM-red-jewelry-box-front-view.jpg",
    "description": "# 6 – Rod Bangle Organizer\n\n## 📏 Dimensions\n- **Length:** 17 in / 44 cm\n- **Width:** 10 in / 26 cm\n\n## 🎨 Appearance\n- **Color:** Maroon\n- **Material:** Engineered wood with premium fabric cutwork\n\n## ✨ Special Features\n- Lightweight yet sturdy design\n- Spacious storage with 6 rods\n- Convenient handle for portability\n- Dual secure locks for safety\n- Built-in mirror for added utility\n\n## 📝 Product Description\nCrafted to protect what matters most. Premium bangle organizer with a luxurious designer finish, secure lock and sturdy design to safely organize your precious bangle collection.\n\n## 💎 Why Choose This Treasure?\n- Unique handcrafted masterpiece\n- Tuff to find this hidden gem in other social platforms\n- Luxurious product at a cost-effective range\n- Beauty begins with organization\n- Give your cherished bangles the elegant home they deserve.",
    "badge": "limited",
    "additionalImages": [
      "https://i.imgur.gg/J2iAGgM-red-jewelry-box-front-view.jpg",
      "https://i.imgur.gg/sDdDdca-red-jewelry-box-interior-mirror.jpg",
      "https://i.imgur.gg/zMCxS9p-red-jewelry-box-open-empty.jpg",
      "https://i.imgur.gg/0sdktNV-red-jewelry-box-clasp-closeup.jpg",
      "https://i.imgur.gg/2rMp7Rf-red-jewelry-box-with-bangles.jpg"
    ]
  },
  {
    "sku": "0013",
    "name": "Designer Bangle Organizer Box",
    "categorySlug": "organizer",
    "price": 799,
    "compareAtPrice": 999,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/ABT4Rup-white-jewelry-box-closed-front.jpg",
    "description": "# 6 – Rod Bangle Organizer\n\n## 📏 Dimensions\n- **Length:** 17 in / 44 cm\n- **Width:** 10 in / 26 cm\n\n## 🎨 Appearance\n- **Color:** Cream White\n- **Material:** Engineered wood with premium fabric cutwork\n\n## ✨ Special Features\n- Lightweight yet sturdy design\n- Spacious storage with 6 rods\n- Convenient handle for portability\n- Dual secure locks for safety\n- Built-in mirror for added utility\n\n## 📝 Product Description\nCrafted to protect what matters most. Premium bangle organizer with a luxurious designer finish, secure lock and sturdy design to safely organize your precious bangle collection.\n\n## 💎 Why Choose This Treasure?\n- Unique handcrafted masterpiece\n- Tuff to find this hidden gem in other social platforms\n- Luxurious product at a cost-effective range\n- Beauty begins with organization\n- Give your cherished bangles the elegant home they deserve.",
    "badge": "limited",
    "additionalImages": [
      "https://i.imgur.gg/ABT4Rup-white-jewelry-box-closed-front.jpg",
      "https://i.imgur.gg/doeveL6-white-jewelry-box-front-view.jpg",
      "https://i.imgur.gg/6vOk9qz-white-jewelry-box-interior-mirror.jpg",
      "https://i.imgur.gg/5bKICFV-white-jewelry-box-open-empty.jpg",
      "https://i.imgur.gg/guiu1cH-white-jewelry-box-open-mirror.jpg",
      "https://i.imgur.gg/1nSpFtz-red-jewelry-box-with-bangles.jpg"
    ]
  },
  {
    "sku": "0011",
    "name": "Sparkly Rose Gold Clutch",
    "categorySlug": "clutches",
    "price": 850,
    "compareAtPrice": 999,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/nlrXFTJ-IMG_20260705_174428.jpg",
    "description": "# Sparkly Rose Gold Clutch\n\n## 🛍️ Product Details\n- **Price:** 850Rs  \n- **Color:** Rose Gold\n\n## ✨ Features\n- Detachable gold chain, designer shimmer textured finish, a structured rectangular shape with rounded edges and a gold-tone top clasp.\n\n## ✨ Description\n- A beautiful clutch that combines sparkle elegance & convenience in one luxurious design.\n- This elegant clutch is designed to elevate any outfit with its shimmering finish & premium gold frame detailing.\n- Compact shape makes it easy to carry boldly & glow beautifully.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium designer finish details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium rose gold finish and spacious to keep your things safe.",
    "badge": "limited",
    "additionalImages": [
      "https://i.imgur.gg/nlrXFTJ-IMG_20260705_174428.jpg",
      "https://i.imgur.gg/njnOxwx-IMG_20260705_174453.jpg",
      "https://i.imgur.gg/vKPgZLR-IMG_20260705_174457.jpg",
      "https://i.imgur.gg/LMbwrKE-IMG_20260705_174533.jpg",
      "https://i.imgur.gg/axZcVJt-IMG_20260705_174520.jpg",
      "https://i.imgur.gg/4h74Pfk-IMG_20260705_174424.jpg",
      "https://i.imgur.gg/66TKz7j-IMG_20260705_174411.jpg"
    ]
  },
  {
    "sku": "0010",
    "name": "Sparkly Gold Clutch",
    "categorySlug": "clutches",
    "price": 850,
    "compareAtPrice": 999,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/yqos8ez-IMG_20260705_175739.jpg",
    "description": "# Sparkly Gold Clutch\n\n## 🛍️ Product Details\n- **Price:** 850Rs  \n- **Color:** Gold\n\n## ✨ Features\n- Detachable gold chain, designer shimmer textured finish, a structured rectangular shape with rounded edges and a gold-tone top clasp.\n\n## ✨ Description\n- A beautiful clutch that combines sparkle elegance & convenience in one luxurious design.\n- This elegant clutch is designed to elevate any outfit with its shimmering finish & premium gold frame detailing.\n- Compact shape makes it easy to carry boldly & glow beautifully.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium designer finish.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "limited",
    "additionalImages": [
      "https://i.imgur.gg/yqos8ez-IMG_20260705_175739.jpg",
      "https://i.imgur.gg/QThhg52-IMG_20260705_175744.jpg",
      "https://i.imgur.gg/Nlupd4i-IMG_20260705_175753.jpg",
      "https://i.imgur.gg/i6E0OCb-IMG_20260705_175847.jpg",
      "https://i.imgur.gg/HcxJEUk-IMG_20260705_175851.jpg",
      "https://i.imgur.gg/93LZT4Z-IMG_20260705_175908.jpg"
    ]
  },
  {
    "sku": "0009",
    "name": "Gold Sparkle Clutch",
    "categorySlug": "clutches",
    "price": 1050,
    "compareAtPrice": 1299,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/m7e3KzM-IMG_20260705_180129.jpg",
    "description": "# Gold Sparkle Clutch\n\n## 🛍️ Product Details\n- **Price:** 1050 Rs  \n- **Color:** Gold\n\n## ✨ Features\n- Gem Clasp, Premium gold frame, semicircular handle, detachable gold chain, Handcrafted gold texture.\n\n## ✨ Description\n- A Premium clutch with faceted gem clasp & polished gold-tone frame with handle & detachable gold chain.\n- Handcrafted textured gold finish for a unique artisan look.\n- The gold shimmering textured finish creates a premium contrast that feels both modern & classic.\n- Suits for indo-western outfit, events, parties & special occasions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium gemstone and sparkle details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/m7e3KzM-IMG_20260705_180129.jpg",
      "https://i.imgur.gg/57cCUYz-IMG_20260705_180006.jpg",
      "https://i.imgur.gg/mErRpgk-IMG_20260705_180016.jpg",
      "https://i.imgur.gg/GR1Il6M-IMG_20260705_180024.jpg",
      "https://i.imgur.gg/sJIC6Ga-IMG_20260705_180029.jpg",
      "https://i.imgur.gg/xYw4H4z-IMG_20260705_180050.jpg",
      "https://i.imgur.gg/pDA7A25-IMG_20260705_180107.jpg",
      "https://i.imgur.gg/grPiUwL-IMG_20260705_180114.jpg"
    ]
  },
  {
    "sku": "0008",
    "name": "Silver Sparkle Clutch",
    "categorySlug": "clutches",
    "price": 1050,
    "compareAtPrice": 1299,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/Edoe0pu-IMG_20260705_175047.jpg",
    "description": "# Silver Sparkle Clutch\n\n## 🛍️ Product Details\n- **Price:** 1050 Rs  \n- **Color:** Silver\n\n## ✨ Features\n- Gem Clasp, Premium gold frame, semicircular handle, detachable gold chain, Handcrafted silver texture.\n\n## ✨ Description\n- A Premium clutch with faceted gem clasp & polished gold-tone frame with handle & detachable gold chain.\n- Handcrafted textured silver finish for a unique artisan look.\n- The silver shimmering textured finish creates a premium contrast that feels both modern & classic.\n- Suits for indo-western outfit, events, parties & special occasions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium gemstone and sparkle details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/Edoe0pu-IMG_20260705_175047.jpg",
      "https://i.imgur.gg/ijVSnwz-IMG_20260705_175110.jpg",
      "https://i.imgur.gg/RkvX1Vq-IMG_20260705_175128.jpg",
      "https://i.imgur.gg/A5B6juf-IMG_20260705_175157.jpg",
      "https://i.imgur.gg/aabhIRs-IMG_20260705_175203.jpg",
      "https://i.imgur.gg/qGxLZtT-IMG_20260705_175212.jpg",
      "https://i.imgur.gg/jPcQ4gh-IMG_20260705_175234.jpg"
    ]
  },
  {
    "sku": "0015",
    "name": "Royal Queen Bangles (Set of 36 pcs)",
    "categorySlug": "bangles",
    "price": 860,
    "compareAtPrice": 999,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/4Io8TUt-WhatsApp_Image_2026-07-02_at_10.06.00_AM_(1).jpeg",
    "description": "# Royal Queen Bangles (Set of 36pcs)\n\n## 🛍️ Product Details\n- **Price:** 860 Rs  \n- **Color:** Bottle Green\n- **Material:**Glass & metal type  \n- **Size:** 2/4  \n\n## ✨ Description\n- Crafted with meticulous attention to each bangle.\n- Intricately embellished with emerald, ruby, pearl and stone details.\n\n## 💎 Why Choose This?\n- Royal bangles set in a cost-effective range.\n- Exceptional craftmanship to create a bold and eye-catching look.\n- Unique premium collection and rare to find in other social platforms.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/4Io8TUt-WhatsApp_Image_2026-07-02_at_10.06.00_AM_(1).jpeg",
      "https://i.imgur.gg/mqx0ztT-WhatsApp_Image_2026-07-02_at_10.06.00_AM.jpeg",
      "https://i.imgur.gg/1diJnly-WhatsApp_Image_2026-07-02_at_10.06.01_AM_(1).jpeg",
      "https://i.imgur.gg/5f5gtIq-WhatsApp_Image_2026-07-02_at_10.06.01_AM_(2).jpeg",
      "https://i.imgur.gg/AxlHqb8-WhatsApp_Image_2026-07-02_at_10.06.01_AM_(3).jpeg",
      "https://i.imgur.gg/ursp8Si-WhatsApp_Image_2026-07-02_at_10.06.01_AM.jpeg"
    ]
  },
  {
    "sku": "0017",
    "name": "Pink Velvet Bangle Set",
    "categorySlug": "bangles",
    "price": 860,
    "compareAtPrice": 999,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/cArGP3I-IMG_20260626_155904.jpg",
    "description": "# Pink Velvet Bangles (Set of 18 pcs)\n\n## 🛍️ Product Details\n- **Price:** 860 Rs\n- **Color:** Pink\n- **Material:** Premium Velvet with metal type\n- **Size:** 2/4\n\n## ✨ Description\n- Crafted with meticulous attention to each bangle.\n- Intricately embraced with kundan, pearl and stone details.\n- Exceptional craftmanship to create a bold and eye-catching look.\n\n## 💎 Why Choose This?\n- Premium bangles set offered in a cost-effective range.\n- Perfect for festive occasions or weddings.\n- Unique Premium collection & rare to find in other social platforms.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/cArGP3I-IMG_20260626_155904.jpg",
      "https://i.imgur.gg/eLJnyg4-IMG_20260626_160117.jpg",
      "https://i.imgur.gg/6qo3NPH-IMG_20260626_160241.jpg",
      "https://i.imgur.gg/Z3EdRTR-IMG_20260626_160254.jpg",
      "https://i.imgur.gg/1MFyVKJ-IMG_20260626_160300.jpg",
      "https://i.imgur.gg/5G1Zvce-IMG_20260626_160309.jpg",
      "https://i.imgur.gg/BD4LZxg-WhatsApp_Image_2026-07-02_at_10.16.33_AM_(1).jpeg",
      "https://i.imgur.gg/7joinzG-WhatsApp_Image_2026-07-02_at_10.16.33_AM.jpeg",
      "https://i.imgur.gg/shzRsbk-WhatsApp_Image_2026-07-02_at_10.16.34_AM_(1).jpeg",
      "https://i.imgur.gg/6QOwCf6-WhatsApp_Image_2026-07-02_at_10.16.34_AM.jpeg",
      "https://i.imgur.gg/bNk9CDR-WhatsApp_Image_2026-07-02_at_10.16.35_AM.jpeg"
    ]
  },
  {
    "sku": "0018",
    "name": "Heart Luxe Bracelet",
    "categorySlug": "bracelet",
    "price": 299,
    "compareAtPrice": 399,
    "stockQuantity": 0,
    "imageUrl": "https://i.imgur.gg/vQKNhBB-IMG_20260705_182930.jpg",
    "description": "# Heart Luxe Bracelet\n\n## 🛍️ Product Details\n- **Price:** 299 Rs  \n- **Color:** Gold\n- **Material:** 18K gold plating over alloy\n\n## Features\n-  Handcrafted Premium Bracelet, Adjustable hook clasp.\n-  Elegant heart motif with Luxe stone finish.\n-  Luxury packing in velvet box for gift ready package.\n \n\n## ✨ Description\n- A Little Sparkle, a lot of luxury.\n- Luxury in every detail.\n- A statement piece that feels refined and exclusive.\n- Designed for gifting, festive, bridal and everyday wear.\n- Handcrafted to make every gesture shine.\n- A graceful, handcrafted bracelet featuring polished metallic bead and a sparkling heart center piece and premium stone details with ghungaroo to enhance your every hand movement gesture.\n\n## 💎 Why Choose This Treasure?\n- Crafted with meticulous attention.\n- Intricately embellished with red crystal and premium stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Luxury velvet box packing for gifting.\n- Rare to find in other social platforms.\n- Premium gold finish.",
    "badge": "limited",
    "additionalImages": [
      "https://i.imgur.gg/vQKNhBB-IMG_20260705_182930.jpg",
      "https://i.imgur.gg/zRh6iFX-IMG_20260705_182953.jpg",
      "https://i.imgur.gg/zOaPhcg-IMG_20260705_182956.jpg",
      "https://i.imgur.gg/nIEa7HB-IMG_20260705_183011.jpg",
      "https://i.imgur.gg/xcSKLs5-IMG_20260705_183026.jpg",
      "https://i.imgur.gg/wXdww5x-IMG_20260705_183039.jpg",
      "https://i.imgur.gg/N8LE8l2-IMG_20260705_183149.jpg",
      "https://i.imgur.gg/BNUTAbu-IMG_20260705_183154.jpg"
    ]
  },
  {
    "sku": "0016",
    "name": "Multicolor Bangles (Set of 32pcs)",
    "categorySlug": "bangles",
    "price": 760,
    "compareAtPrice": 999,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/noGuuZz-IMG_20260626_162815.jpg",
    "description": "# Multi Color Bangles (Set of 32 pcs)\n\n## 🛍️ Product Details\n- **Price:** 760 Rs  \n- **Color:** Multicolor\n- **Material:** Glass and metal type  \n- **Size:** 2/4  \n\n## ✨ Description\n- Delicate ghungroo(bell) embellishments create a melodious tinkling sound with every graceful movement of your wrist.\n- Crafted with meticulous attention to each bangle.\n- Intricately embraced with ghungroo and stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n\n## 💎 Why Choose This?\n- Premium bangles set offered in a cost-effective range.\n- Perfect for festive occasions or weddings.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/noGuuZz-IMG_20260626_162815.jpg",
      "https://i.imgur.gg/g8tTmuu-IMG_20260626_162929.jpg",
      "https://i.imgur.gg/7Hv0MI8-IMG_20260626_162919.jpg",
      "https://i.imgur.gg/T1lpaE6-IMG_20260626_162909.jpg",
      "https://i.imgur.gg/9pmUg87-IMG_20260626_162903.jpg",
      "https://i.imgur.gg/qKpe2PL-IMG_20260626_162837.jpg",
      "https://i.imgur.gg/PfdnQHD-WhatsApp_Image_2026-07-02_at_10.16.35_AM_(1).jpeg",
      "https://i.imgur.gg/zgDkqbX-WhatsApp_Image_2026-07-02_at_10.16.35_AM_(2).jpeg",
      "https://i.imgur.gg/C4vRYYT-WhatsApp_Image_2026-07-02_at_10.16.35_AM_(3).jpeg",
      "https://i.imgur.gg/CekgYDI-WhatsApp_Image_2026-07-02_at_10.16.35_AM_(4).jpeg",
      "https://i.imgur.gg/3zRncdI-WhatsApp_Image_2026-07-02_at_10.16.36_AM.jpeg"
    ]
  },
  {
    "sku": "0007",
    "name": "Regal Pearl Clutch",
    "categorySlug": "clutches",
    "price": 2050,
    "compareAtPrice": 2599,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/dk4udev-IMG_20260705_162352.jpg",
    "description": "# Regal Pearl Clutch\n\n## 🛍️ Product Details\n- **Price:** 2050 Rs  \n- **Color:** Silver\n\n## ✨ Features\n- Decorative lock, detachable silver chain, premium quality frame, metallic silver finish handle with stone designer finish at the back.\n\n## ✨ Description\n- A Luxurious glam clutch crafted with meticulous premium pearls and stone embellishment details.\n- A Structured rectangular shape & a silver toned frame that makes it stand out as a statement.\n- Suits for luxury occasions, wedding, festive, gifting & bridesmaid.\n- Premium shining stonework for a rich look.\n- Spacious yet compact size, easy to carry for events and functions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium pearls and stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium silver finish and spacious to keep your things safe.",
    "badge": "luxury",
    "additionalImages": [
      "https://i.imgur.gg/dk4udev-IMG_20260705_162352.jpg",
      "https://i.imgur.gg/1AFnYOV-IMG_20260705_162423.jpg",
      "https://i.imgur.gg/VTd1W76-IMG_20260705_162427.jpg",
      "https://i.imgur.gg/Sne3kBq-IMG_20260705_163855.jpg",
      "https://i.imgur.gg/9tv8Q42-IMG_20260705_172826.jpg",
      "https://i.imgur.gg/PiNQPkX-IMG_20260705_172837.jpg",
      "https://i.imgur.gg/PW0Aaix-IMG_20260705_172843.jpg",
      "https://i.imgur.gg/9Y0djxs-IMG_20260705_172853.jpg"
    ]
  },
  {
    "sku": "0006",
    "name": "Pearly Golden Clutch",
    "categorySlug": "clutches",
    "price": 1450,
    "compareAtPrice": 1599,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/ISUicHP-IMG_20260705_164031.jpg",
    "description": "# Pearly Golden Clutch\n\n## 🛍️ Product Details\n- **Price:** 1450Rs  \n- **Color:** Pearl & Gold\n\n## ✨ Features\n- High-Lustre faux pearls & shimmering golden stone details, decorative handle, detachable gold chain, designer gold finish at the back and a front flap closure.\n\n## ✨ Description\n- A Premium clutch in a glam look crafted with meticulous gold stone embellishment details.\n- A structured rectangular shape with a gold tone that makes it stand out as a statement.\n- High-lustre faux pearl details for a rich look.\n- Suits for bridesmaid, festive, wedding, luxury occasion and gifting.\n- Spacious yet compact size, easy to carry for events and functions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/ISUicHP-IMG_20260705_164031.jpg",
      "https://i.imgur.gg/XBAU5Wz-IMG_20260705_172242.jpg",
      "https://i.imgur.gg/NpSLdpF-IMG_20260705_172314.jpg",
      "https://i.imgur.gg/mqaiGI7-IMG_20260705_172337.jpg",
      "https://i.imgur.gg/WHhhRma-IMG_20260705_172354.jpg",
      "https://i.imgur.gg/WaaD7tr-IMG_20260705_172404.jpg",
      "https://i.imgur.gg/sYfnQl5-IMG_20260705_172512.jpg"
    ]
  },
  {
    "sku": "0026",
    "name": "Sparkling nose ring with velvet box",
    "categorySlug": "jewellery",
    "price": 299,
    "compareAtPrice": 399,
    "stockQuantity": 2,
    "imageUrl": "https://i.imgur.gg/qnCxxtg-IMG_20260705_185427.jpg",
    "description": "# Sparkling nose ring with velvet box\n\n## 🛍️ Product Details\n- **Price:** 299Rs  \n- **Color:** White stone with Gold\n- **Qty:** 1\n\n## ✨ Features\n- 18K Gold plated, Non-piercing, Screw lock mechanism, Skin-friendly, Premium white stone, Nickel free, Premium Velvet Box for thoughtful gift.\n\n## ✨ Description\n- Crafted with premium 18K gold plating and it radiates a luxurious shine that complements both festive & bridal attire.\n- The adjustable screw clip mechanism provides a secure & comfortable fit.\n- Its light weight, durable & safe for all the skin types.\n- Perfect for weddings, festivals, function & events.\n- Comes with a premium velvet box & great for thoughtful gift to any special occasions.\n\n## 💎 Why Choose This Treasure?\n- Luxury offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and skin safe.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/qnCxxtg-IMG_20260705_185427.jpg",
      "https://i.imgur.gg/hmr14Xj-IMG_20260705_185433.jpg",
      "https://i.imgur.gg/rwnr3Up-IMG_20260705_185442.jpg",
      "https://i.imgur.gg/lDRsUWc-IMG_20260705_185409.jpg",
      "https://i.imgur.gg/5Nt43pN-IMG_20260705_185412.jpg",
      "https://i.imgur.gg/PACRVWj-IMG_20260705_185415.jpg"
    ]
  },
  {
    "sku": "0003",
    "name": "Golden Eagle Glam Clutch",
    "categorySlug": "clutches",
    "price": 2050,
    "compareAtPrice": 2599,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/98usj1m-IMG_20260703_111740.jpg",
    "description": "# Golden Eagle Glam Clutch\n\n## 🛍️ Product Details\n- **Price:** 2050 Rs  \n- **Color:** Gold\n\n## ✨ Features\n- Decorative lock, detachable gold chain, premium quality gold frame, metallic gold finish handle, designer gold fabric at the back.\n\n## ✨ Description\n- A Luxurious clutch in a glam look crafted with meticulous premium stone embellishment details.\n- A Structured rectangular shape & a gold toned frame that makes it stand out as a statement.\n- Suits for luxury occasions, wedding, festive & bridesmaid.\n- Premium shining stonework for a rich look.\n- Spacious yet compact size, easy to carry for events and functions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "luxury",
    "additionalImages": [
      "https://i.imgur.gg/eggPVAF-IMG_20260703_111828.jpg",
      "https://i.imgur.gg/gPhThze-IMG_20260705_155515.jpg",
      "https://i.imgur.gg/POeQ3vJ-IMG_20260705_155729.jpg",
      "https://i.imgur.gg/Jvbv8Gz-WhatsApp_Image_2026-07-05_at_8.23.26_PM.jpeg",
      "https://i.imgur.gg/bpVrzo4-WhatsApp_Image_2026-07-05_at_8.23.27_PM_(1).jpeg",
      "https://i.imgur.gg/PixsRI1-WhatsApp_Image_2026-07-05_at_8.23.28_PM.jpeg",
      "https://i.imgur.gg/Bh5sBSk-WhatsApp_Image_2026-07-05_at_8.23.29_PM_(1).jpeg",
      "https://i.imgur.gg/ccy2N6u-WhatsApp_Image_2026-07-05_at_8.23.29_PM.jpeg"
    ]
  },
  {
    "sku": "0014",
    "name": "Multicolor Bangles (set of 36 pcs)",
    "categorySlug": "bangles",
    "price": 860,
    "compareAtPrice": 999,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/GUQy7if-WhatsApp_Image_2026-07-02_at_10.08.35_AM_(1).jpeg",
    "description": "# Multicolor Bangles (Set of 36pcs)\n\n## 🛍️ Product Details\n- **Price:** 860 Rs  \n- **Color:** Multicolor\n- **Material:** Glass & Metal type \n- **Size:** 2/4  \n\n## ✨ Description\n- Crafted with meticulous attention to each bangle.\n- Intricately embraced with kundan, beads and stone details.\n- Exceptional craftmanship to create a bold and eye-catching look.\n\n## 💎 Why Choose This?\n- Premium bangles set offered in a cost-effective range.\n- Perfect for festive occasions or weddings.\n- Unique Premium collection & rare to find in other social platforms.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/GUQy7if-WhatsApp_Image_2026-07-02_at_10.08.35_AM_(1).jpeg",
      "https://i.imgur.gg/gqTsAet-WhatsApp_Image_2026-07-02_at_10.08.35_AM_(2).jpeg",
      "https://i.imgur.gg/ypHfOHC-WhatsApp_Image_2026-07-02_at_10.08.35_AM.jpeg",
      "https://i.imgur.gg/WUITdsU-WhatsApp_Image_2026-07-02_at_10.08.36_AM_(1).jpeg",
      "https://i.imgur.gg/uwVOgxs-WhatsApp_Image_2026-07-02_at_10.08.36_AM_(2).jpeg",
      "https://i.imgur.gg/pOMvqal-WhatsApp_Image_2026-07-02_at_10.08.36_AM.jpeg"
    ]
  },
  {
    "sku": "0001",
    "name": "Luxury Multicolor Sparkle Clutch",
    "categorySlug": "clutches",
    "price": 2050,
    "compareAtPrice": 2599,
    "stockQuantity": 0,
    "imageUrl": "https://i.imgur.gg/SAQefIg-IMG_20260705_173943.jpg",
    "description": "# Luxury Multicolor Sparkle Clutch\n\n## 🛍️ Product Details\n- **Price:** 2050 Rs  \n- **Color:** Multicolor\n\n## Features\n- Lock, Detachable Chain, Premium Quality frame, metallic gold finish, rhinestone embellishment, soft satin fabric inside.\n\n## ✨ Description\n- A Luxurious clutch in a glam look with heavy sparkle in both sides.\n- A structured rectangular shape & a gold toned frame that makes it standout as a statement accessory.\n- Suits for bridesmaid, wedding, festive &  cocktail party.\n- Premium shining stone work for rich look.\n- Elegant gold tone that matches ethnic & party wear.\n- Compact size easy to carry for events and functions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium rhino stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold and spacious finish to keep your things safe.",
    "badge": "luxury",
    "additionalImages": [
      "https://i.imgur.gg/n4ebiJn-IMG_20260705_174044.jpg",
      "https://i.imgur.gg/ERjWTfe-IMG_20260705_174054.jpg",
      "https://i.imgur.gg/yykLghU-IMG_20260705_174152.jpg",
      "https://i.imgur.gg/67pHD4f-IMG_20260705_174006.jpg",
      "https://i.imgur.gg/SAQefIg-IMG_20260705_173943.jpg",
      "https://i.imgur.gg/46Icipd-IMG_20260705_174203.jpg",
      "https://i.imgur.gg/dcsEDNF-IMG_20260705_173922.jpg"
    ]
  },
  {
    "sku": "0027",
    "name": "Sparkle Pearly Nose Ring With Velvet Box",
    "categorySlug": "jewellery",
    "price": 299,
    "compareAtPrice": 399,
    "stockQuantity": 2,
    "imageUrl": "https://i.imgur.gg/QHQ7a99-IMG_20260705_184343.jpg",
    "description": "# Sparkle Pearly Nose Ring With Velvet Box\n\n## 🛍️ Product Details\n- **Price:** 299Rs  \n- **Color:** Multicolor(Green,Pink & White) with Pearl & Gold\n- **Qty:** 1\n\n## ✨ Features\n- 18K Gold plated, Non-piercing, Screw lock mechanism, Skin-friendly, Premium white stones with pearl, Nickel free, Premium Velvet Box for thoughtful gift.\n\n## ✨ Description\n- Crafted with premium 18K gold plating and it radiates a luxurious shine that complements both festive & bridal attire.\n- The adjustable screw clip mechanism provides a secure & comfortable fit.\n- Its light weight, durable & safe for all the skin types.\n- Perfect for weddings, festivals, function & events.\n- Comes with a premium velvet box & great for thoughtful gift to any special occasions.\n\n## 💎 Why Choose This Treasure?\n- Luxury offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and skin safe.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/QHQ7a99-IMG_20260705_184343.jpg",
      "https://i.imgur.gg/VWK6567-IMG_20260705_184408.jpg",
      "https://i.imgur.gg/cTTnInx-IMG_20260705_184410.jpg",
      "https://i.imgur.gg/qgM3FJ0-IMG_20260705_184505.jpg",
      "https://i.imgur.gg/pXNqmWF-IMG_20260705_184736.jpg"
    ]
  },
  {
    "sku": "0020",
    "name": "Regal Green Set",
    "categorySlug": "jewellery",
    "price": 449,
    "compareAtPrice": 599,
    "stockQuantity": 0,
    "imageUrl": "https://i.imgur.gg/XmbBFvK-IMG_20260705_191751.jpg",
    "description": "# Regal Green Set\n\n## 🛍️ Product Details\n- **Price:** 449Rs  \n- **Color:** Premium Pearls with Green Stone\n\n## ✨ Features\n- Premium Pearl Necklace set, Luxurious touch with green stone detailing as center piece surrounded with stone details, Luxury packaging in velvet box for gifting.\n\n## ✨ Description\n- Elegant, handcrafted pearl necklace set with rich velvet box.\n- The Regal set features beautiful green stone detailing with premium traditional look.\n- This necklace set adds a royal touch to any ethnic outfit.\n- Lightweight classy and eye catchy.\n- Perfect for festive, gifting and any special occasion.\n\n## 💎 Why Choose This Treasure?\n- A graceful handcrafted regal green necklace set with a sparkling stone detail to enhance your look.\n- Crafted with meticulous attention.\n- Intricately embellished with premium pearls and green stone as center piece.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/XmbBFvK-IMG_20260705_191751.jpg",
      "https://i.imgur.gg/kISqz9c-IMG_20260705_191822.jpg",
      "https://i.imgur.gg/nNUd6gj-IMG_20260705_190908.jpg",
      "https://i.imgur.gg/hrDRwsp-IMG_20260705_191255.jpg",
      "https://i.imgur.gg/PPFXH0x-IMG_20260705_191557.jpg",
      "https://i.imgur.gg/SFiLxMH-IMG_20260705_191641.jpg",
      "https://i.imgur.gg/bNAjV9b-IMG_20260705_191809.jpg",
      "https://i.imgur.gg/nxdD83r-IMG_20260705_191816.jpg"
    ]
  },
  {
    "sku": "0021",
    "name": "Regal Brown Set",
    "categorySlug": "jewellery",
    "price": 449,
    "compareAtPrice": 599,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/2RQd9Kv-IMG_20260719_140300.jpg",
    "description": "# Regal Brown Set\n\n## 🛍️ Product Details\n- **Price:** 449Rs  \n- **Color:** Premium Pearls with Brown Stone\n\n## ✨ Features\n- Premium Pearl Necklace set, Luxurious touch with brown stone detailing as center piece surrounded with stone details, Luxury packaging in velvet box for gifting.\n\n## ✨ Description\n- Elegant, handcrafted pearl necklace set with rich velvet box.\n- The Regal set features beautiful brown stone detailing with premium traditional look.\n- This necklace set adds a royal touch to any ethnic outfit.\n- Lightweight classy and eye catchy.\n- Perfect for festive, gifting and any special occasion.\n\n## 💎 Why Choose This Treasure?\n- A graceful handcrafted regal brown necklace set with a sparkling stone detail to enhance your look.\n- Crafted with meticulous attention.\n- Intricately embellished with premium pearls and brown stone as center piece.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/2RQd9Kv-IMG_20260719_140300.jpg",
      "https://i.imgur.gg/0YewRfh-IMG_20260719_140345.jpg",
      "https://i.imgur.gg/eX5K92n-IMG_20260719_140527.jpg",
      "https://i.imgur.gg/TFlTBkQ-IMG_20260719_141058.jpg",
      "https://i.imgur.gg/1qiGePZ-IMG_20260719_143359.jpg"
    ]
  },
  {
    "sku": "0043",
    "name": "Premium Laxmi Bridal Set",
    "categorySlug": "jewellery",
    "price": 1599,
    "compareAtPrice": 1699,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/WiuVS3A-IMG_20260719_144644.jpg",
    "description": "# Laxmi Bridal Set\n\n## 🛍️ Product Details\n- **Price:** 1599Rs  \n- **Color:**  Gold,Multicolor Stone & Pearls\n## ✨ Features\n- Premium 18K Gold plated, Anti-Tarnish & Skin-Friendly, intricated with Precious Stones & Pearls, Luxury box packaging, Long Haram, Short to Medium adjustable necklace with earrings & Maang Tikka, Two Thread string attachments for necklace set length adjustments.\n\n## ✨ Description\n- A Premium traditional Laxmi inspo temple-style bridal set with a rich gold-tone finish & anti-tarnish.\n- Heavily detailed on each piece of this bridal set.\n- Suits for bridal, traditional wear & gifting, festivals & grand occasions.\n- Elegant temple inspired necklace set with intricate craftsmanship.\n- Peacock motifs with premium stones & pearl embellishments.\n- Meticulous attention to Laxmi coins around the corners.\n- Pink, green & white stones with pearls to elevate the traditional look for a regal touch.\n- Lightweight but looks full & heavy because of the detailed intricate work.\n\n## 💎 Why Choose This Treasure?\n- A graceful handcrafted premium laxmi necklace set with a sparkling stone detail to enhance your traditional look.\n- Crafted with meticulous attention.\n- Intricately embellished with premium pearls and stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/WiuVS3A-IMG_20260719_144644.jpg",
      "https://i.imgur.gg/ka3Ohy9-IMG_20260719_144659.jpg",
      "https://i.imgur.gg/xBmlcNq-IMG_20260719_144707.jpg",
      "https://i.imgur.gg/x2cZlMm-IMG_20260719_144725.jpg",
      "https://i.imgur.gg/STGVAv7-IMG_20260719_145005.jpg",
      "https://i.imgur.gg/JYQWQ00-IMG_20260719_145012.jpg",
      "https://i.imgur.gg/nYZqMBu-IMG_20260719_145519.jpg",
      "https://i.imgur.gg/2dPcs0u-IMG_20260719_151241.jpg",
      "https://i.imgur.gg/3faIJ9P-IMG_20260719_151353.jpg",
      "https://i.imgur.gg/8cmomGO-IMG_20260719_151359.jpg",
      "https://i.imgur.gg/CVydwW7-IMG_20260719_151417.jpg",
      "https://i.imgur.gg/C6Pccws-IMG_20260719_151427.jpg"
    ]
  },
  {
    "sku": "0024",
    "name": "Maharani Jhumka With Velvet Box",
    "categorySlug": "jewellery",
    "price": 405,
    "compareAtPrice": 499,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/fESHlgk-IMG_20260719_152820.jpg",
    "description": "# Maharani Jhumka With Velvet Box\n\n## 🛍️ Product Details\n- **Price:** 405rs  \n- **Color:** Gold & White Stone\n\n## ✨ Features\n-  Intricated with White stones & detachable Ear Chains, Ghungaroos along the bottom rim, Luruxy velvet box.\n\n## ✨ Description\n- Hand Crafted Jhumkas inspired by tradition & made for modern elegance.\n- Elegant traditional Jhumka Crafted earrings with intricate detailing & a rich gold finish, designed to add grace, charm & a royal touch to any festive, bridal look or any Grand occasion.\n- Suits for Gifting also, because it Comes with a luxury velvet box packaging.\n\n\n## 💎 Why Choose This Treasure?\n- A graceful handcrafted Jhumkas with a sparkling stone detail to enhance your look.\n- Crafted with meticulous attention.\n- Intricately embellished with premium stone details\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/fESHlgk-IMG_20260719_152820.jpg",
      "https://i.imgur.gg/WTqOsf6-IMG_20260719_152923.jpg",
      "https://i.imgur.gg/tUrwSga-IMG_20260719_152936.jpg",
      "https://i.imgur.gg/t40UPb2-IMG_20260719_152730.jpg",
      "https://i.imgur.gg/p0L7P3b-IMG_20260719_152801.jpg",
      "https://i.imgur.gg/mcZragJ-IMG_20260719_152815.jpg"
    ]
  },
  {
    "sku": "0025",
    "name": "Royal Bloom Jhumka With Velvet Box",
    "categorySlug": "jewellery",
    "price": 405,
    "compareAtPrice": 499,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/GCEQqZt-IMG_20260719_154636.jpg",
    "description": "# Royal Bloom Jhumka With Velvet Box\n\n## 🛍️ Product Details\n- **Price:** 405rs  \n- **Color:** Gold & Kundan Stone\n\n## ✨ Features\n-  Intricated with Kundan stones & Leaf patterned detachable Ear Chains, Ghungaroos along the bottom rim, Luruxy velvet box.\n\n## ✨ Description\n- Hand Crafted Jhumkas inspired by tradition & made for modern elegance.\n- Elegant traditional Jhumka Crafted earrings with intricate detailing & a rich gold finish, designed to add grace, charm & a royal touch to any festive, bridal look or any Grand occasion.\n- Suits for Gifting also, because it Comes with a luxury velvet box packaging.\n\n\n## 💎 Why Choose This Treasure?\n- A graceful handcrafted Jhumkas with a sparkling stone detail to enhance your look.\n- Crafted with meticulous attention.\n- Intricately embellished with premium stone details\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/GCEQqZt-IMG_20260719_154636.jpg",
      "https://i.imgur.gg/l43Pqhs-IMG_20260719_154643.jpg",
      "https://i.imgur.gg/lSxO7YT-IMG_20260719_154725.jpg",
      "https://i.imgur.gg/gKmG3WH-IMG_20260719_154736.jpg",
      "https://i.imgur.gg/AvJdeoN-IMG_20260719_154937.jpg",
      "https://i.imgur.gg/PRjs6Zy-IMG_20260719_155001.jpg",
      "https://i.imgur.gg/XkOaHqk-IMG_20260719_155030.jpg",
      "https://i.imgur.gg/ZiVSc24-IMG_20260719_155046.jpg"
    ]
  },
  {
    "sku": "0022",
    "name": "Emerald Green Set With Velvet Box",
    "categorySlug": "jewellery",
    "price": 350,
    "compareAtPrice": 450,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/b0T4Au9-IMG_20260719_162442.jpg",
    "description": "# Emerald Green Set With Velvet Box\n\n## 🛍️ Product Details\n- **Price:** 350Rs  \n- **Color:** Green and White Stone\n\n## ✨ Features\n- Premium Emerald Green Necklace set with Earrings, Luxurious touch with Green stone detailing as center piece surrounded with White stone details, Luxury packaging in velvet box for gifting.\n\n## ✨ Description\n- Elegant, handcrafted necklace set with rich velvet box.\n- The Regal set features beautiful green stone detailing with premium traditional and modern touch.\n- This necklace set adds a royal touch to any ethnic outfit.\n- Lightweight classy and eye catchy.\n- Perfect for festive, gifting and any special occasion.\n\n## 💎 Why Choose This Treasure?\n- A graceful handcrafted emerald  green necklace set with a sparkling stone detail to enhance your look.\n- Crafted with meticulous attention.\n- Intricately embellished with premium Crystals and Green stone as center piece.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.",
    "badge": "premium",
    "additionalImages": [
      "https://i.imgur.gg/9ClPQyP-IMG_20260719_162526.jpg",
      "https://i.imgur.gg/e4F8maX-IMG_20260719_162540.jpg",
      "https://i.imgur.gg/eaDCMOH-IMG_20260719_162547.jpg",
      "https://i.imgur.gg/iVWuhWO-IMG_20260719_162607.jpg",
      "https://i.imgur.gg/8nchUdg-IMG_20260719_163057.jpg",
      "https://i.imgur.gg/0aPoshz-IMG_20260719_163145.jpg"
    ]
  },
  {
    "sku": "00009",
    "name": "Test",
    "categorySlug": "jewellery",
    "price": 11,
    "compareAtPrice": 111,
    "stockQuantity": 1,
    "imageUrl": null,
    "description": null,
    "badge": "premium",
    "additionalImages": []
  },
  {
    "sku": "0044",
    "name": "Regal Kundan & Ruby Set With Luxury Velvet Box",
    "categorySlug": "jewellery",
    "price": 1585,
    "compareAtPrice": 1699,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/JnWJA74-IMG_20260719_160426.jpg",
    "description": "# Regal Kundan & Ruby Set With Luxury Velvet Box\n\n## 🛍️ Product Details\n- **Price:** 1585rs  \n- **Color:** Kundan, Ruby and Pearls\n\n## ✨ Features\n-  Intricated with Kundan stones, Premium Ruby, Pearls & White stones, Two Earrings, Luruxy velvet box.\n\n## ✨ Description\n- The Regal Kundan & Ruby Set With Luxury Velvet Box is Hand Crafted Jewellery set, inspired by timeless heritage tradition & made for modern woman.\n- Intricate detailing & a rich gold finish, designed to add grace, charm & a royal touch to any festive, bridal look or any Grand occasion.\n- Suits for Gifting also, because it Comes with a luxury velvet box packaging.\n\n\n## 💎 Why Choose This Treasure?\n- A graceful handcrafted Royalty Jewellery set with a sparkling stone detail to enhance your look.\n- Crafted with meticulous attention.\n- Intricately embellished with Premium Kundan, Pearls & Ruby details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.",
    "badge": "luxury",
    "additionalImages": [
      "https://i.imgur.gg/JnWJA74-IMG_20260719_160426.jpg",
      "https://i.imgur.gg/qAA45O0-IMG_20260719_160652.jpg",
      "https://i.imgur.gg/SdMXrtp-IMG_20260719_160414.jpg",
      "https://i.imgur.gg/EeagPI8-IMG_20260719_160734.jpg",
      "https://i.imgur.gg/HDuT2gW-IMG_20260719_160346.jpg",
      "https://i.imgur.gg/kRxdGLD-IMG_20260719_160802.jpg",
      "https://i.imgur.gg/ldaYqzf-IMG_20260719_160755.jpg",
      "https://i.imgur.gg/qAWndIV-IMG_20260719_160748.jpg"
    ]
  },
  {
    "sku": "0063",
    "name": "Luxury Princess Purple Set",
    "categorySlug": "jewellery",
    "price": 1010,
    "compareAtPrice": 1199,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/dyBT4dl-IMG_20260719_165242.jpg",
    "description": "# Luxury Princess Purple Set with Jewellery Box\n\n## 🛍️ Product Details\n- **Price:** 1010 Rs  \n- **Color:** White & Purple\n- **Qty:** 1\n\n## ✨ Features\n- 18K Gold plated, Skin-friendly for kids, Premium White stones & Purple Rectangular stone as centerpiece, Matching Earrings, Premium Jewellery Box for a thoughtful gift.\n\n## ✨ Description\n- The Luxury Princess Purple set has a symmetrical, wing-like curved pattern on both sides.\n- Crafted with premium 18K gold plating and it radiates a luxurious shine that complements both festive & bridal attire.\n- The adjustable Thread Strings provides a secure & comfortable fit.\n- Its light weight, durable & safe for kids.\n- Perfect for weddings, festivals, function & events.\n- Comes with a premium Jewellery box & great for a thoughtful gift to any special occasions.\n\n## 💎 Why Choose This Treasure?\n- Luxury offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and skin safe.",
    "badge": "luxury",
    "additionalImages": [
      "https://i.imgur.gg/9w0B0i0-IMG_20260719_165249.jpg",
      "https://i.imgur.gg/JzcSRxZ-IMG_20260719_165254.jpg",
      "https://i.imgur.gg/wk78ycO-IMG_20260719_165419.jpg",
      "https://i.imgur.gg/ys0W2c9-IMG_20260719_165436.jpg",
      "https://i.imgur.gg/HQpTgfn-IMG_20260719_165448.jpg",
      "https://i.imgur.gg/pDc3Bzr-IMG_20260719_165505.jpg",
      "https://i.imgur.gg/Xy7Z7Dq-IMG_20260719_170411.jpg"
    ]
  },
  {
    "sku": "0023",
    "name": "Sparkle Burgandy Set",
    "categorySlug": "jewellery",
    "price": 230,
    "compareAtPrice": 299,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/lTreYaF-IMG_20260719_173131.jpg",
    "description": "# Sparkle Burgandy Set\n\n## 🛍️ Product Details\n- **Price:** 230 Rs  \n- **Color:** Burgandy & White\n- **Qty:** 1\n\n## ✨ Features\n- Premium White stones & Burgandy stone as centerpiece, Matching Earrings, Adjustable thread string.\n\n## ✨ Description\n- Elegant Burgandy set has a matching earrings, made to add luxury, sparkle & festive elegance to your look.\n- Crafted with premium White stones and Burgandy stone as centerpiece, it radiates a luxurious shine that complements any outfit.\n- The adjustable Thread Strings provides a secure & comfortable fit.\n- Its light weight, budget friendly and durable. \n- Perfect for weddings, festivals, function & events.\n\n## 💎 Why Choose This Treasure?\n- Luxury offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.",
    "badge": "limited",
    "additionalImages": [
      "https://i.imgur.gg/h5EOPPt-IMG_20260719_173339.jpg",
      "https://i.imgur.gg/RlVjkwG-IMG_20260719_173400.jpg",
      "https://i.imgur.gg/PgZJwKG-IMG_20260719_173057.jpg",
      "https://i.imgur.gg/2g8sXWX-IMG_20260719_173257.jpg",
      "https://i.imgur.gg/J8AvYp5-IMG_20260719_173101.jpg",
      "https://i.imgur.gg/A6qJNWq-IMG_20260719_173103.jpg"
    ]
  },
  {
    "sku": "0000",
    "name": "PayTest",
    "categorySlug": "",
    "price": 10,
    "compareAtPrice": 100,
    "stockQuantity": 9,
    "imageUrl": null,
    "description": null,
    "badge": null,
    "additionalImages": []
  },
  {
    "sku": "0046",
    "name": "Royal Ruby Kundan Necklace Set",
    "categorySlug": "jewellery",
    "price": 1600,
    "compareAtPrice": 1700,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/euquzde-IMG_20260719_173626.jpg",
    "description": "# Royal Ruby Kundan Necklace Set With Luxury Velvet Box\n\n## 🛍️ Product Details\n- **Price:** 1600rs  \n- **Color:** Kundan, Ruby, Pearls & White stones\n\n## ✨ Features\n-  Intricated with Kundan stones, Premium Ruby, Pearls & White stones, Two Earrings, Luruxy velvet box.\n\n## ✨ Description\n- The Royal Ruby Kundan Necklace Set With Luxury Velvet Box is Hand Crafted Jewellery set, inspired by timeless heritage tradition & made for modern woman.\n- Intricate detailing & a rich gold finish, designed to add grace, charm & a royal touch to any festive, bridal look or any Grand occasion.\n- Suits for Gifting also, because it Comes with a luxury velvet box packaging.\n\n\n## 💎 Why Choose This Treasure?\n- A graceful handcrafted Royalty Jewellery set with a sparkling stone detail to enhance your look.\n- Crafted with meticulous attention.\n- Intricately embellished with Premium Kundan, Pearls,Ruby & white stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.",
    "badge": "luxury",
    "additionalImages": [
      "https://i.imgur.gg/euquzde-IMG_20260719_173626.jpg",
      "https://i.imgur.gg/uey968c-IMG_20260719_173631.jpg",
      "https://i.imgur.gg/cVH0UUN-IMG_20260719_173642.jpg",
      "https://i.imgur.gg/ig58jDS-IMG_20260719_173700.jpg",
      "https://i.imgur.gg/lTn2spV-IMG_20260719_173704.jpg",
      "https://i.imgur.gg/mQh3cOt-IMG_20260719_173731.jpg",
      "https://i.imgur.gg/eGGPV2F-IMG_20260719_173802.jpg",
      "https://i.imgur.gg/eGGPV2F-IMG_20260719_173802.jpg",
      "https://i.imgur.gg/vZ4Pwh8-IMG_20260719_173820.jpg"
    ]
  },
  {
    "sku": "0064",
    "name": "Luxury Princess Green Set",
    "categorySlug": "jewellery",
    "price": 1010,
    "compareAtPrice": 1199,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/O78QiZu-IMG_20260719_171535.jpg",
    "description": "# Luxury Princess Green Set With Jewellery Box\n\n## 🛍️ Product Details\n- **Price:** 1010 Rs  \n- **Color:** White & Green\n- **Qty:** 1\n\n## ✨ Features\n- 18K Gold plated, Skin-friendly for kids, Premium White stones & Green Rectangular stone as centerpiece, Matching Earrings, Premium Jewellery Box for a thoughtful gift.\n\n## ✨ Description\n- The Luxury Princess Green set has a symmetrical, wing-like curved pattern on both sides.\n- Crafted with premium 18K gold plating and it radiates a luxurious shine that complements both festive & bridal attire.\n- The adjustable Thread Strings provides a secure & comfortable fit.\n- Its light weight, durable & safe for kids.\n- Perfect for weddings, festivals, function & events.\n- Comes with a premium Jewellery box & great for a thoughtful gift to any special occasions.\n\n## 💎 Why Choose This Treasure?\n- Luxury offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and skin safe.",
    "badge": "luxury",
    "additionalImages": [
      "https://i.imgur.gg/O78QiZu-IMG_20260719_171535.jpg",
      "https://i.imgur.gg/Mo3sD7y-IMG_20260719_171558.jpg",
      "https://i.imgur.gg/d4clS3c-IMG_20260719_171619.jpg",
      "https://i.imgur.gg/MzdyM8z-IMG_20260719_171525.jpg",
      "https://i.imgur.gg/ru6ZHyF-IMG_20260719_171529.jpg",
      "https://i.imgur.gg/H6atzG5-IMG_20260719_171532.jpg",
      "https://i.imgur.gg/Xy7Z7Dq-IMG_20260719_170411.jpg?w=1536&q=75"
    ]
  },
  {
    "sku": "0019",
    "name": "Floral Luxe Bracelet",
    "categorySlug": "bracelet",
    "price": 299,
    "compareAtPrice": 399,
    "stockQuantity": 0,
    "imageUrl": "https://i.imgur.gg/1XOqHkj-IMG_20260705_183745.jpg",
    "description": "# Floral Luxe Bracelet\n\n## 🛍️ Product Details\n- **Price:** 299Rs\n- **Color:** Gold\n- **Material:** 18K gold plating over alloy\n\n## Features\n-  Adjustable hook clasp, handcrafted Premium bracelet, Elegant Light pink floral bloom motif with luxe stone finish, luxury packaging in velvet box for gift ready package.\n\n## ✨ Description\n- A Little sparkle, a lot of luxury.\n- Designed for festive & gifting wear.\n- A statement piece that feels refined & exclusive.\n- A graceful handcrafted bracelet featuring polished metallic two hearts and a sparkling floral bloom in center piece with ghungaroo to enhance your every hand movement gesture.\n\n## 💎 Why Choose This Treasure?\n- Crafted with meticulous attention.\n- Intricately embellished with four cubic stone details like a diamond finish\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Luxury velvet box packing for gifting.\n- Rare to find in other social platforms.\n- Premium gold finish.",
    "badge": "limited",
    "additionalImages": [
      "https://i.imgur.gg/1XOqHkj-IMG_20260705_183745.jpg",
      "https://i.imgur.gg/YuSPYVz-IMG_20260705_183834.jpg",
      "https://i.imgur.gg/SbzZetX-IMG_20260705_183851.jpg",
      "https://i.imgur.gg/TNSy8NY-IMG_20260705_183914.jpg",
      "https://i.imgur.gg/xtXVL30-IMG_20260705_183924.jpg",
      "https://i.imgur.gg/ExMT8VS-IMG_20260705_184048.jpg",
      "https://i.imgur.gg/BWoz3zi-IMG_20260705_184131.jpg"
    ]
  }
];

export interface SeedOrderItem {
  productSku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  createdAt: string | null;
}

export interface SeedOrder {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateCode: string;
  postalCode: string;
  countryCode: string;
  status: string;
  trackingId: string | null;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  transactionId: string | null;
  customerNotes: string | null;
  adminNotes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  items: SeedOrderItem[];
  statusHistory: { status: string; notes: string | null; createdAt: string | null }[];
}

export const SEED_ORDERS: SeedOrder[] = [
  {
    "orderNumber": "ORD-248918D9",
    "customerName": "Bharathi",
    "customerEmail": "bharathigopalsamy5@gmail.com",
    "customerPhone": "8778686488",
    "addressLine1": "44, Bharathiyar street, Tambaram sanatorium.chennai-47",
    "addressLine2": "Near Vinayagar temple",
    "city": "Chennai",
    "stateCode": "TN",
    "postalCode": "600047",
    "countryCode": "IN",
    "status": "delivered",
    "trackingId": "2827793904833",
    "subtotal": 2050,
    "shippingCost": 0,
    "totalAmount": 2050,
    "transactionId": "pay_TKaiSW5fKE6Vzh",
    "customerNotes": null,
    "adminNotes": null,
    "createdAt": "2026-08-01T17:41:53.954Z",
    "updatedAt": null,
    "items": [
      {
        "productSku": "0020",
        "productName": "Regal Green Set",
        "unitPrice": 449,
        "quantity": 1,
        "createdAt": "2026-07-19T12:55:08.385Z"
      }
    ],
    "statusHistory": [
      {
        "status": "pending",
        "notes": "Order placed",
        "createdAt": "2026-08-01T17:41:53.954Z"
      },
      {
        "status": "approved",
        "notes": "Status changed to approved",
        "createdAt": "2026-08-01T23:20:40.368Z"
      },
      {
        "status": "packaging",
        "notes": "Status changed to packaging",
        "createdAt": "2026-08-02T08:28:58.737Z"
      },
      {
        "status": "shipped",
        "notes": "Status changed to shipped",
        "createdAt": "2026-08-02T16:26:10.058Z"
      },
      {
        "status": "delivered",
        "notes": "Status changed to delivered",
        "createdAt": "2026-08-03T07:38:26.460Z"
      }
    ]
  },
  {
    "orderNumber": "ORD-4FEB538C",
    "customerName": "Keerthana Baskar",
    "customerEmail": "baskarkeerthana02@gmail.com",
    "customerPhone": "6369886866",
    "addressLine1": "No,17 East street",
    "addressLine2": "Senthur apartment",
    "city": "Chennai",
    "stateCode": "TN",
    "postalCode": "600082",
    "countryCode": "IN",
    "status": "shipped",
    "trackingId": "14112364117417",
    "subtotal": 299,
    "shippingCost": 150,
    "totalAmount": 449,
    "transactionId": "pay_TKSnNucvrTcTgb",
    "customerNotes": null,
    "adminNotes": null,
    "createdAt": "2026-08-01T09:56:46.651Z",
    "updatedAt": null,
    "items": [
      {
        "productSku": "0019",
        "productName": "Floral Luxe Bracelet",
        "unitPrice": 299,
        "quantity": 1,
        "createdAt": "2026-08-01T09:56:46.651Z"
      }
    ],
    "statusHistory": [
      {
        "status": "pending",
        "notes": "Order placed",
        "createdAt": "2026-08-01T09:56:46.651Z"
      },
      {
        "status": "approved",
        "notes": "Status changed to approved",
        "createdAt": "2026-08-01T10:02:22.680Z"
      },
      {
        "status": "packaging",
        "notes": "Status changed to packaging",
        "createdAt": "2026-08-02T08:29:16.434Z"
      },
      {
        "status": "shipped",
        "notes": "Status changed to shipped",
        "createdAt": "2026-08-03T09:55:29.496Z"
      }
    ]
  },
  {
    "orderNumber": "ORD-2C218F0A",
    "customerName": "Hariharan",
    "customerEmail": "mr.hari9816@gmail.com",
    "customerPhone": "6380418006",
    "addressLine1": "No,89 c block Kakkan colony Besant nager",
    "addressLine2": "Besant nager bus stand",
    "city": "Chennai",
    "stateCode": "TN",
    "postalCode": "600090",
    "countryCode": "IN",
    "status": "delivered",
    "trackingId": "2827792570832",
    "subtotal": 449,
    "shippingCost": 150,
    "totalAmount": 599,
    "transactionId": "pay_TDkY1cBs9hjhQa",
    "customerNotes": null,
    "adminNotes": null,
    "createdAt": "2026-07-19T12:55:08.356Z",
    "updatedAt": null,
    "items": [
      {
        "productSku": "0001",
        "productName": "Luxury Multicolor Sparkle Clutch",
        "unitPrice": 2050,
        "quantity": 1,
        "createdAt": "2026-08-01T17:41:53.954Z"
      }
    ],
    "statusHistory": [
      {
        "status": "pending",
        "notes": "Order placed",
        "createdAt": "2026-07-19T12:55:08.413Z"
      },
      {
        "status": "approved",
        "notes": "Status changed to approved",
        "createdAt": "2026-07-19T12:55:08.442Z"
      },
      {
        "status": "packaging",
        "notes": "Status changed to packaging",
        "createdAt": "2026-07-19T12:55:08.472Z"
      },
      {
        "status": "shipped",
        "notes": "Status changed to shipped",
        "createdAt": "2026-07-19T12:55:08.509Z"
      },
      {
        "status": "delivered",
        "notes": "Status changed to delivered",
        "createdAt": "2026-07-23T03:26:12.809Z"
      }
    ]
  }
];
