"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedDeals } from "@/contexts/SavedDealsContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { savedList } = useSavedDeals();
  const savedCount = Array.isArray(savedList) ? savedList.length : 0;
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  // removed local authModal state, using global event instead
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
      <div className="border-b border-foreground/10 bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-18 md:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Go to homepage" className="inline-flex items-center">
              <Image src="/vibeazy.png" alt="VibeEazy" width={84} height={56} className="rounded-sm" />
            </Link>
          </div>
          <form onSubmit={onSearch} className="flex-1 hidden md:flex items-center justify-center">
            <div className="relative flex items-center gap-3 rounded-full border border-foreground/20 px-4 h-10 w-full md:w-[80%] lg:w-[80%] xl:w-[75%] shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground/60">
                <circle cx="11" cy="11" r="7"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
              <input name="search" placeholder="Search deals" className="flex-1 bg-transparent outline-none text-sm" />
              <span className="h-5 w-px bg-foreground/10" aria-hidden="true" />
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-foreground/80 hover:text-foreground"
                aria-haspopup="menu"
                aria-expanded={categoryOpen}
                onClick={() => setCategoryOpen((o) => !o)}
              >
                <span>Categories</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-foreground/60"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <button type="submit" aria-label="Search" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white hover:brightness-110">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              </button>
              {categoryOpen && (
                <div role="menu" className="absolute right-14 top-full mt-2 w-64 rounded-xl border border-foreground/10 bg-background shadow-xl p-2">
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
          <div className="flex items-center gap-3">
            <Link href="/saved" aria-label="Saved deals" className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-semibold">{savedCount}</span>
              )}
            </Link>
            <NotificationsDropdown />
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <span className="font-medium">{user?.name || user?.email}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-foreground/60"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  {menuOpen && (
                    <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-foreground/10 bg-background shadow-xl p-2">
                      <Link href="/saved" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-foreground/5" role="menuitem">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" fill="none" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
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
                <button onClick={() => window.dispatchEvent(new CustomEvent('authModalOpen', { detail: { view: 'login' } }))} className="inline-flex items-center rounded-full border border-foreground/20 text-foreground px-3 py-1.5 text-sm hover:bg-foreground/5">Login</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('authModalOpen', { detail: { view: 'signup' } }))} className="inline-flex items-center rounded-full bg-primary text-white px-3 py-1.5 text-sm hover:brightness-110">Sign up</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let didCancel = false;
    const load = () => {
      try {
        const raw = localStorage.getItem("notifications");
        let list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list) || list.length === 0) {
          list = [
            { id: "n1", title: "Welcome to Vibeazy", message: "Enjoy the best deals — start saving today.", createdAt: new Date().toISOString(), read: false },
            { id: "n2", title: "Explore Highlights", message: "New discounts added daily. Check Top Deals.", createdAt: new Date().toISOString(), read: false },
          ];
        }
        if (!didCancel) {
          setItems(list);
          const unread = list.filter((n) => !n.read).length;
          setCount(unread);
        }
        try { localStorage.setItem("notifications", JSON.stringify(list)); } catch {}
      } catch {}
    };
    load();
    const onUpdate = () => load();
    window.addEventListener("notificationsUpdated", onUpdate);
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => { didCancel = true; window.removeEventListener("notificationsUpdated", onUpdate); document.removeEventListener("mousedown", onDocClick); };
  }, []);
  const markAllRead = () => {
    const next = items.map((n) => ({ ...n, read: true }));
    setItems(next);
    setCount(0);
    try { localStorage.setItem("notifications", JSON.stringify(next)); } catch {}
    window.dispatchEvent(new CustomEvent("notificationsUpdated"));
  };
  const clearAll = () => {
    setItems([]);
    setCount(0);
    try { localStorage.setItem("notifications", JSON.stringify([])); } catch {}
    window.dispatchEvent(new CustomEvent("notificationsUpdated"));
  };
  const toggleRead = (id) => {
    const next = items.map((n) => (n.id === id ? { ...n, read: !n.read } : n));
    setItems(next);
    const unread = next.filter((n) => !n.read).length;
    setCount(unread);
    try { localStorage.setItem("notifications", JSON.stringify(next)); } catch {}
    window.dispatchEvent(new CustomEvent("notificationsUpdated"));
  };
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="Notifications" onClick={() => setOpen((o) => !o)} className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-semibold">{count}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-white/50 bg-white shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            <div className="flex items-center gap-2">
              <button onClick={markAllRead} className="text-xs rounded-full border border-foreground/20 px-3 py-1 hover:bg-foreground/5">Mark all read</button>
              <button onClick={clearAll} className="text-xs rounded-full border border-foreground/20 px-3 py-1 hover:bg-foreground/5">Clear</button>
            </div>
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-foreground/70">No notifications</div>
          ) : (
            <ul className="max-h-80 overflow-auto p-3 space-y-3">
              {items.map((n) => (
                <li key={n.id} className={`rounded-xl px-4 py-3 text-sm border shadow-sm ${n.read ? "bg-foreground/5 border-foreground/10" : "bg-primary/10 border-primary/20"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${n.read ? "bg-foreground/10 text-foreground/60" : "bg-primary text-white"}`}>🔔</span>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{n.title}</div>
                      <div className="text-foreground/80">{n.message}</div>
                      <div className="mt-1 text-[11px] text-foreground/60 flex items-center justify-between">
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                        <button onClick={() => toggleRead(n.id)} className="underline hover:no-underline">{n.read ? "Mark unread" : "Mark read"}</button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 py-3 border-t border-foreground/10 bg-foreground/5 flex items-center justify-between">
            <Link href="/#hot-deals" className="inline-flex items-center rounded-full bg-primary text-white px-3 py-1.5 text-xs hover:brightness-110">View Top Deals</Link>
            <Link href="/submit" className="inline-flex items-center rounded-full border border-foreground/20 text-foreground px-3 py-1.5 text-xs hover:bg-foreground/5">Submit a Deal</Link>
          </div>
        </div>
      )}
    </div>
  );
}

// (notification icon and IconButton removed per UI request)
