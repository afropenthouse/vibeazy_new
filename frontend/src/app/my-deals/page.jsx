"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
  // Interest tracking state
  const [interestCounts, setInterestCounts] = useState({});
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageSubmissionId, setMessageSubmissionId] = useState(null);
  const [messageUsers, setMessageUsers] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState(false);

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
          setItems(Array.isArray(data.items) ? data.items : []);
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
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e.message);
      setToast("Failed to refresh deals");
    }
  };

  // Interest counts refresh helper
  const refreshInterestCounts = async () => {
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
  };

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
    setLoadingMessage(true);
    try {
      const res = await fetch(`${API_BASE}/deals/interest/users/${submissionId}` , {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setMessageUsers(Array.isArray(data.users) ? data.users : []);
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
  };

  // Load interest counts after items load
  useEffect(() => {
    if (!isAuthenticated) return;
    refreshInterestCounts();
  }, [isAuthenticated, token, items.length]);

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
              Sign in to manage the deals you've submitted.
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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-[#6d0e2b] bg-clip-text text-transparent mb-4">
            My Deals
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">Manage and track your submitted deals in one place</p>
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
                <div key={it.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-white/80 overflow-hidden hover:shadow-lg transition-all duration-300 group">
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

                    <div className="absolute top-3 right-3">
                      <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200">
                        <span className="text-rose-600 text-sm">🔖</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold text-slate-800 truncate">{it.merchantName}</p>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{it.city}</span>
                          {expiresAtStr && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] bg-rose-50 text-rose-700 border border-rose-200 font-medium whitespace-nowrap">
                              Expires {expiresAtStr}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex-shrink-0 ml-2">
                        <span className={statusClasses}>{statusLabel}</span>
                      </div>
                    </div>

                    <p className="text-slate-600 text-sm mt-2 line-clamp-2 leading-relaxed">{it.description || "No description provided"}</p>

                    <div className="mt-5 pt-4 border-t border-slate-100">
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
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
                          {interestCounts[it.id] || 0} users interested
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-2">
                          <a
                            href={it.deepLink ? it.deepLink : `/deal/${it.id}`}
                            {...(it.deepLink ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            onClick={() => trackInterestClick({ submissionId: it.id })}
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#6d0e2b] to-[#8a1a3f] text-white px-4 py-2.5 text-sm font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105 shadow-md flex-1 min-w-0"
                            title="View and get this offer"
                          >
                            Get Offer
                          </a>
                          {status !== "approved" && (
                            <button
                              className="inline-flex items-center justify-center rounded-xl bg-slate-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-slate-700 transition-all duration-200 hover:shadow-md hover:scale-105 shadow"
                              onClick={() => beginEdit(it)}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        <button
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 px-3 py-2.5 text-sm hover:bg-slate-50 transition-all duration-200 hover:shadow-md hover:border-slate-300 shadow-sm min-w-10"
                          title="View interested users"
                          onClick={() => openMessage(it.id)}
                        >
                          <span className="text-slate-500">💬</span>
                        </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Interested Users</h3>
              <button onClick={closeMessage} className="rounded-md px-3 py-1 bg-slate-100 hover:bg-slate-200">✕</button>
            </div>
            {loadingMessage ? (
              <p className="text-slate-600">Loading...</p>
            ) : messageUsers.length === 0 ? (
              <p className="text-slate-600">No users yet</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {messageUsers.map((u) => (
                  <li key={u.id ?? u.email} className="flex items-center justify-between border border-slate-200 rounded-md px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{u.name || u.email || "Unknown user"}</p>
                      {u.phone && <p className="text-xs text-slate-600">{u.phone}</p>}
                    </div>
                    {u.phone && (
                      <button
                        className="text-xs rounded-md bg-slate-100 px-2 py-1 hover:bg-slate-200"
                        onClick={() => navigator.clipboard.writeText(u.phone)}
                      >
                        Copy
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 text-xs text-slate-600">Total interested users: {messageUsers.length}</div>
          </div>
        </div>
      )}
    </main>
  );
}