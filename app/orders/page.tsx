"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrders, STATUS_LABELS, STATUS_ORDER, OrderStatus } from "@/lib/OrderContext";
import { useProducts } from "@/lib/ProductsContext";
import { formatBDT } from "@/lib/data";

export default function OrdersPage() {
  const router = useRouter();
  const orders = useOrders();
  const { products } = useProducts();

  return (
    <div className="min-h-screen bg-[#FFF6F6]">
      
      {/* Header */}
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.push("/account")} className="flex h-8 w-8 items-center justify-center text-[#2B1A24] hover:text-[#E8546B]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold leading-none text-[#2B1A24] md:text-xl">My Orders</h1>
            <p className="mt-0.5 text-[11px] text-[#6B5558] md:text-xs">{orders.orders.length} {orders.orders.length === 1 ? "Order" : "Orders"}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-3 py-4 md:px-4 md:py-6">
        {orders.orders.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center">
            <div className="text-6xl opacity-40 mb-4">📦</div>
            <h3 className="text-lg font-bold text-[#2B1A24]">No orders yet</h3>
            <p className="mt-1 max-w-xs text-sm text-[#6B5558]">When you place an order, it will appear here.</p>
            <button onClick={() => router.push("/")} className="mt-5 rounded-full bg-[#E8546B] px-8 py-3 text-sm font-bold text-white shadow-orange-glow">
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.orders.map((order) => {
              const createdDate = new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
              const firstItem = order.items[0];
              const firstProduct = products.find((p) => p.id === firstItem?.productId);
              const currentIndex = STATUS_ORDER.indexOf(order.status);
              
              // Progress calculation (e.g., 3 out of 7)
              const progressPercent = Math.min(100, Math.max(0, (currentIndex / (STATUS_ORDER.length - 1)) * 100));

              return (
                <Link key={order.id} href={`/orders/${order.id}`} className="group block overflow-hidden rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm transition hover:border-[#E8546B]/40 hover:shadow-md">
                  
                  {/* Top Section */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#A88F92]">Order ID</p>
                      <p className="text-sm font-bold text-[#E8546B] md:text-base">#{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#A88F92]">Total</p>
                      <p className="text-sm font-bold text-[#2B1A24] md:text-base">{formatBDT(order.total)}</p>
                    </div>
                  </div>

                  {/* Product Preview */}
                  <div className="mt-3 flex items-center gap-3 border-t border-[#FAD4DD] pt-3">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] text-xl p-1">
                      {firstProduct?.image ? (
                        <img src={firstProduct.image} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                      ) : (<span>🎁</span>)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#2B1A24]">
                        {firstProduct?.title ?? firstItem?.title ?? "Product"}
                        {order.items.length > 1 && <span className="text-[#A88F92] font-normal"> + {order.items.length - 1} more</span>}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#6B5558]">{createdDate}</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#E8546B] transition group-hover:translate-x-1">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>

                  {/* Status & Progress */}
                  <div className="mt-3 border-t border-[#FAD4DD] pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8546B]/40 bg-[#FFF6F6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B] md:text-xs">
                        ● {STATUS_LABELS[order.status as OrderStatus]}
                      </span>
                      <span className="text-[11px] font-bold text-[#E8546B] md:text-xs">Track Order →</span>
                    </div>
                    
                    {/* Mini Progress Bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#FAD4DD]">
                      <div className="h-full bg-[#E8546B] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}