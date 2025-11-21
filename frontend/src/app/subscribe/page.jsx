"use client";
import { useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const val = String(email || "").trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (!ok) { setError("Enter a valid email"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: val }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Subscription failed");
      setSuccess("Subscribed. We’ll send you top deals.");
      try { localStorage.setItem("emailSubscribeDone", "1"); } catch {}
    } catch (e) {
      setError(e.message || "Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-slate-50 py-10">
      <div className="mx-auto w-[95%] max-w-md">
        <div className="rounded-3xl bg-white shadow-2xl border border-white/70 p-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center">
            <span className="text-3xl">📬</span>
          </div>
          <h1 className="text-2xl font-bold mt-4">Get top deals by email</h1>
          <p className="text-foreground/70 mt-2">Enter your email to receive curated discounts.</p>
          {error && (<div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-red-700 text-sm">{error}</div>)}
          {success && (<div className="mt-3 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-green-700 text-sm">{success}</div>)}
          <form onSubmit={submit} className="mt-5 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <div className="flex items-center justify-between">
              <Link href="/" className="text-sm text-foreground/60 hover:text-foreground">Back to Home</Link>
              <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl bg-[#6d0e2b] text-white hover:bg-[#5a0b23] disabled:opacity-50">
                {loading ? "Subscribing..." : "Subscribe"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}