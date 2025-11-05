import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import AnnouncementBar from "@/components/AnnouncementBar";
import CategoriesNav from "@/components/CategoriesNav";
import Footer from "@/components/Footer";
import ScrollButtons from "@/components/ScrollButtons";
import { SavedDealsProvider } from "@/contexts/SavedDealsContext";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Vibeazy - Find Promos & Deals from your Favorite Restaurants!",
  description: "Find Promos & Deals from your Favorite Restaurants!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <AuthProvider>
          <SavedDealsProvider>
            <AnnouncementBar />
            <Header />
            <CategoriesNav />
            {children}
            <Footer />
            <ScrollButtons />
          </SavedDealsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
