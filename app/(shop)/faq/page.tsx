"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FAQS = [
  { q: "How do I place an order?", a: "Browse products, add them to your cart, and proceed to checkout. You can pay via bKash, Nagad, Bank Transfer, or Cash on Delivery." },
  { q: "How long does shipping take?", a: "Delivery typically takes 15-25 business days from China to Bangladesh." },
  { q: "How can I track my order?", a: "Once your order is shipped, you can track it on the Track Order page using your order ID." },
  { q: "What payment methods do you accept?", a: "We accept bKash, Nagad, Bank Transfer, and Cash on Delivery (COD)." },
  { q: "What is your return policy?", a: "You can return damaged or incorrect items within 7 days of delivery. See our Returns & Refunds page for details." },
  { q: "Is shipping charged separately?", a: "Yes, shipping charges are calculated based on the weight and size of your order and will be added after the product is shipped." },
];

export default function FaqPage() {
  const router = useRouter();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-24 md:pb-10">
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="flex-1 text-lg font-bold text-[#2B1A24]">FAQ</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 md:p-8 shadow-soft">
          <h2 className="font-serif text-2xl font-bold text-[#2B1A24] mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-[#FAD4DD] bg-white overflow-hidden">
                <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-[#FFF6F6] transition-colors">
                  <span className="text-sm font-bold text-[#2B1A24]">{faq.q}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-[#E8546B] transition-transform duration-300 ${openIdx === i ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {openIdx === i && (
                  <div className="border-t border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-sm text-[#6B5558]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}