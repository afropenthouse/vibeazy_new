"use client";
import Image from "next/image";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import CategoriesNav from "@/components/CategoriesNav";
import Footer from "@/components/Footer";
import ScrollButtons from "@/components/ScrollButtons";

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return (
      <>
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-foreground/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/vibeazy.png" alt="VibeEazy" width={94} height={64} className="rounded" />
              <span className="text-sm md:text-base font-medium text-foreground/80">admin</span>
            </div>
          </div>
        </header>
        {children}
      </>
    );
  }

  // Default site chrome for non-admin pages
  return (
    <>
      <AnnouncementBar />
      <Header />
      <Suspense fallback={null}>
        <CategoriesNav />
      </Suspense>
      {children}
      <Footer />
      <ScrollButtons />
    </>
  );
}