"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProgressBar from "../components/ProgressBar";
import { Check, ChevronRight } from "lucide-react";
import { useSearchStore } from "@/utils/states/useSearchStore";

export default function Page() {
  const { selectedOffer, setPassengerDetails } = useSearchStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("male");
  const [nationality, setNationality] = useState("us");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load from sessionStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("passengerDetails");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const p = parsed[0] || {};
          setFirstName(p.firstName || "");
          setLastName(p.lastName || "");
          setDob(p.dateOfBirth || "");
          setGender(p.gender || "male");
          setNationality(p.nationality?.toLowerCase() || "us");
          setPassportNumber(p.passportNumber || "");
          setPassportExpiry(p.passportExpiry || "");
          setEmail(p.email || "");
          setPhone(p.phone || "");
        } catch (e) {
          console.error("Failed to load passenger details:", e);
        }
      }
    }
  }, []);

  // Compute values from selectedOffer
  const basePrice = selectedOffer
    ? Math.round(parseFloat(selectedOffer.total_amount) * 0.85)
    : 850;
  const taxes = selectedOffer
    ? Math.round(parseFloat(selectedOffer.total_amount) * 0.15)
    : 120;
  const totalPrice = selectedOffer
    ? Math.round(parseFloat(selectedOffer.total_amount))
    : 970;

  const outboundSlice = selectedOffer?.slices?.[0];
  const originCode = outboundSlice?.segments?.[0]?.origin?.iata_code || "JFK";
  const destCode =
    outboundSlice?.segments?.[outboundSlice.segments.length - 1]?.destination
      ?.iata_code || "HND";

  let departureDateStr = "Wed, 24 Oct · 10:45 AM";
  if (outboundSlice?.segments?.[0]?.departing_at) {
    try {
      const d = new Date(outboundSlice.segments[0].departing_at);
      departureDateStr = d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {}
  }

  const cabinClass = outboundSlice?.segments?.[0]?.cabin_class || "economy";
  const cabinClassLabel =
    cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1).replace("_", " ");

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !dob.trim() ||
      !email.trim() ||
      !phone.trim()
    ) {
      setErrorMsg(
        "Please fill in all required fields (First name, Last name, Date of birth, Email, and Phone number).",
      );
      return;
    }

    const passengerId = selectedOffer?.passengers?.[0]?.id || "pas_mock_1";
    const title = gender === "male" ? "mr" : gender === "female" ? "ms" : "mx";

    // Normalize date format to YYYY-MM-DD
    let formattedDob = dob.trim();
    if (formattedDob.includes("/")) {
      const parts = formattedDob.split("/");
      if (parts.length === 3) {
        formattedDob = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
      }
    }

    let formattedExpiry = passportExpiry.trim();
    if (formattedExpiry.includes("/")) {
      const parts = formattedExpiry.split("/");
      if (parts.length === 3) {
        formattedExpiry = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
      }
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    const details = {
      id: passengerId,
      title,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: formattedDob,
      gender,
      nationality: nationality.toUpperCase(),
      email: email.trim(),
      phone: phone.trim(),
      passportNumber: passportNumber.trim() || "A12345678",
      passportExpiry: formattedExpiry || "2030-01-01",
    };

    setPassengerDetails([details]);
    window.location.href = "/travel/flight-add-on";
  };

  return (
    <div className="relative w-full max-w-[1728px] mx-auto min-h-screen overflow-hidden text-[var(--text-main)] bg-[var(--bg-app)]">
      {/* Hero Background */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-[radial-gradient(ellipse_at_top,var(--accent-primary)_0%,transparent_70%)] -z-10"></div>

      {/* Step Progress Bar */}
      <ProgressBar currentStep={1} />

      {/* Main Header */}
      <div className="px-4 sm:px-6 lg:px-[180px] relative z-10 w-full pb-4">
        <h1 className="text-2xl sm:text-3xl font-medium mb-2">
          Passenger Information
        </h1>
        <p className="text-[var(--text-muted)] text-sm sm:text-base">
          Please provide details for all travelers.
        </p>
      </div>

      <main className="flex flex-col xl:flex-row gap-6 sm:gap-8 px-4 sm:px-6 lg:px-[180px] pb-24 relative z-10 w-full">
        {/* Left: Passenger Form */}
        <section className="flex-[2] w-full">
          <div className="bg-[var(--surface-color)] rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 lg:p-10 border border-[var(--glass-border)] shadow-2xl">
            <div className="flex items-center gap-3 sm:gap-4 border-b border-[var(--glass-border)] pb-5 sm:pb-6 mb-6 sm:mb-8">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center shrink-0 shadow-inner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                    fill="var(--accent-primary)"
                  />
                </svg>
              </div>
              <div>
                <div className="text-xl font-medium text-[var(--text-main)] mb-1">
                  Passenger 1 (Adult)
                </div>
                <div className="text-sm text-[var(--text-muted)]">
                  Primary traveler and booking owner
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <form className="flex flex-col gap-6" onSubmit={handleContinue}>
              <div className="flex flex-col md:flex-row gap-6 w-full">
                <div className="flex flex-col gap-2 flex-1 relative group">
                  <label className="text-sm text-[var(--text-main)] font-medium ml-1">
                    Given Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl px-5 py-3.5 text-[var(--text-main)] placeholder-[var(--text-muted)]/30 focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all font-medium"
                    placeholder="E.g. Jonathan"
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1 relative group">
                  <label className="text-sm text-[var(--text-main)] font-medium ml-1">
                    Family Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl px-5 py-3.5 text-[var(--text-main)] placeholder-[var(--text-muted)]/30 focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all font-medium"
                    placeholder="E.g. Koiman"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 w-full">
                <div className="flex flex-col gap-2 flex-1 relative group">
                  <label className="text-sm text-[var(--text-main)] font-medium ml-1">
                    Date of Birth *
                  </label>
                  <input
                    type="text"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl px-5 py-3.5 text-[var(--text-main)] placeholder-[var(--text-muted)]/30 focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all font-medium"
                    placeholder="YYYY-MM-DD or MM/DD/YYYY"
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1 relative group">
                  <label className="text-sm text-[var(--text-main)] font-medium ml-1">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl px-5 py-3.5 text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all appearance-none cursor-pointer font-medium"
                    >
                      <option value="male" className="bg-[var(--surface-color)] text-[var(--text-main)] font-semibold">Male</option>
                      <option value="female" className="bg-[var(--surface-color)] text-[var(--text-main)] font-semibold">Female</option>
                      <option value="other" className="bg-[var(--surface-color)] text-[var(--text-main)] font-semibold">Other</option>
                    </select>
                    <svg
                      className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none"
                      width="12"
                      height="8"
                      viewBox="0 0 12 8"
                      fill="none"
                    >
                      <path
                        d="M1 1.5L6 6.5L11 1.5"
                        stroke="var(--text-muted)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 w-full">
                <div className="flex flex-col gap-2 flex-1 relative group">
                  <label className="text-sm text-[var(--text-main)] font-medium ml-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl px-5 py-3.5 text-[var(--text-main)] placeholder-[var(--text-muted)]/30 focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all font-medium"
                    placeholder="E.g. jonathan@gmail.com"
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1 relative group">
                  <label className="text-sm text-[var(--text-main)] font-medium ml-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl px-5 py-3.5 text-[var(--text-main)] placeholder-[var(--text-muted)]/30 focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all font-medium"
                    placeholder="E.g. +15550101"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-6 w-full">
                <div className="flex flex-col gap-2 w-full relative group">
                  <label className="text-sm text-[var(--text-main)] font-medium ml-1">
                    Nationality
                  </label>
                  <div className="relative">
                    <select
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl px-5 py-3.5 text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all appearance-none cursor-pointer font-medium"
                    >
                      <option value="us" className="bg-[var(--surface-color)] text-[var(--text-main)] font-semibold">United States</option>
                      <option value="uk" className="bg-[var(--surface-color)] text-[var(--text-main)] font-semibold">United Kingdom</option>
                      <option value="ca" className="bg-[var(--surface-color)] text-[var(--text-main)] font-semibold">Canada</option>
                      <option value="jp" className="bg-[var(--surface-color)] text-[var(--text-main)] font-semibold">Japan</option>
                    </select>
                    <svg
                      className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none"
                      width="12"
                      height="8"
                      viewBox="0 0 12 8"
                      fill="none"
                    >
                      <path
                        d="M1 1.5L6 6.5L11 1.5"
                        stroke="var(--text-muted)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 w-full">
                <div className="flex flex-col gap-2 flex-1 relative group">
                  <label className="text-sm text-[var(--text-main)] font-medium ml-1">
                    Passport Number
                  </label>
                  <input
                    type="text"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl px-5 py-3.5 text-[var(--text-main)] placeholder-[var(--text-muted)]/30 focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all font-medium"
                    placeholder="E.g. A12345678"
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1 relative group">
                  <label className="text-sm text-[var(--text-main)] font-medium ml-1">
                    Passport Expiry Date
                  </label>
                  <input
                    type="text"
                    value={passportExpiry}
                    onChange={(e) => setPassportExpiry(e.target.value)}
                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl px-5 py-3.5 text-[var(--text-main)] placeholder-[var(--text-muted)]/30 focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all font-medium"
                    placeholder="YYYY-MM-DD or MM/DD/YYYY"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[var(--text-main)] font-semibold rounded-full flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Continue to Add-ons</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Right: Booking Summary */}
        <aside className="w-full xl:w-[420px] shrink-0 bg-[var(--surface-color)] p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] h-fit border border-[var(--glass-border)] shadow-2xl">
          <h2 className="text-xl sm:text-2xl font-medium mb-6 sm:mb-8 text-[var(--text-main)]">
            Booking Summary
          </h2>

          {/* Flight Route Mini-card */}
          <div className="flex items-center gap-4 sm:gap-6 bg-[var(--glass-bg)] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--glass-border)] mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--accent-primary)]/10 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
                  fill="var(--accent-primary)"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-xl tracking-wider text-[var(--text-main)]">
                  {originCode}
                </span>
                <span className="text-[var(--accent-primary)] font-bold">
                  &rarr;
                </span>
                <span className="font-bold text-xl tracking-wider text-[var(--text-main)]">
                  {destCode}
                </span>
              </div>
              <div className="text-sm text-[var(--text-muted)]">
                {departureDateStr}
              </div>
            </div>
          </div>

          <div className="px-4 py-1.5 bg-[var(--accent-primary)]/5 text-[var(--accent-primary)] text-xs font-bold uppercase tracking-wider rounded-full w-max mb-8 border border-[var(--accent-primary)]/20">
            {cabinClassLabel}
          </div>

          <div className="flex justify-between items-center py-3 text-[var(--text-muted)]">
            <span>Base Fare</span>
            <span className="text-[var(--text-main)] font-normal">
              ${basePrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 text-[var(--text-muted)]">
            <span>Taxes &amp; Fees</span>
            <span className="text-[var(--text-main)] font-normal">
              ${taxes.toFixed(2)}
            </span>
          </div>

          <div className="h-px bg-[var(--glass-bg)] my-6"></div>

          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <div className="text-lg sm:text-xl text-[var(--text-muted)]">
              Total Price
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl sm:text-3xl font-bold text-[var(--accent-primary)]">
                ${totalPrice.toFixed(2)}
              </span>
              <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                Inc. VAT
              </span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
