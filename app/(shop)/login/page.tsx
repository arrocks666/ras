"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(phone, password);
      router.push("/");
    } catch (err: any) {
      console.error(err);
      // Clean up Firebase error messages
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Invalid phone number or password.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this phone number.");
      } else {
        setError(err.message || "Failed to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF6F6] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8546B] to-[#FF8B9A] text-2xl font-bold text-white shadow-lg mb-4">
            R
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#2B1A24]">Welcome Back</h1>
          <p className="mt-2 text-sm text-[#6B5558]">Login to your account to continue shopping.</p>
        </div>

        {/* LOGIN CARD */}
        <div className="rounded-3xl border border-[#FAD4DD] bg-white p-6 md:p-8 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none focus:ring-2 focus:ring-[#E8546B]/20 transition-all"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* FORGOT PASSWORD LINK */}
          <div className="mt-4 text-center">
            <Link href="/reset-password" className="text-xs font-bold text-[#E8546B] hover:underline">
              Forgot Password?
            </Link>
          </div>
        </div>

        {/* SIGNUP LINK */}
        <p className="mt-6 text-center text-sm text-[#6B5558]">
          Don't have an account?{" "}
          <Link href="/signup" className="font-bold text-[#E8546B] hover:underline">
            Sign Up
          </Link>
        </p>

        {/* TERMS */}
        <p className="mt-8 text-center text-[10px] text-[#A88F92]">
          By logging in, you agree to our{" "}
          <Link href="/terms" className="hover:text-[#E8546B] underline">Terms</Link>
          {" & "}
          <Link href="/privacy" className="hover:text-[#E8546B] underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}