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
    "sku": "0016",
    "name": "Multicolor Bangles (Set of 36 pcs)",
    "categorySlug": "accessories",
    "price": 760,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/noGuuZz-IMG_20260626_162815.jpg",
    "description": "# Multi Color Bangles (Set of 36 pcs)\n\n## 🛍️ Product Details\n- **Price:** 760 Rs\n- **Color:** Multicolor\n- **Material:** Glass and metal type\n- **Size:** 2/4\n\n## ✨ Description\n- Delicate ghungroo(bell) embellishments create a melodious tinkling sound with every graceful movement of your wrist.\n- Crafted with meticulous attention to each bangle.\n- Intricately embraced with ghungroo and stone details.\n- Exceptional craftmanship to create a bold and eye-catching look.\n\n## 💎 Why Choose This?\n- Premium bangles set offered in a cost-effective range.\n- Perfect for festive occasions or weddings.",
    "badge": "premium",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/noGuuZz-IMG_20260626_162815.jpg"
    ]
  },
  {
    "sku": "0006",
    "name": "Pearly Golden Clutch",
    "categorySlug": "accessories",
    "price": 1450,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/ISUicHP-IMG_20260705_164031.jpg",
    "description": "# Pearly Golden Clutch\n\n## 🛍️ Product Details\n- **Price:** 1450Rs  \n- **Color:** Pearl & Gold\n\n## ✨ Features\n- High-Lustre faux pearls & shimmering golden stone details, decorative handle, detachable gold chain, designer gold finish at the back and a front flap closure.\n\n## ✨ Description\n- A Premium clutch in a glam look crafted with meticulous gold stone embellishment details.\n- A structured rectangular shape with a gold tone that makes it stand out as a statement.\n- High-lustre faux pearl details for a rich look.\n- Suits for bridesmaid, festive, wedding, luxury occasion and gifting.\n- Spacious yet compact size, easy to carry for events and functions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "premium",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/ISUicHP-IMG_20260705_164031.jpg"
    ]
  },
  {
    "sku": "0009",
    "name": "Gold Sparkle Clutch",
    "categorySlug": "accessories",
    "price": 1050,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/m7e3KzM-IMG_20260705_180129.jpg",
    "description": "# Gold Sparkle Clutch\n\n## 🛍️ Product Details\n- **Price:** 1050 Rs  \n- **Color:** Gold\n\n## ✨ Features\n- Gem Clasp, Premium gold frame, semicircular handle, detachable gold chain, Handcrafted gold texture.\n\n## ✨ Description\n- A Premium clutch with faceted gem clasp & polished gold-tone frame with handle & detachable gold chain.\n- Handcrafted textured gold finish for a unique artisan look.\n- The gold shimmering textured finish creates a premium contrast that feels both modern & classic.\n- Suits for indo-western outfit, events, parties & special occasions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium gemstone and sparkle details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "premium",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/m7e3KzM-IMG_20260705_180129.jpg"
    ]
  },
  {
    "sku": "0007",
    "name": "Regal Pearl Clutch",
    "categorySlug": "accessories",
    "price": 2050,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/dk4udev-IMG_20260705_162352.jpg",
    "description": "# Regal Pearl Clutch\n\n## 🛍️ Product Details\n- **Price:** 2050 Rs  \n- **Color:** Silver\n\n## ✨ Features\n- Decorative lock, detachable silver chain, premium quality frame, metallic silver finish handle with stone designer finish at the back.\n\n## ✨ Description\n- A Luxurious glam clutch crafted with meticulous premium pearls and stone embellishment details.\n- A Structured rectangular shape & a silver toned frame that makes it stand out as a statement.\n- Suits for luxury occasions, wedding, festive, gifting & bridesmaid.\n- Premium shining stonework for a rich look.\n- Spacious yet compact size, easy to carry for events and functions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium pearls and stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium silver finish and spacious to keep your things safe.",
    "badge": "luxury",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/dk4udev-IMG_20260705_162352.jpg"
    ]
  },
  {
    "sku": "0013",
    "name": "Designer Bangle Organizer Box",
    "categorySlug": "organizer",
    "price": 799,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/ABT4Rup-white-jewelry-box-closed-front.jpg",
    "description": "# 6 – Rod Bangle Organizer\n\n## 📏 Dimensions\n- **Length:** 17 in / 44 cm\n- **Width:** 10 in / 26 cm\n\n## 🎨 Appearance\n- **Color:** Cream White\n- **Material:** Engineered wood with premium fabric cutwork\n\n## ✨ Special Features\n- Lightweight yet sturdy design\n- Spacious storage with 6 rods\n- Convenient handle for portability\n- Dual secure locks for safety\n- Built-in mirror for added utility\n\n## 📝 Product Description\nCrafted to protect what matters most. Premium bangle organizer with a luxurious designer finish, secure lock and sturdy design to safely organize your precious bangle collection.\n\n## 💎 Why Choose This Treasure?\n- Unique handcrafted masterpiece\n- Tuff to find this hidden gem in other social platforms\n- Luxurious product at a cost-effective range\n- Beauty begins with organization\n- Give your cherished bangles the elegant home they deserve.",
    "badge": "limited",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/ABT4Rup-white-jewelry-box-closed-front.jpg"
    ]
  },
  {
    "sku": "0011",
    "name": "Sparkly Rose Gold Clutch",
    "categorySlug": "accessories",
    "price": 850,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/nlrXFTJ-IMG_20260705_174428.jpg",
    "description": "# Sparkly Rose Gold Clutch\n\n## 🛍️ Product Details\n- **Price:** 850Rs  \n- **Color:** Rose Gold\n\n## ✨ Features\n- Detachable gold chain, designer shimmer textured finish, a structured rectangular shape with rounded edges and a gold-tone top clasp.\n\n## ✨ Description\n- A beautiful clutch that combines sparkle elegance & convenience in one luxurious design.\n- This elegant clutch is designed to elevate any outfit with its shimmering finish & premium gold frame detailing.\n- Compact shape makes it easy to carry boldly & glow beautifully.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium designer finish details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium rose gold finish and spacious to keep your things safe.",
    "badge": "limited",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/nlrXFTJ-IMG_20260705_174428.jpg"
    ]
  },
  {
    "sku": "0008",
    "name": "Silver Sparkle Clutch",
    "categorySlug": "accessories",
    "price": 1050,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/Edoe0pu-IMG_20260705_175047.jpg",
    "description": "# Silver Sparkle Clutch\n\n## 🛍️ Product Details\n- **Price:** 1050 Rs  \n- **Color:** Silver\n\n## ✨ Features\n- Gem Clasp, Premium gold frame, semicircular handle, detachable gold chain, Handcrafted silver texture.\n\n## ✨ Description\n- A Premium clutch with faceted gem clasp & polished gold-tone frame with handle & detachable gold chain.\n- Handcrafted textured silver finish for a unique artisan look.\n- The silver shimmering textured finish creates a premium contrast that feels both modern & classic.\n- Suits for indo-western outfit, events, parties & special occasions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium gemstone and sparkle details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "premium",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/Edoe0pu-IMG_20260705_175047.jpg"
    ]
  },
  {
    "sku": "0014",
    "name": "Multicolor Bangles (set of 36 pcs)",
    "categorySlug": "accessories",
    "price": 860,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/GUQy7if-WhatsApp_Image_2026-07-02_at_10.08.35_AM_(1).jpeg",
    "description": "# Multicolor Bangles (Set of 36pcs)\n\n## 🛍️ Product Details\n- **Price:** 860 Rs  \n- **Color:** Multicolor\n- **Material:** Glass & Metal type \n- **Size:** 2/4  \n\n## ✨ Description\n- Crafted with meticulous attention to each bangle.\n- Intricately embraced with kundan, beads and stone details.\n- Exceptional craftmanship to create a bold and eye-catching look.\n\n## 💎 Why Choose This?\n- Premium bangles set offered in a cost-effective range.\n- Perfect for festive occasions or weddings.\n- Unique Premium collection & rare to find in other social platforms.",
    "badge": "premium",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/GUQy7if-WhatsApp_Image_2026-07-02_at_10.08.35_AM_(1).jpeg"
    ]
  },
  {
    "sku": "0010",
    "name": "Sparkly Gold Clutch",
    "categorySlug": "accessories",
    "price": 850,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/yqos8ez-IMG_20260705_175739.jpg",
    "description": "# Sparkly Gold Clutch\n\n## 🛍️ Product Details\n- **Price:** 850Rs  \n- **Color:** Gold\n\n## ✨ Features\n- Detachable gold chain, designer shimmer textured finish, a structured rectangular shape with rounded edges and a gold-tone top clasp.\n\n## ✨ Description\n- A beautiful clutch that combines sparkle elegance & convenience in one luxurious design.\n- This elegant clutch is designed to elevate any outfit with its shimmering finish & premium gold frame detailing.\n- Compact shape makes it easy to carry boldly & glow beautifully.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium designer finish.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "limited",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/yqos8ez-IMG_20260705_175739.jpg"
    ]
  },
  {
    "sku": "0012",
    "name": "Designer Bangle Organizer Box",
    "categorySlug": "organizer",
    "price": 799,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/J2iAGgM-red-jewelry-box-front-view.jpg",
    "description": "# 6 – Rod Bangle Organizer\n\n## 📏 Dimensions\n- **Length:** 17 in / 44 cm\n- **Width:** 10 in / 26 cm\n\n## 🎨 Appearance\n- **Color:** Maroon\n- **Material:** Engineered wood with premium fabric cutwork\n\n## ✨ Special Features\n- Lightweight yet sturdy design\n- Spacious storage with 6 rods\n- Convenient handle for portability\n- Dual secure locks for safety\n- Built-in mirror for added utility\n\n## 📝 Product Description\nCrafted to protect what matters most. Premium bangle organizer with a luxurious designer finish, secure lock and sturdy design to safely organize your precious bangle collection.\n\n## 💎 Why Choose This Treasure?\n- Unique handcrafted masterpiece\n- Tuff to find this hidden gem in other social platforms\n- Luxurious product at a cost-effective range\n- Beauty begins with organization\n- Give your cherished bangles the elegant home they deserve.",
    "badge": "limited",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/J2iAGgM-red-jewelry-box-front-view.jpg"
    ]
  },
  {
    "sku": "0017",
    "name": "Pink Velvet Bangle Set",
    "categorySlug": "bangles",
    "price": 860,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/cArGP3I-IMG_20260626_155904.jpg",
    "description": "# Pink Velvet Bangles (Set of 18 pcs)\n\n## 🛍️ Product Details\n- **Price:** 860 Rs\n- **Color:** Pink\n- **Material:** Premium Velvet with metal type\n- **Size:** 2/4\n\n## ✨ Description\n- Crafted with meticulous attention to each bangle.\n- Intricately embraced with kundan, pearl and stone details.\n- Exceptional craftmanship to create a bold and eye-catching look.\n\n## 💎 Why Choose This?\n- Premium bangles set offered in a cost-effective range.\n- Perfect for festive occasions or weddings.\n- Unique Premium collection & rare to find in other social platforms.",
    "badge": "premium",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/cArGP3I-IMG_20260626_155904.jpg"
    ]
  },
  {
    "sku": "0004",
    "name": "Silver Fringe Clutch",
    "categorySlug": "accessories",
    "price": 1650,
    "stockQuantity": 0,
    "imageUrl": "https://i.imgur.gg/dEvA4vE-IMG_20260705_165128.jpg",
    "description": "# Silver Fringe Clutch\n\n## 🛍️ Product Details\n- **Price:** 1650Rs  \n- **Color:** Silver\n\n## Features\n-  Decorative lock clasp, Detachable gold chain, rhinestone fringe, marquise cut crystals, premium fine seed beads, satin fabric inside, premium velvet finish at the back, gold metal handle.\n\n## ✨ Description\n- A luxurious clutch in a glam look embellished with premium fine seed beads and rhinestone fringe details with premium metallic gold finish handle.\n- Suits for bridesmaid, wedding, luxury occasion, festive and cocktail party.\n- Spacious yet compact size, easy to carry for events and functions.\n- Premium shining stone details for a rich look.\n\n## 💎 Why Choose This Treasure?\n- Crafted with meticulous attention.\n- Intricately embellished with crystals, fine seed beads and premium Rhinestone fringe details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Premium gold finish handle.",
    "badge": "luxury",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/dEvA4vE-IMG_20260705_165128.jpg"
    ]
  },
  {
    "sku": "0002",
    "name": "Golden Luxe Pearl Clutch",
    "categorySlug": "accessories",
    "price": 1650,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/YGmcHhj-IMG_20260705_163627.jpg",
    "description": "# Golden Luxe Pearl Clutch\n\n## 🛍️ Product Details\n- **Price:** 1650 Rs  \n- **Color:** Gold\n\n## Features\n-  A front flap closure, premium stone details on handle, handcrafted beadwork, detachable chain, soft premium fabric inside, metallic gold tone finish at the back.\n\n## ✨ Description\n- A Luxurious clutch in a glam look embellished with premium pearls & stone details.\n- A structured rectangular shape, & a semicircular handle intricated with stone details that makes it standout as a statement.\n- Suits for bridesmaid, wedding, luxury occasion, festive & cocktail party.\n- Spacious yet compact size, easy to carry for events and functions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium pearls and stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "luxury",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/YGmcHhj-IMG_20260705_163627.jpg"
    ]
  },
  {
    "sku": "0001",
    "name": "Luxury Multicolor Sparkle Clutch",
    "categorySlug": "accessories",
    "price": 2050,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/SAQefIg-IMG_20260705_173943.jpg",
    "description": "# Luxury Multicolor Sparkle Clutch\n\n## 🛍️ Product Details\n- **Price:** 2050 Rs  \n- **Color:** Multicolor\n\n## Features\n- Lock, Detachable Chain, Premium Quality frame, metallic gold finish, rhinestone embellishment, soft satin fabric inside.\n\n## ✨ Description\n- A Luxurious clutch in a glam look with heavy sparkle in both sides.\n- A structured rectangular shape & a gold toned frame that makes it standout as a statement accessory.\n- Suits for bridesmaid, wedding, festive &  cocktail party.\n- Premium shining stone work for rich look.\n- Elegant gold tone that matches ethnic & party wear.\n- Compact size easy to carry for events and functions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium rhino stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold and spacious finish to keep your things safe.",
    "badge": "luxury",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/SAQefIg-IMG_20260705_173943.jpg"
    ]
  },
  {
    "sku": "0015",
    "name": "Royal Queen Bangles (Set of 36 pcs)",
    "categorySlug": "bangles",
    "price": 860,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/4Io8TUt-WhatsApp_Image_2026-07-02_at_10.06.00_AM_(1).jpeg",
    "description": "# Royal Queen Bangles (Set of 36pcs)\n\n## 🛍️ Product Details\n- **Price:** 860 Rs  \n- **Color:** Bottle Green\n- **Material:**Glass & metal type  \n- **Size:** 2/4  \n\n## ✨ Description\n- Crafted with meticulous attention to each bangle.\n- Intricately embellished with emerald, ruby, pearl and stone details.\n\n## 💎 Why Choose This?\n- Royal bangles set in a cost-effective range.\n- Exceptional craftmanship to create a bold and eye-catching look.\n- Unique premium collection and rare to find in other social platforms.",
    "badge": "premium",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/4Io8TUt-WhatsApp_Image_2026-07-02_at_10.06.00_AM_(1).jpeg"
    ]
  },
  {
    "sku": "0003",
    "name": "Golden Eagle Glam Clutch",
    "categorySlug": "accessories",
    "price": 2050,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/98usj1m-IMG_20260703_111740.jpg",
    "description": "# Golden Eagle Glam Clutch\n\n## 🛍️ Product Details\n- **Price:** 2050 Rs  \n- **Color:** Gold\n\n## ✨ Features\n- Decorative lock, detachable gold chain, premium quality gold frame, metallic gold finish handle, designer gold fabric at the back.\n\n## ✨ Description\n- A Luxurious clutch in a glam look crafted with meticulous premium stone embellishment details.\n- A Structured rectangular shape & a gold toned frame that makes it stand out as a statement.\n- Suits for luxury occasions, wedding, festive & bridesmaid.\n- Premium shining stonework for a rich look.\n- Spacious yet compact size, easy to carry for events and functions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "luxury",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/98usj1m-IMG_20260703_111740.jpg"
    ]
  },
  {
    "sku": "0005",
    "name": "Golden Flower Glam Clutch",
    "categorySlug": "accessories",
    "price": 2050,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/KubkjRp-IMG_20260705_164746.jpg",
    "description": "# Golden Flower Glam Clutch\n\n## 🛍️ Product Details\n- **Price:** 2050 Rs  \n- **Color:** Gold\n\n## ✨ Features\n- Decorative lock, detachable gold chain, premium quality gold frame, metallic gold finish handle, designer gold fabric at the back.\n\n## ✨ Description\n- A Luxurious clutch in a glam look crafted with meticulous premium stone embellishment details.\n- A Structured rectangular shape & a gold toned frame that makes it stand out as a statement.\n- Suits for luxury occasions, wedding, festive & bridesmaid.\n- Premium shining stonework for a rich look.\n- Spacious yet compact size, easy to carry for events and functions.\n\n## 💎 Why Choose This Treasure?\n- Luxury clutch offered in a cost-effective range.\n- Crafted with meticulous attention.\n- Intricately embellished with premium stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.\n- Premium gold finish and spacious to keep your things safe.",
    "badge": "luxury",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/KubkjRp-IMG_20260705_164746.jpg"
    ]
  },
  {
    "sku": "0020",
    "name": "Regal Green Set",
    "categorySlug": "accessories",
    "price": 449,
    "stockQuantity": 0,
    "imageUrl": "https://i.imgur.gg/XmbBFvK-IMG_20260705_191751.jpg",
    "description": "# Regal Green Set\n\n## 🛍️ Product Details\n- **Price:** 449Rs  \n- **Color:** Premium Pearls with Green Stone\n\n## ✨ Features\n- Premium Pearl Necklace set, Luxurious touch with green stone detailing as center piece surrounded with stone details, Luxury packaging in velvet box for gifting.\n\n## ✨ Description\n- Elegant, handcrafted pearl necklace set with rich velvet box.\n- The Regal set features beautiful green stone detailing with premium traditional look.\n- This necklace set adds a royal touch to any ethnic outfit.\n- Lightweight classy and eye catchy.\n- Perfect for festive, gifting and any special occasion.\n\n## 💎 Why Choose This Treasure?\n- A graceful handcrafted regal green necklace set with a sparkling stone detail to enhance your look.\n- Crafted with meticulous attention.\n- Intricately embellished with premium pearls and green stone as center piece.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Rare to find in other social platforms.",
    "badge": "premium",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/XmbBFvK-IMG_20260705_191751.jpg"
    ]
  },
  {
    "sku": "0019",
    "name": "Floral Luxe Bracelet",
    "categorySlug": "bracelet",
    "price": 299,
    "stockQuantity": 1,
    "imageUrl": "https://i.imgur.gg/1XOqHkj-IMG_20260705_183745.jpg",
    "description": "# Floral Luxe Bracelet\n\n## 🛍️ Product Details\n- **Price:** 299Rs\n- **Color:** Gold\n- **Material:** 18K gold plating over alloy\n\n## Features\n-  Adjustable hook clasp, handcrafted Premium bracelet, Elegant Light pink floral bloom motif with luxe stone finish, luxury packaging in velvet box for gift ready package.\n\n## ✨ Description\n- A Little sparkle, a lot of luxury.\n- Designed for festive & gifting wear.\n- A statement piece that feels refined & exclusive.\n- A graceful handcrafted bracelet featuring polished metallic two hearts and a sparkling floral bloom in center piece with ghungaroo to enhance your every hand movement gesture.\n\n## 💎 Why Choose This Treasure?\n- Crafted with meticulous attention.\n- Intricately embellished with four cubic stone details like a diamond finish\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Luxury velvet box packing for gifting.\n- Rare to find in other social platforms.\n- Premium gold finish.",
    "badge": "limited",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/1XOqHkj-IMG_20260705_183745.jpg"
    ]
  },
  {
    "sku": "0018",
    "name": "Heart Luxe Bracelet",
    "categorySlug": "bracelet",
    "price": 299,
    "stockQuantity": 0,
    "imageUrl": "https://i.imgur.gg/vQKNhBB-IMG_20260705_182930.jpg",
    "description": "# Heart Luxe Bracelet\n\n## 🛍️ Product Details\n- **Price:** 299 Rs  \n- **Color:** Gold\n- **Material:** 18K gold plating over alloy\n\n## Features\n-  Handcrafted Premium Bracelet, Adjustable hook clasp.\n-  Elegant heart motif with Luxe stone finish.\n-  Luxury packing in velvet box for gift ready package.\n \n\n## ✨ Description\n- A Little Sparkle, a lot of luxury.\n- Luxury in every detail.\n- A statement piece that feels refined and exclusive.\n- Designed for gifting, festive, bridal and everyday wear.\n- Handcrafted to make every gesture shine.\n- A graceful, handcrafted bracelet featuring polished metallic bead and a sparkling heart center piece and premium stone details with ghungaroo to enhance your every hand movement gesture.\n\n## 💎 Why Choose This Treasure?\n- Crafted with meticulous attention.\n- Intricately embellished with red crystal and premium stone details.\n- Exceptional craftsmanship to create a bold and eye-catching look.\n- Luxury velvet box packing for gifting.\n- Rare to find in other social platforms.\n- Premium gold finish.",
    "badge": "limited",
    "isActive": true,
    "compareAtPrice": null,
    "additionalImages": [
      "https://i.imgur.gg/vQKNhBB-IMG_20260705_182930.jpg"
    ]
  }
];
