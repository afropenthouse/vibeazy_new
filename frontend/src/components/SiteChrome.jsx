"use client";
import Image from "next/image";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import CategoriesNav from "@/components/CategoriesNav";
import Footer from "@/components/Footer";
import ScrollButtons from "@/components/ScrollButtons";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [authModalView, setAuthModalView] = useState(null); // 'login' | 'signup' | 'forgot' | null

  useEffect(() => {
    const onOpen = (e) => {
      const view = e?.detail?.view || 'login';
      setAuthModalView(view);
    };
    const onClose = () => setAuthModalView(null);
    window.addEventListener('authModalOpen', onOpen);
    window.addEventListener('authModalClose', onClose);
    return () => {
      window.removeEventListener('authModalOpen', onOpen);
      window.removeEventListener('authModalClose', onClose);
    };
  }, []);

  if (isAdmin) {
    return (
      <>
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-foreground/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/vibeazy.png" alt="VibeEazy" width={94} height={64} className="rounded" />
              <span className="text-sm md:text-base font-medium text-foreground/80">admin</span>
            </div>
          </div>
        </header>
        {children}
      </>
    );
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <Suspense fallback={null}>
        <CategoriesNav />
      </Suspense>
      {children}
      <Footer />
      <ScrollButtons />

      {authModalView && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center" onClick={() => setAuthModalView(null)}>
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <AuthModal view={authModalView} onClose={() => setAuthModalView(null)} />
          </div>
        </div>
      )}
    </>
  );
}

function AuthModal({ view, onClose }) {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [status, setStatus] = useState("");

  const onLogin = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setStatus(err?.message || "Invalid email or password");
    }
  };

  const onSignup = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      const res = await signup(name, email, password, phone);
      setStatus("Signup successful! Please verify your email.");
    } catch (err) {
      setStatus(err?.message || "Signup failed");
    }
  };

  const onForgot = async (e) => {
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
    <div className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-xl">
      {view === 'login' && (
        <>
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-foreground/70 mt-1">Login to share deals and discounts.</p>
          {status && <p className="text-sm text-red-500 mt-2">{status}</p>}
          <form className="mt-6 space-y-4" onSubmit={onLogin}>
            <div>
              <label className="text-sm">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-md border border-foreground/10 px-3 py-2" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm">Password</label>
              <div className="relative">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPwd ? "text" : "password"} className="mt-1 w-full rounded-md border border-foreground/10 px-3 py-2 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/60">{showPwd ? "🙈" : "👁️"}</button>
              </div>
            </div>
            <button className="w-full rounded-md bg-primary text-white py-2">Login</button>
          </form>
          <div className="mt-3 flex items-center justify-between">
            <button className="text-sm text-primary hover:underline" onClick={() => window.dispatchEvent(new CustomEvent('authModalOpen', { detail: { view: 'signup' } }))}>Sign up</button>
            <button className="text-xs text-foreground/70 hover:underline" onClick={() => window.dispatchEvent(new CustomEvent('authModalOpen', { detail: { view: 'forgot' } }))}>Forgot password?</button>
          </div>
        </>
      )}

      {view === 'signup' && (
        <>
          <h2 className="text-2xl font-bold">Create your account</h2>
          <p className="text-foreground/70 mt-1">Start saving with beautiful deals today.</p>
          {status && <p className="text-sm text-red-500 mt-2">{status}</p>}
          <form className="mt-6 space-y-4" onSubmit={onSignup}>
            <div>
              <label className="text-sm">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} type="text" className="mt-1 w-full rounded-md border border-foreground/10 px-3 py-2" placeholder="Your name" />
            </div>
            <div>
              <label className="text-sm">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-md border border-foreground/10 px-3 py-2" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className="mt-1 w-full rounded-md border border-foreground/10 px-3 py-2" placeholder="08012345678" />
            </div>
            <div>
              <label className="text-sm">Password</label>
              <div className="relative">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPwd ? "text" : "password"} className="mt-1 w-full rounded-md border border-foreground/10 px-3 py-2 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/60">{showPwd ? "🙈" : "👁️"}</button>
              </div>
            </div>
            <button className="w-full rounded-md bg-primary text-white py-2">Sign up</button>
          </form>
          <div className="mt-3 flex items-center justify-between">
            <button className="text-sm text-primary hover:underline" onClick={() => window.dispatchEvent(new CustomEvent('authModalOpen', { detail: { view: 'login' } }))}>Login</button>
          </div>
        </>
      )}

      {view === 'forgot' && (
        <>
          <h2 className="text-2xl font-bold">Forgot Password</h2>
          <p className="text-foreground/70 mt-2">Enter your email to receive a reset link.</p>
          {status && <p className="text-sm text-foreground/80 mt-2">{status}</p>}
          <form onSubmit={onForgot} className="mt-6 space-y-4">
            <div>
              <label className="text-sm">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-md border border-foreground/10 px-3 py-2" placeholder="you@example.com" />
            </div>
            <button className="w-full rounded-md bg-primary text-white py-2">Send Reset Link</button>
          </form>
          <div className="mt-3 flex items-center justify-between">
            <button className="text-sm text-primary hover:underline" onClick={() => window.dispatchEvent(new CustomEvent('authModalOpen', { detail: { view: 'login' } }))}>Back to login</button>
          </div>
        </>
      )}
    </div>
  );
}