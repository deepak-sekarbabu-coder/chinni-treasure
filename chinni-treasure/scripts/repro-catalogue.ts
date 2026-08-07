// fallow-ignore-file unused-file
import { prisma } from "@/src/lib/prisma";
import { ProductsResponseSchema } from "@/src/lib/api/schemas";

async function main() {
  for (const page of [1, 2]) {
    const limit = 6;
    const skip = (page - 1) * limit;
    const where = { isActive: true } as const;
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true } },
          images: { orderBy: { displayOrder: "asc" } },
        },
        orderBy: [{ stockQuantity: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);
    const payload = {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    // Mimic what NextResponse.json() does over HTTP: serialize Dates -> ISO strings
    const serialized = JSON.parse(JSON.stringify(payload));
    const parse = ProductsResponseSchema.safeParse(serialized);
    console.log(`PAGE ${page}: total=${total} totalPages=${payload.totalPages} returned=${products.length}`);
    if (!parse.success) {
      console.log("  SCHEMA VALIDATION FAILED:");
      console.log(JSON.stringify(parse.error.issues, null, 2));
    } else {
      console.log("  schema OK, ids:", parse.data.products.map((p) => p.id).join(","));
      console.log("  raw price type:", typeof products[0]?.price, "value:", String(products[0]?.price));
    }
  }
}

main()
  .catch((e) => {
    console.error("ERROR:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
