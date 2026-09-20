"use client";

import { useEffect } from "react";

const LIGHT_VARS: Record<string, string> = {
  "--bg-app": "#d9c5ba",
  "--surface-color": "#cfbdb1",
  "--accent-primary": "#8b7357",
  "--accent-secondary": "#5c4a35",
  "--text-main": "#1c1c2e",
  "--text-muted": "#6b7280",
  "--glass-bg": "rgba(207, 189, 177, 0.85)",
  "--glass-border": "rgba(139, 115, 87, 0.3)",
  "--shadow-premium": "0 4px 12px rgba(0, 0, 0, 0.08)",
  "--glow-primary": "0 0 15px rgba(139, 115, 87, 0.3)",
  "--glass-blur": "blur(20px)",
  "--radius-main": "16px",
  "--map-filter": "sepia(1) saturate(0.9) hue-rotate(-10deg) brightness(0.7) contrast(1.3)",
};

function applyTheme(theme: string) {
  const root = document.documentElement;
  localStorage.setItem("flydna_theme", theme);
  if (theme === "light") {
    // Inline style.setProperty wins over everything in the cascade
    Object.entries(LIGHT_VARS).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute("data-theme", "light");
    root.classList.remove("dark");
  } else {
    Object.keys(LIGHT_VARS).forEach((k) => root.style.removeProperty(k));
    root.setAttribute("data-theme", "dark");
    root.classList.add("dark");
  }
}

export default function ThemeSync() {
  useEffect(() => {
    // 1. Read theme from URL param or fall back to localStorage
    const search = typeof window !== "undefined" ? window.location.search : "";
    const urlTheme = new URLSearchParams(search || "").get("theme");
    const storedTheme = typeof window !== "undefined" ? localStorage.getItem("flydna_theme") : null;

    applyTheme(urlTheme ?? storedTheme ?? "dark");


    // 2. Listen for live postMessage toggles from the Angular shell
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "theme" || e.data?.type === "theme-response") {
        applyTheme(e.data.value);
      }
    };
    window.addEventListener("message", onMessage);

    // 3. Fallback: request current theme from parent in case URL param is missing
    if (window.parent !== window) {
      window.parent.postMessage({ type: "theme-request" }, "*");
    }

    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
