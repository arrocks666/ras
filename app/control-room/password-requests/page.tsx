"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDateTime } from "@/lib/adminOrders";

type ResetRequest = {
  id: string;
  phone: string;
  status: "pending" | "completed";
  createdAt: any;
};

export default function PasswordRequestsPage() {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "password_reset_requests"), where("status", "==", "pending"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ResetRequest));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRequests(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const markDone = async (req: ResetRequest) => {
    try {
      await updateDoc(doc(db, "password_reset_requests", req.id), { status: "completed" });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      showToast(`✓ ${req.phone} marked as resolved`);
    } catch {
      alert("Failed to update. Check Firestore rules.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-[#2B1A24] px-5 py-3 text-sm font-bold text-white shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" />
          Support
        </div>
        <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">Password Reset Requests</h1>
        <p className="mt-1 text-sm text-[#6B5558]">
          Customers who asked for a reset. Message them on WhatsApp, then mark it done.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E8546B] border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-3xl border border-[#FAD4DD] bg-white py-20 text-center shadow-sm">
          <div className="mb-3 text-5xl opacity-40">📭</div>
          <p className="text-lg font-bold text-[#2B1A24]">No pending requests</p>
          <p className="text-sm text-[#6B5558]">All customer accounts are secure.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="flex flex-col gap-4 rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-[#2B1A24]">{req.phone}</p>
                <p className="text-xs text-[#6B5558]">
                  Requested {req.createdAt ? formatDateTime(req.createdAt.seconds * 1000) : "recently"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://wa.me/88${req.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hi, you requested a password reset for Ratri's Artistry Shop. Your new password is: `
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#25D366] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                >
                  💬 WhatsApp
                </a>
                <button
                  onClick={() => markDone(req)}
                  className="rounded-lg bg-[#E8546B] px-4 py-2 text-xs font-bold text-white hover:bg-[#b02a58]"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
