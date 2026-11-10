"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Order } from "@/lib/OrderContext";
import {
  fetchOrdersSince,
  computeStats,
  countByStatus,
  startOfDay,
  startOfWeek,
  startOfMonth,
  formatBDT,
} from "@/lib/adminOrders";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
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

  const todayOrders = orders.filter((o) => o.createdAt >= startOfDay());
  const weekOrders = orders.filter((o) => o.createdAt >= startOfWeek());
  const monthOrders = orders.filter((o) => o.createdAt >= startOfMonth());

  const todayStats = computeStats(todayOrders);
  const weekStats = computeStats(weekOrders);
  const monthStats = computeStats(monthOrders);

  const statusCounts = countByStatus(monthOrders);
  const pendingOrders =
    statusCounts.placed + statusCounts.confirmed + statusCounts.processing;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" />
              Owner Dashboard
            </div>
            <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">
              Welcome back, <span className="text-[#E8546B]">Owner</span>
            </h1>
            <p className="mt-1 text-sm text-[#6B5558]">
              Here's your store overview for this month.
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-[#A88F92]">
              Today
            </p>
            <p className="text-sm font-semibold text-[#2B1A24]">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigStat
          label="Today's Revenue"
          value={formatBDT(todayStats.revenue)}
          sub={`${todayOrders.length} ${todayOrders.length === 1 ? "order" : "orders"}`}
          icon="💰"
          accent="pink"
        />
        <BigStat
          label="This Week"
          value={formatBDT(weekStats.revenue)}
          sub={`${weekOrders.length} ${weekOrders.length === 1 ? "order" : "orders"}`}
          icon="📅"
          accent="gray"
        />
        <BigStat
          label="This Month"
          value={formatBDT(monthStats.revenue)}
          sub={`${monthOrders.length} ${monthOrders.length === 1 ? "order" : "orders"}`}
          icon="📈"
          accent="pink"
        />
        <BigStat
          label="Total Orders"
          value={String(orders.length)}
          sub="Last 30 days"
          icon="🧾"
          accent="gray"
        />
      </div>

      {/* Second row */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SmallStat label="Pending Orders" value={String(pendingOrders)} icon="⏳" />
        <SmallStat label="Delivered" value={String(statusCounts.delivered)} icon="✅" />
        <SmallStat label="Average Order" value={formatBDT(monthStats.aov)} icon="📊" />
        <SmallStat
          label="Manual Orders"
          value={String(monthOrders.filter((o) => o.userId === "admin-manual").length)}
          icon="✍️"
        />
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-bold text-[#2B1A24]">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickAction href="/admin-panel/orders/new" icon="✍️" label="Create Order" />
          <QuickAction href="/admin-panel/orders" icon="🧾" label="View Orders" />
          <QuickAction href="/admin-panel/products" icon="📦" label="Manage Products" />
          <QuickAction href="/admin-panel/settings" icon="⚙️" label="Store Settings" />
        </div>
      </div>

      {/* Order statistics */}
      <div className="mt-8 rounded-2xl border border-[#FAD4DD] bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-bold text-[#2B1A24] md:text-lg">
              Order Statistics
            </h3>
            <p className="mt-0.5 text-xs text-[#6B5558]">
              {monthOrders.length} orders · {formatBDT(monthStats.revenue)} total
            </p>
          </div>
          <span className="rounded-full bg-[#FDE8EC] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B]">
            Live
          </span>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatusBox label="Placed" count={statusCounts.placed} />
            <StatusBox label="Processing" count={statusCounts.processing} />
            <StatusBox label="Shipped" count={statusCounts.shipped} />
            <StatusBox label="Delivered" count={statusCounts.delivered} />
          </div>
        )}
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  accent: "pink" | "gray";
}) {
  const accentColor = accent === "pink" ? "text-[#E8546B]" : "text-[#2B1A24]";
  const accentBg = accent === "pink" ? "bg-[#FDE8EC]" : "bg-[#FFF6F6]";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#A88F92]">
            {label}
          </p>
          <p className={`mt-2 truncate text-2xl font-bold md:text-3xl ${accentColor}`}>
            {value}
          </p>
          <p className="mt-1 text-[11px] text-[#A88F92]">{sub}</p>
        </div>
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-xl ${accentBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SmallStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF6F6] text-lg">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold text-[#2B1A24]">{value}</p>
        <p className="text-[11px] text-[#A88F92]">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-[#FAD4DD] bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[#E8546B] hover:shadow-md"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#FDE8EC] text-2xl transition group-hover:bg-[#E8546B] group-hover:text-white">
        {icon}
      </div>
      <span className="text-xs font-semibold text-[#2B1A24] group-hover:text-[#E8546B]">
        {label}
      </span>
    </Link>
  );
}

function StatusBox({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] p-4 text-center">
      <p className="text-2xl font-bold text-[#E8546B]">{count}</p>
      <p className="mt-1 text-[11px] font-medium text-[#6B5558]">{label}</p>
    </div>
  );
}