"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrders, STATUS_ORDER, STATUS_LABELS, OrderStatus, Order } from "@/lib/OrderContext";
import { useProducts } from "@/lib/ProductsContext";
import { formatBDT } from "@/lib/data";
import { getOrder as getOrderFromFirestore } from "@/lib/firestoreOrders";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const orders = useOrders();
  const { products } = useProducts();

  const cachedOrder = orders.getOrder(id);
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    getOrderFromFirestore(id)
      .then((o) => {
        if (!cancelled && o) setFetchedOrder(o as Order);
      })
      .catch((err) => {
        console.error("Failed to fetch order:", err);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const order = fetchedOrder ?? cachedOrder;

  if (fetching && !order) {
    return (
      <div className="min-h-screen bg-[#FFF6F6] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FFF6F6]">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <div className="text-6xl opacity-40">📦</div>
          <h1 className="mt-4 text-xl font-bold text-[#2B1A24]">Order not found</h1>
          <Link href="/orders" className="mt-5 inline-block rounded-full bg-[#E8546B] px-6 py-2.5 text-xs font-semibold text-white shadow-orange-glow">View My Orders</Link>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const createdDate = new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  
  const charges = order.charges ?? {};
  const chargeRows = [
    { key: "chinaLocalCourier", label: "China Local Courier", show: charges.showChinaLocalCourier === true, value: charges.chinaLocalCourier ?? null },
    { key: "shippingCharge", label: "Shipping Charge (China → Bangladesh)", show: charges.showShippingCharge === true, value: charges.shippingCharge ?? null },
    { key: "bdCourier", label: "Bangladesh Courier Charge", show: charges.showBdCourier === true, value: charges.bdCourier ?? null },
  ];

  const payments = order.payments ?? [];
  const totalPaid = order.paidAmount ?? 0;
  const totalDue = Math.max(0, order.total - totalPaid);

  return (
    <div className="min-h-screen bg-[#FFF6F6]">
      
      {/* Header */}
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.push("/orders")} className="flex h-8 w-8 items-center justify-center text-[#2B1A24] hover:text-[#E8546B]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold leading-none text-[#2B1A24] md:text-xl">Track Order</h1>
            <p className="mt-0.5 text-[11px] text-[#6B5558] md:text-xs">Order #{order.id}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-3 py-4 md:px-4 md:py-6 space-y-4">
        
        {/* Order Summary Card */}
        <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-[#6B5558]">Order ID</p>
              <p className="text-lg font-bold text-[#E8546B]">#{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[#6B5558]">Placed on</p>
              <p className="text-sm font-medium text-[#2B1A24]">{createdDate}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#FAD4DD] pt-3">
            <span className="text-xs text-[#6B5558]">{order.items.length} items</span>
            <span className="text-lg font-bold text-[#E8546B]">{formatBDT(order.total)}</span>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
          <h2 className="mb-6 text-lg font-bold text-[#2B1A24]">Tracking Timeline</h2>
          <div className="relative">
            {STATUS_ORDER.map((status, i) => {
              const isDone = i < currentIndex;
              const isCurrent = i === currentIndex;
              const note = order.statusNotes?.[status];
              return (
                <div key={status} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < STATUS_ORDER.length - 1 && (
                    <div className={`absolute left-[15px] top-8 h-full w-0.5 ${isDone ? "bg-[#E8546B]" : "bg-[#FAD4DD]"}`} />
                  )}
                  <div className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                    isDone ? "border-[#E8546B] bg-[#E8546B] text-white" :
                    isCurrent ? "border-[#E8546B] bg-white text-[#E8546B] shadow-orange-glow" :
                    "border-[#FAD4DD] bg-white text-[#A88F92]"
                  }`}>
                    {isDone ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : isCurrent ? (<span className="h-2.5 w-2.5 rounded-full bg-[#E8546B]" />) : (<span className="h-2 w-2 rounded-full bg-[#FAD4DD]" />)}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`text-sm font-semibold md:text-base ${isDone ? "text-[#E8546B]" : isCurrent ? "text-[#E8546B]" : "text-[#A88F92]"}`}>
                      {STATUS_LABELS[status as OrderStatus]}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#6B5558]">
                      {isDone ? "Completed" : isCurrent ? "In progress" : "Pending"}
                    </p>
                    {note && (
                      <div className="mt-2 rounded-lg border border-[#E8546B]/30 bg-[#FFF6F6] px-3 py-2 text-[11px] text-[#6B5558]">
                        💬 {note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items */}
        <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#2B1A24]">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item, i) => {
              const product = products.find((p) => p.id === item.productId);
              const title = item.title ?? product?.title ?? "Product";
              const image = item.image ?? product?.image ?? "";
              return (
                <div key={i} className="flex items-center gap-4 border-b border-[#FAD4DD] pb-4 last:border-0 last:pb-0">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#FAD4DD] bg-white p-1">
                    {image ? (
                      <button onClick={() => setFullscreenImage(image)} className="flex h-full w-full items-center justify-center">
                        <img src={image} alt="" className="max-h-full max-w-full object-contain" />
                      </button>
                    ) : (<span className="text-xl">🎁</span>)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#2B1A24]">{title}</p>
                    <p className="mt-0.5 text-[11px] text-[#6B5558]">Qty {item.quantity} {item.variant ? `· ${item.variant}` : ""}</p>
                  </div>
                  <span className="text-sm font-bold text-[#E8546B]">{formatBDT(item.price * item.quantity)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 border-t border-[#FAD4DD] pt-4 text-sm">
            <div className="flex justify-between text-[#6B5558]"><span>Subtotal</span><span>{formatBDT(order.subtotal)}</span></div>
            <div className="flex justify-between text-[#6B5558]"><span>Shipping</span><span>{formatBDT(order.shipping)}</span></div>
            <div className="mt-2 flex justify-between border-t border-[#FAD4DD] pt-2">
              <span className="font-bold text-[#2B1A24]">Total</span>
              <span className="text-lg font-bold text-[#E8546B]">{formatBDT(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#2B1A24]">Payment History</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-[#6B5558]">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8546B]/10 text-[11px] font-bold text-[#E8546B]">{idx + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-[#2B1A24]">{formatBDT(p.amount)}</p>
                      <p className="text-[11px] text-[#6B5558]">{new Date(p.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 border-t border-[#FAD4DD] pt-3 text-sm">
            <div className="flex justify-between text-[#6B5558]"><span>Total Paid</span><span className="font-bold text-[#2B1A24]">{formatBDT(totalPaid)}</span></div>
            {totalDue > 0 && <div className="flex justify-between text-[#6B5558]"><span>Remaining Due</span><span className="font-bold text-[#E8546B]">{formatBDT(totalDue)}</span></div>}
          </div>
        </div>

      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" onClick={() => setFullscreenImage(null)}>
          <button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <img src={fullscreenImage} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}