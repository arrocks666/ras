"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatBDT } from "@/lib/data";

export default function TrackingPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);
    setLoading(true);

    try {
      const snap = await getDoc(doc(db, "orders", orderId.trim()));
      if (!snap.exists()) {
        setError("Order not found. Please check your Order ID.");
        return;
      }
      setOrder({ id: snap.id, ...snap.data() });
    } catch (err: any) {
      setError("Failed to look up order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-24 md:pb-10">
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.push("/")} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="flex-1 text-lg font-bold text-[#2B1A24] md:text-xl">Track Order</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-12">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm"><span className="text-3xl">🚚</span></div>
          <h2 className="font-serif text-2xl font-bold text-[#2B1A24]">Where is my order?</h2>
          <p className="mt-2 text-sm text-[#6B5558]">Enter your Order ID to track its status.</p>
        </div>

        <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 md:p-8 shadow-soft">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">Order ID</label>
              <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="e.g. 123456" className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none" required />
            </div>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">{error}</div>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] py-3.5 text-sm font-bold text-white shadow-md disabled:opacity-50">
              {loading ? "Searching..." : "Track Order"}
            </button>
          </form>

          {order && (
            <div className="mt-6 border-t border-[#FAD4DD] pt-6">
              <p className="text-xs text-[#6B5558]">Order #{order.id}</p>
              <p className="text-lg font-bold text-[#E8546B] mt-1">{formatBDT(order.total)}</p>
              <p className="text-sm font-bold text-[#2B1A24] mt-2">Status: <span className="text-[#E8546B] uppercase">{order.status}</span></p>
              <button onClick={() => router.push(`/orders/${order.id}`)} className="mt-4 w-full rounded-xl border-2 border-[#E8546B] py-2.5 text-sm font-bold text-[#E8546B] hover:bg-[#FFF6F6]">
                View Full Details →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}