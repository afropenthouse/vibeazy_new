"use client";
import { useMemo, useState, useEffect } from "react";
import DiscountCard from "@/components/DiscountCard";

// NOTE: allowed categories
const CATEGORY_OPTIONS = ["All", "Restaurants", "Fashion"];

const DATA = [
  {
    id: 7,
    category: "Restaurants",
    title: "Sweet Sensation",
    description: "Burger combo: Burger, chips, chicken and drink",
    place: "Lagos",
    image: "/Burger_combo.webp",
    priceOriginal: 5800,
    priceCurrent: 7500,
  },
  {
    id: 25,
    category: "Restaurants",
    title: "The Place",
    description: "Fried plantain served warm — a sweet and savory side.",
    place: "Lagos",
    image: "/Plantain.jpg",
    priceOriginal: 1200,
    priceCurrent: 800,
  },
  {
    id: 13,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "2 pieces of fried chicken served with regular or large chips and a PET drink",
    place: "Lagos",
    image: "/chips.png",
    priceOriginal: 6000,
    priceCurrent: 7000,
  },
  {
    id: 2,
    category: "Restaurants",
    title: "Burger King",
    description: "Hamburger + Cheeseburger + Coca-Cola",
    place: "Lagos",
    image: "/hamburger22.webp",
    priceOriginal: 6000,
    priceCurrent: 4000,
  },
  {
    id: 29,
    category: "Restaurants",
    title: "The Place",
    description: "Roasted turkey served over savory rice.",
    place: "Lagos",
    image: "/Turkey_rice.jpg",
    priceOriginal: 7200,
    priceCurrent: 6000,
  },
  {
    id: 16,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "A full chicken flame grilled to perfection with your choice of sides and a PET drink",
    place: "Lagos",
    image: "/ChickenRepublic_FullFlameGrilled.jpg",
    priceOriginal: 17800,
    priceCurrent: 15000,
  },
  {
    id: 4,
    category: "Restaurants",
    title: "Sweet Sensation",
    description: "Rice and Chicken - Large",
    place: "Lagos",
    image: "/Rice_Chicken.webp",
    priceOriginal: 2300,
    priceCurrent: 3500,
  },
  {
    id: 30,
    category: "Restaurants",
    title: "The Place",
    description: "Seafood rice with chicken — rich, savory, and satisfying.",
    place: "Lagos",
    image: "/Seafood_rice_chicken.jpg",
    priceOriginal: 9000,
    priceCurrent: 7600,
  },
  {
    id: 11,
    category: "Restaurants",
    title: "PieXpress",
    description: "Get any 4 Pies & 2 drinks",
    place: "Lagos",
    image: "/drinks.webp",
    priceOriginal: 3900,
    priceCurrent: 3650,
  },
  {
    id: 21,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Our newly improved moin-moin recipe — softer and more flavorful",
    place: "Lagos",
    image: "/ChickenRepublic_NewlyImprovedMoinMoin.jpg",
    priceOriginal: 900,
    priceCurrent: 700,
  },
  {
    id: 9,
    category: "Restaurants",
    title: "Bite Size",
    description: "Mini Jam Doughnut + Mini Sausage Roll + Mini Px Roll + 35cl Drink or coffee +",
    place: "Lagos",
    image: "/jam.webp",
    priceOriginal: 2400,
    priceCurrent: 1000,
  },
  {
    id: 18,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Quarter flame grilled chicken served with chips and a PET drink",
    place: "Lagos",
    image: "/ChickenRepublic_QuarterFlamerGrilledChipsMeal.jpg",
    priceOriginal: 9000,
    priceCurrent: 8000,
  },
  {
    id: 14,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "1 piece of fried chicken served with our New Spicy Yam and a free pepper sauce",
    place: "Lagos",
    image: "/meal-drink.jpg",
    priceOriginal: 3900,
    priceCurrent: 3200,
  },
  {
    id: 1,
    category: "Restaurants",
    title: "Burger King",
    description: "Hamburger + Coca-Cola",
    place: "Lagos",
    image: "/hamburger1.webp",
    priceOriginal: 5000,
    priceCurrent: 3000,
  },
  {
    id: 27,
    category: "Restaurants",
    title: "The Place",
    description: "Asun — spicy smoked goat, smoky and fiery.",
    place: "Lagos",
    image: "/Asun.jpg",
    priceOriginal: 5000,
    priceCurrent: 3800,
  },
  {
    id: 6,
    category: "Restaurants",
    title: "Sweet Sensation",
    description: "Rice and Beef",
    place: "Lagos",
    image: "/Rice_beef.webp",
    priceOriginal: 1400,
    priceCurrent: 2500,
  },
  {
    id: 22,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Freshly baked meat pies with a tasty filling",
    place: "Lagos",
    image: "/ChickenRepublic_MeatPies.jpg",
    priceOriginal: 1000,
    priceCurrent: 900,
  },
  {
    id: 10,
    category: "Restaurants",
    title: "PieXpress",
    description: "Get any 2 pies & 35cl Drink",
    place: "Lagos",
    image: "/drinks.webp",
    priceOriginal: 1950,
    priceCurrent: 1850,
  },
  {
    id: 24,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "A small tub of perfectly balanced pepper sauce, flavoured with West African herbs and spices",
    place: "Lagos",
    image: "/PEPPER-SAUCE-DARK.jpg",
    priceOriginal: 600,
    priceCurrent: 600,
  },
  {
    id: 5,
    category: "Restaurants",
    title: "Sweet Sensation",
    description: "Rice and Chicken - Medium",
    place: "Lagos",
    image: "/Rice_Chicken.webp",
    priceOriginal: 2900,
    priceCurrent: 4300,
  },
  {
    id: 19,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Crisp coleslaw side, perfect with chicken and fries",
    place: "Lagos",
    image: "/ChickenRepublic_Coleslaw.jpg",
    priceOriginal: 1200,
    priceCurrent: 950,
  },
  {
    id: 3,
    category: "Restaurants",
    title: "Burger King",
    description: "2 Hamburgers + Cheeseburger + Coca-Cola",
    place: "Lagos",
    image: "/hamburger3.webp",
    priceOriginal: 7000,
    priceCurrent: 5000,
  },
  {
    id: 12,
    category: "Restaurants",
    title: "PieXpress",
    description: "Get any 6 pies & Drinks",
    place: "Lagos",
    image: "/drinks.webp",
    priceOriginal: 5800,
    priceCurrent: 5450,
  },
  {
    id: 26,
    category: "Restaurants",
    title: "The Place",
    description: "Fiesta-style grilled chicken with a spicy rub and tasty sides.",
    place: "Lagos",
    image: "/Fiesta_Grilled_Chicken.jpg",
    priceOriginal: 6500,
    priceCurrent: 4500,
  },
  {
    id: 28,
    category: "Restaurants",
    title: "The Place",
    description: "Asun with rice and grilled turkey — a hearty combo plate.",
    place: "Lagos",
    image: "/Asun_rice_Grilled_turkey.jpg",
    priceOriginal: 8500,
    priceCurrent: 7000,
  },
  {
    id: 17,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "A quarter flame grilled chicken prepared with garlic & herb or hot Rodo sauce",
    place: "Lagos",
    image: "/ChickenRepublic_QuarterFlamerGrilled.jpg",
    priceOriginal: 7500,
    priceCurrent: 6800,
  },
  {
    id: 8,
    category: "Restaurants",
    title: "Sweet Sensation",
    description: "Sharwarma combo: sharwarma and burger with chips and drink",
    place: "Lagos",
    image: "/shawarma.webp",
    priceOriginal: 7000,
    priceCurrent: 9000,
  },
  {
    id: 15,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "2 pieces of fried chicken, served with your choice of fried/jollef rice or spaghetti and a Pet deink",
    place: "Lagos",
    image: "/food.webp",
    priceOriginal: 12000,
    priceCurrent: 9500,
  },
  {
    id: 20,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Delicious pasta salad served chilled. A lighter side option.",
    place: "Lagos",
    image: "/PASTA-SALAD-DARK.jpg",
    priceOriginal: 1800,
    priceCurrent: 1500,
  },
  {
    id: 23,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Hearty chicken pies with a rich filling",
    place: "Lagos",
    image: "/CHICKEN-PIES-DARK.jpg",
    priceOriginal: 1200,
    priceCurrent: 1000,
  },
  {
    id: 31,
    category: "Supermarkets",
    title: "Supermart",
    url: "https://www.supermart.ng",
    description: "Everyday groceries and pantry staples — quick and convenient.",
    place: "Lagos",
    image: "/spmex3809.webp",
    priceOriginal: 2500,
    priceCurrent: 1800,
  },
  {
    id: 32,
    category: "Supermarkets",
    title: "Supermart",
    url: "https://www.supermart.ng",
    description: "Fresh produce and chilled items for your weekly shop.",
    place: "Lagos",
    image: "/spxvl1032.jpg",
    priceOriginal: 3200,
    priceCurrent: 2400,
  },
  {
    id: 33,
    category: "Supermarkets",
    title: "Supermart",
    url: "https://www.supermart.ng",
    description: "Baked goods and artisanal breads — hot from the oven.",
    place: "Lagos",
    image: "/brea.webp",
    priceOriginal: 800,
    priceCurrent: 600,
  },
  {
    id: 34,
    category: "Supermarkets",
    title: "Supermart",
    url: "https://www.supermart.ng",
    description: "Household supplies and pantry essentials at affordable prices.",
    place: "Lagos",
    image: "/rspwxyz350.webp",
    priceOriginal: 2100,
    priceCurrent: 1500,
  },
  {
    id: 35,
    category: "Supermarkets",
    title: "Supermart",
    url: "https://www.supermart.ng",
    description: "Quality frozen and fresh products — great for family meals.",
    place: "Lagos",
    image: "/spmex102_20_2.webp",
    priceOriginal: 4000,
    priceCurrent: 3100,
  },
  {
    id: 36,
    category: "Supermarkets",
    title: "Supermart",
    url: "https://www.supermart.ng",
    description: "Wide selection of branded goods and daily necessities.",
    place: "Lagos",
    image: "/spmt1051_9a33cd5f-567b-4cf2-8857-bffc765b52ad.webp",
    priceOriginal: 2900,
    priceCurrent: 2200,
  },
  {
    id: 37,
    category: "Supermarkets",
    title: "Supermart",
    url: "https://www.supermart.ng",
    description: "Fresh deli items and ready-to-eat options for busy days.",
    place: "Lagos",
    image: "/spmt1062.webp",
    priceOriginal: 2300,
    priceCurrent: 1700,
  },
  {
    id: 38,
    category: "Supermarkets",
    title: "Supermart",
    url: "https://www.supermart.ng",
    description: " Snacks, drinks and quick-grab items for on-the-go.",
    place: "Lagos",
    image: "/spxspz1199.webp",
    priceOriginal: 1200,
    priceCurrent: 900,
  },
  {
    id: 39,
    category: "Restaurants",
    title: "Burger King",
    description: "2 Hamburgers + Cheeseburger + Coca-Cola",
    place: "Lagos",
    image: "/hamburger3.webp",
    priceOriginal: 7000,
    priceCurrent: 5000,
  },
  {
    id: 40,
    category: "Restaurants",
    title: "PieXpress",
    description: "Get any 6 pies & Drinks",
    place: "Lagos",
    image: "/drinks.webp",
    priceOriginal: 5800,
    priceCurrent: 5450,
  },
  {
    id: 41,
    category: "Restaurants",
    title: "The Place",
    description: "Fiesta-style grilled chicken with a spicy rub and tasty sides.",
    place: "Lagos",
    image: "/Fiesta_Grilled_Chicken.jpg",
    priceOriginal: 6500,
    priceCurrent: 4500,
  },
  {
    id: 42,
    category: "Restaurants",
    title: "The Place",
    description: "Asun with rice and grilled turkey — a hearty combo plate.",
    place: "Lagos",
    image: "/Asun_rice_Grilled_turkey.jpg",
    priceOriginal: 8500,
    priceCurrent: 7000,
  },
  {
    id: 43,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "A quarter flame grilled chicken prepared with garlic & herb or hot Rodo sauce",
    place: "Lagos",
    image: "/ChickenRepublic_QuarterFlamerGrilled.jpg",
    priceOriginal: 7500,
    priceCurrent: 6800,
  },
  {
    id: 44,
    category: "Restaurants",
    title: "Sweet Sensation",
    description: "Sharwarma combo: sharwarma and burger with chips and drink",
    place: "Lagos",
    image: "/shawarma.webp",
    priceOriginal: 7000,
    priceCurrent: 9000,
  },
  {
    id: 45,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "2 pieces of fried chicken, served with your choice of fried/jollef rice or spaghetti and a Pet deink",
    place: "Lagos",
    image: "/food.webp",
    priceOriginal: 12000,
    priceCurrent: 9500,
  },
  {
    id: 46,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "A quarter flame grilled chicken prepared with garlic & herb or hot Rodo sauce",
    place: "Lagos",
    image: "/ChickenRepublic_QuarterFlamerGrilled.jpg",
    priceOriginal: 7500,
    priceCurrent: 6800,
  },
  {
    id: 47,
    category: "Restaurants",
    title: "Sweet Sensation",
    description: "Sharwarma combo: sharwarma and burger with chips and drink",
    place: "Lagos",
    image: "/shawarma.webp",
    priceOriginal: 7000,
    priceCurrent: 9000,
  },
  {
    id: 48,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "2 pieces of fried chicken, served with your choice of fried/jollef rice or spaghetti and a Pet deink",
    place: "Lagos",
    image: "/food.webp",
    priceOriginal: 12000,
    priceCurrent: 9500,
  },
  {
    id: 49,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Delicious pasta salad served chilled. A lighter side option.",
    place: "Lagos",
    image: "/PASTA-SALAD-DARK.jpg",
    priceOriginal: 1800,
    priceCurrent: 1500,
  },
  {
    id: 50,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "1 piece of fried chicken served with our New Spicy Yam and a free pepper sauce",
    place: "Lagos",
    image: "/meal-drink.jpg",
    priceOriginal: 3900,
    priceCurrent: 3200,
  },
];
  // Reset visible count directly in change handlers to avoid setState in effects

export default function SearchFilter() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  // Visible items control for "See more" behavior
  const INITIAL_VISIBLE = 6;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

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
      <p className="text-foreground/70 mt-1">Discover amazing deals from local businesses. Updated in real-time.</p>
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