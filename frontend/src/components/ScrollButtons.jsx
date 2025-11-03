"use client";
import { useEffect, useState } from "react";

export default function ScrollButtons() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);

  useEffect(() => {
    const handler = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const innerH = window.innerHeight;
      const docH = document.documentElement.scrollHeight || document.body.scrollHeight;
      setShowTop(scrollY > 200);
      setShowBottom(innerH + scrollY < docH - 200);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollBottom = () => {
    const docH = document.documentElement.scrollHeight || document.body.scrollHeight;
    window.scrollTo({ top: docH, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
      {showTop && (
        <button
          type="button"
          onClick={scrollTop}
          aria-label="Scroll to top"
          title="Scroll to top"
          className="inline-flex items-center justify-center rounded-full w-12 h-12 bg-primary text-white font-bold shadow-2xl border border-white/20 ring-2 ring-white/10 hover:brightness-110 hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-primary/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </button>
      )}
      {showBottom && (
        <button
          type="button"
          onClick={scrollBottom}
          aria-label="Scroll to bottom"
          title="Scroll to bottom"
          className="inline-flex items-center justify-center rounded-full w-12 h-12 bg-primary text-white font-bold shadow-2xl border border-white/20 ring-2 ring-white/10 hover:brightness-110 hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-primary/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}
    </div>
  );
}