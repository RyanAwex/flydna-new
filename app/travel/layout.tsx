import type { Metadata } from "next";
import "./globals.css";
import ThemeSync from "@/components/travel/shared/ThemeSync";
import Header from "@/components/travel/shared/Header";
import Footer from "@/components/travel/shared/Footer";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "FlyDnA",
  description:
    "FlyDnA is a travel agency that provides flights, hotels, cars, and activities.",
};

export default function TravelNestedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={null}>
      <ThemeSync />
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main className="relative min-h-screen max-w-7xl mx-auto bg-[var(--bg-app)] text-[var(--text-main)] animate-fade-in">
        {children}
      </main>
      <Suspense>
        <Footer />
      </Suspense>
    </Suspense>
  );
}

