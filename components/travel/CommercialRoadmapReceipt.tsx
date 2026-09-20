"use client";

import React from "react";
import { motion } from "framer-motion";

export interface CommercialReceiptProps {
  pnr?: string;
  bookingRef?: string;
  passengerName?: string;
  origin?: string;
  originName?: string;
  destination?: string;
  destinationName?: string;
  airline?: string;
  flightNumber?: string;
  cabinClass?: string;
  seat?: string;
  departureDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  subtotal?: number;
  taxes?: number;
  total?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  onAddCalendar?: () => void;
  onDownloadPdf?: () => void;
}

export const CommercialRoadmapReceipt: React.FC<CommercialReceiptProps> = ({
  pnr = "FL-892401",
  bookingRef,
  passengerName = "Mark Johnson",
  origin = "ATL",
  originName = "Atlanta Hartsfield-Jackson",
  destination = "LGA",
  destinationName = "New York LaGuardia",
  airline = "Delta Air Lines",
  flightNumber = "DL-1420",
  cabinClass = "First Class",
  seat = "2B",
  departureDate = "Thursday, Oct 15, 2026",
  departureTime = "08:30 AM",
  arrivalTime = "11:15 AM",
  subtotal = 1149.0,
  taxes = 99.5,
  total = 1248.5,
  pickupLocation = "Curbside to Airport",
  dropoffLocation = "Midtown Manhattan · Office",
  onAddCalendar,
  onDownloadPdf,
}) => {
  const isInvalid = (ref?: string) =>
    !ref || ref.toLowerCase().includes("duffel") || ref.toLowerCase().includes("airways") || ref.toLowerCase().includes("airline") || ref.includes(" ");
  const effectiveRef = !isInvalid(pnr) ? pnr! : (!isInvalid(bookingRef) ? bookingRef! : "FL-892401");

  const handleCalendarExport = () => {
    if (onAddCalendar) {
      onAddCalendar();
      return;
    }
    const calTitle = encodeURIComponent(`FlyDnA Flight: ${airline} ${flightNumber} (${origin} -> ${destination})`);
    const calDesc = encodeURIComponent(
      `FlyDnA Executive Itinerary\n` +
      `Passenger: ${passengerName}\n` +
      `Confirmation / PNR: ${effectiveRef}\n` +
      `Airline: ${airline} (${flightNumber})\n` +
      `Cabin: ${cabinClass} | Seat: ${seat}\n` +
      `Date: ${departureDate}\n` +
      `Route: ${origin} (${originName}) -> ${destination} (${destinationName})\n` +
      `Status: Confirmed & Paid`
    );
    const calLoc = encodeURIComponent(`${origin} Airport (${originName})`);
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&details=${calDesc}&location=${calLoc}`;
    window.open(googleCalUrl, "_blank");
  };

  const handleDownloadICS = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const startStr = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T120000Z`;
    const endStr = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T150000Z`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//FlyDnA//Executive Travel Itinerary//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:flydna-${effectiveRef}-${Date.now()}@flydna.io`,
      `DTSTAMP:${now.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:✈️ FlyDnA Flight: ${origin} ➔ ${destination} (${airline} ${flightNumber})`,
      `LOCATION:${originName}`,
      `DESCRIPTION:PNR: ${effectiveRef}\\nPassenger: ${passengerName}\\nAirline: ${airline} ${flightNumber}\\nSeat: ${seat}\\nTotal: $${total.toFixed(2)} USD`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FlyDnA_${origin}_${destination}_${effectiveRef}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-[660px] mx-auto bg-[#0B0F19] text-[#E5E7EB] font-sans p-6 sm:p-7 md:p-8 rounded-2xl border border-[#1F2937] shadow-2xl antialiased">
      {/* Topbar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="text-[13px] font-bold tracking-[0.22em] text-white font-sans">
            FLYDNA
            <small className="block text-[8.5px] font-medium tracking-[0.3em] text-[#6B7280] -mt-0.5">
              EXECUTIVE TRAVEL
            </small>
          </div>
        </div>
        <div className="text-[11px] font-bold tracking-[0.08em] text-[#34D399] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse"></span>
          Booking Confirmed
        </div>
      </div>

      {/* Subject & Lede */}
      <h1 className="text-xl sm:text-[21px] font-bold tracking-tight text-[#F9FAFB] mb-1.5">
        Door-to-Door Itinerary
      </h1>
      <p className="text-[12px] text-[#9CA3AF] mb-5 leading-relaxed">
        Booking <b className="text-[#E5E7EB] font-semibold">{effectiveRef}</b> · {departureDate} · {originName} ({origin}) to {destinationName} ({destination})
      </p>

      {/* Journey Roadmap Card */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-[18px_18px_8px] shadow-[0_0_44px_rgba(56,189,248,0.05)]">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] font-bold tracking-[0.24em] text-[#6B7280] uppercase font-sans">
            JOURNEY ROADMAP — 5 STAGES
          </span>
          <span
            className="text-[10px] font-bold tracking-[0.24em] uppercase font-sans text-[#6B7280] border border-[#1F2937] bg-[#0B0F19] px-2.5 py-1 rounded-md inline-flex items-center gap-1.5"
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
              letterSpacing: "0.24em",
              fontWeight: 700,
              fontSize: "10px",
              color: "#6B7280",
            }}
          >
            {origin} → {destination} · NON-STOP
          </span>
        </div>

        <svg className="w-full h-auto block select-none" viewBox="0 0 600 520" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="roadGrad" x1="0" y1="1" x2="0.35" y2="0">
              <stop offset="0" stopColor="#22D3EE" />
              <stop offset="0.38" stopColor="#38BDF8" />
              <stop offset="0.7" stopColor="#818CF8" />
              <stop offset="1" stopColor="#C084FC" />
            </linearGradient>
            <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* Road ribbon glow & base */}
          <path
            d="M62 446 C150 444 268 420 318 378 C366 338 302 312 242 292 C196 276 196 220 250 196 C300 174 372 178 408 142 C448 106 400 62 298 52 C297.3 51.9 297 51.8 297 51"
            fill="none"
            stroke="url(#roadGrad)"
            strokeWidth="11"
            strokeLinecap="round"
            opacity="0.35"
            filter="url(#soft)"
          />
          <path
            d="M62 446 C150 444 268 420 318 378 C366 338 302 312 242 292 C196 276 196 220 250 196 C300 174 372 178 408 142 C448 106 400 62 298 52 C297.3 51.9 297 51"
            fill="none"
            stroke="#263043"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M62 446 C150 444 268 420 318 378 C366 338 302 312 242 292 C196 276 196 220 250 196 C300 174 372 178 408 142 C448 106 400 62 298 52 C297.3 51.9 297 51"
            fill="none"
            stroke="url(#roadGrad)"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.95"
          />
          <path
            d="M62 446 C150 444 268 420 318 378 C366 338 302 312 242 292 C196 276 196 220 250 196 C300 174 372 178 408 142 C448 106 400 62 298 52 C297.3 51.9 297 51"
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1"
            strokeDasharray="1 9"
            strokeLinecap="round"
          />

          {/* NODE 1 : chauffeur pickup */}
          <line x1="70" y1="446" x2="70" y2="406" stroke="#22D3EE" strokeWidth="1.4" opacity="0.55" />
          <circle cx="70" cy="446" r="3.4" fill="#22D3EE" />
          <circle cx="70" cy="377" r="23" fill="#0B0F19" stroke="#22D3EE" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 9px rgba(34,211,238,.45))" }} />
          <g transform="translate(60,367)" color="#22D3EE">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.6 15.4l1.4-3.9c.3-.7 1-1.2 1.8-1.2h6.7c.6 0 1.1.2 1.5.7l2.1 2.6h2.2c.7 0 1.3.6 1.3 1.3v1.5" />
              <path d="M2.6 15.4h18.4" />
              <circle cx="7.6" cy="15.9" r="1.8" fill="#0B0F19" />
              <circle cx="16.4" cy="15.9" r="1.8" fill="#0B0F19" />
            </svg>
          </g>
          <text className="font-mono text-[10px] font-bold tracking-[0.14em]" x="104" y="362" fill="#22D3EE">01</text>
          <text className="font-sans text-[12px] font-bold tracking-[0.16em] fill-[#F3F4F6]" x="104" y="379">CHAUFFEUR PICKUP</text>
          <text className="font-sans text-[10.5px] fill-[#9CA3AF]" x="104" y="396">{pickupLocation}</text>

          {/* NODE 2 : terminal departure */}
          <line x1="318" y1="378" x2="318" y2="338" stroke="#38BDF8" strokeWidth="1.4" opacity="0.55" />
          <circle cx="318" cy="378" r="3.4" fill="#38BDF8" />
          <circle cx="318" cy="309" r="23" fill="#0B0F19" stroke="#38BDF8" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 9px rgba(56,189,248,.45))" }} />
          <g transform="translate(308,299)" color="#38BDF8">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.9" y="6.4" width="18.2" height="11.2" rx="2.2" />
              <path d="M14.6 7.4v9.2" strokeDasharray="1.6 2.6" />
              <path d="M11.9 9.6H6.6M11.9 12H6.6M11.9 14.4H8.4" />
              <path d="M17.2 9.6h2.9M17.2 12h2.9M17.2 14.4h2.9" />
            </svg>
          </g>
          <text className="font-mono text-[10px] font-bold tracking-[0.14em]" x="352" y="294" fill="#38BDF8">02</text>
          <text className="font-sans text-[12px] font-bold tracking-[0.16em] fill-[#F3F4F6]" x="352" y="311">TERMINAL DEPARTURE</text>
          <text className="font-sans text-[10.5px] fill-[#9CA3AF]" x="352" y="328">{origin} Concierge · TSA PreCheck</text>

          {/* NODE 3 : in-flight apex */}
          <line x1="250" y1="196" x2="250" y2="156" stroke="#818CF8" strokeWidth="1.4" opacity="0.55" />
          <circle cx="250" cy="196" r="3.4" fill="#818CF8" />
          <circle cx="250" cy="127" r="23" fill="#0B0F19" stroke="#818CF8" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 10px rgba(129,140,248,.55))" }} />
          <g transform="translate(240,117)" color="#818CF8">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.8 12.8L6.4 9.7c.5-.4 1.1-.7 1.8-.7h6.9" />
              <path d="M2.8 12.8c1.1 1.7 3 2.6 5.4 2.6h11" />
              <path d="M10.6 11.6l3.8 6.2h2.7l-3.6-6.2" />
              <path d="M16.9 12l2.3 3.4h2l-2.1-3.4" />
              <path d="M17.4 9.4L19.9 5.4h2l-2.4 5.2" />
            </svg>
          </g>
          <text className="font-mono text-[10px] font-bold tracking-[0.14em]" x="216" y="112" fill="#818CF8" textAnchor="end">03</text>
          <text className="font-sans text-[12px] font-bold tracking-[0.16em] fill-[#F3F4F6]" x="216" y="129" textAnchor="end">IN-FLIGHT</text>
          <text className="font-sans text-[10.5px] fill-[#9CA3AF]" x="216" y="146" textAnchor="end">{airline} · {cabinClass} · Seat {seat}</text>

          {/* NODE 4 : LGA arrival */}
          <line x1="408" y1="142" x2="408" y2="102" stroke="#A78BFA" strokeWidth="1.4" opacity="0.55" />
          <circle cx="408" cy="142" r="3.4" fill="#A78BFA" />
          <circle cx="408" cy="69" r="23" fill="#0B0F19" stroke="#A78BFA" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 9px rgba(167,139,250,.45))" }} />
          <g transform="translate(398,59)" color="#A78BFA">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.9003 10.7998C18.9002 7.08572 16.2547 3.90039 11.9999 3.90039C7.74237 3.90047 5.10056 7.05052 5.10046 10.7998C5.10046 13.0829 6.29178 15.183 7.80359 16.916C9.30556 18.6377 11.0351 19.8955 11.91 20.4775C11.9433 20.4997 11.9743 20.5068 11.9999 20.5068C12.0255 20.5068 12.0564 20.4997 12.0897 20.4775C12.9646 19.8955 14.695 18.638 16.1971 16.916C17.7089 15.183 18.9003 13.0828 18.9003 10.7998ZM14.1005 10.7998C14.1004 9.6401 13.1596 8.7002 11.9999 8.7002C10.8402 8.70027 9.90037 9.64014 9.90027 10.7998C9.90027 11.9596 10.8401 12.9003 11.9999 12.9004C13.1597 12.9004 14.1005 11.9596 14.1005 10.7998ZM15.9003 10.7998C15.9003 12.9537 14.1538 14.7002 11.9999 14.7002C9.84603 14.7001 8.10046 12.9537 8.10046 10.7998C8.10057 8.64603 9.8461 6.90047 11.9999 6.90039C14.1537 6.90039 15.9002 8.64598 15.9003 10.7998ZM20.7001 10.7998C20.7001 13.7092 19.1938 16.2194 17.5536 18.0996C15.9039 19.9907 14.0277 21.3497 13.0868 21.9756C12.4242 22.4163 11.5765 22.4163 10.9139 21.9756C9.9732 21.3498 8.09699 19.9908 6.44714 18.0996C4.8069 16.2194 3.29968 13.7092 3.29968 10.7998C3.29978 6.14935 6.65779 2.09969 11.9999 2.09961C17.3448 2.09961 20.7 6.19035 20.7001 10.7998Z" />
            </svg>
          </g>
          <text className="font-mono text-[10px] font-bold tracking-[0.14em]" x="442" y="54" fill="#A78BFA">04</text>
          <text className="font-sans text-[12px] font-bold tracking-[0.16em] fill-[#F3F4F6]" x="442" y="71">{destination} ARRIVAL</text>
          <text className="font-sans text-[10.5px] fill-[#9CA3AF]" x="442" y="88">Terminal Gate Meet &amp; Greet</text>

          {/* NODE 5 : final arrival (terminus) */}
          <circle cx="297" cy="51" r="23" fill="#0B0F19" stroke="#C084FC" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 10px rgba(192,132,252,.55))" }} />
          <g transform="translate(287,41)" color="#C084FC">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21.2c-3.6-2.4-7-5.6-7-10a7 7 0 0 1 14 0c0 4.4-3.4 7.6-7 10z" />
              <path d="M9.3 11.2l1.9 1.9 3.4-3.6" />
            </svg>
          </g>
          <text className="font-mono text-[10px] font-bold tracking-[0.14em]" x="262" y="36" fill="#C084FC" textAnchor="end">05</text>
          <text className="font-sans text-[12px] font-bold tracking-[0.16em] fill-[#F3F4F6]" x="262" y="53" textAnchor="end">FINAL ARRIVAL</text>
          <text className="font-sans text-[10.5px] fill-[#9CA3AF]" x="262" y="70" textAnchor="end">{dropoffLocation}</text>
        </svg>
      </div>

      {/* Receipt Breakdown Card */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
        {/* Left Col: Flight Spec */}
        <div className="p-5 md:p-[20px_22px] md:border-r md:border-b-0 border-b border-[#1F2937]">
          <div className="text-[9.5px] font-bold tracking-[0.26em] text-[#6B7280] mb-4 flex items-center gap-2">
            FLIGHT SPEC <span className="flex-1 h-px bg-[#1F2937]"></span>
          </div>
          <div className="text-[27px] font-bold text-[#F9FAFB] tracking-[0.02em] font-mono mb-3 flex items-center gap-2.5">
            {origin} <span className="text-[#22D3EE] drop-shadow-[0_0_14px_rgba(34,211,238,0.6)]">→</span> {destination}
          </div>
          <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-[#1F2937]/85 text-xs">
            <span className="text-[9.5px] tracking-[0.18em] text-[#6B7280] font-semibold">DATE</span>
            <span className="text-[12.5px] text-[#E5E7EB] font-semibold">{departureDate}</span>
          </div>
          <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-[#1F2937]/85 text-xs">
            <span className="text-[9.5px] tracking-[0.18em] text-[#6B7280] font-semibold">TIME</span>
            <span className="text-[12.5px] text-[#E5E7EB] font-semibold font-mono">{departureTime} → {arrivalTime}</span>
          </div>
          <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-[#1F2937]/85 text-xs">
            <span className="text-[9.5px] tracking-[0.18em] text-[#6B7280] font-semibold">FLIGHT</span>
            <span className="text-[12px] text-[#E5E7EB] font-semibold">{airline} ({flightNumber})</span>
          </div>
          <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-[#1F2937]/85 text-xs">
            <span className="text-[9.5px] tracking-[0.18em] text-[#6B7280] font-semibold">PNR / CONF CODE</span>
            <span className="text-xs text-[#E5E7EB] font-mono font-semibold">{effectiveRef}</span>
          </div>
          <div className="flex justify-between items-baseline py-1.5 text-xs">
            <span className="text-[9.5px] tracking-[0.18em] text-[#6B7280] font-semibold">CLASS</span>
            <span className="text-[12.5px] text-[#E5E7EB] font-semibold">{cabinClass} · Non-stop</span>
          </div>
        </div>

        {/* Right Col: Charges & Settlement */}
        <div className="p-5 md:p-[20px_22px] flex flex-col justify-between">
          <div>
            <div className="text-[9.5px] font-bold tracking-[0.26em] text-[#6B7280] mb-4 flex items-center gap-2">
              CHARGES &amp; SETTLEMENT <span className="flex-1 h-px bg-[#1F2937]"></span>
            </div>
            <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-[#1F2937]/85 text-xs">
              <span className="text-[9.5px] tracking-[0.18em] text-[#6B7280] font-semibold">SUBTOTAL</span>
              <span className="text-xs text-[#E5E7EB] font-mono font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-[#1F2937]/85 text-xs">
              <span className="text-[9.5px] tracking-[0.18em] text-[#6B7280] font-semibold">AIRPORT FEES &amp; TAXES</span>
              <span className="text-xs text-[#E5E7EB] font-mono font-semibold">${taxes.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mt-3.5 pt-3.5 border-t border-[#1F2937]">
              <span className="text-[9.5px] tracking-[0.22em] text-[#6B7280] font-bold">TOTAL PAID</span>
              <span className="text-[17px] font-bold text-[#F9FAFB] font-mono">
                ${total.toFixed(2)} <span className="text-[10px] text-[#6B7280] font-semibold">USD</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold tracking-[0.14em] text-[#34D399] bg-[#10B981]/15 border border-[#10B981]/40 rounded-full px-2.5 py-1 mt-3 shadow-sm">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.3027 5.9053C19.6542 5.55397 20.2247 5.55388 20.5761 5.9053C20.9273 6.25675 20.9273 6.82734 20.5761 7.17874L9.65911 18.0948C9.30773 18.4461 8.73814 18.446 8.38665 18.0948L3.42376 13.1328C3.0726 12.7814 3.07263 12.2118 3.42376 11.8604C3.77524 11.509 4.34575 11.5089 4.6972 11.8604L9.02239 16.1856L19.3027 5.9053Z" />
              </svg>
              PAID
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4.5 pt-1">
        <button
          onClick={handleCalendarExport}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full border border-[#1F2937] bg-[#111827] hover:border-[#22D3EE]/50 hover:shadow-[0_0_22px_rgba(34,211,238,0.14)] text-[#E5E7EB] hover:text-white text-[12.5px] font-semibold transition-all cursor-pointer active:scale-98"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.0684 2.03418C12.5654 2.03421 12.9687 2.43755 12.9688 2.93457V11.0996H21.0654C21.5625 11.0996 21.9658 11.503 21.9658 12C21.9658 12.497 21.5625 12.9004 21.0654 12.9004H12.9688V21.0654C12.9687 21.5624 12.5654 21.9658 12.0684 21.9658C11.5713 21.9658 11.168 21.5625 11.168 21.0654V12.9004H2.93457C2.43751 12.9004 2.03418 12.4971 2.03418 12C2.03418 11.5029 2.43751 11.0996 2.93457 11.0996H11.168V2.93457C11.168 2.43753 11.5713 2.03418 12.0684 2.03418Z" />
          </svg>
          Add to Calendar
        </button>
        <button
          onClick={onDownloadPdf || handleDownloadICS}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full border border-[#1F2937] bg-[#111827] hover:border-[#A78BFA]/50 hover:shadow-[0_0_22px_rgba(167,139,250,0.14)] text-[#E5E7EB] hover:text-white text-[12.5px] font-semibold transition-all cursor-pointer active:scale-98"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2.90002C12.4971 2.90002 12.9 3.30297 12.9 3.80002V12.2939L15.8081 9.38585C16.1595 9.03438 16.7294 9.03438 17.0808 9.38585C17.4323 9.73732 17.4323 10.3072 17.0808 10.6586L12.6364 15.1031C12.4676 15.2719 12.2387 15.3667 12 15.3667C11.7613 15.3667 11.5324 15.2719 11.3636 15.1031L6.91917 10.6586C6.5677 10.3072 6.5677 9.73732 6.91917 9.38585C7.27064 9.03438 7.84049 9.03438 8.19196 9.38585L11.1 12.2939V3.80002C11.1 3.30297 11.503 2.90002 12 2.90002ZM4.00001 13.5874C4.49706 13.5874 4.90001 13.9903 4.90001 14.4874V18.043C4.90001 18.2758 4.99249 18.499 5.1571 18.6636C5.32172 18.8282 5.54498 18.9207 5.77778 18.9207H18.2222C18.455 18.9207 18.6783 18.8283 18.8429 18.6636C19.0075 18.499 19.1 18.2758 19.1 18.043V14.4874C19.1 13.9903 19.5029 13.5874 20 13.5874C20.4971 13.5874 20.9 13.9903 20.9 14.4874V18.043C20.9 18.7531 20.6179 19.4342 20.1157 19.9364C19.6135 20.4386 18.9324 20.7207 18.2222 20.7207H5.77778C5.06759 20.7207 4.38649 20.4386 3.88431 19.9364C3.38213 19.4342 3.10001 18.7531 3.10001 18.043V14.4874C3.10001 13.9903 3.50295 13.5874 4.00001 13.5874Z" />
          </svg>
          Download PDF Itinerary
        </button>
      </div>

      {/* Fineprint */}
      <p className="text-center text-[10.5px] text-[#4B5563] mt-5.5 leading-relaxed font-sans">
        This message is your official itinerary and executive-assistant handoff receipt.<br />
        Present PNR <b className="font-mono text-[#6B7280]">{effectiveRef}</b> at curbside, check-in, and arrival gate meet &amp; greet.
      </p>
    </div>
  );
};

export default CommercialRoadmapReceipt;

