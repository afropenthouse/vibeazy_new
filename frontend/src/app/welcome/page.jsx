"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function WelcomePage() {
  const { user } = useAuth();
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
        <h1 className="text-2xl font-bold">Welcome{user?.name ? `, ${user.name}` : "!"}</h1>
        <p className="text-foreground/70 mt-2">You’re signed in. Jump to your saved favorites.</p>
        <div className="mt-6 flex items-center justify-center">
          <Link href="/saved" className="rounded-md bg-primary text-white px-4 py-2 text-sm hover:brightness-110">Saved Deals</Link>
        </div>
      </motion.div>
    </main>
  );
}