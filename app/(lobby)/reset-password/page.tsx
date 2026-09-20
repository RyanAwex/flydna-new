"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { resetPassword } from "@/lib/api";

const GhostCursor = dynamic(() => import("@/components/GhostCursor"), {
  ssr: false,
});

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams ? searchParams.get("token") : null;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing from URL. Please request a new reset link.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth?mode=login");
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] z-10">
      {/* Brand Header */}
      <div className="text-center mb-8 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
          New Credentials
        </h2>
        <p className="text-slate-400 text-xs font-semibold mt-1">
          Cryptographic Security Update
        </p>
      </div>

      {/* Main Glass Panel */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="glass-panel-heavy border border-cyan-400/25 bg-[#06111f]/94 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-md rounded-3xl p-7 md:p-8"
      >
        <div className="mb-6 flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 w-fit mx-auto text-[10px] font-bold uppercase tracking-wider">
          <Shield size={11} />
          <span>Credential Re-encryption</span>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center flex items-center justify-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-6 flex flex-col items-center text-center gap-3">
            <div className="size-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 grid place-items-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-black text-white">Password Updated</h3>
            <p className="text-xs text-slate-300 max-w-[280px]">
              Your password has been successfully re-encrypted. Redirecting you to login...
            </p>
            <div className="mt-4">
              <Link
                href="/auth?mode=login"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline decoration-cyan-400/30"
              >
                Go to Login Now →
              </Link>
            </div>
          </div>
        ) : !token ? (
          <div className="py-4 text-center flex flex-col items-center gap-3">
            <div className="size-10 rounded-full bg-amber-500/20 border border-amber-400/30 grid place-items-center text-amber-400">
              <AlertCircle size={20} />
            </div>
            <h3 className="text-sm font-bold text-white">Invalid Reset Link</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No reset token was found in the URL. Please return to login and request a new password reset link.
            </p>
            <Link
              href="/auth?mode=login"
              className="mt-2 py-2.5 px-5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 text-left font-bold text-slate-200 text-xs"
          >
            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock size={14} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock size={14} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(0,174,255,0.3)] mt-6 text-center flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
            >
              {isLoading ? (
                <div className="size-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>

      {/* Footer Link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center text-xs text-slate-400 font-semibold mt-6"
      >
        Remembered your credentials?{" "}
        <Link
          href="/auth?mode=login"
          className="text-cyan-400 hover:text-cyan-300 font-bold underline decoration-cyan-400/30 transition ml-0.5"
        >
          Return to Login
        </Link>
      </motion.p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="w-full min-h-screen bg-[#020814] text-white flex items-center justify-center relative overflow-hidden p-4">
      {/* GhostCursor trails */}
      <Suspense fallback={null}>
        <GhostCursor
          color="#22D3EE"
          brightness={2}
          edgeIntensity={0}
          trailLength={20}
          inertia={0.01}
          grainIntensity={0.0}
          bloomStrength={0.05}
          bloomRadius={0.5}
          bloomThreshold={0.05}
          targetPixels={300000}
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

      <Suspense
        fallback={
          <div className="glass-panel-heavy rounded-2xl p-6 flex flex-col items-center gap-3 z-10">
            <div className="size-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Loading security portal...
            </span>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
