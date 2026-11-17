"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/CartContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cart = useCart();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden pb-safe">
      {/* Soft pink background fade so the nav stands out over content */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
      
      <div className="relative mx-auto flex w-[92%] max-w-[400px] items-center justify-between rounded-full bg-white/90 px-6 py-2.5 shadow-[0_8px_30px_rgba(232,84,107,0.15)] backdrop-blur-md border border-[#FAD4DD]/50 mb-4">
        
        {/* Home */}
        <Link href="/" className="flex flex-col items-center gap-1 min-w-[50px]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isActive("/") ? "#E8546B" : "#6B5558"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className={`text-[10px] font-bold ${isActive("/") ? "text-[#E8546B]" : "text-[#6B5558]"}`}>Home</span>
        </Link>

        {/* Categories */}
        <Link href="/categories" className="flex flex-col items-center gap-1 min-w-[50px]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isActive("/categories") ? "#E8546B" : "#6B5558"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
          <span className={`text-[10px] font-bold ${isActive("/categories") ? "text-[#E8546B]" : "text-[#6B5558]"}`}>Categories</span>
        </Link>

        {/* Center Floating Action Button (Shop) */}
        <div className="relative -top-6 flex flex-col items-center min-w-[60px]">
          <Link href="/search" className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#FF8B9A] to-[#E8546B] text-white shadow-[0_8px_20px_rgba(232,84,107,0.4)] border-4 border-white transition-transform active:scale-95">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </Link>
          <span className="mt-1 text-[10px] font-bold text-[#E8546B]">Shop</span>
        </div>

        {/* Cart */}
        <Link href="/cart" className="relative flex flex-col items-center gap-1 min-w-[50px]">
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isActive("/cart") ? "#E8546B" : "#6B5558"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cart.totalCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E8546B] px-1 text-[9px] font-bold text-white border border-white">
                {cart.totalCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-bold ${isActive("/cart") ? "text-[#E8546B]" : "text-[#6B5558]"}`}>Cart</span>
        </Link>

        {/* More (Menu) */}
        <button onClick={() => window.dispatchEvent(new Event('open-mobile-menu'))} className="flex flex-col items-center gap-1 min-w-[50px]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B5558" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
          </svg>
          <span className="text-[10px] font-bold text-[#6B5558]">More</span>
        </button>

      </div>
    </div>
  );
}