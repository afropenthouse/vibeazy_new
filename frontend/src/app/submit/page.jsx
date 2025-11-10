"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SubmitDealPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    description: "",
    merchantName: "",
    category: "",
    oldPrice: "",
    newPrice: "",
    expiresAt: "",
    deepLink: "",
  });

  // Load categories from backend (admin public categories) and refresh on updates
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/public/categories`);
        const data = await res.json();
        if (!cancelled && res.ok) {
          setCategories(Array.isArray(data.categories) ? data.categories : []);
        }
      } catch {
        // silent fail, will use fallback list in UI
      }
    };
    load();
    const onUpdate = () => load();
    window.addEventListener("categoriesUpdated", onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("categoriesUpdated", onUpdate);
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <main className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-md">
          <button
            type="button"
            aria-label="Close"
            onClick={() => router.push("/")}
            className="absolute -top-6 right-0 bg-white text-gray-800 shadow rounded-full w-9 h-9 flex items-center justify-center hover:bg-gray-100"
          >
            ✕
          </button>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mx-auto">
              <span className="text-xl">🔒</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Join to Share Deals</h1>
            <p className="text-gray-600">Sign in to submit amazing deals to our community</p>
            <div className="space-y-3">
              <a href="/login" className="block w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors">
                Sign In
              </a>
              <a href="/signup" className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Create Account
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    
    setUploading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("image", file);
      
      const res = await fetch(`${API_BASE}/deals/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setImageUrl(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl) {
      setError("Please upload an image first");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const payload = {
        ...form,
        imageUrl,
        city: "Lagos",
        oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
        newPrice: form.newPrice ? Number(form.newPrice) : undefined,
      };

      const res = await fetch(`${API_BASE}/deals/submit`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      
      // Reset form on success
      setForm({ description: "", merchantName: "", category: "", oldPrice: "", newPrice: "", expiresAt: "", deepLink: "" });
      setImageUrl("");
      setError("🎉 Deal submitted for review!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = () => {
    const oldP = Number(form.oldPrice);
    const newP = Number(form.newPrice);
    if (oldP > 0 && newP > 0 && newP < oldP) {
      return Math.round(((oldP - newP) / oldP) * 100);
    }
    return 0;
  };

  return (
    <main className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl">
        <button
          type="button"
          aria-label="Close"
          onClick={() => router.push("/")}
          className="absolute -top-6 right-0 bg-white text-gray-800 shadow rounded-full w-9 h-9 flex items-center justify-center hover:bg-gray-100"
        >
          ✕
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Share a Deal</h1>
            <p className="text-gray-600 mt-1">Found something amazing? Share it with the community</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Deal Image *
              </label>
              {!imageUrl ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-300 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto">
                        <span className="text-xl">📸</span>
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium">Upload deal image</p>
                        <p className="text-gray-500 text-sm">PNG, JPG, WEBP • Max 5MB</p>
                      </div>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden border">
                    <Image src={imageUrl} alt="Deal preview" fill className="object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-red-600 text-sm font-medium"
                  >
                    Change Image
                  </button>
                </div>
              )}
              {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
            </div>

            {/* Merchant & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant *
                </label>
                <input
                  value={form.merchantName}
                  onChange={(e) => setForm(f => ({ ...f, merchantName: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., Amazon, Jumia"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Select category</option>
                  {(
                    categories.length > 0
                      ? categories.map((c) => c.name)
                      : [
                          "Restaurants",
                          "Fashion",
                          "Electronics",
                          "Furniture",
                          "Beauty",
                          "Travel",
                          "Entertainment",
                        ]
                  ).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pricing
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input
                    type="number"
                    value={form.oldPrice}
                    onChange={(e) => setForm(f => ({ ...f, oldPrice: e.target.value }))}
                    placeholder="Original"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={form.newPrice}
                    onChange={(e) => setForm(f => ({ ...f, newPrice: e.target.value }))}
                    placeholder="Discounted"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={calculateDiscount() > 0 ? `${calculateDiscount()}% OFF` : ""}
                    readOnly
                    placeholder="You save"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-center font-medium text-red-600"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                placeholder="What is this deal about?"
              />
            </div>

            {/* Expiry & Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Link
                </label>
                <input
                  value={form.deepLink}
                  onChange={(e) => setForm(f => ({ ...f, deepLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Error/Success Message */}
            {error && (
              <div className={`p-3 rounded-lg text-sm ${
                error.includes("🎉") 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Submitting as <span className="font-medium text-gray-700">{user?.name || user?.email}</span>
              </div>
              
              <button
                type="submit"
                disabled={loading || !imageUrl}
                className="bg-[#6d0e2b] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#5a0b23] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Submitting..." : "Submit Deal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}