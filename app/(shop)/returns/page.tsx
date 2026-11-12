"use client";

import { useRouter } from "next/navigation";

export default function ReturnsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-24 md:pb-10">
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="flex-1 text-lg font-bold text-[#2B1A24]">Returns & Refunds</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 md:p-8 shadow-soft prose prose-sm max-w-none text-[#6B5558]">
          <h2 className="font-serif text-2xl font-bold text-[#2B1A24] mb-4">Returns & Refunds</h2>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">Eligibility</h3>
          <p>You may return damaged or incorrect items within 7 days of delivery. Items must be unused and in their original packaging.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">Process</h3>
          <p>To start a return, contact us on WhatsApp with your order ID and a photo of the item. We will review and approve your request.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">Refunds</h3>
          <p>Approved refunds will be processed within 5-7 business days to your original payment method, or as a store credit.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">Non-returnable Items</h3>
          <p>Personal care items, intimate apparel, and custom-made products are not eligible for return.</p>
        </div>
      </div>
    </div>
  );
}