"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SubmitDealPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [form, setForm] = useState({
    description: "",
    merchantName: "",
    city: "Lagos",
    category: "",
    oldPrice: "",
    newPrice: "",
    discountPct: "",
    expiresAt: "",
    deepLink: "",
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    try {
      const t = localStorage.getItem("authToken") || "";
      setToken(t);
    } catch {}
  }, []);

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

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const handleImageFile = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file");
      return;
    }
    setImageFile(file);
    handleUpload(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) handleImageFile(file);
  };

  async function handleUpload(file) {
    if (!file) return;
    setError("");
    setInfo("");
    setLoadingUpload(true);
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
      setImageUrl(data.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingUpload(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!isAuthenticated) {
      setError("Please login to submit a deal.");
      return;
    }
    if (!imageUrl) {
      setError("Please upload an image (max 5MB) before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const oldP = form.oldPrice ? Number(form.oldPrice) : undefined;
      const newP = form.newPrice ? Number(form.newPrice) : undefined;
      let discount = undefined;
      if (oldP && newP && oldP > 0 && newP >= 0 && newP <= oldP) {
        discount = Math.round(((oldP - newP) / oldP) * 100);
      }
      const payload = {
        ...form,
        imageUrl,
        oldPrice: oldP,
        newPrice: newP,
        discountPct: typeof discount === "number" ? discount : undefined,
      };
      const res = await fetch(`${API_BASE}/deals/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setInfo("🎊 Deal submitted for admin review! You can track it in My Submissions.");
      setShowSuccessModal(true);
      setForm({ description: "", merchantName: "", city: "Lagos", category: "", oldPrice: "", newPrice: "", discountPct: "", expiresAt: "", deepLink: "" });
      setImageFile(null);
      setImageUrl("");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-rose-100 to-rose-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-4xl">🔒</span>
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-[#6d0e2b] bg-clip-text text-transparent mb-4">
              Join Our Deal Community
            </h3>
            <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
              Share amazing deals with thousands of savvy shoppers. Login to submit your exclusive offers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/login" className="rounded-2xl bg-[#6d0e2b] text-white px-8 py-4 font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#5a0b23]">
                Sign In to Submit
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
    <main className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl">
        <button
          type="button"
          aria-label="Close"
          onClick={() => router.push("/")}
          className="absolute -top-6 right-0 bg-white text-slate-800 shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-slate-100"
        >
          ✕
        </button>
        <div className="mx-auto w-[96%] max-w-4xl px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-rose-50 rounded-2xl shadow-2xl py-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-sm border border-white/60 mb-6">
            <div className="w-8 h-8 bg-[#6d0e2b] rounded-xl flex items-center justify-center">
              <span className="text-white text-sm">🔥</span>
            </div>
            <span className="text-slate-700 font-medium">Share Amazing Deals</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-[#6d0e2b] bg-clip-text text-transparent mb-3">
            Submit Your Deal
          </h1>
          <p className="text-slate-600 text-xl max-w-2xl mx-auto leading-relaxed">
            Found an incredible offer? Share it with our community and help everyone save money!
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column - Image Upload & Pricing */}
          <div className="xl:col-span-5 space-y-8">
            {/* Image Upload Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="bg-rose-100 text-rose-600 p-2 rounded-xl">📷</span>
                Deal Visual
              </h3>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  isDragging 
                    ? 'border-rose-400 bg-rose-50/50 scale-[1.02]' 
                    : loadingUpload
                    ? 'border-rose-300 bg-rose-50/30'
                    : imageUrl
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-slate-300 hover:border-rose-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                
                {imageUrl ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-full max-w-xs aspect-video rounded-2xl overflow-hidden shadow-lg">
                      <Image 
                        src={imageUrl} 
                        alt="Uploaded preview" 
                        fill
                        className="object-cover"
                      />
                    </div>
                    {/* Removed success text for cleaner UI */}
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center gap-2 text-[#6d0e2b] hover:text-[#5a0b23] font-medium cursor-pointer transition-colors"
                    >
                      <span>🔄</span>
                      Change Image
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="image-upload"
                    className="block cursor-pointer"
                  >
                    <div className="flex flex-col items-center space-y-4">
                      {loadingUpload ? (
                        <>
                          <div className="w-16 h-16 border-4 border-[#6d0e2b] border-t-transparent rounded-full animate-spin mb-2"></div>
                          <div className="space-y-2">
                            <p className="text-lg font-semibold text-slate-700">Uploading...</p>
                            <p className="text-sm text-slate-500">Getting your image ready</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-gradient-to-r from-rose-50 to-rose-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                            <span className="text-3xl">📁</span>
                          </div>
                          <div className="space-y-3">
                            <p className="text-lg font-semibold text-slate-700">
                              Drag & drop your image
                            </p>
                            <p className="text-slate-500 text-sm">
                              or <span className="text-[#6d0e2b] font-semibold">browse files</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                              PNG, JPG, WEBP • Max 5MB
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-gradient-to-br from-[#6d0e2b] to-rose-700 rounded-3xl shadow-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">
                Pricing Details
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <label className="block text-sm font-medium text-rose-100 mb-2">Original Price</label>
                    <input
                      type="number"
                      value={form.oldPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) => {
                          const oldP = val ? Number(val) : undefined;
                          const newP = f.newPrice ? Number(f.newPrice) : undefined;
                          let discount = "";
                          if (oldP && newP && oldP > 0 && newP >= 0 && newP <= oldP) {
                            discount = String(Math.round(((oldP - newP) / oldP) * 100));
                          }
                          return { ...f, oldPrice: val, discountPct: discount };
                        });
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-rose-200 focus:bg-white/20 focus:border-white/30 transition-all duration-200"
                      placeholder="₦0.00"
                    />
                  </div>
                  <div className="text-center">
                    <label className="block text-sm font-medium text-rose-100 mb-2">Discounted Price</label>
                    <input
                      type="number"
                      value={form.newPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) => {
                          const oldP = f.oldPrice ? Number(f.oldPrice) : undefined;
                          const newP = val ? Number(val) : undefined;
                          let discount = "";
                          if (oldP && newP && oldP > 0 && newP >= 0 && newP <= oldP) {
                            discount = String(Math.round(((oldP - newP) / oldP) * 100));
                          }
                          return { ...f, newPrice: val, discountPct: discount };
                        });
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-rose-200 focus:bg-white/20 focus:border-white/30 transition-all duration-200"
                      placeholder="₦0.00"
                    />
                  </div>
                  <div className="text-center">
                    <label className="block text-sm font-medium text-rose-100 mb-2">You Save</label>
                    <input
                      type="number"
                      value={form.discountPct}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white font-bold text-center"
                      placeholder="0%"
                    />
                  </div>
                </div>
                
                {form.discountPct && (
                  <div className="text-center p-4 bg-white/10 rounded-2xl border border-white/20">
                    <p className="text-3xl font-bold text-white">
                      {form.discountPct}% OFF!
                    </p>
                    <p className="text-rose-100 text-sm mt-1">
                      Amazing discount for our community
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Form Details */}
          <div className="xl:col-span-7">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8 h-full">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="bg-green-100 text-green-600 p-2 rounded-xl">📝</span>
                Deal Information
              </h3>

              <form onSubmit={onSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Merchant & City */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Merchant Name *
                    </label>
                    <input
                      value={form.merchantName}
                      onChange={(e) => setForm((f) => ({ ...f, merchantName: e.target.value }))}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-3 focus:ring-[#6d0e2b]/20 focus:border-[#6d0e2b] transition-all duration-200 bg-white/50"
                      placeholder="e.g., Amazon, Jumia, Shoprite"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      City *
                    </label>
                    <select
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-3 focus:ring-[#6d0e2b]/20 focus:border-[#6d0e2b] transition-all duration-200 bg-white/50"
                    >
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja">Abuja</option>
                      <option value="Port Harcourt">Port Harcourt</option>
                      <option value="Ibadan">Ibadan</option>
                      <option value="Kano">Kano</option>
                    </select>
                  </div>
                </div>

                {/* Category & Expiry */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-3 focus:ring-[#6d0e2b]/20 focus:border-[#6d0e2b] transition-all duration-200 bg-white/50"
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

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Deal Expiry
                    </label>
                    <input
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-3 focus:ring-[#6d0e2b]/20 focus:border-[#6d0e2b] transition-all duration-200 bg-white/50"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Deal Description *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-3 focus:ring-[#6d0e2b]/20 focus:border-[#6d0e2b] transition-all duration-200 bg-white/50 resize-none"
                    placeholder="Describe the deal in detail. What makes it special? Any terms and conditions?"
                  />
                </div>

                {/* Deep Link */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Deal Link (Optional)
                  </label>
                  <input
                    value={form.deepLink}
                    onChange={(e) => setForm((f) => ({ ...f, deepLink: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-3 focus:ring-[#6d0e2b]/20 focus:border-[#6d0e2b] transition-all duration-200 bg-white/50"
                    placeholder="https://..."
                  />
                </div>

                {/* Notifications */}
                {error && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-6">
                    <div className="flex items-center gap-3 text-red-700">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <p className="font-semibold">Submission Error</p>
                        <p className="text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {info && (
                  <div className="rounded-2xl bg-green-50 border border-green-200 p-6">
                    <div className="flex items-center gap-3 text-green-700">
                      <span className="text-xl">✅</span>
                      <div>
                        <p className="font-semibold">Success!</p>
                        <p className="text-sm mt-1">{info}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-4 text-slate-600">
                    <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center">
                      <span className="text-rose-600 text-sm">👑</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Submitted as {user?.name || user?.email}</p>
                      <p className="text-xs text-slate-500">Admin approval required</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !imageUrl}
                    className="rounded-xl bg-[#6d0e2b] text-white px-8 py-3 font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none hover:bg-[#5a0b23]"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>🚀</span>
                        Submit for Review
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        </div>

        {/* Success Modal */}
        <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} name={user?.name || user?.email} />
      </div>
    </main>
  );
}

// Enhanced Success Modal with brand colors
function SuccessModal({ open, onClose, name }) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl transform animate-scale-in">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-[#6d0e2b] to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl text-white">🎉</span>
          </div>
          
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-[#6d0e2b] bg-clip-text text-transparent mb-3">
            Deal Submitted!
          </h2>
          
          <p className="text-slate-600 mb-2">
            Thanks, <span className="font-semibold text-slate-800">{name}</span>!
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Your deal is now awaiting admin approval. We&apos;ll notify you once it&apos;s live!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={onClose}
              className="rounded-xl bg-[#6d0e2b] text-white px-6 py-3 font-semibold hover:shadow-lg transition-all duration-200 flex-1 hover:bg-[#5a0b23]"
            >
              Submit Another Deal
            </button>
            <Link 
              href="/"
              className="rounded-xl border-2 border-slate-300 text-slate-700 px-6 py-3 font-semibold hover:bg-slate-50 transition-all duration-200 flex-1 text-center"
            >
              Browse Deals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}