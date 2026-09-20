"use client";
import Image from "next/image";
import Link from "next/link";

export default function CarRentalProtectionPage() {
  const handleContinue = () => {
    console.log("Continue to book clicked.");
  };

  return (
    <div className="relative w-full max-w-[1728px] mx-auto min-h-screen overflow-hidden text-[var(--text-main)]">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between py-6 px-6 lg:py-8 lg:px-[180px] relative z-10 bg-[var(--glass-bg)] border-b border-[var(--glass-border)] backdrop-blur-xl shadow-lg">
        <div className="font-bold text-2xl hover:text-[var(--accent-primary)] transition">
          FlyDnA
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link
            className="px-5 py-2 text-[var(--text-main)] bg-[var(--glass-bg)] rounded-full border border-[var(--glass-border)] shadow-md"
            href="/travel"
          >
            Home
          </Link>
          <Link
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            href="/travel"
          >
            About Us
          </Link>
          <Link
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            href="/travel"
          >
            Profile
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[var(--glass-bg)] transition cursor-pointer border border-transparent hover:border-[var(--glass-border)]">
            <Image
              className="w-7 h-7 rounded-full object-cover"
              src="https://flagcdn.com/w40/us.png"
              alt="US"
              width="28"
              height="28"
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
          <Link
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
          </Link>
        </div>
      </nav>

      {/* Hero Background */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(124,94,254,0.15)_0%,transparent_70%)] -z-10"></div>

      {/* Tab Switcher (Flight / Hotel / Car) */}
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
              <div className="flex items-center gap-4 p-5 bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-2xl hover:border-[var(--accent-primary)] transition cursor-pointer">
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
                <span className="font-medium text-[var(--text-main)] truncate">
                  Dubai International Airport
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
                  <div className="flex items-center gap-4 p-5 bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-2xl hover:border-[var(--accent-primary)] transition cursor-pointer">
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
                    <span className="font-medium text-[var(--text-main)] whitespace-nowrap truncate">
                      Tue, Mar 17
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 flex-1 w-full">
                  <span className="text-lg text-[var(--text-main)]">Time</span>
                  <div className="flex items-center gap-4 p-5 bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-2xl hover:border-[var(--accent-primary)] transition cursor-pointer">
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
                    <span className="font-medium text-[var(--text-main)] whitespace-nowrap">
                      2:00
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
                  <div className="flex items-center gap-4 p-5 bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-2xl hover:border-[var(--accent-primary)] transition cursor-pointer">
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
                    <span className="font-medium text-[var(--text-main)] whitespace-nowrap truncate">
                      Thu, Mar 19
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 flex-1 w-full">
                  <span className="text-lg text-[var(--text-main)]">Time</span>
                  <div className="flex items-center gap-4 p-5 bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-2xl hover:border-[var(--accent-primary)] transition cursor-pointer">
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
                    <span className="font-medium text-[var(--text-main)] whitespace-nowrap">
                      1:30
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Button */}
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
        {/* Left: Protection Comparison Table */}
        <section className="flex-[2] overflow-x-auto">
          <h1 className="text-3xl font-medium mb-6">Protection options</h1>

          <div className="bg-[var(--surface-color)] rounded-[20px] overflow-x-auto w-full border border-[var(--glass-border)] shrink-0 min-w-min shadow-lg">
            {/* Header Row */}
            <div className="flex bg-[var(--glass-bg)] font-bold min-w-[600px] text-lg lg:text-2xl border-b border-[var(--glass-border)]">
              <div className="flex-[1.5] text-[var(--text-main)] font-medium p-6 flex items-center border-r border-[var(--glass-border)]">
                Coverage
              </div>
              <div className="flex-1 text-[var(--text-main)] font-medium p-6 flex items-center border-r border-[var(--glass-border)]">
                Basic Protection
              </div>
              <div className="flex-1 text-[var(--accent-primary)] font-medium p-6 flex items-center">
                Full Protection
              </div>
            </div>

            {/* Theft of car */}
            <div className="flex border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition min-w-[600px] text-lg lg:text-xl">
              <div className="flex-[1.5] text-[var(--text-main)] p-6 flex items-center border-r border-[var(--glass-border)]">
                Theft of car
              </div>
              <div className="flex-1 text-[var(--text-muted)] p-6 flex items-center border-r border-[var(--glass-border)]">
                Excess applies
              </div>
              <div className="flex-1 text-[var(--text-muted)] p-6 flex items-center">
                Refund of excess
              </div>
            </div>

            {/* Bodywork damage */}
            <div className="flex border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition min-w-[600px] text-lg lg:text-xl">
              <div className="flex-[1.5] text-[var(--text-main)] p-6 flex items-center border-r border-[var(--glass-border)]">
                Bodywork damage
              </div>
              <div className="flex-1 text-[var(--text-muted)] p-6 flex items-center border-r border-[var(--glass-border)]">
                Excess applies
              </div>
              <div className="flex-1 text-[var(--text-muted)] p-6 flex items-center">
                Refund of excess
              </div>
            </div>

            {/* Other damage */}
            <div className="flex border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition min-w-[600px] text-lg lg:text-xl">
              <div className="flex-[1.5] text-[var(--text-main)] p-6 flex items-center border-r border-[var(--glass-border)]">
                Other damage
              </div>
              <div className="flex-1 text-[var(--text-muted)] p-6 flex items-center border-r border-[var(--glass-border)]">
                Not included
              </div>
              <div className="flex-1 text-[var(--text-muted)] p-6 flex items-center">
                Covered
              </div>
            </div>

            {/* Breakdown & towing */}
            <div className="flex border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition min-w-[600px] text-lg lg:text-xl">
              <div className="flex-[1.5] text-[var(--text-main)] p-6 flex items-center border-r border-[var(--glass-border)]">
                Breakdown &amp; towing
              </div>
              <div className="flex-1 text-[var(--text-muted)] p-6 flex items-center border-r border-[var(--glass-border)]">
                Not included
              </div>
              <div className="flex-1 text-[var(--text-muted)] p-6 flex items-center">
                Covered
              </div>
            </div>

            {/* Third-party liability */}
            <div className="flex hover:bg-[var(--glass-bg)] transition min-w-[600px] text-lg lg:text-xl">
              <div className="flex-[1.5] text-[var(--text-main)] p-6 flex items-center border-r border-[var(--glass-border)]">
                Third-party liability
              </div>
              <div className="flex-1 text-[var(--text-muted)] p-6 flex items-center border-r border-[var(--glass-border)]">
                Included
              </div>
              <div className="flex-1 text-[var(--text-muted)] p-6 flex items-center">
                Covered
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="w-full xl:w-[411px] shrink-0 flex flex-col gap-6">
          {/* Pick-up and Drop-off Card */}
          <div className="p-8 bg-[var(--surface-color)] rounded-3xl hover:-translate-y-1 transition shadow-lg border border-[var(--glass-border)]">
            <h2 className="text-2xl font-medium mb-6">Pick-up and drop-off</h2>
            <div className="flex gap-6">
              <div className="flex flex-col items-center w-6 shrink-0 pt-1">
                <div className="w-6 h-6 rounded-full border-4 border-[var(--glass-border)] shrink-0"></div>
                <div className="w-[2px] min-h-[80px] border-l-2 border-dashed border-[var(--glass-border)] flex-1 my-1"></div>
                <div className="w-6 h-6 rounded-full border-4 border-[var(--glass-border)] shrink-0"></div>
              </div>
              <div className="flex flex-col gap-8 flex-1">
                <div className="flex flex-col gap-1">
                  <div className="text-[var(--text-muted)] text-lg">
                    17 Mar 2026 – 2:00 AM
                  </div>
                  <div className="text-[var(--text-muted)] text-lg">
                    Dubai International Airport
                  </div>
                  <Link
                    className="text-[var(--accent-primary)] underline hover:text-[var(--text-main)] mt-1 transition w-max text-lg"
                    href="/travel"
                  >
                    View pick-up instructions
                  </Link>
                </div>
                <div className="flex flex-col gap-1 mt-auto">
                  <div className="text-[var(--text-muted)] text-lg">
                    19 Mar 2026 - 1:30 AM
                  </div>
                  <div className="text-[var(--text-muted)] text-lg">
                    Dubai International Airport
                  </div>
                  <Link
                    className="text-[var(--accent-primary)] underline hover:text-[var(--text-main)] mt-1 transition w-max text-lg"
                    href="/travel"
                  >
                    View drop-off instructions
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Price Breakdown Card */}
          <div className="p-8 bg-[var(--surface-color)] rounded-3xl shrink-0 h-fit shadow-lg border border-[var(--glass-border)]">
            <h2 className="text-2xl font-medium mb-6">Car price breakdown</h2>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className="text-[var(--text-muted)] text-lg">
                  Car rental (2 days)
                </span>
                <div className="text-right">
                  <div className="text-[var(--text-muted)] text-lg">$50.00</div>
                  <div className="text-[var(--text-muted)] text-lg">
                    Rs. 4,566.75
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-start text-green-400">
                <span className="text-green-400 text-lg">
                  15% Off Car rental price
                </span>
                <div className="text-right">
                  <div className="text-green-400 text-lg">-Rs. 685.01</div>
                </div>
              </div>
            </div>

            <div className="h-px bg-[var(--glass-bg)] my-6"></div>

            <div className="flex justify-between items-center">
              <span className="text-xl text-[var(--text-muted)]">Total</span>
              <div className="text-3xl font-bold text-[var(--accent-primary)]">
                $ 42.66
              </div>
            </div>
          </div>

          <Link
            href="/travel/payment"
            onClick={handleContinue}
            className="w-full py-4 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full font-medium text-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-[0_4px_16px_rgba(124,94,254,0.4)] text-[var(--text-main)] mt-2"
          >
            Continue to book
          </Link>
        </aside>
      </main>
    </div>
  );
}
