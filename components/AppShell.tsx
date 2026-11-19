"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/control-room");
  const ownsBottomBar = pathname === "/cart" || pathname === "/checkout";

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      {/* Desktop header — unchanged, hidden on mobile */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile header (pink app header) */}
      <MobileHeader />

      <main className="flex-1">{children}</main>

      <Footer />

      {/* keeps the last row of the footer above the floating bottom nav */}
      {!ownsBottomBar && <div aria-hidden className="h-[78px] md:hidden" />}

      <MobileBottomNav />
    </>
  );
}
