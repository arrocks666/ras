"use client";

import { useRouter } from "next/navigation";

export default function ShippingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-24 md:pb-10">
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="flex-1 text-lg font-bold text-[#2B1A24]">Shipping Policy</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 md:p-8 shadow-soft prose prose-sm max-w-none text-[#6B5558]">
          <h2 className="font-serif text-2xl font-bold text-[#2B1A24] mb-4">Shipping Policy</h2>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">Processing Time</h3>
          <p>Orders are processed within 1-3 business days after payment confirmation.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">Delivery Time</h3>
          <p>Delivery typically takes 15-25 business days from China to Bangladesh, depending on the product and destination.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">Shipping Charges</h3>
          <p>Shipping charges are calculated based on the weight and size of your order. The final shipping cost will be added after the product is shipped.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">Tracking</h3>
          <p>Once your order is shipped, you will receive a tracking number via email and can track your order on our Track Order page.</p>
        </div>
      </div>
    </div>
  );
}