"use client";
import { useMemo, useState, useEffect } from "react";
import DiscountCard from "@/components/DiscountCard";

// NOTE: allowed categories (value = internal category, label = visible text)
// Keep the label text in sync with `CategoriesNav` so header and filters align.
const CATEGORY_OPTIONS = [
  { value: "All", label: "All" },
  { value: "Restaurants", label: "Food & Restaurants" },
  { value: "Fashion", label: "Fashion & Clothing" },
  { value: "Electronics", label: "Gadgets & Electronics" },
  { value: "Furniture", label: "Furniture & Home" },
  { value: "Beauty", label: "Beauty & Spa" },
  { value: "Travel", label: "Travel & Hotels" },
  { value: "Entertainment", label: "Entertainment & Events" },
];

export const DEALS_DATA = [
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
    priceOriginal: 4900,
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
    priceOriginal: 2950,
    priceCurrent: 1950,
  },
  {
    id: 24,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "A small tub of perfectly balanced pepper sauce, flavoured with West African herbs and spices",
    place: "Lagos",
    image: "/PEPPER-SAUCE-DARK.jpg",
    priceOriginal: 800,
    priceCurrent: 1200,
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
    priceCurrent: 5100,
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
    priceOriginal: 7700,
    priceCurrent: 6700,
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
    priceCurrent: 5000,
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
    priceCurrent: 6000,
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
    priceOriginal: 7900,
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
  // New items added with provided image names
  {
    id: 51,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Half rotisserie chicken served with your choice of rice or spaghetti and a refreshing PET drink.",
    place: "Lagos",
    image: "/7-HALF-ROTISSERIE-MEAL-DARK-e1636533944472.jpg",
    priceOriginal: 12000,
    priceCurrent: 10600,
  },
  {
    id: 52,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Half rotisserie chicken served with regular or large chips plus a refreshing PET drink.",
    place: "Lagos",
    image: "/8-HALF-ROTISSERIE-CHIPS-MEAL-e1636534554319.jpg",
    priceOriginal: 12600,
    priceCurrent: 10600,
  },
  {
    id: 53,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Enjoy a full Rotisserie chicken with 4 portions of rice or spaghetti and 4 PET drinks — perfect for groups.",
    place: "Lagos",
    image: "/BIG-CREW-MEAL-DARK.jpg",
    priceOriginal: 31000,
    priceCurrent: 27000,
  },
  {
    id: 54,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Quarter rotisserie chicken served with choice of sides and a PET drink.",
    place: "Lagos",
    image: "/ChickenRepublic_QuarterRotisserie.jpg",
    priceOriginal: 6000,
    priceCurrent: 4000,
  },
  {
    id: 55,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Half rotisserie chicken served with choice of sides and a PET drink.",
    place: "Lagos",
    image: "/ChickenRepublic_HalfRotisserie.jpg",
    priceOriginal: 20000,
    priceCurrent: 18000,
  },
  {
    id: 56,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Whole rotisserie chicken — great for families and groups.",
    place: "Lagos",
    image: "/ChickenRepublic_FullChicken.jpg",
    priceOriginal: 20000,
    priceCurrent: 18000,
  },
  {
    id: 57,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "NEW Double Spicy ChickWhizz sandwich served with chips and a drink — double the spice, double the flavour.",
    place: "Lagos",
    image: "/whizz.png", 
    priceOriginal: 6200,
    priceCurrent: 4200,
  },
  {
    id: 58,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Big Boyz Meal — a hearty chicken meal with rice, sides and a refreshing drink.",
    place: "Lagos",
    image: "/ChickenRepublic_Big_Boyz_DARK-scaled.jpg",
    priceOriginal: 7700,
    priceCurrent: 5700,
  },
  {
    id: 59,
    category: "Restaurants",
    title: "Chicken Republic",
    description: "Chief Burger — soulfully spiced chicken on a fresh bun with lettuce, cheese and our secret sauce.",
    place: "Lagos",
    image: "/ChickenRepublic_ChiefBurger_WHITE-scaled.jpg",
    priceOriginal: 4500,
    priceCurrent: 2500,
  },
];

// Load dynamic deals from backend (fallback to static DEALS_DATA)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const toNumber = (v) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[,\s]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

function mapApiDealToCard(d) {
  return {
    id: d.id,
    category: d.category || "Restaurants",
    title: d.merchantName || d.title || "Untitled",
    description: d.description || "",
    place: d.city || "",
    image: d.imageUrl || "/placeholder.png",
    priceOriginal: toNumber(d.oldPrice),
    priceCurrent: toNumber(d.newPrice),
    discountPct: toNumber(d.discountPct),
    expiresAt: d.expiresAt || d.expires_at || undefined,
    url: d.deepLink || d.deep_link || undefined,
    // include status metadata if available so the UI can sort/label items
    status: d.status || d.state || d.reviewStatus || undefined,
    approvedAt: d.approvedAt || d.approved_at || d.updatedAt || d.updated_at || d.createdAt || d.created_at || undefined,
  };
}

// Reset visible count directly in change handlers to avoid setState in effects

export default function SearchFilter() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("Lagos");
  const [apiDeals, setApiDeals] = useState([]);

  // Read initial filters from URL (?q=...&category=...&city=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      // Read search terms from header which uses `search` param; fall back to `q`
      const q = params.get("search") || params.get("q") || "";
      const cat = params.get("category") || "All";
      const city = params.get("city") || "Lagos";
      const rafId = window.requestAnimationFrame(() => {
        if (q) setQuery(q);
        // Accept either the option value (e.g. "Restaurants") or the visible label
        // (e.g. "Food & Restaurants") in the URL. Map labels to values so filtering
        // works regardless of which form was used to generate the link.
        if (cat) {
          const byValue = CATEGORY_OPTIONS.find((c) => c.value === cat);
          const byLabel = CATEGORY_OPTIONS.find((c) => c.label === cat);
          if (byValue) setSelectedCategory(byValue.value);
          else if (byLabel) setSelectedCategory(byLabel.value);
          else setSelectedCategory(cat);
        }
        if (city) setSelectedCity(city);
      });
      return () => {
        window.cancelAnimationFrame(rafId);
      };
    }
  }, []);
  // Visible items control for "See more" behavior
  const INITIAL_VISIBLE = 6;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // Fetch public deals feed
  useEffect(() => {
    let didCancel = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/admin/public/deals`);
        const data = await res.json();
        if (!didCancel && res.ok && Array.isArray(data.deals)) {
          const mapped = data.deals.map(mapApiDealToCard);
          setApiDeals(mapped);
        }
      } catch (_) {
        // silently keep fallback
      }
    }
    load();
    return () => { didCancel = true; };
  }, []);

  // Use only backend-provided deals; do not fall back to mock data
  const DATA = apiDeals;


  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return DATA.filter((d) => {
      const matchesQuery =
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.place?.toLowerCase().includes(q));
      const matchesCity = selectedCity ? (d.place?.toLowerCase() === selectedCity.toLowerCase()) : true;
      // Normalize both the deal.category and the selectedCategory to the canonical
      // option.value when possible. This handles cases where categories were saved
      // with a long display name ("Food & Restaurants") but our select uses
      // shorter internal values ("Restaurants").
      const getValueFor = (name) => {
        if (!name) return name;
        const exactValue = CATEGORY_OPTIONS.find((c) => c.value === name);
        if (exactValue) return exactValue.value;
        const byLabel = CATEGORY_OPTIONS.find((c) => c.label === name);
        if (byLabel) return byLabel.value;
        return name;
      };
      const dealCatValue = getValueFor(d.category);
      const selCatValue = getValueFor(selectedCategory);
      const matchesCategory = selCatValue === "All" || dealCatValue === selCatValue;
      return matchesQuery && matchesCategory && matchesCity;
    });
  }, [query, selectedCategory, selectedCity, DATA]);

  // Sort filtered results so that approved deals come first. Within the same
  // status, use FIFO ordering (oldest first) based on approvedAt/updatedAt/createdAt.
  const sortedFiltered = useMemo(() => {
    const arr = filtered.slice();
    const priority = (s) => {
      if (!s) return 2;
      const low = String(s).toLowerCase();
      if (low === "approved") return 0;
      if (low === "pending") return 1;
      return 2;
    };
    const timeOf = (it) => {
      const cand = it?.approvedAt ?? it?.updatedAt ?? it?.createdAt ?? null;
      if (!cand) return 0;
      const n = Date.parse(cand);
      return Number.isNaN(n) ? 0 : n;
    };
    arr.sort((a, b) => {
      const pa = priority(a.status);
      const pb = priority(b.status);
      if (pa !== pb) return pa - pb; // approved first
      // FIFO: older timestamps first
      const ta = timeOf(a);
      const tb = timeOf(b);
      return ta - tb;
    });
    return arr;
  }, [filtered]);

  const filteredCount = filtered.length;
  const displayedCount = Math.min(visibleCount, filteredCount);

  return (
    <section id="hot-deals" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-bold">Hot Deals Near You</h2>
      <p className="text-foreground/70 mt-1">Discover amazing deals from local businesses. Updated in real-time.</p>
      <div className="flex flex-col gap-4 mt-6">
        {/* Results count */}
        <div className="text-sm text-foreground/70 mt-3">
          {filteredCount > 0 ? (
            <span>Displaying {displayedCount} of {filteredCount} deals</span>
          ) : (
            <span>No results yet.</span>
          )}
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
              {/* Show a category-specific empty state message. Use the human-friendly label
                  (from CATEGORY_OPTIONS) when available so long labels like "Food & Restaurants"
                  are shown instead of the internal short value. */}
              <p className="text-sm text-foreground/70">
                {(() => {
                  if (selectedCategory === "All") return "No results yet.";
                  // Prefer the visible label for the selected category when present
                  const opt = CATEGORY_OPTIONS.find((c) => c.value === selectedCategory) || CATEGORY_OPTIONS.find((c) => c.label === selectedCategory);
                  const label = opt ? opt.label : selectedCategory;
                  return `No ${label} yet.`;
                })()}
              </p>
            </div>
        )}
      </div>
    </section>
  );
}
