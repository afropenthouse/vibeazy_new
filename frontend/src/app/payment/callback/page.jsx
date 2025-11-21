"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function PaymentCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState("Verifying payment...");

  useEffect(() => {
    const ref = params?.get("reference");
    if (!ref) {
      setStatus("Missing payment reference");
      return;
    }
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const res = await fetch(`${API_BASE}/payments/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
          body: JSON.stringify({ reference: ref }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Verification failed");
        if (data.payment?.status === "success") {
          setStatus("Payment successful. Returning...");
          router.replace(`/submit?paymentRef=${encodeURIComponent(ref)}`);
        } else {
          setStatus("Payment not successful");
        }
      } catch (e) {
        setStatus(e.message || "Verification error");
      }
    })();
  }, [params, router]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center">
      <div className="rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur p-6 shadow-xl text-center">
        <p className="text-lg font-semibold">{status}</p>
      </div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur p-6 shadow-xl text-center">
          <p className="text-lg font-semibold">Loading payment status...</p>
        </div>
      </main>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}