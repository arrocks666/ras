"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SUPPORT_WHATSAPP = "8801689768307";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = phone.replace(/\D/g, "");
    if (normalized.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }

    setSending(true);
    try {
      // Only logs the request for the admin — no Firebase password reset is used.
      await addDoc(collection(db, "password_reset_requests"), {
        phone: normalized,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setSent(true);
    } catch {
      // Even if the log fails, the customer still gets the WhatsApp route.
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const waLink = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
    `Hi, I forgot my password. My phone number is ${phone || "____"}. Please reset it for me.`
  )}`;

  return (
    <div className="min-h-screen bg-[#FFF6F6] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8546B] to-[#FF8B9A] text-2xl font-bold text-white shadow-lg mb-4">
            R
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2B1A24]">Forgot Password?</h1>
          <p className="mt-2 text-sm text-[#6B5558]">
            For your security, passwords are reset by our team.
          </p>
        </div>

        <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 md:p-8 shadow-soft">
          {sent ? (
            <div className="text-center py-2 animate-fade-in">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">✅</div>
              <h2 className="text-lg font-bold text-[#2B1A24]">Request received</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6B5558]">
                Now message us on WhatsApp with your phone number{" "}
                <span className="font-bold text-[#2B1A24]">{phone}</span> and our admin will reset your
                password for you.
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-90"
              >
                💬 Contact Admin on WhatsApp
              </a>
              <button
                onClick={() => router.push("/login")}
                className="mt-3 w-full rounded-xl border-2 border-[#FAD4DD] py-3 text-sm font-bold text-[#6B5558]"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-xl bg-[#FFF6F6] border border-[#FAD4DD] px-4 py-3">
                <p className="text-[11px] font-semibold leading-relaxed text-[#6B5558]">
                  Enter your phone number and we&apos;ll show you exactly how to reach the admin to
                  get a new password.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none focus:ring-2 focus:ring-[#E8546B]/20 transition-all"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] py-3.5 text-sm font-bold text-white shadow-md disabled:opacity-50"
              >
                {sending ? "Sending…" : "Request Password Reset"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[#6B5558]">
          Remember your password?{" "}
          <Link href="/login" className="font-bold text-[#E8546B] hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
