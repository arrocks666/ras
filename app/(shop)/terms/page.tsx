"use client";

import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-24 md:pb-10">
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="flex-1 text-lg font-bold text-[#2B1A24]">Terms & Conditions</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 md:p-8 shadow-soft prose prose-sm max-w-none text-[#6B5558]">
          <h2 className="font-serif text-2xl font-bold text-[#2B1A24] mb-4">Terms & Conditions</h2>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>By using Ratry's Artistry Shop, you agree to the following terms and conditions.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">1. Orders</h3>
          <p>All orders are subject to product availability and confirmation of the order price. We reserve the right to refuse any order.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">2. Pricing</h3>
          <p>Prices are listed in Bangladeshi Taka (৳) and are subject to change without notice. Shipping charges will be added after shipment based on weight and destination.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">3. Shipping</h3>
          <p>Estimated delivery times are 15-25 business days. Delays may occur due to customs or courier issues.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">4. Returns</h3>
          <p>Returns are accepted within 7 days of delivery for damaged or incorrect items. Please see our Returns & Refunds policy for details.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">5. Account</h3>
          <p>You are responsible for maintaining the confidentiality of your account information.</p>
        </div>
      </div>
    </div>
  );
}