import { prisma } from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailsContent from "@/src/components/pages/ProductDetailsContent";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: { category: { select: { name: true } } },
        });
        if (!product) return { title: "Product Not Found — Chinni Treasure" };
        return {
            title: `${product.name} — Chinni Treasure`,
            description: product.description || `View ${product.name} at Chinni Treasure.`,
            openGraph: {
                images: product.imageUrl ? [{ url: product.imageUrl }] : [],
            },
        };
    } catch {
        return { title: "Product — Chinni Treasure" };
    }
}

export default async function ProductDetailsPage({ params }: Props) {
    const { id } = await params;

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            category: { select: { name: true } },
            images: { orderBy: { displayOrder: "asc" } },
        },
    });

    if (!product || !product.isActive) {
        notFound();
    }

    const productData = {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.imageUrl ?? "",
        description: product.description ?? "",
        category: product.category,
        stockQuantity: product.stockQuantity,
        badge: product.badge,
        sku: product.sku,
        images: product.images.map((img) => ({
            id: img.id,
            url: img.url,
            isPrimary: img.isPrimary,
            displayOrder: img.displayOrder,
        })),
    };

    return <ProductDetailsContent product={productData} />;
}
