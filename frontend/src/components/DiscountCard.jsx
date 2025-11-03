"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { useSavedDeals } from "@/contexts/SavedDealsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function DiscountCard({ item }) {
  const { isSaved, toggle } = useSavedDeals();
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const saved = isSaved(item.id);

  const formatNaira = (value) => {
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
    } catch {
      return `₦${Number(value).toLocaleString()}`;
    }
  };
  // Normalize prices so UI always shows a discount: original (struck-through) is the higher value
  const normalizePrices = (original, current) => {
    if (typeof original !== "number" || typeof current !== "number") {
      return { original, current };
    }
    if (original >= current) return { original, current };
    return { original: current, current: original };
  };

  // Discount percentage, using normalized values; floors decimals
  const getPercentOff = (original, current) => {
    if (typeof original !== "number" || typeof current !== "number") return null;
    if (original <= 0 || current <= 0) return null;
    if (original === current) return 0;
    const diff = original - current;
    if (diff <= 0) return 0;
    return Math.floor((diff / original) * 100);
  };

  const { original: displayOriginal, current: displayCurrent } = normalizePrices(
    item.priceOriginal,
    item.priceCurrent
  );
  const percentOff = getPercentOff(displayOriginal, displayCurrent);

  // Map of title -> external offer URL
  const OFFER_URLS = {
    "Sweet Sensation": "https://sweetsensation.ng",
    "The Place": "https://theplace.com.ng/",
    "Chicken Republic": "https://www.chicken-republic.com/",
    "Burger King": "https://www.burger-king.ng/",
    "PieXpress": "https://www.instagram.com/piexpress_ng/?hl=en",
    "Bite Size": "https://vibeazy-new.vercel.app/",
  };
  // Prefer explicit item.url if provided in DATA, otherwise fall back to title->URL map
  const offerUrl = item.url || OFFER_URLS[item.title];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="discount-card group rounded-xl border border-foreground/10 overflow-hidden bg-background shadow-sm hover:shadow-md flex flex-col h-full"
    >
      <div className="relative">
        <Image src={item.image} alt={item.title} width={800} height={600} className="h-40 w-full object-cover" />
        <div className="absolute inset-0 bg-secondary/20 mix-blend-multiply" />
        {percentOff !== null && (
          <span
            className="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/95 text-white text-xs font-semibold shadow-lg ring-1 ring-white/20 backdrop-blur-sm"
            aria-label={`${percentOff}% Off`}
          >
            {percentOff}% Off
          </span>
        )}
      </div>
  <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
          {/* Save icon beside the title */}
          <button
            onClick={async () => {
              if (!isAuthenticated) {
                router.push("/login");
                return;
              }
              // Save to backend
              try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deals/save`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    dealId: item.id,
                    dealTitle: item.title,
                    dealData: item,
                  }),
                });
              } catch {}
              // Update local saved state
              toggle(item);
            }}
            className="inline-flex items-center justify-center rounded-full p-2 hover:bg-foreground/10 transition"
            aria-pressed={saved}
            aria-label={saved ? "Unsave deal" : "Save deal"}
            title={saved ? "Saved" : "Save"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className={`h-5 w-5 ${saved ? "text-primary" : "text-foreground/60"}`}
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
            </svg>
          </button>
        </div>
        {item.place && (
          <p className="mt-1 text-xs text-foreground/60">{item.place}</p>
        )}
        <p className="mt-2 text-sm text-foreground/70">{item.description}</p>

        {(item.priceCurrent || item.priceOriginal) && (
          <div className="mt-auto pt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              {typeof displayCurrent === "number" && (
                <span className="text-base font-semibold text-primary price-current">{formatNaira(displayCurrent)}</span>
              )}
              {typeof displayOriginal === "number" && (
                <span className="text-sm text-foreground/60 line-through price-original">{formatNaira(displayOriginal)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {offerUrl ? (
                <a
                  href={offerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md bg-primary text-white px-3 py-1.5 hover:brightness-110 transition"
                  aria-label={`Get offer from ${item.title}`}
                >
                  Place Order
                </a>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center rounded-md bg-primary/60 text-white px-3 py-1.5 cursor-not-allowed"
                >
                  Get Offer
                </button>
              )}
              {/* Removed lower Save text button; save icon now near title */}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}