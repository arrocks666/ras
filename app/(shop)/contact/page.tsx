"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadSettings, DEFAULT_SETTINGS, type StoreSettings } from "@/lib/firestoreSettings";
import { useEffect } from "react";

export default function ContactPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    loadSettings().then(setSettings).catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, opens WhatsApp with the message
    const phone = settings.whatsappChatNumber || "8801700000000";
    const text = `Hi! My name is ${form.name}. ${form.message} (Reply to: ${form.email})`;
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#FFF6F6] pb-24 md:pb-10">
      
      {/* HEADER */}
      <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white/95 backdrop-blur-md shadow-sm md:top-[60px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => router.push("/")} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24] hover:bg-[#FAD4DD] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="flex-1 text-lg font-bold text-[#2B1A24] md:text-xl">Contact Us</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12 space-y-6 animate-fade-in">
        
        {/* HERO */}
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2B1A24]">We'd love to hear from you</h2>
          <p className="mt-2 text-sm text-[#6B5558]">Questions, concerns, or just want to say hi? Reach out anytime.</p>
        </div>

        {/* CONTACT METHODS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href={`https://wa.me/${(settings.whatsappChatNumber || "").replace(/\D/g, "")}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group rounded-3xl border border-[#FAD4DD] bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl mb-4">💬</div>
            <h3 className="text-sm font-bold text-[#2B1A24] mb-1">WhatsApp</h3>
            <p className="text-xs text-[#6B5558]">Fastest response. Chat with us directly.</p>
            <p className="mt-3 text-xs font-bold text-green-600 group-hover:underline">Message Now →</p>
          </a>

          <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-2xl mb-4">📧</div>
            <h3 className="text-sm font-bold text-[#2B1A24] mb-1">Email</h3>
            <p className="text-xs text-[#6B5558]">For business inquiries and support.</p>
            <p className="mt-3 text-xs font-bold text-[#E8546B]">hello@ratrysartistry.com</p>
          </div>
        </div>

        {/* CONTACT FORM */}
        <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 md:p-8 shadow-soft">
          <h3 className="font-serif text-xl font-bold text-[#2B1A24] mb-5">Send us a message</h3>
          
          {sent ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✅</div>
              <h4 className="text-lg font-bold text-[#2B1A24]">Message sent!</h4>
              <p className="text-sm text-[#6B5558] mt-1">We'll get back to you on WhatsApp shortly.</p>
              <button onClick={() => { setSent(false); setForm({ name: "", email: "", message: "" }); }} className="mt-5 rounded-full bg-[#E8546B] px-6 py-2.5 text-sm font-bold text-white">Send Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">Your Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none focus:ring-2 focus:ring-[#E8546B]/20 transition-all" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">Your Email</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none focus:ring-2 focus:ring-[#E8546B]/20 transition-all" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">Message</label>
                <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none focus:ring-2 focus:ring-[#E8546B]/20 transition-all resize-none" />
              </div>
              <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] py-3.5 text-sm font-bold text-white shadow-md hover:scale-[1.01] transition-transform">
                Send via WhatsApp
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}