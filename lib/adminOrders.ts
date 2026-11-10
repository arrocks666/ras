// lib/adminOrders.ts
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import { Order, OrderStatus } from "./OrderContext";

export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function startOfDay(date = new Date()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfWeek(date = new Date()): number {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfMonth(date = new Date()): number {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function fetchOrdersSince(days = 30): Promise<Order[]> {
  try {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const q = query(collection(db, "orders"), where("createdAt", ">=", cutoff), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list: Order[] = [];
    snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Order));
    return list;
  } catch (err) {
    console.error("Error fetching orders:", err);
    return [];
  }
}

export function searchOrders(orders: Order[], searchTerm: string): Order[] {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return orders;
  return orders.filter(o =>
    o.id.toLowerCase().includes(term) ||
    (o.userPhone && o.userPhone.includes(term)) ||
    (o.address?.name && o.address.name.toLowerCase().includes(term)) ||
    (o.address?.phone && o.address.phone.includes(term))
  );
}

export function computeStats(orders: Order[]): { revenue: number; aov: number; count: number } {
  const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const aov = orders.length > 0 ? revenue / orders.length : 0;
  return { revenue, aov, count: orders.length };
}

export function countByStatus(orders: Order[]): Record<OrderStatus, number> {
  const counts: Record<string, number> = {
    placed: 0, confirmed: 0, processing: 0, shipped: 0, arrived: 0, "out-for-delivery": 0, delivered: 0,
  };
  orders.forEach(o => {
    if (counts[o.status] !== undefined) counts[o.status]++;
  });
  return counts as Record<OrderStatus, number>;
}

export function groupByDay(orders: Order[]): Array<{ date: string; revenue: number }> {
  const map = new Map<string, number>();
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    map.set(key, (map.get(key) || 0) + (o.total || 0));
  });
  return Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }));
}