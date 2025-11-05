"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
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

  const normalizePrices = (original, current) => {
    if (typeof original !== "number" || typeof current !== "number") {
      return { original, current };
    }
    if (original >= current) return { original, current };
    return { original: current, current: original };
  };

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

  const OFFER_URLS = {
    "Sweet Sensation": "https://sweetsensation.ng",
    "The Place": "https://theplace.com.ng/",
    "Chicken Republic": "https://www.chicken-republic.com/",
    "Burger King": "https://www.burger-king.ng/",
    "PieXpress": "https://www.instagram.com/piexpress_ng/?hl=en",
    "Bite Size": "https://vibeazy-new.vercel.app/",
  };
  
  const offerUrl = item.url || OFFER_URLS[item.title];

  // Initialize with deterministic value (pure at render). Defer Date.now to effect.
  const [expiresAt, setExpiresAt] = useState(() => {
    return item.expiresAt ? new Date(item.expiresAt).getTime() : null;
  });
  
  useEffect(() => {
    if (expiresAt == null) {
      const days = (item.id % 5) + 2;
      const rafId = window.requestAnimationFrame(() => {
        setExpiresAt(Date.now() + days * 24 * 60 * 60 * 1000);
      });
      return () => window.cancelAnimationFrame(rafId);
    }
  }, [expiresAt, item.id]);
  const [timeLeft, setTimeLeft] = useState("");
  
  useEffect(() => {
    const tick = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const d = Math.floor(diff / (24 * 60 * 60 * 1000));
      const h = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const s = Math.floor((diff % (60 * 1000)) / 1000);
      const parts = [];
      if (d > 0) parts.push(String(d).padStart(2, "0"));
      parts.push(String(h).padStart(2, "0"));
      parts.push(String(m).padStart(2, "0"));
      parts.push(String(s).padStart(2, "0"));
      setTimeLeft(`${d > 0 ? parts[0] + "d " : ""}${parts.slice(d > 0 ? 1 : 0).join(":")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // Derive simple urgency state for styling the expiry badge
  const getExpiryBadgeClasses = () => {
    if (!expiresAt) return "bg-primary/10 text-primary border border-primary/20";
    const msLeft = expiresAt - Date.now();
    if (msLeft <= 0) return "bg-red-600 text-white";
    const sixHours = 6 * 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;
    if (msLeft <= sixHours) return "bg-yellow-100 text-yellow-700 border border-yellow-300";
    if (msLeft <= oneDay) return "bg-orange-100 text-orange-700 border border-orange-300";
    return "bg-primary/10 text-primary border border-primary/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="discount-card group rounded-2xl border border-foreground/10 overflow-hidden bg-background shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1"
    >
      {/* Image Section */}
      <div className="relative overflow-hidden">
        <Image 
          src={item.image} 
          alt={item.title} 
          width={800} 
          height={600} 
          className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
        
        {/* Discount Badge */}
        {percentOff !== null && percentOff > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <div className="relative">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg">
                {percentOff}% OFF
              </div>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={async () => {
            if (!isAuthenticated) {
              router.push("/login");
              return;
            }
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
            toggle(item);
          }}
          className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
          aria-pressed={saved}
          aria-label={saved ? "Unsave deal" : "Save deal"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={`h-5 w-5 transition-all duration-200 ${saved ? "text-red-500 fill-current" : "text-gray-600"}`}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
          </svg>
        </button>

        {/* Removed image overlay for expiry; moved into content area */}
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title, Place, and Expiry badge */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <button
            onClick={() => router.push(`/deal/${encodeURIComponent(item.id)}`)}
            className="text-left font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1"
            aria-label={`View ${item.title}`}
          >
            {item.title}
            </button>
            {item.place && (
              <div className="flex items-center gap-1 mt-1">
                <svg className="w-3 h-3 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-xs text-foreground/60">{item.place}</p>
              </div>
            )}
          </div>
          {/* Expiry badge in white space */}
          <div className="shrink-0">
            <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${getExpiryBadgeClasses()}`} aria-live="polite">
              <span className="opacity-80">Expires</span>
              <span className="font-mono font-semibold">{timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground/70 mb-4 line-clamp-2 flex-1">{item.description}</p>

        {/* Price and Action Section */}
        {(item.priceCurrent || item.priceOriginal) && (
          <div className="mt-auto pt-4 border-t border-foreground/5">
            <div className="flex items-center justify-between">
              {/* Price Display */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  {typeof displayCurrent === "number" && (
                    <span className="text-xl font-bold text-primary price-current">
                      {formatNaira(displayCurrent)}
                    </span>
                  )}
                  {typeof displayOriginal === "number" && displayOriginal > displayCurrent && (
                    <span className="text-sm text-foreground/40 line-through price-original">
                      {formatNaira(displayOriginal)}
                    </span>
                  )}
                </div>
                {typeof displayOriginal === "number" && displayOriginal > displayCurrent && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-green-600 font-medium">
                      Save {formatNaira(displayOriginal - displayCurrent)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2">
                {offerUrl ? (
                  <a
                    href={offerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-white px-4 py-2.5 hover:shadow-lg transition-all duration-200 hover:scale-105 font-semibold text-sm"
                    aria-label={`Get offer from ${item.title}`}
                  >
                    <span>Place Order</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center rounded-xl bg-primary/60 text-white px-4 py-2.5 cursor-not-allowed font-semibold text-sm"
                  >
                    Get Offer
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}