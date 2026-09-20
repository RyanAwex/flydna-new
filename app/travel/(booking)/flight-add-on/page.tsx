"use client";
import React from "react";
import Link from "next/link";
import ProgressBar from "../components/ProgressBar";
import {
  ChevronRight,
  CirclePlus,
  // Hamburger,
  Luggage,
  RockingChair,
  ShieldCheck,
} from "lucide-react";
import { useSearchStore } from "@/utils/states/useSearchStore";

export default function AddOnsPage() {
  const { selectedOffer } = useSearchStore();

  // Compute pricing matching selectedOffer
  const basePrice = selectedOffer
    ? Math.round(parseFloat(selectedOffer.total_amount) * 0.85)
    : 850;
  const taxes = selectedOffer
    ? Math.round(parseFloat(selectedOffer.total_amount) * 0.15)
    : 120;
  const totalPrice = selectedOffer
    ? Math.round(parseFloat(selectedOffer.total_amount))
    : 970;

  return (
    <div className="relative w-full max-w-[1728px] mx-auto min-h-screen overflow-hidden text-[var(--text-main)] bg-[var(--bg-app)]">
      {/* Hero Background */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(124,94,254,0.15)_0%,transparent_70%)] -z-10"></div>

      {/* Step Progress Bar */}
      <ProgressBar currentStep={2} />

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-[180px] relative z-10 w-full pb-4">
        <h1 className="text-2xl sm:text-3xl font-medium mb-2">
          Enhance Your Journey
        </h1>
        <p className="text-[var(--text-muted)] text-sm sm:text-base">
          Select premium additions to make your flight more comfortable
        </p>
      </div>
      <main className="flex flex-col xl:flex-row gap-6 sm:gap-8 px-4 sm:px-6 lg:px-[180px] pb-24 relative z-10 w-full">
        {/* Left: Add-ons List */}
        <section className="flex-[2] w-full">
          {/* Seat Selection Card */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 mb-6 rounded-3xl bg-[var(--surface-color)] border border-[var(--glass-border)] hover:border-[var(--accent-primary)]/50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="flex gap-4 sm:gap-6 flex-1 w-full flex-row">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                <RockingChair className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex flex-col gap-2 w-full overflow-hidden">
                <div className="text-lg sm:text-xl font-medium flex items-center gap-2 sm:gap-3 whitespace-nowrap overflow-hidden text-ellipsis">
                  Seat Selection
                  <span className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 bg-[var(--accent-primary)]/5 text-[var(--accent-primary)] border border-[var(--accent-primary)] rounded-full shrink-0">
                    Premium
                  </span>
                </div>
                <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed max-w-sm">
                  Choose from window, aisle, or extra legroom seats to ensure
                  your maximum comfort throughout the flight.
                </p>
                <Link
                  href="/travel/pick-a-seat"
                  className="mt-3 sm:mt-4 px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base rounded-full self-start bg-transparent border-[1px] border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-all w-max"
                >
                  Select Seats
                </Link>
              </div>
            </div>
            <img
              className="w-full lg:w-[200px] h-32 sm:h-[160px] object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
              src="https://images.unsplash.com/photo-1540339832862-474599807836?w=200&h=160&fit=crop"
              alt="Airplane seats"
            />
          </div>

          {/* Extra Baggage Card */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 mb-6 rounded-3xl bg-[var(--surface-color)] border border-[var(--glass-border)] hover:border-[var(--accent-primary)]/50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="flex gap-4 sm:gap-6 flex-1 w-full flex-row">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                <Luggage className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex flex-col gap-2 w-full overflow-hidden">
                <div className="text-lg sm:text-xl font-medium flex items-center gap-2 sm:gap-3 whitespace-nowrap overflow-hidden text-ellipsis">
                  Extra Baggage
                </div>
                <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed max-w-sm">
                  Need more space? Add extra weight to your check-in baggage at
                  a discounted online rate.
                </p>
                <div className="flex items-center gap-3 sm:gap-4 mt-2">
                  <button className="flex items-center gap-1 font-medium text-[var(--text-main)] px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-full border border-[var(--glass-border)] bg-transparent hover:bg-[var(--glass-bg)] transition-all duration-300 cursor-pointer w-max">
                    <CirclePlus className="w-3 h-3 sm:w-4 sm:h-4" />
                    30 kg
                  </button>
                  <span className="font-semibold text-sm sm:text-base text-[var(--accent-primary)]">
                    +$45.00
                  </span>
                </div>
              </div>
            </div>
            <img
              className="w-full lg:w-[200px] h-32 sm:h-[160px] object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
              src="https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=200&h=160&fit=crop"
              alt="Travel baggage"
            />
          </div>

          {/* Meal Preference Card */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 mb-6 rounded-3xl bg-[var(--surface-color)] border border-[var(--glass-border)] hover:border-[var(--accent-primary)]/50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="flex gap-4 sm:gap-6 flex-1 w-full flex-row">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                {/* <Hamburger className="w-6 h-6 sm:w-7 sm:h-7" /> */}
              </div>
              <div className="flex flex-col gap-2 w-full overflow-hidden">
                <div className="text-lg sm:text-xl font-medium flex items-center gap-2 sm:gap-3 whitespace-nowrap overflow-hidden text-ellipsis">
                  Meal Preference
                </div>
                <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed max-w-sm">
                  Select from our chef-curated menu catering to all dietary
                  requirements and preferences.
                </p>
                <div className="mt-2 sm:mt-3 relative w-full sm:w-max max-w-[200px]">
                  <select
                    className="appearance-none bg-transparent border border-[var(--glass-border)] text-[var(--text-main)] font-medium pl-3 sm:pl-4 pr-8 sm:pr-10 py-1.5 sm:py-2.5 text-xs sm:text-base rounded-full hover:bg-[var(--glass-bg)] cursor-pointer focus:outline-none transition shadow-inner w-full"
                    defaultValue="Standard Gourmet"
                  >
                    <option className="bg-[var(--surface-color)] text-[var(--text-main)]">
                      Standard Gourmet
                    </option>
                    <option className="bg-[var(--surface-color)] text-[var(--text-main)]">
                      Vegetarian
                    </option>
                    <option className="bg-[var(--surface-color)] text-[var(--text-main)]">
                      Vegan
                    </option>
                    <option className="bg-[var(--surface-color)] text-[var(--text-main)]">
                      Halal
                    </option>
                    <option className="bg-[var(--surface-color)] text-[var(--text-main)]">
                      Kosher
                    </option>
                    <option className="bg-[var(--surface-color)] text-[var(--text-main)]">
                      Gluten-Free
                    </option>
                  </select>
                  <svg
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text-main)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>
            <img
              className="w-full lg:w-[200px] h-32 sm:h-[160px] object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=160&fit=crop"
              alt="Gourmet meal"
            />
          </div>

          {/* Travel Insurance Card */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 mb-6 rounded-3xl bg-[var(--surface-color)] border border-[var(--glass-border)] hover:border-[var(--accent-primary)]/50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="flex gap-4 sm:gap-6 flex-1 w-full flex-row">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex flex-col gap-2 w-full overflow-hidden">
                <div className="text-lg sm:text-xl font-medium flex items-center gap-2 sm:gap-3 whitespace-nowrap overflow-hidden text-ellipsis">
                  Travel Insurance
                  <span className="text-[8px] sm:text-[10px] px-2 sm:px-3 py-1 bg-green-500/20 text-green-400 font-bold tracking-wider uppercase rounded-full shrink-0">
                    Recommended
                  </span>
                </div>
                <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed max-w-sm">
                  Comprehensive coverage including trip cancellation, medical
                  emergencies, and luggage loss.
                </p>
                <div className="flex gap-3 sm:gap-4 mt-2">
                  <Link
                    className="text-[10px] sm:text-xs font-medium text-[var(--accent-primary)] hover:text-[var(--text-main)] transition hover:underline"
                    href="/travel"
                  >
                    Up to $50,000 Cover
                  </Link>
                  <Link
                    className="text-[10px] sm:text-xs font-medium text-[var(--accent-primary)] hover:text-[var(--text-main)] transition hover:underline"
                    href="/travel"
                  >
                    24/7 Support
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 w-full lg:w-[200px] bg-[var(--glass-bg)] rounded-2xl p-4 sm:p-6 border border-[var(--glass-border)]">
              <div className="text-2xl sm:text-3xl font-bold text-[var(--text-main)]">
                $29.00
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1 sm:mt-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="sr-only peer"
                />
                <div
                  className="w-12 h-6 sm:w-14 sm:h-7 bg-[var(--glass-bg)] rounded-full peer 
                  peer-focus:outline-none 
                  peer-checked:bg-green-500 
                  after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                  after:bg-white after:border after:rounded-full 
                  after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 after:transition-all 
                  peer-checked:after:translate-x-[24px] sm:peer-checked:after:translate-x-[28px] after:border-white"
                ></div>
              </label>
              <div className="text-xs sm:text-sm font-medium text-green-400 mt-1">
                Included
              </div>
            </div>
          </div>
        </section>

        {/* Right: Booking Summary */}
        <aside className="w-full xl:w-[420px] shrink-0 bg-[var(--surface-color)] p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] h-fit border border-[var(--glass-border)] shadow-2xl">
          <h2 className="text-xl sm:text-2xl font-medium mb-6">
            Booking Summary
          </h2>

          <div className="flex justify-between items-center py-2 sm:py-3 text-[var(--text-muted)]">
            <span>Base Fare</span>
            <span className="text-[var(--text-main)] font-medium">
              ${basePrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 text-[var(--text-muted)]">
            <span>Taxes &amp; Fees</span>
            <span className="text-[var(--text-main)] font-medium">
              ${taxes.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 text-[var(--text-muted)]">
            <span>Extra Baggage</span>
            <span className="text-[var(--text-main)] font-medium">$0.00</span>
          </div>
          <div className="flex justify-between items-center py-3 text-[var(--text-muted)]">
            <span>Travel Insurance</span>
            <span className="text-[var(--text-main)] font-medium">$29.00</span>
          </div>

          <div className="h-px bg-[var(--glass-bg)] my-6"></div>

          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <span className="text-lg sm:text-xl text-[var(--text-muted)]">
              Total Price
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[var(--accent-primary)]">
              ${(totalPrice + 29).toFixed(2)}
            </span>
          </div>

          <Link
            href="/travel/pick-a-seat"
            className="w-full py-3 sm:py-4 bg-[var(--accent-primary)] text-[var(--text-main)] rounded-full font-medium text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 hover:scale-105 hover:bg-[var(--accent-secondary)] hover:shadow-[var(--glow-primary)] transition-transform"
          >
            <span>Continue to Seats</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>

          <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-[var(--text-muted)]">
            By continuing, you agree to our{" "}
            <Link
              className="text-[var(--accent-primary)] hover:text-[var(--text-main)] transition"
              href="/travel"
            >
              Terms &amp; Conditions
            </Link>
          </p>
        </aside>
      </main>
    </div>
  );
}
