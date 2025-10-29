"use client";
import { motion } from "framer-motion";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/password/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus("If the email exists, a reset link has been sent.");
    } catch {
      setStatus("Failed to send reset link. Try again.");
    }
  };

  return (
    <main className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-6">
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur p-6 shadow-xl"
      >
        <h1 className="text-2xl font-bold">Forgot Password</h1>
        <p className="text-foreground/70 mt-2">Enter your email to receive a reset link.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-md border border-foreground/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="you@example.com" />
          </div>
          <button className="w-full rounded-md bg-primary text-white py-2 hover:brightness-110 transition">Send Reset Link</button>
        </form>
        {!!status && <p className="text-sm text-foreground/80 mt-3">{status}</p>}
      </motion.div>
    </main>
  );
}