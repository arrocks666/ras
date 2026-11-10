"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simple hardcoded check (matches your current setup)
    if (username === "admin" && password === "admin123") {
      document.cookie = "ras_admin_session=authenticated; path=/; max-age=86400";
      router.push("/admin-panel/dashboard");
      router.refresh();
    } else {
      setError("Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF6F6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-[#FAD4DD] bg-white p-6 shadow-xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8546B] text-2xl font-bold text-white shadow-orange-glow">R</div>
            <h1 className="mt-4 font-serif text-xl font-bold text-[#2B1A24]">Admin Panel</h1>
            <p className="mt-1 text-xs text-[#A88F92]">Ratry's Artistry Shop</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#6B5558]">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" autoComplete="username" autoFocus
                className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5 text-sm text-[#2B1A24] placeholder:text-[#A88F92] focus:border-[#E8546B] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#6B5558]">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password"
                className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5 text-sm text-[#2B1A24] placeholder:text-[#A88F92] focus:border-[#E8546B] focus:outline-none" />
            </div>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
            <button type="submit" disabled={loading || !username || !password}
              className="w-full rounded-lg bg-[#E8546B] py-3 text-sm font-semibold text-white shadow-orange-glow hover:bg-[#b02a58] disabled:opacity-40">
              {loading ? "Logging in..." : "Login to Admin Panel"}
            </button>
          </form>

          <p className="mt-6 text-center text-[10px] text-[#A88F92]">Username: admin · Password: admin123</p>
        </div>
      </div>
    </div>
  );
}