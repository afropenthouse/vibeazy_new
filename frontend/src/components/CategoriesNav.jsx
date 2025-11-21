"use client";
import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Icons from Icons8 CDN for consistent visuals
function CategoryIcon({ name, active = false }) {
  const n = String(name || "").toLowerCase();
  const color = active ? "ffffff" : "6b7280"; // white when active, slate when inactive
  const base = `https://img.icons8.com/material-outlined/24/${color}/`;
  let icon = "price-tag.png"; // default for "All"

  if (n.includes("restaurant") || n.includes("food")) icon = "restaurant.png";
  else if (n.includes("fashion")) icon = "clothes.png";
  else if (n.includes("electronic") || n.includes("gadget")) icon = "laptop.png";
  else if (n.includes("furniture") || n.includes("home")) icon = "armchair.png";
  else if (n.includes("beauty") || n.includes("spa")) icon = "spa.png";
  else if (n.includes("travel") || n.includes("hotel") || n.includes("airbnb")) icon = "bed.png";
  else if (n.includes("car") || n.includes("auto") || n.includes("automobile") || n.includes("vehicle")) icon = "car.png";
  else if (n.includes("gift")) icon = "gift.png";
  else if (n.includes("entertainment") || n.includes("event")) icon = "ticket.png";
  else if (n.includes("local")) icon = "marker.png";

  return (
    <img
      src={`${base}${icon}`}
      alt={name}
      width={16}
      height={16}
      loading="lazy"
      className="w-4 h-4 object-contain"
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}

export default function CategoriesNav() {
  const [cats, setCats] = React.useState([]);
  const [deals, setDeals] = React.useState([]);
  const params = useSearchParams();
  const activeCategory = params.get("category") || "All";

  const fetchCats = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/public/categories`);
      const data = await res.json();
      setCats(Array.isArray(data.categories) ? data.categories : []);
    } catch (e) {
      // silently ignore
    }
  }, []);

  React.useEffect(() => {
    fetchCats();
    const onUpdate = () => fetchCats();
    window.addEventListener("categoriesUpdated", onUpdate);
    return () => window.removeEventListener("categoriesUpdated", onUpdate);
  }, [fetchCats]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/admin/public/deals`);
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.deals)) {
          setDeals(data.deals);
        }
      } catch {}
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const counts = React.useMemo(() => {
    const list = deals || [];
    const fallbackCats = [
      { id: -1, name: "Food & Restaurants" },
      { id: -2, name: "Fashion & Clothing" },
      { id: -3, name: "Furniture & Home" },
      { id: -4, name: "Beauty & Spa" },
      { id: -5, name: "Gadgets & Electronics" },
      { id: -6, name: "Travel & Hotels" },
      { id: -7, name: "Entertainment & Events" },
    ];
    const nav = (cats.length ? cats : fallbackCats).map((c) => c.name);
    const mapShortToLabel = {
      Restaurants: "Food & Restaurants",
      Fashion: "Fashion & Clothing",
      Electronics: "Gadgets & Electronics",
      Furniture: "Furniture & Home",
      Beauty: "Beauty & Spa",
      Travel: "Travel & Hotels",
      Entertainment: "Entertainment & Events",
    };
    const out = { All: list.length };
    for (const d of list) {
      const raw = String(d.category || "").trim();
      const candidate = mapShortToLabel[raw] || raw;
      let key = candidate;
      if (!nav.includes(key)) {
        for (const n of nav) {
          const ln = n.toLowerCase();
          const rc = candidate.toLowerCase();
          if (ln.includes("restaurant") && rc.includes("restaurant")) { key = n; break; }
          if (ln.includes("fashion") && rc.includes("fashion")) { key = n; break; }
          if (ln.includes("electronic") && rc.includes("electronic")) { key = n; break; }
          if (ln.includes("furniture") && rc.includes("furniture")) { key = n; break; }
          if (ln.includes("beauty") && rc.includes("beauty")) { key = n; break; }
          if (ln.includes("hotel") && (rc.includes("hotel") || rc.includes("travel") || rc.includes("airbnb"))) { key = n; break; }
          if (ln.includes("event") && rc.includes("event")) { key = n; break; }
        }
      }
      out[key] = (out[key] || 0) + 1;
    }
    return out;
  }, [deals, cats]);

  return (
    <div className="w-full bg-background border-b border-foreground/10 sticky top-20 z-40">
      <div className="mx-auto w-full max-w-none px-2 sm:px-4 lg:px-8">
        <nav className="relative py-3" aria-label="Top categories">
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex flex-nowrap items-center gap-1 md:gap-2 justify-start whitespace-nowrap">
            {/* All option */}
            <Link
              key="all"
              href="/?category=All#hot-deals"
              className={(activeCategory === "All"
                ? "px-1.5 py-1 rounded-lg bg-primary text-white "
                : "px-1.5 py-1 rounded-lg text-foreground/90 ")
                + "inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-[12px] shrink-0"}
            >
              <span className="inline-flex items-center gap-2">
              <span className={(activeCategory === "All"
                ? "bg-primary/10 text-primary "
                : "text-foreground/70 ") + "flex items-center justify-center px-2 py-1 rounded-md border border-foreground/10"}>
                  <CategoryIcon name="All" active={activeCategory === "All"} />
                </span>
                <span className="leading-none">All</span>
                <span className={(activeCategory === "All" 
                  ? "ml-0.5 inline-flex items-center justify-center rounded-md border border-white/30 bg-white/10 text-white text-[10px] px-1.5 py-[2px]"
                  : "ml-0.5 inline-flex items-center justify-center rounded-md border border-foreground/10 bg-foreground/5 text-foreground/80 text-[10px] px-1.5 py-[2px]"
                )}>{counts.All || 0}</span>
              </span>
            </Link>

            {(cats.length ? cats : [
            { id: -1, name: "Food & Restaurants" },
            { id: -2, name: "Fashion & Clothing" },
            { id: -3, name: "Furniture & Home" },
            { id: -4, name: "Beauty & Spa" },
            { id: -5, name: "Gadgets & Electronics" },
            { id: -6, name: "Travel & Hotels" },
            { id: -7, name: "Entertainment & Events" },
          ]).map((c) => {
            const label = c.name;
            const shortMap = {
              "Food & Restaurants": "Food",
              "Fashion & Clothing": "Fashion",
              "Furniture & Home": "Home",
              "Beauty & Spa": "Beauty",
              "Gadgets & Electronics": "Electronics",
              "Travel & Hotels": "Travel",
              "Entertainment & Events": "Events",
            };
            const displayLabel = shortMap[label] || label;
            const href = `/?category=${encodeURIComponent(label)}#hot-deals`;
            return (
              <Link
                key={c.id ?? label}
                href={href}
                  className={(activeCategory === label
                    ? "px-1.5 py-1 rounded-lg bg-primary text-white "
                    : "px-1.5 py-1 rounded-lg text-foreground/80 ")
                    + "inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-[12px] shrink-0"}
              >
                <span className="inline-flex items-center gap-2">
                  <span className={(activeCategory === label ? "bg-primary/10 text-primary " : "text-foreground/70 ") + "flex items-center justify-center px-2 py-1 rounded-md border border-foreground/10"}>
                    <CategoryIcon name={label} active={activeCategory === label} />
                  </span>
                  <span className="leading-none">{displayLabel}</span>
                  <span className={(activeCategory === label 
                    ? "ml-0.5 inline-flex items-center justify-center rounded-md border border-white/30 bg-white/10 text-white text-[10px] px-1.5 py-[2px]"
                    : "ml-0.5 inline-flex items-center justify-center rounded-md border border-foreground/10 bg-foreground/5 text-foreground/80 text-[10px] px-1.5 py-[2px]"
                  )}>{counts[label] || 0}</span>
                </span>
              </Link>
            );
          })}
            </div>
          </div>
          <style jsx>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </nav>
      </div>
    </div>
  );
}