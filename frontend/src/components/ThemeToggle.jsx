"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  // Start with a deterministic server-friendly state and read actual preference on mount.
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  // On mount, read localStorage (client-only) and detect preference.
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("theme");
      if (saved) {
        setTheme(saved);
      } else if (window.matchMedia) {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
      }
    } catch {}
  }, []);

  // Reflect theme to DOM and persist.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // To avoid server/client mismatch render a neutral placeholder until mounted.
  const title = mounted ? (theme === "dark" ? "Switch to light" : "Switch to dark") : "Toggle theme";

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="inline-flex items-center justify-center rounded-md border border-foreground/10 w-5 h-5 bg-background hover:bg-foreground/5 transition"
      title={title}
    >
      {mounted ? (
        theme === "dark" ? (
          // Sun icon
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
            <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
            <path
              fillRule="evenodd"
              d="M12 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm0 16a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zm10-7a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM5 12a1 1 0 01-1 1H2a1 1 0 110-2h2a1 1 0 011 1zm13.657 6.657a1 1 0 010-1.414l1.414-1.414a1 1 0 111.414 1.414l-1.414 1.414a1 1 0 01-1.414 0zM3.515 6.343a1 1 0 011.414 0L6.343 7.757a1 1 0 11-1.414 1.414L3.515 7.757a1 1 0 010-1.414zm14.142-1.414a1 1 0 011.414 1.414L17.657 7.757a1 1 0 11-1.414-1.414l1.414-1.414zM6.343 17.657a1 1 0 011.414 0L9.171 19.07a1 1 0 11-1.414 1.414L6.343 19.07a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          // Moon icon
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
          </svg>
        )
      ) : (
        // Neutral placeholder (rendered both server & initial client) to avoid hydration mismatch
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 opacity-0">
          <circle cx="12" cy="12" r="6" />
        </svg>
      )}
    </button>
  );
}