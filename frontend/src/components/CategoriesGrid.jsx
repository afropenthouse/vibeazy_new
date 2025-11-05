"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { key: "Restaurants", label: "Food & Restaurants", image: "/food.webp" },
  { key: "Fashion", label: "Fashion & Clothing", image: "/fashion.webp" },
  { key: "Furniture", label: "Furniture & Home", image: "/resturants.webp" },
  { key: "Beauty", label: "Beauty & Spa", image: "/ChickenRepublic_ChiefBurger_WHITE-scaled.jpg" },
  { key: "Electronics", label: "Gadgets & Electronics", image: "/headset.webp" },
  { key: "Travel", label: "Travel & Hotels", image: "/Hotels.webp" },
  { key: "Entertainment", label: "Entertainment & Events", image: "/rspwxyz350.webp" },
];

export default function CategoriesGrid() {
  const router = useRouter();

  const onSelect = (key) => {
    const url = new URL(window.location.href);
    url.searchParams.set("category", key);
    router.push(`${url.pathname}?${url.searchParams.toString()}#hot-deals`);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">Top Categories</h2>
        <a href="#hot-deals" className="text-sm text-primary hover:underline">Browse all deals</a>
      </div>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => onSelect(cat.key)}
            className="group relative overflow-hidden rounded-xl border border-foreground/10 bg-background text-left shadow-sm hover:shadow-md transition"
          >
            <div className="relative h-24 w-full">
              <Image src={cat.image} alt={cat.label} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition" />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold group-hover:text-primary">{cat.label}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}