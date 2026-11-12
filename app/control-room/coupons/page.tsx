"use client";

import { useState, useEffect } from "react";
import { getAllUsers, giveCoupon, type AdminUser } from "@/lib/coupons";
import { formatBDT } from "@/lib/data";

export default function AdminCouponsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  // Form State
  const [couponType, setCouponType] = useState<"percentage" | "fixed">("percentage");
  const [couponAmount, setCouponAmount] = useState("");
  const [expiresDays, setExpiresDays] = useState("30");
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getAllUsers().then((list) => {
      setUsers(list);
      setLoading(false);
    });
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleCreateCoupon = async () => {
    if (!selectedUser) return;
    const amount = Number(couponAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    const days = Number(expiresDays) || 30;
    setCreating(true);
    try {
      const newCoupon = await giveCoupon(selectedUser.uid, couponType, amount, days);
      setUsers(prev => prev.map(u => 
        u.uid === selectedUser.uid 
          ? { ...u, coupons: [...(u.coupons || []), newCoupon] } 
          : u
      ));
      showToast(`✓ Coupon ${newCoupon.code} created`);
      setSelectedUser(null);
      setCouponAmount("");
      setCouponType("percentage");
    } catch (err) {
      alert("Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {toast && <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-[#2B1A24] px-5 py-3 text-sm font-bold text-white shadow-lg animate-fade-in">{toast}</div>}

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" />
            Marketing
          </div>
          <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">Coupons & Discounts</h1>
          <p className="mt-1 text-sm font-medium text-[#6B5558]">Give special discounts to your best customers.</p>
        </div>
      </div>

      <div className="relative mb-6">
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search users by name, phone, or email..." className="w-full rounded-2xl border border-[#FAD4DD] bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-[#2B1A24] placeholder:text-[#A88F92] focus:border-[#E8546B] focus:outline-none focus:ring-2 focus:ring-[#E8546B]/20 transition-all shadow-sm" />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A88F92]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </span>
      </div>

      <div className="rounded-3xl border border-[#FAD4DD] bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E8546B] border-t-transparent" /></div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20"><p className="text-lg font-bold text-[#2B1A24]">No users found</p></div>
        ) : (
          <div className="divide-y divide-[#FAD4DD]">
            {filteredUsers.map((user) => {
              const activeCoupons = (user.coupons || []).filter(c => !c.used && c.expiresAt > Date.now());
              return (
                <div key={user.uid} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 hover:bg-[#FFF6F6] transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#FDE8EC] text-[#E8546B] font-bold text-lg">
                      {user.name ? user.name.charAt(0).toUpperCase() : "👤"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#2B1A24]">{user.name || "Unnamed Customer"}</p>
                      <p className="text-xs font-medium text-[#6B5558] mt-0.5">{user.phone || user.email || "No contact"}</p>
                      <p className="text-[11px] font-bold text-green-600 mt-1">{activeCoupons.length} active coupons</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(user)} className="rounded-full bg-[#2B1A24] px-5 py-2.5 text-xs font-bold text-white hover:bg-black transition-colors shadow-sm">
                    + Give Coupon
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-[#2B1A24] mb-1">Create Coupon</h2>
            <p className="text-xs text-[#6B5558] mb-6">For <strong className="text-[#E8546B]">{selectedUser.name || "Customer"}</strong></p>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">Discount Type</label>
                <div className="flex gap-2">
                  <button onClick={() => setCouponType("percentage")} className={`flex-1 py-2 text-sm font-bold rounded-xl border ${couponType === "percentage" ? "border-[#E8546B] bg-[#FFF6F6] text-[#E8546B]" : "border-[#FAD4DD] bg-white text-[#6B5558]"}`}>Percentage (%)</button>
                  <button onClick={() => setCouponType("fixed")} className={`flex-1 py-2 text-sm font-bold rounded-xl border ${couponType === "fixed" ? "border-[#E8546B] bg-[#FFF6F6] text-[#E8546B]" : "border-[#FAD4DD] bg-white text-[#6B5558]"}`}>Fixed Amount (৳)</button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">
                  {couponType === "percentage" ? "Discount Percentage (%)" : "Discount Amount (৳)"}
                </label>
                <input type="number" value={couponAmount} onChange={(e) => setCouponAmount(e.target.value)} placeholder={couponType === "percentage" ? "e.g. 10" : "e.g. 100"} className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-lg font-bold text-[#2B1A24] focus:border-[#E8546B] focus:outline-none" autoFocus />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">Expires In (Days)</label>
                <input type="number" value={expiresDays} onChange={(e) => setExpiresDays(e.target.value)} className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-sm font-bold text-[#2B1A24] focus:border-[#E8546B] focus:outline-none" />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setSelectedUser(null)} className="flex-1 rounded-xl border-2 border-[#FAD4DD] bg-white py-3 text-sm font-bold text-[#6B5558]">Cancel</button>
              <button onClick={handleCreateCoupon} disabled={creating || !couponAmount} className="flex-[2] rounded-xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] py-3 text-sm font-bold text-white shadow-md disabled:opacity-40">
                {creating ? "Creating..." : "Generate Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}