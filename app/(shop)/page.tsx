"use client";

import Link from "next/link";
import { useProducts } from "@/lib/ProductsContext";
import ProductCard from "@/components/ProductCard";
import HeroBanner from "@/components/HeroBanner";
import MobileHome from "@/components/mobile/MobileHome";

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#FAD4DD] bg-white shadow-sm">
      <div className="skeleton-shimmer aspect-square w-full" />
      <div className="p-3">
        <div className="skeleton-shimmer h-2.5 w-[92%] rounded-full" />
        <div className="skeleton-shimmer mt-1.5 h-2.5 w-[65%] rounded-full" />
        <div className="skeleton-shimmer mt-3 h-2.5 w-1/3 rounded-full" />
        <div className="mt-3 flex items-end justify-between">
          <div className="skeleton-shimmer h-4 w-20 rounded-full" />
          <div className="skeleton-shimmer h-7 w-7 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { products, loading } = useProducts();
  const popularProducts = products?.filter((p) => p.isTrending === true) || [];

  // Weekly Sale = products flagged with ⚡ Flash (or isWeeklySale) in the admin panel
  const weeklySaleProducts =
    products?.filter(
      (p) => (p as any).isWeeklySale === true || (p as any).isFlashSale === true
    ) || [];

  const saleProducts =
    weeklySaleProducts.length > 0
      ? weeklySaleProducts
      : products.filter((p) => (p.oldPrice ?? 0) > (p.price ?? 0));

  return (
    <>
      {/* ============================================================
          📱 MOBILE (below 768px)
          ============================================================ */}
      <div className="md:hidden">
        <MobileHome />
      </div>

      {/* ============================================================
          💻 DESKTOP (768px and up)
          ============================================================ */}
      <div className="hidden md:block">
        <div className="min-h-screen bg-[#FFF6F6] flex flex-col">
          <HeroBanner />

          <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-10 space-y-16">
            {(loading || saleProducts.length > 0) && (
              <section>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-[#E8546B] flex items-center gap-2">
                      <span className="text-2xl">🔥</span> Weekly Sale
                    </h2>
                    <p className="text-sm text-[#6B5558] font-medium mt-1">
                      Limited time offers. Grab them before they&apos;re gone!
                    </p>
                    <div className="h-1 w-12 bg-[#E8546B] rounded-full mt-2" />
                  </div>
                  <Link href="/search?sale=true" className="text-sm font-semibold text-[#E8546B] hover:underline">
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-6">
                  {loading
                    ? [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
                    : saleProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                </div>
              </section>
            )}

            <section>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h2 className="font-serif text-3xl font-bold text-[#2B1A24] flex items-center gap-2">
                    <span className="text-[#E8546B]">⭐</span> Popular Products
                  </h2>
                  <div className="h-1 w-10 bg-[#E8546B] rounded-full mt-1.5" />
                </div>
                <Link href="/search" className="text-sm font-semibold text-[#E8546B] hover:underline">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-6">
                {loading
                  ? [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
                  : popularProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[3rem] bg-[#FFF6F6] border border-[#FAD4DD] shadow-[0_20px_60px_-15px_rgba(232,84,107,0.15)] flex items-stretch min-h-[500px]">
              <div className="relative z-10 flex-1 p-16 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-bold tracking-widest text-[#E8546B] uppercase mb-8 shadow-sm border border-[#FAD4DD] w-fit">
                  <span className="h-2 w-2 rounded-full bg-[#E8546B] animate-pulse" />
                  The Ratri&apos;s Experience
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              </div>
              <div className="relative hidden lg:block w-[45%]">
                <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1000&auto=format&fit=crop" alt="Premium Gift" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFF6F6] via-transparent to-transparent" />
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

            <section className="relative overflow-hidden rounded-[2.5rem] bg-[#2A0A18] shadow-[0_30px_70px_-30px_rgba(228,33,111,0.85)]">
              <div
                className="animate-spin-slow pointer-events-none absolute -inset-[70%] opacity-50 blur-2xl"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, #FF5C9A 45deg, transparent 110deg, transparent 190deg, #FF9CC4 240deg, transparent 310deg)",
                }}
              />
              <div className="animate-float pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#FF4F92] opacity-40 blur-2xl" />
              <div
                className="animate-float pointer-events-none absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-[#FFB6D4] opacity-30 blur-2xl"
                style={{ animationDelay: "1.4s" }}
              />

              <div className="relative z-10 flex flex-col items-start justify-between gap-8 p-10 md:flex-row md:items-center md:p-14">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
                    ✦ Just Landed
                  </span>
                  <h2 className="mt-4 font-serif text-4xl font-bold leading-[1.05] text-white md:text-6xl">
                    New Arrivals
                    <br />
                    <span className="bg-gradient-to-r from-[#FFB3D1] via-white to-[#FFC7DE] bg-clip-text text-transparent">
                      fresh from China
                    </span>
                  </h2>
                  <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-white/70">
                    Handpicked every week, quality checked before shipping — and delivered straight to your door anywhere in Bangladesh.
                  </p>
                </div>

                <div className="flex flex-shrink-0 items-center gap-4">
                  <Link
                    href="/new"
                    className="animate-pulse-glow inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-[#C21C5E] shadow-[0_10px_30px_-10px_rgba(255,255,255,0.9)] transition-transform hover:scale-105 active:scale-95"
                  >
                    Explore New Arrivals
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              </div>

              <span className="animate-float pointer-events-none absolute right-8 top-8 text-2xl">✨</span>
              <span
                className="animate-float pointer-events-none absolute bottom-10 right-1/3 text-lg text-white/70"
                style={{ animationDelay: "0.9s" }}
              >
                ✦
              </span>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
