"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProducts } from "@/lib/ProductsContext";
import { formatBDT } from "@/lib/data";
import MobileProductCard from "./MobileProductCard";

function MobileHero() {
  const [src, setSrc] = useState("/banner.png");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const probe = new Image();
    probe.onload = () => setSrc("/banner-mobile.png");
    probe.src = "/banner-mobile.png";
  }, []);

  return (
    <Link href="/search" aria-label="Shop the collection" className="block w-full">
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-[#FFE1EC] via-[#FFD2E2] to-[#FFC2D6]">
        {!failed ? (
          <div className="relative aspect-[2.3/1] w-full overflow-hidden">
            <img
              src={src}
              alt="Welcome to Ratris Artistry Shop"
              className="absolute inset-0 h-full w-full object-cover object-left"
              onError={() => setFailed(true)}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/40" />
          </div>
        ) : (
          <div className="flex aspect-[2.3/1] w-full items-center px-5">
            <div className="relative z-10">
              <p className="font-serif text-[14px] italic text-[#C21C5E]">Welcome to ♡</p>
              <h1 className="mt-1 bg-gradient-to-b from-[#E4216F] to-[#B3155A] bg-clip-text font-serif text-[28px] font-bold leading-[0.95] tracking-[0.02em] text-transparent">
                RATRI&apos;S
                <br />
                ARTISTRY SHOP
              </h1>
              <p className="mt-2 text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#A8335F]">
                Trendy Products ♥ Best Quality ♥ Direct from China
              </p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-b from-[#F4558F] to-[#E4216F] px-4 py-1.5 text-[11px] font-bold text-white">
                Shop Now →
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_-10px_rgba(228,33,111,0.45)]">
      <div className="skeleton-shimmer aspect-[1/0.94] w-full" />
      <div className="p-2.5">
        <div className="skeleton-shimmer h-2.5 w-[92%] rounded-full" />
        <div className="skeleton-shimmer mt-1.5 h-2.5 w-[70%] rounded-full" />
        <div className="skeleton-shimmer mt-3 h-2.5 w-1/3 rounded-full" />
        <div className="mt-3 flex items-end justify-between">
          <div className="skeleton-shimmer h-4 w-16 rounded-full" />
          <div className="skeleton-shimmer h-8 w-8 rounded-full" />
        </div>
        <div className="skeleton-shimmer mt-1.5 h-2 w-12 rounded-full" />
      </div>
    </div>
  );
}

export default function MobileHome() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { products, loading } = useProducts();

  const weekly = useMemo(() => {
    const flagged = products.filter((p) => {
      const anyP = p as unknown as { isWeeklySale?: boolean; isFlashSale?: boolean };
      return anyP.isWeeklySale === true || anyP.isFlashSale === true;
    });
    if (flagged.length > 0) return flagged;
    return products.filter((p) => (p.discount ?? 0) > 0 || (p.oldPrice ?? 0) > (p.price ?? 0));
  }, [products]);

  const popular = useMemo(() => {
    const weeklyIds = new Set(weekly.map((p) => p.id));
    const trending = products.filter((p) => p.isTrending === true);
    const pool = trending.length > 0 ? trending : products;
    return pool.filter((p) => !weeklyIds.has(p.id));
  }, [products, weekly]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 6);
  }, [query, products]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    router.push(`/search?q=${encodeURIComponent(term)}`);
    setQuery("");
  };

  const showSuggestions = query.trim().length >= 2 && suggestions.length > 0;

  return (
    <div className="relative min-h-screen bg-[#FFF5F9]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(120%_60%_at_50%_0%,#FFE9F2_0%,rgba(255,245,249,0)_75%)]" />

      {/* ---------- SEARCH (sticks UNDER the header, no gap) ---------- */}
      <div className="sticky top-14 z-30 bg-[#FFF7FA] px-4 pb-2 pt-5">
        <form onSubmit={submit} className="relative">
          <span className="pointer-events-none absolute left-4 top-[22px] -translate-y-1/2 text-[#C9A3B3]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for your favorite products..."
            className="h-11 w-full rounded-full border border-white bg-white pl-11 pr-11 text-[12.5px] font-medium text-[#2B1A24] placeholder:text-[#C4A2B1] shadow-[0_4px_14px_-8px_rgba(228,33,111,0.6)] focus:border-[#F9C6D8] focus:outline-none"
          />
          <span className="pointer-events-none absolute right-4 top-[22px] -translate-y-1/2 text-[12px] text-[#E4216F]">✦</span>
        </form>

        {/* live suggestions */}
        {showSuggestions && (
          <div className="absolute left-4 right-4 top-full z-40 mt-1 overflow-hidden rounded-2xl border border-[#F7C9DB] bg-white shadow-[0_18px_40px_-18px_rgba(228,33,111,0.65)]">
            {suggestions.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                onClick={() => setQuery("")}
                className="flex items-center gap-3 border-b border-[#FBE3EC] px-3 py-2.5 last:border-b-0 active:bg-[#FFF7FA]"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] p-0.5">
                  {p.image ? (
                    <img src={p.image} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-base">🎁</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[12px] font-semibold text-[#2B1A24]">{p.title}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-[#E4216F]">{formatBDT(p.price)}</p>
                </div>
                <span className="flex-shrink-0 text-[10px] text-[#C9A3B3]">›</span>
              </Link>
            ))}
            <button
              type="button"
              onClick={submit as any}
              className="w-full bg-[#FFF7FA] py-2.5 text-[11px] font-bold text-[#E4216F]"
            >
              See all results for “{query.trim()}” →
            </button>
          </div>
        )}
      </div>

      {/* ---------- BANNER ---------- */}
      <MobileHero />

      {/* ---------- WEEKLY SALE ---------- */}
      {(loading || weekly.length > 0) && (
        <section className="mt-5 px-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="flex items-center gap-1.5 font-serif text-[25px] font-bold leading-none text-[#E4216F]">
                <span className="text-[20px] leading-none">🔥</span> Weekly Sale
              </h2>
              <p className="mt-1.5 text-[11px] font-medium leading-tight text-[#8A6A75]">
                Limited time offers. Grab them before they&apos;re gone!
              </p>
            </div>
            <Link
              href="/search?sale=true"
              className="mb-0.5 flex-shrink-0 rounded-full border border-[#F7C9DB] bg-white px-3 py-1.5 text-[10px] font-bold text-[#E4216F] shadow-sm"
            >
              View All →
            </Link>
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
              : weekly.map((product) => <MobileProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      {/* ---------- POPULAR PRODUCTS ---------- */}
      {popular.length > 0 && (
        <section className="mt-6 px-4">
          <div className="flex items-end justify-between">
            <h2 className="flex items-center gap-1.5 font-serif text-[21px] font-bold leading-none text-[#2B1A24]">
              <span className="text-[#E4216F]">⭐</span> Popular Products
            </h2>
            <Link href="/search" className="mb-0.5 flex-shrink-0 text-[10.5px] font-bold text-[#E4216F]">
              View All →
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {popular.map((product) => (
              <MobileProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- PREMIUM ANIMATED BANNER ---------- */}
      <section className="mt-7 px-4">
        <div className="relative overflow-hidden rounded-[26px] bg-[#2A0A18] px-5 py-8 shadow-[0_22px_48px_-20px_rgba(228,33,111,0.95)]">
          <div
            className="animate-spin-slow pointer-events-none absolute -inset-[70%] opacity-60 blur-2xl"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, #FF5C9A 45deg, transparent 110deg, transparent 190deg, #FF9CC4 240deg, transparent 310deg)",
            }}
          />
          <div className="animate-float pointer-events-none absolute -left-10 -top-14 h-40 w-40 rounded-full bg-[#FF4F92] opacity-40 blur-2xl" />
          <div
            className="animate-float pointer-events-none absolute -bottom-14 -right-6 h-40 w-40 rounded-full bg-[#FFB6D4] opacity-30 blur-2xl"
            style={{ animationDelay: "1.4s" }}
          />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
              ✦ Just Landed
            </span>

            <h2 className="mt-3 font-serif text-[31px] font-bold leading-[1.02] text-white">
              New Arrivals
              <br />
              <span className="bg-gradient-to-r from-[#FFB3D1] via-white to-[#FFC7DE] bg-clip-text text-transparent">
                fresh from China
              </span>
            </h2>

            <p className="mt-2 max-w-[85%] text-[11px] font-medium leading-snug text-white/70">
              Handpicked weekly · limited stock · delivered nationwide
            </p>

            <Link
              href="/new"
              className="animate-pulse-glow mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-3 text-[11.5px] font-bold text-[#C21C5E] shadow-[0_10px_24px_-10px_rgba(255,255,255,0.95)] transition-transform active:scale-95"
            >
              Explore New Arrivals →
            </Link>
          </div>

          <span className="animate-float pointer-events-none absolute right-4 top-3 text-[15px]">✨</span>
          <span
            className="animate-float pointer-events-none absolute bottom-4 right-8 text-[11px] text-white/70"
            style={{ animationDelay: "0.9s" }}
          >
            ✦
          </span>
        </div>
      </section>

      {/* ---------- EMPTY STATE ---------- */}
      {!loading && products.length === 0 && (
        <div className="px-4 pt-10 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            🛍️
          </div>
          <p className="text-sm font-bold text-[#2B1A24]">Nothing here yet</p>
          <p className="mt-1 text-[11px] text-[#8A6A75]">Products will appear as soon as they&apos;re added.</p>
        </div>
      )}
    </div>
  );
}
