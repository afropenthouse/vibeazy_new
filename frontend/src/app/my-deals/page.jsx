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

  const [editing, setEditing] = useState(null); // { ...submission }
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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
    }
  };

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
              Sign in to manage the deals you’ve submitted.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/login" className="rounded-2xl bg-[#6d0e2b] text-white px-8 py-4 font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#5a0b23]">
                Sign In
              </a>
              <a href="/signup" className="rounded-2xl border-2 border-slate-300 text-slate-700 px-8 py-4 font-semibold hover:bg-white/50 transition-all duration-300 backdrop-blur-sm">
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
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-[#6d0e2b] bg-clip-text text-transparent">
            My Deals
          </h1>
          <p className="text-slate-600 mt-2">View and edit your submitted deals.</p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 mb-6">
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
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#6d0e2b] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-slate-600">
            You have not submitted any deals yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it) => (
              <div key={it.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 overflow-hidden">
                <div className="relative h-40">
                  <Image src={it.imageUrl} alt={it.title || it.description || "Deal"} fill className="object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                      {it.status}
                    </span>
                    {typeof it.discountPct === "number" && (
                      <span className="text-sm font-semibold text-rose-700">{it.discountPct}% OFF</span>
                    )}
                  </div>
                  <p className="text-slate-800 font-semibold truncate">{it.merchantName} • {it.city}</p>
                  <p className="text-slate-600 text-sm truncate mt-1">{it.description || "No description"}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-slate-700">
                      <span className="line-through mr-2">{it.oldPrice ? `₦${it.oldPrice}` : ""}</span>
                      <span className="font-bold">{it.newPrice ? `₦${it.newPrice}` : ""}</span>
                    </div>
                    <button
                      className="rounded-lg bg-[#6d0e2b] text-white px-4 py-2 text-sm hover:bg-[#5a0b23] disabled:opacity-50"
                      onClick={() => beginEdit(it)}
                      disabled={it.status === "approved"}
                    >
                      {it.status === "approved" ? "Approved" : "Edit"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Edit Submission</h3>
              <button onClick={closeEdit} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Merchant Name</label>
                <input
                  value={editing.merchantName || ""}
                  onChange={(e) => setEditing((x) => ({ ...x, merchantName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                  <select
                    value={editing.city || "Lagos"}
                    onChange={(e) => setEditing((x) => ({ ...x, city: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300"
                  >
                    {['Lagos','Abuja','Port Harcourt','Ibadan','Kano'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                  <select
                    value={editing.category || ""}
                    onChange={(e) => setEditing((x) => ({ ...x, category: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300"
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={editing.description || ""}
                  onChange={(e) => setEditing((x) => ({ ...x, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Original Price</label>
                  <input
                    type="number"
                    value={editing.oldPrice ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditing((x) => ({ ...x, oldPrice: val }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Discounted Price</label>
                  <input
                    type="number"
                    value={editing.newPrice ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditing((x) => ({ ...x, newPrice: val }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Expires At</label>
                  <input
                    type="date"
                    value={editing.expiresAt ? String(editing.expiresAt).slice(0,10) : ""}
                    onChange={(e) => setEditing((x) => ({ ...x, expiresAt: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Deal Link (Optional)</label>
                  <input
                    value={editing.deepLink || ""}
                    onChange={(e) => setEditing((x) => ({ ...x, deepLink: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Image</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-16 rounded-md overflow-hidden border">
                    <Image src={editing.imageUrl} alt="Preview" fill className="object-cover" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) handleUpload(file);
                    }}
                  />
                  {uploadingImage && (
                    <span className="text-sm text-slate-600">Uploading...</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={closeEdit} className="rounded-xl border px-5 py-2">Cancel</button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="rounded-xl bg-[#6d0e2b] text-white px-6 py-2 font-semibold hover:bg-[#5a0b23] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}