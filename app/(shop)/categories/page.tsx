"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";

export default function CategoriesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const filteredCategories = CATEGORIES.filter(cat => 
    cat.name.toLowerCase().includes(search.toLowerCase()) || 
    cat.subcategories.some(sub => sub.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      {/* ============================================================
          📱 MOBILE + TABLET VIEW (below 1024px)
          ============================================================ */}
      <div className="lg:hidden min-h-screen bg-[#FFF6F6] pb-24">
        {/* Search Header */}
        <div className="sticky top-14 z-40 bg-[#FFF6F6] pt-4 pb-2 px-4 shadow-sm">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#FAD4DD] bg-white py-3 pl-10 pr-4 text-[13px] font-medium focus:border-[#E4216F] focus:outline-none"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A88F92]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </div>
        </div>

        {/* Category List */}
        <div className="px-4 py-3 space-y-3">
          {filteredCategories.map((cat) => {
            const isExpanded = expandedCat === cat.id;
            return (
              <div key={cat.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#FAD4DD]/50 transition-all">
                <button 
                  onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#FDE8EC] text-2xl">
                    {cat.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-[#2B1A24] text-[15px]">{cat.name}</h2>
                    <p className="text-[11px] text-[#8A6A75] mt-0.5">{cat.subcategories.length} subcategories</p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E4216F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}><polyline points="9 18 15 12 9 6" /></svg>
                </button>

                {/* Subcategories Dropdown */}
                {isExpanded && (
                  <div className="bg-[#FFF8FB] border-t border-[#FAD4DD]/50 p-3 grid grid-cols-2 gap-2 animate-fade-down">
                    {cat.subcategories.map((sub) => (
                      <Link 
                        key={sub.slug} 
                        href={`/search?category=${cat.id}&subcategory=${sub.slug}`}
                        className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm border border-[#FAD4DD]/30 active:scale-95 transition-transform"
                      >
                        <div className="h-8 w-8 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                           <img src={sub.image} alt={sub.name} className="h-full w-full object-cover" />
                        </div>
                        <span className="text-[11px] font-semibold text-[#2B1A24] truncate">{sub.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          💻 DESKTOP VIEW (1024px and up — unchanged)
          ============================================================ */}
      <div className="hidden lg:block min-h-screen bg-[#FFF6F6] pb-24">
        <div className="sticky top-[60px] z-40 bg-white/95 backdrop-blur-md border-b border-[#FAD4DD]/50">
          <div className="flex items-center gap-4 px-4 py-4">
            <button onClick={() => router.back()} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <h1 className="font-serif text-xl font-bold text-[#2B1A24]">Categories</h1>
          </div>
          <div className="px-4 pb-4">
            <div className="relative">
              <input type="text" placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] py-3 pl-10 pr-4 text-sm font-medium focus:border-[#E8546B] focus:outline-none" />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A88F92]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3 mx-auto max-w-[1400px]">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-[#FAD4DD] shadow-sm overflow-hidden">
              <Link href={`/search?category=${cat.id}`} className="flex items-center gap-4 p-4 hover:bg-[#FFF6F6] transition-colors border-b border-[#FAD4DD]/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FDE8EC] text-2xl">{cat.icon}</div>
                <div className="flex-1">
                  <h2 className="font-bold text-[#2B1A24] text-[15px]">{cat.name}</h2>
                  <p className="text-[11px] text-[#6B5558]">Explore all {cat.name}</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8546B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </Link>
              <div className="bg-[#FFF6F6]/50 p-4 grid grid-cols-2 gap-3">
                {cat.subcategories.slice(0, 6).map((sub) => (
                  <Link key={sub.slug} href={`/search?category=${cat.id}&subcategory=${sub.slug}`} className="text-[12px] font-medium text-[#6B5558] hover:text-[#E8546B] truncate">{sub.name}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
