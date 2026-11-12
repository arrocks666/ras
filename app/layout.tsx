import type { Metadata, Viewport } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/lib/AuthContext";
import { ProductsProvider } from "@/lib/ProductsContext";
import { WishlistProvider } from "@/lib/WishlistContext";
import { CartProvider } from "@/lib/CartContext";
import { OrderProvider } from "@/lib/OrderContext";
import { WhatsAppProvider } from "@/lib/WhatsAppContext";
import { LiveProductProvider } from "@/lib/LiveProductContext";
import AppShell from "@/components/AppShell"; // ✅ Import AppShell

const poppins = Poppins({ weight: ["300", "400", "500", "600", "700"], variable: "--font-poppins", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Ratry's Artistry Shop",
  description: "Trendy Products from China to Bangladesh.",
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
                      
                      {/* ✅ Use AppShell to handle Header/Footer conditionally */}
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