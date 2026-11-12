"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useMemo } from "react";
import { useProducts } from "@/lib/ProductsContext";
import ProductCard from "@/components/ProductCard";
import type { LiveProduct } from "@/lib/liveProduct";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() || "";
  const categoryParam = searchParams.get("category") || "";
  const subcategoryParam = searchParams.get("subcategory") || "";
  const jobId = searchParams.get("jobId");

  const { products, loading: productsLoading } = useProducts();
  const [imageResults, setImageResults] = useState<LiveProduct[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Filter States
  const [priceRange, setPriceRange] = useState<[number, number]>([500, 5000]);
  const [sortBy, setSortBy] = useState("default");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "in-stock" | "pre-order">("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Find active category name for display
  const activeCategory = CATEGORIES.find(c => c.id === categoryParam);
  const activeSubcategory = activeCategory?.subcategories.find(s => s.slug === subcategoryParam);

  useEffect(() => {
    if (!jobId) return;
    setImageLoading(true);
    let attempts = 0;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/image-search/status?jobId=${jobId}`);
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setImageResults(data.products);
          setImageLoading(false);
          clearInterval(interval);
        }
        if (data.status === "done" && data.products?.length === 0) {
          setErrorMsg("No matching products found.");
          setImageLoading(false);
          clearInterval(interval);
        }
        if (data.status === "error") {
          setErrorMsg(data.error || "Search failed.");
          setImageLoading(false);
          clearInterval(interval);
        }
        attempts++;
        if (attempts > 30) {
          clearInterval(interval);
          setImageLoading(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [jobId]);

  const isImageSearch = !!jobId;
  const loading = isImageSearch ? imageLoading : productsLoading;

  // ✅ Filter & Sort Logic
  const displayProducts = useMemo(() => {
    if (isImageSearch) return imageResults;
    
    let list = [...products];

    if (categoryParam) {
      list = list.filter((p) => p.categoryId === categoryParam);
    }

    if (query) {
      list = list.filter((p) => p.title.toLowerCase().includes(query));
    }

    if (subcategoryParam) {
      const subName = subcategoryParam.replace(/-/g, " ").toLowerCase();
      list = list.filter((p) => 
        p.title.toLowerCase().includes(subName) || 
        (p.subtitle && p.subtitle.toLowerCase().includes(subName)) ||
        (p as any).subcategory === subcategoryParam
      );
    }

    // ✅ Availability Filter
    if (availabilityFilter === "in-stock") {
      list = list.filter((p) => p.inStock === true);
    } else if (availabilityFilter === "pre-order") {
      list = list.filter((p) => p.inStock === false);
    }

    list = list.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      list.sort((a, b) => (b.id > a.id ? 1 : -1));
    } else if (sortBy === "popular") {
      list.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    }

    return list;
  }, [products, categoryParam, subcategoryParam, query, isImageSearch, imageResults, priceRange, sortBy, availabilityFilter]);

  const clearFilters = () => {
    setPriceRange([500, 5000]);
    setSortBy("default");
    setAvailabilityFilter("all");
    if (categoryParam || subcategoryParam) router.push('/search');
  };

  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-20">
      
      {/* 🔥 SMALLER, SLEEK TOP HEADER BAR */}
      <div className="bg-white border-b border-[#FAD4DD] mb-6">
        <div className="mx-auto max-w-[1400px] px-4 py-5 flex items-baseline gap-4">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#2B1A24]">
            {isImageSearch
              ? "Image Search Results"
              : activeSubcategory
              ? activeSubcategory.name
              : activeCategory
              ? activeCategory.name
              : query
              ? `Search: "${query}"`
              : "All Products"}
          </h1>
          <span className="text-sm text-[#6B5558] font-medium">
            {displayProducts.length} items
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* LEFT SIDEBAR */}
          {!isImageSearch && (
            <aside className="hidden md:block w-[280px] shrink-0">
              <div className="sticky top-24 space-y-4">
                
                {/* PRODUCT AVAILABILITY FILTER */}
                <div className="bg-white rounded-2xl border border-[#FAD4DD] p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="font-bold text-[#2B1A24] text-sm uppercase tracking-wider">Product Availability</h3>
                    <p className="text-[11px] text-[#6B5558] mt-1">Live status</p>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Ready to Ship */}
                    <button
                      onClick={() => setAvailabilityFilter(availabilityFilter === "in-stock" ? "all" : "in-stock")}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        availabilityFilter === "in-stock" 
                          ? "border-[#E8546B] bg-[#FFF6F6] ring-1 ring-[#E8546B]" 
                          : "border-[#FAD4DD] hover:border-[#E8546B] bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-[#2B1A24]">Ready to Ship</span>
                        {availabilityFilter === "in-stock" && <span className="text-[#E8546B] text-xs">✓</span>}
                      </div>
                      <p className="text-[10px] text-[#6B5558] mb-1">Available</p>
                      <p className="text-[10px] text-[#6B5558] mb-2 leading-tight">Products currently in stock and ready for order processing.</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        ● In Stock
                      </span>
                    </button>

                    {/* Pre-Order */}
                    <button
                      onClick={() => setAvailabilityFilter(availabilityFilter === "pre-order" ? "all" : "pre-order")}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        availabilityFilter === "pre-order" 
                          ? "border-[#E8546B] bg-[#FFF6F6] ring-1 ring-[#E8546B]" 
                          : "border-[#FAD4DD] hover:border-[#E8546B] bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-[#2B1A24]">Pre-Order</span>
                        {availabilityFilter === "pre-order" && <span className="text-[#E8546B] text-xs">✓</span>}
                      </div>
                      <p className="text-[10px] text-[#6B5558] mb-1">Coming Soon</p>
                      <p className="text-[10px] text-[#6B5558] mb-2 leading-tight">Reserve products that are not currently available but can be ordered in advance.</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                        ◷ Available for Pre-Order
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sort By */}
                <div className="bg-white rounded-2xl border border-[#FAD4DD] p-5 shadow-sm">
                  <h3 className="font-bold text-[#2B1A24] mb-3 text-sm uppercase tracking-wider">Sort By</h3>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] p-3 text-sm text-[#2B1A24] focus:border-[#E8546B] focus:outline-none focus:ring-2 focus:ring-[#E8546B]/20 transition-all cursor-pointer"
                  >
                    <option value="default">Recommended</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest Arrivals</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>

                {/* Price Filter */}
                <div className="bg-white rounded-2xl border border-[#FAD4DD] p-5 shadow-sm">
                  <h3 className="font-bold text-[#2B1A24] mb-4 text-sm uppercase tracking-wider">Price Range</h3>
                  <div className="space-y-4">
                    <input 
                      type="range" 
                      min="500" 
                      max="5000" 
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-[#E8546B] cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-sm font-bold text-[#2B1A24]">
                      <span className="bg-[#FFF6F6] px-2 py-1 rounded">৳{priceRange[0]}</span>
                      <span>-</span>
                      <span className="bg-[#FFF6F6] px-2 py-1 rounded">৳{priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <button 
                  onClick={clearFilters}
                  className="w-full rounded-xl border-2 border-[#E8546B] bg-white py-3 text-sm font-bold text-[#E8546B] transition-colors hover:bg-[#E8546B] hover:text-white shadow-sm"
                >
                  Clear All Filters
                </button>

              </div>
            </aside>
          )}

          {/* PRODUCT GRID */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Trigger */}
            {!isImageSearch && (
              <div className="md:hidden mb-4 flex justify-end">
                <button 
                  onClick={() => setMobileFilterOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-[#FAD4DD] bg-white px-4 py-2 text-sm font-bold text-[#2B1A24] shadow-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Filters
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E8546B] border-t-transparent" />
              </div>
            ) : displayProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {displayProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-2xl border border-[#FAD4DD] shadow-sm">
                <p className="text-[#6B5558] text-lg mb-4 font-medium">
                  {errorMsg || "No products found matching your filters."}
                </p>
                <button onClick={clearFilters} className="inline-block rounded-full bg-[#E8546B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#b02a58] transition-colors shadow-md">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-6 shadow-2xl animate-fade-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-[#2B1A24]">Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="text-2xl text-[#6B5558]">×</button>
            </div>
            
            <div className="space-y-6">
              
              {/* Mobile Availability */}
              <div>
                <h4 className="font-bold text-[#2B1A24] mb-3 text-sm uppercase">Availability</h4>
                <div className="flex gap-2">
                   <button 
                     onClick={() => setAvailabilityFilter(availabilityFilter === "in-stock" ? "all" : "in-stock")}
                     className={`flex-1 py-2 text-xs font-bold rounded-lg border ${availabilityFilter === "in-stock" ? "bg-[#E8546B] text-white border-[#E8546B]" : "bg-white text-[#6B5558] border-[#FAD4DD]"}`}
                   >
                     In Stock
                   </button>
                   <button 
                     onClick={() => setAvailabilityFilter(availabilityFilter === "pre-order" ? "all" : "pre-order")}
                     className={`flex-1 py-2 text-xs font-bold rounded-lg border ${availabilityFilter === "pre-order" ? "bg-[#E8546B] text-white border-[#E8546B]" : "bg-white text-[#6B5558] border-[#FAD4DD]"}`}
                   >
                     Pre-Order
                   </button>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#2B1A24] mb-3 text-sm uppercase">Sort By</h4>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] p-3 text-sm text-[#2B1A24]"
                >
                  <option value="default">Recommended</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              <div>
                <h4 className="font-bold text-[#2B1A24] mb-3 text-sm uppercase">Price Range</h4>
                <input 
                  type="range" 
                  min="500" 
                  max="5000" 
                  step="100"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-[#E8546B]"
                />
                <div className="flex items-center justify-between text-sm font-bold text-[#2B1A24] mt-2">
                  <span>৳{priceRange[0]}</span>
                  <span>৳{priceRange[1]}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { clearFilters(); setMobileFilterOpen(false); }}
                  className="flex-1 rounded-xl border-2 border-[#E8546B] bg-white py-3 text-sm font-bold text-[#E8546B]"
                >
                  Clear
                </button>
                <button 
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-[2] rounded-xl bg-[#E8546B] py-3 text-sm font-bold text-white shadow-md"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF6F6] py-20 text-center text-[#E8546B]">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}