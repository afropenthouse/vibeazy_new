import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
  title: "VibeEazy — Enjoy More, Spend Less!",
  description: "Find fast food discounts across Restaurants, Beauty & Spas, and Supermarkets.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <AuthProvider>
          <SavedDealsProvider>
            <Header />
            {children}
            <Footer />
          </SavedDealsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
