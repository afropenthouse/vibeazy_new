"use client";
import React from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function iconFor(name) {
  const map = {
    "Food & Restaurants": "🍕",
    Restaurants: "🍕",
    "Fashion & Clothing": "👕",
    Fashion: "👕",
    "Furniture & Home": "🪑",
    Furniture: "🪑",
    "Beauty & Spa": "💅",
    Beauty: "💅",
    "Gadgets & Electronics": "💻",
    Electronics: "💻",
    "Travel & Hotels": "✈️",
    Travel: "✈️",
    "Entertainment & Events": "🎟️",
    Entertainment: "🎟️",
  };
  return map[name] || "🏷️";
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
    <div className="w-full bg-background border-b border-foreground/10 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-3 flex-nowrap py-3" aria-label="Top categories">
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
            const href = `/?category=${encodeURIComponent(label)}`;
            return (
              <Link
                key={c.id ?? label}
                href={href}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-foreground/80 hover:text-primary transition-colors whitespace-nowrap"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-foreground/5">
                  {iconFor(label)}
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}