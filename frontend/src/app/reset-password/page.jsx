"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("token") || "";
      setToken(t);
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      const res = await fetch("http://localhost:4000/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus(err?.error || "Reset failed");
        return;
      }
      setStatus("Password reset successful. You can now log in.");
    } catch {
      setStatus("Reset failed. Try again.");
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
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-foreground/70 mt-2">Enter a new password for your account.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm">New Password</label>
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
          <button className="w-full rounded-md bg-primary text-white py-2 hover:brightness-110 transition">Reset Password</button>
        </form>
        {!!status && <p className="text-sm text-foreground/80 mt-3">{status}</p>}
      </motion.div>
    </main>
  );
}