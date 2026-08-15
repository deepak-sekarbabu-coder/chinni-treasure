import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Albert_Sans, Pinyon_Script } from "next/font/google";
import "./globals.css";
import Navbar from "@/src/components/layout/Navbar";
import Footer from "@/src/components/layout/Footer";
import { CartProvider, type CartItemDisplay } from "@/src/components/cart/CartProvider";
import { ToastProvider } from "@/src/components/ui/ToastProvider";
import { QueryProvider } from "@/src/components/providers/QueryProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import JsonLd from "@/src/components/ui/JsonLd";
import { WebVitals } from "@/lib/axiom/client";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const albert = Albert_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

const pinyon = Pinyon_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  // Decorative script font used only in the footer logo — not needed for
  // first paint. Disabling preload keeps its woff2 off the critical path.
  preload: false,
  adjustFontFallback: true,
  fallback: ["Brush Script MT", "cursive"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.chinnitreasure.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Chinni Treasure — Little Love | Artisan-Crafted Luxury Goods",
  description:
    "Discover our curated collection of artisan-crafted luxury goods. Handcrafted leather accessories, silk scarves, and premium gifts with free shipping across India.",
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
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Chinni Treasure",
    title: "Chinni Treasure — Little Love | Artisan-Crafted Luxury Goods",
    description:
      "Discover our curated collection of artisan-crafted luxury goods. Handcrafted leather accessories, silk scarves, and premium gifts with free shipping across India.",
    url: "/",
    images: [
      {
        url: "/images/branding/logo.png",
        width: 512,
        height: 512,
        alt: "Chinni Treasure — Little Love",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chinni Treasure — Little Love",
    description:
      "Discover our curated collection of artisan-crafted luxury goods.",
    images: ["/images/branding/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
  // Cart is hydrated on the client by CartProvider (localStorage / cookie) in a
  // useEffect. Reading cookies() here would force every page (including static
  // ISR pages like /category/[slug]) to become dynamic at request time.
  const initialItems: CartItemDisplay[] = [];

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Chinni Treasure",
    url: siteUrl,
    logo: `${siteUrl}/icons/icon-512x512.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9499011029",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
    },
    sameAs: [
      "https://www.instagram.com/ChinniTreasure",
      "https://www.facebook.com/ChinniTreasures",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Chinni Treasure",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/catalogue?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // Only mount Vercel Analytics & Speed Insights when running on Vercel
  // (or when explicitly enabled). Outside Vercel (local dev, self-hosted Docker,
  // Lighthouse runner), the scripts return 404 and log errors in the console.
  const isVercel = Boolean(
    process.env.VERCEL === "1" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === "true"
  );

  return (
    <html lang="en" className={`${cormorant.variable} ${albert.variable} ${pinyon.variable}`}>
      <body>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <QueryProvider>
          <CartProvider initialItems={initialItems}>
            <ToastProvider>
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <Navbar />
              <main id="main-content" role="main">
                <div className="page-transition">{children}</div>
              </main>
              <Footer />
              {isVercel && (
                <>
                  <Analytics />
                  <SpeedInsights />
                </>
              )}
              <WebVitals />
            </ToastProvider>
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
