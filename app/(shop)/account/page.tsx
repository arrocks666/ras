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

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, logout, updateProfile } = useAuth();

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
  const [totalDue, setTotalDue] = useState(0);

  useEffect(() => {
    if (!user) return;
    getSavedPayments(user.uid).then(setPayments);
    getSavedAddress(user.uid).then(setAddress);
    
    // Pre-fill the profile edit inputs
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

    return (
      <div className="min-h-screen bg-[#FFF6F6] pb-24 md:pb-8">
        
        {/* HEADER */}
        <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
            <button onClick={() => router.push("/")} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD] transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
            </button>
            <h1 className="flex-1 text-lg font-bold text-[#2B1A24] md:text-xl">My Account</h1>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-5 md:py-8 space-y-5 animate-fade-in">
          
          {/* PREMIUM PROFILE CARD */}
          <div className="relative overflow-hidden rounded-3xl border border-[#FAD4DD] bg-white shadow-soft">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#E8546B] to-[#FF8B9A]" />
            
            <div className="relative z-10 px-6 pt-8 pb-6">
              <div className="flex items-end justify-between gap-4">
                <div className="flex items-end gap-4">
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#FDE8EC] text-3xl text-[#E8546B] shadow-md">
                    👤
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <h2 className="truncate text-xl font-bold text-[#2B1A24]">{displayName}</h2>
                    <p className="truncate text-xs font-medium text-[#6B5558]">{displayPhone}</p>
                    {emailToShow && <p className="truncate text-xs font-medium text-[#6B5558]">{emailToShow}</p>}
                  </div>
                </div>
                <button 
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="flex-shrink-0 rounded-full bg-white/20 border border-[#E8546B]/30 px-3 py-1.5 text-xs font-bold text-[#E8546B] backdrop-blur-md hover:bg-white transition-colors"
                >
                  {editingProfile ? "Cancel" : "Edit"}
                </button>
              </div>

              {/* PROFILE EDIT FORM */}
              {editingProfile && (
                <div className="mt-6 rounded-2xl border border-[#FAD4DD] bg-[#FFF6F6] p-4 animate-fade-down">
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
          </div>

          {/* COLORFUL STATS */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm">
              <span className="text-2xl font-bold text-[#E8546B]">{dueOrders.length}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B5558]">Orders</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm">
              <span className="text-2xl font-bold text-[#E8546B]">0</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B5558]">Wishlist</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm">
              <span className="text-2xl font-bold text-[#E8546B]">{couponCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B5558]">Coupons</span>
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

            {/* Address Accordion */}
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

            {/* Payments Accordion */}
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

            {/* Coupons Accordion */}
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
                            {/* ✅ FIXED: Show % or ৳ based on coupon type */}
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
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-medium text-[#6B5558]">
            <a href="#" className="hover:text-[#E8546B]">Privacy Policy</a><span>|</span>
            <a href="#" className="hover:text-[#E8546B]">Terms & Conditions</a><span>|</span>
            <a href="#" className="hover:text-[#E8546B]">Shipping Policy</a>
          </div>

          <p className="text-center text-[10px] font-medium text-[#A88F92]">Ratry's Artistry Shop v0.1.0 • Made for Bangladesh 🇧🇩</p>
        </div>

        {/* MOBILE STICKY LOGOUT */}
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