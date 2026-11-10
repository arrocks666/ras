"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { loadSettings, DEFAULT_SETTINGS, type StoreSettings } from "@/lib/firestoreSettings";

type NavItem = { href: string; label: string; icon: string; };

const navItems: NavItem[] = [
  { href: "/admin-panel/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin-panel/products", label: "Products", icon: "📦" },
  { href: "/admin-panel/orders", label: "Orders", icon: "🧾" },
  { href: "/admin-panel/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  const isLoginPage = pathname === "/admin-panel/login";

  useEffect(() => {
    if (isLoginPage) return;
    loadSettings().then(setSettings).catch(() => {});
  }, [pathname, isLoginPage]);

  const handleLogout = async () => {
    if (!confirm("Logout from admin panel?")) return;
    document.cookie = "ras_admin_session=; path=/; max-age=0";
    router.push("/admin-panel/login");
    router.refresh();
  };

  if (isLoginPage) return <>{children}</>;

  const logoUrl = settings.logoUrl;

  return (
    <div className="min-h-screen bg-[#FFF6F6] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white text-[#2B1A24] transition-transform duration-200 md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col border-r border-[#FAD4DD]">
          <div className="flex items-center gap-2 border-b border-[#FAD4DD] px-4 py-4">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-9 w-9 flex-shrink-0 rounded-lg object-contain" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8546B] text-lg font-bold text-white shadow-orange-glow">R</div>
            )}
            <div className="leading-tight">
              <div className="text-sm font-bold">
                <span className="text-[#2B1A24]">Ratry's </span>
                <span className="text-[#E8546B]">Admin</span>
              </div>
              <p className="text-[10px] text-[#A88F92]">Control Panel</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link href={item.href} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        active ? "bg-[#E8546B] text-white shadow-orange-glow" : "text-[#6B5558] hover:bg-[#FFF6F6] hover:text-[#E8546B]"
                      }`}>
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-[#FAD4DD] p-3">
            <Link href="/" className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#6B5558] transition hover:bg-[#FFF6F6] hover:text-[#E8546B]">
              <span className="text-lg">🏠</span>
              View Site
            </Link>
            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#E8546B] transition hover:bg-[#E8546B]/10">
              <span className="text-lg">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#FAD4DD] bg-white px-4 py-3 shadow-sm md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="flex h-9 w-9 items-center justify-center text-[#2B1A24]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
          </button>
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="h-7 w-7 flex-shrink-0 rounded object-contain" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[#E8546B] text-xs font-bold text-white">R</div>
          )}
          <div className="text-sm font-bold"><span className="text-[#2B1A24]">Ratry's</span> <span className="text-[#E8546B]">Admin</span></div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}