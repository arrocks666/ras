"use client";

import { useRouter } from "next/navigation";
import { useProducts } from "@/lib/ProductsContext";
import ProductCard from "@/components/ProductCard";
import { useMemo } from "react";

export default function NewArrivalsPage() {
  const router = useRouter();
  const { products, loading } = useProducts();

  // Sort by createdAt (newest first). Fallback to id if createdAt is missing.
  const newProducts = useMemo(() => {
    return [...products]
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || 0);
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || 0);
        if (aTime && bTime) return bTime - aTime;
        return (b.id > a.id ? 1 : -1);
      })
      .slice(0, 24);
  }, [products]);

  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-24 md:pb-10">
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.push("/")} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="flex-1 text-lg font-bold text-[#2B1A24] md:text-xl">New Arrivals</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="mb-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2B1A24]">✨ Just Landed</h2>
          <p className="text-sm text-[#6B5558] mt-1">The latest products added to our store.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E8546B] border-t-transparent" /></div>
        ) : newProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
            {newProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#FAD4DD]">
            <p className="text-[#6B5558]">No products yet. Add products from the admin panel.</p>
          </div>
        )}
      </div>
    </div>
  );
}