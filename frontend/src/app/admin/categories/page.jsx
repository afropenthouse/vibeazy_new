"use client";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
// Optional presets left out; admin can type any category name

export default function AdminCategoriesPage() {
  const [token, setToken] = useState("");
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) { window.location.href = "/admin"; return; }
    setToken(t);
    load(t);
  }, []);

  async function load(tkn) {
    setError("");
    const res = await fetch(`${API_BASE}/admin/categories`, { headers: { Authorization: `Bearer ${tkn}` } });
    const data = await res.json();
    if (res.ok) setCategories(data.categories || []);
    else setError(data.error || "Failed to load categories");
  }

  async function addCategory(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) { setError("Type a category name"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add category");
      setCategories((prev) => [...prev, data.category]);
      setNewName("");
      window.dispatchEvent(new Event("categoriesUpdated"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCategory(id) {
    const ok = window.confirm("Delete this category?");
    if (!ok) return;
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      window.dispatchEvent(new Event("categoriesUpdated"));
    }
  }

  async function editCategory(cat) {
    const next = window.prompt("Edit category name", cat.name);
    if (!next) return;
    const name = next.trim();
    if (!name || name === cat.name) return;
    try {
      const res = await fetch(`${API_BASE}/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update category");
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? data.category : c)));
      window.dispatchEvent(new Event("categoriesUpdated"));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Manage Categories</h1>
            <p className="text-slate-600 mt-2">Create and organize categories used across deals</p>
          </div>
          <a href="/admin/dashboard" className="rounded-lg bg-slate-200 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-300">← Dashboard</a>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50/80 text-red-700 px-4 py-3 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-800">Add Category</h2>
            <p className="text-sm text-slate-600 mt-1">Type any category name</p>
          </div>
          <form onSubmit={addCategory} className="p-6 flex items-center gap-4">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Restaurants"
              className="w-full max-w-md px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary text-white px-6 py-3 font-medium hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Category"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-800">Current Categories</h2>
          </div>
          <div className="p-6">
            {categories.length === 0 ? (
              <p className="text-slate-600">No categories yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <span className="text-slate-800">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => editCategory(c)} className="rounded-md bg-slate-100 text-slate-700 px-3 py-1.5 text-xs hover:bg-slate-200">Edit</button>
                      <button onClick={() => deleteCategory(c.id)} className="rounded-md bg-red-100 text-red-700 px-3 py-1.5 text-xs hover:bg-red-200">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}