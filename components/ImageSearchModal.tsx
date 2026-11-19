"use client";

import { useState, useRef } from "react";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CATEGORIES } from "@/lib/categories";

export default function ImageSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
      const finalPrice = editedPrices[product.id] || product.price;

      // ✅ Re-upload image to our own server (or ImgBB) to fix broken images
      let finalImageUrl = product.image;
      if (product.image && product.image.includes("alicdn.com")) {
        try {
          const imgRes = await fetch("/api/upload-proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: product.image })
          });
          const imgData = await imgRes.json();
          if (imgData.url) finalImageUrl = imgData.url;
        } catch (e) {
          console.warn("Image proxy failed, using original", e);
        }
      }

      const productToSave = {
        ...product,
        id: docRef.id,
        image: finalImageUrl,
        price: finalPrice,
        categoryId: selectedCat,
        subcategoryId: selectedSub,
        subcategory: subName,
        savedAt: Date.now(),
        isLive: true
      };

      await setDoc(docRef, productToSave);
      setResults(prev => prev.filter(p => p.id !== product.id));
    } catch (err) {
      console.error(err);
      alert("Failed to save product");
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
                    <img src={product.image} className="w-20 h-20 object-contain bg-[#FFF6F6] rounded-lg border border-[#FAD4DD] p-1 shrink-0" />
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