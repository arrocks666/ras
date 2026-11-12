"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";

export default function MegaMenu({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [activeCatId, setActiveCatId] = useState(CATEGORIES[0].id);

  const activeCategory = CATEGORIES.find((c) => c.id === activeCatId) || CATEGORIES[0];

  const handleNavigate = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <div className="absolute left-0 top-full w-full border-b border-[#FAD4DD] bg-white shadow-xl animate-fade-down min-h-[400px] z-50">
      <div className="mx-auto flex max-w-[1400px]">
        
        {/* LEFT SIDEBAR: Categories */}
        <div className="w-[280px] shrink-0 border-r border-[#FAD4DD] bg-[#FFF6F6] py-4">
          <ul>
            {CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <button
                  onMouseEnter={() => setActiveCatId(cat.id)}
                  onClick={() => handleNavigate(`/search?category=${cat.id}`)}
                  className={`flex w-full items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${
                    activeCatId === cat.id
                      ? "bg-white text-[#E8546B] border-l-4 border-[#E8546B]"
                      : "text-[#2B1A24] hover:bg-white hover:text-[#E8546B] border-l-4 border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">{cat.icon}</span>
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-gray-400">❯</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT SIDE: Subcategories with Images */}
        <div className="flex-1 p-8 bg-white">
          <div className="mb-6 flex items-center justify-between border-b border-[#FAD4DD] pb-4">
            <h3 className="font-serif text-xl font-bold text-[#2B1A24]">
              {activeCategory.name}
            </h3>
            <button 
              onClick={() => handleNavigate(`/search?category=${activeCategory.id}`)}
              className="text-sm font-semibold text-[#E8546B] hover:underline"
            >
              View All {activeCategory.name} →
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-6">
            {activeCategory.subcategories.map((sub) => (
              <button
                key={sub.slug}
                onClick={() => handleNavigate(`/search?category=${activeCategory.id}&subcategory=${sub.slug}`)}
                className="group flex flex-col items-center gap-3 text-center"
              >
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-transparent shadow-sm transition-all duration-300 group-hover:border-[#E8546B] group-hover:shadow-md">
                  <img
                    src={sub.image}
                    alt={sub.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <span className="text-sm font-medium text-[#6B5558] transition-colors group-hover:text-[#E8546B]">
                  {sub.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}