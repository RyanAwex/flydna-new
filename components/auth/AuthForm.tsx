/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  Check,
} from "lucide-react";
import Link from "next/link";
import { login, forgotPassword } from "@/lib/api";

interface AuthFormProps {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    agreeTerms: false,
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isForgot, setIsForgot] = useState(false);

  const isLogin = !isForgot;

  useEffect(() => {
    if (mode === "signup") {
      try {
        const onboardingData = localStorage.getItem("flydna_onboarding");
        if (onboardingData) {
          const data = JSON.parse(onboardingData);
          if (data.personalProfile) {
            setFormData((prev) => ({
              ...prev,
              email: data.personalProfile.email || "",
              password: data.personalProfile.password || "",
            }));
          }
        }
      } catch (err) {
        console.error("Error reading onboarding data:", err);
      }
    }
  }, [mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (isForgot) {
      if (!formData.email) {
        setError("Please enter your registered email address.");
        return;
      }

      setIsLoading(true);
      try {
        const result = await forgotPassword(formData.email);
        setSuccessMsg(
          result.message ||
            "Password reset link sent! Check your inbox or terminal console.",
        );
      } catch (err: any) {
        setError(err.message || "Failed to request password reset");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields.");
      return;
    }

    // 1. Instantiate the audios synchronously within the user gesture (click event)
    const videoAudio = new Audio("/sounds/plane-takeoff.mp4");
    const mp3Audio = new Audio("/sounds/LiveATC.mp3");

    // 2. Play and pause them immediately to unlock the audio playback context under browser security policies
    videoAudio
      .play()
      .then(() => videoAudio.pause())
      .catch(() => {});
    mp3Audio
      .play()
      .then(() => mp3Audio.pause())
      .catch(() => {});

    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result && result.token) {
        localStorage.setItem("flydna_token", result.token);
        localStorage.setItem("flydna_user", JSON.stringify(result.user));

        // 3. Play both unlocked audios simultaneously
        videoAudio.play().catch((err) => {
          console.warn("[AuthForm] Failed to play plane-takeoff audio:", err);
        });
        mp3Audio.play().catch((err) => {
          console.warn("[AuthForm] Failed to play LiveATC audio:", err);
        });

        // 4. Cut and reset both playbacks after 8 seconds
        setTimeout(() => {
          try {
            videoAudio.pause();
            videoAudio.currentTime = 0;
            mp3Audio.pause();
            mp3Audio.currentTime = 0;
          } catch (err) {
            console.warn(
              "[AuthForm] Failed to stop audios after 8 seconds:",
              err,
            );
          }
        }, 8000);

        window.dispatchEvent(new Event("auth-changed"));

        // 5. Add a 500ms delay to give the browser time to buffer and start playing the audio streams
        // before Next.js unmounts the AuthForm component
        setTimeout(() => {
          router.push("/");
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] z-10">
      {/* Brand Header */}
      <div className="text-center mb-8 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
          {isForgot ? "Reset Password" : "FlyDnA Login"}
        </h2>
        <p className="text-slate-400 text-xs font-semibold mt-1">
          {isForgot
            ? "Encrypted Credential Recovery"
            : isLogin
              ? "Encrypted Terminal Authorization"
              : "Register Cryptographic Identity"}
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
          <span>
            {isForgot ? "Password Recovery" : "Secure Authentication"}
          </span>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center flex flex-col gap-1">
            <div className="flex items-center justify-center gap-1.5 font-extrabold">
              <Check size={14} className="text-emerald-400" />
              <span>Instructions Dispatched</span>
            </div>
            <span className="text-[11px] text-emerald-300/80 font-normal">
              {successMsg}
            </span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 text-left font-bold text-slate-200 text-xs"
        >
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-[10px] uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Mail size={14} />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="alex.mercer@flydna.com"
                className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
              />
            </div>
          </div>

          {!isForgot && (
            <>
              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                    Password
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgot(true);
                        setError("");
                        setSuccessMsg("");
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-[10px] transition cursor-pointer font-bold"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
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

              {/* Checkboxes */}
              <div className="flex items-center justify-between pt-1">
                {isLogin ? (
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-400 hover:text-slate-200">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div
                        className={`size-4.5 rounded border flex items-center justify-center transition ${
                          formData.rememberMe
                            ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                            : "border-white/10 bg-[#020814]/80"
                        }`}
                      >
                        {formData.rememberMe && (
                          <Check size={11} strokeWidth={3} />
                        )}
                      </div>
                    </div>
                    <span>Keep me signed in</span>
                  </label>
                ) : (
                  <label className="flex items-start gap-2 cursor-pointer select-none text-[10px] text-slate-400 hover:text-slate-200 leading-snug">
                    <div className="relative mt-0.5 flex-shrink-0">
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div
                        className={`size-4 rounded border flex items-center justify-center transition ${
                          formData.agreeTerms
                            ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                            : "border-white/10 bg-[#020814]/80"
                        }`}
                      >
                        {formData.agreeTerms && (
                          <Check size={10} strokeWidth={3} />
                        )}
                      </div>
                    </div>
                    <span>
                      I accept the secure cryptographic identity terms and
                      conditions.
                    </span>
                  </label>
                )}
              </div>
            </>
          )}

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
                <span>
                  {isForgot
                    ? "Dispatch Reset Link"
                    : isLogin
                      ? "Authorize Secure Access"
                      : "Create Identity"}
                </span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Switch Mode Footer Link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center text-xs text-slate-400 font-semibold mt-6"
      >
        {isForgot ? (
          <>
            Remembered your credentials?{" "}
            <button
              type="button"
              onClick={() => {
                setIsForgot(false);
                setError("");
                setSuccessMsg("");
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline decoration-cyan-400/30 transition ml-0.5 cursor-pointer"
            >
              Back to Login
            </button>
          </>
        ) : isLogin ? (
          <>
            New to FlyDnA?{" "}
            <Link
              href="/onboarding"
              className="text-cyan-400 hover:text-cyan-300 font-bold underline decoration-cyan-400/30 transition ml-0.5"
            >
              Create secure account
            </Link>
          </>
        ) : (
          <>
            Already have an identity?{" "}
            <Link
              href="/auth?mode=login"
              className="text-cyan-400 hover:text-cyan-300 font-bold underline decoration-cyan-400/30 transition ml-0.5"
            >
              Log in securely
            </Link>
          </>
        )}
      </motion.p>
    </div>
  );
}
