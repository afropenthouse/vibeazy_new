"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function formatNaira(n) {
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₦${Number(n).toLocaleString()}`;
  }
}

export default function WalletPage() {
  const { token, user, isAuthenticated } = useAuth();
  const [balanceKobo, setBalanceKobo] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [copied, setCopied] = useState("");

  const origin = useMemo(() => {
    const envBase = (process.env.NEXT_PUBLIC_WEB_URL || "").replace(/\/+$/, "");
    if (envBase) return envBase;
    if (typeof window !== "undefined") return window.location.origin;
    return "http://localhost:3000";
  }, []);
  const generalReferral = useMemo(() => {
    const ref = user?.id;
    const base = `${origin}/`;
    return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base;
  }, [origin, user?.id]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        if (!token) throw new Error("Login required");
        const res = await fetch(`${API_BASE}/wallet/me`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          const bk = Number(data?.wallet?.balanceKobo ?? data?.balanceKobo ?? 0);
          setBalanceKobo(Number.isFinite(bk) ? bk : 0);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load wallet");
      }
      try {
        if (!token) return;
        const res = await fetch(`${API_BASE}/wallet/transactions`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          const list = Array.isArray(data?.transactions) ? data.transactions : [];
          setTransactions(list);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(generalReferral);
      setCopied("Link copied");
      setTimeout(() => setCopied(""), 2000);
    } catch {}
  };

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-foreground/10 bg-background p-8 text-center">
          <h1 className="text-2xl font-bold">Wallet</h1>
          <p className="text-foreground/70 mt-2">Login to view earnings and withdrawals.</p>
          <div className="mt-6">
            <Link href="/login?next=/wallet" className="rounded-md bg-primary text-white px-5 py-2">Login</Link>
          </div>
        </div>
      </main>
    );
  }

  const naira = Math.floor(balanceKobo / 100);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <span className="text-sm text-foreground/60">Member: {user?.name || user?.email}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-foreground/10 bg-background p-6">
          <p className="text-sm text-foreground/60">Balance</p>
          <div className="mt-2 text-3xl font-extrabold">{formatNaira(naira)}</div>
          <p className="text-xs text-foreground/60 mt-1">₦10 credited per claim via your link</p>
          <div className="mt-4 flex items-center gap-3">
            <button className="rounded-md bg-foreground/10 text-foreground px-4 py-2 cursor-not-allowed">Withdraw (soon)</button>
          </div>
        </div>

        <div className="rounded-2xl border border-foreground/10 bg-background p-6">
          <p className="text-sm text-foreground/60">Your referral link</p>
          <div className="mt-2 break-all text-sm">{generalReferral}</div>
          <div className="mt-4 flex items-center flex-wrap gap-2">
            <button onClick={copyReferral} className="inline-flex items-center gap-2 rounded-md bg-foreground/10 text-foreground px-4 py-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 17a3 3 0 010-6h3a3 3 0 010 6H8zm8-4a3 3 0 00-3-3h-1V8h1a5 5 0 010 10h-1v-2h1a3 3 0 003-3z"/></svg>
              <span>Copy</span>
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(generalReferral)}`} target="_blank" rel="noopener noreferrer" className="rounded-md bg-[#25D366] text-white px-4 py-2 text-sm">WhatsApp</a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generalReferral)}`} target="_blank" rel="noopener noreferrer" className="rounded-md bg-[#1877F2] text-white px-4 py-2 text-sm">Facebook</a>
            <button onClick={async()=>{ try{ if(navigator.share){ await navigator.share({ title:"VibeEazy", url: generalReferral }); } else { await navigator.clipboard.writeText(generalReferral); } setCopied("Shared"); setTimeout(()=>setCopied(""),2000);}catch{}}} className="rounded-md bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white px-4 py-2 text-sm">Instagram</button>
          </div>
          {copied && <div className="text-xs text-foreground/60 mt-2">{copied}</div>}
        </div>

        <div className="rounded-2xl border border-foreground/10 bg-background p-6">
          <p className="text-sm text-foreground/60">How it works</p>
          <ul className="mt-2 text-sm text-foreground/80 space-y-1">
            <li>Share any deal from VibeEazy.</li>
            <li>Each claim through your link credits ₦10.</li>
            <li>Payouts become available after verification.</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-foreground/10 bg-background">
        <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          {loading && <span className="text-sm text-foreground/60">Loading…</span>}
        </div>
        {transactions.length === 0 ? (
          <div className="p-6 text-foreground/70 text-sm">No transactions yet</div>
        ) : (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-foreground/60">
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Amount</th>
                  <th className="text-left px-3 py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => {
                  const amt = Number(t?.amountKobo ?? 0) / 100;
                  const dt = t?.createdAt ? new Date(t.createdAt) : null;
                  const dateStr = dt ? dt.toLocaleString() : "";
                  return (
                    <tr key={i} className="border-t border-foreground/10">
                      <td className="px-3 py-2">{dateStr}</td>
                      <td className="px-3 py-2">{t?.type || "credit"}</td>
                      <td className="px-3 py-2">{formatNaira(amt)}</td>
                      <td className="px-3 py-2">{t?.note || t?.description || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {error && <div className="px-6 py-3 text-red-600 text-sm">{error}</div>}
      </div>
    </main>
  );
}

