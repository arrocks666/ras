"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";

function Crown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 15" className={className} fill="none" aria-hidden="true">
      <path d="M2.2 12.6h19.6l-1.6-8.4-4.6 3.4L12 2.2 7.4 7.6 2.8 4.2 1.2 12.6h1Z" fill="#E4216F" />
      <path d="M2.2 12.6h19.6l.2 1.1H2l.2-1.1Z" fill="#C21C5E" />
      <circle cx="12" cy="1.6" r="1.3" fill="#E4216F" />
    </svg>
  );
}

export default function MobileHeader() {
  const pathname = usePathname();
  const cart = useCart();
  const wishlist = useWishlist();

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const open = () => setMenuOpen(true);
    window.addEventListener("open-mobile-menu", open);
    return () => window.removeEventListener("open-mobile-menu", open);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const wishCount = wishlist?.items?.size ?? 0;

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#F9D9E5] bg-gradient-to-b from-[#FFF7FA] to-[#FFEAF2] px-4 lg:hidden">
        {/* LEFT: 3 lines */}
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="-ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center text-[#7A2440] transition-transform active:scale-90"
        >
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="3" y1="6.5" x2="21" y2="6.5" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="17.5" x2="21" y2="17.5" />
          </svg>
        </button>

        {/* CENTRE: crown + brand, truly centred */}
        <Link
          href="/"
          className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center leading-none"
          aria-label="Ratris Artistry Shop — home"
        >
          <Crown className="mb-[2px] h-[14px] w-[25px]" />
          <span className="bg-gradient-to-b from-[#E4216F] to-[#C21C5E] bg-clip-text font-serif text-[20px] font-bold tracking-[0.05em] text-transparent">
            RATRI&rsquo;S
          </span>
          <span className="mt-[2px] text-[6.5px] font-bold uppercase tracking-[0.32em] text-[#C21C5E]">
            Artistry Shop
          </span>
        </Link>

        {/* RIGHT: actions */}
        <div className="flex flex-shrink-0 items-center gap-3">
          <Link href="/search" aria-label="Search" className="text-[#7A2440] transition-transform active:scale-90">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>

          <Link href="/wishlist" aria-label="Wishlist" className="relative text-[#7A2440] transition-transform active:scale-90">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#E4216F] px-1 text-[8px] font-bold leading-none text-white ring-[1.5px] ring-[#FFEAF2]">
                {wishCount}
              </span>
            )}
          </Link>

          <Link href="/cart" aria-label="Cart" className="relative text-[#E4216F] transition-transform active:scale-90">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 2.5h2.2l2.4 11.9a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.8-1.4l1.6-7.4H6" />
              <circle cx="9.5" cy="20" r="1.4" />
              <circle cx="18" cy="20" r="1.4" />
            </svg>
            {cart.totalCount > 0 && (
              <span className="absolute -right-[7px] -top-[5px] flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#E4216F] px-1 text-[8px] font-bold leading-none text-white ring-[1.5px] ring-[#FFEAF2]">
                {cart.totalCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-[#3B1024]/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative flex h-full w-[84%] max-w-[320px] flex-col bg-white shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between border-b border-[#F9D9E5] bg-gradient-to-b from-[#FFF7FA] to-[#FFEAF2] px-5 py-4">
              <div className="flex flex-col leading-none">
                <Crown className="mb-[3px] h-[12px] w-[21px]" />
                <span className="bg-gradient-to-b from-[#E4216F] to-[#C21C5E] bg-clip-text font-serif text-[18px] font-bold tracking-[0.05em] text-transparent">
                  RATRI&rsquo;S
                </span>
                <span className="mt-[2px] text-[6.5px] font-bold uppercase tracking-[0.3em] text-[#C21C5E]">
                  Artistry Shop
                </span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[#7A2440]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="hide-scrollbar flex-1 overflow-y-auto pb-8">
              <MenuItem href="/" icon="🏠" label="Home" onGo={() => setMenuOpen(false)} />
              <MenuItem href="/search" icon="🛍️" label="Shop" onGo={() => setMenuOpen(false)} />
              <MenuItem href="/new" icon="✨" label="New Arrivals" onGo={() => setMenuOpen(false)} />

              <div className="mt-1 border-t border-[#FBE3EC]">
                <MenuItem href="/wishlist" icon="♡" label="My Wishlist" onGo={() => setMenuOpen(false)} />
                <MenuItem href="/account" icon="👤" label="My Account" onGo={() => setMenuOpen(false)} />
                <MenuItem href="/orders" icon="📦" label="My Orders" onGo={() => setMenuOpen(false)} />
                <MenuItem href="/tracking" icon="🚚" label="Track Order" onGo={() => setMenuOpen(false)} />
                <MenuItem href="/about" icon="ℹ️" label="About Us" onGo={() => setMenuOpen(false)} />
                <MenuItem href="/contact" icon="📞" label="Contact" onGo={() => setMenuOpen(false)} />
                <MenuItem href="/help" icon="❓" label="Help & Support" onGo={() => setMenuOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MenuItem({
  href,
  icon,
  label,
  onGo,
}: {
  href: string;
  icon: string;
  label: string;
  onGo: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onGo}
      className="flex items-center gap-3 border-b border-[#FBE3EC]/70 px-5 py-3.5 text-[13px] font-semibold text-[#3A2330] active:bg-[#FFF7FA]"
    >
      <span className="w-5 text-center text-[14px]">{icon}</span>
      {label}
    </Link>
  );
}
