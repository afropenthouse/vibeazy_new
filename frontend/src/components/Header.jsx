"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const onSearch = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const term = form.search.value.trim();
    const city = form.city.value;
    const params = new URLSearchParams();
    if (term) params.set("search", term);
    if (city) params.set("city", city);
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
          {/* Search + location */}
          <form onSubmit={onSearch} className="flex-1 hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-foreground/20 px-3 py-2 w-full">
              {/* search icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-foreground/60"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input name="search" placeholder="Search Nails" className="w-full bg-transparent outline-none text-sm" />
            </div>
            <div className="flex items-center gap-2 rounded-full border border-foreground/20 px-3 py-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-foreground/60"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Z"/><circle cx="12" cy="9" r="2"/></svg>
              <select name="city" className="bg-transparent text-sm outline-none">
                <option value="Lagos">Lagos</option>
                <option value="Abuja">Abuja</option>
                <option value="Port Harcourt">Port Harcourt</option>
              </select>
            </div>
            <button type="submit" className="inline-flex items-center rounded-full bg-primary text-white px-4 py-2 hover:brightness-110">
              <span className="mr-1">Search</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </form>
          {/* Icons + auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            <IconButton label="Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.8 11.4 12 20 3.2 11.4a5.6 5.6 0 1 1 7.9-7.9L12 4l.9-.5a5.6 5.6 0 0 1 7.9 7.9Z"/></svg>
            </IconButton>
            <IconButton label="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/><path d="M3 3h2l2 12h11l2-7H6"/></svg>
            </IconButton>
            <IconButton label="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8a6 6 0 1 0-12 0v5H4l2 3h12l2-3h-2V8"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </IconButton>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs sm:text-sm text-foreground/80">Hi, {user?.name || user?.email}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center rounded-full bg-primary text-white px-3 py-1.5 text-sm hover:brightness-110"
                >
                  Sign out
                </button>
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

function IconButton({ children, label }) {
  return (
    <button aria-label={label} className="inline-flex items-center justify-center rounded-full p-2 hover:bg-foreground/10 transition">
      {children}
    </button>
  );
}