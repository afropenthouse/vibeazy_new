export const metadata = {
  title: "How It Works — VibeEazy",
};

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold">How it works</h1>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-foreground/10 p-6 bg-background">
          <h3 className="font-semibold text-primary">Discover</h3>
          <p className="mt-2 text-foreground/70">Browse curated discounts across Restaurants, Beauty &amp; Spas, and Supermarkets.</p>
        </div>
        <div className="rounded-xl border border-foreground/10 p-6 bg-background">
          <h3 className="font-semibold text-primary">Claim</h3>
          <p className="mt-2 text-foreground/70">Tap &quot;Claim Coupon&quot; on any deal to view and redeem the promo.</p>
        </div>
        <div className="rounded-xl border border-foreground/10 p-6 bg-background">
          <h3 className="font-semibold text-primary">Favorite</h3>
          <p className="mt-2 text-foreground/70">Save deals to favorites — you&rsquo;ll be prompted to log in or sign up.</p>
        </div>
      </div>
    </main>
  );
}