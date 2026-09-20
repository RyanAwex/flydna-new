"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import dynamic from "next/dynamic";

const GhostCursor = dynamic(() => import("@/components/GhostCursor"), {
  ssr: false,
});

function AuthPageContent() {
  const router = useRouter();
  const rawSearchParams = useSearchParams();
  const searchParams = rawSearchParams && typeof rawSearchParams.get === "function" ? rawSearchParams : null;
  const modeParam = searchParams ? searchParams.get("mode") : null;


  const mode = modeParam === "signup" ? "signup" : "login";

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
    const LIGHT_VARS = [
      "--bg-app",
      "--surface-color",
      "--accent-primary",
      "--accent-secondary",
      "--text-main",
      "--text-muted",
      "--glass-bg",
      "--glass-border",
      "--shadow-premium",
      "--glow-primary",
      "--glass-blur",
      "--radius-main",
      "--map-filter",
    ];
    LIGHT_VARS.forEach((k) => root.style.removeProperty(k));
  }, []);

  useEffect(() => {
    if (mode === "signup") {
      router.replace("/onboarding");
    } else {
      setIsAuthorized(true);
    }
  }, [mode, router]);

  if (isAuthorized === null) {
    return (
      <main className="w-full min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex items-center justify-center relative overflow-hidden p-4">
        {/* Animated glowing liquid blobs background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="absolute left-1/4 -top-20 h-[550px] w-[550px] bg-[radial-gradient(circle,var(--blob-color-1)_0%,transparent_70%)] animate-blob-1" />
          <div className="absolute right-10 top-32 h-[450px] w-[450px] bg-[radial-gradient(circle,var(--blob-color-2)_0%,transparent_70%)] animate-blob-2" />
          <div className="absolute -bottom-20 left-1/3 h-[550px] w-[550px] bg-[radial-gradient(circle,var(--blob-color-3)_0%,transparent_70%)] animate-blob-3" />
        </div>

        {/* Sleek glass loader */}
        <div className="glass-panel-heavy rounded-2xl p-6 flex flex-col items-center gap-3 z-10">
          <div className="size-8 border-2 border-[var(--glass-border)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
          <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
            Verifying Credentials...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#020814] text-white flex items-center justify-center relative overflow-hidden p-4">
      {/* GhostCursor trails */}
      <Suspense fallback={null}>
        <GhostCursor
          // Visuals
          color="#22D3EE"
          brightness={2}
          edgeIntensity={0}
          // Trail and motion
          trailLength={20}
          inertia={0.01}
          // Post-processing
          grainIntensity={0.0}
          bloomStrength={0.05}
          bloomRadius={0.5}
          bloomThreshold={0.05}
          // Performance / Resolution
          targetPixels={300000}
          // Fade-out behavior
          fadeDelayMs={1000}
          fadeDurationMs={1500}
        />
      </Suspense>

      {/* Animated glowing liquid blobs background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute left-1/4 -top-20 h-[550px] w-[550px] bg-[radial-gradient(circle,var(--blob-color-1)_0%,transparent_70%)] animate-blob-1" />
        <div className="absolute right-10 top-32 h-[450px] w-[450px] bg-[radial-gradient(circle,var(--blob-color-2)_0%,transparent_70%)] animate-blob-2" />
        <div className="absolute -bottom-20 left-1/3 h-[550px] w-[550px] bg-[radial-gradient(circle,var(--blob-color-3)_0%,transparent_70%)] animate-blob-3" />
      </div>

      <AuthForm mode={mode} />
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="w-full min-h-screen bg-[#020814] text-white flex items-center justify-center relative overflow-hidden p-4">
          <div className="glass-panel-heavy rounded-2xl p-6 flex flex-col items-center gap-3 z-10">
            <div className="size-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Initializing Encrypted Portal...
            </span>
          </div>
        </main>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
