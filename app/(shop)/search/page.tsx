"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useMemo } from "react";
import { useProducts } from "@/lib/ProductsContext";
import ProductCard from "@/components/ProductCard";
import type { LiveProduct } from "@/lib/liveProduct";
import Link from "next/link";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() || "";
  const categoryParam = searchParams.get("category") || "";
  const jobId = searchParams.get("jobId");

  const { products, loading: productsLoading } = useProducts();
  const [imageResults, setImageResults] = useState<LiveProduct[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  // ✅ Filter by category and/or search query
  const displayProducts = useMemo(() => {
    if (isImageSearch) return imageResults;
    let list = products;
    if (categoryParam) {
      list = list.filter((p) => p.categoryId === categoryParam);
    }
    if (query) {
      list = list.filter((p) => p.title.toLowerCase().includes(query));
    }
    return list;
  }, [products, categoryParam, query, isImageSearch, imageResults]);

  return (
    <div className="min-h-screen bg-[#FFF6F6] py-10 px-4">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="font-serif text-3xl font-bold text-[#2B1A24] mb-6">
          {isImageSearch
            ? "Image Search Results"
            : categoryParam
            ? `Category: ${categoryParam.replace(/-/g, " ")}`
            : query
            ? `Search Results for "${query}"`
            : "All Products"}
        </h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E8546B] border-t-transparent" />
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#FAD4DD]">
            <p className="text-[#6B5558] text-lg mb-4">
              {errorMsg || "No products found."}
            </p>
            <Link href="/" className="inline-block rounded-full bg-[#E8546B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#b02a58]">
              Back to Home
            </Link>
          </div>
        )}
      </div>
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