"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DEALS_DATA } from "@/components/SearchFilter";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedDeals } from "@/contexts/SavedDealsContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function mapApiDealToCard(d) {
  return {
    id: d.id,
    category: d.category || "Restaurants",
    merchantName: d.merchantName || d.merchant_name || d.title || "",
    title: d.title || "",
    description: d.description || "",
    place: d.city || "",
    image: d.imageUrl || "/placeholder.png",
    priceOriginal: Number.isFinite(Number(d.oldPrice)) ? Number(d.oldPrice) : undefined,
    priceCurrent: Number.isFinite(Number(d.newPrice)) ? Number(d.newPrice) : undefined,
    expiresAt: d.expiresAt || undefined,
    url: d.deepLink || undefined,
  };
}

const toSlug = (s) => String(s || "deal").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function DealDetailPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { isSaved, toggle } = useSavedDeals();
  const routeParams = useParams();
  const slugParam = String(routeParams.slug || "");
  const [deal, setDeal] = useState(null);
  const [shareTip, setShareTip] = useState("");
  // No pageUrl state; compute on demand to satisfy eslint rules

  const trackInterestClick = async (dealId) => {
    if (!dealId) return;
    try {
      const url = `${API_BASE}/deals/interest`;
      const payload = { dealId };
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      await fetch(url, { method: "POST", headers, body: JSON.stringify(payload), keepalive: true });
    } catch {}
  };

  useEffect(() => {
    let didCancel = false;
    async function load() {
      // Try local fallback first for immediate paint
      const local = DEALS_DATA.find((d) => toSlug(d.title || d.merchantName) === slugParam);
      if (local && !didCancel) setDeal(local);
      try {
        const res = await fetch(`${API_BASE}/admin/public/deals`);
        const data = await res.json();
        if (!didCancel && res.ok && Array.isArray(data.deals)) {
          const mapped = data.deals.map(mapApiDealToCard);
          const bySlug = mapped.find((d) => toSlug(d.title || d.merchantName) === slugParam);
          if (bySlug) setDeal(bySlug);
          else {
            const maybeId = Number(slugParam);
            if (Number.isFinite(maybeId)) {
              const byId = mapped.find((d) => Number(d.id) === maybeId);
              if (byId) setDeal(byId);
            }
          }
        }
      } catch {}
    }
    load();
    return () => { didCancel = true; };
  }, [slugParam]);

  // removed pageUrl state effect

  if (!deal) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-foreground/70">Deal not found.</p>
        <div className="mt-4">
          <Link href="/" className="rounded-md bg-primary text-white px-4 py-2 text-sm">Back home</Link>
        </div>
      </main>
    );
  }

  const formatNaira = (value) => {
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
    } catch {
      return `₦${Number(value).toLocaleString()}`;
    }
  };

  const original = Math.max(deal.priceOriginal ?? 0, deal.priceCurrent ?? 0);
  const current = Math.min(deal.priceOriginal ?? 0, deal.priceCurrent ?? 0);
  const percent = original > 0 ? Math.floor(((original - current) / original) * 100) : null;

  const saved = isSaved(deal.id);

  const getBaseOrigin = () => {
    const envBase = (process.env.NEXT_PUBLIC_WEB_URL || "").replace(/\/+$/, "");
    if (envBase) return envBase;
    if (typeof window !== "undefined") return window.location.origin;
    return "http://localhost:3000";
  };
  const getReferralUrl = () => {
    const origin = getBaseOrigin();
    const slug = toSlug(deal?.title || deal?.merchantName || slugParam);
    const base = `${origin}/deal/${encodeURIComponent(slug)}`;
    const ref = user?.id;
    return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base;
  };
  const getShareUrl = () => getReferralUrl();
  const handleInstagramShare = async () => {
    const u = getReferralUrl();
    try {
      if (navigator.share) {
        await navigator.share({ title: deal?.title || "", text: deal?.title || "", url: u });
        setShareTip("Shared");
        setTimeout(() => setShareTip(""), 2000);
        return;
      }
    } catch {}
    try {
      if (navigator.clipboard && u) await navigator.clipboard.writeText(u);
    } catch {}
    setShareTip("Link copied. Paste in Instagram.");
    try { window.open("https://www.instagram.com/", "_blank"); } catch {}
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative rounded-2xl overflow-hidden border border-foreground/10 shadow-sm">
          <Image src={deal.image} alt={deal.title} width={1200} height={800} className="w-full h-[320px] sm:h-[420px] object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
          {percent !== null && percent > 0 && (
            <div className="absolute top-3 left-3 z-10">
              <div className="relative">
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg">
                  {percent}% OFF
                </div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
              </div>
            </div>
          )}
          {original > 0 && current >= 0 && original > current && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold shadow">
              Save {formatNaira(original - current)}
            </span>
          )}
          <button
            onClick={async () => {
              try {
                await fetch(`${API_BASE}/deals/save`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                  body: JSON.stringify({ dealId: deal.id, dealTitle: deal.title, dealData: deal }),
                });
              } catch {}
              toggle(deal);
            }}
            className="absolute top-3 right-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-shadow shadow-lg hover:shadow-xl"
            aria-pressed={saved}
            aria-label={saved ? "Unsave deal" : "Save deal"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`h-5 w-5 ${saved ? "text-red-500 fill-current" : "text-gray-700"}`} fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">{deal.title}</h1>
          {deal.place && <p className="text-sm text-foreground/60 mt-1">{deal.place}</p>}
          <p className="mt-3 text-foreground/80">{deal.description}</p>

          {(deal.priceOriginal || deal.priceCurrent) && (
            <div className="mt-6 flex items-end gap-3">
              {current ? <span className="text-2xl font-bold text-primary">{formatNaira(current)}</span> : null}
              {original ? <span className="text-lg text-foreground/60 line-through">{formatNaira(original)}</span> : null}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3 items-center">
            {deal.url ? (
              <a href={deal.url} target="_blank" rel="noopener noreferrer" onClick={() => trackInterestClick(deal.id)} className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-5 py-2 text-sm hover:brightness-110 shadow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                <span>Get deal</span>
              </a>
            ) : (
              <button className="rounded-full bg-primary/60 text-white px-5 py-2 text-sm cursor-not-allowed">Get Offer</button>
            )}
            <button onClick={() => router.push("/#hot-deals")} className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-5 py-2 text-sm hover:bg-foreground/5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              <span>Back to deals</span>
            </button>
          </div>

          
        </div>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${deal.title} ${getReferralUrl()}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-[#25D366] text-white hover:brightness-110"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.94 14.5L2 22l5.6-1.47A10 10 0 1 0 12 2Zm5.2 14.18c-.22.6-1.29 1.18-1.8 1.25-.48.07-1.08.07-1.74-.11-3.06-.86-5.02-3.57-5.18-3.74-.15-.18-1.23-1.64-1.23-3.14s.77-2.22 1.05-2.52c.28-.3.61-.38.81-.38h.58c.19.01.44.02.66.5.22.47.74 1.82.8 1.95.07.13.11.28.02.46-.09.18-.14.29-.27.44-.13.15-.29.34-.42.46-.14.15-.29.31-.12.61.18.29.79 1.29 1.7 2.09 1.17 1.02 2.15 1.34 2.46 1.49.31.15.49.13.67-.08.18-.21.77-.9.98-1.2.21-.3.41-.25.68-.15.27.1 1.74.82 2.04.97.3.15.5.23.58.35.08.12.08.66-.14 1.26Z"/></svg>
          <span>WhatsApp</span>
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getReferralUrl())}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-[#1877F2] text-white hover:brightness-110"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.16 1.8.16v2h-1c-1 0-1.3.62-1.3 1.26V12h2.2l-.35 3h-1.85v7A10 10 0 0 0 22 12Z"/></svg>
          <span>Facebook</span>
        </a>
        <button
          onClick={handleInstagramShare}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white hover:brightness-110"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 2.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm6.5-.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z"/></svg>
          <span>Instagram</span>
        </button>
        {shareTip && <div className="w-full text-center text-sm text-foreground/70 mt-2">{shareTip}</div>}
      </div>
    </main>
  );
}
