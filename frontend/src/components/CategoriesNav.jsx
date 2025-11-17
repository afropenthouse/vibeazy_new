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
  else if (n.includes("car")) icon = "car.png";
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
  const params = useSearchParams();
  const activeCategory = params.get("category") || "";

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

  return (
    <div className="w-full bg-background border-b border-foreground/10 sticky top-20 z-40">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="relative py-3" aria-label="Top categories">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-start">
            {/* All option */}
            <Link
              key="all"
              href="/?category=All#hot-deals"
              className={(activeCategory === "All"
                ? "px-2 py-1 rounded-lg bg-primary text-white "
                : "px-2 py-1 rounded-lg text-foreground/90 ")
                + "inline-flex items-center justify-center gap-2 text-[11px] sm:text-[12px]"}
            >
              <span className="inline-flex items-center gap-2">
                <span className={(activeCategory === "All"
                  ? "bg-primary/25 text-white "
                  : "text-foreground/70 ") + "flex items-center justify-center w-6 h-6 rounded-full"}>
                  <CategoryIcon name="All" active={activeCategory === "All"} />
                </span>
                <span className="leading-none">All</span>
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
            const displayLabel = shortMap[label] || label.replace(/\s+&\s+/g, ' ').split(' ')[0];
            const href = `/?category=${encodeURIComponent(label)}#hot-deals`;
            return (
              <Link
                key={c.id ?? label}
                href={href}
                  className={(activeCategory === label
                    ? "px-2 py-1 rounded-lg bg-primary text-white "
                    : "px-2 py-1 rounded-lg text-foreground/80 ")
                    + "inline-flex items-center justify-center gap-2 text-[11px] sm:text-[12px]"}
              >
                <span className="inline-flex items-center gap-2">
                  <span className={(activeCategory === label ? "bg-primary/25 text-white " : "text-foreground/70 ") + "flex items-center justify-center w-6 h-6 rounded-full"}>
                    <CategoryIcon name={label} active={activeCategory === label} />
                  </span>
                  <span className="leading-none">{displayLabel}</span>
                </span>
              </Link>
            );
          })}
          </div>
        </nav>
      </div>
    </div>
  );
}