"use client";

import { useState, useEffect, useMemo } from "react";
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [recalculating, setRecalculating] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState<string>("");

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
      console.error("Toggle trending failed:", err);
      alert("Failed to update: " + (err?.message || "Unknown error"));
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
      console.error("Delete failed:", err);
      alert("Failed to delete: " + (err?.message || "Unknown error"));
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
      console.error("[Price edit] Failed:", err);
      alert(
        "Failed to update price:\n\n" +
          (err?.message || "Unknown error") +
          "\n\nCheck your Firestore rules allow write access."
      );
    } finally {
      setBusy(editProduct.id, false);
    }
  };

  const recalculateAllPrices = async () => {
    if (
      !confirm(
        "Recalculate ALL product prices using current markup tiers?\n\nThis will OVERWRITE existing prices on all products with a CNY price."
      )
    )
      return;
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
        const newPriceVal = Math.max(
          20,
          Math.round((costBdt * multiplier) / 10) * 10
        );

        await updateDoc(doc(db, "products", p.id), {
          price: newPriceVal,
          oldPrice: Math.round(newPriceVal * 1.25),
          updatedAt: serverTimestamp(),
        });
        updated.push({
          ...p,
          price: newPriceVal,
          oldPrice: Math.round(newPriceVal * 1.25),
        });
        count++;
      }

      setProducts(updated);
      alert(
        `✓ Recalculated ${count} prices${
          skipped > 0 ? `\n(${skipped} skipped — no CNY price)` : ""
        }`
      );
    } catch (err: any) {
      console.error("Recalculate failed:", err);
      alert("Failed to recalculate: " + (err?.message || "Unknown error"));
    } finally {
      setRecalculating(false);
    }
  };

  const visibleProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, searchTerm]);

  const trendingCount = products.filter((p) => p.isTrending).length;

  return (
    <div className="min-h-screen bg-[#FFF6F6] p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-white px-3 py-1 text-[10px] font-bold uppercase text-[#E8546B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" />{" "}
              Products
            </div>
            <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">
              Manage Products
            </h1>
            <p className="mt-1 text-sm text-[#6B5558]">
              {products.length} products · {trendingCount} popular
            </p>
          </div>
          <Link
            href="/admin-panel/products/new"
            className="rounded-xl bg-[#E8546B] px-5 py-2.5 text-sm font-bold text-white shadow-orange-glow hover:bg-[#b02a58]"
          >
            + Sourcing (Apify)
          </Link>
        </div>

        {/* Bulk Recalculate */}
        <div className="mb-4 rounded-2xl border border-[#E8546B]/30 bg-[#FDE8EC] p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#2B1A24]">
              Bulk Price Recalculation
            </p>
            <p className="text-xs text-[#6B5558]">
              Apply current markup tiers (CNY→USD→BDT) to all existing products
            </p>
          </div>
          <button
            onClick={recalculateAllPrices}
            disabled={recalculating}
            className="rounded-lg bg-[#E8546B] px-4 py-2 text-xs font-bold text-white hover:bg-[#b02a58] disabled:opacity-50"
          >
            {recalculating ? "Recalculating..." : "🔄 Recalculate All Prices"}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by title..."
            className="w-full rounded-lg border border-[#FAD4DD] bg-white py-2.5 pl-10 pr-3 text-sm focus:border-[#E8546B] focus:outline-none"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A88F92]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
        </div>

        {/* Product List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" />
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="rounded-lg border border-[#FAD4DD] bg-white p-10 text-center">
              <p className="text-[#6B5558]">
                {searchTerm
                  ? `No products match "${searchTerm}"`
                  : "No products yet. Use 'Sourcing (Apify)' to add products."}
              </p>
            </div>
          ) : (
            visibleProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-lg border border-[#FAD4DD] bg-white p-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#FAD4DD] bg-[#FFF6F6]">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt=""
                        className="h-full w-full object-contain mix-blend-multiply"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-2xl">🎁</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-semibold text-[#2B1A24]">
                      {product.title}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-[#E8546B]">
                      {formatBDT(product.price)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => handleEditPrice(product)}
                      disabled={busyIds.has(product.id)}
                      className="rounded-full border border-[#FAD4DD] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B5558] hover:border-[#E8546B] hover:text-[#E8546B] disabled:opacity-40"
                    >
                      💰 Price
                    </button>
                    <button
                      onClick={() => toggleTrending(product)}
                      disabled={busyIds.has(product.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${
                        product.isTrending
                          ? "border-[#E8546B] bg-[#E8546B] text-white"
                          : "border-[#FAD4DD] bg-white text-[#6B5558] hover:border-[#E8546B]"
                      }`}
                    >
                      ⭐ Popular
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={busyIds.has(product.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FAD4DD] text-[#A88F92] hover:border-red-300 hover:text-red-500 disabled:opacity-40"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Price Modal */}
      {editProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditProduct(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-[#2B1A24] mb-2">Edit Price</h2>
            <p className="text-xs text-[#6B5558] mb-4 line-clamp-2">
              {editProduct.title}
            </p>

            <label className="block text-xs font-bold text-[#6B5558] mb-1">
              New Price (৳)
            </label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              min={1}
              autoFocus
              className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-lg font-bold focus:border-[#E8546B] focus:outline-none mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setEditProduct(null)}
                className="flex-1 rounded-lg border border-[#FAD4DD] py-2.5 text-sm font-semibold text-[#6B5558]"
              >
                Cancel
              </button>
              <button
                onClick={savePrice}
                className="flex-1 rounded-lg bg-[#E8546B] py-2.5 text-sm font-bold text-white hover:bg-[#b02a58]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}