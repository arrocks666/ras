"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-24 md:pb-10">
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="flex-1 text-lg font-bold text-[#2B1A24]">Privacy Policy</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 md:p-8 shadow-soft prose prose-sm max-w-none text-[#6B5558]">
          <h2 className="font-serif text-2xl font-bold text-[#2B1A24] mb-4">Privacy Policy</h2>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>At Ratry's Artistry Shop, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">1. Information We Collect</h3>
          <p>We collect your name, phone number, email, and delivery address when you place an order. We also collect payment information necessary to process your transaction.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">2. How We Use Your Information</h3>
          <p>Your information is used to process orders, communicate about your purchase, improve our services, and send promotional offers (if you subscribe).</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">3. Data Security</h3>
          <p>We implement industry-standard security measures to protect your data. Payments are processed through secure, encrypted channels.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">4. Sharing</h3>
          <p>We do not sell your personal information. We share data only with delivery partners and payment processors necessary to fulfill your order.</p>
          <h3 className="font-bold text-[#2B1A24] mt-6 mb-2">5. Contact</h3>
          <p>For any privacy concerns, contact us at support@ratrysartistry.com.</p>
        </div>
      </div>
    </div>
  );
}