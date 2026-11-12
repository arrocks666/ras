"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatBDT } from "@/lib/adminOrders";
import { Product } from "@/lib/ProductsContext";
import { loadSettings, DEFAULT_SETTINGS, type StoreSettings } from "@/lib/firestoreSettings";
import ImageSearchModal from "@/components/ImageSearchModal";
import AddProductModal from "@/components/AddProductModal";
import type { LiveProduct } from "@/lib/liveProduct";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [recalculating, setRecalculating] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState<string>("");

  // Image search state
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [imageSearchJobId, setImageSearchJobId] = useState<string | null>(null);
  const [imageSearchResults, setImageSearchResults] = useState<LiveProduct[]>([]);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchError, setImageSearchError] = useState<string | null>(null);
  const imageSearchPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Add product modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LiveProduct | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadSettings().then(setSettings);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      setProducts(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, "id">),
        }))
      );
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const setBusy = (id: string, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleTrending = async (product: Product) => {
    setBusy(product.id, true);
    try {
      const newVal = !product.isTrending;
      await updateDoc(doc(db, "products", product.id), {
        isTrending: newVal,
        updatedAt: serverTimestamp(),
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isTrending: newVal } : p))
      );
    } catch (err: any) {
      alert("Failed: " + (err?.message || "Unknown error"));
    } finally {
      setBusy(product.id, false);
    }
  };

  // ✅ NEW: Toggle Weekly Sale
  const toggleWeeklySale = async (product: Product) => {
    setBusy(product.id, true);
    try {
      const newVal = !(product as any).isWeeklySale;
      await updateDoc(doc(db, "products", product.id), {
        isWeeklySale: newVal,
        updatedAt: serverTimestamp(),
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isWeeklySale: newVal } as any : p))
      );
    } catch (err: any) {
      alert("Failed: " + (err?.message || "Unknown error"));
    } finally {
      setBusy(product.id, false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.title}"?\n\nThis cannot be undone.`)) return;
    setBusy(product.id, true);
    try {
      await deleteDoc(doc(db, "products", product.id));
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err: any) {
      alert("Failed: " + (err?.message || "Unknown error"));
    } finally {
      setBusy(product.id, false);
    }
  };

  const handleEditPrice = (product: Product) => {
    setEditProduct(product);
    setNewPrice(String(product.price));
  };

  const savePrice = async () => {
    if (!editProduct) return;
    const price = Number(newPrice);
    if (!price || isNaN(price) || price < 1) {
      return alert("Please enter a valid price greater than 0");
    }
    setBusy(editProduct.id, true);
    try {
      await updateDoc(doc(db, "products", editProduct.id), {
        price: price,
        oldPrice: Math.round(price * 1.25),
        updatedAt: serverTimestamp(),
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editProduct.id
            ? { ...p, price, oldPrice: Math.round(price * 1.25) }
            : p
        )
      );
      setEditProduct(null);
      alert("✓ Price updated successfully!");
    } catch (err: any) {
      alert("Failed: " + (err?.message || "Unknown error"));
    } finally {
      setBusy(editProduct.id, false);
    }
  };

  const recalculateAllPrices = async () => {
    if (!confirm("Recalculate ALL product prices using current markup tiers?\n\nThis will OVERWRITE existing prices on all products with a CNY price.")) return;
    setRecalculating(true);
    try {
      let count = 0;
      let skipped = 0;
      const updated: Product[] = [];
      for (const p of products) {
        const cnyPrice = (p as any).priceOriginalCny;
        if (!cnyPrice || cnyPrice <= 0) {
          skipped++;
          continue;
        }
        const priceUsd = cnyPrice * settings.cnyToUsd;
        const costBdt = priceUsd * settings.usdToBdt;
        let multiplier = 1.5;
        if (costBdt >= 500 && costBdt < 2000) multiplier = 1.35;
        else if (costBdt >= 2000 && costBdt < 5000) multiplier = 1.25;
        else if (costBdt >= 5000 && costBdt < 10000) multiplier = 1.18;
        else if (costBdt >= 10000) multiplier = 1.12;
        const newPriceVal = Math.max(20, Math.round((costBdt * multiplier) / 10) * 10);
        await updateDoc(doc(db, "products", p.id), {
          price: newPriceVal,
          oldPrice: Math.round(newPriceVal * 1.25),
          updatedAt: serverTimestamp(),
        });
        updated.push({ ...p, price: newPriceVal, oldPrice: Math.round(newPriceVal * 1.25) });
        count++;
      }
      setProducts(updated);
      alert(`✓ Recalculated ${count} prices${skipped > 0 ? `\n(${skipped} skipped)` : ""}`);
    } catch (err: any) {
      alert("Failed: " + (err?.message || "Unknown error"));
    } finally {
      setRecalculating(false);
    }
  };

  const handleJobStarted = (jobId: string) => {
    setImageSearchJobId(jobId);
    setImageSearchResults([]);
    setImageSearchError(null);
    setImageSearchLoading(true);

    if (imageSearchPollRef.current) clearInterval(imageSearchPollRef.current);

    imageSearchPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/image-search/status?jobId=${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        const incoming: LiveProduct[] = data.products ?? [];
        if (incoming.length > 0) setImageSearchResults(incoming);

        if (data.status === "done") {
          if (imageSearchPollRef.current) clearInterval(imageSearchPollRef.current);
          setImageSearchLoading(false);
          if (incoming.length === 0) setImageSearchError("No matches found.");
        } else if (data.status === "error") {
          if (imageSearchPollRef.current) clearInterval(imageSearchPollRef.current);
          setImageSearchLoading(false);
          setImageSearchError(data.error || "Search failed.");
        }
      } catch (err) {
        console.warn("Poll error:", err);
      }
    }, 2000);
  };

  const clearImageSearch = () => {
    if (imageSearchPollRef.current) clearInterval(imageSearchPollRef.current);
    setImageSearchJobId(null);
    setImageSearchResults([]);
    setImageSearchError(null);
    setImageSearchLoading(false);
  };

  useEffect(() => {
    return () => {
      if (imageSearchPollRef.current) clearInterval(imageSearchPollRef.current);
    };
  }, []);

  const visibleProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, searchTerm]);

  const trendingCount = products.filter((p) => p.isTrending).length;
  const weeklySaleCount = products.filter((p) => (p as any).isWeeklySale).length;

  return (
    <div className="min-h-screen bg-[#FFF6F6] p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-white px-3 py-1 text-[10px] font-bold uppercase text-[#E8546B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" /> Products
            </div>
            <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">Manage Products</h1>
            <p className="mt-1 text-sm text-[#6B5558]">
              {products.length} products · {trendingCount} popular · {weeklySaleCount} on sale
            </p>
          </div>
          <button onClick={() => setImageSearchOpen(true)} className="rounded-xl bg-[#E8546B] px-5 py-2.5 text-sm font-bold text-white shadow-orange-glow hover:bg-[#b02a58]">
            + Sourcing (Apify)
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-[#E8546B]/30 bg-[#FDE8EC] p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#2B1A24]">Bulk Price Recalculation</p>
            <p className="text-xs text-[#6B5558]">Apply current markup tiers to all existing products</p>
          </div>
          <button onClick={recalculateAllPrices} disabled={recalculating} className="rounded-lg bg-[#E8546B] px-4 py-2 text-xs font-bold text-white hover:bg-[#b02a58] disabled:opacity-50">
            {recalculating ? "Recalculating..." : "🔄 Recalculate All Prices"}
          </button>
        </div>

        {imageSearchJobId && (
          <div className="mb-4 rounded-2xl border-2 border-[#E8546B]/40 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-[#FAD4DD] pb-3">
              <h2 className="text-sm font-bold text-[#E8546B] uppercase tracking-wider">Apify Search Results</h2>
              <button onClick={clearImageSearch} className="text-xs font-semibold text-red-500 hover:underline">Clear</button>
            </div>
            {imageSearchLoading && imageSearchResults.length === 0 && (
              <div className="flex items-center justify-center gap-3 py-10">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" />
                <span className="text-sm font-medium text-[#6B5558]">Searching 1688 via Apify... (~30-50 seconds)</span>
              </div>
            )}
            {imageSearchError && <p className="py-4 text-sm text-red-500">{imageSearchError}</p>}
            {imageSearchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {imageSearchResults.map((p) => (
                  <div key={p.id} className="flex flex-col rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] p-3">
                    <button onClick={() => setPreviewProduct(p as any)} className="flex gap-3 mb-3 text-left">
                      <div className="h-24 w-24 flex-shrink-0 rounded bg-white p-1 overflow-hidden border border-[#FAD4DD]">
                        <img src={p.image} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-[#2B1A24] line-clamp-3">{p.title}</h3>
                        <p className="mt-1 text-base font-bold text-[#E8546B]">{formatBDT(p.price)}</p>
                        {p.colors?.length > 0 && <p className="text-[10px] text-[#6B5558] mt-1">{p.colors.length} colors</p>}
                        {p.sizes?.length > 0 && <p className="text-[10px] text-[#6B5558]">{p.sizes.length} sizes</p>}
                      </div>
                    </button>
                    <div className="mt-auto flex gap-2">
                      <button onClick={() => setPreviewProduct(p as any)} className="flex-1 rounded-lg bg-white border border-[#E8546B] py-2 text-xs font-bold text-[#E8546B] hover:bg-[#FFF6F6]">Preview</button>
                      <button onClick={() => { setSelectedProduct(p); setAddModalOpen(true); }} className="flex-1 rounded-lg bg-[#E8546B] py-2 text-xs font-bold text-white hover:bg-[#b02a58]">Add</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="relative mb-4">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search products by title..." className="w-full rounded-lg border border-[#FAD4DD] bg-white py-2.5 pl-10 pr-3 text-sm focus:border-[#E8546B] focus:outline-none" />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A88F92]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-16"><div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" /></div>
          ) : visibleProducts.length === 0 ? (
            <div className="rounded-lg border border-[#FAD4DD] bg-white p-10 text-center">
              <p className="text-[#6B5558]">{searchTerm ? `No products match "${searchTerm}"` : "No products yet. Click 'Sourcing (Apify)' to add products."}</p>
            </div>
          ) : (
            visibleProducts.map((product) => (
              <div key={product.id} className="rounded-lg border border-[#FAD4DD] bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => setPreviewProduct(product)} className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] hover:border-[#E8546B] transition">
                    {product.image ? <img src={product.image} alt="" className="h-full w-full object-contain mix-blend-multiply" /> : <span className="text-2xl">🎁</span>}
                  </button>
                  <button onClick={() => setPreviewProduct(product)} className="min-w-0 flex-1 text-left">
                    <h3 className="line-clamp-2 text-sm font-semibold text-[#2B1A24] hover:text-[#E8546B]">{product.title}</h3>
                    <p className="mt-1 text-xs font-bold text-[#E8546B]">{formatBDT(product.price)}</p>
                  </button>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button onClick={() => handleEditPrice(product)} disabled={busyIds.has(product.id)} className="rounded-full border border-[#FAD4DD] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B5558] hover:border-[#E8546B] hover:text-[#E8546B] disabled:opacity-40">💰 Price</button>
                    <button onClick={() => toggleTrending(product)} disabled={busyIds.has(product.id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${product.isTrending ? "border-[#E8546B] bg-[#E8546B] text-white" : "border-[#FAD4DD] bg-white text-[#6B5558] hover:border-[#E8546B]"}`}>⭐ Popular</button>
                    
                    {/* ✅ NEW WEEKLY SALE BUTTON */}
                    <button onClick={() => toggleWeeklySale(product)} disabled={busyIds.has(product.id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${(product as any).isWeeklySale ? "border-orange-500 bg-orange-500 text-white" : "border-[#FAD4DD] bg-white text-[#6B5558] hover:border-orange-500"}`}>🔥 Sale</button>

                    <button onClick={() => handleDelete(product)} disabled={busyIds.has(product.id)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FAD4DD] text-[#A88F92] hover:border-red-300 hover:text-red-500 disabled:opacity-40">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditProduct(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#2B1A24] mb-2">Edit Price</h2>
            <p className="text-xs text-[#6B5558] mb-4 line-clamp-2">{editProduct.title}</p>
            <label className="block text-xs font-bold text-[#6B5558] mb-1">New Price (৳)</label>
            <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} min={1} autoFocus className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-lg font-bold focus:border-[#E8546B] focus:outline-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setEditProduct(null)} className="flex-1 rounded-lg border border-[#FAD4DD] py-2.5 text-sm font-semibold text-[#6B5558]">Cancel</button>
              <button onClick={savePrice} className="flex-1 rounded-lg bg-[#E8546B] py-2.5 text-sm font-bold text-white hover:bg-[#b02a58]">Save</button>
            </div>
          </div>
        </div>
      )}

      {previewProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setPreviewProduct(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-[#2B1A24]">Product Preview</h2>
              <button onClick={() => setPreviewProduct(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="aspect-square rounded-xl bg-[#FFF6F6] border border-[#FAD4DD] overflow-hidden p-4">
                <img src={previewProduct.image} alt="" className="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2B1A24]">{previewProduct.title}</h3>
                <p className="mt-2 text-xl font-bold text-[#E8546B]">{formatBDT(previewProduct.price)}</p>
                {previewProduct.colors && previewProduct.colors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-[#6B5558] mb-1">Colors ({previewProduct.colors.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {(previewProduct.colors as any[]).map((c, i) => (
                        <span key={i} className="text-[10px] bg-[#FFF6F6] px-2 py-0.5 rounded border border-[#FAD4DD]">{typeof c === "string" ? c : c.label}</span>
                      ))}
                    </div>
                  </div>
                )}
                {previewProduct.sizes && previewProduct.sizes.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-bold text-[#6B5558] mb-1">Sizes:</p>
                    <p className="text-[10px] text-[#6B5558]">{previewProduct.sizes.join(", ")}</p>
                  </div>
                )}
                <p className="mt-3 text-[11px] text-[#6B5558] line-clamp-4">{previewProduct.description}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setPreviewProduct(null)} className="flex-1 rounded-lg border border-[#FAD4DD] py-2.5 text-sm font-semibold text-[#6B5558]">Close</button>
              <button onClick={() => { setSelectedProduct(previewProduct as any); setAddModalOpen(true); setPreviewProduct(null); }} className="flex-1 rounded-lg bg-[#E8546B] py-2.5 text-sm font-bold text-white hover:bg-[#b02a58]">Add to Store</button>
            </div>
          </div>
        </div>
      )}

      <ImageSearchModal open={imageSearchOpen} onClose={() => setImageSearchOpen(false)} onJobStarted={handleJobStarted} />
      <AddProductModal open={addModalOpen} product={selectedProduct} onClose={() => setAddModalOpen(false)} onAdded={fetchProducts} />
    </div>
  );
}