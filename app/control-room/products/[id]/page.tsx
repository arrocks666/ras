"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CATEGORIES } from "@/lib/categories";

export default function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [priceStr, setPriceStr] = useState<string>("0"); // ✅ Store as string
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");

  const currentCategory = CATEGORIES.find(c => c.id === categoryId);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "products", id));
        if (snap.exists()) {
          const data = snap.data();
          setProduct({ id: snap.id, ...data });
          setPriceStr(String(data.price || 0));
          setTitle(data.title || "");
          setCategoryId(data.categoryId || "");
          setSubcategoryId((data as any).subcategoryId || "");
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const subName = currentCategory?.subcategories.find(s => s.slug === subcategoryId)?.name;
      const finalPrice = Number(priceStr) || 0;
      
      await updateDoc(doc(db, "products", id), {
        title,
        price: finalPrice,
        categoryId,
        subcategoryId,
        subcategory: subName,
      });
      
      router.push("/control-room/products");
    } catch (err) {
      console.error(err);
      alert("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading product...</div>;
  if (!product) return <div className="p-8 text-center text-red-500">Product not found</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Link href="/control-room/products" className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#E8546B]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        Back to Products
      </Link>

      <h1 className="font-serif text-2xl font-bold text-[#2B1A24] mb-6">Edit Product</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-[#FAD4DD] p-4 shadow-sm">
            <img src={product.image} alt={product.title} className="w-full aspect-square object-contain rounded-lg bg-[#FFF6F6]" />
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#FAD4DD] p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Product Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Selling Price (৳)</label>
              <input
                type="number"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)} // ✅ Allows deleting perfectly
                className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5 text-sm font-bold text-[#E8546B] focus:border-[#E8546B] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(CATEGORIES.find(c=>c.id===e.target.value)?.subcategories[0]?.slug || ""); }}
                  className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Subcategory</label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  disabled={!categoryId}
                  className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select Subcategory</option>
                  {currentCategory?.subcategories.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => router.push("/control-room/products")} className="px-6 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-[#E8546B] text-sm font-bold text-white shadow-md hover:bg-[#d1475e] disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}