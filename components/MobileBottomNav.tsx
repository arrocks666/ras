"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/CartContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cart = useCart();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#FAD4DD] bg-white md:hidden pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 px-2">
        
        <Link href="/" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${pathname === "/" ? "text-[#E8546B]" : "text-gray-400"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === "/" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
          <span className="text-[10px] font-bold">Home</span>
        </Link>

        <Link href="/search" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${pathname === "/search" ? "text-[#E8546B]" : "text-gray-400"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === "/search" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span className="text-[10px] font-bold">Shop</span>
        </Link>

        <Link href="/categories" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${pathname === "/categories" ? "text-[#E8546B]" : "text-gray-400"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === "/categories" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span className="text-[10px] font-bold">Categories</span>
        </Link>

        <Link href="/wishlist" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${pathname === "/wishlist" ? "text-[#E8546B]" : "text-gray-400"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === "/wishlist" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
          <span className="text-[10px] font-bold">Wishlist</span>
        </Link>

        <Link href="/cart" className={`flex flex-col items-center justify-center w-full h-full gap-1 relative ${pathname === "/cart" ? "text-[#E8546B]" : "text-gray-400"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === "/cart" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
          {cart.totalCount > 0 && <span className="absolute top-0 right-1/4 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E8546B] px-1 text-[9px] font-bold text-white">{cart.totalCount}</span>}
          <span className="text-[10px] font-bold">Cart</span>
        </Link>
      </div>
    </div>
  );
}