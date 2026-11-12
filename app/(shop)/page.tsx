"use client";

import Link from "next/link";
import { useProducts } from "@/lib/ProductsContext";
import ProductCard from "@/components/ProductCard";
import HeroBanner from "@/components/HeroBanner";

export default function HomePage() {
  const { products, loading } = useProducts();
  const popularProducts = products?.filter((p) => p.isTrending === true) || [];
  const weeklySaleProducts = products?.filter((p) => (p as any).isWeeklySale === true) || [];

  return (
    <div className="min-h-screen bg-[#FFF6F6] flex flex-col pb-20 md:pb-0">
      
      {/* ==========================================
          📱 MOBILE APP VIEW (block md:hidden)
          ========================================== */}
      <div className="block md:hidden flex-col pb-4">
        
        <div className="w-full">
          <HeroBanner />
        </div>

        <div className="px-4 mt-6">
          <div className="grid grid-cols-4 gap-2 bg-white rounded-2xl p-4 shadow-sm border border-[#FAD4DD]">
            {[
              { icon: "🛍️", label: "New Arrivals" },
              { icon: "🔥", label: "Best Sellers" },
              { icon: "🗂️", label: "Categories" },
              { icon: "🚚", label: "Track Order" },
            ].map((badge, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="text-2xl">{badge.icon}</div>
                <span className="text-[9px] font-bold text-[#2B1A24] text-center leading-tight">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {weeklySaleProducts.length > 0 && (
          <section className="px-4 mt-8">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#E8546B] flex items-center gap-2">🔥 Weekly Sale</h2>
                <p className="text-[11px] text-[#6B5558] mt-1">Limited time offers. Grab them before they're gone!</p>
              </div>
              <Link href="/search?sale=true" className="text-[11px] font-semibold text-[#E8546B]">View All →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {weeklySaleProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ✅ SHOWS ALL POPULAR PRODUCTS */}
        <section className="px-4 mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#2B1A24] flex items-center gap-2">⭐ Popular Products</h2>
              <p className="text-[11px] text-[#6B5558] mt-1">Trending products loved by thousands!</p>
            </div>
            <Link href="/search" className="text-[11px] font-semibold text-[#E8546B]">View All →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-[240px] animate-pulse rounded-2xl bg-white border border-[#FAD4DD]" />
              ))
            ) : (
              popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </section>

        <div className="px-4 mt-10">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🛡️", title: "100% Authentic", desc: "Verified suppliers" },
              { icon: "💎", title: "Best deals for you", desc: "Unbeatable prices" },
              { icon: "🎧", title: "We're here to help!", desc: "24/7 Support" },
              { icon: "🚚", title: "All over Bangladesh", desc: "Fast delivery" },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#FAD4DD] p-3 flex items-center gap-2 shadow-sm">
                <div className="text-xl">{feature.icon}</div>
                <div>
                  <h3 className="text-[11px] font-bold text-[#2B1A24] leading-tight">{feature.title}</h3>
                  <p className="text-[9px] text-[#6B5558]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==========================================
          💻 DESKTOP VIEW (hidden md:block)
          ========================================== */}
      <div className="hidden md:block">
        <HeroBanner />
        
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-10 space-y-16">
          {weeklySaleProducts.length > 0 && (
            <section>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h2 className="font-serif text-3xl font-bold text-[#E8546B] flex items-center gap-2"><span className="text-2xl">🔥</span> Weekly Sale</h2>
                  <p className="text-sm text-[#6B5558] font-medium mt-1">Limited time offers. Grab them before they're gone!</p>
                  <div className="h-1 w-12 bg-[#E8546B] rounded-full mt-2" />
                </div>
                <Link href="/search?sale=true" className="text-sm font-semibold text-[#E8546B] hover:underline">View All →</Link>
              </div>
              <div className="grid grid-cols-4 gap-6">
                {weeklySaleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            </section>
          )}

          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="font-serif text-3xl font-bold text-[#2B1A24] flex items-center gap-2"><span className="text-[#E8546B]">⭐</span> Popular Products</h2>
                <div className="h-1 w-10 bg-[#E8546B] rounded-full mt-1.5" />
              </div>
              <Link href="/search" className="text-sm font-semibold text-[#E8546B] hover:underline">View All →</Link>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="h-[350px] animate-pulse rounded-2xl bg-white border border-[#FAD4DD]" />
                ))
              ) : (
                popularProducts.map((product) => <ProductCard key={product.id} product={product} />)
              )}
            </div>
          </section>

          {/* Desktop Premium Banner */}
          <section className="relative overflow-hidden rounded-[3rem] bg-[#FFF6F6] border border-[#FAD4DD] shadow-[0_20px_60px_-15px_rgba(232,84,107,0.15)] flex items-stretch min-h-[500px]">
            <div className="relative z-10 flex-1 p-16 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-bold tracking-widest text-[#E8546B] uppercase mb-8 shadow-sm border border-[#FAD4DD] w-fit">
                <span className="h-2 w-2 rounded-full bg-[#E8546B] animate-pulse" />
                The Ratry's Experience
              </div>
              <h2 className="font-serif text-5xl lg:text-6xl font-bold text-[#2B1A24] leading-[1.1] mb-6">
                Curated With Love, <br />
                <span className="text-gradient">Delivered with Care.</span>
              </h2>
              <p className="text-[#6B5558] text-lg mb-10 max-w-lg leading-relaxed font-medium">
                Experience the best of Chinese craftsmanship. We handpick premium products, negotiate the best prices, and deliver them straight to your door in Bangladesh.
              </p>
              <div className="flex items-center gap-4">
                <Link href="/search" className="inline-flex items-center gap-2 rounded-full bg-[#E8546B] px-8 py-4 text-sm font-bold text-white shadow-[0_10px_30px_rgba(232,84,107,0.3)] transition-all hover:scale-105 hover:bg-[#d1475e]">
                  Start Shopping
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block w-[45%]">
              <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1000&auto=format&fit=crop" alt="Premium Gift" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFF6F6] via-transparent to-transparent" />
              <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-[#FAD4DD] w-64 animate-float">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-[#FDE8EC] flex items-center justify-center text-xl">✈️</div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A88F92]">Direct Import</p>
                    <p className="text-sm font-bold text-[#2B1A24]">China → BD</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-[#FAD4DD] rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-[#E8546B] rounded-full" />
                  </div>
                  <p className="text-[10px] font-medium text-[#6B5558]">In transit - 75% complete</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5 px-1">
              <h2 className="font-serif text-xl md:text-2xl font-bold text-[#2B1A24] flex items-center gap-2">
                <span className="text-[#E8546B]">♡</span> Why Shop With Us?
              </h2>
              <div className="h-1 w-12 bg-[#E8546B] rounded-full mt-2" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { icon: "👑", title: "Original Products", desc: "100% Authentic" },
                { icon: "🏷️", title: "Affordable Prices", desc: "Best deals for you" },
                { icon: "🎧", title: "Customer Support", desc: "We're here to help!" },
                { icon: "🚚", title: "Nationwide Delivery", desc: "All over Bangladesh" },
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#FAD4DD] p-4 flex flex-col items-center text-center shadow-sm hover:-translate-y-1 transition-transform">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="text-xs md:text-sm font-bold text-[#2B1A24] mb-1">{feature.title}</h3>
                  <p className="text-[10px] md:text-xs text-[#6B5558]">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}