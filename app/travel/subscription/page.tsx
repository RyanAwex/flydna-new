"use client";

import React from "react";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "Standard",
    price: "$0",
    period: "forever",
    description: "Essential access for discovering curated commercial travel and community lobby chat.",
    features: [
      "Standard commercial flight booking",
      "Real-time travel updates & deals",
      "Lobby concierge chat access",
      "Integrated ground transportation",
    ],
    action: "Current Plan",
    actionLink: "/travel",
    highlighted: false,
  },
  {
    name: "Premier",
    price: "$29",
    period: "month",
    description: "Enhanced flexibility with priority flight telemetry and dynamic motion backdrops.",
    features: [
      "Access to exclusive hotel & stay deals",
      "Live flight & cruise telemetry feeds",
      "Premium motion scenes for 1v1 chat",
      "Priority customer & booking support",
      "Dedicated concierge fast-track",
    ],
    action: "Upgrade to Premier",
    actionLink: "/travel/payment?tier=silver",
    highlighted: false,
  },
  {
    name: "Elite",
    price: "$100",
    period: "month",
    description: "Full aeronautical suite with private charter splitting and 24/7 dedicated concierge.",
    features: [
      "Private jet split-charter reservations",
      "Full 3D tactical radar map integration",
      "Unlimited luxury resort backdrops",
      "End-to-End encrypted executive chat",
      "Black car service priority dispatch",
      "24/7 dedicated personal concierge",
    ],
    action: "Join Elite",
    actionLink: "/travel/payment?tier=gold",
    highlighted: true,
  },
];

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col justify-center">
      {/* Navigation Header */}
      <div className="mb-8 self-start">
        <Link
          href="/travel"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--surface-color)] border border-[var(--glass-border)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors duration-200"
        >
          <ArrowLeft size={14} /> Back to Travel
        </Link>
      </div>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-main)] mb-3">
          Elevate Your Journey
        </h1>
        <p className="text-sm sm:text-base font-normal text-[var(--text-muted)] leading-relaxed">
          Select a membership tier tailored to your travel lifestyle, from everyday flights to private aviation and 24/7 VIP concierge services.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {PLANS.map((plan) => {
          return (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl p-7 transition-all duration-300 ${
                plan.highlighted
                  ? "bg-[var(--surface-color)] border-2 border-[var(--accent-primary)] shadow-xl md:scale-105 z-10"
                  : "bg-[var(--surface-color)] border border-[var(--glass-border)] shadow-md hover:border-white/20"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-[var(--accent-primary)] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  Recommended
                </span>
              )}

              {/* Plan Name & Description */}
              <div className="mb-5">
                <h3 className="text-xl font-bold text-[var(--text-main)] tracking-wide">
                  {plan.name}
                </h3>
                <p className="text-xs font-medium text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* Pricing */}
              <div className="flex items-baseline gap-1 my-5 border-y border-[var(--glass-border)] py-4">
                <span className="text-4xl sm:text-5xl font-extrabold text-[var(--text-main)] tracking-tight">
                  {plan.price}
                </span>
                <span className="text-xs font-semibold text-[var(--text-muted)]">
                  / {plan.period}
                </span>
              </div>

              {/* Features List */}
              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <div className="p-0.5 rounded-full bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5">
                      <Check size={12} className="stroke-[3px]" />
                    </div>
                    <span className="text-xs font-medium text-[var(--text-main)] leading-snug">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <Link
                href={plan.actionLink}
                className={`w-full py-3 rounded-xl text-center text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer block ${
                  plan.highlighted
                    ? "bg-[var(--accent-primary)] text-white hover:brightness-110 shadow-sm"
                    : "bg-[var(--surface-color)] border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-white/5"
                }`}
              >
                {plan.action}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
