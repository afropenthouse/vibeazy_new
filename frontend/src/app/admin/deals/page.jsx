"use client";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AdminDealsPage() {
  const [token, setToken] = useState("");
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsStatus, setSubmissionsStatus] = useState("pending");
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState("");
  const [form, setForm] = useState({
    description: "",
    merchantName: "",
    city: "",
    category: "",
    oldPrice: "",
    newPrice: "",
    discountPct: "",
    expiresAt: "",
    deepLink: "",
    imageFile: null,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("create");
  // Bulk upload state
  const [bulkText, setBulkText] = useState("");
  const [bulkPreviewCount, setBulkPreviewCount] = useState(0);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadResults, setBulkUploadResults] = useState([]);
  const [bulkUploadError, setBulkUploadError] = useState("");
  // New: URL paste flow
  const [urlText, setUrlText] = useState("");
  const [defaults, setDefaults] = useState({ merchantName: "", city: "", category: "" });
  const [urlSubmitting, setUrlSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  // Delete confirmation modal state

  // Helper: sanitize pasted input to avoid hidden BOM/smart quotes causing JSON.parse issues
  const sanitizeInput = (s) => {
    try {
      return String(s || "")
        .replace(/\uFEFF/g, "") // strip BOM
        .replace(/[“”]/g, '"') // curly double quotes -> plain
        .replace(/[‘’]/g, "'") // curly single quotes -> plain
        .trim();
    } catch {
      return String(s || "").trim();
    }
  };

  // Helper: robustly parse a fetch response; fall back to text when JSON is not returned
  async function parseJsonSafe(res) {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        return await res.json();
      } catch (e) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Server returned invalid JSON");
      }
    }
    const t = await res.text().catch(() => "");
    throw new Error(t || `HTTP ${res.status} ${res.statusText}`);
  }
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) {
      window.location.href = "/admin";
      return;
    }
    setToken(t);
    fetchDeals(t);
    fetchCategories(t);
    fetchSubmissions(t, "pending");
  }, []);

  async function fetchDeals(t) {
    const res = await fetch(`${API_BASE}/admin/deals`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (res.ok) setDeals(data.deals || []);
  }

  async function fetchCategories(t) {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (res.ok) setCategories(data.categories || []);
  }

  async function fetchSubmissions(t, status = submissionsStatus) {
    try {
      setSubmissionsLoading(true);
      setSubmissionsError("");
      const res = await fetch(`${API_BASE}/admin/submissions?status=${encodeURIComponent(status)}` , {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load submissions");
      setSubmissions(data.submissions || []);
    } catch (e) {
      setSubmissionsError(e.message || "Error loading submissions");
    } finally {
      setSubmissionsLoading(false);
    }
  }

  async function handleSubmissionAction(id, action) {
    try {
      const res = await fetch(`${API_BASE}/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action}`);
      // Remove processed submission from current list
      setSubmissions((list) => list.filter((s) => s.id !== id));
      // If a deal was created, append to deals for immediate visibility
      if (data.deal || data.createdDeal) {
        const created = data.deal || data.createdDeal;
        setDeals((d) => [created, ...d]);
      }
    } catch (e) {
      setSubmissionsError(e.message || `Failed to ${action}`);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "oldPrice" || name === "newPrice") {
        const oldP = next.oldPrice ? Number(next.oldPrice) : undefined;
        const newP = next.newPrice ? Number(next.newPrice) : undefined;
        let discount = "";
        if (oldP && newP && oldP > 0 && newP >= 0 && newP <= oldP) {
          discount = String(Math.round(((oldP - newP) / oldP) * 100));
        }
        next.discountPct = discount;
      }
      return next;
    });
  }

  function handleFile(e) {
    const file = e.target.files?.[0] || null;
    setForm((f) => ({ ...f, imageFile: file }));
  }

  useEffect(() => {
    // Generate a temporary preview URL when a file is selected
    if (form.imageFile) {
      const url = URL.createObjectURL(form.imageFile);
      setImagePreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImagePreviewUrl("");
    }
  }, [form.imageFile]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      if (!form.deepLink) throw new Error("Website is required");
      let imageUrl = currentImageUrl;
      if (!editingId && !form.imageFile) throw new Error("Select an image");
      if (form.imageFile) {
        const fd = new FormData();
        fd.append("image", form.imageFile);
        const upRes = await fetch(`${API_BASE}/admin/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const up = await upRes.json();
        if (!upRes.ok) throw new Error(up.error || "Upload failed");
        imageUrl = up.url;
      }
      // Auto-calculate discount percentage from prices
      const oldP = form.oldPrice ? Number(form.oldPrice) : null;
      const newP = form.newPrice ? Number(form.newPrice) : null;
      const autoDiscount = (oldP && newP && oldP > 0 && newP >= 0 && newP <= oldP)
        ? Math.round(((oldP - newP) / oldP) * 100)
        : null;
      const payload = {
        description: form.description,
        merchantName: form.merchantName,
        city: form.city,
        category: form.category || null,
        oldPrice: oldP,
        newPrice: newP,
        discountPct: autoDiscount,
        expiresAt: form.expiresAt || null,
        deepLink: form.deepLink,
        imageUrl,
      };
      let data;
      if (editingId) {
        const res = await fetch(`${API_BASE}/admin/deals/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
        setDeals((d) => d.map((x) => (x.id === editingId ? data.deal : x)));
      } else {
        const res = await fetch(`${API_BASE}/admin/deals`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
        setDeals((d) => [data.deal, ...d]);
      }
      setForm({ 
        description: "", merchantName: "", city: "", category: "", 
        oldPrice: "", newPrice: "", discountPct: "", expiresAt: "", 
        deepLink: "", imageFile: null 
      });
      setEditingId(null);
      setCurrentImageUrl("");
      setActiveTab("browse");
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(deal) {
    setActiveTab("create");
    setEditingId(deal.id);
    setCurrentImageUrl(deal.imageUrl || "");
    setForm({
      description: deal.description || "",
      merchantName: deal.merchantName || "",
      city: deal.city || "",
      category: deal.category || "",
      oldPrice: deal.oldPrice ?? "",
      newPrice: deal.newPrice ?? "",
      discountPct: deal.discountPct ?? "",
      expiresAt: deal.expiresAt ? String(deal.expiresAt).substring(0, 10) : "",
      deepLink: deal.deepLink || "",
      imageFile: null,
    });
  }

  function askDelete(id) {
    setConfirmDeleteId(id);
  }

  async function performDelete() {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/deals/${confirmDeleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeals((d) => d.filter((x) => x.id !== confirmDeleteId));
        setConfirmDeleteId(null);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Delete failed");
      }
    } catch (e) {
      setError(e.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  // Bulk image helper: upload local files to get URLs
  async function handleBulkFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBulkUploadError("");
    setBulkUploading(true);
    setBulkUploadResults([]);
    try {
      const results = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch(`${API_BASE}/admin/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          results.push({ name: file.name, url: null, status: data.error || "Upload failed" });
          continue;
        }
        results.push({ name: file.name, url: data.url || data.secure_url || null, status: "Uploaded" });
      }
      setBulkUploadResults(results);
    } catch (err) {
      setBulkUploadError(err?.message || "Failed to upload images");
    } finally {
      setBulkUploading(false);
    }
  }

  async function copyUrlsAsJson() {
    const items = bulkUploadResults
      .filter((r) => r.url)
      .map((r) => ({ merchantName: "", city: "", imageUrl: r.url, description: "", category: "" }));
    const json = JSON.stringify(items, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setBulkSuccess(`Copied ${items.length} items as JSON to clipboard`);
      setBulkUploadError("");
    } catch {
      setBulkUploadError("Could not copy. You can manually copy from the box.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Manage Deals
            </h1>
            <p className="text-slate-600 mt-2">Create and manage exclusive deals</p>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/admin/dashboard" 
              className="rounded-lg bg-slate-200 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-300 transition-all duration-200"
            >
              ← Dashboard
            </a>
            <button 
              onClick={() => { localStorage.removeItem("admin_token"); window.location.href = "/admin"; }} 
              className="rounded-lg bg-red-100 text-red-700 px-4 py-2 text-sm font-medium hover:bg-red-200 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("create")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "create"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                Create New Deal
              </button>
              <button
                onClick={() => setActiveTab("browse")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "browse"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                Browse Deals ({deals.length})
              </button>
              <button
                onClick={() => setActiveTab("bulk")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "bulk"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                Bulk Import
              </button>
              <button
                onClick={() => setActiveTab("submissions")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "submissions"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                User Submissions ({submissions.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Create Deal Form */}
        {activeTab === "create" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">Create New Deal</h2>
              <p className="text-sm text-slate-600 mt-1">Fill in the details below to create a new deal</p>
            </div>
            
            <form onSubmit={handleCreate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Title removed (not displayed in UI) */}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="Describe the deal..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Merchant *</label>
                      <input
                        name="merchantName"
                        value={form.merchantName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        placeholder="Store name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                      <input
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        placeholder="City location"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      >
                        <option value="">Select category</option>
                        {(categories.length > 0 ? categories.map((c) => c.name) : [
                          "Restaurants","Fashion","Electronics","Furniture","Beauty","Travel","Entertainment"
                        ]).map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    {/* Tags removed (not displayed in UI) */}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Old Price</label>
                      <input
                        name="oldPrice"
                        value={form.oldPrice}
                        onChange={handleChange}
                        type="number"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        placeholder="₦0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">New Price</label>
                      <input
                        name="newPrice"
                        value={form.newPrice}
                        onChange={handleChange}
                        type="number"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        placeholder="₦0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Discount %</label>
                      <input
                        name="discountPct"
                        value={form.discountPct}
                        readOnly
                        type="number"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        placeholder="0%"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Expires At</label>
                    <input
                      name="expiresAt"
                      value={form.expiresAt}
                      onChange={handleChange}
                      type="date"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Website *</label>
                    <input
                      name="deepLink"
                      value={form.deepLink}
                      onChange={handleChange}
                      type="url"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="https://partner-website.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Deal Image *</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-0 overflow-hidden">
                      {/* Preview area */}
                      <div className="w-full h-40 bg-slate-50 flex items-center justify-center">
                        {imagePreviewUrl ? (
                          <img src={imagePreviewUrl} alt="Selected preview" className="w-full h-40 object-cover" />
                        ) : currentImageUrl ? (
                          <img src={currentImageUrl} alt="Current image" className="w-full h-40 object-cover" />
                        ) : (
                          <div className="text-slate-400 text-sm">No image selected</div>
                        )}
                      </div>
                      <div className="p-6 text-center border-t border-slate-200">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFile}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center">
                            <span className="text-4xl mb-2">📷</span>
                            <p className="text-sm text-slate-600">
                              {form.imageFile ? form.imageFile.name : "Click to upload image"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP up to 10MB</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setCurrentImageUrl(""); setForm({ title: "", description: "", merchantName: "", city: "", category: "", tags: "", oldPrice: "", newPrice: "", discountPct: "", expiresAt: "", deepLink: "", imageFile: null }); }}
                    className="rounded-lg bg-slate-200 text-slate-700 px-4 py-2 font-medium hover:bg-slate-300 transition-all duration-200"
                  >
                    Cancel Edit
                  </button>
                ) : <span />}
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-primary text-white px-8 py-3 font-medium hover:brightness-110 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-md"
                >
                  {creating ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editingId ? "Saving Changes..." : "Creating Deal..."}
                    </span>
                  ) : (
                    editingId ? "Save Changes" : "Create Deal"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Import */}
        {activeTab === "bulk" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">Bulk Import Deals</h2>
              <p className="text-sm text-slate-600 mt-1">Paste product URLs, JSON, or CSV. Required fields for CSV/JSON: merchantName, city, imageUrl. URLs are auto-scraped and images are saved to Cloudinary.</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Step 1: Upload local images to get URLs */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Step 1: Upload local images</label>
                <input type="file" multiple accept="image/*" onChange={handleBulkFileSelect} />
                {bulkUploading && (
                  <div className="text-xs text-slate-600">Uploading images...</div>
                )}
                {bulkUploadError && (
                  <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-red-700 text-xs">{bulkUploadError}</div>
                )}
                {bulkUploadResults.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={copyUrlsAsJson} className="px-3 py-1 border rounded text-sm">Copy URLs as JSON</button>
                      <span className="text-xs text-slate-600">Uploaded: {bulkUploadResults.filter(r=>r.url).length} / {bulkUploadResults.length}</span>
                    </div>
                    <pre className="max-h-40 overflow-auto bg-slate-50 border border-slate-200 rounded p-2 text-[11px]">
{JSON.stringify(bulkUploadResults, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Step 2A: Paste product URLs (auto-scrape & Cloudinary upload) */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-2">Product URLs (one per line)</label>
                <textarea
                  value={urlText}
                  onChange={(e) => setUrlText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder={`https://www.jumia.com.ng/...\nhttps://www.konga.com/...`}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Merchant</label>
                    <input
                      type="text"
                      value={defaults.merchantName}
                      onChange={(e)=>setDefaults((d)=>({ ...d, merchantName: e.target.value }))}
                      placeholder="e.g., Jumia"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">City</label>
                    <input
                      type="text"
                      value={defaults.city}
                      onChange={(e)=>setDefaults((d)=>({ ...d, city: e.target.value }))}
                      placeholder="e.g., Lagos"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Category</label>
                    <input
                      type="text"
                      value={defaults.category}
                      onChange={(e)=>setDefaults((d)=>({ ...d, category: e.target.value }))}
                      placeholder="e.g., Electronics"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-lg bg-slate-200 text-slate-700 px-4 py-2 font-medium hover:bg-slate-300 transition-all duration-200"
                    onClick={() => { setUrlText(""); setDefaults({ merchantName: "", city: "", category: "" }); setBulkError(""); setBulkSuccess(""); }}
                  >
                    Clear URLs
                  </button>
                  <button
                    type="button"
                    disabled={urlSubmitting}
                    className="rounded-lg bg-primary text-white px-6 py-2 font-medium hover:brightness-110 transition-all duration-200 disabled:opacity-50"
                    onClick={async () => {
                      setUrlSubmitting(true);
                      setBulkError("");
                      setBulkSuccess("");
                      try {
                        const urls = (urlText || "").split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
                        if (!urls.length) throw new Error("Paste at least one URL");
                        if (!defaults.city) throw new Error("City is required for all deals");
                        const res = await fetch(`${API_BASE}/admin/deals/extract`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ urls, defaults }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "URL import failed");
                        const created = Array.isArray(data.created) ? data.created : [];
                        setDeals((d) => [...created, ...d]);
                        const errs = Array.isArray(data.errors) ? data.errors.length : 0;
                        setBulkSuccess(`Imported ${data.createdCount || created.length} deals from URLs.${errs ? ` ${errs} failed.` : ""}`);
                        setUrlText("");
                      } catch (e) {
                        const msg = String(e?.message || "URL import failed");
                        const looksHtml = /<!DOCTYPE html>/i.test(msg) || /<html/i.test(msg) || /Cannot POST \/admin\//i.test(msg);
                        if (looksHtml) {
                          setBulkError(`Received HTML error from ${API_BASE}. Ensure NEXT_PUBLIC_API_URL points to your backend (e.g., http://localhost:4000).`);
                        } else {
                          setBulkError(msg);
                        }
                      } finally {
                        setUrlSubmitting(false);
                      }
                    }}
                  >
                    {urlSubmitting ? "Importing..." : "Create Deals from URLs"}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">API: {API_BASE}</p>
              </div>

              {/* Step 2B: Paste CSV or JSON */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Input</label>
                <textarea
                  value={bulkText}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(e.target.value);
                    setBulkText(sanitized);
                    // quick preview count
                    try {
                      let count = 0;
                      const txt = sanitized || "";
                      if (txt.trim().startsWith("[")) {
                        const arr = JSON.parse(txt);
                        count = Array.isArray(arr) ? arr.length : 0;
                      } else {
                        const lines = txt.split(/\r?\n/).filter((l) => l.trim().length > 0);
                        if (lines.length > 1) count = lines.length - 1; // header + rows
                      }
                      setBulkPreviewCount(count);
                    } catch {
                      setBulkPreviewCount(0);
                    }
                  }}
                  rows={12}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder={`CSV example (with header):\nmerchantName,city,imageUrl,description,category,oldPrice,newPrice,expiresAt,deepLink\nShop A,Lagos,https://res.cloudinary.com/.../a.jpg,Nice burger,Restaurants,5000,3500,2025-12-31,https://shop-a.com\n\nJSON example:\n[\n  {"merchantName":"Shop A","city":"Lagos","imageUrl":"https://res.cloudinary.com/.../a.jpg","category":"Restaurants","oldPrice":5000,"newPrice":3500,"expiresAt":"2025-12-31","deepLink":"https://shop-a.com"}\n]`}
                />
                <p className="text-xs text-slate-500 mt-2">Preview: {bulkPreviewCount} items detected</p>
                <p className="text-xs text-slate-500">API: {API_BASE}</p>
              </div>

              {bulkError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">{bulkError}</div>
              )}
              {bulkSuccess && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm">{bulkSuccess}</div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="rounded-lg bg-slate-200 text-slate-700 px-4 py-2 font-medium hover:bg-slate-300 transition-all duration-200"
                  onClick={() => { setBulkText(""); setBulkPreviewCount(0); setBulkError(""); setBulkSuccess(""); }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={bulkSubmitting}
                  className="rounded-lg bg-primary text-white px-6 py-2 font-medium hover:brightness-110 transition-all duration-200 disabled:opacity-50"
                  onClick={async () => {
                    setBulkSubmitting(true);
                    setBulkError("");
                    setBulkSuccess("");
                    try {
                      // Parse input
                      let items = [];
                      const txt = sanitizeInput(bulkText);
                      if (!txt) throw new Error("Paste CSV or JSON first");
                      if (txt.startsWith("[")) {
                        const arr = JSON.parse(txt);
                        if (!Array.isArray(arr)) throw new Error("JSON must be an array");
                        items = arr;
                      } else {
                        const lines = txt.split(/\r?\n/).filter((l) => l.trim().length > 0);
                        if (lines.length < 2) throw new Error("CSV needs header and at least one row");
                        const header = lines[0].split(",").map((h) => h.trim());
                        const idx = (k) => header.findIndex((h) => h.toLowerCase() === k);
                        const rows = lines.slice(1);
                        items = rows.map((line) => {
                          const cols = line.split(",");
                          const get = (k) => {
                            const i = idx(k);
                            if (i === -1) return undefined;
                            return (cols[i] || "").trim();
                          };
                          return {
                            merchantName: get("merchantname") || get("merchantName"),
                            city: get("city"),
                            imageUrl: get("imageurl") || get("imageUrl"),
                            description: get("description"),
                            category: get("category"),
                            oldPrice: get("oldprice") || get("oldPrice"),
                            newPrice: get("newprice") || get("newPrice"),
                            expiresAt: get("expiresat") || get("expiresAt"),
                            deepLink: get("deeplink") || get("deepLink"),
                          };
                        });
                      }

                      // Send to bulk endpoint
                      const res = await fetch(`${API_BASE}/admin/deals/bulk`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ deals: items }),
                      });
                      const data = await parseJsonSafe(res);
                      if (!res.ok) throw new Error(data.error || "Bulk create failed");
                      const created = Array.isArray(data.created) ? data.created : [];
                      setDeals((d) => [...created, ...d]);
                      const errs = Array.isArray(data.errors) ? data.errors.length : 0;
                      setBulkSuccess(`Created ${data.createdCount || created.length} deals. ${errs ? `${errs} rows skipped.` : ""}`);
                      setBulkText("");
                      setBulkPreviewCount(0);
                    } catch (e) {
                      const msg = String(e?.message || "Bulk upload failed");
                      // If we got an HTML error page, it's likely hitting the Next.js site instead of the Express API
                      const looksHtml = /<!DOCTYPE html>/i.test(msg) || /<html/i.test(msg) || /Cannot POST \/admin\//i.test(msg);
                      if (looksHtml) {
                        setBulkError(`Received HTML error from ${API_BASE}. This usually means NEXT_PUBLIC_API_URL points to the frontend site instead of the backend (Express). Set NEXT_PUBLIC_API_URL to your API origin, e.g., http://localhost:4000 or https://api.yourdomain.com.`);
                      } else {
                        setBulkError(msg);
                      }
                    } finally {
                      setBulkSubmitting(false);
                    }
                  }}
                >
                  {bulkSubmitting ? "Uploading..." : "Create Deals"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Browse Deals */}
        {activeTab === "browse" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800">All Deals</h2>
              <p className="text-sm text-slate-600">{deals.length} deals found</p>
            </div>

            {deals.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <span className="text-6xl mb-4 block">🛍️</span>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No deals yet</h3>
                <p className="text-slate-600 mb-6">Create your first deal to get started</p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="rounded-lg bg-primary text-white px-6 py-2 font-medium hover:brightness-110 transition-all duration-200"
                >
                  Create First Deal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.map((deal) => (
                  <div key={deal.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 group">
                    <div className="relative overflow-hidden">
                      <img 
                        src={deal.imageUrl} 
                        alt={deal.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {deal.discountPct && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          {deal.discountPct}% OFF
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5">
                      <h3 className="font-semibold text-slate-800 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {deal.title}
                      </h3>
                      
                      <div className="flex items-center text-sm text-slate-600 mb-3">
                        <span className="mr-3">🏪 {deal.merchantName}</span>
                        <span>📍 {deal.city}</span>
                      </div>

                      {deal.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                          {deal.description}
                        </p>
                      )}

                      {(deal.newPrice || deal.oldPrice) && (
                        <div className="flex items-center justify-between mb-3">
                          {deal.newPrice && (
                            <span className="text-lg font-bold text-green-600">
                              ₦{Number(deal.newPrice).toLocaleString()}
                            </span>
                          )}
                          {deal.oldPrice && deal.newPrice && (
                            <span className="text-sm text-slate-500 line-through">
                              ₦{Number(deal.oldPrice).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}

                      {deal.expiresAt && (
                        <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
                          Expires: {new Date(deal.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                      <div className="mt-4 flex items-center gap-2">
                        <a href={deal.deepLink || "#"} target="_blank" rel="noopener" className="rounded-md bg-slate-100 text-slate-700 px-3 py-1.5 text-xs hover:bg-slate-200">Website</a>
                        <button onClick={() => startEdit(deal)} className="rounded-md bg-blue-100 text-blue-700 px-3 py-1.5 text-xs hover:bg-blue-200">Edit</button>
                        <button onClick={() => askDelete(deal.id)} className="rounded-md bg-red-100 text-red-700 px-3 py-1.5 text-xs hover:bg-red-200">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Submissions */}
        {activeTab === "submissions" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">User Submissions</h2>
                <p className="text-sm text-slate-600">Approve or reject community-submitted deals</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={submissionsStatus}
                  onChange={(e) => { setSubmissionsStatus(e.target.value); fetchSubmissions(token, e.target.value); }}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={() => fetchSubmissions(token, submissionsStatus)}
                  className="rounded-md bg-slate-100 text-slate-700 px-3 py-2 text-sm hover:bg-slate-200"
                >
                  Refresh
                </button>
              </div>
            </div>

            {submissionsError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
                {submissionsError}
              </div>
            )}

            {submissionsLoading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-slate-600">Loading submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <span className="text-6xl mb-4 block">📨</span>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No submissions</h3>
                <p className="text-slate-600">No {submissionsStatus} submissions at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.map((s) => (
                  <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 group">
                    <div className="relative overflow-hidden">
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt={s.title || s.merchantName} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-44 bg-slate-100 flex items-center justify-center text-2xl">🖼️</div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/90 rounded-full px-3 py-1 text-xs border border-slate-200">{s.status || 'pending'}</div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-slate-800 line-clamp-2 mb-2">{s.title || 'Untitled Deal'}</h3>
                      <div className="flex items-center text-sm text-slate-600 mb-3">
                        <span className="mr-3">🏪 {s.merchantName}</span>
                        <span>📍 {s.city}</span>
                      </div>
                      {s.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{s.description}</p>
                      )}
                      <div className="mt-4 flex items-center gap-2">
                        {submissionsStatus === 'pending' ? (
                          <>
                            <button onClick={() => handleSubmissionAction(s.id, 'approve')} className="rounded-md bg-green-100 text-green-700 px-3 py-1.5 text-xs hover:bg-green-200">Approve</button>
                            <button onClick={() => handleSubmissionAction(s.id, 'reject')} className="rounded-md bg-red-100 text-red-700 px-3 py-1.5 text-xs hover:bg-red-200">Reject</button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">Action not available</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold">Delete Deal</h2>
            <p className="text-slate-600 mt-2">Are you sure you want to delete this deal? This action cannot be undone.</p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={performDelete}
                disabled={deleting}
                className="rounded-md bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}