"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/CartContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cart = useCart();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 block lg:hidden pb-safe">
      <div className="relative mx-auto w-full max-w-[430px] px-2 pb-2">
        
        {/* The Pill Bar */}
        <div className="relative flex items-center justify-between rounded-[2rem] bg-white border-2 border-[#FAD4DD] px-4 py-3 shadow-[0_10px_40px_rgba(232,84,107,0.15)]">
          
          <Link href="/" className="flex flex-col items-center gap-1 min-w-[50px] z-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isActive("/") ? "#E8546B" : "none"} stroke={isActive("/") ? "#E8546B" : "#6B5558"} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
            <span className={`text-[9px] font-bold ${isActive("/") ? "text-[#E8546B]" : "text-[#6B5558]"}`}>Home</span>
          </Link>

          <Link href="/categories" className="flex flex-col items-center gap-1 min-w-[50px] z-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive("/categories") ? "#E8546B" : "#6B5558"} strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            <span className={`text-[9px] font-bold ${isActive("/categories") ? "text-[#E8546B]" : "text-[#6B5558]"}`}>Categories</span>
          </Link>

          <Link href="/cart" className="relative flex flex-col items-center gap-1 min-w-[50px] z-10">
            <div className="relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive("/cart") ? "#E8546B" : "#6B5558"} strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              {cart.totalCount > 0 && <span className="absolute -right-2 -top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#E8546B] px-1 text-[8px] font-bold text-white border border-white">{cart.totalCount}</span>}
            </div>
            <span className={`text-[9px] font-bold ${isActive("/cart") ? "text-[#E8546B]" : "text-[#6B5558]"}`}>Cart</span>
          </Link>

          <button onClick={() => window.dispatchEvent(new Event('open-mobile-menu'))} className="flex flex-col items-center gap-1 min-w-[50px] z-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B5558" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
            <span className="text-[9px] font-bold text-[#6B5558]">More</span>
          </button>

          {/* Center Shop Button (Pops out) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 flex flex-col items-center z-20">
            <Link href="/search" className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-[#FF8B9A] to-[#E8546B] text-white shadow-[0_8px_20px_rgba(232,84,107,0.4)] border-[3px] border-white transition-transform active:scale-95">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
            </Link>
            <span className="mt-1 text-[10px] font-bold text-[#E8546B]">SHOP</span>
          </div>

        </div>
      </div>
    </div>
  );
}