"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { formatBDT } from "@/lib/data";
import { useProducts } from "@/lib/ProductsContext";
import { loadSettings, DEFAULT_SETTINGS, type StoreSettings } from "@/lib/firestoreSettings";
import ImageSearchModal from "./ImageSearchModal";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const cart = useCart();
  const { products } = useProducts();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadSettings().then(setSettings).catch(() => {}); }, [pathname]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return products.filter((p) => p.title.toLowerCase().includes(q) || (p.subtitle && p.subtitle.toLowerCase().includes(q))).slice(0, 5);
  }, [query, products]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false); setQuery("");
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const logoUrl = settings.logoUrl;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#FAD4DD] bg-white shadow-sm">
        {/* TOP ROW */}
        <div className="relative mx-auto flex max-w-[1400px] items-center justify-between gap-2 px-4 py-3">
          
          {/* LOGO */}
          <button onClick={() => router.push("/")} className="flex items-center gap-2 flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-10 w-10 rounded-lg object-contain" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8546B] text-xl font-bold text-white">R</div>
            )}
            <div className="hidden flex-col leading-none sm:flex">
              <span className="font-serif text-lg md:text-xl font-bold text-[#E8546B]">Ratry's</span>
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#2B1A24] uppercase">Artistry Shop</span>
            </div>
          </button>

          {/* CENTER: Search bar (desktop only) */}
          <form onSubmit={handleSubmit} className="hidden md:flex flex-1 max-w-[600px] relative mx-8" ref={wrapperRef}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Search for your favorite products..."
              className="w-full rounded-full border border-[#FAD4DD] bg-[#FFF6F6] py-2.5 pl-5 pr-20 text-xs text-[#2B1A24] placeholder:text-[#A88F92] focus:border-[#E8546B] focus:outline-none"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button type="button" onClick={() => setImageModalOpen(true)} className="h-8 w-8 flex items-center justify-center rounded-full text-[#E8546B] hover:bg-[#FFF6F6]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
              </button>
              <button type="submit" className="h-8 w-8 flex items-center justify-center rounded-full bg-[#E8546B] text-white hover:bg-[#b02a58]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </button>
            </div>
            {/* Suggestions dropdown */}
            {open && query.trim().length >= 2 && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[#FAD4DD] bg-white shadow-lg">
                <ul className="divide-y divide-[#FAD4DD]">
                  {suggestions.map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => { setQuery(""); setOpen(false); router.push(`/product/${p.id}`); }} className="flex w-full items-center gap-3 p-3 text-left hover:bg-[#FFF6F6]">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-[#FAD4DD] bg-[#FFF6F6]">
                          {p.image ? <img src={p.image} alt="" className="h-full w-full object-contain mix-blend-multiply" /> : <span className="text-xl">🎁</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#2B1A24]">{p.title}</p>
                          <p className="mt-0.5 text-xs font-bold text-[#E8546B]">{formatBDT(p.price)}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>

          {/* ICONS */}
          <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
            <button onClick={() => router.push("/account")} className="flex flex-col items-center gap-0.5 text-[#2B1A24] hover:text-[#E8546B]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              <span className="hidden md:block text-[9px] font-medium">Account</span>
            </button>
            <button onClick={() => router.push("/wishlist")} className="hidden md:flex flex-col items-center gap-0.5 text-[#2B1A24] hover:text-[#E8546B]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              <span className="text-[9px] font-medium">Wishlist</span>
            </button>
            <button onClick={() => router.push("/cart")} className="relative flex flex-col items-center gap-0.5 text-[#2B1A24] hover:text-[#E8546B]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              <span className="hidden md:block text-[9px] font-medium">Cart</span>
              {cart.totalCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E8546B] px-1 text-[9px] font-bold text-white">{cart.totalCount}</span>}
            </button>
          </div>
        </div>

        {/* DESKTOP NAV (hidden on mobile) */}
        <nav className="hidden md:flex items-center justify-center gap-8 pb-3 text-[13px] font-medium text-[#6B5558]">
          <button onClick={() => router.push("/")} className={pathname === "/" ? "text-[#E8546B] border-b-2 border-[#E8546B] pb-2" : "pb-2 border-b-2 border-transparent"}>Home</button>
          <button onClick={() => router.push("/search")} className={pathname === "/search" ? "text-[#E8546B] border-b-2 border-[#E8546B] pb-2" : "pb-2 border-b-2 border-transparent"}>Shop</button>
          <button onClick={() => router.push("/categories")} className="pb-2 border-b-2 border-transparent">Categories</button>
          <button onClick={() => router.push("/new")} className="pb-2 border-b-2 border-transparent">New Arrivals</button>
          <button onClick={() => router.push("/about")} className="pb-2 border-b-2 border-transparent">About Us</button>
          <button onClick={() => router.push("/tracking")} className="pb-2 border-b-2 border-transparent">Track Order</button>
          <button onClick={() => router.push("/contact")} className="pb-2 border-b-2 border-transparent">Contact</button>
        </nav>

        {/* MOBILE SEARCH BAR */}
        <div className="bg-white px-4 pb-3 md:hidden">
          <form onSubmit={handleSubmit} className="relative">
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="w-full rounded-full border border-[#FAD4DD] bg-[#FFF6F6] py-2 pl-4 pr-10 text-xs focus:border-[#E8546B] focus:outline-none" />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E8546B]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </button>
          </form>
        </div>
      </header>

      <ImageSearchModal open={imageModalOpen} onClose={() => setImageModalOpen(false)} onJobStarted={(jobId) => router.push(`/search?image=true&jobId=${jobId}`)} />
    </>
  );
}