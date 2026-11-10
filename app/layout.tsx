import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { WishlistProvider } from "@/lib/WishlistContext";
import { CartProvider } from "@/lib/CartContext";
import { OrderProvider } from "@/lib/OrderContext";
import { WhatsAppProvider } from "@/lib/WhatsAppContext";
import { LiveProductProvider } from "@/lib/LiveProductContext";
import { AuthProvider } from "@/lib/AuthContext";
import { ProductsProvider } from "@/lib/ProductsContext";

const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });
const poppins = Poppins({ weight: ["300", "400", "500", "600", "700"], variable: "--font-poppins", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Ratry's Artistry Shop — Beautiful Gifts",
  description: "Trendy Products, Best Quality, Direct from China to Bangladesh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" translate="no" className={`notranslate ${poppins.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FFF6F6] text-[#2B1A24]">
        <AuthProvider>
          <ProductsProvider>
            <WishlistProvider>
              <CartProvider>
                <OrderProvider>
                  <WhatsAppProvider>
                    <LiveProductProvider>
                      {children}
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