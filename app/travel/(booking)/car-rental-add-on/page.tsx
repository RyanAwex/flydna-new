"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [rentalData, setRentalData] = useState({
    rental: {
      pickupLocation: "Dubai International Airport",
      pickupDate: "Tue, Mar 17",
      pickupTime: "2:00",
      dropoffDate: "Thu, Mar 19",
      dropoffTime: "1:30",
    },
    pricing: {
      rentalDays: 2,
      basePriceUsd: 50.0,
      basePriceLocal: 4566.75,
      discountPercent: 15,
      discountAmountLocal: 685.01,
      totalUsd: 42.66,
    },
  });

  const [counts, setCounts] = useState({
    additionalDriver: 0,
    childSeat: 0,
    infantSeat: 0,
    boosterSeat: 0,
  });

  useEffect(() => {
    fetch("car_rental_data.json")
      .then((res) => res.json())
      .then((data) => {
        setRentalData(data);
      })
      .catch((err) => {
        console.warn(
          "Could not load car_rental_data.json — using default values.",
        );
      });
  }, []);

  const handleCounter = (
    key: keyof typeof counts,
    action: "increase" | "decrease",
  ) => {
    setCounts((prev) => {
      const current = prev[key];
      const nextValue =
        action === "increase" ? current + 1 : Math.max(0, current - 1);
      return { ...prev, [key]: nextValue };
    });
  };

  const handleBook = () => {
    console.log("Continue to book clicked. Current add-ons:", counts);
  };

  return (
    <div className="relative w-full max-w-[1728px] mx-auto min-h-screen overflow-hidden text-[var(--text-main)]">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between py-6 px-6 lg:py-8 lg:px-[180px] relative z-10 bg-[var(--glass-bg)] border-b border-[var(--glass-border)] backdrop-blur-xl shadow-lg">
        <div className="font-bold text-2xl hover:text-[var(--accent-primary)] transition">
          FlyDnA
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a
            className="px-5 py-2 text-[var(--text-main)] bg-[var(--glass-bg)] rounded-full border border-[var(--glass-border)] shadow-md"
            href="/travel"
          >
            Home
          </a>
          <a
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            href="/travel"
          >
            About Us
          </a>
          <a
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            href="/travel"
          >
            Profile
          </a>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[var(--glass-bg)] transition cursor-pointer border border-transparent hover:border-[var(--glass-border)]">
            <img
              className="w-7 h-7 rounded-full object-cover"
              src="https://flagcdn.com/w40/us.png"
              alt="US"
              width={28}
              height={28}
            />
            <span>USD</span>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <a
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full font-medium hover:from-[var(--accent-secondary)] hover:to-[var(--accent-secondary)] transition-all shadow-lg hover:shadow-[var(--glow-primary)]"
            href="/travel"
          >
            <span>Contact Us</span>
            <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-black">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path
                  d="M1 4H11M11 4L7 1M11 4L7 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </a>
        </div>
      </nav>

      {/* Hero Background */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(124,94,254,0.15)_0%,transparent_70%)] -z-10"></div>

      {/* Tab Switcher */}
      <div className="flex justify-center p-8 relative z-10 w-full overflow-x-auto">
        <div className="flex gap-2 p-2 bg-[var(--surface-color)] rounded-full border border-[var(--glass-border)] min-w-max">
          <button className="flex items-center gap-2 px-8 py-3 text-[var(--text-muted)] rounded-full hover:bg-[var(--glass-bg)] transition font-medium">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path
                d="M2.5 19.5L4.5 17M4.5 17L9.5 12L13 15.5L21.5 4.5M4.5 17H10M4.5 17V11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Flight
          </button>
          <button className="flex items-center gap-2 px-8 py-3 text-[var(--text-muted)] rounded-full hover:bg-[var(--glass-bg)] transition font-medium">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path
                d="M3 21H21M4 21V7L12 3L20 7V21M9 21V15H15V21M9 10H9.01M15 10H15.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Hotel
          </button>
          <button className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-[var(--text-main)] rounded-full shadow-md font-medium">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path
                d="M3 12H6L8 8H16L18 12H21M21 12V17M3 12V17M3 17H21M3 17V19M21 17V19M7 17H7.01M17 17H17.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Car
          </button>
        </div>
      </div>

      {/* Search Card */}
      <div className="relative mx-6 lg:mx-[180px] p-8 bg-[var(--surface-color)] rounded-[32px] border border-[var(--glass-border)] mb-12 z-20 shadow-2xl overflow-hidden group">
        <div className="absolute -left-20 bottom-0 w-52 h-20 bg-[var(--accent-primary)]/20 blur-[50px] rotate-[-45deg] pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
        <div className="absolute -right-20 top-1/2 w-60 h-20 bg-[var(--accent-primary)]/20 blur-[50px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>

        <div className="relative z-10 flex flex-col xl:flex-row items-center xl:items-end gap-8">
          <div className="flex-1 flex flex-col xl:flex-row gap-6 w-full">
            {/* Pick-up Location */}
            <div className="flex flex-col gap-3 flex-1 xl:flex-[1.2]">
              <span className="text-lg text-[var(--text-main)]">
                Pick-up location
              </span>
              <div className="flex items-center gap-4 p-5 bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-2xl hover:border-purple-400 transition cursor-pointer">
                <div className="w-12 h-12 bg-[var(--surface-color)] rounded-full flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M16.5 16.5L21 21"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span
                  className="font-medium text-[var(--text-main)] truncate"
                  id="pickupLocation"
                >
                  {rentalData.rental.pickupLocation}
                </span>
              </div>
            </div>

            {/* Pick-up Date & Time */}
            <div className="flex flex-col sm:flex-row gap-6 flex-[2] w-full">
              <div className="flex flex-col sm:flex-row gap-6 flex-1 w-full">
                <div className="flex flex-col gap-3 flex-1 w-full">
                  <span className="text-lg text-[var(--text-main)]">
                    Pick-up date
                  </span>
                  <div className="flex items-center gap-4 p-5 bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-2xl hover:border-purple-400 transition cursor-pointer">
                    <div className="w-12 h-12 bg-[var(--surface-color)] rounded-full flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          stroke="white"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M3 10H21M8 2V6M16 2V6"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <span
                      className="font-medium text-[var(--text-main)] whitespace-nowrap truncate"
                      id="pickupDate"
                    >
                      {rentalData.rental.pickupDate}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 flex-1 w-full">
                  <span className="text-lg text-[var(--text-main)]">Time</span>
                  <div className="flex items-center gap-4 p-5 bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-2xl hover:border-purple-400 transition cursor-pointer">
                    <div className="w-12 h-12 bg-[var(--surface-color)] rounded-full flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="white"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M12 7V12L15 15"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <span
                      className="font-medium text-[var(--text-main)] whitespace-nowrap"
                      id="pickupTime"
                    >
                      {rentalData.rental.pickupTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Drop-off Date & Time */}
              <div className="flex flex-col sm:flex-row gap-6 flex-1 w-full">
                <div className="flex flex-col gap-3 flex-1 w-full">
                  <span className="text-lg text-[var(--text-main)]">
                    Drop-off date
                  </span>
                  <div className="flex items-center gap-4 p-5 bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-2xl hover:border-purple-400 transition cursor-pointer">
                    <div className="w-12 h-12 bg-[var(--surface-color)] rounded-full flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          stroke="white"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M3 10H21M8 2V6M16 2V6"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <span
                      className="font-medium text-[var(--text-main)] whitespace-nowrap truncate"
                      id="dropoffDate"
                    >
                      {rentalData.rental.dropoffDate}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 flex-1 w-full">
                  <span className="text-lg text-[var(--text-main)]">Time</span>
                  <div className="flex items-center gap-4 p-5 bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-2xl hover:border-purple-400 transition cursor-pointer">
                    <div className="w-12 h-12 bg-[var(--surface-color)] rounded-full flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="white"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M12 7V12L15 15"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <span
                      className="font-medium text-[var(--text-main)] whitespace-nowrap"
                      id="dropoffTime"
                    >
                      {rentalData.rental.dropoffTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button className="px-12 py-[22px] bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full font-medium text-xl hover:scale-105 transition shadow-[0_4px_16px_rgba(124,94,254,0.4)] shrink-0 flex gap-2 items-center w-full xl:w-max justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 shrink-0">
              <path
                d="M16.5 3.5L20.5 7.5M2 22L5.5 21L20.5 6L18 3.5L3 18.5L2 22Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Edit
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex flex-col xl:flex-row gap-8 px-6 lg:px-[180px] pb-24 relative z-10 w-full">
        {/* Left: Add-ons List */}
        <section className="flex-[2]">
          <h1 className="text-3xl font-medium mb-8">
            Add extras, complete your trip
          </h1>

          {[
            {
              id: "additionalDriver",
              title: "Additional driver",
              desc: "if you also want other people to drive",
            },
            {
              id: "childSeat",
              title: "Child seat",
              desc: "For children (1–3 yrs)",
            },
            {
              id: "infantSeat",
              title: "Infant Seat",
              desc: "For babies (up to 1 yr)",
            },
            {
              id: "boosterSeat",
              title: "Booster Seat",
              desc: "For biggest children (4–11 yrs)",
            },
          ].map((addon) => (
            <div
              key={addon.id}
              className="flex justify-between items-center p-6 mb-6 rounded-3xl bg-[var(--surface-color)] border border-[var(--glass-border)] hover:border-purple-500/50 hover:shadow-2xl transition"
            >
              <div className="flex flex-col gap-2">
                <div className="text-xl font-medium">{addon.title}</div>
                <div className="text-[var(--accent-primary)] font-medium">
                  $22 each per rental
                </div>
                <p className="text-[var(--text-muted)] text-sm">{addon.desc}</p>
              </div>
              <div className="flex items-center gap-4 bg-[var(--glass-bg)] rounded-full p-2 border border-[var(--glass-border)] shadow-inner">
                <button
                  className="w-10 h-10 rounded-full bg-[var(--glass-bg)] flex items-center justify-center hover:bg-[var(--glass-bg)] transition"
                  onClick={() =>
                    handleCounter(addon.id as keyof typeof counts, "decrease")
                  }
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                    <path
                      d="M6 12H18"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <span
                  className={`text-xl font-bold w-6 text-center ${counts[addon.id as keyof typeof counts] === 0 ? "text-[var(--text-muted)]" : "text-[var(--text-main)]"}`}
                >
                  {counts[addon.id as keyof typeof counts]}
                </span>
                <button
                  className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center hover:bg-[var(--accent-primary)]/40 transition"
                  onClick={() =>
                    handleCounter(addon.id as keyof typeof counts, "increase")
                  }
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                    <path
                      d="M12 6V18M6 12H18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Right: Price Breakdown */}
        <aside className="p-8 bg-[var(--surface-color)] rounded-3xl shrink-0 h-fit shadow-lg border border-[var(--glass-border)] w-full xl:w-[400px]">
          <h2 className="text-2xl font-medium mb-6">Car price breakdown</h2>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <span
                className="text-[var(--text-muted)] text-lg"
                id="rentalLabel"
              >
                Car rental ({rentalData.pricing.rentalDays} days)
              </span>
              <div className="text-right">
                <div
                  className="text-[var(--text-muted)] text-lg"
                  id="rentalPriceUsd"
                >
                  ${rentalData.pricing.basePriceUsd.toFixed(2)}
                </div>
                <div
                  className="text-[var(--text-muted)] text-lg"
                  id="rentalPriceLocal"
                >
                  Rs. {rentalData.pricing.basePriceLocal.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-start text-green-400">
              <span className="text-green-400 text-lg" id="discountLabel">
                {rentalData.pricing.discountPercent}% Off Car rental price
              </span>
              <div className="text-right">
                <div className="text-green-400 text-lg" id="discountAmount">
                  -Rs. {rentalData.pricing.discountAmountLocal.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-[var(--glass-bg)] my-6"></div>

          <div className="flex justify-between items-center mb-8">
            <span className="text-xl text-[var(--text-muted)]">Total</span>
            <div
              className="text-3xl font-bold text-[var(--accent-primary)]"
              id="totalPrice"
            >
              $ {rentalData.pricing.totalUsd.toFixed(2)}
            </div>
          </div>

          <Link
            href="/travel/car-rental-protection"
            className="w-full py-4 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full font-medium text-lg flex items-center justify-center gap-3 hover:scale-105 transition shadow-lg text-[var(--text-main)]"
            id="btnContinue"
            onClick={handleBook}
          >
            Continue to book
          </Link>
        </aside>
      </main>
    </div>
  );
}
