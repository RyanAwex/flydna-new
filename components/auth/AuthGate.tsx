"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Sync theme on mount before checking credentials
    const storedTheme = localStorage.getItem("flydna_theme");
    const root = document.documentElement;
    if (storedTheme === "light") {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    } else {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    }

    const checkAuth = () => {
      const token = localStorage.getItem("flydna_token");
      const isPublicPage =
        pathname?.startsWith("/auth") || pathname?.startsWith("/onboarding");

      if (!token && !isPublicPage) {
        setIsAuthenticated(false);
        router.replace("/auth?mode=login");
      } else {
        setIsAuthenticated(true);
      }
    };

    checkAuth();
    window.addEventListener("auth-changed", checkAuth);
    return () => window.removeEventListener("auth-changed", checkAuth);
  }, [pathname, router]);

  if (isAuthenticated === null) {
    return (
      <main className="w-full min-h-screen bg-[var(--bg-app)] flex items-center justify-center transition-colors duration-300">
        <div className="glass-panel-heavy rounded-2xl p-6 flex flex-col items-center gap-3">
          <div className="size-8 border-2 border-[var(--glass-border)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
          <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
            Verifying Credentials...
          </span>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
