"use client";
import DiscountCard from "@/components/DiscountCard";
import { useSavedDeals } from "@/contexts/SavedDealsContext";
import { useAuth } from "@/contexts/AuthContext";

export default function SavedDealsPage() {
  const { savedList } = useSavedDeals();
  const { isAuthenticated } = useAuth();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold">Saved Deals</h1>
      <p className="text-foreground/70 mt-1">Your favorited discounts appear here.</p>

      {!isAuthenticated ? (
        <div className="mt-8 rounded-xl border border-foreground/10 bg-background p-6 text-center">
          <p className="text-foreground/70">Please log in or sign up to view your saved deals.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <a href="/login" className="rounded-md border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5">Login</a>
            <a href="/signup" className="rounded-md bg-primary text-white px-4 py-2 text-sm hover:brightness-110">Sign up</a>
          </div>
        </div>
      ) : savedList.length === 0 ? (
        <div className="mt-8 rounded-xl border border-foreground/10 bg-background p-6 text-center">
          <p className="text-foreground/70">No saved deals yet. Browse and tap the bookmark to save.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedList.map((item) => (
            <DiscountCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}