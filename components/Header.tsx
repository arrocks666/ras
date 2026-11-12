"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { formatBDT } from "@/lib/data";
import { useProducts } from "@/lib/ProductsContext";
import { loadSettings, DEFAULT_SETTINGS, type StoreSettings } from "@/lib/firestoreSettings";
import { CATEGORIES } from "@/lib/categories";
import MegaMenu from "./MegaMenu";
import Link from "next/link";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const cart = useCart();
  const { products } = useProducts();
  
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileCat, setExpandedMobileCat] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const megaMenuTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => { loadSettings().then(setSettings).catch(() => {}); }, [pathname]);
  useEffect(() => { 
    setMegaMenuOpen(false); 
    setMobileMenuOpen(false);
    setExpandedMobileCat(null);
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
    setOpen(false); setQuery("");
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

  const isActive = (path: string) => pathname === path;
  const navLinkClass = (path: string) => 
    `relative pb-2 text-[13px] font-medium transition-colors hover:text-[#E8546B] ${
      isActive(path) ? "text-[#E8546B]" : "text-[#6B5558]"
    }`;
  const underlineClass = (path: string) =>
    `absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-[#E8546B] transition-transform duration-300 origin-left ${
      isActive(path) ? "scale-x-100" : "scale-x-0"
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-[#FAD4DD]">
        
        {/* MOBILE HEADER */}
        <div className="flex md:hidden items-center justify-between px-4 py-3">
          <button onClick={() => setMobileMenuOpen(true)} className="text-[#2B1A24]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>

          <button onClick={() => router.push("/")} className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-8 w-8 rounded-lg object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8546B] text-lg font-bold text-white">R</div>
            )}
            <div className="flex flex-col leading-none">
              <span className="font-serif text-base font-bold text-[#E8546B]">Ratry's</span>
              <span className="text-[8px] font-bold tracking-widest text-[#2B1A24] uppercase">Artistry Shop</span>
            </div>
          </button>

          <div className="flex items-center gap-4 text-[#2B1A24]">
             <button onClick={() => router.push("/search")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </button>
            <Link href="/cart" className="relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              {cart.totalCount > 0 && <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E8546B] px-1 text-[9px] font-bold text-white">{cart.totalCount}</span>}
            </Link>
          </div>
        </div>

        {/* DESKTOP HEADER */}
        <div className="hidden md:block">
          <div className="relative mx-auto flex max-w-[1400px] items-center justify-between gap-2 px-4 py-3">
            <button onClick={() => router.push("/")} className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8546B] text-xl font-bold text-white">R</div>
              )}
              <div className="flex flex-col leading-none">
                <span className="font-serif text-xl font-bold text-[#E8546B]">Ratry's</span>
                <span className="text-[9px] font-bold tracking-[0.2em] text-[#2B1A24] uppercase">Artistry Shop</span>
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
                    <button key={p.id} onClick={() => router.push(`/product/${p.id}`)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-[#FFF6F6]">
                      <img src={p.image} className="h-10 w-10 object-contain" />
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
              <button onClick={() => router.push("/wishlist")} className="flex flex-col items-center text-[#2B1A24] hover:text-[#E8546B]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                <span className="text-[9px]">Wishlist</span>
              </button>
              <button onClick={() => router.push("/cart")} className="relative flex flex-col items-center text-[#2B1A24] hover:text-[#E8546B]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                <span className="text-[9px]">Cart</span>
              </button>
            </div>
          </div>

          {/* ✅ FIXED: Added `flex items-center` to all nav items to fix alignment */}
          <nav className="flex items-center justify-center gap-8 pb-3 text-[13px] font-medium text-[#6B5558]">
            <Link href="/" className="flex items-center h-[30px] hover:text-[#E8546B]">Home</Link>
            <Link href="/search" className="flex items-center h-[30px] hover:text-[#E8546B]">Shop</Link>
            <div className="relative flex h-[30px] items-center" onMouseEnter={handleMegaMenuEnter} onMouseLeave={handleMegaMenuLeave}>
              <button 
                onClick={() => router.push("/categories")} 
                className={`flex items-center gap-1 text-[13px] font-medium transition-colors hover:text-[#E8546B] ${megaMenuOpen ? "text-[#E8546B]" : "text-[#6B5558]"}`}
              >
                Categories
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-300 ${megaMenuOpen ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <span className={`absolute bottom-[-8px] left-0 h-[2px] w-full rounded-full bg-[#E8546B] transition-transform duration-300 origin-left ${megaMenuOpen ? "scale-x-100" : "scale-x-0"}`} />
            </div>
            <Link href="/new" className="flex items-center h-[30px] hover:text-[#E8546B]">New Arrivals</Link>
            <Link href="/about" className="flex items-center h-[30px] hover:text-[#E8546B]">About Us</Link>
            <Link href="/tracking" className="flex items-center h-[30px] hover:text-[#E8546B]">Track Order</Link>
            <Link href="/contact" className="flex items-center h-[30px] hover:text-[#E8546B]">Contact</Link>
          </nav>

          {megaMenuOpen && (
            <div onMouseEnter={handleMegaMenuEnter} onMouseLeave={handleMegaMenuLeave}>
              <MegaMenu onClose={() => setMegaMenuOpen(false)} />
            </div>
          )}
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[85%] max-w-[320px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-left">
            <div className="p-5 border-b border-[#FAD4DD] flex justify-between items-center bg-[#FFF6F6]">
              <span className="font-serif text-xl font-bold text-[#E8546B]">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-2xl text-[#6B5558]">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <button onClick={() => { setMobileMenuOpen(false); router.push("/"); }} className="w-full text-left px-6 py-4 font-bold text-[#2B1A24] border-b border-[#FAD4DD]/50">Home</button>
              <button onClick={() => { setMobileMenuOpen(false); router.push("/search"); }} className="w-full text-left px-6 py-4 font-bold text-[#2B1A24] border-b border-[#FAD4DD]/50">Shop</button>
              
              <div className="px-6 py-3 font-bold text-[#E8546B] uppercase text-[11px] tracking-wider bg-[#FFF6F6]">All Categories</div>
              
              {CATEGORIES.map((cat) => (
                <div key={cat.id} className="border-b border-[#FAD4DD]/50">
                  <button 
                    onClick={() => setExpandedMobileCat(expandedMobileCat === cat.id ? null : cat.id)}
                    className="w-full flex items-center justify-between px-6 py-4 font-bold text-[#2B1A24]"
                  >
                    <span className="flex items-center gap-3"><span className="text-lg">{cat.icon}</span> {cat.name}</span>
                    <span className="text-xs transition-transform duration-300" style={{ transform: expandedMobileCat === cat.id ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </button>
                  
                  {expandedMobileCat === cat.id && (
                    <div className="bg-[#FFF6F6] py-2">
                      {cat.subcategories.map(sub => (
                        <button 
                          key={sub.slug} 
                          onClick={() => { setMobileMenuOpen(false); router.push(`/search?category=${cat.id}&subcategory=${sub.slug}`); }}
                          className="w-full text-left px-12 py-2.5 text-sm text-[#6B5558] hover:text-[#E8546B] flex items-center gap-2"
                        >
                          <img src={sub.image} alt="" className="w-6 h-6 rounded-full object-cover border border-[#FAD4DD]" />
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="mt-4 border-t border-[#FAD4DD]">
                <button onClick={() => { setMobileMenuOpen(false); router.push("/new"); }} className="w-full text-left px-6 py-4 font-bold text-[#2B1A24] border-b border-[#FAD4DD]/50">New Arrivals</button>
                <button onClick={() => { setMobileMenuOpen(false); router.push("/about"); }} className="w-full text-left px-6 py-4 font-bold text-[#2B1A24] border-b border-[#FAD4DD]/50">About Us</button>
                <button onClick={() => { setMobileMenuOpen(false); router.push("/tracking"); }} className="w-full text-left px-6 py-4 font-bold text-[#2B1A24] border-b border-[#FAD4DD]/50">Track Order</button>
                <button onClick={() => { setMobileMenuOpen(false); router.push("/contact"); }} className="w-full text-left px-6 py-4 font-bold text-[#2B1A24] border-b border-[#FAD4DD]/50">Contact</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export const CATEGORIES_MENU = CATEGORIES;