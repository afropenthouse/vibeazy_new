"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SMS_COST_KOBO = Number(process.env.NEXT_PUBLIC_SMS_COST_KOBO || 1000);

export default function MyDealsPage() {
  const { isAuthenticated, user } = useAuth();
  const [token, setToken] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState("");

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [interestCounts, setInterestCounts] = useState({});
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageSubmissionId, setMessageSubmissionId] = useState(null);
  const [messageUsers, setMessageUsers] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [walletBalanceKobo, setWalletBalanceKobo] = useState(0);
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState(1000);
  const [topupRef, setTopupRef] = useState("");
  const [topupAuthUrl, setTopupAuthUrl] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);

  const downloadCSV = () => {
    const rows = [["Name", "Phone", "Email"], ...messageUsers.map((u) => [u.name || "", u.phone || "", u.email || ""])];
    const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interested_users.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    try {
      const t = localStorage.getItem("authToken") || "";
      setToken(t);
    } catch {}
  }, []);

  // Load my submissions
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isAuthenticated) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/deals/my-submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled) {
          if (!res.ok) throw new Error(data.error || "Failed to load");
          // normalize incoming shape so we always have `deepLink` populated when possible
          const normalize = (x) => ({ ...x, deepLink: x.deepLink || x.deep_link || x.url || null });
          setItems(Array.isArray(data.items) ? data.items.map(normalize) : []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, token]);

  // Load public categories for dropdown
  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const res = await fetch(`${API_BASE}/admin/public/categories`);
        const data = await res.json();
        if (!cancelled && res.ok) {
          setCategories(Array.isArray(data.categories) ? data.categories : []);
        }
      } catch {}
    }
    loadCategories();
    return () => { cancelled = true; };
  }, []);

  const refresh = async () => {
    try {
      const res = await fetch(`${API_BASE}/deals/my-submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to refresh");
      const normalize = (x) => ({ ...x, deepLink: x.deepLink || x.deep_link || x.url || null });
      setItems(Array.isArray(data.items) ? data.items.map(normalize) : []);
    } catch (e) {
      setError(e.message);
      setToast("Failed to refresh deals");
    }
  };

  // Interest counts refresh helper
  const refreshInterestCounts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/deals/interest/counts/my-submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data && data.counts) {
        setInterestCounts(data.counts);
      } else {
        setToast("Failed to load interest counts");
      }
    } catch {
      setToast("Failed to load interest counts");
    }
  }, [token]);
  // Track interest click for a submission
  const trackInterestClick = async ({ submissionId }) => {
    try {
      await fetch(`${API_BASE}/deals/interest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ submissionId }),
        keepalive: true,
      });
    } catch {}
    // Refresh counts after a click
    refreshInterestCounts();
  };

  // Message modal handlers
  const openMessage = async (submissionId) => {
    setMessageOpen(true);
    setMessageSubmissionId(submissionId);
    setMessageText("");
    setMessageError("");
    setLoadingMessage(true);
    try {
      // Load wallet balance for SMS
      try {
        const wRes = await fetch(`${API_BASE}/sms/wallet/me`, { headers: { Authorization: `Bearer ${token}` } });
        const wData = await wRes.json();
        if (wRes.ok) setWalletBalanceKobo(Number(wData.balanceKobo || 0));
      } catch {}
      const subRes = await fetch(`${API_BASE}/deals/interest/users/${submissionId}` , {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subData = await subRes.json();
      if (!subRes.ok) throw new Error(subData.error || "Failed to load users");
      const bySubmission = Array.isArray(subData.users) ? subData.users : [];

      const theItem = items.find((x) => x.id === submissionId) || null;
      let byDeal = [];
      if (theItem && theItem.dealId) {
        const dealRes = await fetch(`${API_BASE}/deals/interest/users/by-deal/${theItem.dealId}` , {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dealData = await dealRes.json();
        if (dealRes.ok) byDeal = Array.isArray(dealData.users) ? dealData.users : [];
      }

      const seen = new Set();
      const merged = [];
      [...bySubmission, ...byDeal].forEach((u) => {
        const key = u.id ?? u.email ?? Math.random();
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(u);
      });
      setMessageUsers(merged);
    } catch (e) {
      setToast(e.message || "Failed to load interested users");
      setMessageUsers([]);
    } finally {
      setLoadingMessage(false);
    }
  };

  const closeMessage = () => {
    setMessageOpen(false);
    setMessageSubmissionId(null);
    setMessageUsers([]);
    setMessageError("");
  };

  // Load interest counts after items load
  useEffect(() => {
    if (!isAuthenticated || items.length === 0) return;
    refreshInterestCounts();
  }, [isAuthenticated, items.length, refreshInterestCounts]);
  const beginEdit = (item) => {
    setEditing({ ...item });
  };

  const closeEdit = () => {
    setEditing(null);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API_BASE}/deals/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setEditing((e) => ({ ...e, imageUrl: data.url }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        description: editing.description ?? null,
        merchantName: editing.merchantName,
        city: editing.city,
        category: editing.category ?? null,
        imageUrl: editing.imageUrl,
        oldPrice: editing.oldPrice ? Number(editing.oldPrice) : null,
        newPrice: editing.newPrice ? Number(editing.newPrice) : null,
        expiresAt: editing.expiresAt ? editing.expiresAt : null,
        deepLink: editing.deepLink ?? null,
      };
      const res = await fetch(`${API_BASE}/deals/my-submissions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      await refresh();
      closeEdit();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-rose-100 to-rose-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-4xl">🔒</span>
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-[#6d0e2b] bg-clip-text text-transparent mb-4">
              Login to view your deals
            </h3>
            <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
              Sign in to manage the deals you&apos;ve submitted.
              </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/login" className="rounded-2xl bg-[#6d0e2b] text-white px-8 py-4 font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#5a0b23] shadow-md">
                Sign In
              </a>
              <a href="/signup" className="rounded-2xl border-2 border-slate-300 text-slate-700 px-8 py-4 font-semibold hover:bg-white/50 transition-all duration-300 backdrop-blur-sm hover:border-slate-400 hover:shadow-md">
                Create Account
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 py-8">
      <div className="mx-auto w-[95%] max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
            My Deals
          </h1>
          <p className="text-slate-700 text-base max-w-2xl">Manage and track your submitted deals in one place</p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 mb-8 shadow-sm">
            <div className="flex items-center gap-3 text-red-700">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#6d0e2b] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600">Loading your deals...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-slate-400">📋</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No deals submitted yet</h3>
            <p className="text-slate-600 max-w-md mx-auto mb-8">Start sharing your favorite deals with the community</p>
            <a href="/submit" className="inline-flex items-center rounded-2xl bg-[#6d0e2b] text-white px-6 py-3 font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-[#5a0b23] shadow-md">
              Submit Your First Deal
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it) => {
              const status = String(it.status || "").toLowerCase();
              let statusClasses = "text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-medium";
              let statusLabel = it.status || "";
              if (status === "approved") {
                statusClasses = "text-xs px-3 py-1.5 rounded-full bg-green-100 text-green-800 font-semibold";
                statusLabel = "Approved";
              } else if (status === "pending") {
                statusClasses = "text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 font-semibold";
                statusLabel = "Pending";
              } else {
                statusLabel = statusLabel ? statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1) : "";
              }

              const oldP = it.oldPrice ? Number(it.oldPrice) : null;
              const newP = it.newPrice ? Number(it.newPrice) : null;
              const saved = oldP && newP && oldP > newP ? oldP - newP : null;
              const isCdcd = (String(it.merchantName || "").trim().toLowerCase() === "cdcd");
              const expiresAtStr = it.expiresAt ? new Date(it.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null;

              return (
                <div key={it.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-white/80 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
                  <div className="relative h-44 sm:h-48 bg-gray-100 overflow-hidden">
                    <Image 
                      src={it.imageUrl} 
                      alt={it.title || it.description || "Deal"} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />

                    {typeof it.discountPct === "number" && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-600 to-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                        {it.discountPct}% OFF
                      </div>
                    )}

                    {/* bookmark icon removed */}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold text-slate-800 truncate">{it.title || "Untitled deal"}</p>
                        {expiresAtStr && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] bg-rose-50 text-rose-700 border border-rose-200 font-medium whitespace-nowrap">
                              Expires {expiresAtStr}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 ml-2">
                        <span className={statusClasses}>{statusLabel}</span>
                      </div>
                    </div>

                    <p className="text-slate-700 text-sm mt-2 mb-2 break-words line-clamp-3">{it.description || "No description provided"}</p>

                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm text-slate-700 mb-2">
                            {oldP ? (
                              <span className="line-through mr-2 text-slate-400">₦{oldP.toLocaleString()}</span>
                            ) : null}
                          </div>
                          {newP ? (
                            <div className="text-xl text-[#6d0e2b] font-bold">₦{newP.toLocaleString()}</div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-2">
                        <div className="flex gap-2">
                          {status !== "approved" && (
                            <button
                              className="inline-flex items-center justify-center text-primary cursor-pointer px-4 py-2.5 text-sm font-medium duration-200"
                              onClick={() => beginEdit(it)}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-slate-700">
                            {(interestCounts[it.id] ?? 0)} user(s) interested
                          </span>
                          <button
                            className="inline-flex items-center justify-center rounded-xl bg-primary text-white px-3 py-2.5 text-sm hover:bg-primary/90 transition-all duration-200 hover:shadow-md shadow-sm min-w-10"
                            title="Send message"
                            onClick={() => openMessage(it.id)}
                          >
                            Send message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Edit Deal</h3>
              <button 
                onClick={closeEdit} 
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-200 hover:scale-110"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Merchant Name</label>
                <input
                  value={editing.merchantName || ""}
                  onChange={(e) => setEditing((x) => ({ ...x, merchantName: e.target.value }))}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:border-[#6d0e2b] focus:ring-2 focus:ring-[#6d0e2b]/20 transition-all duration-200"
                  placeholder="Enter merchant name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">City</label>
                  <select
                    value={editing.city || "Lagos"}
                    onChange={(e) => setEditing((x) => ({ ...x, city: e.target.value }))}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:border-[#6d0e2b] focus:ring-2 focus:ring-[#6d0e2b]/20 transition-all duration-200"
                  >
                    {['Lagos','Abuja','Port Harcourt','Ibadan','Kano'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Category</label>
                  <select
                    value={editing.category || ""}
                    onChange={(e) => setEditing((x) => ({ ...x, category: e.target.value }))}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:border-[#6d0e2b] focus:ring-2 focus:ring-[#6d0e2b]/20 transition-all duration-200"
                  >
                    <option value="">Select category</option>
                    {(
                      categories.length > 0
                        ? categories.map((c) => c.name)
                        : ["Restaurants","Fashion","Electronics","Furniture","Beauty","Travel","Entertainment"]
                    ).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Description</label>
                <textarea
                  rows={3}
                  value={editing.description || ""}
                  onChange={(e) => setEditing((x) => ({ ...x, description: e.target.value }))}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:border-[#6d0e2b] focus:ring-2 focus:ring-[#6d0e2b]/20 transition-all duration-200 resize-none"
                  placeholder="Describe this deal..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Original Price</label>
                  <input
                    type="number"
                    value={editing.oldPrice ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditing((x) => ({ ...x, oldPrice: val }));
                    }}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:border-[#6d0e2b] focus:ring-2 focus:ring-[#6d0e2b]/20 transition-all duration-200"
                    placeholder="₦0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Discounted Price</label>
                  <input
                    type="number"
                    value={editing.newPrice ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditing((x) => ({ ...x, newPrice: val }));
                    }}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:border-[#6d0e2b] focus:ring-2 focus:ring-[#6d0e2b]/20 transition-all duration-200"
                    placeholder="₦0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Expires At</label>
                  <input
                    type="date"
                    value={editing.expiresAt ? String(editing.expiresAt).slice(0,10) : ""}
                    onChange={(e) => setEditing((x) => ({ ...x, expiresAt: e.target.value }))}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:border-[#6d0e2b] focus:ring-2 focus:ring-[#6d0e2b]/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Deal Link (Optional)</label>
                  <input
                    value={editing.deepLink || ""}
                    onChange={(e) => setEditing((x) => ({ ...x, deepLink: e.target.value }))}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:border-[#6d0e2b] focus:ring-2 focus:ring-[#6d0e2b]/20 transition-all duration-200"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Image</label>
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm">
                    <Image src={editing.imageUrl} alt="Preview" fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) handleUpload(file);
                      }}
                      className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#6d0e2b] file:text-white hover:file:bg-[#5a0b23] transition-colors duration-200"
                    />
                    {uploadingImage && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                        <div className="w-4 h-4 border-2 border-[#6d0e2b] border-t-transparent rounded-full animate-spin"></div>
                        Uploading image...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
              <button 
                onClick={closeEdit} 
                className="rounded-xl border border-slate-300 bg-white text-slate-700 px-6 py-3 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-[#6d0e2b] to-[#8a1a3f] text-white px-7 py-3 font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-md"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </span>
                ) : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
      {messageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white/90 border border-white/60 shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Message Interested Users</h3>
                <p className="text-xs text-slate-600">Total: {messageUsers.length}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadCSV} className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-sm">Download user info</button>
                <button onClick={closeMessage} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">✕</button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-5">
              {loadingMessage ? (
                <div className="flex items-center gap-2 text-slate-600"><div className="w-5 h-5 border-2 border-[#6d0e2b] border-t-transparent rounded-full animate-spin"></div><span>Loading users...</span></div>
              ) : messageUsers.length === 0 ? (
                <div className="text-slate-700 text-sm">No users yet</div>
              ) : (
                <div className="text-slate-700 text-sm">Your message will be sent via SMS to interested users.</div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your message</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                  placeholder="Type a message to send to interested users"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#6d0e2b] focus:ring-2 focus:ring-[#6d0e2b]/20 transition-all duration-200 resize-none"
                />
                <div className="text-xs text-slate-600 mt-2">Total interested: {(interestCounts[messageSubmissionId] ?? 0)} • SMS recipients: {messageUsers.filter(u=>!!u.phone).length}</div>
                {messageUsers.filter(u=>!!u.phone).length === 0 && (
                  <div className="text-xs text-red-600 mt-2">No recipients with phone numbers.</div>
                )}
                {!!messageError && (
                  <div className="text-xs text-red-600 mt-2">{messageError}</div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex flex-col leading-tight">
                  <span className="text-sm text-slate-700">Balance: ₦{(walletBalanceKobo/100).toLocaleString(undefined,{maximumFractionDigits:2})}</span>
                  <span className="text-xs text-slate-600">Messages left: {Math.floor(walletBalanceKobo / SMS_COST_KOBO).toLocaleString()}</span>
                </div>
                <button
                  onClick={() => { setTopupOpen(true); setTopupAmount(1000); setTopupRef(""); setTopupAuthUrl(""); }}
                  className="rounded-xl bg-[#6d0e2b] text-white px-4 py-2 text-sm hover:brightness-110"
                >Top up</button>
              </div>
              <button onClick={closeMessage} className="rounded-xl border border-slate-300 bg-white text-slate-700 px-5 py-2.5 font-medium hover:bg-slate-50">Close</button>
              <button
                onClick={async () => {
                  setMessageError("");
                  setMessageSending(true);
                  try {
                    const res = await fetch(`${API_BASE}/sms/send`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ submissionId: messageSubmissionId, message: messageText }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setWalletBalanceKobo(Number(data.balanceKobo || 0));
                      closeMessage();
                      setToast("Message sent successfully");
                    } else {
                      setMessageError(data.error || "Failed to send SMS");
                      setToast(data.error || "Failed to send SMS");
                    }
                  } catch {
                    setMessageError("Failed to send SMS");
                    setToast("Failed to send SMS");
                  } finally {
                    setMessageSending(false);
                  }
                }}
                disabled={messageSending || !messageText.trim() || (messageUsers.filter(u=>!!u.phone).length === 0) || walletBalanceKobo < (messageUsers.filter(u=>!!u.phone).length * SMS_COST_KOBO)}
                className="rounded-xl bg-[#6d0e2b] text-white px-5 py-2.5 font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >Send message</button>
            </div>
          </div>
        </div>
      )}

      {topupOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Top up wallet</h3>
              <button onClick={()=>setTopupOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Amount (₦)</label>
                <input
                  type="number"
                  min={100}
                  value={topupAmount}
                  onChange={(e)=>setTopupAmount(Number(e.target.value || 0))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="1000"
                />
                <p className="text-xs text-slate-500 mt-1">SMS costs ₦10 per recipient.</p>
              </div>
              {!!topupAuthUrl && (
                <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                  <p className="mb-2">A new tab opened for payment. Complete it, then click Verify below.</p>
                  <a href={topupAuthUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open payment page</a>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button onClick={()=>setTopupOpen(false)} className="rounded-xl border border-slate-300 bg-white text-slate-700 px-5 py-2.5">Close</button>
              <button
                onClick={async ()=>{
                  setTopupLoading(true);
                  try {
                    const res = await fetch(`${API_BASE}/payments/init`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ amount: topupAmount, metadata: { walletTopup: true } }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setTopupRef(String(data.reference || data.payment?.reference || ""));
                      const url = data.authorizationUrl || data.data?.authorization_url || "";
                      if (url) {
                        setTopupAuthUrl(url);
                        try { window.open(url, "_blank"); } catch {}
                      }
                    } else {
                      setToast(data.error || "Failed to initialize payment");
                    }
                  } catch {
                    setToast("Failed to initialize payment");
                  } finally {
                    setTopupLoading(false);
                  }
                }}
                disabled={topupLoading || !topupAmount || topupAmount <= 0}
                className="rounded-xl bg-primary text-white px-5 py-2.5 font-semibold hover:brightness-110 disabled:opacity-50"
              >Pay</button>
              <button
                onClick={async ()=>{
                  if (!topupRef) { setToast("Start payment first"); return; }
                  setTopupLoading(true);
                  try {
                    const res = await fetch(`${API_BASE}/payments/verify`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ reference: topupRef }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      const bk = Number(data.walletBalanceKobo ?? 0);
                      if (bk) setWalletBalanceKobo(bk);
                      setToast("Top up successful");
                    } else {
                      setToast(data.error || "Verification failed");
                    }
                  } catch {
                    setToast("Verification failed");
                  } finally {
                    setTopupLoading(false);
                  }
                }}
                disabled={topupLoading || !topupRef}
                className="rounded-xl bg-emerald-600 text-white px-5 py-2.5 font-semibold hover:brightness-110 disabled:opacity-50"
              >Verify</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
