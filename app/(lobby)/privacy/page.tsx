"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 flex flex-col items-center justify-start p-4 md:p-10 font-sans relative overflow-hidden">
      {/* Background Lights */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full max-w-4xl flex items-center justify-between py-4 mb-6 border-b border-white/10 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition duration-200"
        >
          <ArrowLeft size={14} />
          <span>Back to Lobby</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Lock size={16} />
          </div>
          <span className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
            FlyDnA Privacy
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-4xl glass-panel-heavy rounded-[28px] border border-cyan-400/20 p-6 md:p-10 bg-slate-950/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 space-y-8">
        <div className="border-b border-white/10 pb-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-3">
            <ShieldCheck size={12} />
            <span>Data Protection • Effective August 2026</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent tracking-wide">
            Privacy Policy
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-semibold mt-2 leading-relaxed">
            Your privacy and data security are paramount. This Privacy Policy details what information FlyDnA collects, how we use it, and how your data is safeguarded.
          </p>
        </div>

        <section className="space-y-6 text-left text-xs md:text-sm leading-relaxed text-slate-300 font-medium">
          {/* Section 1 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              1. Information We Collect
            </h2>
            <p className="text-slate-300/90 pl-6">
              When you register and interact with FlyDnA, we collect account details (name, username, email address, phone number), onboarding preferences (favorite music artists, dream travel destinations, travel cabin preferences), and active chat message data. We do not collect or store unencrypted financial card credentials on FlyDnA servers.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              2. How We Use Your Information
            </h2>
            <p className="text-slate-300/90 pl-6">
              We use your data strictly to deliver customized aeronautical travel experiences, auto-populate live concert/event deals for your favorite artists, power real-time 1v1 and group chat scenes, process NASC membership perks, and secure your account against unauthorized access.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              3. Third-Party Services & Travel Fulfillment
            </h2>
            <p className="text-slate-300/90 pl-6">
              To fulfill travel searches and bookings, necessary search criteria (such as destination cities, check-in dates, and guest counts) are transmitted to verified travel APIs (including LiteAPI and Ticketmaster). Third-party providers operate under their own privacy policies for booking fulfillment. FlyDnA does not sell your personal data to third-party ad brokers.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              4. Data Security & Storage
            </h2>
            <p className="text-slate-300/90 pl-6">
              FlyDnA implements industry-standard encryption protocols (TLS/SSL in transit, bcrypt hashed passwords, and token-based API authentication). Access to personal profile data is restricted strictly to authorized platform operations.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              5. Your Rights & Data Control
            </h2>
            <p className="text-slate-300/90 pl-6">
              You maintain full control over your personal profile. You may review, edit, or clear your onboarding preferences directly inside your FlyDnA Profile settings at any time, or request complete account deletion by contacting <span className="text-cyan-300 font-semibold">privacy@flydna.io</span>.
            </p>
          </div>
        </section>

        {/* Footer Navigation Links */}
        <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <span>© 2026 FlyDnA Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-cyan-300 transition">Terms of Service</Link>
            <span>•</span>
            <Link href="/refund" className="hover:text-cyan-300 transition">Refund & Cancellation Policy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
