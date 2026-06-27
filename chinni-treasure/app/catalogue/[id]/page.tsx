import { prisma } from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailsContent from "@/src/components/pages/ProductDetailsContent";
import JsonLd from "@/src/components/ui/JsonLd";
import Breadcrumbs from "@/src/components/ui/Breadcrumbs";

interface Props {
    params: Promise<{ id: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.chinnitreasure.in";

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
            alternates: {
                canonical: `/catalogue/${product.id}`,
            },
            openGraph: {
                title: `${product.name} — Chinni Treasure`,
                description: product.description || `View ${product.name} at Chinni Treasure.`,
                url: `/catalogue/${product.id}`,
                images: product.imageUrl
                    ? [{ url: product.imageUrl, alt: product.name }]
                    : [],
            },
            twitter: {
                card: "summary_large_image",
                title: `${product.name} — Chinni Treasure`,
                description: product.description || `View ${product.name} at Chinni Treasure.`,
                images: product.imageUrl ? [product.imageUrl] : [],
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

    const price = Number(product.price);

    const productData = {
        id: product.id,
        name: product.name,
        price,
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

    const primaryImage = product.images.find((img) => img.isPrimary)?.url || product.imageUrl;

    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || undefined,
        sku: product.sku || undefined,
        image: primaryImage || undefined,
        offers: {
            "@type": "Offer",
            url: `${siteUrl}/catalogue/${product.id}`,
            priceCurrency: "INR",
            price,
            availability: product.stockQuantity > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingRate: {
                    "@type": "MonetaryAmount",
                    value: 0,
                    currency: "INR",
                },
                shippingDestination: {
                    "@type": "DefinedRegion",
                    addressCountry: "IN",
                },
            },
        },
        ...(product.category
            ? {
                category: product.category.name,
            }
            : {}),
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: siteUrl,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Collection",
                item: `${siteUrl}/catalogue`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: product.name,
            },
        ],
    };

    return (
        <>
            <JsonLd data={productSchema} />
            <JsonLd data={breadcrumbSchema} />
            <Breadcrumbs
                crumbs={[
                    { label: "Home", href: "/" },
                    { label: "Collection", href: "/catalogue" },
                    { label: product.name },
                ]}
            />
            <ProductDetailsContent product={productData} />
        </>
    );
}
