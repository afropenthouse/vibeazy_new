"use client";
import Link from "next/link";

export default function AnnouncementBar() {
  return (
    <div className="w-full bg-primary/10 text-primary text-xs sm:text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
        <span>Discover daily deals across food, fashion, travel and more.</span>
        <Link href="#hot-deals" className="inline-flex items-center rounded-full bg-primary text-white px-3 py-1 hover:brightness-110">Explore Deals</Link>
      </div>
    </div>
  );
}