"use client";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";

const desktopSlides = [
  {
    src: "/discount.png",
    alt: "Hotels & Dining",
    headline: "",
    sub: "",
  },
  {
    src: "/discount_2.png",
    alt: "Hotels & Dining",
    headline: "",
    sub: "",
  },
  {
    src: "/v4.png",
    alt: "Hotels & Dining",
    headline: "",
    sub: "",
  },
  {
    src: "/discount_3.png",
    alt: "Hotels & Dining",
    headline: "",
    sub: "",
  },
  {
    src: "/v3.png",
    alt: "Hotels & Dining",
    headline: "",
    sub: "",
  },
  {
    src: "/v5.png",
    alt: "Hotels & Dining",
    headline: "",
    sub: "",
  },
];

const mobileSlides = [
  {
    src: "/mobile1.png",
    alt: "Mobile Deal 1",
    headline: "",
    sub: "",
  },
  {
    src: "/mobile2.png",
    alt: "Mobile Deal 2",
    headline: "",
    sub: "",
  },
  {
    src: "/mobile3.png",
    alt: "Mobile Deal 3",
    headline: "",
    sub: "",
  },
  {
    src: "/mobile4.png",
    alt: "Mobile Deal 4",
    headline: "",
    sub: "",
  },
  {
    src: "/mobile5.png",
    alt: "Mobile Deal 5",
    headline: "",
    sub: "",
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const slides = isMobile ? mobileSlides : desktopSlides;

  // Auto-advance: first slide 10s, others 5s
  useEffect(() => {
    if (slides.length <= 1) return;
    const duration = index === 0 ? 3000 : 4000;
    const id = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, duration);
    return () => clearTimeout(id);
  }, [index, slides.length]);

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

  const getImageClassName = () => {
    // return isMobile ? "object-contain" : "object-cover";
    return "object-cover";
  };

  return (
    <section className="relative overflow-hidden">
      {/* Wider container on mobile with same height */}
      <div className="relative h-80 sm:h-72 lg:h-80 w-full">
        {/* Background image or collage for first slide */}
        {slides[index].images ? (
          <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-0 p-0">
            {slides[index].images.map((img, i) => {
              const src = typeof img === "string" && !img.startsWith("/") && !img.startsWith("http") ? `/${img}` : img;
              return (
                <div
                  key={i}
                  className="relative w-full h-full"
                >
                  <Image
                    src={src}
                    alt={slides[index].alt}
                    fill
                    sizes="100vw"
                    className={getImageClassName()}
                    priority
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`absolute inset-0 ${isMobile ? 'w-full flex justify-center' : ''}`}>
            <Image
              src={slides[index].src}
              alt={slides[index].alt}
              fill
              sizes="100vw"
              className={getImageClassName()}
              priority={index === 0}
            />
          </div>
        )}

        {/* Overlay without blur, allow clicks to pass through */}
        <div className="absolute inset-0 bg-black/0 pointer-events-none" />

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
              </motion.div>
            </AnimatePresence>

            {/* Static CTA buttons */}
            <div className="mt-8 sm:mt-10 flex gap-3">
              {/* <Link
                href="#hot-deals"
                className="rounded-md bg-primary text-white px-5 py-3 text-base sm:text-lg hover:brightness-110 transition"
              >
                Find Deals
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
