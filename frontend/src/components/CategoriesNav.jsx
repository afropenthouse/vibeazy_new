"use client";
import React from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Sleek inline SVG icons (consistent stroke, size, and style)
function CategoryIcon({ name }) {
  const common = "w-5 h-5";
  const strokeProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const n = String(name || "").toLowerCase();

  if (n.includes("restaurant") || n.includes("food")) {
    // Utensils
    return (
      <svg className={common} viewBox="0 0 24 24" {...strokeProps}>
        <path d="M8 3v9"/>
        <path d="M6 3v9"/>
        <path d="M10 3v4a4 4 0 0 1-4 4"/>
        <path d="M14 7h5a2 2 0 0 1 2 2v9"/>
        <path d="M14 7v10"/>
      </svg>
    );
  }
  if (n.includes("fashion")) {
    // T‑shirt
    return (
      <svg className={common} viewBox="0 0 24 24" {...strokeProps}>
        <path d="M9 4l3-2 3 2m-6 0-3 2v12h12V6l-3-2"/>
      </svg>
    );
  }
  if (n.includes("electronic") || n.includes("gadget")) {
    // Laptop
    return (
      <svg className={common} viewBox="0 0 24 24" {...strokeProps}>
        <rect x="3" y="5" width="18" height="10" rx="2"/>
        <path d="M2 19h20"/>
      </svg>
    );
  }
  if (n.includes("furniture") || n.includes("home")) {
    // Chair
    return (
      <svg className={common} viewBox="0 0 24 24" {...strokeProps}>
        <path d="M6 12h12"/>
        <path d="M7 12v6"/>
        <path d="M17 12v6"/>
        <path d="M8 8h8a2 2 0 0 1 2 2v2H6v-2a2 2 0 0 1 2-2Z"/>
      </svg>
    );
  }
  if (n.includes("beauty") || n.includes("spa")) {
    // Sparkles
    return (
      <svg className={common} viewBox="0 0 24 24" {...strokeProps}>
        <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z"/>
        <path d="M19 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"/>
      </svg>
    );
  }
  if (n.includes("travel") || n.includes("hotel") || n.includes("airbnb")) {
    // Bed
    return (
      <svg className={common} viewBox="0 0 24 24" {...strokeProps}>
        <path d="M3 10h10a4 4 0 0 1 4 4v4"/>
        <path d="M3 18v-8"/>
        <path d="M3 14h18"/>
      </svg>
    );
  }
  if (n.includes("entertainment") || n.includes("event")) {
    // Ticket
    return (
      <svg className={common} viewBox="0 0 24 24" {...strokeProps}>
        <path d="M4 8h16v8H4z"/>
        <path d="M8 8v-2m8 2v-2"/>
        <path d="M8 16v2m8-2v2"/>
      </svg>
    );
  }
  // Default: Tag (used for "All")
  return (
    <svg className={common} viewBox="0 0 24 24" {...strokeProps}>
      <path d="M7 3h7l6 6-9 9-6-6V3z"/>
      <circle cx="15.5" cy="8.5" r="1.5"/>
    </svg>
  );
}

export default function CategoriesNav() {
  const [cats, setCats] = React.useState([]);

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
      <div className="mx-auto w-[90%] px-4 sm:px-6 lg:px-8">
        <nav className="relative py-3" aria-label="Top categories">
          <div className="flex items-center gap-3 overflow-x-auto flex-nowrap scrollbar-hide snap-x snap-mandatory sm:overflow-visible sm:flex-wrap sm:justify-evenly">
            {/* All option */}
            <Link
              key="all"
              href="/?category=All#hot-deals"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-foreground/90 hover:text-primary transition-colors whitespace-nowrap snap-start"
            >
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-foreground/5"><CategoryIcon name="All" /></span>
              <span>All</span>
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
            const href = `/?category=${encodeURIComponent(label)}#hot-deals`;
            return (
              <Link
                key={c.id ?? label}
                href={href}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-foreground/80 hover:text-primary transition-colors whitespace-nowrap snap-start"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-foreground/5">
                  <CategoryIcon name={label} />
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
          </div>
        </nav>
      </div>
    </div>
  );
}