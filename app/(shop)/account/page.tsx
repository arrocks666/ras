"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { formatBDT } from "@/lib/data";
import {
  getSavedPayments,
  savePayments,
  SavedPayments,
  getSavedAddress,
  saveAddress,
  SavedAddress,
} from "@/lib/userProfile";
import {
  getUserCoupons,
  filterValidCoupons,
  type Coupon,
} from "@/lib/coupons";
import { getUserOrders } from "@/lib/firestoreOrders";
import type { Order } from "@/lib/OrderContext";

type MenuItem = { icon: string; title: string; href?: string };

const menuItems: MenuItem[] = [
  { icon: "📦", title: "My Orders", href: "/orders" },
  { icon: "♡", title: "Wishlist", href: "/wishlist" },
  { icon: "📍", title: "My Addresses" },
  { icon: "💳", title: "Payment Methods" },
  { icon: "🎟️", title: "Coupons & Offers" },
  { icon: "❓", title: "Help & Support", href: "/help" },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, logout } = useAuth();

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [payments, setPayments] = useState<SavedPayments>({});
  const [editingPayments, setEditingPayments] = useState(false);
  const [savingPayments, setSavingPayments] = useState(false);
  const [savePaymentMsg, setSavePaymentMsg] = useState<string | null>(null);

  const [address, setAddress] = useState<SavedAddress>({});
  const [editingAddress, setEditingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [saveAddressMsg, setSaveAddressMsg] = useState<string | null>(null);

  const [couponsList, setCouponsList] = useState<Coupon[]>([]);
  const [couponCount, setCouponCount] = useState(0);
  const [dueOrders, setDueOrders] = useState<Order[]>([]);
  const [totalDue, setTotalDue] = useState(0);

  useEffect(() => {
    if (!user) return;
    getSavedPayments(user.uid).then(setPayments);
    getSavedAddress(user.uid).then(setAddress);
    (async () => {
      const all = await getUserCoupons(user.uid);
      const valid = filterValidCoupons(all);
      setCouponsList(valid);
      setCouponCount(valid.length);
    })();
    (async () => {
      const orders = await getUserOrders(user.uid);
      const pending = orders.filter((o) => (o.paidAmount ?? 0) < o.total);
      setDueOrders(pending);
      setTotalDue(pending.reduce((sum, o) => sum + (o.total - (o.paidAmount ?? 0)), 0));
    })();
  }, [user]);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;
    await logout();
    router.push("/");
  };

  const handleSavePayments = async () => {
    if (!user) return;
    setSavingPayments(true);
    try {
      await savePayments(user.uid, payments);
      setSavePaymentMsg("Saved");
      setEditingPayments(false);
      setTimeout(() => setSavePaymentMsg(null), 2000);
    } catch (err) { setSavePaymentMsg("Failed to save"); }
    finally { setSavingPayments(false); }
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    setSavingAddress(true);
    try {
      await saveAddress(user.uid, address);
      setSaveAddressMsg("Saved");
      setEditingAddress(false);
      setTimeout(() => setSaveAddressMsg(null), 2000);
    } catch (err) { setSaveAddressMsg("Failed to save"); }
    finally { setSavingAddress(false); }
  };

  const toggleSection = (title: string) => setOpenSection((prev) => (prev === title ? null : title));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF6F6] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" />
      </div>
    );
  }

  if (user) {
    const phone = profile?.phone || user.displayName || "Customer";
    const rawEmail = profile?.email?.trim() ?? "";
    const emailToShow = rawEmail !== "" && !rawEmail.endsWith("@ratrysartistry.app") ? rawEmail : null;
    const hasAddress = address.name || address.phone || address.address || address.district;

    return (
      <div className="min-h-screen bg-[#FFF6F6]">
        <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white shadow-sm md:top-[60px]">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
            <button onClick={() => router.push("/")} className="flex h-8 w-8 items-center justify-center text-[#2B1A24] hover:text-[#E8546B]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
            </button>
            <h1 className="flex-1 text-lg font-bold text-[#2B1A24] md:text-xl">Account</h1>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-3 py-4 md:px-4 md:py-6">
          {/* Profile Card */}
          <div className="overflow-hidden rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#E8546B] bg-[#FFF6F6] text-2xl text-[#E8546B] md:h-20 md:w-20 md:text-3xl">👤</div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold text-[#2B1A24] md:text-xl">{phone}</h2>
                {emailToShow && <p className="mt-0.5 truncate text-xs text-[#6B5558]">{emailToShow}</p>}
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#E8546B]/50 bg-[#FFF6F6] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E8546B]">⭐ Member</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-3 grid grid-cols-3 gap-2 md:gap-3">
            <StatBox label="Orders" value={String(dueOrders.length)} />
            <StatBox label="Wishlist" value="0" />
            <StatBox label="Coupons" value={String(couponCount)} />
          </div>

          {/* Due Warning */}
          {totalDue > 0 && (
            <div className="mt-3 rounded-2xl border-2 border-[#E8546B]/40 bg-[#FFF6F6] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8546B]/10 text-xl">⚠️</div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#E8546B]">Outstanding Due</p>
                    <p className="text-xl font-bold text-[#E8546B]">{formatBDT(totalDue)}</p>
                    <p className="text-[11px] text-[#6B5558]">from {dueOrders.length} orders</p>
                  </div>
                </div>
                <Link href="/orders" className="rounded-lg bg-[#E8546B] px-4 py-2 text-xs font-semibold text-white shadow-orange-glow">View Orders</Link>
              </div>
            </div>
          )}

          {/* Menu */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#FAD4DD] bg-white shadow-sm">
            {menuItems.map((item, i) => {
              const isCoupons = item.title === "Coupons & Offers";
              const isPayments = item.title === "Payment Methods";
              const isAddresses = item.title === "My Addresses";
              const hasAccordion = isPayments || isAddresses || isCoupons;
              const isOpen = openSection === item.title;

              const rowContent = (
                <div className={`group flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#FFF6F6] ${i > 0 ? "border-t border-[#FAD4DD]" : ""}`}>
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF6F6] text-base">{item.icon}</div>
                  <span className="flex-1 text-sm font-medium text-[#2B1A24] md:text-base">{item.title}</span>
                  {isCoupons && couponCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E8546B] px-1.5 text-[10px] font-bold text-white">{couponCount}</span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 text-[#A88F92] transition group-hover:text-[#E8546B] ${hasAccordion && isOpen ? "rotate-90" : ""}`}><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              );

              let onClick: () => void;
              if (item.href) onClick = () => router.push(item.href!);
              else if (hasAccordion) onClick = () => toggleSection(item.title);
              else onClick = () => alert(`${item.title} coming soon!`);

              return (
                <div key={item.title}>
                  <button onClick={onClick} className="block w-full text-left">{rowContent}</button>

                  {/* Payments Accordion */}
                  {isPayments && isOpen && (
                    <div className="border-t border-[#FAD4DD] bg-[#FFF6F6] px-4 py-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-bold text-[#2B1A24]">Saved Payment Method</p>
                        <button onClick={() => setEditingPayments(!editingPayments)} className="text-[11px] font-semibold text-[#E8546B] underline">{editingPayments ? "Cancel" : "Edit"}</button>
                      </div>
                      <InputField label="Bank Account Number" value={payments.bank ?? ""} onChange={(v) => setPayments({ ...payments, bank: v })} editing={editingPayments} placeholder="Account number" />
                      {editingPayments && (
                        <div className="mt-4 flex items-center gap-3">
                          <button onClick={handleSavePayments} disabled={savingPayments} className="rounded-lg bg-[#E8546B] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40">{savingPayments ? "Saving..." : "Save"}</button>
                          {savePaymentMsg && <span className="text-xs font-semibold text-green-600">{savePaymentMsg}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Addresses Accordion */}
                  {isAddresses && isOpen && (
                    <div className="border-t border-[#FAD4DD] bg-[#FFF6F6] px-4 py-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-bold text-[#2B1A24]">Delivery Address</p>
                        <button onClick={() => setEditingAddress(!editingAddress)} className="text-[11px] font-semibold text-[#E8546B] underline">{editingAddress ? "Cancel" : "Edit"}</button>
                      </div>
                      <div className="space-y-3">
                        <InputField label="Full Name" value={address.name ?? ""} onChange={(v) => setAddress({ ...address, name: v })} editing={editingAddress} placeholder="Your full name" />
                        <InputField label="Phone Number" value={address.phone ?? ""} onChange={(v) => setAddress({ ...address, phone: v })} editing={editingAddress} placeholder="01XXXXXXXXX" />
                        <InputField label="Full Address" value={address.address ?? ""} onChange={(v) => setAddress({ ...address, address: v })} editing={editingAddress} placeholder="House, road, area" />
                        <InputField label="District" value={address.district ?? ""} onChange={(v) => setAddress({ ...address, district: v })} editing={editingAddress} placeholder="e.g. Dhaka" />
                        <InputField label="Email Address (For Order Updates)" value={address.email ?? ""} onChange={(v) => setAddress({ ...address, email: v })} editing={editingAddress} placeholder="you@example.com" />
                      </div>
                      {editingAddress && (
                        <div className="mt-4 flex items-center gap-3">
                          <button onClick={handleSaveAddress} disabled={savingAddress} className="rounded-lg bg-[#E8546B] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40">{savingAddress ? "Saving..." : "Save"}</button>
                          {saveAddressMsg && <span className="text-xs font-semibold text-green-600">{saveAddressMsg}</span>}
                        </div>
                      )}
                      {!editingAddress && !hasAddress && <p className="mt-3 text-[11px] text-[#6B5558]">No address saved yet. Click Edit to add.</p>}
                    </div>
                  )}

                  {/* Coupons Accordion */}
                  {isCoupons && isOpen && (
                    <div className="border-t border-[#FAD4DD] bg-[#FFF6F6] px-4 py-4">
                      {couponsList.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B5558]">Your Coupons</p>
                          {couponsList.map((c) => (
                            <div key={c.code} className="flex items-center justify-between rounded border border-[#E8546B]/30 bg-white px-3 py-2.5 text-xs">
                              <span className="font-mono font-bold text-[#E8546B]">{c.code}</span>
                              <span className="font-semibold text-[#2B1A24]">{formatBDT(c.amount)} OFF</span>
                              <span className="text-[#6B5558]">Exp {new Date(c.expiresAt).toLocaleDateString("en-GB")}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#6B5558]">No active coupons. Coupons are given by the store admin.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-[#6B5558]">
            <a href="#" className="hover:text-[#E8546B]">Privacy Policy</a><span>|</span>
            <a href="#" className="hover:text-[#E8546B]">Terms & Conditions</a><span>|</span>
            <a href="#" className="hover:text-[#E8546B]">Shipping Policy</a>
          </div>

          <button onClick={handleLogout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8546B]/40 bg-[#FFF6F6] py-3 text-sm font-semibold text-[#E8546B] transition hover:bg-[#E8546B] hover:text-white">Logout</button>

          <p className="mt-6 text-center text-[10px] text-[#A88F92]">Ratry's Artistry Shop v0.1.0 • Made for Bangladesh 🇧🇩</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF6F6]">
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.push("/")} className="flex h-8 w-8 items-center justify-center text-[#2B1A24] hover:text-[#E8546B]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
          </button>
          <h1 className="flex-1 text-lg font-bold text-[#2B1A24] md:text-xl">Account</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-3 py-4 md:px-4 md:py-6">
        <div className="overflow-hidden rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#FAD4DD] bg-[#FFF6F6] text-2xl text-[#A88F92] md:h-20 md:w-20 md:text-3xl">👤</div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-[#2B1A24] md:text-xl">Welcome, Guest</h2>
              <p className="mt-0.5 text-xs text-[#6B5558]">Login to access your orders, wishlist, and more</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link href="/login" className="rounded-xl bg-[#E8546B] py-3 text-center text-sm font-semibold text-white shadow-orange-glow">Login</Link>
            <Link href="/signup" className="rounded-xl border-2 border-[#E8546B] bg-white py-3 text-center text-sm font-semibold text-[#E8546B]">Sign Up</Link>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-[#FAD4DD] bg-white shadow-sm">
          {menuItems.map((item, i) => {
            const Row = (
              <div className={`group flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#FFF6F6] ${i > 0 ? "border-t border-[#FAD4DD]" : ""}`}>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF6F6] text-base">{item.icon}</div>
                <span className="flex-1 text-sm font-medium text-[#2B1A24] md:text-base">{item.title}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[#A88F92] transition group-hover:text-[#E8546B]"><polyline points="9 18 15 12 9 6" /></svg>
              </div>
            );
            return item.href ? <Link key={item.title} href={item.href}>{Row}</Link> : <button key={item.title} onClick={() => alert("Please login first")} className="block w-full text-left">{Row}</button>;
          })}
        </div>

        <p className="mt-6 text-center text-[10px] text-[#A88F92]">Ratry's Artistry Shop v0.1.0 • Made for Bangladesh 🇧🇩</p>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#FAD4DD] bg-white px-3 py-2.5 text-center shadow-sm">
      <div className="text-lg font-bold text-[#E8546B] md:text-xl">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[#6B5558] md:text-xs">{label}</div>
    </div>
  );
}

function InputField({ label, value, onChange, editing, placeholder }: { label: string; value: string; onChange: (v: string) => void; editing: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-[#6B5558] md:text-xs">{label}</label>
      {editing ? (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-[#FAD4DD] bg-white px-3 py-2.5 text-sm text-[#2B1A24] placeholder:text-[#A88F92] focus:border-[#E8546B] focus:outline-none" />
      ) : (
        <div className="rounded-lg border border-[#FAD4DD] bg-white px-3 py-2.5 text-sm text-[#2B1A24]">{value || <span className="text-[#A88F92]">Not set</span>}</div>
      )}
    </div>
  );
}