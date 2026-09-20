"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CreditCard, CheckCircle2 } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 flex flex-col items-center justify-start p-4 md:p-10 font-sans relative overflow-hidden">
      {/* Background Lights */}
      <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

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
            <CreditCard size={16} />
          </div>
          <span className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
            FlyDnA Refunds
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-4xl glass-panel-heavy rounded-[28px] border border-cyan-400/20 p-6 md:p-10 bg-slate-950/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 space-y-8">
        <div className="border-b border-white/10 pb-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-3">
            <RefreshCw size={12} />
            <span>Fulfillment Terms • Effective August 2026</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent tracking-wide">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-semibold mt-2 leading-relaxed">
            Understand how refunds, cancellations, and modifications operate for travel bookings, NASC memberships, and scene marketplace items.
          </p>
        </div>

        <section className="space-y-6 text-left text-xs md:text-sm leading-relaxed text-slate-300 font-medium">
          {/* Section 1 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              1. Ground Transportation & Chauffeur Dispatch (LUXY Partner)
            </h2>
            <p className="text-slate-300/90 pl-6">
              Chauffeur and black car transfer reservations facilitated via our LUXY Ground Transportation network offer a <strong>Free 2-Hour Cancellation Window</strong>. Reservations cancelled at least 2 hours prior to scheduled pickup (or within 2 hours of booking authorization) receive a 100% full refund credited instantly back to your account ledger or original payment method. Cancellations requested after the 2-hour dispatch window has closed are non-refundable to cover driver mobilization and vehicle staging.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              2. Hotel & Flight Travel Bookings
            </h2>
            <p className="text-slate-300/90 pl-6">
              Travel reservation cancellations and refunds are subject to the specific supplier and property policies as provided by our booking partner (LiteAPI / carrier supplier). Non-refundable hotel rates or restricted flight fares are bound by supplier rules established at the time of purchase. Where flexible cancellation applies, refund processing is initiated back to your original payment method upon supplier confirmation.
            </p>
          </div>


          {/* Section 2 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              2. Scene Marketplace & Digital Customization Assets
            </h2>
            <p className="text-slate-300/90 pl-6">
              Digital purchases made within the FlyDnA Scene Marketplace (such as premium animated backdrops, character cards, or apparel items) are delivered immediately upon confirmation. Due to the digital nature of these assets, marketplace purchases are final and non-refundable once unlocked in your account, except where required by law.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              3. NASC Memberships & Subscription Billing
            </h2>
            <p className="text-slate-300/90 pl-6">
              NASC Membership tiers grant ongoing access to exclusive travel perks, concierge features, and premium background access. You may cancel recurring membership billing at any time through your Profile settings. Membership access will remain active through the end of your current billing period without partial pro-rated refunds.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
              4. Processing Timelines & Support
            </h2>
            <p className="text-slate-300/90 pl-6">
              Approved refunds are credited to the original payment method within 5 to 10 business days depending on your financial institution. If you experience issues with a travel reservation or purchase, please contact our support team at <span className="text-cyan-300 font-semibold">support@flydna.io</span>.
            </p>
          </div>
        </section>

        {/* Footer Navigation Links */}
        <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <span>© 2026 FlyDnA Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-cyan-300 transition">Terms of Service</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-cyan-300 transition">Privacy Policy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
