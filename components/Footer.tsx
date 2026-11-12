"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  loadSettings,
  DEFAULT_SETTINGS,
  DEFAULT_FOOTER_INFO_LINKS,
  DEFAULT_FOOTER_HELP_LINKS,
  type StoreSettings,
} from "@/lib/firestoreSettings";

export default function Footer() {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [fbId, setFbId] = useState("");
  const [igId, setIgId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { loadSettings().then(setSettings).catch(() => {}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbId && !igId) return;
    if (!user) {
      alert("Please login to claim your discount coupon.");
      return;
    }
    setLoading(true);
    try {
      // Save request to Firestore
      await updateDoc(doc(db, "users", user.uid), {
        followRequest: {
          fbId: fbId.trim(),
          igId: igId.trim(),
          status: "pending",
          requestedAt: serverTimestamp(),
        }
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const infoLinks = Array.isArray(settings.footerInfoLinks) && settings.footerInfoLinks.length > 0
    ? settings.footerInfoLinks : DEFAULT_FOOTER_INFO_LINKS;
  const helpLinks = Array.isArray(settings.footerHelpLinks) && settings.footerHelpLinks.length > 0
    ? settings.footerHelpLinks : DEFAULT_FOOTER_HELP_LINKS;

  return (
    <>
      <footer className="bg-gradient-to-b from-[#FFF6F6] to-[#FDE8EC] border-t border-[#FAD4DD] mt-20 pb-16 md:pb-0">
        
        {/* 🚨 NEW FOLLOW TO WIN BANNER 🚨 */}
        <div className="bg-[#E8546B] py-12">
          <div className="mx-auto max-w-[1400px] px-4 text-center">
            <h3 className="font-serif text-2xl md:text-4xl font-bold text-white mb-3">
              Follow us to get 10% Discount!
            </h3>
            <p className="text-white/90 text-sm md:text-base mb-6 max-w-lg mx-auto">
              Follow us on Facebook & Instagram, submit your ID, and get a special discount coupon directly in your account.
            </p>
            <button 
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#2B1A24] px-8 py-4 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
            >
              Follow & Claim Now
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>

        {/* Main — 4 columns */}
        <div className="mx-auto max-w-[1400px] px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            
            {/* Column 1: Brand */}
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="logo" className="h-10 w-10 rounded-lg object-contain" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8546B] text-xl font-bold text-white">R</div>
                )}
                <div className="flex flex-col leading-none">
                  <span className="font-serif text-lg font-bold text-[#E8546B]">
                    {(settings.storeName || "Ratry's").split(" ")[0]}
                  </span>
                  <span className="text-[9px] font-bold tracking-[0.2em] text-[#2B1A24] uppercase">
                    {(settings.storeName || "Artistry Shop").split(" ").slice(1).join(" ")}
                  </span>
                </div>
              </Link>
              <p className="text-sm text-[#6B5558] leading-relaxed mb-4">
                {settings.footerDescription || "Your trusted gift shop bringing quality products from China directly to Bangladesh."}
              </p>
              <div className="flex items-center gap-2">
                {settings.facebookUrl && (
                  <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white hover:opacity-90 transition shadow-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {settings.instagramUrl && (
                  <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:opacity-90 transition shadow-sm" style={{ background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                )}
                {settings.whatsappNumber && (
                  <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white hover:opacity-90 transition shadow-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                )}
              </div>
            </div>

            {/* Column 2: Information */}
            <div>
              <h4 className="text-xs font-bold text-[#2B1A24] uppercase tracking-wider mb-4">Information</h4>
              <ul className="space-y-2.5 text-sm text-[#6B5558]">
                {infoLinks.map((link) => (
                  <li key={link.id}>
                    <Link href={link.href || "#"} className="hover:text-[#E8546B] transition">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Help & Support */}
            <div>
              <h4 className="text-xs font-bold text-[#2B1A24] uppercase tracking-wider mb-4">Help & Support</h4>
              <ul className="space-y-2.5 text-sm text-[#6B5558]">
                {helpLinks.map((link) => (
                  <li key={link.id}>
                    <Link href={link.href || "#"} className="hover:text-[#E8546B] transition">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div>
              <h4 className="text-xs font-bold text-[#2B1A24] uppercase tracking-wider mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-[#6B5558]">
                <li className="flex items-start gap-2"><span className="text-[#E8546B]">📍</span><span>{settings.contactAddress || "Dhaka, Bangladesh"}</span></li>
                <li className="flex items-start gap-2"><span className="text-[#E8546B]">📱</span><a href={`tel:${(settings.contactPhone || "").replace(/\s/g, "")}`} className="hover:text-[#E8546B]">{settings.contactPhone || "+880 1689-768307"}</a></li>
                <li className="flex items-start gap-2"><span className="text-[#E8546B]">✉️</span><a href={`mailto:${settings.contactEmail || ""}`} className="hover:text-[#E8546B] break-all">{settings.contactEmail || "support@ratrysartistry.com"}</a></li>
                <li className="flex items-start gap-2"><span className="text-[#E8546B]">⏰</span><span>{settings.contactHours || "Sat – Thu, 10AM – 8PM"}</span></li>
              </ul>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-12 border-t border-[#FAD4DD] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-[#6B5558] uppercase tracking-wider">We Accept:</span>
              <img src="https://i.ibb.co/vYyLhZ2/bkash.png" alt="bKash" className="h-8 w-auto object-contain" />
              <img src="https://i.ibb.co/3WpQgZm/nagad.png" alt="Nagad" className="h-8 w-auto object-contain" />
              <div className="flex items-center gap-1.5 rounded-lg border border-[#FAD4DD] bg-white px-3 py-1.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1A4F8A"><path d="M2 10h20v2H2zM2 14h20v2H2zM4 6h16v2H4zM12 2L2 6v2h20V6L12 2zM4 18h4v2H4zM10 18h4v2h-4zM16 18h4v2h-4z"/></svg>
                <span className="text-xs font-bold text-[#1A4F8A]">Bank</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-[#FAD4DD] bg-white px-3 py-1.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#2B1A24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>
                <span className="text-xs font-bold text-[#2B1A24]">COD</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[#FAD4DD] pt-6 text-center">
            <p className="text-xs text-[#A88F92]">© {new Date().getFullYear()} {settings.storeName || "Ratry's Artistry Shop"}. All rights reserved. Made with ♡ for Bangladesh 🇧🇩</p>
          </div>
        </div>
      </footer>

      {/* 🚨 FOLLOW TO WIN MODAL 🚨 */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={() => { if (!loading && !success) setIsOpen(false); }}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            
            {success ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">✅</div>
                <h2 className="text-xl font-bold text-[#2B1A24] mb-2">Request Submitted!</h2>
                <p className="text-sm text-[#6B5558] mb-6">Our admin will verify your follow and send a 10% discount coupon to your account shortly.</p>
                <button onClick={() => setIsOpen(false)} className="rounded-xl bg-[#E8546B] px-8 py-3 text-sm font-bold text-white shadow-md">Close</button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDE8EC] text-2xl">🎁</div>
                  <h2 className="text-xl font-bold text-[#2B1A24]">Claim Your 10% Discount</h2>
                  <p className="text-xs text-[#6B5558] mt-1">Step 1: Follow us. Step 2: Submit your ID.</p>
                </div>

                <div className="flex gap-3 mb-6">
                  {settings.facebookUrl && (
                    <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-[#1877F2]/10 py-3 hover:bg-[#1877F2]/20 transition">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      <span className="text-[10px] font-bold text-[#1877F2]">Follow Facebook</span>
                    </a>
                  )}
                  {settings.instagramUrl && (
                    <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-pink-50 py-3 hover:bg-pink-100 transition">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      <span className="text-[10px] font-bold text-[#E1306C]">Follow Instagram</span>
                    </a>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">Facebook ID / Link</label>
                    <input type="text" value={fbId} onChange={(e) => setFbId(e.target.value)} placeholder="e.g. @yourname" className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">Instagram ID / Link</label>
                    <input type="text" value={igId} onChange={(e) => setIgId(e.target.value)} placeholder="e.g. @yourname" className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none" />
                  </div>

                  <div className="rounded-xl bg-orange-50 p-3 text-[10px] font-medium text-orange-600">
                    ⚠️ Our admin will manually verify your follow. Once confirmed, a 10% discount coupon will be added to your account.
                  </div>

                  <button type="submit" disabled={loading || (!fbId && !igId)} className="w-full rounded-xl bg-[#E8546B] py-3.5 text-sm font-bold text-white shadow-md disabled:opacity-50">
                    {loading ? "Submitting..." : "Claim Discount"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}