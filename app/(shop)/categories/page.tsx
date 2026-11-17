"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-[#FFF6F6] py-12">
      <div className="mx-auto max-w-[1400px] px-4">
        <h1 className="font-serif text-3xl font-bold text-[#2B1A24] mb-8">All Categories</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-[#FAD4DD] shadow-sm overflow-hidden">
              <div className="p-5 bg-[#FDE8EC]/30 border-b border-[#FAD4DD] flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <h2 className="font-bold text-[#2B1A24] text-lg">{cat.name}</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-2">
                  {cat.subcategories.map((sub) => (
                    <Link 
                      key={sub.slug} 
                      href={`/search?category=${cat.id}&subcategory=${sub.slug}`}
                      className="text-sm text-[#6B5558] hover:text-[#E8546B] hover:underline transition"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}