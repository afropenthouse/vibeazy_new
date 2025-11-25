"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import DiscountCard from "@/components/DiscountCard";
import { DEALS_DATA } from "@/components/SearchFilter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const toNumber = (v) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[\,\s]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

function mapApiDealToCard(d) {
  return {
    id: d.id,
    category: d.category || "Restaurants",
    merchantName: d.merchantName || d.merchant_name || d.title || "",
    title: d.title || "",
    description: d.description || "",
    place: d.city || "",
    image: d.imageUrl || "/placeholder.png",
    priceOriginal: toNumber(d.oldPrice),
    priceCurrent: toNumber(d.newPrice),
    discountPct: toNumber(d.discountPct),
    expiresAt: d.expiresAt || undefined,
    url: d.deepLink || d.deep_link || undefined,
    status: d.status || undefined,
    approvedAt: d.approvedAt || d.updatedAt || d.createdAt,
  };
}

function useDeals() {
  const [deals, setDeals] = useState([]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/admin/public/deals?paidOnly=true`);
        const data = await res.json();
        if (!cancelled) {
          if (res.ok && Array.isArray(data.deals) && data.deals.length > 0) {
            setDeals(data.deals.map(mapApiDealToCard));
          } else {
            setDeals(DEALS_DATA);
          }
        }
      } catch {
        if (!cancelled) setDeals(DEALS_DATA);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);
  return deals;
}

function Carousel({ title, items, compact = false }) {
  const perPage = 4;
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);

  const visible = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return [];
    const out = [];
    for (let i = 0; i < perPage; i++) {
      out.push(items[(start + i) % items.length]);
    }
    return out;
  }, [items, start]);

  useEffect(() => {
    if (paused || items.length === 0) return;
    const step = items.length > perPage ? perPage : 1;
    const id = setInterval(() => {
      setStart((s) => (s + step) % items.length);
    }, 7000);
    return () => clearInterval(id);
  }, [paused, items.length]);

  const go = (dir) => {
    const step = items.length > perPage ? perPage : 1;
    setStart((s) => (s + (dir > 0 ? step : -step) + items.length) % items.length);
  };
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => go(-1)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(1)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m9 6 6 6-6 6"/></svg>
          </button>
        </div>
      </div>
      <div className="overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="grid grid-cols-4 gap-4">
          {visible.map((item, idx) => (
            <div key={`${item.id}-${start}-${idx}`} className="w-full">
              <DiscountCard item={item} compact={compact} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Highlights() {
  const deals = useDeals();

  const topDiscounts = useMemo(() => {
    const percent = (d) => {
      const dp = Number(d.discountPct);
      if (Number.isFinite(dp) && dp > 0) return Math.floor(dp);
      const o = Number(d.priceOriginal);
      const n = Number(d.priceCurrent);
      if (!Number.isFinite(o) || !Number.isFinite(n) || o <= 0 || n <= 0 || n >= o) return 0;
      return Math.floor(((o - n) / o) * 100);
    };
    let arr = deals.slice();
    arr.sort((a, b) => {
      const pa = percent(a);
      const pb = percent(b);
      if (pb !== pa) return pb - pa;
      const ta = a.approvedAt ? Date.parse(a.approvedAt) : (a.createdAt ? Date.parse(a.createdAt) : 0);
      const tb = b.approvedAt ? Date.parse(b.approvedAt) : (b.createdAt ? Date.parse(b.createdAt) : 0);
      return tb - ta;
    });
    const perCat = 10;
    const counts = {};
    const out = [];
    for (const d of arr) {
      const cat = String(d.category || "").toLowerCase();
      const c = counts[cat] || 0;
      if (c < perCat) {
        out.push(d);
        counts[cat] = c + 1;
      }
    }
    return out;
  }, [deals]);

  return (
    <div>
      {topDiscounts.length > 0 && (
        <Carousel title="Top Deals" items={topDiscounts} compact={true} />
      )}
    </div>
  );
}
