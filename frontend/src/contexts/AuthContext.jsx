"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem("authToken") || null;
      }
    } catch {}
    return null;
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setToken(null);
          setUser(null);
          if (typeof window !== "undefined") localStorage.removeItem("authToken");
        }
      } catch {}
      setLoading(false);
    }
    restore();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Invalid credentials");
    }
    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    if (typeof window !== "undefined") localStorage.setItem("authToken", data.token);
    return data;
  };

  const signup = async (name, email, password) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Signup failed");
    }
    const data = await res.json();
    // Do not auto-login; require email verification
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") localStorage.removeItem("authToken");
  };

  const value = useMemo(() => ({
    token,
    user,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    signup,
    logout,
  }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}