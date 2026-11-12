"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { CATEGORIES } from "@/lib/categories";
import Link from "next/link";

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [openCat, setOpenCat] = useState<string | null>(null);

  const nav = (path: string) => { onClose(); router.push(path); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex md:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-[85%] max-w-[320px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-left rounded-r-3xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#FAD4DD] bg-[#FFF6F6]">
          <div className="flex flex-col leading-none">
            <span className="font-serif text-xl font-bold text-[#E8546B]">Ratry's</span>
            <span className="text-[9px] font-bold tracking-[0.2em] text-[#2B1A24] uppercase">Artistry Shop</span>
          </div>
          <button onClick={onClose} className="p-2 text-2xl text-[#6B5558] hover:text-[#E8546B]">✕</button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2 hide-scrollbar">
          <button onClick={() => nav("/")} className="w-full text-left px-6 py-3.5 font-medium text-[#2B1A24] hover:bg-[#FFF6F6] flex items-center gap-3"><span className="text-lg">🏠</span> Home</button>
          <button onClick={() => nav("/search")} className="w-full text-left px-6 py-3.5 font-medium text-[#2B1A24] hover:bg-[#FFF6F6] flex items-center gap-3"><span className="text-lg">🛍️</span> Shop</button>
          <button onClick={() => nav("/new")} className="w-full text-left px-6 py-3.5 font-medium text-[#2B1A24] hover:bg-[#FFF6F6] flex items-center gap-3"><span className="text-lg">✨</span> New Arrivals</button>
          
          <div className="px-6 py-4 font-bold text-[#E8546B] mt-2 uppercase text-[11px] tracking-wider border-t border-[#FAD4DD]">Categories</div>
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="border-b border-[#FAD4DD]/50">
              <button 
                onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
                className="w-full flex items-center justify-between px-6 py-3.5 font-medium text-[#2B1A24]"
              >
                <span className="flex items-center gap-3"><span className="text-lg">{cat.icon}</span> {cat.name}</span>
                <span className="text-xs transition-transform duration-300" style={{ transform: openCat === cat.id ? 'rotate(180deg)' : 'none' }}>▼</span>
              </button>
              {openCat === cat.id && (
                <div className="bg-[#FFF6F6] py-2">
                  {cat.subcategories.map(sub => (
                    <button 
                      key={sub.slug} 
                      onClick={() => nav(`/search?category=${cat.id}&subcategory=${sub.slug}`)}
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
            <button onClick={() => nav("/about")} className="w-full text-left px-6 py-3.5 font-medium text-[#2B1A24] hover:bg-[#FFF6F6] flex items-center gap-3"><span className="text-lg">ℹ️</span> About Us</button>
            <button onClick={() => nav("/tracking")} className="w-full text-left px-6 py-3.5 font-medium text-[#2B1A24] hover:bg-[#FFF6F6] flex items-center gap-3"><span className="text-lg">🚚</span> Track Order</button>
            <button onClick={() => nav("/contact")} className="w-full text-left px-6 py-3.5 font-medium text-[#2B1A24] hover:bg-[#FFF6F6] flex items-center gap-3"><span className="text-lg">📞</span> Contact</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const cart = useCart();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-[#FAD4DD] pb-safe md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-[60px] px-2">
        <button onClick={() => router.push("/")} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/" ? "text-[#E8546B]" : "text-gray-400"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === "/" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button onClick={() => router.push("/search")} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/search" ? "text-[#E8546B]" : "text-gray-400"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === "/search" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span className="text-[10px] font-medium">Shop</span>
        </button>
        <button onClick={onOpenMenu} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          <span className="text-[10px] font-medium">Menu</span>
        </button>
        <button onClick={() => router.push("/cart")} className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-colors ${pathname === "/cart" ? "text-[#E8546B]" : "text-gray-400"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === "/cart" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          {cart.totalCount > 0 && <span className="absolute top-1 right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E8546B] px-1 text-[9px] font-bold text-white animate-pop">{cart.totalCount}</span>}
          <span className="text-[10px] font-medium">Cart</span>
        </button>
        <button onClick={() => router.push("/account")} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/account" ? "text-[#E8546B]" : "text-gray-400"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === "/account" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span className="text-[10px] font-medium">Account</span>
        </button>
      </div>
    </div>
  );
}