"use client";
import Link from "next/link";

export default function AnnouncementBar() {
  return (
    <div className="w-full bg-primary text-white text-xs sm:text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
        <div className="overflow-hidden">
          <div className="announce-track" aria-hidden="false">
              <span className="announce-text">🎁 Enjoy up to 50% off on Vibeazy — Merry Christmas! Limited time only.</span>
            </div>
        </div>
      </div>

      <style jsx>{`
        .announce-track {
          display: inline-block;
          white-space: nowrap;
          will-change: transform;
          animation: marquee 14s linear infinite;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .announce-text { display: inline-block; padding-right: 2rem; }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}