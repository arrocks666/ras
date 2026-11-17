"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import { formatBDT } from "@/lib/data";
import { useProducts } from "@/lib/ProductsContext";
import { loadSettings, DEFAULT_SETTINGS, type StoreSettings } from "@/lib/firestoreSettings";
import { CATEGORIES } from "@/lib/categories";
import MegaMenu from "./MegaMenu";
import Link from "next/link";

function Crown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 15" className={className} fill="none" aria-hidden="true">
      <path d="M2.2 12.6h19.6l-1.6-8.4-4.6 3.4L12 2.2 7.4 7.6 2.8 4.2 1.2 12.6h1Z" fill="#E4216F" />
      <path d="M2.2 12.6h19.6l.2 1.1H2l.2-1.1Z" fill="#C21C5E" />
      <circle cx="12" cy="1.6" r="1.3" fill="#E4216F" />
    </svg>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const cart = useCart();
  const wishlist = useWishlist();
  const { products } = useProducts();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLFormElement>(null);
  const megaMenuTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => { loadSettings().then(setSettings).catch(() => {}); }, [pathname]);

  useEffect(() => {
    setMegaMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 5);
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
    setOpen(false);
    setQuery("");
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleMegaMenuEnter = () => {
    if (megaMenuTimeout.current) clearTimeout(megaMenuTimeout.current);
    setMegaMenuOpen(true);
  };

  const handleMegaMenuLeave = () => {
    megaMenuTimeout.current = setTimeout(() => setMegaMenuOpen(false), 150);
  };

  const logoUrl = settings.logoUrl;
  const wishCount = wishlist?.items?.size ?? 0;
  const isActive = (path: string) => pathname === path;

  const navLinkClass = (path: string) =>
    `relative flex items-center h-[32px] text-[13px] font-medium transition-colors hover:text-[#E8546B] ${isActive(path) ? "text-[#E8546B]" : "text-[#6B5558]"}`;

  const underlineClass = (path: string) =>
    `absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-[#E8546B] transition-transform duration-300 origin-left ${isActive(path) ? "scale-x-100" : "scale-x-0"}`;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-[#FAD4DD]/50">

        {/* MOBILE HEADER (768–1023px) */}
        <div className="flex lg:hidden items-center justify-between px-5 py-3 bg-white">
          <button onClick={() => setMobileMenuOpen(true)} className="text-[#2B1A24]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>

          <Link href="/" className="flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-8 object-contain" />
            ) : (
              <div className="flex flex-col items-center leading-none">
                <Crown className="mb-[2px] h-[13px] w-[23px]" />
                <span className="font-serif text-[22px] font-bold text-[#E8546B] tracking-tight">RATRI&rsquo;S</span>
                <span className="text-[8px] font-bold tracking-[0.25em] text-[#E8546B] uppercase">Artistry Shop</span>
              </div>
            )}
          </Link>

          <div className="flex items-center gap-4 text-[#2B1A24]">
            <button onClick={() => router.push("/search")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </button>
            <Link href="/wishlist" className="relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8546B" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {wishCount > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E8546B] px-1 text-[8px] font-bold text-white">{wishCount}</span>
              )}
            </Link>
            <Link href="/cart" className="relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8546B" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              {cart.totalCount > 0 && <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E8546B] px-1 text-[8px] font-bold text-white">{cart.totalCount}</span>}
            </Link>
          </div>
        </div>

        {/* DESKTOP HEADER */}
        <div className="hidden lg:block">
          <div className="relative mx-auto flex max-w-[1400px] items-center justify-between gap-2 px-4 py-3">
            <button onClick={() => router.push("/")} className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8546B] text-xl font-bold text-white">R</div>
              )}
              <div className="flex flex-col items-center leading-none">
                <Crown className="mb-1 h-[13px] w-[22px]" />
                <span className="font-serif text-xl font-bold text-[#E8546B]">RATRI&rsquo;S</span>
                <span className="mt-1 text-[9px] font-bold tracking-[0.2em] text-[#2B1A24] uppercase">Artistry Shop</span>
              </div>
            </button>

            <form onSubmit={handleSubmit} className="flex-1 max-w-[600px] relative mx-8" ref={wrapperRef}>
              <input ref={inputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Search for your favorite products..." className="w-full rounded-full border border-[#FAD4DD] bg-[#FFF6F6] py-2.5 pl-5 pr-12 text-xs focus:border-[#E8546B] focus:outline-none" />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-[#E8546B] text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </button>
              {open && query.trim().length >= 2 && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[#FAD4DD] bg-white shadow-xl">
                     {suggestions.map((p) => (
                       <button key={p.id} type="button" onClick={() => router.push(`/product/${p.id}`)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-[#FFF6F6]">
                      <img src={p.image} alt="" className="h-10 w-10 object-contain" />
                      <div><p className="text-sm font-medium">{p.title}</p><p className="text-xs font-bold text-[#E8546B]">{formatBDT(p.price)}</p></div>
                    </button>
                  ))}
                </div>
              )}
            </form>

            <div className="flex items-center gap-5">
              <button onClick={() => router.push("/account")} className="flex flex-col items-center text-[#2B1A24] hover:text-[#E8546B]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <span className="text-[9px]">Account</span>
              </button>
              <button onClick={() => router.push("/wishlist")} className="relative flex flex-col items-center text-[#2B1A24] hover:text-[#E8546B]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                <span className="text-[9px]">Wishlist</span>
                {wishCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E8546B] px-1 text-[8px] font-bold text-white">{wishCount}</span>
                )}
              </button>
              <button onClick={() => router.push("/cart")} className="relative flex flex-col items-center text-[#2B1A24] hover:text-[#E8546B]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                <span className="text-[9px]">Cart</span>
                {cart.totalCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E8546B] px-1 text-[8px] font-bold text-white">{cart.totalCount}</span>
                )}
              </button>
            </div>
          </div>

          <nav className="flex items-center justify-center gap-8 pb-3 text-[13px] font-medium text-[#6B5558]">
            <Link href="/" className={navLinkClass("/")}>Home<span className={underlineClass("/")} /></Link>
            <Link href="/search" className={navLinkClass("/search")}>Shop<span className={underlineClass("/search")} /></Link>
            <div className="relative flex h-[32px] items-center cursor-pointer" onMouseEnter={handleMegaMenuEnter} onMouseLeave={handleMegaMenuLeave}>
              <span className={`flex items-center gap-1 text-[13px] font-medium transition-colors hover:text-[#E8546B] ${megaMenuOpen ? "text-[#E8546B]" : "text-[#6B5558]"}`}>
                Categories
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-300 ${megaMenuOpen ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6"/></svg>
              </span>
              <span className={`absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-[#E8546B] transition-transform duration-300 origin-left ${megaMenuOpen ? "scale-x-100" : "scale-x-0"}`} />
            </div>
            <Link href="/new" className={navLinkClass("/new")}>New Arrivals<span className={underlineClass("/new")} /></Link>
            <Link href="/about" className={navLinkClass("/about")}>About Us<span className={underlineClass("/about")} /></Link>
            <Link href="/tracking" className={navLinkClass("/tracking")}>Track Order<span className={underlineClass("/tracking")} /></Link>
            <Link href="/contact" className={navLinkClass("/contact")}>Contact<span className={underlineClass("/contact")} /></Link>
          </nav>

          {megaMenuOpen && (
            <div onMouseEnter={handleMegaMenuEnter} onMouseLeave={handleMegaMenuLeave}>
              <MegaMenu onClose={() => setMegaMenuOpen(false)} />
            </div>
          )}
        </div>
      </header>

      {/* MOBILE DRAWER (768–1023px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[85%] max-w-[320px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-left">
            <div className="p-5 border-b border-[#FAD4DD] flex justify-between items-center bg-[#FFF6F6]">
              <div className="flex flex-col items-center leading-none">
                <Crown className="mb-[2px] h-[12px] w-[21px]" />
                <span className="font-serif text-xl font-bold text-[#E8546B]">RATRI&rsquo;S</span>
                <span className="text-[9px] font-bold tracking-[0.2em] text-[#2B1A24] uppercase">Artistry Shop</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-2xl text-[#6B5558]">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="py-2">
                <Link href="/" className="flex items-center gap-4 px-6 py-3 text-sm font-bold text-[#2B1A24]" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-[#E8546B]">🏠</span> Home
                </Link>
                <Link href="/search" className="flex items-center gap-4 px-6 py-3 text-sm font-bold text-[#2B1A24]" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-[#E8546B]">🛍️</span> Shop
                </Link>
                <Link href="/categories" className="flex items-center gap-4 px-6 py-3 text-sm font-bold text-[#2B1A24]" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-[#E8546B]">🗂️</span> Categories
                </Link>
                <Link href="/new" className="flex items-center gap-4 px-6 py-3 text-sm font-bold text-[#2B1A24]" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-[#E8546B]">✨</span> New Arrivals
                </Link>
                <Link href="/orders" className="flex items-center gap-4 px-6 py-3 text-sm font-bold text-[#2B1A24]" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-[#E8546B]">📦</span> My Orders
                </Link>
                <Link href="/wishlist" className="flex items-center justify-between px-6 py-3 text-sm font-bold text-[#2B1A24]" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center gap-4"><span className="text-[#E8546B]">♡</span> Wishlist</div>
                  {wishCount > 0 && <span className="bg-[#E8546B] text-white text-[10px] px-2 py-0.5 rounded-full">{wishCount}</span>}
                </Link>
                <Link href="/cart" className="flex items-center justify-between px-6 py-3 text-sm font-bold text-[#2B1A24]" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center gap-4"><span className="text-[#E8546B]">🛒</span> Cart</div>
                  {cart.totalCount > 0 && <span className="bg-[#E8546B] text-white text-[10px] px-2 py-0.5 rounded-full">{cart.totalCount}</span>}
                </Link>
                <Link href="/account" className="flex items-center gap-4 px-6 py-3 text-sm font-bold text-[#2B1A24]" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-[#E8546B]">👤</span> Account
                </Link>
              </div>
            </div>

            <div className="border-t border-[#FAD4DD] p-4 bg-white">
              <button onClick={() => { setMobileMenuOpen(false); router.push("/account"); }} className="flex items-center gap-2 px-2 text-xs font-bold text-[#E8546B]">
                <span className="text-lg">🚪</span> Account & Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
