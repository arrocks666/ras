"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Orders usually arrive within 10-15 working days after payment confirmation. You'll receive tracking updates via email and on your order page.",
  },
  {
    q: "How do I pay for my order?",
    a: "We accept bKash, Nagad, Bank Transfer, and Cash on Delivery. You can choose your preferred method at checkout.",
  },
  {
    q: "Can I return or exchange a product?",
    a: "Yes! If the product is damaged or not as described, you can return it within 7 days of delivery. Contact us on WhatsApp to start the process.",
  },
  {
    q: "Is shipping charged separately?",
    a: "Shipping is calculated based on the product weight and delivery location. It's added after your order is placed and inspected.",
  },
  {
    q: "How do I track my order?",
    a: "Go to 'My Orders' from your account, tap on any order, and you'll see the live tracking timeline.",
  },
  {
    q: "What if I want a product that's not on the site?",
    a: "Contact us on WhatsApp with an image or link. We'll find it on 1688 and add it to our store for you!",
  },
  {
    q: "Do you offer cash on delivery?",
    a: "Yes, Cash on Delivery is available for most areas in Bangladesh. Note that the shipping charge will be collected on delivery.",
  },
  {
    q: "How can I contact customer support?",
    a: "The fastest way is WhatsApp. You can also email us at hello@ratrysartistry.com. We reply within 24 hours.",
  },
];

export default function HelpPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-24 md:pb-10">
      
      {/* HEADER */}
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.push("/")} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="flex-1 text-lg font-bold text-[#2B1A24] md:text-xl">Help & FAQ</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12 space-y-6 animate-fade-in">
        
        {/* HERO */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <span className="text-3xl">❓</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2B1A24]">How can we help?</h2>
          <p className="mt-2 text-sm text-[#6B5558]">Browse our most common questions below.</p>
        </div>

        {/* FAQ ACCORDION */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="rounded-2xl border border-[#FAD4DD] bg-white shadow-sm overflow-hidden transition-all">
                <button onClick={() => setOpenIndex(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-[#FFF6F6] transition-colors">
                  <span className="text-sm md:text-base font-bold text-[#2B1A24]">{faq.q}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 text-[#E8546B] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {isOpen && (
                  <div className="border-t border-[#FAD4DD] bg-[#FFF6F6] px-5 py-4 text-sm text-[#6B5558] leading-relaxed animate-fade-down">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* STILL NEED HELP */}
        <div className="rounded-3xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] p-8 text-center shadow-lg mt-8">
          <h3 className="font-serif text-xl font-bold text-white mb-2">Still need help?</h3>
          <p className="text-white/90 text-sm mb-5">Our team is one message away.</p>
          <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#E8546B] shadow-md hover:scale-105 transition-transform">
            💬 Chat on WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}