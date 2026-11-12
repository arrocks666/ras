"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/CartContext";

export default function BottomNav() {
  const pathname = usePathname();
  const cart = useCart();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Floating Button -> opens /categories */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
        <Link href="/categories" className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E8546B] text-white shadow-lg shadow-[#E8546B]/50 border-4 border-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="10" height="10" rx="1"></rect></svg>
        </Link>
      </div>

      <div className="bg-white border-t border-[#FAD4DD] pb-safe shadow-[0_-10px_40px_rgba(232,84,107,0.1)]">
        <div className="flex items-center justify-around h-[72px] px-2">
          
          <Link href="/" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${pathname === "/" ? "text-[#E8546B]" : "text-gray-400"}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === "/" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
            <span className="text-[10px] font-bold">Home</span>
          </Link>

          <Link href="/wishlist" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${pathname === "/wishlist" ? "text-[#E8546B]" : "text-gray-400"}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === "/wishlist" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            <span className="text-[10px] font-bold">Favorite</span>
          </Link>

          <div className="w-full h-full"></div>

          <Link href="/cart" className={`flex flex-col items-center justify-center w-full h-full gap-1 relative ${pathname === "/cart" ? "text-[#E8546B]" : "text-gray-400"}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === "/cart" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
            {cart.totalCount > 0 && <span className="absolute top-0 right-1/4 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E8546B] px-1 text-[9px] font-bold text-white">{cart.totalCount}</span>}
            <span className="text-[10px] font-bold">Cart</span>
          </Link>

          <Link href="/account" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${pathname === "/account" ? "text-[#E8546B]" : "text-gray-400"}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === "/account" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            <span className="text-[10px] font-bold">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}