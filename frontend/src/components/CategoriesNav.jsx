"use client";
import Link from "next/link";

const CATS = [
  { key: "food", label: "Food & Restaurants", emoji: "🍕" },
  { key: "fashion", label: "Fashion & Clothing", emoji: "👕" },
  { key: "home", label: "Furniture & Home", emoji: "🪑" },
  { key: "beauty", label: "Beauty & Spa", emoji: "💅" },
  { key: "gadgets", label: "Gadgets & Electronics", emoji: "💻" },
  { key: "travel", label: "Travel & Hotels", emoji: "✈️" },
  { key: "entertainment", label: "Entertainment & Events", emoji: "🎟️" },
];

export default function CategoriesNav() {
  return (
    <div className="w-full bg-background border-b border-foreground/10 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-3 flex-nowrap py-3" aria-label="Top categories">
          {CATS.map(({ key, label, emoji }) => {
            const href = `/?category=${encodeURIComponent(label)}#hot-deals`;
            return (
              <Link
                key={key}
                href={href}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-foreground/80 hover:text-primary transition-colors whitespace-nowrap"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-foreground/5">
                  {emoji}
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