"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Order, STATUS_LABELS, OrderStatus } from "@/lib/OrderContext";
import {
  fetchOrdersSince,
  searchOrders,
  computeStats,
  countByStatus,
  startOfDay,
  startOfWeek,
  startOfMonth,
  formatDate,
  formatBDT,
} from "@/lib/adminOrders";

type RangeKey = "today" | "week" | "month" | "all";
type StatusFilter = OrderStatus | "all";
type PaymentFilter = "all" | "paid" | "due";

const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All (30d)",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [range, setRange] = useState<RangeKey>("today");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchOrdersSince()
      .then((list) => {
        if (!cancelled) setOrders(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rangeOrders = useMemo(() => {
    const now = new Date();
    let cutoff = 0;
    if (range === "today") cutoff = startOfDay(now);
    else if (range === "week") cutoff = startOfWeek(now);
    else if (range === "month") cutoff = startOfMonth(now);
    else cutoff = 0;

    return orders.filter((o) => o.createdAt >= cutoff);
  }, [orders, range]);

  const searchedOrders = useMemo(
    () => searchOrders(rangeOrders, searchTerm),
    [rangeOrders, searchTerm]
  );

  const visibleOrders = useMemo(() => {
    let list = searchedOrders;
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (paymentFilter === "paid") list = list.filter((o) => (o.paidAmount ?? o.total) >= o.total);
    else if (paymentFilter === "due") list = list.filter((o) => (o.paidAmount ?? o.total) < o.total);
    return list;
  }, [searchedOrders, statusFilter, paymentFilter]);

  const stats = computeStats(rangeOrders);
  const statusCounts = countByStatus(rangeOrders);
  const paidCount = rangeOrders.filter((o) => (o.paidAmount ?? o.total) >= o.total).length;
  const dueCount = rangeOrders.length - paidCount;
  const totalDue = rangeOrders.reduce((sum, o) => sum + Math.max(0, o.total - (o.paidAmount ?? o.total)), 0);

  return (
    <div className="min-h-screen bg-[#FFF6F6] p-4 md:p-8">
      <div className="mx-auto max-w-[1400px]">
        
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-[#FDE8EC] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" />
              Orders
            </div>
            <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">Manage Orders</h1>
            <p className="mt-1 text-sm text-[#6B5558]">Search, filter, and fulfill customer orders.</p>
          </div>
          <Link
            href="/control-room/orders/new"
            className="rounded-lg bg-[#E8546B] px-4 py-2.5 text-sm font-semibold text-white shadow-orange-glow transition hover:bg-[#b02a58]"
          >
            + New Order
          </Link>
        </div>

        {/* Revenue summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          <StatCard label="Today" revenue={computeStats(orders.filter((o) => o.createdAt >= startOfDay())).revenue} count={orders.filter((o) => o.createdAt >= startOfDay()).length} icon="💰" />
          <StatCard label="This Week" revenue={computeStats(orders.filter((o) => o.createdAt >= startOfWeek())).revenue} count={orders.filter((o) => o.createdAt >= startOfWeek()).length} icon="📅" />
          <StatCard label="This Month" revenue={computeStats(orders.filter((o) => o.createdAt >= startOfMonth())).revenue} count={orders.filter((o) => o.createdAt >= startOfMonth()).length} icon="📈" />
        </div>

        {/* Due amount summary */}
        {dueCount > 0 && (
          <div className="mb-4 rounded-lg border border-red-primary/30 bg-red-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-primary/10 text-xl">⚠️</div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-primary">Outstanding Due</p>
                  <p className="mt-0.5 text-lg font-bold text-red-primary">{formatBDT(totalDue)}</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary md:text-sm">from <span className="font-bold text-text-primary">{dueCount}</span> orders</p>
            </div>
          </div>
        )}

        {/* Search + range tabs */}
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5558]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search order ID, phone, name..."
              className="w-full rounded-lg border border-[#FAD4DD] bg-white py-2.5 pl-10 pr-3 text-sm text-[#2B1A24] placeholder:text-[#A88F92] focus:border-[#E8546B] focus:outline-none"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {(Object.keys(RANGE_LABELS) as RangeKey[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`flex-shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  range === r
                    ? "border-[#E8546B] bg-[#E8546B] text-white"
                    : "border-[#FAD4DD] bg-white text-[#6B5558] hover:border-[#E8546B] hover:text-[#E8546B]"
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Payment & Status filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          <PaymentTab label="All" count={rangeOrders.length} active={paymentFilter === "all"} onClick={() => setPaymentFilter("all")} />
          <PaymentTab label="✅ Paid" count={paidCount} active={paymentFilter === "paid"} onClick={() => setPaymentFilter("paid")} />
          <PaymentTab label="⏳ Due" count={dueCount} active={paymentFilter === "due"} onClick={() => setPaymentFilter("due")} />
        </div>

        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-2">
          <StatusTab label="All" count={rangeOrders.length} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
            <StatusTab key={s} label={STATUS_LABELS[s]} count={statusCounts[s]} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B5558]">
          <span><span className="font-bold text-[#2B1A24]">{visibleOrders.length}</span> orders shown</span>
          <span>Revenue: <span className="font-bold text-[#E8546B]">{formatBDT(computeStats(visibleOrders).revenue)}</span></span>
          <span>AOV: <span className="font-bold text-[#2B1A24]">{formatBDT(computeStats(visibleOrders).aov)}</span></span>
        </div>

        {/* Order List */}
        <div className="mt-4 space-y-3 pb-10">
          {loading ? (
            <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" /></div>
          ) : visibleOrders.length === 0 ? (
            <div className="rounded-lg border border-[#FAD4DD] bg-white p-10 text-center shadow-sm">
              <div className="text-5xl opacity-40">📭</div>
              <h3 className="mt-3 font-serif text-base font-bold text-[#2B1A24]">No orders found</h3>
              <p className="mt-1 text-xs text-[#6B5558]">{searchTerm ? `Nothing matches "${searchTerm}"` : "Try a different time range."}</p>
            </div>
          ) : (
            visibleOrders.map((order) => <OrderRow key={order.id} order={order} />)
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, revenue, count, icon }: { label: string; revenue: number; count: number; icon: string }) {
  return (
    <div className="rounded-xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B5558]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#E8546B] md:text-3xl">{formatBDT(revenue)}</p>
          <p className="mt-1 text-[11px] text-[#A88F92]">{count} orders</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#FDE8EC] text-xl">{icon}</div>
      </div>
    </div>
  );
}

function PaymentTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? "border-[#E8546B] bg-[#E8546B] text-white" : "border-[#FAD4DD] bg-white text-[#6B5558] hover:border-[#E8546B]"}`}>
      {label}
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-[#FFF6F6] text-[#6B5558]"}`}>{count}</span>
    </button>
  );
}

function StatusTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? "border-[#E8546B] bg-[#E8546B] text-white" : "border-[#FAD4DD] bg-white text-[#6B5558] hover:border-[#E8546B]"}`}>
      {label}
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-[#FFF6F6] text-[#6B5558]"}`}>{count}</span>
    </button>
  );
}

function OrderRow({ order }: { order: Order }) {
  const isManual = order.userId === "admin-manual";
  const paidAmount = order.paidAmount ?? order.total;
  const dueAmount = Math.max(0, order.total - paidAmount);
  const isFullyPaid = dueAmount === 0;
  const itemCount = order.items.length;
  const firstItem = order.items[0];

  return (
    <Link href={`/control-room/orders/${order.id}`} className="group block rounded-xl border border-[#FAD4DD] bg-white p-4 shadow-sm transition hover:border-[#E8546B] hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#E8546B] md:text-base">#{order.id}</span>
            {isManual && <span className="rounded-full bg-[#FFF6F6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6B5558]">Manual</span>}
            <span className="rounded-full border border-[#E8546B]/40 bg-[#FDE8EC] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E8546B]">{STATUS_LABELS[order.status]}</span>
            {isFullyPaid ? (
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">✅ Paid</span>
            ) : (
              <span className="rounded-full bg-red-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E8546B]">⏳ Due {formatBDT(dueAmount)}</span>
            )}
          </div>
          <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-[11px] text-[#6B5558] md:grid-cols-3 md:text-xs">
            <div><span className="text-[#A88F92]">Customer:</span> <span className="font-medium text-[#2B1A24]">{order.address?.name || "—"}</span></div>
            <div><span className="text-[#A88F92]">Phone:</span> <span className="font-medium text-[#2B1A24]">{order.address?.phone || "—"}</span></div>
            <div><span className="text-[#A88F92]">Date:</span> <span className="font-medium text-[#2B1A24]">{formatDate(order.createdAt)}</span></div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#A88F92] md:text-xs">
            <span>{itemCount} items {firstItem?.title ? `• ${firstItem.title.slice(0, 40)}...` : ""}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-[#A88F92]">Total</p>
          <p className="text-base font-bold text-[#E8546B] md:text-lg">{formatBDT(order.total)}</p>
          {!isFullyPaid && <p className="mt-1 text-[11px] text-[#6B5558]">Paid: <span className="font-semibold text-success">{formatBDT(paidAmount)}</span></p>}
          <span className="mt-1 inline-block text-[11px] font-medium text-[#E8546B]">View →</span>
        </div>
      </div>
    </Link>
  );
}