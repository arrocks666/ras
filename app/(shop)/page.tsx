"use client";

import Link from "next/link";
import { useProducts } from "@/lib/ProductsContext";
import ProductCard from "@/components/ProductCard";
import HeroBanner from "@/components/HeroBanner";
import ShippingBanner from "@/components/ShippingBanner";
import { CATEGORIES } from "@/lib/categories";

export default function HomePage() {
  const { products, loading } = useProducts();

  // Show only products marked as Popular (isTrending = true)
  const popularProducts = products.filter((p) => p.isTrending === true);

  return (
    <div className="min-h-screen bg-[#FFF6F6] flex flex-col">
      
      {/* 1. Full Banner */}
      <HeroBanner />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-10 space-y-16">
        
        {/* 2. Categories (The 4 pink boxes) */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {CATEGORIES.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.id}`}
                className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#FDE8EC] p-4 aspect-square hover:shadow-lg transition-all duration-300"
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {cat.icon}
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <h3 className="text-xs md:text-sm font-bold text-[#2B1A24] mb-1">{cat.name}</h3>
                  <p className="text-[10px] md:text-xs text-[#E8546B] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Explore Now →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. Popular Products (Replaces "Trending") */}
        <section>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2B1A24] flex items-center gap-2">
              <span className="text-[#E8546B]">⭐</span> Popular Products
            </h2>
            <Link href="/search" className="text-sm font-semibold text-[#E8546B] hover:underline flex items-center gap-1 mb-1">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[350px] animate-pulse rounded-2xl bg-white border border-[#FAD4DD]" />
              ))}
            </div>
          ) : popularProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {popularProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#FAD4DD] shadow-sm">
              <div className="text-5xl mb-3">🎁</div>
              <p className="text-text-muted">No popular products yet. Add products from the admin panel and mark them as popular.</p>
            </div>
          )}
        </section>

        {/* 4. China to Bangladesh Banner */}
        <ShippingBanner />

        {/* 5. Why Shop With Us */}
        <section>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span className="text-[#E8546B]">♡</span> Why Shop With Us?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "👑", title: "Original Products", desc: "100% Authentic & Trendy" },
              { icon: "🏷️", title: "Affordable Prices", desc: "Best deals for you" },
              { icon: "🎧", title: "Customer Support", desc: "We're here to help!" },
              { icon: "🚚", title: "Nationwide Delivery", desc: "All over Bangladesh" },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#FAD4DD] p-4 flex flex-col items-center text-center shadow-sm">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-xs font-bold text-[#2B1A24] mb-1">{feature.title}</h3>
                <p className="text-[10px] text-[#6B5558]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* 6. Trust Badges at the BOTTOM */}
      <div className="w-full bg-white border-t border-[#FAD4DD] py-6 mt-10">
        <div className="mx-auto max-w-[1200px] px-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 divide-x-0 md:divide-x divide-[#FAD4DD]">
          {[
            { icon: "🛡️", title: "Secure Shopping", desc: "100% Secure & Safe Payments" },
            { icon: "🚚", title: "Fast Delivery", desc: "Across Bangladesh" },
            { icon: "🏭", title: "Trusted Source", desc: "Direct from China" },
            { icon: "🔄", title: "Easy Returns", desc: "Within 7 Days" },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-3 justify-center px-2">
              <div className="text-2xl">{badge.icon}</div>
              <div>
                <p className="text-[11px] font-bold text-[#2B1A24]">{badge.title}</p>
                <p className="text-[9px] text-[#6B5558]">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}