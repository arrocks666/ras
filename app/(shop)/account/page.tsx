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
import { useWishlist } from "@/lib/WishlistContext";

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, logout, updateProfile } = useAuth();
  const wishlist = useWishlist();

  const [openSection, setOpenSection] = useState<string | null>(null);

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

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
  const [orderCount, setOrderCount] = useState(0);
  const [totalDue, setTotalDue] = useState(0);

  useEffect(() => {
    if (!user) return;
    getSavedPayments(user.uid).then(setPayments);
    getSavedAddress(user.uid).then(setAddress);

    setEditName(profile?.name || "");
    setEditPhone(profile?.phone || "");
    setEditEmail(profile?.email?.endsWith("@ratrysartistry.app") ? "" : (profile?.email || ""));

    (async () => {
      const all = await getUserCoupons(user.uid);
      const valid = filterValidCoupons(all);
      setCouponsList(valid);
      setCouponCount(valid.length);
    })();
    (async () => {
      const orders = await getUserOrders(user.uid);
      setOrderCount(orders.length);
      const pending = orders.filter((o) => (o.paidAmount ?? 0) < o.total);
      setDueOrders(pending);
      setTotalDue(pending.reduce((sum, o) => sum + (o.total - (o.paidAmount ?? 0)), 0));
    })();
  }, [user, profile]);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;
    await logout();
    router.push("/");
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
      });
      setProfileMsg("Profile Updated!");
      setEditingProfile(false);
      setTimeout(() => setProfileMsg(null), 2000);
    } catch (err) {
      setProfileMsg("Failed to save");
    } finally {
      setSavingProfile(false);
    }
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E8546B] border-t-transparent" />
      </div>
    );
  }

  if (user) {
    const displayPhone = profile?.phone || "No phone set";
    const displayName = profile?.name || "Customer";
    const rawEmail = profile?.email?.trim() ?? "";
    const emailToShow = rawEmail !== "" && !rawEmail.endsWith("@ratrysartistry.app") ? rawEmail : null;
    const initials = displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase())
      .join("");

    return (
      <div className="min-h-screen bg-[#FFF6F6] pb-24 md:pb-8">
        <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
            <button onClick={() => router.push("/")} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD] transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
            </button>
            <h1 className="flex-1 text-lg font-bold text-[#2B1A24] md:text-xl">My Account</h1>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-5 md:py-8 space-y-4 animate-fade-in">

          {/* PREMIUM PROFILE CARD */}
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FF8B9A] via-[#E8546B] to-[#B02A58] p-[26px] shadow-[0_24px_50px_-24px_rgba(232,84,107,0.85)]">
            <div className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-white/15 blur-2xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-24 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "14px 14px" }} />

            <div className="relative z-10 flex items-start gap-4">
              <div className="flex h-[68px] w-[68px] flex-shrink-0 items-center justify-center rounded-2xl border-2 border-white/45 bg-white/20 text-2xl font-bold text-white backdrop-blur-sm">
                {initials || "👤"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-white/70">My account</p>
                <h2 className="mt-1 truncate text-[22px] font-bold leading-tight text-white">{displayName}</h2>
                <p className="mt-1 truncate text-[11.5px] font-medium text-white/85">{displayPhone}</p>
                {emailToShow && <p className="truncate text-[11.5px] font-medium text-white/70">{emailToShow}</p>}
              </div>

              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="flex-shrink-0 rounded-full bg-white/95 px-4 py-1.5 text-[11px] font-bold text-[#C21C5E] shadow-sm transition hover:bg-white active:scale-95"
              >
                {editingProfile ? "Cancel" : "Edit"}
              </button>
            </div>

            {editingProfile && (
              <div className="relative z-10 mt-5 rounded-2xl bg-white p-4 shadow-lg animate-fade-down">
                <div className="space-y-3">
                  <InputField label="Full Name" value={editName} onChange={setEditName} editing={true} placeholder="Your name" />
                  <InputField label="Phone Number" value={editPhone} onChange={setEditPhone} editing={true} placeholder="01XXXXXXXXX" />
                  <InputField label="Email (For updates)" value={editEmail} onChange={setEditEmail} editing={true} placeholder="you@example.com" />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button onClick={handleSaveProfile} disabled={savingProfile} className="rounded-xl bg-[#E8546B] px-6 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-40">
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                  {profileMsg && <span className="text-xs font-bold text-green-600">{profileMsg}</span>}
                </div>
              </div>
            )}
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-3">
            <Link href="/orders" className="group flex flex-col items-center justify-center gap-1 rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#E8546B]/40 hover:shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A88F92]">Orders</span>
              <span className="text-2xl font-bold text-[#E8546B]">{orderCount}</span>
            </Link>
            <Link href="/wishlist" className="group flex flex-col items-center justify-center gap-1 rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#E8546B]/40 hover:shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A88F92]">Wishlist</span>
              <span className="text-2xl font-bold text-[#E8546B]">{wishlist.items.size}</span>
            </Link>
            <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A88F92]">Coupons</span>
              <span className="text-2xl font-bold text-[#E8546B]">{couponCount}</span>
            </div>
          </div>

          {/* DUE WARNING */}
          {totalDue > 0 && (
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-2xl">⚠️</div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Outstanding Due</p>
                  <p className="text-xl font-bold text-orange-700">{formatBDT(totalDue)}</p>
                </div>
              </div>
              <Link href="/orders" className="rounded-full bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-700 transition-colors">Pay Now</Link>
            </div>
          )}

          {/* ACTION LIST */}
          <div className="space-y-3">
            <Link href="/orders" className="flex items-center gap-4 rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl">📦</div>
              <span className="flex-1 text-sm font-bold text-[#2B1A24]">My Orders</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#A88F92]"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>

            <Link href="/wishlist" className="flex items-center gap-4 rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-xl">♡</div>
              <span className="flex-1 text-sm font-bold text-[#2B1A24]">My Wishlist</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#A88F92]"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>

            <div className="rounded-2xl border border-[#FAD4DD] bg-white shadow-sm overflow-hidden">
              <button onClick={() => toggleSection("My Addresses")} className="flex w-full items-center gap-4 p-4 hover:bg-[#FFF6F6] transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-xl">📍</div>
                <span className="flex-1 text-left text-sm font-bold text-[#2B1A24]">My Addresses</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-[#A88F92] transition-transform duration-300 ${openSection === "My Addresses" ? "rotate-90" : ""}`}><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              {openSection === "My Addresses" && (
                <div className="border-t border-[#FAD4DD] bg-[#FFF6F6] px-4 py-4 animate-fade-down">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold text-[#2B1A24]">Saved Delivery Address</p>
                    <button onClick={() => setEditingAddress(!editingAddress)} className="text-[11px] font-bold text-[#E8546B] underline">{editingAddress ? "Cancel" : "Edit"}</button>
                  </div>
                  <div className="space-y-3">
                    <InputField label="Full Name" value={address.name ?? ""} onChange={(v) => setAddress({ ...address, name: v })} editing={editingAddress} placeholder="Your full name" />
                    <InputField label="Phone Number" value={address.phone ?? ""} onChange={(v) => setAddress({ ...address, phone: v })} editing={editingAddress} placeholder="01XXXXXXXXX" />
                    <InputField label="Full Address" value={address.address ?? ""} onChange={(v) => setAddress({ ...address, address: v })} editing={editingAddress} placeholder="House, road, area" />
                    <InputField label="District" value={address.district ?? ""} onChange={(v) => setAddress({ ...address, district: v })} editing={editingAddress} placeholder="e.g. Dhaka" />
                  </div>
                  {editingAddress && (
                    <div className="mt-4 flex items-center gap-3">
                      <button onClick={handleSaveAddress} disabled={savingAddress} className="rounded-xl bg-[#E8546B] px-6 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-40">{savingAddress ? "Saving..." : "Save Address"}</button>
                      {saveAddressMsg && <span className="text-xs font-bold text-green-600">{saveAddressMsg}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#FAD4DD] bg-white shadow-sm overflow-hidden">
              <button onClick={() => toggleSection("Payment Methods")} className="flex w-full items-center gap-4 p-4 hover:bg-[#FFF6F6] transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-xl">💳</div>
                <span className="flex-1 text-left text-sm font-bold text-[#2B1A24]">Payment Methods</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-[#A88F92] transition-transform duration-300 ${openSection === "Payment Methods" ? "rotate-90" : ""}`}><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              {openSection === "Payment Methods" && (
                <div className="border-t border-[#FAD4DD] bg-[#FFF6F6] px-4 py-4 animate-fade-down">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold text-[#2B1A24]">Saved Bank Info</p>
                    <button onClick={() => setEditingPayments(!editingPayments)} className="text-[11px] font-bold text-[#E8546B] underline">{editingPayments ? "Cancel" : "Edit"}</button>
                  </div>
                  <InputField label="Bank Account" value={payments.bank ?? ""} onChange={(v) => setPayments({ ...payments, bank: v })} editing={editingPayments} placeholder="Account number" />
                  {editingPayments && (
                    <div className="mt-4 flex items-center gap-3">
                      <button onClick={handleSavePayments} disabled={savingPayments} className="rounded-xl bg-[#E8546B] px-6 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-40">{savingPayments ? "Saving..." : "Save Payment"}</button>
                      {savePaymentMsg && <span className="text-xs font-bold text-green-600">{savePaymentMsg}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#FAD4DD] bg-white shadow-sm overflow-hidden">
              <button onClick={() => toggleSection("Coupons & Offers")} className="flex w-full items-center gap-4 p-4 hover:bg-[#FFF6F6] transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-xl">🎟️</div>
                <span className="flex-1 text-left text-sm font-bold text-[#2B1A24]">Coupons & Offers</span>
                {couponCount > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E8546B] px-1.5 text-[10px] font-bold text-white">{couponCount}</span>}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-[#A88F92] transition-transform duration-300 ${openSection === "Coupons & Offers" ? "rotate-90" : ""}`}><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              {openSection === "Coupons & Offers" && (
                <div className="border-t border-[#FAD4DD] bg-[#FFF6F6] px-4 py-4 animate-fade-down">
                  {couponsList.length > 0 ? (
                    <div className="space-y-2">
                      {couponsList.map((c) => (
                        <div key={c.code} className="flex items-center justify-between rounded-xl border border-[#E8546B]/30 bg-white px-3 py-3 shadow-sm">
                          <span className="font-mono font-bold text-[#E8546B]">{c.code}</span>
                          <span className="font-bold text-[#2B1A24]">
                            {c.type === "percentage" ? `${c.amount}% OFF` : `${formatBDT(c.amount)} OFF`}
                          </span>
                          <span className="text-[10px] font-medium text-[#6B5558]">Exp {new Date(c.expiresAt).toLocaleDateString("en-GB")}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-[#6B5558]">No active coupons.</p>
                  )}
                </div>
              )}
            </div>

            <Link href="/help" className="flex items-center gap-4 rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-xl">❓</div>
              <span className="flex-1 text-sm font-bold text-[#2B1A24]">Help & Support</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#A88F92]"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>

            {/* LOGOUT — visible on mobile + desktop */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-4 rounded-2xl border border-[#E8546B]/30 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#E8546B] hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDE8EC] text-xl">🚪</div>
              <span className="flex-1 text-left text-sm font-bold text-[#E8546B]">Logout</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#E8546B]">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-medium text-[#6B5558]">
            <a href="#" className="hover:text-[#E8546B]">Privacy Policy</a><span>|</span>
            <a href="#" className="hover:text-[#E8546B]">Terms & Conditions</a><span>|</span>
            <a href="#" className="hover:text-[#E8546B]">Shipping Policy</a>
          </div>

          <p className="text-center text-[10px] font-medium text-[#A88F92]">Ratri&apos;s Artistry Shop v0.1.0 • Made for Bangladesh 🇧🇩</p>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#FAD4DD] bg-white p-3 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden">
          <button onClick={handleLogout} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#E8546B] bg-[#FFF6F6] text-sm font-bold text-[#E8546B] active:scale-[0.98]">
            Logout
          </button>
        </div>
      </div>
    );
  }

  // GUEST VIEW
  return (
    <div className="min-h-screen bg-[#FFF6F6]">
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.push("/")} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD] transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
          </button>
          <h1 className="flex-1 text-lg font-bold text-[#2B1A24] md:text-xl">My Account</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm">
          <span className="text-4xl opacity-50">👤</span>
        </div>
        <h2 className="text-xl font-bold text-[#2B1A24]">Welcome, Guest</h2>
        <p className="mt-2 text-sm text-[#6B5558]">Login to access your orders, wishlist, and saved details.</p>

        <div className="mt-8 grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <Link href="/login" className="rounded-xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] py-3.5 text-center text-sm font-bold text-white shadow-md">Login</Link>
          <Link href="/signup" className="rounded-xl border-2 border-[#E8546B] bg-white py-3.5 text-center text-sm font-bold text-[#E8546B]">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, editing, placeholder }: { label: string; value: string; onChange: (v: string) => void; editing: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">{label}</label>
      {editing ? (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-[#FAD4DD] bg-white px-4 py-3 text-sm font-medium text-[#2B1A24] placeholder:text-[#A88F92] focus:border-[#E8546B] focus:outline-none focus:ring-2 focus:ring-[#E8546B]/20 transition-all" />
      ) : (
        <div className="rounded-xl border border-[#FAD4DD] bg-white px-4 py-3 text-sm font-medium text-[#2B1A24]">{value || <span className="text-[#A88F92]">Not set</span>}</div>
      )}
    </div>
  );
}
