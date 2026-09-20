"use client";
import {
  Blocks,
  Clock,
  CreditCard,
  Download,
  MapPin,
  Printer,
  Share2,
  Map,
  Ticket,
  Calendar,
  Check,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useSearchStore } from "@/utils/states/useSearchStore";
import { recordTransaction, recordPurchase } from "@/lib/ledger";
import { CommercialRoadmapReceipt } from "@/components/travel/CommercialRoadmapReceipt";


export default function BookingConfirmedPage() {
  const { selectedOffer, passengerDetails, selectedSeat, selectedSeatPrice } = useSearchStore();

  const [mounted, setMounted] = useState(false);
  const [bookingRef, setBookingRef] = useState("FDNA-8921-XK");
  const [ticketUrl, setTicketUrl] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [passengerName, setPassengerName] = useState("Mark Johnson");
  const [checkoutEvent, setCheckoutEvent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"roadmap" | "boardingPass">("roadmap");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const storedRef = sessionStorage.getItem("confirmedBookingRef");
      const cleanRef = storedRef && !storedRef.toLowerCase().includes("duffel") && !storedRef.toLowerCase().includes("carrier")
        ? storedRef
        : (storedRef || "PENDING");
      setBookingRef(cleanRef);

      const storedUrl = sessionStorage.getItem("confirmedTicketUrl");
      if (storedUrl) setTicketUrl(storedUrl);

      const storedEmail = sessionStorage.getItem("confirmedEmailSent");
      if (storedEmail) setEmailSent(storedEmail === "true");

      try {
        const storedEvent = sessionStorage.getItem("checkout_event");
        if (storedEvent) setCheckoutEvent(JSON.parse(storedEvent));
      } catch {}

      // Record flight purchase receipt in financial ledger
      const totalAmount = selectedOffer?.total_amount ? parseFloat(selectedOffer.total_amount) : 412.0;
      const ref = cleanRef;

      recordTransaction({
        type: "Flight Ticket Settlement",
        note: `Flight Reservation (Ref #${ref})`,
        amount: totalAmount,
        currency: "USD",
        method: "debit",
        status: "Confirmed",
      });

      recordPurchase({
        id: `pr-flight-${ref}`,
        title: `Flight Ticket Booking (Ref #${ref})`,
        category: "Flights",
        amount: totalAmount,
        merchant: "FlyDnA Travel Direct Settlement",
        status: "Confirmed",
      });

      window.dispatchEvent(
        new CustomEvent("flydna-new-notification", {
          detail: {
            message: `Booking Confirmed! Ref #${ref}. Flight itinerary & boarding pass dispatched to your Email & SMS. Check your Finance page for receipt!`,
          },
        })
      );
    }
  }, []);


  useEffect(() => {
    if (passengerDetails && passengerDetails[0]) {
      const p = passengerDetails[0];
      setPassengerName(`${p.firstName} ${p.lastName}`);
    } else {
      try {
        const storedUser = localStorage.getItem("flydna_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.firstName) {
            setPassengerName(`${parsed.firstName} ${parsed.lastName || ""}`);
          }
        }
      } catch {}
    }
  }, [passengerDetails]);

  useEffect(() => {
    if (!mounted || !selectedOffer) return;

    const carrier = firstSegment?.operating_carrier?.name || "Airline";
    const fNum = `${firstSegment?.operating_carrier?.iata_code || "EK"}-${firstSegment?.marketing_carrier_flight_number || "342"}`;
    const origin = firstSegment?.origin?.iata_code || "DXB";
    const dest = lastSegment?.destination?.iata_code || "CMB";
    const cab = firstSegment?.cabin_class || "economy";

    const logExperience = async () => {
      try {
        const text = `User: Premium. Action: Successfully booked ${carrier} flight ${fNum} from ${origin} to ${dest} in ${cab} class.`;
        await fetch('/api/agent/learn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(localStorage.getItem("flydna_token") ? { Authorization: `Bearer ${localStorage.getItem("flydna_token")}` } : {}) },
          body: JSON.stringify({
            text,
            category: 'flights',
            tags: ['travel', 'flights', origin.toLowerCase(), dest.toLowerCase(), cab.toLowerCase()]
          })
        });
      } catch (err) {
        console.warn('[FlyDnA Memory] Failed to register flight booking experience:', err);
      }
    };

    logExperience();
  }, [mounted, selectedOffer]);

  // Fallback to default rendering if not mounted to prevent hydration mismatches
  const outboundSlice = selectedOffer?.slices?.[0];
  const firstSegment = outboundSlice?.segments?.[0];
  const lastSegment = outboundSlice?.segments?.[outboundSlice.segments.length - 1];

  const airlineName = firstSegment?.operating_carrier?.name || "Emirates Airlines";
  const cabinClass = firstSegment?.cabin_class || "economy";
  const cabinClassLabel = cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1).replace("_", " ");

  const originCode = firstSegment?.origin?.iata_code || "DXB";
  const originName = firstSegment?.origin?.name || "Dubai Int. Airport";
  const destCode = lastSegment?.destination?.iata_code || "CMB";
  const destName = lastSegment?.destination?.name || "Bandaranaike Int.";

  // Format times
  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "";
    }
  };

  const departureTime = formatTime(firstSegment?.departing_at) || "02:00 AM";
  const arrivalTime = formatTime(lastSegment?.arriving_at) || "08:00 AM";
  const departureDate = formatDate(firstSegment?.departing_at) || "17 Mar 2026";

  // Flight number
  const carrierCode = firstSegment?.operating_carrier?.iata_code || firstSegment?.marketing_carrier?.iata_code || "EK";
  const flightNum = firstSegment?.marketing_carrier_flight_number || firstSegment?.operating_carrier_flight_number || "342";
  const flightNumberStr = `${carrierCode}-${flightNum}`;

  // Terminal
  const originTerminal = firstSegment?.origin_terminal || "T3";

  // Boarding time (45 mins before departure)
  let boardingTime = "01:15 AM";
  if (firstSegment?.departing_at) {
    try {
      const d = new Date(firstSegment.departing_at);
      d.setMinutes(d.getMinutes() - 45);
      boardingTime = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {}
  }

  // Duration
  const parseDuration = (isoDuration?: string) => {
    if (!isoDuration) return "";
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return isoDuration;
    const hours = match[1] ? `${match[1]}h` : "";
    const minutes = match[2] ? ` ${match[2]}m` : "";
    return `${hours}${minutes}`.trim();
  };
  const flightDuration = parseDuration(outboundSlice?.duration || firstSegment?.duration) || "4h 30m";

  // Pricing
  const basePrice = selectedOffer ? Math.round(parseFloat(selectedOffer.total_amount) * 0.85) : 850;
  const taxes = selectedOffer ? Math.round(parseFloat(selectedOffer.total_amount) * 0.15) : 120;
  const seatCost = selectedSeatPrice || 0;
  const insuranceCost = 29; // Travel Insurance
  const totalPrice = basePrice + taxes + seatCost + insuranceCost;

  // Add-ons count
  let addOnsCount = 1; // Travel Insurance is always included
  if (selectedSeat) addOnsCount += 1;

  // Boarding Zone (simple mock calculation based on seat)
  const getBoardingZone = () => {
    if (!selectedSeat) return "2";
    const num = parseInt(selectedSeat);
    if (isNaN(num)) return "2";
    if (num <= 10) return "1";
    if (num <= 25) return "2";
    return "3";
  };
  const boardingZone = getBoardingZone();

  const handleDownloadTicket = () => {
    if (ticketUrl) {
      window.open(ticketUrl, "_blank");
    } else {
      handlePrint("card-to-print");
    }
  };

  const handlePrint = (elementId: string) => {
    const content = document.getElementById(elementId);
    if (!content) return;

    // 1. Create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // 2. Write the content + styles into the iframe
    doc.open();
    doc.write(`
    <html>
      <head>
        <title>Print Card</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          ${Array.from(document.styleSheets)
            .map((sheet) => {
              try {
                return Array.from(sheet.cssRules)
                  .map((rule) => rule.cssText)
                  .join("");
              } catch (e) {
                return e;
              }
            })
            .join("")}
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
    </html>
  `);
    doc.close();

    // 3. Trigger Print
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // 4. Cleanup
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  return (
    <div className="relative w-full max-w-[1728px] mx-auto min-h-screen overflow-hidden text-[var(--text-main)] bg-[var(--bg-app)]">
      {/* Confirmation Header */}
      <div className="relative z-10 text-center px-6 pt-10 sm:pt-14 pb-4 flex flex-col items-center">
        <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight text-white">
          Booking Confirmed
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-md mb-2">
          Your itinerary has been sent to your email.
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Booking Ref:{" "}
          <span className="text-[var(--text-main)] font-mono font-semibold tracking-wider ml-1">
            {mounted ? bookingRef : "FDNA-8921-XK"}
          </span>
        </p>
        <button
          onClick={async () => {
            try {
              const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
              const token = typeof window !== "undefined" ? localStorage.getItem("flydna_token") : null;
              const ref = mounted ? bookingRef : null;
              if (!ref) return;
              const res = await fetch(`${apiBase}/api/v1/bookings/${ref}/resend-confirmation`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              });
              const json = await res.json();
              if (json.success) {
                setEmailSent(true);
                sessionStorage.setItem("confirmedEmailSent", "true");
              }
            } catch (err) {
              console.warn("[Resend Email Failed]", err);
            }
          }}
          className="text-xs font-semibold text-[var(--accent-primary)] hover:underline mt-2 cursor-pointer"
        >
          {emailSent ? "✓ Itinerary Emailed — Resend?" : "Email Itinerary"}
        </button>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#111827] border border-[#1F2937] rounded-xl mt-6">
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "roadmap"
                ? "bg-[#1F2937] text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Map size={14} /> Executive Roadmap & Settlement
          </button>
          <button
            onClick={() => setActiveTab("boardingPass")}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "boardingPass"
                ? "bg-[#1F2937] text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Ticket size={14} /> Airline Boarding Pass
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 sm:px-6 md:px-8 max-w-[1280px] w-full mx-auto pb-16 relative z-10 flex flex-col items-center mt-10">
        {activeTab === "roadmap" ? (
          <div className="w-full flex justify-center">
            <CommercialRoadmapReceipt
              pnr={mounted ? bookingRef : "FL-892401"}
              bookingRef={mounted ? bookingRef : "FL-892401"}
              passengerName={mounted ? passengerName : "Mark Johnson"}
              origin={mounted ? originCode : "ATL"}
              originName={mounted ? originName : "Atlanta Hartsfield-Jackson"}
              destination={mounted ? destCode : "LGA"}
              destinationName={mounted ? destName : "New York LaGuardia"}
              airline={mounted ? (checkoutEvent ? "FlyHub Concierge" : airlineName) : "Delta Air Lines"}
              flightNumber={mounted ? flightNumberStr : "DL-1420"}
              cabinClass={mounted ? cabinClassLabel : "First Class"}
              seat={mounted ? (selectedSeat || "2B") : "2B"}
              departureDate={mounted ? departureDate : "Thursday, Oct 15, 2026"}
              departureTime={mounted ? departureTime : "08:30 AM"}
              arrivalTime={mounted ? arrivalTime : "11:15 AM"}
              subtotal={mounted ? (totalPrice * 0.9) : 1149.0}
              taxes={mounted ? (totalPrice * 0.1) : 99.5}
              total={mounted ? totalPrice : 1248.5}
              onDownloadPdf={handleDownloadTicket}
            />
          </div>
        ) : (
          <>
            <div
              className="flex flex-col lg:flex-row w-full max-w-[840px] bg-[#0E1526] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden font-sans"
              id="card-to-print"
            >
              {/* Left & Main Flight Ticket Section */}
              <div className="flex-1 min-w-0 p-6 sm:p-7 flex flex-col justify-between gap-6">
                {/* Header: Airline Branding */}
                <div className="flex justify-between items-center pb-4 border-b border-[#1E293B]">
                  <div>
                    <span className="text-sm font-bold tracking-wider text-white uppercase block leading-none">
                      {mounted ? (checkoutEvent ? "FlyHub Executive" : (airlineName.toLowerCase().includes("duffel") ? "FlyDnA Airways" : airlineName)) : "FlyDnA Airways"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono tracking-widest mt-1 block">
                      ELECTRONIC BOARDING PASS
                    </span>
                  </div>
                </div>

                {checkoutEvent ? (
                  /* Event Booking Info */
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-cyan-400 font-mono font-semibold uppercase tracking-wider block mb-1">
                        EVENT PASS
                      </span>
                      <h3 className="text-2xl font-bold text-white tracking-tight">{checkoutEvent.name}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <MapPin size={13} className="text-cyan-400 shrink-0" />
                        {checkoutEvent.venue} · {checkoutEvent.city}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B0F19] p-3.5 rounded-xl border border-[#1E293B]">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Attendee</span>
                        <span className="text-xs font-semibold text-slate-200 truncate block mt-0.5">{mounted ? passengerName : "Guest"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Date</span>
                        <span className="text-xs font-semibold text-slate-200 truncate block mt-0.5">{mounted ? checkoutEvent.date : "17 Mar 2026"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Time</span>
                        <span className="text-xs font-semibold text-slate-200 block mt-0.5">{checkoutEvent.time || "Doors 19:00"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Pass Type</span>
                        <span className="text-xs font-semibold text-cyan-400 block mt-0.5">VIP Admission</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Commercial Flight Route Info */
                  <div className="space-y-5">
                    {/* Route Codes & Timings */}
                    <div className="flex items-center justify-between gap-4">
                      {/* Origin */}
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                          {mounted ? originCode : "JFK"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[130px] sm:max-w-[180px] mt-0.5">
                          {mounted ? originName : "John F. Kennedy"}
                        </span>
                        <span className="text-xs text-cyan-400 font-mono font-bold mt-1">
                          {mounted ? departureTime : "06:58 AM"}
                        </span>
                      </div>

                      {/* Flight Path Indicator */}
                      <div className="flex-1 flex flex-col items-center justify-center px-2 min-w-[80px]">
                        <span className="text-[10px] text-slate-400 font-mono mb-1">
                          {mounted ? flightDuration : "2h 12m"}
                        </span>
                        <div className="w-full flex items-center justify-center relative">
                          <div className="w-full border-t border-dashed border-slate-700"></div>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-400 tracking-wider mt-1 uppercase">
                          Non-Stop
                        </span>
                      </div>

                      {/* Destination */}
                      <div className="flex flex-col items-end min-w-0 text-right">
                        <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                          {mounted ? destCode : "ATL"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[130px] sm:max-w-[180px] mt-0.5">
                          {mounted ? destName : "Atlanta Hartsfield"}
                        </span>
                        <span className="text-xs text-cyan-400 font-mono font-bold mt-1">
                          {mounted ? arrivalTime : "09:10 AM"}
                        </span>
                      </div>
                    </div>

                    {/* Flight Specs Metadata Matrix */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 bg-[#0B0F19] p-3 rounded-xl border border-[#1E293B]">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Passenger</span>
                        <span className="text-xs font-semibold text-slate-200 truncate block mt-0.5">{mounted ? passengerName : "Mark Johnson"}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Date</span>
                        <span className="text-xs font-semibold text-slate-200 truncate block mt-0.5">{mounted ? departureDate : "10 Sep 2026"}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Flight</span>
                        <span className="text-xs font-mono font-semibold text-slate-200 block mt-0.5">{mounted ? flightNumberStr : "DL-1420"}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Gate</span>
                        <span className="text-xs font-mono font-bold text-cyan-400 block mt-0.5">G-12</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Seat</span>
                        <span className="text-xs font-mono font-bold text-white block mt-0.5">{mounted ? selectedSeat || "2B" : "2B"}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Boarding</span>
                        <span className="text-xs font-mono font-semibold text-slate-200 block mt-0.5">{mounted ? boardingTime : "06:13 AM"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Security Verification Bar */}
                <div className="flex items-center justify-end pt-3 border-t border-[#1E293B] text-[10.5px] text-slate-400">
                  <span className="font-mono text-[10px] text-slate-500">
                    ETKT #{mounted ? (bookingRef.toLowerCase().includes("duffel") ? "006-2910482103" : `006-${bookingRef.replace(/[^0-9]/g, "").padEnd(10, "9")}`) : "006-2910482103"}
                  </span>
                </div>
              </div>

              {/* Perforated Stub Line */}
              <div className="relative hidden lg:flex flex-col items-center justify-between w-6 shrink-0 bg-transparent py-3">
                <div className="w-6 h-6 rounded-full bg-[var(--bg-app)] -mt-6 border border-[#1E293B]"></div>
                <div className="h-full border-r-2 border-dashed border-[#1E293B] my-2"></div>
                <div className="w-6 h-6 rounded-full bg-[var(--bg-app)] -mb-6 border border-[#1E293B]"></div>
              </div>

              {/* Right Side Boarding Stub with Live Scannable QR Code */}
              <div className="w-full lg:w-[240px] p-6 bg-[#0B0F19] border-t lg:border-t-0 lg:border-l border-[#1E293B] flex flex-col items-center justify-between gap-4 shrink-0 text-center">
                <div className="w-full">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                    BOARDING PASS STUB
                  </span>
                  <span className="text-xs font-mono font-semibold text-white block mt-0.5">
                    {mounted ? flightNumberStr : "DL-1420"} · Zone {mounted ? boardingZone : "2"}
                  </span>
                </div>

                {/* Live Real Scannable QR Code Generated via API */}
                <div className="p-2.5 bg-white rounded-xl shadow-md flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                      `FLYDNA:${mounted ? bookingRef : "FL892401"}:${mounted ? originCode : "JFK"}-${mounted ? destCode : "ATL"}:SEAT-${mounted ? selectedSeat || "2B" : "2B"}`
                    )}&margin=0`}
                    alt="Boarding Pass QR Code"
                    width={130}
                    height={130}
                    className="w-32 h-32 block object-contain"
                  />
                </div>

                <div className="w-full">
                  <span className="text-[11px] font-bold font-mono text-cyan-400 tracking-wider block">
                    SEAT {mounted ? selectedSeat || "2B" : "2B"}
                  </span>
                  <span className="text-[9.5px] font-mono text-slate-400 tracking-wider block mt-1">
                    REF: {mounted ? (bookingRef.toLowerCase().includes("duffel") ? "FL892401" : bookingRef) : "FL892401"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3.5 mt-6 flex-wrap w-full max-w-[760px]">
              <button
                className="flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-white text-black hover:scale-105 hover:bg-white/80 transition-all font-semibold min-w-[200px] cursor-pointer"
                onClick={handleDownloadTicket}
              >
                <Download className="w-5 h-5" />
                Download E-Ticket
              </button>
              <button
                className="flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-[var(--glass-bg)] backdrop-blur-md shadow-lg border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] hover:scale-105 transition-all font-semibold cursor-pointer"
                onClick={async () => {
                  const shareText = "My FlyDnA booking is confirmed! Check it out.";
                  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
                  if (typeof navigator !== "undefined" && navigator.share) {
                    try {
                      await navigator.share({ title: "FlyDnA Booking Confirmed", text: shareText, url: shareUrl });
                    } catch (err) {}
                  } else if (typeof navigator !== "undefined" && navigator.clipboard) {
                    await navigator.clipboard.writeText(shareUrl);
                    alert("Booking link copied to clipboard!");
                  }
                }}
              >
                <Share2 className="w-5 h-5" />
                Share Details
              </button>
              <button
                className="flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-[var(--glass-bg)] backdrop-blur-md shadow-lg border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] hover:scale-105 transition-all font-semibold cursor-pointer"
                onClick={() => handlePrint("card-to-print")}
              >
                <Printer className="w-5 h-5" />
                Print Ticket
              </button>
            </div>
          </>
        )}
      </div>

      {/* Trip Summary Overview */}
      <div className="px-4 sm:px-6 lg:px-[180px] pb-24 pt-8 w-full border-t border-[var(--glass-border)] mt-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-8 sm:mb-10 text-center w-full">
          Trip Summary Overview
        </h2>

        <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="flex items-center gap-4 bg-[var(--surface-color)]/80 p-5 justify-start rounded-2xl border border-[var(--glass-border)] shadow-lg hover:bg-[var(--surface-color)] transition-colors group cursor-default">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-[var(--accent-primary)]">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-[var(--text-muted)] font-medium mb-0.5">
                Total Distance
              </span>
              <span className="font-bold text-lg sm:text-xl text-[var(--text-main)] tracking-tight font-mono">
                3,285 km
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[var(--surface-color)]/80 p-5 justify-start rounded-2xl border border-[var(--glass-border)] shadow-lg hover:bg-[var(--surface-color)] transition-colors group cursor-default">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-[var(--accent-primary)]">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-[var(--text-muted)] font-medium mb-0.5">
                Flight Duration
              </span>
              <span className="font-bold text-lg sm:text-xl text-[var(--text-main)] tracking-tight font-mono">
                {mounted ? flightDuration : "4h 30m"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[var(--surface-color)]/80 p-5 justify-start rounded-2xl border border-[var(--glass-border)] shadow-lg hover:bg-[var(--surface-color)] transition-colors group cursor-default">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-[var(--accent-primary)]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-[var(--text-muted)] font-medium mb-0.5">
                Total Paid
              </span>
              <span className="font-bold text-lg sm:text-xl text-[var(--text-main)] tracking-tight font-mono">
                $ {mounted ? totalPrice.toFixed(2) : "970.00"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[var(--surface-color)]/80 p-5 justify-start rounded-2xl border border-[var(--glass-border)] shadow-lg hover:bg-[var(--surface-color)] transition-colors group cursor-default">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-emerald-400">
              <Blocks className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-[var(--text-muted)] font-medium mb-0.5">
                Add-ons
              </span>
              <span className="font-bold text-lg sm:text-xl text-emerald-400 tracking-tight">
                {mounted ? addOnsCount : 3} Included
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
