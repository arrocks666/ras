import type { Metadata, Viewport } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./premium.css";

import { AuthProvider } from "@/lib/AuthContext";
import { ProductsProvider } from "@/lib/ProductsContext";
import { WishlistProvider } from "@/lib/WishlistContext";
import { CartProvider } from "@/lib/CartContext";
import { OrderProvider } from "@/lib/OrderContext";
import { WhatsAppProvider } from "@/lib/WhatsAppContext";
import { LiveProductProvider } from "@/lib/LiveProductContext";
import AppShell from "@/components/AppShell";

const poppins = Poppins({ weight: ["300", "400", "500", "600", "700"], variable: "--font-poppins", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });

const SITE_URL = "https://ratrisartistry.com";
const SITE_NAME = "Ratri's Artistry";
const TITLE = "Ratri's Artistry — Trendy Products from China to Bangladesh";
const SITE_DESCRIPTION =
  "Trendy imported fashion, jewelry and accessories from China — delivered all over Bangladesh. Cash on delivery, bKash and Nagad accepted.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#E8546B",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Ratri's Artistry",
    "online shop Bangladesh",
    "imported jewelry Bangladesh",
    "trendy accessories",
    "cash on delivery",
    "bKash",
    "Nagad",
    "1688 products",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US", images: [{ url: "/og.png", width: 1200, height: 630, type: "image/png" }],
  },
  twitter: {
    card: "summary_large_image", images: ["/og.png"],
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
      { url: "/logo.png", type: "image/png", sizes: "192x192" },
      { url: "/logo.png", type: "image/png", sizes: "48x48" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/logo.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/logo.png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FFF6F6] text-[#2B1A24]">
        <AuthProvider>
          <ProductsProvider>
            <WishlistProvider>
              <CartProvider>
                <OrderProvider>
                  <WhatsAppProvider>
                    <LiveProductProvider>
                      <AppShell>
                        {children}
                      </AppShell>
                    </LiveProductProvider>
                  </WhatsAppProvider>
                </OrderProvider>
              </CartProvider>
            </WishlistProvider>
          </ProductsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
