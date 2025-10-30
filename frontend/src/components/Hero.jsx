"use client";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";

const slides = [
  {
    src: "/food.webp",
    alt: "Find Promos & Deals",
    headline: "Find Promos & Deals",
    sub: "Discover deals & discounts from your favorite restaurants",
  },
  // {
  //   src: "/supermarket.webp",
  //   alt: "Restaurants Deals",
  //   headline: "Buy More, Spend Less",
  //   sub: "Get deals from supermarkets near you",
  // },
  // {
  //   src: "/fashion.webp",
  //   alt: "Beauty & Spas",
  //   headline: "Glow for Less",
  //   sub: "Get discounts from top fashion brands",
  // },
  // {
  //   src: "/Hotels.webp",
  //   alt: "Hotels & Dining",
  //   headline: "Save on Hotels",
  //   sub: "Enjoy the best deals on hotels",
  // },
];

export default function Hero() {
  const [index, setIndex] = useState(0);

  // useEffect(() => {
  //   const id = setInterval(() => {
  //     setIndex((i) => (i + 1) % slides.length);
  //   }, 5000);
  //   return () => clearInterval(id);
  // }, []);


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
      <div className="relative h-[60vh] sm:h-[70vh] lg:h-[80vh]">
        {/* Background image */}
        <Image
          src={slides[index].src}
          alt={slides[index].alt}
          fill
          className="object-cover"
          priority
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${index}`}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.7 }}
                className="max-w-2xl"
              >
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight text-white">
                  {renderHeadline(slides[index].headline)}
                </h1>
                <p className="mt-3 sm:mt-4 text-white/80 text-sm sm:text-base lg:text-lg">
                  {slides[index].sub}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Static CTA buttons (moved outside the animated text block so they don't animate) */}
            <div className="mt-6 flex gap-3">
              <Link
                href="#hot-deals"
                className="rounded-md bg-primary text-white px-5 py-3 text-base sm:text-lg hover:brightness-110 transition"
              >
                Get Deals
              </Link>
              {/* <Link href="/how-it-works" className="rounded-md border border-white/30 text-white px-4 py-2 text-sm sm:text-base hover:bg-white/10 transition">
                How it works
              </Link> */}
            </div>
          </div>
          
        </div>

        {/* Indicators */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
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
      </div>
    </section>
  );
}