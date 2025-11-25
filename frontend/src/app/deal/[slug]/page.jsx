"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DEALS_DATA } from "@/components/SearchFilter";
import { useAuth } from "@/contexts/AuthContext";

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
    priceOriginal: typeof d.oldPrice === "number" ? d.oldPrice : undefined,
    priceCurrent: typeof d.newPrice === "number" ? d.newPrice : undefined,
    expiresAt: d.expiresAt || undefined,
    url: d.deepLink || undefined,
  };
}

const toSlug = (s) => String(s || "deal").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function DealDetailPage() {
  const router = useRouter();
  const { token } = useAuth();
  const routeParams = useParams();
  const slugParam = String(routeParams.slug || "");
  const [deal, setDeal] = useState(null);
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

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative rounded-2xl overflow-hidden border border-foreground/10 shadow-sm">
          <Image src={deal.image} alt={deal.title} width={1200} height={800} className="w-full h-[320px] sm:h-[420px] object-cover" />
          {percent !== null && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold shadow">
              {percent}% Off
            </span>
          )}
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
                <span>Get Offer</span>
              </a>
            ) : (
              <button className="rounded-full bg-primary/60 text-white px-5 py-2 text-sm cursor-not-allowed">Get Offer</button>
            )}
            <button onClick={() => router.push("/#hot-deals")} className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-5 py-2 text-sm hover:bg-foreground/5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              <span>Back to deals</span>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${deal.title} ${deal.url || (typeof window !== "undefined" ? window.location.href : "")}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-[#25D366] text-white hover:brightness-110"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.94 14.5L2 22l5.6-1.47A10 10 0 1 0 12 2Zm5.2 14.18c-.22.6-1.29 1.18-1.8 1.25-.48.07-1.08.07-1.74-.11-3.06-.86-5.02-3.57-5.18-3.74-.15-.18-1.23-1.64-1.23-3.14s.77-2.22 1.05-2.52c.28-.3.61-.38.81-.38h.58c.19.01.44.02.66.5.22.47.74 1.82.8 1.95.07.13.11.28.02.46-.09.18-.14.29-.27.44-.13.15-.29.34-.42.46-.14.15-.29.31-.12.61.18.29.79 1.29 1.7 2.09 1.17 1.02 2.15 1.34 2.46 1.49.31.15.49.13.67-.08.18-.21.77-.9.98-1.2.21-.3.41-.25.68-.15.27.1 1.74.82 2.04.97.3.15.5.23.58.35.08.12.08.66-.14 1.26Z"/></svg>
              <span>WhatsApp</span>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(deal.url || (typeof window !== "undefined" ? window.location.href : ""))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-[#1877F2] text-white hover:brightness-110"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.16 1.8.16v2h-1c-1 0-1.3.62-1.3 1.26V12h2.2l-.35 3h-1.85v7A10 10 0 0 0 22 12Z"/></svg>
              <span>Facebook</span>
            </a>
            <a
              href={deal.url || (typeof window !== "undefined" ? window.location.href : "")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white hover:brightness-110"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 2.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm6.5-.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z"/></svg>
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>

      
    </main>
  );
}
