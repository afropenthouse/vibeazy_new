"use client";
import { useMemo, useState, useEffect } from "react";
import DiscountCard from "@/components/DiscountCard";

// NOTE: allowed categories
const CATEGORY_OPTIONS = ["All", "Restaurants", "Relaxation", "Fashion", "Supermarkets"];

const DATA = [
  {
    id: 1,
    category: "Restaurants",
    title: "Burger King",
    description: "Hamburger + Coca-Cola",
    place: "Surulere, Lagos",
    image: "/hamburger1.webp",
    priceOriginal: 5000,
    priceCurrent: 3000,
  },
  {
    id: 2,
    category: "Restaurants",
    title: "Burger King",
    description: "Hamburger + Cheeseburger + Coca-Cola",
    place: "Surulere, Lagos",
    image: "/hamburger22.webp",
    priceOriginal: 6000,
    priceCurrent: 4000,
  },
  {
    id: 3,
    category: "Restaurants",
    title: "Burger King",
    description: "2 Hamburgers + Cheeseburger + Coca-Cola",
    place: "Surulere, Lagos",
    image: "/hamburger3.webp",
    priceOriginal: 7000,
    priceCurrent: 5000,
  },
  {
    id: 4,
    category: "Restaurants",
    title: "Sweet Sensation",
    description: "Rice and Chicken - Large",
    place: "Surulere, Lagos",
    image: "/Rice_Chicken.webp",
    priceOriginal: 2300,
    priceCurrent: 3500,
  },
  {
    id: 5,
    category: "Restaurants",
    title: "Sweet Sensation",
    description: "Rice and Chicken - Medium",
    place: "Surulere, Lagos",
    image: "/Rice_Chicken.webp",
    priceOriginal: 2900,
    priceCurrent: 4300,
  },
  {
    id: 6,
    category: "Restaurants",
    title: "Sweet Sensation",
    description: "Rice and Beef",
    place: "Surulere, Lagos",
    image: "/Rice_beef.webp",
    priceOriginal: 1400,
    priceCurrent: 2500,
  },
  {
    id: 7,
    category: "Restaurants",
    title: "Sweet Sensation",
    description: "Burger combo: Burger, chips, chicken and drink",
    place: "Surulere, Lagos",
    image: "/Burger_combo.webp",
    priceOriginal: 5800,
    priceCurrent: 7500,
  },
  {
    id: 8,
    category: "Restaurants",
    title: "Sweet Sensation",
    description: "Sharwarma combo: sharwarma and burger with chips and drink",
    place: "Surulere, Lagos",
    image: "/shawarma.webp",
    priceOriginal: 7000,
    priceCurrent: 9000,
  },
  {
    id: 9,
    category: "Restaurants",
    title: "Bite Size",
    description: "Mini Jam Doughnut + Mini Sausage Roll + Mini Px Roll + 35cl Drink or coffee +",
    place: "Surulere, Lagos",
    image: "/jam.webp",
    priceOriginal: 2400,
    priceCurrent: 1000,
  },
  {
    id: 10,
    category: "Restaurants",
    title: "PieXpress",
    description: "Get any 2 pies & 35cl Drink",
    place: "Surulere, Lagos",
    image: "/drinks.webp",
    priceOriginal: 1950,
    priceCurrent: 1850,
  },
  {
    id: 11,
    category: "Restaurants",
    title: "PieXpress",
    description: "Get any 4 Pies & 2 drinks",
    place: "Surulere, Lagos",
    image: "/drinks.webp",
    priceOriginal: 3900,
    priceCurrent: 3650,
  },
  {
    id: 12,
    category: "Restaurants",
    title: "PieXpress",
    description: "Get any 6 pies & Drinks",
    place: "Surulere, Lagos",
    image: "/drinks.webp",
    priceOriginal: 5800,
    priceCurrent: 5450,
  },
  
];

export default function SearchFilter() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  // Visible items control for "See more" behavior
  const INITIAL_VISIBLE = 6;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // Reset visible count directly in change handlers to avoid setState in effects

  const titleOptions = useMemo(() => Array.from(new Set(DATA.map((d) => d.title))), []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return DATA.filter((d) => {
      const matchesQuery =
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.place?.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === "All" || d.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [query, selectedCategory]);

  return (
    <section id="hot-deals" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-bold">Hot Deals Near You</h2>
      <p className="text-foreground/70 mt-1">Discover amazing discounts from local places. Updated in real-time.</p>
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            type="text"
            list="deal-titles"
            placeholder="Search deals"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(INITIAL_VISIBLE);
            }}
            className="w-full sm:w-[60%] lg:w-[55%] rounded-md border border-foreground/10 bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <datalist id="deal-titles">
            {titleOptions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <div className="flex items-center gap-2 sm:flex-1 sm:justify-end flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setVisibleCount(INITIAL_VISIBLE);
              }}
              className="rounded-md border border-foreground/10 bg-background px-3 py-1.5 text-sm"
              aria-label="Filter by category"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
              {filtered.slice(0, visibleCount).map((item) => (
                <DiscountCard key={item.id} item={item} />
              ))}
            </div>

            {/* See more button shown only when there are more items to reveal */}
            {filtered.length > visibleCount && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  className="inline-flex items-center rounded-md bg-primary text-white px-4 py-2 text-sm hover:brightness-110 transition"
                  aria-label="See more products"
                  onClick={() => setVisibleCount((c) => Math.min(filtered.length, c + 6))}
                >
                  See more
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center col-span-full">
            {/* Show a category-specific empty state message. Default to a generic message when needed. */}
            <p className="text-sm text-foreground/70">
              {(() => {
                if (selectedCategory === "Hotels") return "No Hotels yet.";
                if (selectedCategory === "Restaurants") return "No restaurants yet.";
                if (selectedCategory === "All") return "No results yet.";
                return `No ${selectedCategory} yet.`;
              })()}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}