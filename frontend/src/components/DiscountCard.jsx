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
              {item.priceCurrent && (
                <span className="text-base font-semibold text-primary price-current">{formatNaira(item.priceCurrent)}</span>
              )}
              {item.priceOriginal && (
                <span className="text-sm text-foreground/60 line-through price-original">{formatNaira(item.priceOriginal)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center rounded-md bg-primary text-white px-3 py-1.5 hover:brightness-110 transition">
                Get Offer
              </button>
              {/* Removed lower Save text button; save icon now near title */}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}