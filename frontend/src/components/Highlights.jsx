"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import DiscountCard from "@/components/DiscountCard";
import { DEALS_DATA } from "@/components/SearchFilter";

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
        const res = await fetch(`${API_BASE}/admin/public/deals`);
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
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        {/* arrows removed to match marquee-style behavior */}
      </div>
      <div className="overflow-hidden">
        <div className="carousel-track" aria-hidden="false">
          {[...items, ...items].map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className={(compact
                ? "min-w-[80px] sm:min-w-[80px] lg:min-w-[100px]"
                : "min-w-[260px] sm:min-w-[300px] lg:min-w-[140px]") + " mr-4 inline-block align-top"}
            >
              <DiscountCard item={item} compact={compact} />
            </div>
          ))}
        </div>
        <style jsx>{`
          .carousel-track {
            display: inline-block;
            white-space: nowrap;
            will-change: transform;
            animation: carousel-marquee 22s linear infinite;
          }
          .carousel-track:hover { animation-play-state: paused; }
          @keyframes carousel-marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </section>
  );
}

export default function Highlights() {
  const deals = useDeals();

  const popularNow = useMemo(() => {
    // Heuristic: highest percent discount first, then most recently approved
    const percent = (d) => {
      const o = Number(d.priceOriginal);
      const n = Number(d.priceCurrent);
      if (!Number.isFinite(o) || !Number.isFinite(n) || o <= 0 || n <= 0) return 0;
      return Math.floor(((o - n) / o) * 100);
    };
    const arr = deals.slice();
    arr.sort((a, b) => {
      const pa = percent(a);
      const pb = percent(b);
      if (pb !== pa) return pb - pa; // higher discount first
      const ta = a.approvedAt ? Date.parse(a.approvedAt) : (a.createdAt ? Date.parse(a.createdAt) : 0);
      const tb = b.approvedAt ? Date.parse(b.approvedAt) : (b.createdAt ? Date.parse(b.createdAt) : 0);
      return tb - ta; // newer first
    });
    // Diversify: take at most 2 per category
    const perCat = 2;
    const max = 16;
    const counts = {};
    const out = [];
    for (const d of arr) {
      const cat = String(d.category || "").toLowerCase();
      const c = counts[cat] || 0;
      if (c < perCat) {
        out.push(d);
        counts[cat] = c + 1;
        if (out.length >= max) break;
      }
    }
    return out;
  }, [deals]);
  // Avoid calling impure `Date.now()` during render/useMemo. Capture a
  // stable `now` value in an effect and feed it into the memo.
  const [now, setNow] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);

  const expiringSoon = useMemo(() => {
    if (!now) return [];
    const TEN_DAYS = 10 * 24 * 60 * 60 * 1000;
    const withExpiry = deals.filter((d) => d.expiresAt && !isNaN(Date.parse(d.expiresAt)));
    const withinTenDays = withExpiry.filter((d) => {
      const t = Date.parse(d.expiresAt);
      const diff = t - now;
      return diff > 0 && diff <= TEN_DAYS;
    });
    const arr = withinTenDays.slice();
    arr.sort((a, b) => {
      const ta = Date.parse(a.expiresAt);
      const tb = Date.parse(b.expiresAt);
      return ta - tb; // soonest expiry first
    });
    return arr.slice(0, 16);
  }, [deals, now]);

  return (
    <div>
      {popularNow.length > 0 && (
        <Carousel title="Popular Now" items={popularNow} compact />
      )}
      {expiringSoon.length > 0 && (
        <Carousel title="Expiring Soon" items={expiringSoon} compact />
      )}
    </div>
  );
}