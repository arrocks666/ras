"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDateTime } from "@/lib/adminOrders";
import { giveCoupon } from "@/lib/coupons"; // ✅ IMPORTING THE NEW LOGIC
import Link from "next/link";

type FollowRequest = {
  uid: string;
  name?: string;
  phone?: string;
  followRequest: {
    fbId?: string;
    igId?: string;
    status: "pending" | "approved";
    requestedAt: any;
  };
};

export default function AdminFollowRequestsPage() {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list: FollowRequest[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.followRequest && data.followRequest.status === "pending") {
          list.push({ uid: d.id, ...data } as FollowRequest);
        }
      });
      // Sort by newest first
      list.sort((a, b) => (b.followRequest.requestedAt?.seconds || 0) - (a.followRequest.requestedAt?.seconds || 0));
      setRequests(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleApprove = async (req: FollowRequest) => {
    if (!confirm(`Send a 10% discount coupon to ${req.name || req.phone}?`)) return;
    
    setProcessingId(req.uid);
    try {
      // ✅ Give a 10% Percentage Coupon (Valid for 30 days)
      const coupon = await giveCoupon(req.uid, "percentage", 10, 30);

      // Mark the request as approved
      await updateDoc(doc(db, "users", req.uid), {
        "followRequest.status": "approved",
      });

      showToast(`✓ 10% Coupon ${coupon.code} sent to ${req.name || req.phone}`);
      setRequests((prev) => prev.filter((r) => r.uid !== req.uid));
    } catch (err) {
      console.error(err);
      alert("Failed to approve.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {toast && <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-[#2B1A24] px-5 py-3 text-sm font-bold text-white shadow-lg animate-fade-in">{toast}</div>}

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" />
          Marketing
        </div>
        <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">Follow Requests</h1>
        <p className="mt-1 text-sm text-[#6B5558]">Approve customers who followed your social media to send them 10% coupons.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E8546B] border-t-transparent" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#FAD4DD] shadow-sm">
          <div className="text-5xl mb-3 opacity-40">📭</div>
          <p className="text-lg font-bold text-[#2B1A24]">No pending requests</p>
          <p className="text-sm text-[#6B5558]">When customers submit their social IDs, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.uid} className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#2B1A24]">{req.name || "Unnamed Customer"} <span className="text-[#A88F92] font-normal ml-1">({req.phone})</span></p>
                <div className="mt-2 text-xs text-[#6B5558] space-y-1">
                  {req.followRequest.fbId && <p><strong className="text-[#1877F2]">FB:</strong> {req.followRequest.fbId}</p>}
                  {req.followRequest.igId && <p><strong className="text-[#E1306C]">IG:</strong> {req.followRequest.igId}</p>}
                  <p className="text-[10px] text-[#A88F92]">Requested: {req.followRequest.requestedAt ? formatDateTime(req.followRequest.requestedAt.seconds * 1000) : "Recently"}</p>
                </div>
              </div>
              <button 
                onClick={() => handleApprove(req)} 
                disabled={processingId === req.uid}
                className="flex-shrink-0 rounded-xl bg-[#E8546B] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#b02a58] disabled:opacity-50"
              >
                {processingId === req.uid ? "Approving..." : "Approve & Send 10% Coupon"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}