"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProducts } from "@/lib/ProductsContext";
import ProductCard from "@/components/ProductCard";
import { formatBDT } from "@/lib/data";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

function CategoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // ✅ REMOVED THE FALLBACK TO CATEGORIES[0].id
  const catParam = searchParams.get("cat") || "";
  const subParam = searchParams.get("sub");

  const { products, loading } = useProducts();
  const [maxPrice, setMaxPrice] = useState<number>(50000);

  const activeCategory = CATEGORIES.find(c => c.id === catParam);
  const activeSubcategory = activeCategory?.subcategories.find(s => s.slug === subParam);

  const displayProducts = useMemo(() => {
    let list = [...products];

    if (catParam) {
      list = list.filter((p) => 
        p.categoryId?.trim().toLowerCase() === catParam.trim().toLowerCase()
      );
    }

    if (subParam) {
      const subName = activeSubcategory?.name.toLowerCase() || subParam.replace(/-/g, " ").toLowerCase();
      list = list.filter((p) => 
        (p as any).subcategory?.toLowerCase() === subName ||
        p.title.toLowerCase().includes(subName)
      ); 
    }

    list = list.filter((p) => p.price >= 100 && p.price <= maxPrice);
    return list;
  }, [products, catParam, subParam, maxPrice, activeCategory, activeSubcategory]);

  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-24">
      
      {/* 1. HEADER & CIRCLES */}
      <div className="bg-white border-b border-[#FAD4DD] pt-8 pb-4 shadow-sm">
        <div className="mx-auto max-w-[1400px] px-4">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#2B1A24] mb-6">
            {catParam ? activeCategory?.name : "All Categories"}
          </h1>
          
          <div className="flex overflow-x-auto gap-6 md:gap-8 pb-4 hide-scrollbar items-start">
            {/* All Circle */}
            <Link 
              href="/categories"
              className={`flex flex-col items-center flex-shrink-0 cursor-pointer group w-[72px] md:w-24`}
            >
              <div className={`h-[72px] w-[72px] md:h-24 md:w-24 rounded-full overflow-hidden border-2 transition-all p-1 ${!catParam ? 'border-[#E8546B]' : 'border-transparent group-hover:border-[#E8546B]'}`}>
                <div className="h-full w-full rounded-full bg-[#FDE8EC] flex items-center justify-center text-3xl shadow-inner">✨</div>
              </div>
              <span className={`mt-3 text-[10px] md:text-xs text-center font-bold h-8 flex items-start justify-center ${!catParam ? 'text-[#E8546B]' : 'text-[#2B1A24]'}`}>
                All Items
              </span>
            </Link>

            {/* Category Circles */}
            {CATEGORIES.map((cat) => (
              <Link 
                key={cat.id} 
                href={`/categories?cat=${encodeURIComponent(cat.id)}`}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer group w-[72px] md:w-24"
              >
                <div className={`h-[72px] w-[72px] md:h-24 md:w-24 rounded-full overflow-hidden border-2 transition-all p-1 ${catParam === cat.id ? 'border-[#E8546B] shadow-md' : 'border-transparent group-hover:border-[#E8546B]'}`}>
                  <div className="h-full w-full rounded-full bg-[#FDE8EC] overflow-hidden">
                    <img src={cat.image} alt={cat.name} className="h-full w-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </div>
                <span className={`mt-3 text-[10px] md:text-xs text-center line-clamp-2 h-8 flex items-start justify-center ${catParam === cat.id ? 'text-[#E8546B] font-bold' : 'text-[#2B1A24]'}`}>
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 2. SUBCATEGORY BANNER (Only shows if a category is selected) */}
      {activeCategory && (
        <div className="bg-white border-b border-[#FAD4DD] shadow-sm">
          <div className="mx-auto max-w-[1400px] px-4 py-3 flex flex-wrap gap-2">
            <Link 
              href={`/categories?cat=${encodeURIComponent(activeCategory.id)}`}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${!subParam ? 'bg-[#E8546B] text-white' : 'bg-[#FFF6F6] text-[#6B5558] border border-[#FAD4DD]'}`}
            >
              All {activeCategory.name}
            </Link>
            {activeCategory.subcategories.map(sub => (
              <Link 
                key={sub.slug}
                href={`/categories?cat=${encodeURIComponent(activeCategory.id)}&sub=${encodeURIComponent(sub.slug)}`}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${subParam === sub.slug ? 'bg-[#E8546B] text-white' : 'bg-[#FFF6F6] text-[#6B5558] border border-[#FAD4DD]'}`}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 3. FILTER BAR */}
      <div className="bg-white/95 backdrop-blur-md border-b border-[#FAD4DD] sticky top-[56px] md:top-[110px] z-40 shadow-sm">
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-bold text-[#2B1A24] bg-[#FFF6F6] px-3 py-1.5 rounded-full border border-[#FAD4DD]">{displayProducts.length} Results</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#2B1A24]">Max Price:</span>
            <span className="text-xs font-bold text-[#E8546B] bg-[#FDE8EC] px-2 py-1 rounded-md min-w-[70px] text-center">{formatBDT(maxPrice)}</span>
            <input 
              type="range" min="100" max="50000" step="100" value={maxPrice} 
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-40 h-1.5 bg-[#FAD4DD] rounded-lg appearance-none cursor-pointer accent-[#E8546B]"
            />
          </div>
        </div>
      </div>

      {/* 4. PRODUCTS */}
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:py-8">
        {loading ? (
          <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E8546B] border-t-transparent" /></div>
        ) : displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-[#FAD4DD] shadow-sm animate-fade-in">
            <div className="text-6xl mb-4 opacity-50">🔍</div>
            <p className="text-[#2B1A24] text-xl font-serif font-bold mb-2">No products found.</p>
            <p className="text-sm text-[#6B5558] mb-6">Try adjusting your price range or selecting a different category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF6F6] py-20 text-center font-bold text-[#E8546B]">Loading...</div>}>
      <CategoryContent />
    </Suspense>
  );
}