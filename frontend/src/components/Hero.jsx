"use client";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const slides = [
  {
    // First slide as a 4-image collage to highlight major categories
    images: ["/enter.webp", "/fashionhero.webp", "/air.webp", "/vegetable.webp"],
    alt: "All Discounts & Deals in one Place.",
    headline: "All Discounts & Deals in one Place.",
    sub: "Search and claim the best offers before they expire.",
  },
  {
    src: "/supermarket.webp",
    alt: "Restaurants Deals",
    headline: "Buy More, Spend Less",
    sub: "Get deals from supermarkets near you",
  },
  {
    src: "/fashion.webp",
    alt: "Beauty & Spas",
    headline: "Glow for Less",
    sub: "Get discounts from top fashion brands",
  },
  {
    src: "/Hotels.webp",
    alt: "Hotels & Dining",
    headline: "Save on Hotels",
    sub: "Enjoy the best deals on hotels",
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const router = useRouter();

  // Auto-advance: first slide 10s, others 5s
  useEffect(() => {
    if (slides.length <= 1) return;
    const duration = index === 0 ? 10000 : 5000;
    const id = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, duration);
    return () => clearTimeout(id);
  }, [index]);


  // Helper to split headline on comma and render rest on a new line
  const renderHeadline = (text) => {
    const parts = text.split(", ");
    if (parts.length === 1) return text;
    return (
      <>
        {parts[0]}
        <span className="block">{parts.slice(1).join(", ")}</span>
      </>
    );
  };

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[45vh] sm:h-[55vh] lg:h-[60vh]">
        {/* Background image or collage for first slide */}
        {slides[index].images ? (
          <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-4 gap-0 p-0">
            {slides[index].images.map((img, i) => (
              <div
                key={i}
                className="relative w-full"
                style={{ aspectRatio: "3 / 4" }}
              >
                <Image
                  src={img}
                  alt={slides[index].alt}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ))}
          </div>
        ) : (
          <Image
            src={slides[index].src}
            alt={slides[index].alt}
            fill
            className="object-cover"
            priority
          />
        )}

        {/* Overlay without blur, allow clicks to pass through */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full pt-8 pb-10 sm:pt-10 sm:pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${index}`}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.7 }}
                className="max-w-xl"
              >
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight text-white">
                  {renderHeadline(slides[index].headline)}
                </h1>
                <p className="mt-3 sm:mt-4 text-white/80 text-sm sm:text-base">
                  {slides[index].sub}
                </p>
                {/* removed inline search per request */}
              </motion.div>
            </AnimatePresence>

            {/* Static CTA buttons (moved outside the animated text block so they don't animate) */}
            <div className="mt-8 sm:mt-10 flex gap-3">
              <Link
                href="#hot-deals"
                className="rounded-md bg-primary text-white px-5 py-3 text-base sm:text-lg hover:brightness-110 transition"
              >
                Find Deals
              </Link>
              {/* <Link href="/how-it-works" className="rounded-md border border-white/30 text-white px-4 py-2 text-sm sm:text-base hover:bg-white/10 transition">
                How it works
              </Link> */}
            </div>
          </div>
          
        </div>

        {/* Indicators (hidden when there's only one slide) */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  i === index ? "bg-white" : "bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}