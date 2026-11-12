"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

type AdminUser = {
  uid: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  createdAt?: any;
  savedAddress?: {
    address?: string;
    district?: string;
  };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const snap = await getDocs(collection(db, "users"));
        const list = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            name: data.name || data.savedAddress?.name || "",
            phone: data.phone || data.savedAddress?.phone || "",
            email: data.email || "",
            role: data.role || "customer",
            createdAt: data.createdAt,
            savedAddress: data.savedAddress,
          };
        });
        setUsers(list);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      u.uid.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" />
            Customer Base
          </div>
          <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">All Customers</h1>
          <p className="mt-1 text-sm font-medium text-[#6B5558]">
            You have <strong className="text-[#E8546B]">{users.length}</strong> registered customers.
          </p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="w-full rounded-2xl border border-[#FAD4DD] bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-[#2B1A24] placeholder:text-[#A88F92] focus:border-[#E8546B] focus:outline-none focus:ring-2 focus:ring-[#E8546B]/20 transition-all shadow-sm"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A88F92]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </span>
      </div>

      {/* TABLE / LIST */}
      <div className="rounded-3xl border border-[#FAD4DD] bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E8546B] border-t-transparent" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-40">👥</div>
            <p className="text-lg font-bold text-[#2B1A24]">No users found</p>
            <p className="text-sm text-[#6B5558]">Try a different search term.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#FAD4DD]">
            {filteredUsers.map((user) => (
              <div key={user.uid} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 hover:bg-[#FFF6F6] transition-colors gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#FDE8EC] text-[#E8546B] font-bold text-lg">
                    {user.name ? user.name.charAt(0).toUpperCase() : "👤"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2B1A24] flex items-center gap-2">
                      {user.name || "Unnamed Customer"}
                      {user.role === "admin" && (
                        <span className="rounded bg-purple-100 px-2 py-0.5 text-[9px] font-bold uppercase text-purple-600">Admin</span>
                      )}
                    </p>
                    <p className="text-xs font-medium text-[#6B5558] mt-0.5">{user.email || "No email"}</p>
                    <p className="text-xs font-medium text-[#6B5558]">{user.phone || "No phone"}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A88F92] bg-[#FFF6F6] px-2 py-1 rounded">
                    ID: {user.uid.slice(0, 6)}...
                  </span>
                  <Link 
                    href={`/control-room/orders?userId=${user.uid}`} 
                    className="rounded-full bg-[#2B1A24] px-4 py-2 text-[11px] font-bold text-white hover:bg-black transition-colors"
                  >
                    View Orders
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}