import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Albert_Sans, Pinyon_Script } from "next/font/google";
import "./globals.css";
import Navbar from "@/src/components/layout/Navbar";
import Footer from "@/src/components/layout/Footer";
import { CartProvider, type CartItemDisplay } from "@/src/components/cart/CartProvider";
import { ToastProvider } from "@/src/components/ui/ToastProvider";
import { QueryProvider } from "@/src/components/providers/QueryProvider";
import { getCartFromCookies } from "@/src/lib/cart-cookie";
import { prisma } from "@/src/lib/prisma";
import PageTransition from "@/src/components/layout/PageTransition";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const albert = Albert_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const pinyon = Pinyon_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Chinni Treasure — ❤️ Little Love ❤️",
  description:
    "Discover our curated collection of artisan-crafted luxury goods. Enjoy free shipping on all orders.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chinni Treasure",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#c9a227",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialItems: CartItemDisplay[] = [];
  try {
    const cookieItems = await getCartFromCookies();
    if (cookieItems.length > 0) {
      const productIds = cookieItems.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        select: { id: true, name: true, price: true, imageUrl: true, stockQuantity: true },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));
      initialItems = cookieItems
        .map((ci) => {
          const p = productMap.get(ci.productId);
          if (!p) return null;
          return {
            productId: p.id,
            name: p.name,
            price: Number(p.price),
            quantity: ci.quantity,
            image: p.imageUrl,
            stock: p.stockQuantity,
          };
        })
        .filter((x): x is CartItemDisplay => x !== null);
    }
  } catch {
    // Cart SSR hydration failed silently — cart will hydrate from localStorage on client
  }

  return (
    <html lang="en" className={`${cormorant.variable} ${albert.variable} ${pinyon.variable}`}>
      <body>
        <QueryProvider>
          <CartProvider initialItems={initialItems}>
            <ToastProvider>
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <Navbar />
              <main id="main-content" role="main">
                <PageTransition>{children}</PageTransition>
              </main>
              <Footer />
            </ToastProvider>
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
