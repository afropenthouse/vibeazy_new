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
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const [perPage, setPerPage] = useState(4);

  // Update items per page based on screen size
  useEffect(() => {
    const updatePerPage = () => {
      if (window.innerWidth < 640) { // sm breakpoint
        setPerPage(1);
      } else if (window.innerWidth < 768) { // md breakpoint
        setPerPage(2);
      } else if (window.innerWidth < 1024) { // lg breakpoint
        setPerPage(3);
      } else { // xl and above
        setPerPage(4);
      }
    };

    updatePerPage();
    window.addEventListener('resize', updatePerPage);
    return () => window.removeEventListener('resize', updatePerPage);
  }, []);

  const visible = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return [];
    const out = [];
    for (let i = 0; i < perPage; i++) {
      if (items[(start + i) % items.length]) {
        out.push(items[(start + i) % items.length]);
      }
    }
    return out;
  }, [items, start, perPage]);

  useEffect(() => {
    if (paused || items.length === 0 || perPage >= items.length) return;
    const id = setInterval(() => {
      setStart((s) => (s + perPage) % items.length);
    }, 5000);
    return () => clearInterval(id);
  }, [paused, items.length, perPage]);

  const go = (dir) => {
    setStart((s) => {
      const newStart = s + (dir > 0 ? perPage : -perPage);
      if (newStart < 0) return items.length - perPage;
      return newStart % items.length;
    });
  };

  const canGoNext = items.length > perPage;
  const canGoPrev = start > 0;

  return (
    <section className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold px-2 sm:px-0">{title}</h2>
        
        {/* Navigation buttons - hidden on mobile if not enough items */}
        {items.length > 1 && (
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => go(-1)}
              disabled={!canGoPrev}
              className={`inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-300 ${
                canGoPrev 
                  ? "bg-white text-slate-700 hover:bg-slate-100" 
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => go(1)}
              disabled={!canGoNext}
              className={`inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-300 ${
                canGoNext
                  ? "bg-white text-slate-700 hover:bg-slate-100" 
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="m9 6 6 6-6 6"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      
      <div 
        className="overflow-hidden" 
        onMouseEnter={() => setPaused(true)} 
        onMouseLeave={() => setPaused(false)}
      >
        {/* Mobile: single column, Tablet: 2 columns, Desktop: 3-4 columns */}
        <div className={`
          grid gap-3 sm:gap-4
          ${perPage === 1 ? "grid-cols-1" : ""}
          ${perPage === 2 ? "grid-cols-2" : ""}
          ${perPage === 3 ? "grid-cols-2 lg:grid-cols-3" : ""}
          ${perPage === 4 ? "grid-cols-2 lg:grid-cols-4" : ""}
        `}>
          {visible.map((item, idx) => (
            <div key={`${item.id}-${start}-${idx}`} className="w-full">
              <DiscountCard item={item} compact={compact} />
            </div>
          ))}
        </div>
        
        {/* Mobile dots indicator */}
        {items.length > perPage && perPage === 1 && (
          <div className="flex justify-center mt-4 sm:mt-6 space-x-2">
            {Array.from({ length: Math.min(5, Math.ceil(items.length / perPage)) }).map((_, index) => {
              const pageIndex = Math.floor(start / perPage);
              const dotIndex = index;
              const isActive = pageIndex === dotIndex;
              
              return (
                <button
                  key={dotIndex}
                  onClick={() => setStart(dotIndex * perPage)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isActive ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${dotIndex + 1}`}
                />
              );
            })}
          </div>
        )}
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
    <div className="bg-white">
      {topDiscounts.length > 0 && (
        <Carousel title="Top Deals" items={topDiscounts} compact={true} />
      )}
    </div>
  );
}