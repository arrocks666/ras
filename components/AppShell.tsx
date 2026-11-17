"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCart } from "@/lib/CartContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/control-room");
  const cart = useCart();

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      {/* ✅ DESKTOP HEADER ONLY (Hidden on mobile) */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* ✅ PREMIUM MOBILE HEADER (Hidden on desktop) */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-[#FAD4DD]/50 shadow-sm">
        <button className="text-[#2B1A24]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <Link href="/" className="flex flex-col items-center">
          <span className="font-serif text-lg font-bold text-[#E8546B]">RATRY'S</span>
          <span className="text-[8px] tracking-[0.2em] text-[#2B1A24] font-bold uppercase">Artistry Shop</span>
        </Link>
        <div className="flex gap-4">
          <Link href="/search">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </Link>
          <Link href="/cart" className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
            {cart.totalCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E8546B] text-[9px] font-bold text-white border border-white">
                {cart.totalCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-0">{children}</main>

      <div className="hidden md:block">
        <Footer />
      </div>

      <MobileBottomNav />
    </>
  );
}