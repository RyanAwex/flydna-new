"use client";
import Link from "next/link";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  User,
  Terminal,
  ShoppingBag,
  Radio,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function Footer() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const handleUplink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter an email frequency.");
      setStatus("error");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Invalid protocol. Please verify email format.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    // Simulate connection establishing
    setTimeout(() => {
      setStatus("success");
      setEmail("");
      // Clear success message after 5 seconds
      setTimeout(() => setStatus("idle"), 5000);
    }, 1500);
  };

  const triggerMockNotification = (linkName: string) => {
    setNotification(
      `Accessing secure gateway... Node '${linkName}' is currently offline.`,
    );
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  return (
    <footer className="relative z-10 w-full mt-10">
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl glass-panel-heavy border-cyan-400/30 shadow-[0_10px_30px_rgba(0,174,255,0.25)] max-w-sm"
            >
              <Radio size={20} className="text-cyan-400 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Telemetry Uplink
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  {notification}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass-panel-heavy rounded-[28px] p-6 md:p-10 shadow-[0_15px_35px_rgba(0,0,0,0.3)] bg-gradient-to-b from-[#06111f]/90 to-[#030c17]/95">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_1fr]">
          {/* Column 1: Brand Info & System Status */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent tracking-tight">
                FlyDnA
              </h2>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm font-semibold">
              Next-gen orbital navigation & decentralized communication.
              Redefining the digital frontier since 2026.
            </p>
          </div>

          {/* Column 2: Orbital Links */}
          <div className="flex flex-col">
            <h3 className="text-xs uppercase tracking-widest text-cyan-400/80 font-bold mb-5">
              Orbital Links
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 font-semibold text-sm">
              <li>
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center gap-2.5 text-slate-400 hover:text-white transition duration-200 cursor-pointer text-left w-full group"
                >
                  <Home
                    size={15}
                    className="text-slate-500 group-hover:text-cyan-400 transition"
                  />
                  <span>Lobby</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push("/profile")}
                  className="flex items-center gap-2.5 text-slate-400 hover:text-white transition duration-200 cursor-pointer text-left w-full group"
                >
                  <User
                    size={15}
                    className="text-slate-500 group-hover:text-cyan-400 transition"
                  />
                  <span>User Profile</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => triggerMockNotification("Dashboard Terminal")}
                  className="flex items-center gap-2.5 text-slate-400 hover:text-white transition duration-200 cursor-pointer text-left w-full group"
                >
                  <Terminal
                    size={15}
                    className="text-slate-500 group-hover:text-cyan-400 transition"
                  />
                  <span>Dashboard Terminal</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => triggerMockNotification("Marketplace")}
                  className="flex items-center gap-2.5 text-slate-400 hover:text-white transition duration-200 cursor-pointer text-left w-full group"
                >
                  <ShoppingBag
                    size={15}
                    className="text-slate-500 group-hover:text-cyan-400 transition"
                  />
                  <span>Marketplace</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => triggerMockNotification("Network Uplink")}
                  className="flex items-center gap-2.5 text-slate-400 hover:text-white transition duration-200 cursor-pointer text-left w-full group"
                >
                  <Radio
                    size={15}
                    className="text-slate-500 group-hover:text-cyan-400 transition"
                  />
                  <span>Network Uplink</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Sub-Frequency Newsletter */}
          <div className="flex flex-col">
            <h3 className="text-xs uppercase tracking-widest text-cyan-400/80 font-bold mb-5">
              Sub-Frequency
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-5 font-semibold">
              Get mission-critical updates. No spam. Just signal.
            </p>

            <form onSubmit={handleUplink} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter uplink email..."
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  disabled={status === "loading" || status === "success"}
                  className="flex-1 glass-input rounded-2xl py-3 px-4 text-sm text-slate-200 placeholder-slate-500 font-semibold focus:outline-none disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className="glass-button glass-sheen bg-gradient-to-r from-cyan-500/80 to-blue-600/80 border-cyan-400/30 px-5 py-3 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition font-bold text-xs tracking-wider uppercase text-white shadow-[0_0_15px_rgba(0,174,255,0.3)] cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : status === "success" ? (
                    <CheckCircle size={14} />
                  ) : (
                    <>
                      <span>Uplink</span>
                      <Send size={12} className="opacity-80" />
                    </>
                  )}
                </button>
              </div>

              {/* Status Messages */}
              <AnimatePresence mode="wait">
                {status === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-1.5 text-xs text-rose-400 font-bold"
                  >
                    <AlertCircle size={14} />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
                {status === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold"
                  >
                    <CheckCircle size={14} />
                    <span>Uplink established. Channel is secure.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>

        {/* Outer bottom copyright footer bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-slate-500 gap-4">
          <span>© 2026 FlyDnA Account Center</span>
          <div className="flex gap-5">
            <Link
              href="/privacy"
              className="hover:text-slate-300 cursor-pointer transition"
            >
              Privacy Protocol
            </Link>
            <Link
              href="/terms"
              className="hover:text-slate-300 cursor-pointer transition"
            >
              System Terms
            </Link>
            <Link
              href="/refund"
              className="hover:text-slate-300 cursor-pointer transition"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
