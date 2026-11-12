"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-24 md:pb-10">
      
      {/* HEADER */}
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.push("/")} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="flex-1 text-lg font-bold text-[#2B1A24] md:text-xl">About Us</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12 space-y-8 animate-fade-in">
        
        {/* HERO */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
            <span className="text-4xl">✨</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2B1A24] leading-tight">
            More than just a shop.<br />
            <span className="text-[#E8546B]">It's a vibe.</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-[#6B5558] max-w-lg mx-auto leading-relaxed">
            Ratry's Artistry Shop was born from a simple idea: bring the trendiest, highest-quality products from China directly to Bangladesh, without the crazy markups.
          </p>
        </div>

        {/* STORY */}
        <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 md:p-8 shadow-soft">
          <h3 className="font-serif text-xl font-bold text-[#2B1A24] mb-4">Our Story</h3>
          <div className="space-y-4 text-sm md:text-base text-[#6B5558] leading-relaxed">
            <p>
              We noticed a problem: finding authentic, trending Chinese products in Bangladesh was either too expensive or too unreliable. Shipping took months, quality was hit-or-miss, and customer service was non-existent.
            </p>
            <p>
              So we built a solution. We tapped into the massive 1688 supplier network in China, built direct relationships with verified manufacturers, and created a seamless ordering process for our customers.
            </p>
            <p>
              Today, thousands of happy customers trust us to deliver everything from fashion to gadgets — all at honest prices, with real support.
            </p>
          </div>
        </div>

        {/* VALUES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: "🛡️", title: "100% Authentic", desc: "Every product is sourced directly from verified Chinese suppliers." },
            { icon: "💎", title: "Premium Quality", desc: "We inspect products before shipping. No compromises." },
            { icon: "❤️", title: "Customer First", desc: "Real humans, real support. WhatsApp us anytime." },
          ].map((v, i) => (
            <div key={i} className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm text-center hover:-translate-y-1 transition-transform">
              <div className="text-4xl mb-3">{v.icon}</div>
              <h4 className="text-sm font-bold text-[#2B1A24] mb-1">{v.title}</h4>
              <p className="text-[11px] md:text-xs text-[#6B5558]">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] p-8 text-center shadow-lg">
          <h3 className="font-serif text-2xl font-bold text-white mb-2">Ready to Shop?</h3>
          <p className="text-white/90 text-sm mb-5">Discover our latest arrivals and best sellers.</p>
          <Link href="/search" className="inline-block rounded-full bg-white px-8 py-3 text-sm font-bold text-[#E8546B] shadow-md hover:scale-105 transition-transform">
            Browse Products
          </Link>
        </div>

      </div>
    </div>
  );
}