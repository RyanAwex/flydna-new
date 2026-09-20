"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ArrowRight, Menu, X, Sun, Moon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { currencies } from "@/utils/currencies";
import { useTheme } from "@/context/ThemeContext";

const Header = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const { isDarkMode, toggleDarkMode } = useTheme();
  const theme = isDarkMode ? "dark" : "light";
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem("flydna_token"));
    };
    checkAuth();
    window.addEventListener("auth-changed", checkAuth);
    return () => window.removeEventListener("auth-changed", checkAuth);
  }, []);

  const toggleTheme = toggleDarkMode;

  const themes = {
    dark: {
      "--bg-app": "#020617",
      "--surface-color": "#0f172a",
      "--accent-primary": "#3b82f6",
      "--accent-secondary": "#1d4ed8",
      "--text-main": "#f8fafc",
      "--text-muted": "rgba(248, 250, 252, 0.6)",
      "--glass-bg": "rgba(15, 23, 42, 0.65)",
      "--glass-border": "rgba(255, 255, 255, 0.08)",
      "--shadow-premium": "0 8px 32px 0 rgba(0, 0, 0, 0.4)",
      "--glow-primary": "0 0 15px rgba(59, 130, 246, 0.35)",
      "--glass-blur": "blur(20px)",
      "--radius-main": "16px",
    },
    light: {
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
      "--accent-primary-rgb": "139, 115, 87",
    },
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const stored = localStorage.getItem("flydna_theme");
    const root = document.documentElement;
    const currentTheme =
      stored === "light" || stored === "dark" ? stored : "dark";
    Object.entries(themes[currentTheme]).forEach(([prop, value]) => {
      root.style.setProperty(prop, value);
    });
  }, []);

  // Update CSS variables when theme changes
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    Object.entries(themes[theme]).forEach(([prop, value]) => {
      root.style.setProperty(prop, value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, mounted]);

  const navItems = [
    // { name: "Lobby", path: "https://futuristiclevelz.io/" },
    // { name: "Profile", path: "https://futuristiclevelz.io/profile" },
    // { name: "Finance", path: "https://futuristiclevelz.io/finance" },
    // { name: "Travel", path: "/travel" },
    // { name: "Store", path: "https://futuristiclevelz.io/store" },
    { name: "Lobby", path: "/" },
    { name: "Profile", path: "/profile" },
    { name: "Finance", path: "/finance" },
    { name: "Travel", path: "/travel" },
    { name: "Store", path: "/store" },
    { name: "NASC", path: "/nasc" },
    { name: "Memberships", path: "/travel/subscription" },
  ];

  return (
    <header className="flex items-center justify-between xl:grid xl:grid-cols-[1fr_auto_1fr] px-6 md:px-8 py-5 w-full text-[var(--text-main)] relative z-50 max-w-7xl mx-auto">
      {/* Left: Logo */}
      <div className="flex justify-start flex-shrink-0">
        <Link
          href="https://futuristiclevelz.io/"
          className="text-[1rem] sm:text-[1.15rem] cursor-pointer font-bold tracking-tight whitespace-nowrap"
        >
          FlyDnA
        </Link>
      </div>

      {/* Middle: Navigation - Centered on desktop */}
      <nav className="hidden xl:flex items-center gap-1.5 justify-center mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={`h-10 px-4 inline-flex items-center justify-center rounded-full font-medium text-sm transition-all duration-300 cursor-pointer relative backdrop-blur-xl border-b border-l border-r
              ${
                pathname === item.path
                  ? "bg-[var(--glass-bg)] text-[var(--text-main)] border-[var(--glass-border)] shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)]"
                  : "bg-[var(--glass-bg)] text-[var(--text-muted)] border-[var(--glass-border)] hover:text-[var(--text-main)] hover:bg-[var(--glass-bg)] hover:border-[var(--glass-border)] shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
              }
            `}
            style={{
              borderTop: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <span className="relative z-10">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Right: Actions (Separated from Navigation) */}
      <div className="flex items-center justify-end gap-2.5 w-full">
        {/* Profile & Currency & Theme Container */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Log In & Register on Desktop */}
          {!isAuthenticated && (
            <Link
              href="/auth?mode=login"
              className="hidden sm:inline-flex h-10 items-center justify-center transition-all duration-300 text-[var(--text-main)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg)] border-b border-l border-r border-[var(--glass-border)] px-4 rounded-full backdrop-blur-xl shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)] text-xs font-bold uppercase tracking-wider cursor-pointer select-none"
              style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}
            >
              Log In
            </Link>
          )}
          {!isAuthenticated && (
            <Link
              href="/onboarding"
              className="hidden sm:inline-flex h-10 items-center justify-center transition-all duration-300 text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] px-4 rounded-full shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)] text-xs font-bold uppercase tracking-wider cursor-pointer select-none"
            >
              Register
            </Link>
          )}

          {/* Theme Toggle */}
          {mounted && (
            <button
              type="button"
              className="h-10 w-10 inline-flex items-center justify-center cursor-pointer transition-all duration-300 text-[var(--text-main)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg)] border-b border-l border-r border-[var(--glass-border)] rounded-full backdrop-blur-xl shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)]"
              style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Currency Selector */}
          <div className="relative">
            <button
              type="button"
              className="h-10 px-3.5 inline-flex items-center gap-1.5 cursor-pointer transition-all duration-300 text-[var(--text-main)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg)] border-b border-l border-r border-[var(--glass-border)] rounded-full backdrop-blur-xl shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)]"
              style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}
              onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
            >
              <span className="font-medium text-xs sm:text-sm">
                {selectedCurrency}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${isCurrencyOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isCurrencyOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-24 bg-[var(--surface-color)]/95 backdrop-blur-2xl border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden shadow-[var(--accent-primary)]/10 z-50 py-2 max-h-48 overflow-y-auto"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {currencies.map((currency) => (
                  <div
                    key={currency}
                    className={`px-4 py-2 text-sm text-center cursor-pointer transition-colors ${
                      selectedCurrency === currency
                        ? "bg-[var(--accent-primary)]/20 text-[var(--text-main)] font-medium"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-bg)]"
                    }`}
                    onClick={() => {
                      setSelectedCurrency(currency);
                      setIsCurrencyOpen(false);
                    }}
                  >
                    {currency}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contact Us Button */}
        <Link
          href="/travel/contact"
          className="hidden xl:group xl:inline-flex h-10 items-center justify-center gap-2.5 bg-[var(--glass-bg)] hover:bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] text-[var(--text-main)] pl-4 pr-1.5 rounded-full font-medium text-sm cursor-pointer shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)] shrink-0 transition-all duration-300"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          <span>Contact Us</span>
          <div className="bg-[var(--accent-primary)] rounded-full w-7 h-7 flex items-center justify-center text-[var(--text-main)] group-hover:bg-[var(--accent-secondary)] transition-colors shadow-[var(--glow-primary)]">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className="xl:hidden h-10 w-10 inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Overlay Menu */}
      <div
        className={`fixed inset-0 z-[100] bg-[var(--bg-app)] xl:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Menu Header Section */}
        <div className="flex items-center justify-between px-6 py-5 w-full border-b border-[var(--glass-border)]">
          <Link
            href="https://futuristiclevelz.io/"
            onClick={() => setIsMenuOpen(false)}
            className="text-[1rem] sm:text-[1.15rem] font-bold tracking-tight whitespace-nowrap"
          >
            FlyDnA
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* User Profile Image */}
            {isAuthenticated && (
              <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 cursor-pointer relative shadow-lg shrink-0">
                <Image
                  src="/assets/profile.svg"
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                  width={28}
                  height={28}
                  priority
                />
              </div>
            )}

            {/* Theme Toggle */}
            {mounted && (
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 cursor-pointer transition-all duration-300 text-[var(--text-main)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full backdrop-blur-xl shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)]"
                style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Moon className="w-3.5 h-3.5" />
                ) : (
                  <Sun className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {/* Currency Selector */}
            <div className="relative">
              <div
                className="flex items-center gap-1.5 cursor-pointer transition-all duration-300 text-[var(--text-main)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg)] border-b border-l border-r border-[var(--glass-border)] px-3 py-1.5 rounded-full backdrop-blur-xl shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)]"
                style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
              >
                <span className="font-medium text-xs sm:text-sm">
                  {selectedCurrency}
                </span>
                <ChevronDown
                  className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 ${isCurrencyOpen ? "rotate-180" : ""}`}
                />
              </div>

              {isCurrencyOpen && (
                <div
                  className="absolute top-full right-0 mt-2 w-24 bg-[var(--surface-color)]/95 backdrop-blur-2xl border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden z-50 py-2 max-h-48 overflow-y-auto"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {currencies.map((currency) => (
                    <div
                      key={currency}
                      className={`px-4 py-2 text-sm text-center cursor-pointer transition-colors ${
                        selectedCurrency === currency
                          ? "bg-[var(--accent-primary)]/20 text-[var(--text-main)] font-medium"
                          : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-bg)]"
                      }`}
                      onClick={() => {
                        setSelectedCurrency(currency);
                        setIsCurrencyOpen(false);
                      }}
                    >
                      {currency}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
              onClick={() => setIsMenuOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Menu Items Section */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          <nav className="flex flex-col gap-3">
            {!isAuthenticated && (
              <div className="grid grid-cols-2 gap-3 mt-2 mb-2">
                <Link
                  href="/auth?mode=login"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-6 py-4 rounded-2xl font-semibold text-base transition-all duration-300 w-full cursor-pointer text-center block bg-[var(--glass-bg)] text-[var(--text-main)] border-b border-l border-r border-[var(--glass-border)] shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)] uppercase tracking-wider"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  Log In
                </Link>
                <Link
                  href="/onboarding"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-6 py-4 rounded-2xl font-semibold text-base transition-all duration-300 w-full cursor-pointer text-center block bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)] uppercase tracking-wider"
                >
                  Register
                </Link>
              </div>
            )}
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`px-6 py-4 rounded-2xl font-medium text-lg transition-all duration-300 w-full cursor-pointer text-left block backdrop-blur-xl border-b border-l border-r ${
                  pathname === item.path
                    ? "bg-[var(--glass-bg)] text-[var(--text-main)] border-[var(--glass-border)] shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)]"
                    : "bg-[var(--glass-bg)] text-[var(--text-muted)] border-[var(--glass-border)] hover:text-[var(--text-main)] hover:bg-[var(--glass-bg)] hover:border-[var(--glass-border)] shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                }`}
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                {item.name}
              </Link>
            ))}

            {/* Mobile Contact Button */}
            <Link
              href="/travel/contact"
              className="mt-4 flex items-center justify-between bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] text-[var(--text-main)] px-6 py-5 rounded-2xl font-semibold text-lg w-full cursor-pointer hover:bg-[var(--glass-bg)] transition-all shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)]"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <span>Contact Us</span>
              <ArrowRight className="w-6 h-6" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
