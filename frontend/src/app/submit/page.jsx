"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SubmitDealPage() {
  const { isAuthenticated, user } = useAuth();
  const [token, setToken] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    merchantName: "",
    city: "Lagos",
    category: "",
    tags: "",
    oldPrice: "",
    newPrice: "",
    discountPct: "",
    expiresAt: "",
    deepLink: "",
  });

  useEffect(() => {
    try {
      const t = localStorage.getItem("authToken") || "";
      setToken(t);
    } catch {}
  }, []);

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
      setInfo("🎉 Image uploaded successfully!");
      setActiveStep(2);
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
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        imageUrl,
        oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
        newPrice: form.newPrice ? Number(form.newPrice) : undefined,
        discountPct: form.discountPct ? Number(form.discountPct) : undefined,
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
      setForm({ title: "", description: "", merchantName: "", city: "Lagos", category: "", tags: "", oldPrice: "", newPrice: "", discountPct: "", expiresAt: "", deepLink: "" });
      setImageFile(null);
      setImageUrl("");
      setActiveStep(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setImageFile(file);
      handleUpload(file);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
            Submit a Deal
          </h1>
          <p className="text-slate-600 mt-3 text-lg">
            Share amazing deals with the community. Admin approval required.
          </p>
        </div>

        {!isAuthenticated ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Authentication Required</h3>
            <p className="text-slate-600 mb-6">Please log in to submit deals to the community.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/login" className="rounded-lg bg-slate-800 text-white px-6 py-3 font-medium hover:bg-slate-700 transition-all duration-200">
                Login
              </a>
              <a href="/signup" className="rounded-lg border border-slate-300 text-slate-700 px-6 py-3 font-medium hover:bg-slate-50 transition-all duration-200">
                Sign Up
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Progress Steps */}
            <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center justify-center space-x-8">
                <div className={`flex items-center space-x-2 ${activeStep >= 1 ? 'text-primary' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    activeStep >= 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Upload Image</span>
                </div>
                <div className="w-12 h-0.5 bg-slate-300"></div>
                <div className={`flex items-center space-x-2 ${activeStep >= 2 ? 'text-primary' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    activeStep >= 2 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    2
                  </div>
                  <span className="text-sm font-medium">Deal Details</span>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="p-6">
              {/* Step 1: Image Upload */}
              {activeStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">📷</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Upload Deal Image</h3>
                    <p className="text-slate-600">Start by uploading a clear image of your deal</p>
                  </div>

                  <div className="max-w-md mx-auto">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                        loadingUpload 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        {loadingUpload ? (
                          <>
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="text-sm text-slate-700 font-medium">Uploading...</p>
                            <p className="text-xs text-slate-500 mt-1">Please wait</p>
                          </>
                        ) : (
                          <>
                            <span className="text-4xl mb-3">🖼️</span>
                            <p className="text-sm text-slate-700 font-medium">
                              Click to upload image
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              PNG, JPG, WEBP up to 5MB
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Deal Details */}
              {activeStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">Deal Information</h3>
                      <p className="text-slate-600">Fill in the details about your amazing deal</p>
                    </div>
                    {imageUrl && (
                      <div className="relative group">
                        <Image 
                          src={imageUrl} 
                          alt="Uploaded preview" 
                          width={80} 
                          height={60} 
                          className="rounded-lg object-cover border-2 border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setActiveStep(1)}
                          className="absolute -top-2 -right-2 bg-slate-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Deal Title *
                        </label>
                        <input
                          value={form.title}
                          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                          placeholder="e.g., 50% Off Electronics Sale"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={form.description}
                          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                          placeholder="Describe the deal in detail..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Merchant *
                          </label>
                          <input
                            value={form.merchantName}
                            onChange={(e) => setForm((f) => ({ ...f, merchantName: e.target.value }))}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                            placeholder="Store name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            City *
                          </label>
                          <select
                            value={form.city}
                            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                          >
                            <option value="Lagos">Lagos</option>
                            <option value="Abuja">Abuja</option>
                            <option value="Port Harcourt">Port Harcourt</option>
                            <option value="Ibadan">Ibadan</option>
                            <option value="Kano">Kano</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Category
                          </label>
                          <input
                            value={form.category}
                            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                            placeholder="e.g., Electronics"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Tags
                          </label>
                          <input
                            value={form.tags}
                            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                            placeholder="tech, discount, summer"
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4">
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          💰 Pricing Information
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Original Price</label>
                            <input
                              type="number"
                              value={form.oldPrice}
                              onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                              placeholder="₦0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Discounted Price</label>
                            <input
                              type="number"
                              value={form.newPrice}
                              onChange={(e) => setForm((f) => ({ ...f, newPrice: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                              placeholder="₦0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Discount %</label>
                            <input
                              type="number"
                              value={form.discountPct}
                              onChange={(e) => setForm((f) => ({ ...f, discountPct: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                              placeholder="0%"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Expires At
                          </label>
                          <input
                            type="date"
                            value={form.expiresAt}
                            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Deep Link
                          </label>
                          <input
                            value={form.deepLink}
                            onChange={(e) => setForm((f) => ({ ...f, deepLink: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                      <div className="flex items-center gap-2 text-red-700">
                        <span>⚠️</span>
                        <p className="text-sm font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  {info && (
                    <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <span>✅</span>
                        <p className="text-sm font-medium">{info}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors duration-200"
                    >
                      ← Back to Image Upload
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <a
                        href="/saved"
                        className="rounded-lg border border-slate-300 text-slate-700 px-6 py-3 font-medium hover:bg-slate-50 transition-all duration-200"
                      >
                        Saved Deals
                      </a>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-primary text-white px-8 py-3 font-medium hover:brightness-110 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                      >
                        {submitting ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Submitting...
                          </span>
                        ) : (
                          "Submit for Review"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
      {/* Success Modal */}
      <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} name={user?.name || user?.email} />
    </main>
  );
}

// Success modal overlay
// Rendered conditionally within the page component above
// (helper JSX appended at end for clarity)
export function SuccessModal({ open, onClose, name }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold">Submission Received</h2>
        <p className="text-foreground/70 mt-2">Thanks, {name}. Your deal was submitted successfully and is awaiting admin approval.</p>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={onClose} className="rounded-md bg-primary text-white px-4 py-2 text-sm hover:brightness-110">Close</button>
          <a href="/" className="rounded-md border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5">Explore Deals</a>
          <a href="/saved" className="rounded-md border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5">Saved Deals</a>
        </div>
      </div>
    </div>
  );
}