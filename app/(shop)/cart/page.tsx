"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatBDT } from "@/lib/data";
import { useProducts } from "@/lib/ProductsContext";
import { useCart } from "@/lib/CartContext";

export default function CartPage() {
  const router = useRouter();
  const cart = useCart();
  const { products } = useProducts();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [editingQty, setEditingQty] = useState<Record<string, string>>({});

  const cartRows = useMemo(() => {
    return cart.items
      .map((item) => {
        // If it's a live product, use the snapshot
        if (item.isLive && item.liveSnapshot) {
          return {
            key: `${item.productId}-${item.colorId}-${item.size || ""}`,
            productId: item.productId,
            title: item.liveSnapshot.title,
            image: item.liveSnapshot.image,
            price: item.liveSnapshot.price,
            colorId: item.colorId,
            colorLabel: item.colorLabel,
            size: item.size,
            quantity: item.quantity,
            lineTotal: item.liveSnapshot.price * item.quantity,
            href: `/live-product/${item.productId}`,
            isLive: true,
          };
        }
        
        // Otherwise, find it in the normal products database
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        
        return {
          key: `${item.productId}-${item.colorId}-${item.size || ""}`,
          productId: product.id,
          title: product.title,
          image: product.image,
          price: product.price,
          colorId: item.colorId,
          colorLabel: item.colorLabel,
          size: item.size,
          quantity: item.quantity,
          lineTotal: product.price * item.quantity,
          href: `/product/${product.id}`,
          isLive: false,
        };
      })
      .filter(Boolean) as Array<{
      key: string; productId: string; title: string; image: string;
      price: number; colorId: string; colorLabel?: string; size?: string; quantity: number;
      lineTotal: number; href: string; isLive: boolean;
    }>;
  }, [cart.items, products]);

  const isSelected = (key: string) => selected[key] !== false;
  const toggleSelected = (key: string) => setSelected((prev) => ({ ...prev, [key]: !isSelected(key) }));
  const allSelected = cartRows.every((r) => isSelected(r.key));
  const toggleAll = () => {
    const next = !allSelected;
    const map: Record<string, boolean> = {};
    cartRows.forEach((r) => (map[r.key] = next));
    setSelected(map);
  };

  const selectedRows = cartRows.filter((r) => isSelected(r.key));
  const subtotal = selectedRows.reduce((sum, r) => sum + r.lineTotal, 0);

  const handleCheckout = () => {
    const keys = selectedRows.map((r) => r.key).join(",");
    router.push(`/checkout?items=${encodeURIComponent(keys)}`);
  };

  const commitQty = (row: (typeof cartRows)[0]) => {
    const raw = editingQty[row.key];
    if (raw === undefined) return;
    const parsed = parseInt(raw, 10);
    const finalQty = !parsed || parsed < 1 ? 1 : parsed;
    cart.updateQty(row.productId, row.colorId, row.size, finalQty);
    setEditingQty((prev) => {
      const next = { ...prev };
      delete next[row.key];
      return next;
    });
  };

  if (cartRows.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF6F6] flex flex-col">
        <CartTopBar count={0} />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pb-20">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm mb-6">
            <span className="text-4xl opacity-50">🛒</span>
          </div>
          <h3 className="text-xl font-bold text-[#2B1A24]">Your cart is empty</h3>
          <p className="mt-2 max-w-xs text-sm text-[#6B5558]">Add products to your cart to see them here.</p>
          <button onClick={() => router.push("/")} className="mt-6 rounded-full bg-[#E8546B] px-8 py-3 text-sm font-bold text-white shadow-orange-glow transition hover:bg-[#b02a58]">
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-48">
      <CartTopBar count={cartRows.length} onClear={() => cart.clear()} />

      {/* Select All Bar */}
      <div className="sticky top-[56px] z-30 border-b border-[#FAD4DD] bg-white px-4 py-3 shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3">
          <button onClick={toggleAll} className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition ${allSelected ? "border-[#E8546B] bg-[#E8546B]" : "border-[#FAD4DD] bg-white"}`}>
            {allSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
          </button>
          <span className="text-sm font-semibold text-[#2B1A24]">Select All</span>
          <span className="ml-auto text-xs text-[#6B5558]">{selectedRows.length} of {cartRows.length} selected</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-3 py-4 md:px-4">
        <div className="space-y-3">
          {cartRows.map((row) => {
            const isEditing = editingQty[row.key] !== undefined;
            const inputValue = isEditing ? editingQty[row.key] : String(row.quantity);

            return (
              <div key={row.key} className="rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <button onClick={() => toggleSelected(row.key)} className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition ${isSelected(row.key) ? "border-[#E8546B] bg-[#E8546B]" : "border-[#FAD4DD] bg-white"}`}>
                    {isSelected(row.key) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </button>

                  <Link href={row.href} className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] p-1">
                    <CartImage src={row.image} />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link href={row.href}>
                      <h3 className="text-sm font-semibold leading-tight text-[#2B1A24] line-clamp-2 md:text-base">{row.title}</h3>
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {row.colorLabel && (
                        <span className="rounded bg-[#FFF6F6] px-2 py-0.5 text-[10px] font-medium text-[#6B5558]">
                          Color: {row.colorLabel}
                        </span>
                      )}
                      {row.size && (
                        <span className="rounded bg-[#FFF6F6] px-2 py-0.5 text-[10px] font-medium text-[#6B5558]">
                          Size: {row.size}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-base font-bold text-[#E8546B] md:text-lg">{formatBDT(row.price)}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#FAD4DD] pt-3">
                  <div className="inline-flex items-center overflow-hidden rounded-lg border border-[#FAD4DD] bg-white">
                    <button onClick={() => cart.updateQty(row.productId, row.colorId, row.size, row.quantity - 1)} className="flex h-8 w-8 items-center justify-center text-[#6B5558] transition hover:bg-[#FFF6F6] hover:text-[#E8546B]">
                      −
                    </button>
                    <input
                      type="number" inputMode="numeric" min={1} value={inputValue}
                      onChange={(e) => setEditingQty((prev) => ({ ...prev, [row.key]: e.target.value }))}
                      onBlur={() => commitQty(row)}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      onFocus={(e) => e.target.select()}
                      className="w-10 border-0 bg-transparent text-center text-sm font-bold text-[#2B1A24] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button onClick={() => cart.updateQty(row.productId, row.colorId, row.size, row.quantity + 1)} className="flex h-8 w-8 items-center justify-center text-[#6B5558] transition hover:bg-[#FFF6F6] hover:text-[#E8546B]">
                      +
                    </button>
                  </div>

                  <button aria-label="Remove" onClick={() => cart.remove(row.productId, row.colorId, row.size)} className="flex items-center gap-1 text-xs font-medium text-[#A88F92] transition hover:text-[#E8546B]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#FAD4DD] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-[1400px] px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex justify-between md:flex-col md:justify-start">
              <span className="text-sm text-[#6B5558] md:text-xs">Total ({selectedRows.length} items)</span>
              <span className="text-xl font-bold text-[#E8546B] md:text-2xl">{formatBDT(subtotal)}</span>
            </div>
            <button onClick={handleCheckout} disabled={selectedRows.length === 0} className="w-full rounded-xl bg-[#E8546B] py-3.5 text-sm font-bold text-white shadow-orange-glow transition hover:bg-[#b02a58] disabled:cursor-not-allowed disabled:opacity-40 md:w-auto md:px-12">
              Checkout ({selectedRows.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="text-3xl">🎁</span>;
  return <img src={src} alt="" referrerPolicy="no-referrer" className="h-full w-full object-contain mix-blend-multiply" onError={() => setFailed(true)} />;
}

function CartTopBar({ count, onClear }: { count: number; onClear?: () => void }) {
  return (
    <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white shadow-sm md:top-[60px]">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
        <Link href="/" aria-label="Back" className="flex h-8 w-8 items-center justify-center text-[#2B1A24] transition hover:text-[#E8546B]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-none text-[#2B1A24] md:text-xl">My Cart</h1>
          <p className="mt-0.5 text-[11px] text-[#6B5558] md:text-xs">{count} {count === 1 ? "Item" : "Items"}</p>
        </div>
        {count > 0 && onClear && (
          <button onClick={onClear} className="text-xs font-semibold text-[#A88F92] hover:text-[#E8546B]">Clear All</button>
        )}
      </div>
    </div>
  );
}