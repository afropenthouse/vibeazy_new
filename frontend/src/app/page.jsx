"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Hero from "@/components/Hero";
import SearchFilter from "@/components/SearchFilter";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const shouldShow = params.get("welcome") === "1";
    if (shouldShow && isAuthenticated) {
      setShowWelcome(true);
    }
  }, [isAuthenticated]);

  // On initial load, show the deals section like your screenshot
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = document.getElementById("hot-deals");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const closeWelcome = () => {
    setShowWelcome(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      window.history.replaceState({}, "", url.toString());
    }
  };
  return (
    <main>
      <Hero />

      {/* Search + Filter + List */}
      <SearchFilter />

      {/* Welcome modal overlay */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold">Welcome{user?.name ? `, ${user.name}` : "!"}</h2>
            <p className="text-foreground/70 mt-2">You’re signed in. Explore today’s deals below.</p>
            <div className="mt-4 flex items-center gap-3">
              <a href="#hot-deals" className="rounded-md bg-primary text-white px-4 py-2 text-sm hover:brightness-110">Browse Deals</a>
              <a href="/saved" className="rounded-md border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5">Saved Deals</a>
              <button onClick={closeWelcome} className="rounded-md border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5">Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
