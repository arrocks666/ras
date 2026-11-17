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
import { useProducts, Product } from "@/lib/ProductsContext";
import ImageSearchModal from "@/components/ImageSearchModal";

type StatusFilter = "all" | "flash" | "trending" | "out-of-stock";

export default function AdminProductsPage() {
  const { refresh } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Product, "id">),
      }));
      setProducts(list);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryId) set.add(p.categoryId);
    });
    return Array.from(set).sort();
  }, [products]);

  const visibleProducts = useMemo(() => {
    let list = products;

    if (categoryFilter !== "all") {
      list = list.filter((p) => p.categoryId === categoryFilter);
    }

    if (statusFilter === "flash") {
      list = list.filter((p) => p.isFlashSale === true);
    } else if (statusFilter === "trending") {
      list = list.filter((p) => p.isTrending === true);
    } else if (statusFilter === "out-of-stock") {
      list = list.filter((p) => p.inStock === false);
    }

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }

    return list;
  }, [products, categoryFilter, statusFilter, searchTerm]);

  const setBusy = (id: string, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleFlag = async (
    product: Product,
    field: "isFlashSale" | "isTrending"
  ) => {
    setBusy(product.id, true);
    try {
      const newVal = !product[field];
      await updateDoc(doc(db, "products", product.id), {
        [field]: newVal,
        updatedAt: serverTimestamp(),
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, [field]: newVal } : p
        )
      );
      await refresh();
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Failed to update product");
    } finally {
      setBusy(product.id, false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (
      !confirm(
        `Delete "${product.title}"?\n\nThis cannot be undone. The product will be removed from the site.`
      )
    ) {
      return;
    }
    setBusy(product.id, true);
    try {
      await deleteDoc(doc(db, "products", product.id));
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      await refresh();
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Failed to delete product");
    } finally {
      setBusy(product.id, false);
    }
  };

  const flashCount = products.filter((p) => p.isFlashSale).length;
  const trendingCount = products.filter((p) => p.isTrending).length;
  const outOfStockCount = products.filter((p) => p.inStock === false).length;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-[#E8546B]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" />
            Products
          </div>
          <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">
            Manage Products
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Control what's on your homepage. Toggle Flash Sale and Trending.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="rounded-lg border-2 border-[#E8546B] bg-white px-4 py-2.5 text-sm font-semibold text-[#E8546B] transition hover:bg-[#FFF6F6]"
          >
            📸 Image Search
          </button>

          <Link
            href="/control-room/products/import"
            className="rounded-lg bg-[#E8546B] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#d1475e]"
          >
            📥 Import 1688
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total" value={products.length} icon="📦" />
        <StatCard label="Flash Sale" value={flashCount} icon="⚡" />
        <StatCard label="Trending" value={trendingCount} icon="🔥" />
        <StatCard label="Out of Stock" value={outOfStockCount} icon="🚫" />
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product title..."
            className="w-full rounded-lg border border-[#FAD4DD] bg-white py-2.5 pl-10 pr-3 text-sm text-[#2B1A24] placeholder:text-gray-400 focus:border-[#E8546B] focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-[#FAD4DD] bg-white px-3 py-2.5 text-sm text-[#2B1A24] focus:border-[#E8546B] focus:outline-none md:w-56"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        <StatusTab label="All" count={products.length} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
        <StatusTab label="Flash Sale" count={flashCount} active={statusFilter === "flash"} onClick={() => setStatusFilter("flash")} />
        <StatusTab label="Trending" count={trendingCount} active={statusFilter === "trending"} onClick={() => setStatusFilter("trending")} />
        <StatusTab label="Out of Stock" count={outOfStockCount} active={statusFilter === "out-of-stock"} onClick={() => setStatusFilter("out-of-stock")} />
      </div>

      <p className="mt-3 text-xs text-gray-500">
        <span className="font-bold text-[#2B1A24]">
          {visibleProducts.length}
        </span>{" "}
        {visibleProducts.length === 1 ? "product" : "products"} shown
      </p>

      <div className="mt-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" />
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="rounded-lg border border-[#FAD4DD] bg-white p-10 text-center shadow-sm">
            <div className="text-5xl opacity-40">📭</div>
            <h3 className="mt-3 font-serif text-base font-bold text-[#2B1A24] md:text-lg">
              No products found
            </h3>
            <p className="mt-1 text-xs text-gray-500 md:text-sm">
              {searchTerm
                ? `Nothing matches "${searchTerm}"`
                : "Adjust filters or add a new product."}
            </p>
          </div>
        ) : (
          visibleProducts.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              busy={busyIds.has(product.id)}
              onToggleFlash={() => toggleFlag(product, "isFlashSale")}
              onToggleTrending={() => toggleFlag(product, "isTrending")}
              onDelete={() => handleDelete(product)}
            />
          ))
        )}
      </div>

      <ImageSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => { setIsSearchOpen(false); fetchProducts(); }} 
      />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#FAD4DD] bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF6F6] text-lg">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-[#2B1A24]">{value}</p>
        <p className="text-[11px] text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function StatusTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-[#E8546B] bg-[#E8546B] text-white"
          : "border-[#FAD4DD] bg-white text-gray-600 hover:border-[#E8546B] hover:text-[#E8546B]"
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-[#FFF6F6] text-gray-500"}`}>
        {count}
      </span>
    </button>
  );
}

function ProductRow({ product, busy, onToggleFlash, onToggleTrending, onDelete }: { product: Product; busy: boolean; onToggleFlash: () => void; onToggleTrending: () => void; onDelete: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = product.image && !imgFailed;

  return (
    <div className={`rounded-lg border border-[#FAD4DD] bg-white p-3 shadow-sm transition md:p-4 ${busy ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/control-room/products/${product.id}`} className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#FAD4DD] bg-[#FFF6F6]">
          {showImage ? (
            <img src={product.image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-contain p-1" onError={() => setImgFailed(true)} />
          ) : (
            <span className="text-2xl">📦</span>
          )}
        </Link>

        <div className="min-w-0 flex-1 pr-4">
          <Link href={`/control-room/products/${product.id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold text-[#2B1A24] transition hover:text-[#E8546B] md:text-base">
              {product.title}
            </h3>
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 md:text-xs">
            {/* ✅ Just the price, no editing here */}
            <span className="font-bold text-[#E8546B]">{formatBDT(product.price)}</span>
            
            {product.categoryId && (
              <span className="rounded bg-[#FFF6F6] px-1.5 py-0.5">{product.categoryId}</span>
            )}
            <span>{(product.views ?? 0)} views</span>
            {product.inStock === false && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-600">Out of stock</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 md:flex-shrink-0">
          <button onClick={onToggleFlash} disabled={busy} className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${product.isFlashSale ? "border-[#E8546B] bg-[#E8546B] text-white" : "border-[#FAD4DD] bg-white text-gray-600 hover:border-[#E8546B] hover:text-[#E8546B]"} disabled:opacity-40`} title="Toggle Flash Sale">
            ⚡ Flash
          </button>
          <button onClick={onToggleTrending} disabled={busy} className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${product.isTrending ? "border-[#E8546B] bg-[#E8546B] text-white" : "border-[#FAD4DD] bg-white text-gray-600 hover:border-[#E8546B] hover:text-[#E8546B]"} disabled:opacity-40`} title="Toggle Trending">
            🔥 Trending
          </button>
          <button onClick={onDelete} disabled={busy} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FAD4DD] text-gray-500 transition hover:border-red-500 hover:bg-red-50 hover:text-red-500 disabled:opacity-40" title="Delete product">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}