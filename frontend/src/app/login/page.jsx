"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("check-email")) return "Please verify your email, then log in.";
      if (params.get("verified")) return "Email verified. You can now log in.";
    }
    return "";
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      // If a `next` query param is present, redirect there after login
      let nextPath = "/welcome";
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("next")) nextPath = params.get("next");
      }
      router.push(nextPath);
    } catch (err) {
      const msg = err?.message || "Invalid email or password";
      setError(msg);
    }
  };
  return (
    <main className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-6">
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur p-6 shadow-xl"
      >
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-foreground/70 mt-1">Log in to manage your favorite deals.</p>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-md border border-foreground/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm">Password</label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPwd ? "text" : "password"}
                className="mt-1 w-full rounded-md border border-foreground/10 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground"
                aria-label={showPwd ? "Hide password" : "Show password"}
                title={showPwd ? "Hide" : "Show"}
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <button className="w-full rounded-md bg-primary text-white py-2 hover:brightness-110 transition">Login</button>
        </form>

        {!!info && <p className="text-sm text-primary mt-3">{info}</p>}
        <p className="text-sm text-foreground/70 mt-4">
          Don’t have an account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
        <p className="text-xs text-foreground/60 mt-2">
          <Link href="/forgot-password" className="hover:underline">Forgot password?</Link>
        </p>
      </motion.div>
    </main>
  );
}