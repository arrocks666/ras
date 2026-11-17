"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getUserOrders } from "@/lib/firestoreOrders";
import { formatBDT } from "@/lib/data";

type ListedOrder = {
  id: string;
  total: number;
  status: string;
  createdAt: number;
  paidAmount?: number;
  address?: { name?: string; phone?: string; district?: string };
  items?: { title?: string; image?: string; quantity: number; price: number }[];
};

const STATUS_LABELS: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Payment Confirmed",
  processing: "Processing in China",
  shipped: "Shipped to Bangladesh",
  arrived: "Arrived in Bangladesh",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
};

const STATUS_COLORS: Record<string, string> = {
  placed: "bg-orange-50 text-orange-600 border-orange-200",
  confirmed: "bg-blue-50 text-blue-600 border-blue-200",
  processing: "bg-blue-50 text-blue-600 border-blue-200",
  shipped: "bg-purple-50 text-purple-600 border-purple-200",
  arrived: "bg-purple-50 text-purple-600 border-purple-200",
  "out-for-delivery": "bg-indigo-50 text-indigo-600 border-indigo-200",
  delivered: "bg-green-50 text-green-600 border-green-200",
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<ListedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getUserOrders(user.uid)
      .then((list) => {
        if (!cancelled) setOrders(list as unknown as ListedOrder[]);
      })
      .catch((err) => {
        console.error("Failed to load orders:", err);
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-28 md:pb-12">
      <div className="border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] transition-colors hover:bg-[#FAD4DD]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="font-serif text-lg font-bold leading-none text-[#2B1A24] md:text-2xl">My Orders</h1>
            <p className="mt-1 text-[11px] text-[#6B5558] md:text-xs">
              {loading ? "Loading…" : `${orders.length} ${orders.length === 1 ? "order" : "orders"}`}
            </p>
          </div>
          <Link
            href="/tracking"
            className="rounded-full bg-[#E8546B]/10 px-3 py-1.5 text-[11px] font-bold text-[#E8546B] transition-colors hover:bg-[#E8546B]/20"
          >
            🔍 Track
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-5 md:py-8">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl border border-[#FAD4DD] bg-white/70" />
            ))}
          </div>
        ) : !user ? (
          <div className="rounded-3xl border border-[#FAD4DD] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF6F6] text-4xl">🔐</div>
            <h2 className="text-lg font-bold text-[#2B1A24]">Login to see your orders</h2>
            <p className="mx-auto mt-2 max-w-xs text-xs text-[#6B5558]">
              Your order history, tracking and invoices live in your account.
            </p>
            <div className="mx-auto mt-6 grid max-w-xs grid-cols-2 gap-3">
              <Link href="/login" className="rounded-xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] py-3 text-center text-sm font-bold text-white shadow-md">
                Login
              </Link>
              <Link href="/signup" className="rounded-xl border-2 border-[#E8546B] bg-white py-3 text-center text-sm font-bold text-[#E8546B]">
                Sign Up
              </Link>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-[#FAD4DD] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF6F6] text-4xl">📦</div>
            <h2 className="text-lg font-bold text-[#2B1A24]">No orders yet</h2>
            <p className="mx-auto mt-2 max-w-xs text-xs text-[#6B5558]">
              When you place your first order it will appear here with live tracking.
            </p>
            <Link href="/search" className="mt-6 inline-block rounded-full bg-[#E8546B] px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b02a58]">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const paid = order.paidAmount ?? 0;
              const due = Math.max(0, (order.total ?? 0) - paid);
              const items = order.items ?? [];
              const first = items[0];
              const date = new Date(order.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group block overflow-hidden rounded-3xl border border-[#FAD4DD] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#E8546B]/50 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-[#FAD4DD]/70 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#E8546B]">#{order.id}</p>
                      <p className="mt-0.5 text-[10px] text-[#A88F92]">{date}</p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${STATUS_COLORS[order.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] p-1">
                      {first?.image ? (
                        <img src={first.image} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                      ) : (
                        <span className="text-xl">🎁</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-semibold text-[#2B1A24]">
                        {first?.title ?? "Order items"}
                      </p>
                      <p className="mt-1 text-[10px] text-[#6B5558]">
                        {items.length} {items.length === 1 ? "item" : "items"}
                        {order.address?.district ? ` · ${order.address.district}` : ""}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-[#E8546B]">{formatBDT(order.total ?? 0)}</p>
                      <p className={`mt-0.5 text-[10px] font-bold ${due > 0 ? "text-orange-600" : "text-green-600"}`}>
                        {due > 0 ? `Due ${formatBDT(due)}` : "Paid"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end border-t border-[#FAD4DD]/70 px-4 py-2">
                    <span className="text-[11px] font-bold text-[#E8546B]">View details →</span>
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
