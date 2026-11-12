"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid credentials");

      // Redirect to the dashboard
      router.push("/control-room/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#E8546B] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#6B46C1] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse"></div>

      <div className="w-full max-w-md relative z-10">
        
        <div className="text-center mb-10">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8546B] to-[#FF8B9A] text-3xl font-bold text-white shadow-[0_0_40px_rgba(232,84,107,0.4)] mb-6">
            R
          </div>
          <h1 className="font-serif text-3xl font-bold text-white tracking-wide">Admin Access</h1>
          <p className="mt-2 text-sm text-gray-400">Secure login for store management</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3.5 text-sm font-medium text-white placeholder-gray-600 focus:border-[#E8546B] focus:outline-none focus:ring-2 focus:ring-[#E8546B]/50 transition-all"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3.5 text-sm font-medium text-white placeholder-gray-600 focus:border-[#E8546B] focus:outline-none focus:ring-2 focus:ring-[#E8546B]/50 transition-all"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(232,84,107,0.4)] transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Enter Dashboard"}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[10px] text-gray-600 font-medium tracking-wider uppercase">
          Protected by Ratry's Security System
        </p>
      </div>
    </div>
  );
}