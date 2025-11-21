"use client";
import { useState, useMemo, Suspense, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Hero from "@/components/Hero";
import SearchFilter from "@/components/SearchFilter";
import Highlights from "@/components/Highlights";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [welcomeClosed, setWelcomeClosed] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [subscribeSuccess, setSubscribeSuccess] = useState("");
  const showWelcome = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("welcome") === "1" && isAuthenticated && !welcomeClosed;
  }, [isAuthenticated, welcomeClosed]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSubscribeOpen(true);
    }
  }, [isAuthenticated]);

  // Removed auto-scroll so carousels under Hero remain visible on load

  const closeWelcome = () => {
    setWelcomeClosed(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const closeSubscribe = () => {
    setSubscribeOpen(false);
  };

  const submitEmail = async (e) => {
    e?.preventDefault?.();
    setSubscribeError("");
    setSubscribeSuccess("");
    const val = String(email || "").trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (!ok) { setSubscribeError("Enter a valid email"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: val }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Subscription failed");
      setSubscribeSuccess("Thanks! We’ll send you top deals.");
      setTimeout(() => setSubscribeOpen(false), 1200);
    } catch (err) {
      setSubscribeError(err.message || "Failed to subscribe");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main>
      <Hero />
      {/* Highlights carousels */}
      <Highlights />

      {/* Search + Filter + List */}
      <Suspense fallback={null}>
        <SearchFilter />
      </Suspense>

      {/* Welcome modal overlay */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold">Welcome{user?.name ? `, ${user.name}` : "!"}</h2>
            <p className="text-foreground/70 mt-2">You’re signed in. Explore today’s deals below.</p>
            <div className="mt-4 flex items-center gap-3">
              <a href="#hot-deals" className="rounded-md bg-primary text-white px-4 py-2 text-sm hover:brightness-110">Browse Deals</a>
              <Link href="/saved" className="rounded-md border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5">Saved Deals</Link>
              <button onClick={closeWelcome} className="rounded-md border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5">Close</button>
            </div>
          </div>
        </div>
      )}

      {!isAuthenticated && subscribeOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="absolute top-3 right-3">
              <button onClick={closeSubscribe} aria-label="Close" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">✕</button>
            </div>
            <div className="px-6 pt-8 pb-6">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center">
                <span className="text-2xl">📬</span>
              </div>
              <h2 className="text-2xl font-bold mt-4">Get top deals by email</h2>
              <p className="text-foreground/70 mt-2">Be the first to get deals.</p>
              {subscribeError && (
                <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-red-700 text-sm">{subscribeError}</div>
              )}
              {subscribeSuccess && (
                <div className="mt-3 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-green-700 text-sm">{subscribeSuccess}</div>
              )}
              <form onSubmit={submitEmail} className="mt-4 space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <div className="flex items-center justify-between">
                  <a href="/subscribe" className="text-sm text-foreground/60 hover:text-foreground"></a>
                  <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-[#6d0e2b] text-white hover:bg-[#5a0b23] disabled:opacity-50">
                    {submitting ? "Subscribing..." : "Subscribe"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
