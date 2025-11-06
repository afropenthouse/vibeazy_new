"use client";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AdminDashboardPage() {
  const [token, setToken] = useState("");
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({ users: 0, deals: 0, savedDeals: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) {
      window.location.href = "/admin";
      return;
    }
    setToken(t);
    loadData(t);
  }, []);

  async function loadData(t) {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load users");
      setUsers(data.users || []);
      setCounts(data.counts || { users: 0, deals: 0, savedDeals: 0 });
    } catch (e) {
      setError(e.message || "Error loading dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-slate-600 mt-2">Manage your platform efficiently</p>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href="/admin/deals" 
                className="rounded-lg bg-primary text-white px-6 py-2.5 text-sm font-medium hover:brightness-110 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Manage Deals
              </a>
              <a 
                href="/admin/categories" 
                className="rounded-lg bg-slate-800 text-white px-6 py-2.5 text-sm font-medium hover:brightness-110 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Manage Categories
              </a>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50/80 backdrop-blur-sm text-red-700 px-4 py-3 text-sm animate-in fade-in duration-300">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{loading ? "..." : counts.users}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <span className="text-blue-600 text-lg">👥</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Active Deals</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{loading ? "..." : counts.deals}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <span className="text-green-600 text-lg">💰</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Saved Deals</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{loading ? "..." : counts.savedDeals}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <span className="text-purple-600 text-lg">⭐</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-200/60 flex items-center justify-between bg-white/50">
            <div>
              <h2 className="font-semibold text-slate-800 text-lg">User Management</h2>
              <p className="text-sm text-slate-600 mt-1">Manage all registered users</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1">
              <p className="text-sm font-medium text-slate-700">
                {loading ? "Loading..." : `${users.length} users`}
              </p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/60">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-32"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-slate-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-20"></div>
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="text-slate-500">
                        <span className="text-4xl mb-4 block">📭</span>
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm mt-1">Users will appear here once they register</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-slate-50/50 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 group-hover:text-slate-900">
                              {user.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-slate-600">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.emailVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {user.emailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                          <span className="block text-xs text-slate-500">
                            {new Date(user.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}