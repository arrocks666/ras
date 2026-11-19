"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/CartContext";

const ROSE = "#E4216F";
const IDLE = "#B18A9B";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cart = useCart();

  // The cart and checkout pages have their own sticky action bar at the bottom.
  // Showing the floating nav there would cover the subtotal / Place Order button.
  if (pathname === "/cart" || pathname === "/checkout") return null;

  const active = (path: string) => pathname === path;

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 block pb-safe md:hidden">
      <div className="pointer-events-auto mx-auto w-full max-w-[430px] px-3 pb-2">
        <div className="relative flex h-[62px] items-center rounded-[28px] border border-[#F7C9DB] bg-gradient-to-b from-white to-[#FFF0F6] px-1 shadow-[0_12px_30px_-10px_rgba(228,33,111,0.55)]">
          <Link href="/" className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1">
            <svg width="21" height="21" viewBox="0 0 24 24" fill={active("/") ? ROSE : "none"} stroke={active("/") ? ROSE : IDLE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5 12 2.5l9 7v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-10Z" />
              {!active("/") && <path d="M9 21v-7h6v7" />}
            </svg>
            <span className="text-[9px] font-bold leading-none" style={{ color: active("/") ? ROSE : IDLE }}>
              Home
            </span>
          </Link>

          <Link href="/categories" className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active("/categories") ? ROSE : IDLE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
              <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
              <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
            </svg>
            <span className="text-[9px] font-bold leading-none" style={{ color: active("/categories") ? ROSE : IDLE }}>
              Categories
            </span>
          </Link>

          <div className="w-[68px] flex-shrink-0" />

          <Link href="/cart" className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1">
            <div className="relative">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active("/cart") ? ROSE : IDLE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 2.5h2.2l2.4 11.9a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.8-1.4l1.6-7.4H6" />
                <circle cx="9.5" cy="20" r="1.4" />
                <circle cx="18" cy="20" r="1.4" />
              </svg>
              {cart.totalCount > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#E4216F] px-1 text-[8px] font-bold leading-none text-white ring-[1.5px] ring-white">
                  {cart.totalCount}
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold leading-none" style={{ color: active("/cart") ? ROSE : IDLE }}>
              Cart
            </span>
          </Link>

          <button
            onClick={() => window.dispatchEvent(new Event("open-mobile-menu"))}
            className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1"
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill={IDLE} stroke="none">
              <circle cx="5" cy="12" r="1.9" />
              <circle cx="12" cy="12" r="1.9" />
              <circle cx="19" cy="12" r="1.9" />
            </svg>
            <span className="text-[9px] font-bold leading-none" style={{ color: IDLE }}>
              More
            </span>
          </button>

          <Link
            href="/search"
            aria-label="Shop"
            className="absolute left-1/2 top-[-22px] z-20 flex h-[54px] w-[54px] -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#FF9BC0] to-[#E4216F] text-white ring-[3px] ring-white shadow-[0_10px_20px_-6px_rgba(228,33,111,0.85)] active:scale-95 transition-transform"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2.5 3.5 6.5v13A1.5 1.5 0 0 0 5 21h14a1.5 1.5 0 0 0 1.5-1.5v-13L18 2.5z" />
              <line x1="3.5" y1="6.5" x2="20.5" y2="6.5" />
              <path d="M16 10.5a4 4 0 0 1-8 0" />
            </svg>
          </Link>
          <span className="pointer-events-none absolute bottom-[7px] left-1/2 z-10 -translate-x-1/2 text-[9px] font-extrabold leading-none text-[#E4216F]">
            SHOP
          </span>
        </div>
      </div>
    </div>
  );
}
