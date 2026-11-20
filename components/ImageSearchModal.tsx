"use client";

import { useState, useRef } from "react";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CATEGORIES } from "@/lib/categories";
import { imgSrc, needsImgbbMigration } from "@/lib/img";
import { useProducts } from "@/lib/ProductsContext";

/** Firestore rejects `undefined` anywhere in the object — strip it deeply. */
function deepClean<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((v) => deepClean(v))
      .filter((v) => v !== undefined && v !== null) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined || v === null) continue;
      if (typeof v === "number" && Number.isNaN(v)) continue;
      out[k] = deepClean(v);
    }
    return out as T;
  }
  return value;
}

/** Uploads every remote 1688 image of a product to ImgBB in one request. */
async function rehostImages(product: any): Promise<{ map: Record<string, string>; failed: number }> {
  const sources = new Set<string>();
  const collect = (u?: string | null) => {
    if (u && needsImgbbMigration(u)) sources.add(u);
  };

  collect(product?.image);
  (product?.gallery || []).forEach((g: string) => collect(g));
  (product?.colors || []).forEach((c: any) => collect(c?.image));
  (product?.variants || []).forEach((v: any) => collect(v?.image));

  const list = Array.from(sources);
  const map: Record<string, string> = {};
  let failed = 0;

  for (let i = 0; i < list.length; i += 12) {
    const chunk = list.slice(i, i + 12);
    try {
      const res = await fetch("/api/upload-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: chunk }),
      });
      const data = await res.json();
      for (const r of data?.results || []) {
        if (r?.url) map[r.source] = r.url;
        else failed++;
      }
    } catch {
      failed += chunk.length;
    }
  }

  return { map, failed };
}

function SearchThumb({ src, alt }: { src?: string; alt: string }) {
  const [tried, setTried] = useState(0);
  if (!src || tried > 1) {
    return <span className="flex h-full w-full items-center justify-center text-2xl">💍</span>;
  }
  const url = tried === 0 ? imgSrc(src) : src;
  return (
    <img
      src={url}
      alt={alt}
      referrerPolicy="no-referrer"
      className="h-full w-full object-contain"
      onError={() => {
        console.warn("[image-search] could not load", url, "→ trying fallback");
        setTried((t) => t + 1);
      }}
    />
  );
}

export default function ImageSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { refresh } = useProducts();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const [results, setResults] = useState<any[]>([]);
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0]?.id ?? "");
  const [selectedSub, setSelectedSub] = useState(CATEGORIES[0]?.subcategories[0]?.slug ?? "");
  const [savingId, setSavingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentCategory = CATEGORIES.find(c => c.id === selectedCat);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleSearch = async () => {
    if (!file) return;
    setLoading(true);
    setStatus("Searching 1688 via Image... (This can take up to 2 minutes)");
    setResults([]);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/image-search", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Search failed");
      const { jobId } = await res.json();

      setStatus("Finding matches...");

      let attempts = 0;
      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/image-search/status?jobId=${jobId}`);
          const data = await statusRes.json();

          if (data.status === "done" && data.products?.length > 0) {
            clearInterval(interval);
            setStatus("");
            setLoading(false);

            const found = data.products.slice(0, 3);
            setResults(found);

            const prices: Record<string, number> = {};
            found.forEach((p: any) => { prices[p.id] = p.price; });
            setEditedPrices(prices);

          } else if (data.status === "error") {
            clearInterval(interval);
            setStatus(`Error: ${data.error}`);
            setLoading(false);
          }

          attempts++;
          // ✅ Increased timeout from 30 to 150 attempts (5 minutes)
          if (attempts > 150) {
            clearInterval(interval);
            setStatus("Search timed out. The server took too long.");
            setLoading(false);
          }
        } catch (err) { console.error(err); }
      }, 2000);

    } catch (err: any) {
      setStatus(err.message || "Failed.");
      setLoading(false);
    }
  };

  const handleSaveProduct = async (product: any) => {
    setSavingId(product.id);
    try {
      const cat = CATEGORIES.find(c => c.id === selectedCat);
      const subName = cat?.subcategories.find(s => s.slug === selectedSub)?.name;

      const docRef = doc(collection(db, "products"));
      const finalPrice = Number(editedPrices[product.id] || product.price) || 0;

      // Re-host every 1688 image on ImgBB so the picture never breaks again
      setStatus("Uploading pictures to ImgBB...");
      const { map, failed } = await rehostImages(product);
      const fix = (u?: string | null) => (u && map[u] ? map[u] : u);

      // Scale every variant by the same % as the price you typed above.
      const baseFromSource = Number(product.price) || 0;
      const scaledVariants = (product.variants || []).map((v: any) => {
        const vp = Number(v?.price) || 0;
        const scaled =
          baseFromSource > 0 && vp > 0 ? Math.round((vp * finalPrice) / baseFromSource) : finalPrice;
        return { ...v, price: scaled };
      });

      const productToSave = {
        ...product,
        id: docRef.id,
        image: fix(product.image),
        gallery: (product.gallery || []).map((g: string) => fix(g)),
        colors: (product.colors || []).map((c: any) => ({ ...c, image: fix(c.image) })),
        variants: scaledVariants,
        price: finalPrice,
        priceMax: finalPrice,
        categoryId: selectedCat,
        subcategoryId: selectedSub,
        subcategory: subName,
        savedAt: Date.now(),
        isLive: true,
      };

      await setDoc(docRef, deepClean(productToSave) as any);
      await refresh();
      setStatus(
        failed > 0
          ? `Saved. ${failed} picture(s) could not be uploaded — they still load through /api/img.`
          : "Saved with pictures on ImgBB."
      );
      setResults(prev => prev.filter(p => p.id !== product.id));
    } catch (err: any) {
      console.error("Save product failed:", err);
      alert("Failed to save product:\n\n" + (err?.message || String(err)));
    } finally {
      setSavingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#2B1A24]">📸 Admin Image Search</h2>
          <button onClick={onClose} disabled={loading} className="text-2xl text-gray-400 hover:text-red-500 disabled:opacity-50">✕</button>
        </div>

        <div className="space-y-4">
          {results.length === 0 && (
            <>
              <div 
                onClick={() => !loading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${preview ? "border-[#E8546B] bg-[#FFF6F6]" : "border-[#FAD4DD] hover:border-[#E8546B] bg-gray-50"} ${loading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                ) : (
                  <div className="text-gray-500">
                    <span className="text-3xl block mb-2">📸</span>
                    Click to upload an image
                  </div>
                )}
              </div>

              {status && (
                <div className={`p-3 rounded-xl text-sm font-medium ${status.includes("Error") ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                  {status}
                </div>
              )}

              <button
                onClick={handleSearch}
                disabled={!file || loading}
                className="w-full rounded-xl bg-[#E8546B] py-3 text-sm font-bold text-white shadow-md hover:bg-[#d1475e] disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search 1688"}
              </button>
            </>
          )}

          {results.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#FFF6F6] p-4 rounded-xl border border-[#FAD4DD] space-y-3">
                <h3 className="text-sm font-bold text-[#2B1A24]">Select where to save these products:</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Category</label>
                    <select
                      value={selectedCat}
                      onChange={(e) => { setSelectedCat(e.target.value); setSelectedSub(CATEGORIES.find(c=>c.id===e.target.value)?.subcategories[0]?.slug || ""); }}
                      className="w-full rounded-lg border border-[#FAD4DD] bg-white px-3 py-2 text-sm focus:border-[#E8546B] focus:outline-none"
                    >
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Subcategory</label>
                    <select
                      value={selectedSub}
                      onChange={(e) => setSelectedSub(e.target.value)}
                      className="w-full rounded-lg border border-[#FAD4DD] bg-white px-3 py-2 text-sm focus:border-[#E8546B] focus:outline-none"
                    >
                      {currentCategory?.subcategories.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#2B1A24]">Found Matches</h3>
                <button onClick={() => setResults([])} className="text-xs text-[#E8546B] font-bold hover:underline">Search Another Image</button>
              </div>

              <div className="space-y-3">
                {results.map((product) => (
                  <div key={product.id} className="flex flex-col sm:flex-row gap-4 p-3 border border-[#FAD4DD] rounded-xl bg-white shadow-sm">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] p-1">
                      <SearchThumb src={product.image} alt={product.title} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#2B1A24] line-clamp-2">{product.title}</p>
                      <p className="text-[10px] text-gray-500 mt-1 mb-2">Supplier: {product.supplierName || "1688"}</p>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-gray-600 uppercase">Selling Price (৳)</label>
                        <input 
                          type="number"
                          value={editedPrices[product.id] || ""}
                          onChange={(e) => setEditedPrices({...editedPrices, [product.id]: Number(e.target.value)})}
                          className="w-24 rounded-lg border border-[#FAD4DD] px-2 py-1 text-sm font-bold text-[#E8546B] focus:border-[#E8546B] outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center shrink-0">
                      <button 
                        onClick={() => handleSaveProduct(product)}
                        disabled={savingId === product.id}
                        className="rounded-xl bg-[#E8546B] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#d1475e] disabled:opacity-50"
                      >
                        {savingId === product.id ? "Saving..." : "Add to Store"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
