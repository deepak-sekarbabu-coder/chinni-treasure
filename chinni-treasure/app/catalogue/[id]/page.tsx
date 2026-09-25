import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
import ProductDetailsContent from "@/src/components/pages/ProductDetailsContent";
import JsonLd from "@/src/components/ui/JsonLd";
import Breadcrumbs from "@/src/components/ui/Breadcrumbs";
import { getProductDetail } from "@/src/lib/product-read";
import { primaryImage } from "@/src/lib/product-display";
import { env } from "@/src/lib/env";

interface Props {
    params: Promise<{ id: string }>;
}

const siteUrl = env.NEXT_PUBLIC_SITE_URL;

// The read, its cache (module-owned `product-detail` tag, cleared by
// invalidateCatalogCaches), and the availability/visibility gates all live in
// product-read — this page only shapes the response. Passing the host keeps the
// cache key request-neutral: one host's visibility decision is never served to
// another.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const { id } = await params;
        const product = await getProductDetail(id, (await headers()).get("host"));
        if (!product) return { title: "Product Not Found — Chinni Treasure" };
        // The one primary-image pick, shared with the gallery and JSON-LD.
        const image = primaryImage(product);
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
                images: [{ url: image, alt: product.name }],
            },
            twitter: {
                card: "summary_large_image",
                title: `${product.name} — Chinni Treasure`,
                description: product.description || `View ${product.name} at Chinni Treasure.`,
                images: [image],
            },
        };
    } catch {
        return { title: "Product — Chinni Treasure" };
    }
}

export default async function ProductDetailsPage({ params }: Props) {
    const { id } = await params;

    // null = missing, inactive, soft-deleted, or not visible on this host.
    const product = await getProductDetail(id, (await headers()).get("host"));

    if (!product) notFound();

    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || undefined,
        sku: product.sku || undefined,
        image: primaryImage(product),
        offers: {
            "@type": "Offer",
            url: `${siteUrl}/catalogue/${product.id}`,
            priceCurrency: "INR",
            price: product.price,
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
            <ProductDetailsContent product={product} />
        </>
    );
}
