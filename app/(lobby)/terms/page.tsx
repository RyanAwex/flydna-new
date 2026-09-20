"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, FileText, CheckCircle2 } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 flex flex-col items-center justify-start p-4 md:p-10 font-sans relative overflow-hidden">
      {/* Background Lights */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

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
            <FileText size={16} />
          </div>
          <span className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
            FlyDnA Legal
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-4xl glass-panel-heavy rounded-[28px] border border-cyan-400/20 p-6 md:p-10 bg-slate-950/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 space-y-8">
        <div className="border-b border-white/10 pb-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-3">
            <Shield size={12} />
            <span>Official Policy • Effective August 2026</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent tracking-wide">
            Terms of Service
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-semibold mt-2 leading-relaxed">
            Please review the legal rules and conditions governing your account, NASC membership, scene marketplace purchases, and use of the FlyDnA platform.
          </p>
        </div>

        <section className="space-y-6 text-left text-xs md:text-sm leading-relaxed text-slate-300 font-medium">
          {/* Section 1 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              1. Acceptance of Terms & Account Registration
            </h2>
            <p className="text-slate-300/90 pl-6">
              By accessing, creating an account, or interacting with the FlyDnA platform, you agree to be bound by these Terms of Service. You must be at least 18 years of age or possess legal parental consent to create an account. You are responsible for maintaining the confidentiality of your credentials.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              2. Acceptable Use & Conduct
            </h2>
            <p className="text-slate-300/90 pl-6">
              FlyDnA fosters a respectful, immersive aeronautical travel community. Users agree not to engage in harassment, unauthorized access, reverse-engineering, or automated scraping of platform assets or user profiles. Failure to comply may result in temporary suspension or permanent termination of NASC membership.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              3. NASC Memberships & Scene Marketplace Purchases
            </h2>
            <p className="text-slate-300/90 pl-6">
              FlyDnA offers digital scene backdrops, character customization items, and NASC membership tiers. Digital purchases grant a non-transferable, personal license to use the acquired scene inside the FlyDnA application interface. Digital items are non-fungible within the app and cannot be redeemed for fiat currency.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              4. Travel & Ground Transportation Fulfillment (LUXY Partner)
            </h2>
            <p className="text-slate-300/90 pl-6">
              Ground chauffeur transfers, flight bookings, and hotel stays facilitated within FlyDnA are operated via verified partner networks (including LUXY Ride Ground Transportation and certified global travel GDS networks). Ground transport orders include a complimentary 2-hour cancellation window prior to driver dispatch. Third-party supplier terms, vehicle carrier rules, and passenger conduct policies apply to all dispatched transfers.
            </p>
          </div>


          {/* Section 5 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              5. Limitation of Liability
            </h2>
            <p className="text-slate-300/90 pl-6">
              FlyDnA is provided on an "as is" and "as available" basis. To the maximum extent permitted by applicable law, FlyDnA, its founders, and affiliates shall not be liable for indirect, incidental, or consequential damages resulting from platform downtime, partner travel cancellations, or unauthorized account compromise.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              6. Contact Information
            </h2>
            <p className="text-slate-300/90 pl-6">
              For questions regarding these Terms of Service or legal inquiries, please contact our support team at <span className="text-cyan-300 font-semibold">legal@flydna.io</span>.
            </p>
          </div>
        </section>

        {/* Footer Navigation Links */}
        <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <span>© 2026 FlyDnA Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-cyan-300 transition">Privacy Policy</Link>
            <span>•</span>
            <Link href="/refund" className="hover:text-cyan-300 transition">Refund & Cancellation Policy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
