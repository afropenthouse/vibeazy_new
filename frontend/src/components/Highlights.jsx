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
                ? "min-w-[260px] sm:min-w-[280px] lg:min-w-[300px] w-[260px] sm:w-[280px] lg:w-[300px]"
                : "min-w-[360px] sm:min-w-[400px] lg:min-w-[440px] w-[360px] sm:w-[400px] lg:w-[440px]") + " mr-4 inline-block align-top"}
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
            /* make marquee slower for better readability */
            animation: carousel-marquee 70s linear infinite;
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
    const seventyFivePlus = arr.filter((d) => percent(d) >= 75);
    const source = seventyFivePlus.length ? seventyFivePlus : arr;
    const perCat = 2;
    const max = 20;
    const counts = {};
    const out = [];
    for (const d of source) {
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

  return (
    <div>
      {topDiscounts.length > 0 && (
        <Carousel title="Top Deals" items={topDiscounts} compact={true} />
      )}
    </div>
  );
}