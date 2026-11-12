"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { loadSettings, DEFAULT_SETTINGS, type StoreSettings } from "@/lib/firestoreSettings";

type NavItem = { href: string; label: string; icon: string; };

const navItems: NavItem[] = [
  { href: "/control-room/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/control-room/products", label: "Products", icon: "📦" },
  { href: "/control-room/orders", label: "Orders", icon: "🧾" },
  { href: "/control-room/users", label: "Customers", icon: "👥" },
  { href: "/control-room/coupons", label: "Coupons", icon: "🎟️" },
  { href: "/control-room/follow-requests", label: "Follow Requests", icon: "🎁" },
  { href: "/control-room/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  const isLoginPage = pathname === "/control-room/login";

  useEffect(() => {
    if (isLoginPage) return;
    loadSettings().then(setSettings).catch(() => {});
  }, [pathname, isLoginPage]);

  const handleLogout = async () => {
    if (!confirm("Logout from admin panel?")) return;
    document.cookie = "ras_admin_session=; path=/; max-age=0";
    router.push("/control-room/login");
    router.refresh();
  };

  if (isLoginPage) return <>{children}</>;

  const logoUrl = settings.logoUrl;

  return (
    <div className="min-h-screen bg-[#FFF6F6] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white text-[#2B1A24] transition-transform duration-300 md:relative md:translate-x-0 shadow-xl md:shadow-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col border-r border-[#FAD4DD]">
          
          {/* ✅ BIGGER HEADER */}
          <div className="flex items-center gap-4 border-b border-[#FAD4DD] px-5 py-6 bg-gradient-to-r from-[#FFF6F6] to-white">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-14 w-14 flex-shrink-0 rounded-xl object-contain shadow-sm" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8546B] text-2xl font-bold text-white shadow-orange-glow">R</div>
            )}
            <div className="leading-tight">
              <div className="text-xl font-bold">
                <span className="text-[#2B1A24]">Ratry's </span>
                <span className="text-[#E8546B]">Admin</span>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A88F92]">Command Center</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-6 overflow-y-auto">
            <ul className="space-y-1.5">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link href={item.href} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                        active 
                          ? "bg-[#E8546B] text-white shadow-[0_4px_20px_-4px_rgba(232,84,107,0.5)] scale-[1.02]" 
                          : "text-[#6B5558] hover:bg-[#FFF6F6] hover:text-[#E8546B] hover:translate-x-1"
                      }`}>
                      <span className="text-xl">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-[#FAD4DD] p-4 bg-[#FFF6F6]/50">
            <Link href="/" className="mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[#6B5558] transition hover:bg-white hover:text-[#E8546B]">
              <span className="text-lg">🏠</span>
              View Site
            </Link>
            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[#E8546B] transition hover:bg-[#E8546B]/10">
              <span className="text-lg">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#FAD4DD] bg-white/90 backdrop-blur-md px-4 py-3 shadow-sm md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
          </button>
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="h-10 w-10 flex-shrink-0 rounded-lg object-contain" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8546B] text-sm font-bold text-white">R</div>
          )}
          <div className="text-base font-bold"><span className="text-[#2B1A24]">Ratry's</span> <span className="text-[#E8546B]">Admin</span></div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}