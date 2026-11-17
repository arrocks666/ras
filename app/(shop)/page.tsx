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
    <div className="min-h-screen bg-[#FFF6F6] flex flex-col pb-28">

      {/* 1. Banner */}
      <div className="w-full relative">
        <HeroBanner />
      </div>

      {/* 2. Trust Badges */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-[#FAD4DD] p-4 flex justify-between items-center">
          {[
            { icon: "🛡️", title: "Best\nQuality" },
            { icon: "🚚", title: "Direct from\nChina" },
            { icon: "🔒", title: "Secure\nShopping" },
            { icon: "🌍", title: "Worldwide\nShipping" },
          ].map((badge, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-1 w-1/4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDE8EC] text-lg text-[#E8546B]">
                {badge.icon}
              </div>
              <span className="text-[9px] font-bold text-[#2B1A24] leading-tight whitespace-pre-line">{badge.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Weekly Sale */}
      <section className="px-4 mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-[22px] font-bold text-[#2B1A24] flex items-center gap-1">
            <span className="text-[#E8546B]">🔥</span> Weekly Sale
          </h2>
          <Link href="/search?sale=true" className="rounded-full border border-[#FAD4DD] bg-white px-3 py-1.5 text-[10px] font-bold text-[#E8546B] shadow-sm">
            View All →
          </Link>
        </div>
        <p className="text-[11px] text-[#6B5558] -mt-3 mb-4">Limited time offers. Grab them before they're gone!</p>
        <div className="grid grid-cols-2 gap-3">
          {weeklySaleProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. Special Offer Banner */}
      <section className="px-4 mt-8">
        <div className="rounded-2xl bg-gradient-to-r from-[#FFE4E9] to-[#FF8B9A] p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-[#E8546B] tracking-wider uppercase">Special Offer</p>
            <p className="font-serif text-2xl font-bold text-[#E8546B]">10% Discount</p>
            <button className="mt-2 rounded-full bg-[#E8546B] px-4 py-1.5 text-[10px] font-bold text-white shadow-md">
              Follow & Claim Now →
            </button>
          </div>
          <div className="absolute right-[-10px] bottom-[-10px] text-7xl opacity-40">🎁</div>
        </div>
      </section>

    </div>
  );
}