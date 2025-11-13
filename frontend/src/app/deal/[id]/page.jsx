"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEALS_DATA } from "@/components/SearchFilter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function mapApiDealToCard(d) {
  return {
    id: d.id,
    category: d.category || "Restaurants",
    merchantName: d.merchantName || d.merchant_name || d.title || "",
    title: d.title || "",
    description: d.description || "",
    place: d.city || "",
    image: d.imageUrl || "/placeholder.png",
    priceOriginal: typeof d.oldPrice === "number" ? d.oldPrice : undefined,
    priceCurrent: typeof d.newPrice === "number" ? d.newPrice : undefined,
    expiresAt: d.expiresAt || undefined,
    url: d.deepLink || undefined,
  };
}

export default function DealDetailPage({ params }) {
  const router = useRouter();
  const idNum = Number(params.id);
  const fallback = useMemo(() => DEALS_DATA.find((d) => Number(d.id) === idNum), [idNum]);
  const [deal, setDeal] = useState(fallback || null);

  useEffect(() => {
    let didCancel = false;
    async function load() {
      if (fallback) return; // already have data
      try {
        const res = await fetch(`${API_BASE}/admin/public/deals/${encodeURIComponent(idNum)}`);
        const data = await res.json();
        if (!didCancel && res.ok && data.deal) {
          setDeal(mapApiDealToCard(data.deal));
        }
      } catch {}
    }
    load();
    return () => { didCancel = true; };
  }, [idNum, fallback]);

  if (!deal) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-foreground/70">Deal not found.</p>
        <div className="mt-4">
          <Link href="/" className="rounded-md bg-primary text-white px-4 py-2 text-sm">Back home</Link>
        </div>
      </main>
    );
  }

  // Helper
  const formatNaira = (value) => {
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
    } catch {
      return `₦${Number(value).toLocaleString()}`;
    }
  };

  const original = Math.max(deal.priceOriginal ?? 0, deal.priceCurrent ?? 0);
  const current = Math.min(deal.priceOriginal ?? 0, deal.priceCurrent ?? 0);
  const percent = original > 0 ? Math.floor(((original - current) / original) * 100) : null;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Top: image + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative rounded-2xl overflow-hidden border border-foreground/10 shadow-sm">
          <Image src={deal.image} alt={deal.title} width={1200} height={800} className="w-full h-[320px] sm:h-[420px] object-cover" />
          {percent !== null && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold shadow">
              {percent}% Off
            </span>
          )}
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">{deal.title}</h1>
          {deal.place && <p className="text-sm text-foreground/60 mt-1">{deal.place}</p>}
          <p className="mt-3 text-foreground/80">{deal.description}</p>

          {(deal.priceOriginal || deal.priceCurrent) && (
            <div className="mt-6 flex items-end gap-3">
              {current ? <span className="text-2xl font-bold text-primary">{formatNaira(current)}</span> : null}
              {original ? <span className="text-lg text-foreground/60 line-through">{formatNaira(original)}</span> : null}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {deal.url ? (
              <a href={deal.url} target="_blank" rel="noopener noreferrer" className="rounded-md bg-primary text-white px-4 py-2 text-sm hover:brightness-110">Get Offer</a>
            ) : (
              <button className="rounded-md bg-primary/60 text-white px-4 py-2 text-sm cursor-not-allowed">Get Offer</button>
            )}
            <button onClick={() => router.push("/#hot-deals")} className="rounded-md border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5">Back to deals</button>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-foreground/10 bg-background p-5">
          <h3 className="font-semibold">Need to Know</h3>
          <ul className="mt-3 text-sm text-foreground/70 space-y-2">
            <li>Limited-time offer; subject to availability.</li>
            <li>Redeem online or in-store depending on partner.</li>
            <li>Valid only at participating locations.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-foreground/10 bg-background p-5">
          <h3 className="font-semibold">Where to Redeem</h3>
          <p className="mt-3 text-sm text-foreground/70">Visit partner page to claim offer. Check their Instagram or website for precise steps.</p>
        </div>
        <div className="rounded-xl border border-foreground/10 bg-background p-5">
          <h3 className="font-semibold">Reviews</h3>
          <p className="mt-3 text-sm text-foreground/70">Ratings and testimonials coming soon.</p>
        </div>
      </div>
    </main>
  );
}