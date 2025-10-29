"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    async function verify() {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        if (!token) {
          setStatus("Missing token.");
          return;
        }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email/${encodeURIComponent(token)}`);
        if (res.redirected) {
          // Browser will follow redirect automatically; set informational status
          setStatus("Verified. Redirecting to login...");
          return;
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setStatus(err?.error || "Verification failed.");
          return;
        }
        setStatus("Email verified. You can now log in.");
      } catch {
        setStatus("Verification failed.");
      }
    }
    if (typeof window !== "undefined") verify();
  }, []);

  return (
    <main className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-6">
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur p-6 shadow-xl text-center"
      >
        <h1 className="text-2xl font-bold">Verify Email</h1>
        <p className="text-foreground/70 mt-2">{status}</p>
        <div className="mt-4">
          <a href="/login" className="rounded-md bg-primary text-white px-4 py-2 text-sm hover:brightness-110">Go to Login</a>
        </div>
      </motion.div>
    </main>
  );
}