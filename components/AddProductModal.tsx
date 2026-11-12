"use client";

import { useState, useEffect } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { LiveProduct } from "@/lib/liveProduct";
import { formatBDT } from "@/lib/data";

type Props = {
  open: boolean;
  product: LiveProduct | null;
  onClose: () => void;
  onAdded: () => void;
};

export default function AddProductModal({ open, product, onClose, onAdded }: Props) {
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [isTrending, setIsTrending] = useState(false);
  
  // ✅ NEW: Availability State
  const [inStock, setInStock] = useState(true); 
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCategoryId("");
      setSubcategory("");
      setIsTrending(false);
      setInStock(true);
      setError("");
    }
  }, [open]);

  if (!open || !product) return null;

  const selectedCategory = CATEGORIES.find((c) => c.id === categoryId);

  const handleAdd = async () => {
    if (!categoryId) {
      setError("Please select a category");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/add-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ We pass inStock to the backend
        body: JSON.stringify({ product, categoryId, subcategory, isTrending, inStock }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add product");
      }
      onAdded();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-[#FAD4DD] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-xl font-bold text-[#2B1A24]">Add Product to Store</h2>

        {/* Product Preview */}
        <div className="mb-4 flex gap-3 rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] p-3">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-[#FAD4DD] bg-white p-1">
            <img src={product.image} alt="" className="h-full w-full object-contain mix-blend-multiply" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#2B1A24] line-clamp-2">{product.title}</p>
            <p className="mt-1 text-base font-bold text-[#E8546B]">{formatBDT(product.price)}</p>
          </div>
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#6B5558]">Category *</label>
          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategory(""); }} className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none">
            <option value="">Select category...</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>

        {/* Subcategory (Fixed to use object.name) */}
        {selectedCategory && (
          <div className="mb-4">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#6B5558]">Subcategory</label>
            <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none">
              <option value="">Any</option>
              {selectedCategory.subcategories.map((s) => (
                <option key={s.slug} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* ✅ NEW: Availability Toggles */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B5558]">Availability *</label>
          <div className="flex gap-3">
            <button 
              onClick={() => setInStock(true)}
              className={`flex-1 rounded-lg border p-3 text-left transition-all ${inStock ? 'border-[#E8546B] bg-[#FFF6F6] ring-1 ring-[#E8546B]' : 'border-[#FAD4DD] bg-white'}`}
            >
              <p className="text-sm font-bold text-[#2B1A24]">In Stock</p>
              <p className="text-[10px] text-[#6B5558]">Ready to ship</p>
            </button>
            <button 
              onClick={() => setInStock(false)}
              className={`flex-1 rounded-lg border p-3 text-left transition-all ${!inStock ? 'border-[#E8546B] bg-[#FFF6F6] ring-1 ring-[#E8546B]' : 'border-[#FAD4DD] bg-white'}`}
            >
              <p className="text-sm font-bold text-[#2B1A24]">Pre-Order</p>
              <p className="text-[10px] text-[#6B5558]">Coming soon</p>
            </button>
          </div>
        </div>

        {/* Popular Toggle */}
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] p-3">
          <input type="checkbox" checked={isTrending} onChange={(e) => setIsTrending(e.target.checked)} className="accent-[#E8546B] h-5 w-5" />
          <div>
            <p className="text-sm font-bold text-[#2B1A24]">Show in Popular Section</p>
            <p className="text-[11px] text-[#6B5558]">Featured on the homepage</p>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-[#FAD4DD] bg-white py-2.5 text-sm font-semibold text-[#6B5558]">Cancel</button>
          <button onClick={handleAdd} disabled={saving} className="flex-1 rounded-lg bg-[#E8546B] py-2.5 text-sm font-bold text-white shadow-orange-glow disabled:opacity-50">{saving ? "Adding..." : "Add Product"}</button>
        </div>
      </div>
    </div>
  );
}