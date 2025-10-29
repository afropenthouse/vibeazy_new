"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await signup(name, email, password);
      setSuccess("Signup successful! Please check your email to verify your account.");
      setTimeout(() => router.push("/login?check-email=1"), 2000);
    } catch (err) {
      setError(err?.message || "Signup failed");
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
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-foreground/70 mt-1">Start saving with beautiful deals today.</p>

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" className="mt-1 w-full rounded-md border border-foreground/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Your name" />
          </div>
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
          <div>
            <label className="text-sm">Confirm Password</label>
            <div className="relative">
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                type={showConfirm ? "text" : "password"}
                className="mt-1 w-full rounded-md border border-foreground/10 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground"
                aria-label={showConfirm ? "Hide password" : "Show password"}
                title={showConfirm ? "Hide" : "Show"}
              >
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <button className="w-full rounded-md bg-primary text-white py-2 hover:brightness-110 transition">Sign up</button>
        </form>

        {!!success && (
          <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
            <div className="font-medium">{success}</div>
            <p className="mt-1">We sent a verification link to your inbox. Open it to activate your account. If you don’t see it, check your spam folder.</p>
          </div>
        )}
        <p className="text-sm text-foreground/70 mt-4">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </motion.div>
    </main>
  );
}