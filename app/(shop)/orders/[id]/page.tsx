"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrders, STATUS_ORDER, STATUS_LABELS, OrderStatus, Order } from "@/lib/OrderContext";
import { useProducts } from "@/lib/ProductsContext";
import { formatBDT } from "@/lib/data";
import { getOrder as getOrderFromFirestore } from "@/lib/firestoreOrders";
import { generateInvoice } from "@/lib/generateInvoice";
import { loadSettings, DEFAULT_SETTINGS, type StoreSettings } from "@/lib/firestoreSettings";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const orders = useOrders();
  const { products } = useProducts();

  const cachedOrder = orders.getOrder(id);
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings().then(setSettings).catch(() => {});
  }, []);

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

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      await generateInvoice(order, settings.storeName, "ratrysartistry.com", settings.logoUrl || undefined);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setDownloading(false);
    }
  };

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
  
  const payments = order.payments ?? [];
  const totalPaid = order.paidAmount ?? 0;
  const totalDue = Math.max(0, order.total - totalPaid);

  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-24 md:pb-10">
      
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.push("/orders")} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold leading-none text-[#2B1A24] md:text-xl">Order Details</h1>
            <p className="mt-0.5 text-[11px] text-[#6B5558] md:text-xs">#{order.id}</p>
          </div>
          <button onClick={handleDownloadInvoice} disabled={downloading} className="flex items-center gap-2 rounded-full bg-[#E8546B]/10 px-3 py-1.5 text-xs font-bold text-[#E8546B] hover:bg-[#E8546B]/20 transition-colors">
            {downloading ? "..." : "📄 Invoice"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-3 py-5 md:px-4 md:py-8 space-y-5 animate-fade-in">
        
        <div className="relative overflow-hidden rounded-3xl border border-[#FAD4DD] bg-white p-6 shadow-soft">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FDE8EC] rounded-bl-full -z-0" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A88F92]">Order ID</p>
              <p className="text-xl font-bold text-[#E8546B]">#{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A88F92]">Placed on</p>
              <p className="text-sm font-bold text-[#2B1A24]">{createdDate}</p>
            </div>
          </div>
          <div className="relative z-10 mt-4 flex items-center justify-between border-t border-[#FAD4DD] pt-4">
            <span className="text-sm font-medium text-[#6B5558]">{order.items.length} items</span>
            <span className="text-2xl font-bold text-[#E8546B]">{formatBDT(order.total)}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 shadow-soft">
          <h2 className="mb-6 font-serif text-lg font-bold text-[#2B1A24]">Tracking Timeline</h2>
          <div className="relative pl-2">
            {STATUS_ORDER.map((status, i) => {
              const isDone = i < currentIndex;
              const isCurrent = i === currentIndex;
              const note = order.statusNotes?.[status];
              
              return (
                <div key={status} className="relative flex gap-4 pb-8 last:pb-0 group">
                  {i < STATUS_ORDER.length - 1 && (
                    <div className={`absolute left-[15px] top-9 h-[calc(100%-20px)] w-1 rounded-full ${isDone ? "bg-gradient-to-b from-[#E8546B] to-[#FF8B9A]" : "bg-[#FAD4DD]"}`} />
                  )}
                  
                  <div className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    isDone ? "border-[#E8546B] bg-[#E8546B] text-white shadow-sm" :
                    isCurrent ? "border-[#E8546B] bg-white text-[#E8546B] scale-110 shadow-[0_0_15px_rgba(232,84,107,0.4)]" :
                    "border-[#FAD4DD] bg-white text-[#A88F92]"
                  }`}>
                    {isDone ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : isCurrent ? (
                      <span className="h-3 w-3 rounded-full bg-[#E8546B] animate-ping absolute" />
                    ) : null}
                    {isCurrent && <span className="h-3 w-3 rounded-full bg-[#E8546B] relative z-10" />}
                    {!isDone && !isCurrent && <span className="h-2 w-2 rounded-full bg-[#FAD4DD]" />}
                  </div>

                  <div className="flex-1 pt-1">
                    <p className={`text-sm font-bold transition-colors ${isDone ? "text-[#2B1A24]" : isCurrent ? "text-[#E8546B] text-base" : "text-[#A88F92]"}`}>
                      {STATUS_LABELS[status as OrderStatus]}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-[#6B5558]">
                      {isDone ? "Completed" : isCurrent ? "In progress" : "Pending"}
                    </p>
                    {note && (
                      <div className={`mt-2 rounded-xl border px-3 py-2 text-[11px] font-medium ${
                        isCurrent ? "border-[#E8546B]/30 bg-[#FFF6F6] text-[#E8546B]" : "border-[#FAD4DD] bg-white text-[#6B5558]"
                      }`}>
                        💬 {note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 flex items-start gap-3 shadow-sm">
          <div className="text-lg">⚠️</div>
          <div>
            <p className="text-sm font-bold text-orange-700">Shipping Charge Notice</p>
            <p className="text-xs text-orange-600 mt-1">Shipping charges will be calculated and added to your total after the product is shipped. You can track updates on this page.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 shadow-soft">
          <h2 className="mb-5 font-serif text-lg font-bold text-[#2B1A24]">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item, i) => {
              const product = products.find((p) => p.id === item.productId);
              const title = item.title ?? product?.title ?? "Product";
              const image = item.image ?? product?.image ?? "";
              return (
                <div key={i} className="flex items-center gap-4 border-b border-[#FAD4DD] pb-4 last:border-0 last:pb-0">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] p-1">
                    {image ? (
                      <button onClick={() => setFullscreenImage(image)} className="flex h-full w-full items-center justify-center">
                        <img src={image} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                      </button>
                    ) : (<span className="text-xl">🎁</span>)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#2B1A24]">{title}</p>
                    <p className="mt-1 inline-flex items-center rounded bg-[#FFF6F6] px-2 py-0.5 text-[10px] font-bold text-[#6B5558]">Qty {item.quantity} {item.variant ? `· ${item.variant}` : ""}</p>
                  </div>
                  <span className="text-sm font-bold text-[#E8546B]">{formatBDT(item.price * item.quantity)}</span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-5 space-y-2 rounded-2xl bg-[#FFF6F6] p-4 text-sm">
            <div className="flex justify-between text-[#6B5558]"><span>Subtotal</span><span className="font-medium text-[#2B1A24]">{formatBDT(order.subtotal)}</span></div>
            <div className="flex justify-between text-[#6B5558]"><span>Shipping</span><span className="font-medium text-[#2B1A24]">{formatBDT(order.shipping)}</span></div>
            <div className="mt-2 flex justify-between border-t border-[#FAD4DD] pt-3">
              <span className="font-bold text-[#2B1A24]">Total Payable</span>
              <span className="text-lg font-bold text-[#E8546B]">{formatBDT(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 shadow-soft">
          <h2 className="mb-4 font-serif text-lg font-bold text-[#2B1A24]">Payment History</h2>
          {payments.length === 0 ? (
            <p className="text-sm font-medium text-[#6B5558]">No payments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8546B] text-[11px] font-bold text-white shadow-sm">{idx + 1}</span>
                    <div>
                      <p className="text-sm font-bold text-[#2B1A24]">{formatBDT(p.amount)}</p>
                      <p className="text-[11px] font-medium text-[#6B5558]">{new Date(p.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {p.note && <span className="text-[10px] font-medium text-[#A88F92]">{p.note}</span>}
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 space-y-2 border-t border-[#FAD4DD] pt-4 text-sm">
            <div className="flex justify-between text-[#6B5558]"><span>Total Paid</span><span className="font-bold text-green-600">{formatBDT(totalPaid)}</span></div>
            {totalDue > 0 && <div className="flex justify-between text-[#6B5558]"><span>Remaining Due</span><span className="font-bold text-[#E8546B]">{formatBDT(totalDue)}</span></div>}
          </div>
        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#FAD4DD] bg-white p-3 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden">
        <div className="flex gap-2">
          <button onClick={handleDownloadInvoice} disabled={downloading} className="flex h-12 w-1/3 items-center justify-center gap-2 rounded-xl border-2 border-[#FAD4DD] bg-white text-sm font-bold text-[#2B1A24]">
            📄 Invoice
          </button>
          <button onClick={() => router.push("/orders")} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] text-sm font-bold text-white shadow-md active:scale-[0.98]">
            Back to Orders
          </button>
        </div>
      </div>

      {fullscreenImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setFullscreenImage(null)}>
          <button className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <img src={fullscreenImage} alt="" className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}