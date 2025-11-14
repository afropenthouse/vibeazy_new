"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Categories from backend
  const [cats, setCats] = useState([]);
  useEffect(() => {
    let didCancel = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/admin/public/categories`);
        const data = await res.json();
        if (!didCancel && Array.isArray(data.categories)) {
          setCats(data.categories);
        }
      } catch (_) {
        // ignore; dropdown will be empty
      }
    }
    load();
    const onUpdate = () => load();
    window.addEventListener("categoriesUpdated", onUpdate);
    return () => {
      didCancel = true;
      window.removeEventListener("categoriesUpdated", onUpdate);
    };
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);
  const onSearch = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const term = form.search.value.trim();
    const params = new URLSearchParams();
    if (term) params.set("search", term);
    if (selectedCategory && selectedCategory !== "All") params.set("category", selectedCategory);
    router.push(`/?${params.toString()}#hot-deals`);
  };
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur">
      {/* Main navbar */}
      <div className="border-b border-foreground/10 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Go to homepage">
              <Image src="/vibeazy.png" alt="VibeEazy" width={94} height={64} className="rounded" />
            </Link>
          </div>
          {/* Search + location (Dribbble-style) */}
          <form onSubmit={onSearch} className="flex-1 hidden md:flex items-center gap-3">
            {/* Pill: input + category button + search icon */}
            <div className="relative flex items-center gap-2 rounded-full border border-foreground/20 px-3 py-2 w-full md:w-[60%] lg:w-[55%]">
              <input name="search" placeholder="Search deals" className="flex-1 bg-transparent outline-none text-sm" />
              <span className="h-5 w-px bg-foreground/10" aria-hidden="true" />

              {/* Categories dropdown trigger */}
              <button
                type="button"
                className="relative inline-flex items-center gap-1 text-sm text-foreground/80 hover:text-foreground"
                aria-haspopup="menu"
                aria-expanded={categoryOpen}
                onClick={() => setCategoryOpen((o) => !o)}
              >
                <span>Categories</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-foreground/60"><path d="m6 9 6 6 6-6"/></svg>
              </button>

              {/* Pink search button */}
              <button type="submit" aria-label="Search" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white hover:brightness-110">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              </button>

              {/* Dropdown panel */}
              {categoryOpen && (
                <div role="menu" className="absolute right-12 top-full mt-2 w-64 rounded-xl border border-foreground/10 bg-background shadow-xl p-2">
                  {/* Always include "All" option */}
                  <button
                    key="all"
                    type="button"
                    role="menuitem"
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-foreground/5 ${selectedCategory === "All" ? "text-primary" : "text-foreground"}`}
                    onClick={() => { setSelectedCategory("All"); setCategoryOpen(false); }}
                  >
                    <span>All</span>
                    {selectedCategory === "All" && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m5 12 4 4 10-10"/></svg>
                    )}
                  </button>
                  {cats.map((c) => (
                    <button
                      key={c.id ?? c.name}
                      type="button"
                      role="menuitem"
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-foreground/5 ${selectedCategory === c.name ? "text-primary" : "text-foreground"}`}
                      onClick={() => { setSelectedCategory(c.name); setCategoryOpen(false); }}
                    >
                      <span>{c.name}</span>
                      {selectedCategory === c.name && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m5 12 4 4 10-10"/></svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>
          {/* Icons + auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Icon buttons removed — actions remain in account menu */}
                {/* Account dropdown */}
                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground/5 px-3 py-1.5 text-sm hover:bg-foreground/10"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-foreground/70"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span className="hidden sm:inline">Hi, {user?.name || user?.email}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-foreground/60"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  {menuOpen && (
                    <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-foreground/10 bg-background shadow-xl p-2">
                      <Link href="/saved" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-foreground/5" role="menuitem">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" fill="none" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" /></svg>
                        Saved Deals
                      </Link>
                      <Link href="/submit" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-foreground/5" role="menuitem">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                        Create Deal
                      </Link>
                      <Link href="/my-deals" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-foreground/5" role="menuitem">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" fill="none" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M9 8h6"/><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"/></svg>
                        My Deals
                      </Link>
                      <div className="my-1 h-px bg-foreground/10" />
                      <button onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-600"><path d="M9 21h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2"/><path d="M3 12h13"/><path d="m8 7-5 5 5 5"/></svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="inline-flex items-center rounded-full border border-foreground/20 text-foreground px-3 py-1.5 text-sm hover:bg-foreground/5">Login</Link>
                <Link href="/signup" className="inline-flex items-center rounded-full bg-primary text-white px-3 py-1.5 text-sm hover:brightness-110">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// (notification icon and IconButton removed per UI request)
