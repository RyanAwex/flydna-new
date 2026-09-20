"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProgressBar from "../components/ProgressBar";
import {
  Check,
  ChevronDown,
  ShieldCheck,
  CreditCard,
  Shield,
} from "lucide-react";
import Image from "next/image";
import { useSearchStore, getApiUrl } from "@/utils/states/useSearchStore";
import { checkAvaBalance } from "@/utils/web3/avaEngine";

export default function PaymentPage() {
  const { selectedOffer, passengerDetails, selectedSeat, selectedSeatPrice } =
    useSearchStore();

  const [paymentMethod, setPaymentMethod] = useState("credit-card"); // credit-card, e-wallet, ava, xrp, flydna-vault
  const [isBillingOpen, setIsBillingOpen] = useState(false);

  const [vaultBalances, setVaultBalances] = useState({ xrp: 1000, ava: 500 });
  const [vaultTokenSelected, setVaultTokenSelected] = useState<"xrp" | "ava">("xrp");

  const [linkedEvm, setLinkedEvm] = useState<string | null>(null);
  const [linkedXrp, setLinkedXrp] = useState<string | null>(null);

  useEffect(() => {
    const loadVaultBalances = () => {
      try {
        const stored = localStorage.getItem("flydna_vault_balances");
        if (stored) {
          setVaultBalances(JSON.parse(stored));
        } else {
          localStorage.setItem("flydna_vault_balances", JSON.stringify({ xrp: 1000.0, ava: 500.0 }));
        }
      } catch (err) {}
    };

    const loadLinkedWallets = () => {
      setLinkedEvm(localStorage.getItem("flydna_linked_evm_wallet"));
      setLinkedXrp(localStorage.getItem("flydna_linked_xrp_wallet"));
    };

    loadVaultBalances();
    loadLinkedWallets();
    window.addEventListener("flydna-vault-updated", loadVaultBalances);
    window.addEventListener("flydna-wallets-linked", loadLinkedWallets);
    return () => {
      window.removeEventListener("flydna-vault-updated", loadVaultBalances);
      window.removeEventListener("flydna-wallets-linked", loadLinkedWallets);
    };
  }, []);

  // Card form states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Web3 States
  const [xrpTxHash, setXrpTxHash] = useState("");
  const [xrpVerifying, setXrpVerifying] = useState(false);
  const [avaWalletAddress, setAvaWalletAddress] = useState("");
  const [avaBalance, setAvaBalance] = useState("0");
  const [checkingAva, setCheckingAva] = useState(false);

  const [checkoutEvent, setCheckoutEvent] = useState<any | null>(null);
  const [quoteSent, setQuoteSent] = useState(false);
  const [quoteRequestId, setQuoteRequestId] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("checkout_event");
      if (stored) {
        const ev = JSON.parse(stored);
        let booking: any = null;
        try { booking = JSON.parse(sessionStorage.getItem("checkout_event_booking") || "null"); } catch {}
        const qty = parseInt(sessionStorage.getItem("checkout_qty") || "", 10) || booking?.quantity || ev.quantity || 1;
        const priceMin = Number(ev.priceMin) > 0 ? Number(ev.priceMin) : (Number(booking?.event?.priceMin) > 0 ? Number(booking.event.priceMin) : ev.priceMin);
        setCheckoutEvent({ ...ev, priceMin, quantity: qty, seats: booking?.seats || ev.seats || [] });
      }
    } catch {}
  }, []);

  // Retrieve contact details from passengerDetails if available
  const primaryPassenger = passengerDetails?.[0] || {};
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (primaryPassenger.email) {
      setContactEmail(primaryPassenger.email);
    } else {
      try {
        const storedUser = localStorage.getItem("flydna_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.email) setContactEmail(parsed.email);
        }
      } catch {}
    }
    if (primaryPassenger.phone) {
      setContactPhone(primaryPassenger.phone);
    } else {
      try {
        const storedUser = localStorage.getItem("flydna_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.phone) setContactPhone(parsed.phone);
        }
      } catch {}
    }
  }, [primaryPassenger]);

  // Compute pricing
  // Rule 1: never charge an invented price. Events without a real priceMin cannot check out here.
  const eventHasRealPrice = !!(checkoutEvent && checkoutEvent.priceMin && Number(checkoutEvent.priceMin) > 0);
  const ticketQty = checkoutEvent ? Math.max(1, parseInt(String(checkoutEvent.quantity || 1)) || 1) : 1;
  const basePrice = checkoutEvent
    ? (eventHasRealPrice ? Math.round(Number(checkoutEvent.priceMin)) * ticketQty : 0)
    : (selectedOffer ? Math.round(parseFloat(selectedOffer.total_amount) * 0.85) : 850);
  const taxes = checkoutEvent
    ? Math.round(basePrice * 0.10)
    : (selectedOffer ? Math.round(parseFloat(selectedOffer.total_amount) * 0.15) : 120);
  const seatCost = checkoutEvent ? 0 : (selectedSeatPrice || 0);
  const insuranceCost = checkoutEvent ? 0 : 29; // Travel Insurance
  const subTotal = basePrice + taxes + seatCost + insuranceCost;
  const discount = (paymentMethod === "ava" || (paymentMethod === "flydna-vault" && vaultTokenSelected === "ava")) ? Math.round(subTotal * 0.05) : 0;
  const totalPrice = subTotal - discount;

  const requiredAmount = vaultTokenSelected === "xrp" ? totalPrice / 1.50 : totalPrice / 2.40;
  const currentTokenBalance = vaultTokenSelected === "xrp" ? vaultBalances.xrp : vaultBalances.ava;
  const isVaultBalanceSufficient = currentTokenBalance >= requiredAmount;

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");
    setIsProcessing(true);
    // Unpriced event (no public price feed): create a quote request in the order queue — no charge
    if (checkoutEvent && !eventHasRealPrice) {
      if (quoteSent) { setIsProcessing(false); return; }
      try {
        const token = localStorage.getItem("flydna_token");
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
        let addOns: any[] = []; let guests: any[] = [];
        try { addOns = JSON.parse(sessionStorage.getItem("checkout_addons") || "[]"); } catch {}
        try { guests = JSON.parse(sessionStorage.getItem("checkout_guests") || "[]"); } catch {}
        const res = await fetch(`${apiBase}/api/v1/payments/confirm-booking`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}`, "auth-token": token } : {}) },
          body: JSON.stringify({
            paymentIntentId: `quote_${Date.now()}`,
            passengerEmail: contactEmail,
            bookingData: { bookingType: "event", event: checkoutEvent, selectedSeats: checkoutEvent.seats || [], guests, addOns, quantity: ticketQty, pricing: { totalPrice: 0, currency: "USD" }, notes: "Quote requested — partner desk to price; member authorizes in-app before purchase" },
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) throw new Error(json.error || "Could not send request");
        setQuoteRequestId(json.bookingId || json.booking?.bookingId || json.data?.bookingId || "");
        setQuoteSent(true);
      } catch (err: any) {
        setCheckoutError(err?.message || "Could not send request");
      }
      setIsProcessing(false);
      return;
    }

    if (
      paymentMethod === "credit-card" &&
      (!cardNumber || !cardExpiry || !cardCvc || !cardName)
    ) {
      setCheckoutError("Please fill in your card details.");
      setIsProcessing(false);
      return;
    }

    if (paymentMethod === "xrp" && !xrpTxHash) {
      setCheckoutError("Please enter your XRP transaction hash.");
      setIsProcessing(false);
      return;
    }

    if (paymentMethod === "ava" && !avaWalletAddress) {
      setCheckoutError("Please enter your EVM Wallet address to verify AVA balance.");
      setIsProcessing(false);
      return;
    }

    if (paymentMethod === "flydna-vault") {
      if (!isVaultBalanceSufficient) {
        setCheckoutError(`Insufficient ${vaultTokenSelected.toUpperCase()} balance in FlyDnA Vault.`);
        setIsProcessing(false);
        return;
      }

      // Deduct from local storage vault balances
      const updatedBalances = {
        xrp: vaultTokenSelected === "xrp" ? vaultBalances.xrp - requiredAmount : vaultBalances.xrp,
        ava: vaultTokenSelected === "ava" ? vaultBalances.ava - requiredAmount : vaultBalances.ava,
      };
      localStorage.setItem("flydna_vault_balances", JSON.stringify(updatedBalances));
      setVaultBalances(updatedBalances);

      // Trigger change notification event for other tabs
      window.dispatchEvent(new Event("flydna-vault-updated"));
    }

    // Verify XRP transaction on the ledger first if selected
    if (paymentMethod === "xrp") {
      setXrpVerifying(true);
      try {
        const response = await fetch("/api/web3/verify-xrp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionHash: xrpTxHash,
            expectedAmount: (totalPrice / 1.50).toFixed(2), // simulated rate 1 XRP = $1.50
            destinationWallet: "rYourFlyDnaXrpCorporateWalletAddress",
          }),
        });
        const xrpData = await response.json();
        if (!xrpData.verified) {
          setCheckoutError(xrpData.message || "XRP payment verification failed.");
          setIsProcessing(false);
          setXrpVerifying(false);
          return;
        }
      } catch (err: any) {
        setCheckoutError(err.message || "XRP Verification service unreachable.");
        setIsProcessing(false);
        setXrpVerifying(false);
        return;
      } finally {
        setXrpVerifying(false);
      }
    }

    try {
      const apiUrl = getApiUrl();
      const seatServiceString = sessionStorage.getItem("selectedSeatService");
      const seatService = seatServiceString
        ? JSON.parse(seatServiceString)
        : null;

      const outboundSlice = selectedOffer?.slices?.[0];
      const originCode =
        outboundSlice?.segments?.[0]?.origin?.iata_code || "JFK";
      const destCode =
        outboundSlice?.segments?.[outboundSlice.segments.length - 1]
          ?.destination?.iata_code || "HND";
      const carrierName =
        outboundSlice?.segments?.[0]?.operating_carrier?.name || "Carrier";

      const bookingData = checkoutEvent
        ? {
            bookingType: "event",
            offerId: `event_${checkoutEvent.id || Date.now()}`,
            event: {
              name: checkoutEvent.name,
              venue: checkoutEvent.venue,
              city: checkoutEvent.city,
              date: checkoutEvent.date,
              time: checkoutEvent.time,
              ticketUrl: checkoutEvent.url,
            },
            passengers: [
              {
                id: "pas_mock_1",
                title: "mr",
                firstName: cardName.split(" ")[0] || "Guest",
                lastName: cardName.split(" ").slice(1).join(" ") || "",
                dateOfBirth: "1990-01-01",
                nationality: "US",
                email: contactEmail || "test@example.com",
                phone: contactPhone || "+15555555",
              },
            ],
            pricing: {
              baseFare: basePrice,
              addOnsCost: 0,
              seatsCost: 0,
              taxesFees: taxes,
              totalPrice: totalPrice,
              currency: "USD",
            },
          }
        : {
            bookingType: "flight",
            offerId: selectedOffer?.id || `mock_${Date.now()}`,
            passengers: passengerDetails || [
              {
                id: "pas_mock_1",
                title: "mr",
                firstName: "John",
                lastName: "Doe",
                dateOfBirth: "1990-01-01",
                nationality: "US",
                email: contactEmail || "test@example.com",
                phone: contactPhone || "+15555555",
              },
            ],
            services: seatService ? [seatService] : [],
            pricing: {
              baseFare: basePrice,
              addOnsCost: insuranceCost,
              seatsCost: seatCost,
              taxesFees: taxes,
              totalPrice: totalPrice,
              currency: "USD",
            },
            flight: {
              airline: carrierName,
              flightNumber: outboundSlice?.segments?.[0]?.marketing_carrier_flight_number
                ? `${outboundSlice?.segments?.[0]?.marketing_carrier?.iata_code || ""}${outboundSlice.segments[0].marketing_carrier_flight_number}`
                : carrierName,
              departureCode: originCode,
              arrivalCode: destCode,
              origin: originCode,
              destination: destCode,
              departureAirport: outboundSlice?.origin?.name || originCode,
              arrivalAirport: outboundSlice?.destination?.name || destCode,
              departureTime:
                outboundSlice?.segments?.[0]?.departing_at ||
                new Date().toISOString(),
              arrivalTime: outboundSlice?.segments?.[outboundSlice?.segments?.length-1]?.arriving_at || null,
              duration: outboundSlice?.duration || null,
              stops: Math.max(0, (outboundSlice?.segments?.length || 1) - 1),
              cabinClass: outboundSlice?.segments?.[0]?.cabin_class || "economy",
            },
            selectedSeats: selectedSeat ? [selectedSeat] : [],
            addOns: [{ name: "Travel Insurance", price: insuranceCost }],
          };

      // Duffel payment sandbox confirm payload with payment method spec
      const payload = {
        paymentIntentId:
          paymentMethod === "flydna-vault"
            ? `vault_${vaultTokenSelected}_${Date.now()}`
            : paymentMethod === "xrp"
            ? xrpTxHash
            : paymentMethod === "ava"
            ? `ava_${Date.now()}`
            : `pi_mock_${Date.now()}`,
        bookingData,
        passengerEmail: contactEmail || "test@example.com",
        paymentMethod: paymentMethod === "flydna-vault" ? `vault-${vaultTokenSelected}` : (paymentMethod === "credit-card" ? "card" : paymentMethod),
      };

      const payToken = typeof window !== "undefined" ? localStorage.getItem("flydna_token") : null;
      const res = await fetch(`${apiUrl}/v1/payments/confirm-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(payToken ? { Authorization: `Bearer ${payToken}` } : {}) },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        // Save confirmation details in sessionStorage
        sessionStorage.setItem("confirmedBookingId", data.bookingId);
        sessionStorage.setItem(
          "confirmedBookingRef",
          data.bookingReference || "Duffel Order ID",
        );
        sessionStorage.setItem("confirmedTicketUrl", data.ticketUrl || "");
        sessionStorage.setItem(
          "confirmedEmailSent",
          String(data.confirmationEmailSent),
        );

        // Redirect to booking confirmed page
        window.location.href = "/travel/booking-confirmed";
      } else {
        setCheckoutError(
          data.error || "Payment and booking failed. Please try again.",
        );
      }
    } catch (err: any) {
      console.error("Checkout submission failed:", err);
      setCheckoutError(
        err.message ||
          "Failed to submit booking. Please check your internet connection.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative w-full max-w-[1728px] mx-auto min-h-screen overflow-hidden text-[var(--text-main)] bg-[var(--bg-app)]">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,var(--accent-primary)_0%,transparent_70%)] pointer-events-none -z-10"></div>

      {/* Step Progress Bar */}
      <ProgressBar currentStep={4} mode={checkoutEvent ? "event" : "flight"} />

      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-[9999]">
          <div className="w-16 h-16 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] mb-2">
            Processing Your Payment
          </h2>
          <p className="text-[var(--text-muted)] text-sm max-w-sm text-center">
            Creating sandbox order and booking flight on Duffel API. Please do
            not close or refresh this page.
          </p>
        </div>
      )}

      {/* Main Header */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 relative z-10 w-full pb-4">
        <h1 className="text-2xl sm:text-3xl font-medium mb-1 sm:mb-2">
          Secure Payment
        </h1>
        <p className="text-[var(--text-muted)] text-xs sm:text-sm">
          All transactions are secure and encrypted
        </p>
      </div>

      <main className="flex flex-col xl:flex-row gap-6 sm:gap-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 pb-24 relative z-10 w-full">
        <div className="flex-1 w-full min-w-0 flex flex-col gap-6 sm:gap-8">
          {checkoutError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
              {checkoutError}
            </div>
          )}

          {/* Contact Details */}
          <div className="bg-[var(--surface-color)] p-5 sm:p-7 lg:p-8 rounded-[24px] sm:rounded-[28px] border border-[var(--glass-border)] shadow-xl">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 pb-4 border-b border-[var(--glass-border)]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--accent-primary)]/20 text-[var(--text-main)] rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                1
              </div>
              <h2 className="text-lg sm:text-xl font-medium">Contact Information</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs sm:text-sm text-[var(--text-main)] font-medium ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)]/30 focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all font-medium"
                  placeholder="example@mail.com"
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs sm:text-sm text-[var(--text-main)] font-medium ml-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)]/30 focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all font-medium"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>

          {/* Payment Card Section */}
          <div className="bg-[var(--surface-color)] p-5 sm:p-7 lg:p-8 rounded-[24px] sm:rounded-[28px] border border-[var(--glass-border)] shadow-xl">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 pb-4 border-b border-[var(--glass-border)]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--accent-primary)]/20 text-[var(--text-main)] rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                2
              </div>
              <h2 className="text-lg sm:text-xl font-medium">
                Payment Method
              </h2>
            </div>

            <div className="flex gap-2 sm:gap-3 mb-6 bg-[var(--glass-bg)] p-1.5 rounded-xl border border-[var(--glass-border)] w-full overflow-x-auto hide-scrollbar flex-nowrap">
              <button
                type="button"
                className={`snap-start px-3.5 sm:px-4 py-2 text-xs sm:text-sm text-[var(--text-muted)] rounded-lg transition-all font-medium cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${paymentMethod === "credit-card" ? "bg-[var(--accent-primary)] text-[var(--text-main)]" : "bg-[var(--surface-color)] hover:bg-[var(--glass-bg)]"}`}
                onClick={() => setPaymentMethod("credit-card")}
              >
                <CreditCard size={14} /> Credit / Debit Card
              </button>
              <button
                type="button"
                className={`snap-start px-3.5 sm:px-4 py-2 text-xs sm:text-sm text-[var(--text-muted)] rounded-lg transition-all font-medium cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${paymentMethod === "flydna-vault" ? "bg-[var(--accent-primary)] text-[var(--text-main)]" : "bg-[var(--surface-color)] hover:bg-[var(--glass-bg)]"}`}
                onClick={() => setPaymentMethod("flydna-vault")}
              >
                <Shield size={14} /> FlyDnA Vault
              </button>
              <button
                type="button"
                className={`snap-start px-3.5 sm:px-4 py-2 text-xs sm:text-sm text-[var(--text-muted)] rounded-lg transition-all font-medium cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${paymentMethod === "ava" ? "bg-[var(--accent-primary)] text-[var(--text-main)]" : "bg-[var(--surface-color)] hover:bg-[var(--glass-bg)]"}`}
                onClick={() => setPaymentMethod("ava")}
              >
                AVA Token (5% Off)
              </button>
              <button
                type="button"
                className={`snap-start px-3.5 sm:px-4 py-2 text-xs sm:text-sm text-[var(--text-muted)] rounded-lg transition-all font-medium cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${paymentMethod === "xrp" ? "bg-[var(--accent-primary)] text-[var(--text-main)]" : "bg-[var(--surface-color)] hover:bg-[var(--glass-bg)]"}`}
                onClick={() => setPaymentMethod("xrp")}
              >
                XRP
              </button>
              <button
                type="button"
                className={`snap-start px-3.5 sm:px-4 py-2 text-xs sm:text-sm text-[var(--text-muted)] rounded-lg transition-all font-medium cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${paymentMethod === "e-wallet" ? "bg-[var(--accent-primary)] text-[var(--text-main)]" : "bg-[var(--surface-color)] hover:bg-[var(--glass-bg)]"}`}
                onClick={() => setPaymentMethod("e-wallet")}
              >
                E-Wallet
              </button>
            </div>

            {paymentMethod === "credit-card" && (
              <form onSubmit={handlePayNow} className="flex flex-col gap-4 sm:gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs sm:text-sm text-[var(--text-main)] font-medium ml-1">
                    Card Holder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    autoComplete="cc-name"
                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all font-medium"
                    placeholder="John Doe"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs sm:text-sm text-[var(--text-main)] font-medium ml-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      autoComplete="cc-number"
                      inputMode="numeric"
                      className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl sm:rounded-2xl pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all font-medium"
                      placeholder="0000 0000 0000 0000"
                    />
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-4 h-4" />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs sm:text-sm text-[var(--text-main)] font-medium ml-1">
                      Expiration Date
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      autoComplete="cc-exp"
                      inputMode="numeric"
                      className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all font-medium"
                      placeholder="MM / YY"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs sm:text-sm text-[var(--text-main)] font-medium ml-1">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      autoComplete="cc-csc"
                      inputMode="numeric"
                      className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)] hover:border-[var(--glass-border)] transition-all font-medium"
                      placeholder="•••"
                    />
                  </div>
                </div>
              </form>
            )}

            {paymentMethod === "ava" && (
              <div className="flex flex-col gap-5">
                <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-950/10 flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between items-center font-bold text-amber-300">
                    <span>AVA Loyalty Discount (5% Off)</span>
                    <span>- ${(subTotal * 0.05).toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-emerald-400">
                    <span>Travel Rewards Earned (2% Back)</span>
                    <span>+ ${(totalPrice * 0.02).toFixed(2)} USD value in AVA</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black text-white border-t border-white/10 pt-2.5">
                    <span>Total Amount</span>
                    <span>{(totalPrice / 2.40).toFixed(2)} AVA (${totalPrice.toFixed(2)} USD)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs sm:text-sm text-[var(--text-main)] font-medium ml-1">
                      Your EVM Wallet Address
                    </label>
                    <div className="flex gap-2.5">
                      <input
                        type="text"
                        value={avaWalletAddress}
                        onChange={(e) => setAvaWalletAddress(e.target.value)}
                        className="flex-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)] transition font-mono"
                        placeholder="0x..."
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          setCheckingAva(true);
                          const bal = await checkAvaBalance(avaWalletAddress);
                          setAvaBalance(bal);
                          setCheckingAva(false);
                        }}
                        className="px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] font-black text-amber-400 hover:bg-amber-500/20 active:scale-95 transition uppercase tracking-wider"
                      >
                        {checkingAva ? "Checking..." : "Verify Balance"}
                      </button>
                    </div>
                    {linkedEvm ? (
                      <button
                        type="button"
                        onClick={() => setAvaWalletAddress(linkedEvm)}
                        className="text-[11px] text-cyan-400 font-bold bg-cyan-500/10 px-3 py-1.5 rounded-lg hover:bg-cyan-500/20 active:scale-95 transition self-start inline-block uppercase tracking-wider mt-1"
                      >
                        Use Linked EVM Wallet ({linkedEvm.slice(0, 6)}...{linkedEvm.slice(-4)})
                      </button>
                    ) : (
                      <div className="text-[10px] text-slate-500 font-semibold ml-1 mt-1">
                        No EVM wallet connected on Profile page. You can link one in settings to save it.
                      </div>
                    )}
                    {avaBalance !== "0" && (
                      <div className="text-xs text-amber-300 font-bold mt-1 ml-1 flex justify-between">
                        <span>On-chain Wallet Balance:</span>
                        <span>{parseFloat(avaBalance).toFixed(2)} AVA</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-[var(--glass-bg)] p-3.5 rounded-xl border border-[var(--glass-border)] flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                      Travala AVA Recipient Contract Address
                    </span>
                    <span className="text-xs font-mono text-slate-300 break-all select-all">
                      0x4F4aC55F22481198A8824100918f08e34f
                    </span>
                  </div>
                </div>

                <div className="pt-1 text-center text-[10px] text-slate-500 font-semibold leading-normal">
                  Travala AVA smart contract verified on Ethereum network
                </div>
              </div>
            )}

            {paymentMethod === "xrp" && (
              <div className="flex flex-col gap-5">
                <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-950/10 flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between items-center font-bold text-blue-300">
                    <span>XRP Conversion Rate</span>
                    <span>1 XRP = $1.50 USD</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black text-white border-t border-white/10 pt-2.5">
                    <span>Total Amount</span>
                    <span>{(totalPrice / 1.50).toFixed(2)} XRP (${totalPrice.toFixed(2)} USD)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs sm:text-sm text-[var(--text-main)] font-medium ml-1">
                      XRP Transaction Hash (TXID)
                    </label>
                    <input
                      type="text"
                      value={xrpTxHash}
                      onChange={(e) => setXrpTxHash(e.target.value)}
                      className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)] transition font-mono"
                      placeholder="E.g. 9F8D... (Use MOCK_SUCCESS to bypass)"
                    />
                    {linkedXrp ? (
                      <div className="text-xs text-slate-400 font-semibold ml-1 mt-1">
                        Pay from linked XRP Wallet: <span className="text-cyan-400 font-mono select-all">{linkedXrp}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 font-semibold ml-1 mt-1">
                        No XRPL wallet connected on Profile page. You can link one in settings to save it.
                      </div>
                    )}
                  </div>

                  <div className="bg-[var(--glass-bg)] p-3.5 rounded-xl border border-[var(--glass-border)] flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                      Destination Corporate XRP Wallet
                    </span>
                    <span className="text-xs font-mono text-slate-300 break-all select-all">
                      rYourFlyDnaXrpCorporateWalletAddress
                    </span>
                  </div>
                </div>

                <div className="pt-1 text-center text-[10px] text-slate-500 font-semibold leading-normal">
                  Payments cleared instantly via the public XRPL Sandbox Ledger
                </div>
              </div>
            )}

            {paymentMethod === "flydna-vault" && (
              <div className="flex flex-col gap-5">
                <div className="p-4 rounded-xl border border-[var(--accent-primary)]/10 bg-[var(--accent-primary)]/10 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--accent-primary)]">
                    <span>FlyDnA Digital Vault Routing</span>
                    <span>Direct API Settlement</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black text-white border-t border-white/10 pt-2.5">
                    <span>Total Cost in USD</span>
                    <span>${totalPrice.toFixed(2)} USD</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs sm:text-sm text-[var(--text-main)] font-medium ml-1">
                      Select Vault Settlement Asset
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setVaultTokenSelected("xrp")}
                        className={`p-3.5 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                          vaultTokenSelected === "xrp"
                            ? "bg-blue-500/10 border-blue-500/40 text-blue-300"
                            : "bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/[0.02]"
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider">XRP Asset Vault</span>
                        <span className="text-base font-black text-white mt-0.5">{vaultBalances.xrp.toFixed(2)} XRP</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Rate: 1 XRP = $1.50</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVaultTokenSelected("ava")}
                        className={`p-3.5 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                          vaultTokenSelected === "ava"
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                            : "bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/[0.02]"
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider">AVA Asset Vault</span>
                        <span className="text-base font-black text-white mt-0.5">{vaultBalances.ava.toFixed(2)} AVA</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Rate: 1 AVA = $2.40 (5% Off)</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between items-center font-semibold text-[var(--text-muted)]">
                      <span>Required Asset Amount:</span>
                      <span className="font-mono text-[var(--text-main)] font-black">
                        {requiredAmount.toFixed(2)} {vaultTokenSelected.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-[var(--text-muted)]">
                      <span>Your Vault Balance:</span>
                      <span className="font-mono text-[var(--text-main)] font-black">
                        {currentTokenBalance.toFixed(2)} {vaultTokenSelected.toUpperCase()}
                      </span>
                    </div>

                    <div className="border-t border-white/5 my-1.5"></div>

                    {isVaultBalanceSufficient ? (
                      <div className="text-[11px] text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Check size={13} />
                        <span>Vault Balance Approved for Direct Settlement</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-red-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <span>Insufficient Vault Balance. Fund your vault in Transmit &gt; Crypto Wallet.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-1 text-center text-[10px] text-slate-500 font-semibold leading-normal">
                  Payments settled instantly with zero gas fees from your FlyDnA Vault
                </div>
              </div>
            )}

            {paymentMethod === "e-wallet" && (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                Please proceed with card, XRP or AVA checkout. E-Wallets are currently disabled.
              </div>
            )}
          </div>
        </div>

        {/* Right Side summary */}
        <aside className="w-full xl:w-[350px] 2xl:w-[380px] shrink-0 bg-[var(--surface-color)] p-5 sm:p-7 lg:p-8 rounded-[24px] sm:rounded-[28px] h-fit border border-[var(--glass-border)] shadow-xl relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[var(--accent-primary)]/10 blur-[60px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
          <h3 className="text-lg sm:text-xl font-medium mb-5 sm:mb-6 text-[var(--text-main)]">
            {checkoutEvent ? "Event Summary" : "Booking Summary"}
          </h3>
          {checkoutEvent && (
            <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 mb-5 flex flex-col gap-1.5">
              <span className="text-sm font-black text-white truncate">{checkoutEvent.name}</span>
              <span className="text-xs text-[var(--text-muted)]">{checkoutEvent.venue} ({checkoutEvent.city})</span>
              <span className="text-xs text-[var(--text-muted)]">{checkoutEvent.date} {checkoutEvent.time ? `• ${checkoutEvent.time}` : ""}</span>
              <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">{ticketQty} {ticketQty === 1 ? "Ticket" : "Tickets"}</span>
                {Array.isArray(checkoutEvent.seats) && checkoutEvent.seats.length > 0 ? (
                  checkoutEvent.seats.map((st: any, i: number) => (
                    <span key={i} className="text-xs text-[var(--text-main)] font-semibold">Sec {st.section} · Row {st.row} · Seat {st.seat} <span className="text-[var(--text-muted)]">({st.tier})</span></span>
                  ))
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">Seat preference: best available</span>
                )}
              </div>
              {quoteSent && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 flex flex-col gap-1">
                  <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">✓ Request sent</span>
                  <span className="text-xs text-[var(--text-main)]">Our partner desk is pricing your seats. You&apos;ll get a quote in-app and authorize before anything is booked.</span>
                  {quoteRequestId && <span className="text-[10px] font-mono text-[var(--text-muted)]">Ref {quoteRequestId}</span>}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col gap-3 mb-5 text-sm">
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>{checkoutEvent ? (eventHasRealPrice ? `Tickets (from $${Math.round(Number(checkoutEvent.priceMin))} × ${ticketQty})` : "Tickets") : "Base Fare"}</span>
              <span className="text-[var(--text-main)] font-medium">
                {checkoutEvent && !eventHasRealPrice ? "Priced at fulfillment" : `$${basePrice.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>{checkoutEvent ? "Service Fee (est.)" : "Taxes & Fees"}</span>
              <span className="text-[var(--text-main)] font-medium">
                {checkoutEvent && !eventHasRealPrice ? "—" : `$${taxes.toFixed(2)}`}
              </span>
            </div>
            {!checkoutEvent && seatCost > 0 && (
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Seat Selection ({selectedSeat})</span>
                <span className="text-[var(--text-main)] font-medium">
                  ${seatCost.toFixed(2)}
                </span>
              </div>
            )}
            {!checkoutEvent && (
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Travel Insurance</span>
                <span className="text-[var(--text-main)] font-medium">
                  ${insuranceCost.toFixed(2)}
                </span>
              </div>
            )}
          </div>
          <div className="h-px bg-[var(--glass-bg)] my-4"></div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-base text-[var(--text-muted)]">Total</span>
            <span className="text-2xl sm:text-3xl font-bold text-[var(--accent-primary)] text-shadow-lg">
              {checkoutEvent && !eventHasRealPrice ? "Quote pending" : `$${totalPrice.toFixed(2)}`}
            </span>
          </div>

          <button
            type="button"
            onClick={handlePayNow}
            disabled={isProcessing}
            className="w-full py-3 sm:py-3.5 bg-[var(--accent-primary)] text-[var(--text-main)] rounded-full font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:scale-[1.02] hover:bg-[var(--accent-secondary)] hover:shadow-[var(--glow-primary)] transition-all cursor-pointer"
          >
            <span>{checkoutEvent && !eventHasRealPrice ? "Request Tickets" : `Pay Now ($${totalPrice.toFixed(2)})`}</span>
          </button>

          <div className="flex items-center justify-center gap-2 mt-4 text-[var(--text-muted)] text-xs">
            <ShieldCheck className="text-[var(--accent-primary)]" size={16} />
            Guaranteed safe &amp; secure checkout
          </div>
        </aside>
      </main>
      <div className="h-20"></div>
    </div>
  );
}
