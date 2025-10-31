"use client";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-foreground/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src="/vibeazy.png" alt="VibeEazy" width={94} height={64} className="rounded" />
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-4">
          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link
              href={isAuthenticated ? "/saved" : "/login?next=/saved"}
              className="hover:text-primary transition-colors"
            >
              Save Deals
            </Link>
            <Link href="#contact" className="hover:text-primary transition-colors">Contact</Link>
          </nav>
          {/* Auth state */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm text-foreground/80">Hi, {user?.name || user?.email}</span>
              <Link
                href="/saved"
                className="inline-flex items-center rounded-md border border-foreground/20 text-foreground px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm hover:bg-foreground/5 transition"
              >
                Saved
              </Link>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center rounded-md bg-primary text-white px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm hover:brightness-110 transition"
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center rounded-md border border-foreground/20 text-foreground px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm hover:bg-foreground/5 transition"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-md bg-primary text-white px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm hover:brightness-110 transition"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}