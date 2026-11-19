"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/control-room");

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      {/* Desktop header — unchanged, hidden below 1024px */}
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* Mobile / tablet header (pink app header) */}
      <MobileHeader />

      <main className="flex-1">{children}</main>

      <Footer />

      {/* keeps the last row above the floating bottom nav (nav is always visible) */}
      <div aria-hidden className="h-[86px] lg:hidden" />

      <MobileBottomNav />
    </>
  );
}
