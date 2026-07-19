import type { ProductBadge } from "@prisma/client";

export const SEED_CATEGORIES = [
  {
    "name": "Accessories",
    "slug": "accessories",
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
    "name": "Bracelets",
    "slug": "bracelet",
    "description": null,
    "displayOrder": 3,
    "isActive": true
  },
  {
    "name": "Jewellery Organizer",
    "slug": "organizer",
    "description": null,
    "displayOrder": 4,
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
    "sku": "0001",
    "name": "Luxury Multicolor Sparkle Clutch",
    "categorySlug": "accessories",
    "price": 2050,
    "compareAtPrice": 2599,
    "stockQuantity": 1,
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
    "sku": "0002",
    "name": "Golden Luxe Pearl Clutch",
    "categorySlug": "accessories",
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
    "sku": "0003",
    "name": "Golden Eagle Glam Clutch",
    "categorySlug": "accessories",
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
      "https://i.imgur.gg/PixsRI1-WhatsApp_Image_2026-07-05_at_8.23.28_PM.jpeg",
      "https://i.imgur.gg/Bh5sBSk-WhatsApp_Image_2026-07-05_at_8.23.29_PM_(1).jpeg",
      "https://i.imgur.gg/ccy2N6u-WhatsApp_Image_2026-07-05_at_8.23.29_PM.jpeg"
    ]
  },
  {
    "sku": "0004",
    "name": "Silver Fringe Clutch",
    "categorySlug": "accessories",
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
    "sku": "0005",
    "name": "Golden Flower Glam Clutch",
    "categorySlug": "accessories",
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
    "sku": "0006",
    "name": "Pearly Golden Clutch",
    "categorySlug": "accessories",
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
    "sku": "0007",
    "name": "Regal Pearl Clutch",
    "categorySlug": "accessories",
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
    "sku": "0008",
    "name": "Silver Sparkle Clutch",
    "categorySlug": "accessories",
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
      "https://i.imgur.gg/aabhIRs-IMG_20260705_175203.jpg",
      "https://i.imgur.gg/qGxLZtT-IMG_20260705_175212.jpg",
      "https://i.imgur.gg/jPcQ4gh-IMG_20260705_175234.jpg"
    ]
  },
  {
    "sku": "0009",
    "name": "Gold Sparkle Clutch",
    "categorySlug": "accessories",
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
    "sku": "0010",
    "name": "Sparkly Gold Clutch",
    "categorySlug": "accessories",
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
    "sku": "0011",
    "name": "Sparkly Rose Gold Clutch",
    "categorySlug": "accessories",
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
    "sku": "0014",
    "name": "Multicolor Bangles (set of 36 pcs)",
    "categorySlug": "accessories",
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
    "sku": "0016",
    "name": "Multicolor Bangles (Set of 32pcs)",
    "categorySlug": "accessories",
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
    "sku": "0019",
    "name": "Floral Luxe Bracelet",
    "categorySlug": "bracelet",
    "price": 299,
    "compareAtPrice": 399,
    "stockQuantity": 1,
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
  },
  {
    "sku": "0020",
    "name": "Regal Green Set",
    "categorySlug": "accessories",
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
    "status": "shipped",
    "trackingId": "SRSP7452869877",
    "subtotal": 449,
    "shippingCost": 150,
    "totalAmount": 599,
    "transactionId": "pay_TDkY1cBs9hjhQa",
    "customerNotes": null,
    "adminNotes": null,
    "createdAt": "2026-07-15T05:14:50.000Z",
    "updatedAt": "2026-07-15T23:58:57.000Z",
    "items": [
      {
        "productSku": "0020",
        "productName": "Regal Green Set",
        "unitPrice": 449,
        "quantity": 1,
        "createdAt": "2026-07-15T05:14:50.000Z"
      }
    ],
    "statusHistory": [
      {
        "status": "pending",
        "notes": "Order placed",
        "createdAt": "2026-07-15T05:14:50.000Z"
      },
      {
        "status": "approved",
        "notes": "Status changed to approved",
        "createdAt": "2026-07-15T05:42:03.000Z"
      },
      {
        "status": "packaging",
        "notes": "Status changed to packaging",
        "createdAt": "2026-07-15T05:42:23.000Z"
      },
      {
        "status": "shipped",
        "notes": "Status changed to shipped",
        "createdAt": "2026-07-15T23:58:57.000Z"
      }
    ]
  }
];
