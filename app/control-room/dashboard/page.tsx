"use client";

import { useEffect, useState, useMemo } from "react";
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
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

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
  const pendingOrders = statusCounts.placed + statusCounts.confirmed + statusCounts.processing;

  // Calculate Total Profit (Total Revenue - Total Cost of Items)
  const totalProfit = monthOrders.reduce((sum, o) => sum + (o.profit || 0), 0);
  const totalCost = monthOrders.reduce((sum, o) => sum + (o.costTotal || 0), 0);

  // Generate data for the 7-day chart
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const dayOrders = orders.filter((o) => o.createdAt >= start && o.createdAt < end);
      data.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      });
    }
    const max = Math.max(...data.map(d => d.revenue), 1);
    return data.map(d => ({ ...d, height: (d.revenue / max) * 100 }));
  }, [orders]);

  // Find Best Selling Products
  const bestSellers = useMemo(() => {
    const productMap = new Map<string, { title: string; quantity: number; revenue: number }>();
    
    monthOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.productId || item.title || "Unknown";
        const existing = productMap.get(key) || { title: item.title || "Product", quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        productMap.set(key, existing);
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [monthOrders]);

  return (
    <div className="bg-[#FFF6F6] min-h-screen pb-10">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-6">
        
        {/* HEADER */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B] shadow-sm animate-fade-in">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B] animate-pulse" />
              Owner Dashboard
            </div>
            <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-4xl">
              {greeting}, <span className="text-[#E8546B]">Owner</span>
            </h1>
            <p className="mt-1 text-sm text-[#6B5558]">
              Here's your store overview for {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
            </p>
          </div>
          <div className="text-right rounded-2xl border border-[#FAD4DD] bg-white px-4 py-2 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider text-[#A88F92] font-bold">Today</p>
            <p className="text-sm font-bold text-[#E8546B]">
              {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* PRIMARY STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BigStat label="Today's Revenue" value={formatBDT(todayStats.revenue)} sub={`${todayOrders.length} orders`} icon="💰" accent="pink" />
          <BigStat label="This Week" value={formatBDT(weekStats.revenue)} sub={`${weekOrders.length} orders`} icon="📅" accent="gray" />
          <BigStat label="This Month" value={formatBDT(monthStats.revenue)} sub={`${monthOrders.length} orders`} icon="📈" accent="pink" />
          <BigStat label="Total Profit" value={formatBDT(totalProfit)} sub={`Cost: ${formatBDT(totalCost)}`} icon="💎" accent="green" />
        </div>

        {/* CHART & SECONDARY STATS */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 7-DAY REVENUE CHART */}
          <div className="lg:col-span-2 rounded-3xl border border-[#FAD4DD] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2B1A24]">Revenue Overview</h3>
                <p className="text-xs text-[#6B5558]">Last 7 days performance</p>
              </div>
            </div>
            
            <div className="flex h-[200px] items-end justify-between gap-2 md:gap-4 pt-4">
              {chartData.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
                  <div className="relative w-full flex items-end justify-center h-full">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2B1A24] text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap z-10">
                      {formatBDT(d.revenue)}
                    </div>
                    <div 
                      className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-[#E8546B] to-[#FF8B9A] transition-all duration-500 group-hover:opacity-80"
                      style={{ height: `${Math.max(d.height, 2)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[#A88F92] uppercase">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* BEST SELLERS */}
          <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-[#2B1A24] mb-4">Top Selling Products</h3>
            {bestSellers.length === 0 ? (
              <p className="text-xs text-[#6B5558]">No sales data yet.</p>
            ) : (
              <div className="space-y-4">
                {bestSellers.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF6F6] text-xs font-bold text-[#E8546B]">{i + 1}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#2B1A24]">{item.title}</p>
                      <p className="text-[11px] text-[#6B5558]">{item.quantity} sold · {formatBDT(item.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-bold text-[#2B1A24]">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickAction href="/control-room/orders/new" icon="✍️" label="Create Order" />
            <QuickAction href="/control-room/orders" icon="🧾" label="View Orders" />
            <QuickAction href="/control-room/products" icon="📦" label="Manage Products" />
            <QuickAction href="/control-room/settings" icon="⚙️" label="Store Settings" />
          </div>
        </div>

        {/* ORDER STATISTICS */}
        <div className="mt-8 rounded-3xl border border-[#FAD4DD] bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2B1A24]">Order Statistics</h3>
              <p className="mt-0.5 text-xs text-[#6B5558]">
                {monthOrders.length} orders · {formatBDT(monthStats.revenue)} total
              </p>
            </div>
            <span className="rounded-full border border-[#E8546B]/30 bg-[#FDE8EC] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B]">
              This Month
            </span>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatusBox label="Placed" count={statusCounts.placed} color="bg-orange-50 text-orange-600 border-orange-200" />
              <StatusBox label="Processing" count={statusCounts.processing} color="bg-blue-50 text-blue-600 border-blue-200" />
              <StatusBox label="Shipped" count={statusCounts.shipped} color="bg-purple-50 text-purple-600 border-purple-200" />
              <StatusBox label="Delivered" count={statusCounts.delivered} color="bg-green-50 text-green-600 border-green-200" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTS
// ==========================================

function BigStat({ label, value, sub, icon, accent }: { label: string; value: string; sub: string; icon: string; accent: "pink" | "gray" | "green" }) {
  const isPink = accent === "pink";
  const isGreen = accent === "green";
  
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-[#FAD4DD] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${isPink || isGreen ? 'hover:border-[#E8546B]/50' : ''}`}>
      {(isPink || isGreen) && <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full ${isGreen ? 'bg-green-50' : 'bg-[#E8546B]/5'}`} />}
      <div className="flex items-start justify-between relative z-10">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#A88F92]">{label}</p>
          <p className={`mt-2 truncate text-2xl font-bold md:text-3xl ${isGreen ? "text-green-600" : isPink ? "text-[#E8546B]" : "text-[#2B1A24]"}`}>{value}</p>
          <p className="mt-1 text-[11px] font-medium text-[#A88F92]">{sub}</p>
        </div>
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-xl ${isGreen ? 'bg-green-50' : isPink ? 'bg-[#FDE8EC]' : 'bg-[#FFF6F6]'}`}>{icon}</div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-3 rounded-3xl border border-[#FAD4DD] bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-[#E8546B] hover:shadow-lg">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF6F6] text-2xl transition group-hover:bg-[#E8546B] group-hover:text-white group-hover:scale-110">
        {icon}
      </div>
      <span className="text-xs font-bold text-[#2B1A24] group-hover:text-[#E8546B]">{label}</span>
    </Link>
  );
}

function StatusBox({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`rounded-2xl border p-5 text-center transition-all hover:scale-[1.02] ${color}`}>
      <p className="text-3xl font-bold">{count}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}